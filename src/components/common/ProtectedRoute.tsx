import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { Shield } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-3 border-[#1B2A6B] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-500 font-medium">Chargement de votre session...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/connexion" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mb-4">
          <Shield className="w-8 h-8 text-rose-600" />
        </div>
        <h2 className="text-xl font-bold font-heading text-slate-900 mb-2">
          Accès Réservé
        </h2>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          Votre compte (rôle : <strong>{user.role}</strong>) n'a pas les autorisations nécessaires pour accéder à cet espace.
        </p>
        <button
          onClick={() => window.location.href = '/'}
          className="px-4 py-2 bg-[#1B2A6B] text-white text-xs font-semibold rounded-xl hover:bg-[#131E4D] transition-colors"
        >
          Retour à l'accueil
        </button>
      </div>
    );
  }

  return <>{children}</>;
};
