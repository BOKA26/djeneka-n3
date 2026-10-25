import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../../components/common/Button';
import { Logo } from '../../components/common/Logo';
import { Lock, Mail, User, Shield, Wrench, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, resetPassword } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotModal, setForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const redirectAfterLogin = (role: string) => {
    // Check if there was a pending redirect stored (e.g. from rental booking)
    const pendingRental = sessionStorage.getItem('pending_rental_redirect');
    if (pendingRental) {
      sessionStorage.removeItem('pending_rental_redirect');
      navigate(pendingRental);
      return;
    }

    if (role === 'client') {
      navigate('/espace-client');
    } else {
      navigate('/espace-admin');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Veuillez renseigner votre email et mot de passe.', 'error');
      return;
    }

    try {
      setLoading(true);
      const user = await login(email, password);
      redirectAfterLogin(user.role);
    } catch {
      // error handled in login method
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) return;
    try {
      await resetPassword(forgotEmail);
      setForgotModal(false);
    } catch {
      // toast shown in context
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/90 shadow-xl">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <Logo size="md" />
          </div>
          <h2 className="text-2xl font-bold font-heading text-slate-900">
            Connexion à votre Espace
          </h2>
          <p className="text-xs text-slate-500">
            Accédez à vos véhicules, factures, réservations et rendez-vous
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Adresse email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre-email@exemple.ci"
                className="w-full text-sm pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] bg-white"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Mot de passe
              </label>
              <button
                type="button"
                onClick={() => setForgotModal(true)}
                className="text-[11px] text-[#1B2A6B] hover:underline font-medium cursor-pointer"
              >
                Mot de passe oublié ?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-sm pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] bg-white font-mono"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="w-full uppercase font-bold text-xs tracking-wider"
          >
            Se Connecter
          </Button>
        </form>

        <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-500">
          Pas encore de compte ?{' '}
          <Link to="/inscription" className="text-[#D62828] font-bold hover:underline">
            Créer un compte client
          </Link>
        </div>
      </div>

      {/* Forgot Password modal */}
      {forgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <h3 className="font-heading font-bold text-lg text-slate-900">
              Réinitialisation Mot de passe
            </h3>
            <p className="text-xs text-slate-500">
              Entrez votre email pour recevoir les instructions de réinitialisation.
            </p>
            <form onSubmit={handleForgotSubmit} className="space-y-3">
              <input
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="votre.email@domaine.ci"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B]"
              />
              <div className="flex gap-2">
                <Button type="submit" variant="primary" size="sm" className="flex-1">
                  Envoyer
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setForgotModal(false)}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
