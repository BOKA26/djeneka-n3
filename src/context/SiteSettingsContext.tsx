import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SiteSettings } from '../types';
import { siteSettingsApi, DEFAULT_SITE_SETTINGS } from '../services/api';
import { useAuth } from './AuthContext';
import { Wrench, Phone, MessageCircle, Shield } from 'lucide-react';

interface SiteSettingsContextType {
  settings: SiteSettings;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<SiteSettings>) => Promise<void>;
  cleanPhone: (phone: string) => string;
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

// Helper to sanitize phone for WhatsApp/tel links (e.g., "+225 07 78 03 03 75" -> "2250778030375")
export function cleanPhoneNumber(phone?: string): string {
  if (!phone) return '';
  return phone.replace(/[^0-9]/g, '');
}

export const SiteSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Apply colors and SEO meta to document
  const applySettingsToDOM = useCallback((s: SiteSettings) => {
    if (typeof document === 'undefined') return;

    // 1. Dynamic CSS variables
    const root = document.documentElement;
    if (s.couleur_primaire) {
      root.style.setProperty('--primary', s.couleur_primaire);
    }
    if (s.couleur_accent) {
      root.style.setProperty('--accent', s.couleur_accent);
    }

    // 2. Dynamic Title
    if (s.seo_titre) {
      document.title = s.seo_titre;
    }

    // 3. Dynamic Meta Description
    if (s.seo_description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', s.seo_description);
    }

    // 4. Dynamic Favicon if provided
    if (s.favicon_url) {
      let linkIcon: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!linkIcon) {
        linkIcon = document.createElement('link');
        linkIcon.rel = 'icon';
        document.head.appendChild(linkIcon);
      }
      linkIcon.href = s.favicon_url;
    }
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      const data = await siteSettingsApi.get();
      setSettings(data);
      applySettingsToDOM(data);
    } catch (err) {
      console.warn('Erreur chargement paramètres site:', err);
    } finally {
      setLoading(false);
    }
  }, [applySettingsToDOM]);

  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  const updateSettings = async (newSettings: Partial<SiteSettings>) => {
    const updated = await siteSettingsApi.update(newSettings);
    setSettings(updated);
    applySettingsToDOM(updated);
  };

  // Maintenance mode guard: if active and user is not admin
  if (!loading && settings.mode_maintenance && !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="max-w-md w-full bg-slate-800/90 border border-slate-700/80 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-400/30 flex items-center justify-center mx-auto">
            <Wrench className="w-8 h-8 animate-bounce" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
              Maintenance en cours
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-white">
              {settings.nom_entreprise}
            </h1>
            <p className="text-xs text-slate-400">
              {settings.slogan}
            </p>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            Notre plateforme web fait actuellement l'objet d'une mise à jour technique programmée pour améliorer nos services. Nous serons de retour très rapidement.
          </p>

          <div className="pt-2 border-t border-slate-700/60 space-y-3 text-xs">
            <p className="text-slate-400 font-medium">Pour toute urgence mécanique ou dépannage :</p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <a
                href={`tel:${settings.telephone_principal}`}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#D62828] hover:bg-[#B71C1C] text-white font-bold transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>{settings.telephone_principal}</span>
              </a>
              <a
                href={`https://wa.me/${cleanPhoneNumber(settings.telephone_whatsapp)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>

          <div className="text-[11px] text-slate-500">
            <a href="/connexion" className="text-slate-400 hover:text-white underline">
              Accès administration
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SiteSettingsContext.Provider
      value={{
        settings,
        loading,
        refreshSettings,
        updateSettings,
        cleanPhone: cleanPhoneNumber,
      }}
    >
      {children}
    </SiteSettingsContext.Provider>
  );
};

export function useSiteSettings(): SiteSettingsContextType {
  const context = useContext(SiteSettingsContext);
  if (!context) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
  }
  return context;
}
