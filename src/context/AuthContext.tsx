import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authApi } from '../services/api';
import { supabase } from '../lib/supabase';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<User>;
  register: (name: string, email: string, phone: string, pass: string) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (updated: Partial<User>) => Promise<User>;
  resetPassword: (email: string) => Promise<void>;
  quickSwitchAccount?: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { showToast } = useToast();

  // Synchronise l'état utilisateur avec la session Supabase
  const refreshUser = async () => {
    try {
      const u = await authApi.getCurrentUser();
      setUser(u);
    } catch (err) {
      console.warn('Erreur rafraîchissement utilisateur:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Initial check
    refreshUser();

    // 2. Écoute en temps réel des changements d'authentification Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        // Asynchronously load the profile from database
        authApi.getCurrentUser().then((u) => {
          setUser(u);
          setLoading(false);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, pass: string): Promise<User> => {
    try {
      setLoading(true);
      const u = await authApi.login(email, pass);
      setUser(u);
      showToast(`Bienvenue, ${u.name} !`, 'success');
      return u;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Échec de la connexion';
      showToast(msg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (
    name: string,
    email: string,
    phone: string,
    pass: string
  ): Promise<User> => {
    try {
      setLoading(true);
      const u = await authApi.register(name, email, phone, pass);
      setUser(u);
      showToast('Votre compte client a été créé avec succès !', 'success');
      return u;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur inscription';
      showToast(msg, 'error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authApi.logout();
      setUser(null);
      showToast('Vous êtes déconnecté', 'info');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur déconnexion';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updated: Partial<User>): Promise<User> => {
    try {
      const u = await authApi.updateProfile(updated);
      setUser(u);
      showToast('Profil mis à jour avec succès', 'success');
      return u;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur mise à jour';
      showToast(msg, 'error');
      throw err;
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    try {
      await authApi.resetPassword(email);
      showToast(`Un email de réinitialisation a été envoyé à ${email}.`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur réinitialisation';
      showToast(msg, 'error');
      throw err;
    }
  };

  // Backwards compatible stub (no-op with clear message)
  const quickSwitchAccount = async (role: UserRole) => {
    showToast(`Comptes de démo désactivés. Veuillez vous connecter avec votre compte Supabase réel (${role}).`, 'info');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateProfile,
        resetPassword,
        quickSwitchAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
