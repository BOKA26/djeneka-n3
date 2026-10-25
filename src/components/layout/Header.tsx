import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Logo } from '../common/Logo';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';
import { SupabaseModal } from '../common/SupabaseModal';
import {
  Phone,
  AlertTriangle,
  User as UserIcon,
  Menu,
  X,
  LogOut,
  ChevronDown,
  LayoutDashboard,
  Shield,
  Database,
} from 'lucide-react';

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [supabaseModalOpen, setSupabaseModalOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navLinks = [
    { name: 'Accueil', path: '/' },
    { name: 'Services', path: '/services' },
    { name: 'Pièces', path: '/pieces' },
    { name: 'Location', path: '/location' },
    { name: 'Galerie', path: '/galerie' },
    { name: 'Blog', path: '/blog' },
    { name: 'Contact', path: '/contact' },
  ];

  const handleLogout = async () => {
    await logout();
    setUserDropdownOpen(false);
    navigate('/');
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
        {/* Top micro-bar for quick contact & Supabase status */}
        <div className="bg-[#1B2A6B] text-white text-xs py-1.5 px-4 hidden md:block">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-1.5 text-blue-200">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Garage Ouvert : Lun - Sam 7h30 - 18h30
              </span>
              <span className="text-blue-100">
                📍 Bingerville, Adjin Palmeraie (Côte d'Ivoire)
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* Supabase status badge button */}
              <button
                onClick={() => setSupabaseModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 text-[11px] font-medium transition-colors cursor-pointer"
                title="Gérer la connexion Supabase et les tables"
              >
                <Database className="w-3 h-3 text-emerald-400" />
                <span>Base Supabase</span>
              </button>

              <a
                href="tel:+2250778030375"
                className="flex items-center gap-1.5 text-blue-100 hover:text-white font-medium transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                +225 07 78 03 03 75
              </a>
            </div>
          </div>
        </div>

        {/* Main navigation header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Logo size="md" />

          {/* Desktop Menu */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `text-sm font-medium transition-colors duration-150 py-1 border-b-2 ${
                    isActive
                      ? 'text-[#1B2A6B] border-[#1B2A6B] font-semibold'
                      : 'text-slate-600 border-transparent hover:text-[#1B2A6B]'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </nav>

          {/* Actions (Urgent tow button & Account) */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Urgent Breakdown Button (Red) */}
            <Link to="/depannage">
              <Button
                variant="danger"
                size="sm"
                icon={<AlertTriangle className="w-4 h-4" />}
                className="uppercase tracking-wide font-bold"
              >
                Dépannage urgent
              </Button>
            </Link>

            {/* Account button / dropdown */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-slate-800 text-xs font-semibold cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#1B2A6B] text-white flex items-center justify-center font-bold">
                    {user.name.charAt(0)}
                  </div>
                  <div className="text-left hidden md:block">
                    <span className="block truncate max-w-[100px] leading-tight">{user.name}</span>
                    <span className="text-[10px] text-slate-500 font-normal capitalize">{user.role}</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-800">{user.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                    </div>

                    {user.role === 'client' && (
                      <Link
                        to="/espace-client"
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                      >
                        <LayoutDashboard className="w-4 h-4 text-[#1B2A6B]" />
                        Mon Espace Client
                      </Link>
                    )}

                    {(user.role === 'admin' || user.role === 'mecanicien') && (
                      <Link
                        to="/espace-admin"
                        className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 font-medium"
                      >
                        <Shield className="w-4 h-4 text-[#D62828]" />
                        Espace {user.role === 'admin' ? 'Administrateur' : 'Mécanicien'}
                      </Link>
                    )}

                    <button
                      onClick={() => setSupabaseModalOpen(true)}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-emerald-700 hover:bg-emerald-50 text-left font-medium cursor-pointer"
                    >
                      <Database className="w-4 h-4 text-emerald-600" />
                      Base Supabase
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 text-left font-medium cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Se déconnecter
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/connexion">
                <Button
                  variant="outline"
                  size="sm"
                  icon={<UserIcon className="w-4 h-4 text-slate-600" />}
                >
                  Mon compte
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile menu hamburger toggle */}
          <div className="flex sm:hidden items-center gap-2">
            <Link to="/depannage">
              <button className="bg-[#D62828] text-white p-2 rounded-xl shadow-xs" aria-label="Dépannage">
                <AlertTriangle className="w-5 h-5" />
              </button>
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl text-slate-700 hover:bg-slate-100 focus:outline-none"
              aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white border-b border-slate-200 px-5 pt-3 pb-6 shadow-xl animate-in slide-in-from-top duration-200">
            <div className="flex flex-col gap-2 pb-4 border-b border-slate-100">
              {navLinks.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `text-base font-medium px-3 py-2.5 rounded-xl transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-[#1B2A6B] font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`
                  }
                >
                  {link.name}
                </NavLink>
              ))}
            </div>

            <div className="pt-4 flex flex-col gap-2.5">
              {/* Supabase Button on mobile */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setSupabaseModalOpen(true);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-xs transition-colors"
              >
                <Database className="w-4 h-4 text-emerald-600" />
                <span>Base de données Supabase</span>
              </button>

              {user ? (
                <>
                  <Link
                    to={user.role === 'client' ? '/espace-client' : '/espace-admin'}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button variant="primary" className="w-full justify-start gap-2">
                      <LayoutDashboard className="w-4 h-4" />
                      Accéder à mon espace ({user.name})
                    </Button>
                  </Link>
                  <Button variant="outline" onClick={handleLogout} className="w-full">
                    Déconnexion
                  </Button>
                </>
              ) : (
                <Link to="/connexion" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Connexion / Mon compte
                  </Button>
                </Link>
              )}

              {/* Quick switcher helper on mobile */}
            </div>
          </div>
        )}
      </header>

      {/* Supabase Connection Modal */}
      <SupabaseModal isOpen={supabaseModalOpen} onClose={() => setSupabaseModalOpen(false)} />
    </>
  );
};
