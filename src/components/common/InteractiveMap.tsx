import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  Compass,
  Copy,
  Check,
  ExternalLink,
  Layers,
  Phone,
} from 'lucide-react';
import { Button } from './Button';
import { useToast } from '../../context/ToastContext';
import { useSiteSettings } from '../../context/SiteSettingsContext';

interface InteractiveMapProps {
  className?: string;
  height?: string;
  showDetails?: boolean;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  className = '',
  height = 'h-96',
  showDetails = true,
}) => {
  const { showToast } = useToast();
  const { settings } = useSiteSettings();
  const [mapSource, setMapSource] = useState<'google' | 'osm'>('google');
  const [copied, setCopied] = useState(false);

  // Exact coordinates from dynamic company settings
  const latitude = settings.latitude || 5.358249;
  const longitude = settings.longitude || -3.896616;
  const companyName = settings.nom_entreprise || 'Officina Djeneka - Garage Moderne';

  // Universal Google Maps embed URL (works on any domain, Vercel, localhost, no API key needed)
  const googleEmbedUrl = `https://maps.google.com/maps?q=${latitude},${longitude}+(${encodeURIComponent(companyName)})&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  // OpenStreetMap embed URL (guaranteed 100% uptime, zero tracking/blocking, no third-party cookies)
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.015}%2C${latitude - 0.01}%2C${longitude + 0.015}%2C${latitude + 0.01}&layer=mapnik&marker=${latitude}%2C${longitude}`;

  const handleCopyCoords = () => {
    const coordsText = `${latitude}, ${longitude}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(coordsText);
      setCopied(true);
      showToast('Coordonnées GPS copiées dans le presse-papier !', 'success');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className={`bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden flex flex-col ${className}`}>
      {/* Top Bar with map source switcher & status */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#1B2A6B] text-white flex items-center justify-center shrink-0 shadow-xs">
            <MapPin className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm sm:text-base text-slate-900 leading-tight">
              Officina Djeneka - Garage Moderne
            </h3>
            <p className="text-xs text-slate-500">
              Bingerville, Adjin Palmeraie (Côte d'Ivoire)
            </p>
          </div>
        </div>

        {/* Source Switcher (Google / OpenStreetMap) */}
        <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setMapSource('google')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              mapSource === 'google'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Google Maps
          </button>
          <button
            type="button"
            onClick={() => setMapSource('osm')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
              mapSource === 'osm'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            OpenStreetMap
          </button>
        </div>
      </div>

      {/* Map View Frame */}
      <div className={`relative w-full ${height} bg-slate-100`}>
        <iframe
          key={mapSource}
          title="Localisation Officina Djeneka Bingerville"
          src={mapSource === 'google' ? googleEmbedUrl : osmEmbedUrl}
          className="w-full h-full border-0"
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />

        {/* Floating source indicator badge */}
        <div className="absolute top-3 left-3 pointer-events-none">
          <span className="inline-flex items-center gap-1 bg-white/90 backdrop-blur-xs text-slate-700 text-[11px] font-semibold px-2.5 py-1 rounded-lg shadow-sm border border-slate-200">
            <Layers className="w-3.5 h-3.5 text-[#1B2A6B]" />
            {mapSource === 'google' ? 'Vue Google Maps' : 'Vue OpenStreetMap'}
          </span>
        </div>
      </div>

      {/* Action and details bar */}
      {showDetails && (
        <div className="p-4 sm:p-5 bg-white space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="font-mono bg-slate-100 text-slate-700 px-2 py-1 rounded-md border border-slate-200">
                GPS : {latitude.toFixed(4)}° N, {Math.abs(longitude).toFixed(4)}° O
              </span>
              <button
                type="button"
                onClick={handleCopyCoords}
                className="inline-flex items-center gap-1 text-[#1B2A6B] hover:text-[#D62828] font-medium p-1 cursor-pointer transition-colors"
                title="Copier les coordonnées GPS"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copié !' : 'Copier'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{settings.horaires?.['lundi'] ? `Atelier ouvert : ${settings.horaires['lundi']} (Lun - Sam)` : 'Atelier ouvert 07h30 - 18h30 (Lun - Sam)'}</span>
            </div>
          </div>

          {/* Quick-action GPS links */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full"
            >
              <Button
                variant="primary"
                size="sm"
                icon={<Navigation className="w-4 h-4" />}
                className="w-full justify-center text-xs"
              >
                Itinéraire Google Maps
              </Button>
            </a>

            <a
              href={`https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full"
            >
              <Button
                variant="outline"
                size="sm"
                icon={<Compass className="w-4 h-4 text-blue-600" />}
                className="w-full justify-center text-xs hover:border-blue-400"
              >
                Ouvrir sur Waze
              </Button>
            </a>

            <a href={`tel:${settings.telephone_principal.replace(/[\s\-\(\)]/g, '')}`} className="w-full">
              <Button
                variant="outline"
                size="sm"
                icon={<Phone className="w-4 h-4 text-[#D62828]" />}
                className="w-full justify-center text-xs hover:border-red-400"
              >
                Guidage par téléphone
              </Button>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
