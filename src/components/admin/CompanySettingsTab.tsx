import React, { useState } from 'react';
import {
  Building2,
  Phone,
  Clock,
  Share2,
  Palette,
  Search,
  Sliders,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { SiteSettings } from '../../types';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { useToast } from '../../context/ToastContext';
import { Button } from '../common/Button';

export const CompanySettingsTab: React.FC = () => {
  const { settings, updateSettings, loading } = useSiteSettings();
  const { showToast } = useToast();

  const [activeSubTab, setActiveSubTab] = useState<
    'identity' | 'contact' | 'hours' | 'social' | 'appearance' | 'seo' | 'advanced'
  >('identity');

  const [formData, setFormData] = useState<SiteSettings>({ ...settings });
  const [saving, setSaving] = useState(false);

  // Sync form when settings load
  React.useEffect(() => {
    setFormData({ ...settings });
  }, [settings]);

  const handleChange = (field: keyof SiteSettings, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleHourChange = (day: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      horaires: {
        ...(prev.horaires || {}),
        [day]: value,
      },
    }));
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      await updateSettings(formData);
      showToast('Informations de l\'entreprise enregistrées avec succès !', 'success');
    } catch (err: any) {
      showToast(err.message || 'Erreur lors de l\'enregistrement', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFormData({ ...settings });
    showToast('Modifications non enregistrées annulées.', 'info');
  };

  const subTabs = [
    { id: 'identity', label: '1. Identité', icon: Building2 },
    { id: 'contact', label: '2. Contact & GPS', icon: Phone },
    { id: 'hours', label: '3. Horaires', icon: Clock },
    { id: 'social', label: '4. Réseaux', icon: Share2 },
    { id: 'appearance', label: '5. Apparence', icon: Palette },
    { id: 'seo', label: '6. SEO', icon: Search },
    { id: 'advanced', label: '7. Avancé', icon: Sliders },
  ] as const;

  const daysList = [
    { key: 'lundi', label: 'Lundi' },
    { key: 'mardi', label: 'Mardi' },
    { key: 'mercredi', label: 'Mercredi' },
    { key: 'jeudi', label: 'Jeudi' },
    { key: 'vendredi', label: 'Vendredi' },
    { key: 'samedi', label: 'Samedi' },
    { key: 'dimanche', label: 'Dimanche' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1B2A6B] flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#D62828]" />
            Paramètres et Identité de l'Entreprise
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Modifiez ici le nom du garage, contacts, horaires, couleurs, coordonnées GPS et métadonnées du site.
          </p>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={<RotateCcw className="w-4 h-4" />}
            onClick={handleReset}
            disabled={saving}
          >
            Annuler
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            icon={<Save className="w-4 h-4" />}
            onClick={() => handleSave()}
            loading={saving}
          >
            Enregistrer les modifications
          </Button>
        </div>
      </div>

      {/* Sub tabs navigation */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 pb-2">
        {subTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[#1B2A6B] text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-red-400' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        {/* 1. IDENTITÉ */}
        {activeSubTab === 'identity' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              Identité de l'établissement
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Nom de l'entreprise *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nom_entreprise || ''}
                  onChange={(e) => handleChange('nom_entreprise', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] text-sm"
                  placeholder="Ex: Officina Djeneka (Garage Moderne)"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Slogan *
                </label>
                <input
                  type="text"
                  required
                  value={formData.slogan || ''}
                  onChange={(e) => handleChange('slogan', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] text-sm"
                  placeholder="Ex: Performance & Fiabilité"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Description courte (affichée en pied de page)
                </label>
                <input
                  type="text"
                  value={formData.description_courte || ''}
                  onChange={(e) => handleChange('description_courte', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] text-sm"
                  placeholder="Ex: Garage automobile moderne à Bingerville. Mécanique, diagnostic et location."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  À propos / Présentation longue
                </label>
                <textarea
                  rows={5}
                  value={formData.a_propos || ''}
                  onChange={(e) => handleChange('a_propos', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] text-sm"
                  placeholder="Présentez l'histoire de l'atelier, la formation européenne des techniciens, les équipements de pointe..."
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. CONTACT & GPS */}
        {activeSubTab === 'contact' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              Coordonnées, Téléphones & Localisation GPS
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Téléphone Principal (Appel / Dépannage) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.telephone_principal || ''}
                  onChange={(e) => handleChange('telephone_principal', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] text-sm font-mono"
                  placeholder="+225 07 78 03 03 75"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Numéro WhatsApp (avec indicatif pays) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.telephone_whatsapp || ''}
                  onChange={(e) => handleChange('telephone_whatsapp', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] text-sm font-mono"
                  placeholder="+39 349 080 2320"
                />
                <p className="text-xs text-slate-400 mt-1">Utilisé pour les boutons WhatsApp directs.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Email de contact *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email || ''}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] text-sm"
                  placeholder="contact@officina-djeneka.ci"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Ville / Pays
                </label>
                <input
                  type="text"
                  value={formData.ville || ''}
                  onChange={(e) => handleChange('ville', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] text-sm"
                  placeholder="Bingerville, Côte d'Ivoire"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Adresse complète
                </label>
                <input
                  type="text"
                  value={formData.adresse || ''}
                  onChange={(e) => handleChange('adresse', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] text-sm"
                  placeholder="Bingerville - Adjin Palmeraie, Côte d'Ivoire"
                />
              </div>

              {/* GPS Coordinates */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Latitude GPS
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.latitude ?? 5.358249}
                  onChange={(e) => handleChange('latitude', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] text-sm font-mono"
                  placeholder="5.358249"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Longitude GPS
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.longitude ?? -3.896616}
                  onChange={(e) => handleChange('longitude', parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] text-sm font-mono"
                  placeholder="-3.896616"
                />
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#D62828]" />
                Position actuelle : {formData.latitude}° N, {formData.longitude}° O
              </span>
              <a
                href={`https://maps.google.com/maps?q=${formData.latitude},${formData.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1B2A6B] hover:underline inline-flex items-center gap-1 font-semibold"
              >
                Vérifier sur Google Maps <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* 3. HORAIRES */}
        {activeSubTab === 'hours' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              Horaires d'ouverture de l'atelier
            </h3>
            <p className="text-sm text-slate-500">
              Indiquez les créneaux pour chaque jour ou notez « Fermé ». Ces horaires apparaissent dans le bandeau supérieur, la carte et le pied de page.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {daysList.map(({ key, label }) => (
                <div key={key} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {label}
                  </label>
                  <input
                    type="text"
                    value={formData.horaires?.[key] || ''}
                    onChange={(e) => handleHourChange(key, e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] text-sm bg-white"
                    placeholder="Ex: 07h30 - 18h30 ou Fermé"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. RÉSEAUX SOCIAUX */}
        {activeSubTab === 'social' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              Réseaux Sociaux
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Lien Page Facebook
                </label>
                <input
                  type="url"
                  value={formData.facebook_url || ''}
                  onChange={(e) => handleChange('facebook_url', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] text-sm"
                  placeholder="https://facebook.com/officina.djeneka"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Lien Profil Instagram
                </label>
                <input
                  type="url"
                  value={formData.instagram_url || ''}
                  onChange={(e) => handleChange('instagram_url', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] text-sm"
                  placeholder="https://instagram.com/officinadjeneka"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Lien Profil TikTok
                </label>
                <input
                  type="url"
                  value={formData.tiktok_url || ''}
                  onChange={(e) => handleChange('tiktok_url', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] text-sm"
                  placeholder="https://tiktok.com/@officinadjeneka"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Lien Chaîne YouTube
                </label>
                <input
                  type="url"
                  value={formData.youtube_url || ''}
                  onChange={(e) => handleChange('youtube_url', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] text-sm"
                  placeholder="https://youtube.com/@officinadjeneka"
                />
              </div>
            </div>
          </div>
        )}

        {/* 5. APPARENCE & BANDEAU */}
        {activeSubTab === 'appearance' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              Couleurs, Logo & Annonce
            </h3>

            {/* Colors picker */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Couleur Primaire (Boutons, titres, en-tête)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.couleur_primaire || '#1B2A6B'}
                    onChange={(e) => handleChange('couleur_primaire', e.target.value)}
                    className="w-12 h-10 rounded-lg cursor-pointer border border-slate-300"
                  />
                  <input
                    type="text"
                    value={formData.couleur_primaire || '#1B2A6B'}
                    onChange={(e) => handleChange('couleur_primaire', e.target.value)}
                    className="w-32 px-3 py-2 rounded-lg border border-slate-200 uppercase font-mono text-sm"
                  />
                  <span
                    className="text-xs px-2.5 py-1 rounded text-white font-medium"
                    style={{ backgroundColor: formData.couleur_primaire || '#1B2A6B' }}
                  >
                    Aperçu Primaire
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Couleur Accent (Badges urgents, prix, CTA)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.couleur_accent || '#D62828'}
                    onChange={(e) => handleChange('couleur_accent', e.target.value)}
                    className="w-12 h-10 rounded-lg cursor-pointer border border-slate-300"
                  />
                  <input
                    type="text"
                    value={formData.couleur_accent || '#D62828'}
                    onChange={(e) => handleChange('couleur_accent', e.target.value)}
                    className="w-32 px-3 py-2 rounded-lg border border-slate-200 uppercase font-mono text-sm"
                  />
                  <span
                    className="text-xs px-2.5 py-1 rounded text-white font-medium"
                    style={{ backgroundColor: formData.couleur_accent || '#D62828' }}
                  >
                    Aperçu Accent
                  </span>
                </div>
              </div>
            </div>

            {/* Media URLs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  URL du Logo personnalisé (optionnel)
                </label>
                <input
                  type="url"
                  value={formData.logo_url || ''}
                  onChange={(e) => handleChange('logo_url', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] text-sm"
                  placeholder="https://.../logo.png (vide = logo par défaut)"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  URL de l'image de couverture d'accueil (Hero)
                </label>
                <input
                  type="url"
                  value={formData.image_heros_url || ''}
                  onChange={(e) => handleChange('image_heros_url', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] text-sm"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
            </div>

            {/* Announcement Banner */}
            <div className="p-4 rounded-xl border border-slate-200 bg-amber-50/50 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Bandeau d'annonce en haut du site</h4>
                  <p className="text-xs text-slate-500">Affiche une barre de notification tout en haut du site.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.bandeau_actif || false}
                    onChange={(e) => handleChange('bandeau_actif', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1B2A6B]"></div>
                </label>
              </div>

              {formData.bandeau_actif && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Texte du message
                  </label>
                  <input
                    type="text"
                    value={formData.message_bandeau || ''}
                    onChange={(e) => handleChange('message_bandeau', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] text-sm bg-white"
                    placeholder="Ex: Promotion Vidange 100% Synthétique avec filtre offert ce mois-ci !"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* 6. SEO */}
        {activeSubTab === 'seo' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              Référencement Naturel & Métadonnées SEO
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Titre par défaut de la page (Balise &lt;title&gt;)
                </label>
                <input
                  type="text"
                  value={formData.seo_titre || ''}
                  onChange={(e) => handleChange('seo_titre', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] text-sm"
                  placeholder="Officina Djeneka (Garage Moderne) | Performance & Fiabilité - Bingerville"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Description SEO (Meta description)
                </label>
                <textarea
                  rows={3}
                  value={formData.seo_description || ''}
                  onChange={(e) => handleChange('seo_description', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] text-sm"
                  placeholder="Garage automobile moderne à Bingerville, Adjin Palmeraie. Mécanique générale, diagnostic, tôlerie peinture, pièces et dépannage."
                />
              </div>
            </div>
          </div>
        )}

        {/* 7. AVANCÉ & MAINTENANCE */}
        {activeSubTab === 'advanced' && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
              Paramètres Avancés & Mode Maintenance
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Devise monétaire
                </label>
                <input
                  type="text"
                  value={formData.devise || 'FCFA'}
                  onChange={(e) => handleChange('devise', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] text-sm"
                  placeholder="FCFA"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Prix forfait Vidange Rapide (en {formData.devise || 'FCFA'})
                </label>
                <input
                  type="number"
                  value={formData.prix_vidange_rapide ?? 25000}
                  onChange={(e) => handleChange('prix_vidange_rapide', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] text-sm"
                  placeholder="25000"
                />
              </div>
            </div>

            {/* Maintenance Mode Warning Card */}
            <div className={`p-5 rounded-2xl border transition-colors ${
              formData.mode_maintenance
                ? 'bg-red-50/80 border-red-300'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    formData.mode_maintenance ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      Mode Maintenance du Site Web
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 max-w-xl">
                      Lorsqu'il est activé, les visiteurs voient un écran de maintenance avec les numéros d'urgence de l'atelier.
                      <strong className="text-slate-900 ml-1">
                        Les administrateurs connectés peuvent toujours naviguer et modifier le site sans restriction.
                      </strong>
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={formData.mode_maintenance || false}
                    onChange={(e) => handleChange('mode_maintenance', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Save Action */}
        <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Dernière mise à jour : {settings.updated_at ? new Date(settings.updated_at).toLocaleString('fr-FR') : 'Défaut'}
          </p>

          <Button
            type="submit"
            variant="primary"
            icon={<Save className="w-4 h-4" />}
            loading={saving}
          >
            Enregistrer les modifications
          </Button>
        </div>
      </form>
    </div>
  );
};
