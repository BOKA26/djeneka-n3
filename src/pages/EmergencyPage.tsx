import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Phone,
  MapPin,
  Compass,
  CheckCircle2,
  Clock,
  Car,
  ShieldAlert,
  Loader2,
  Navigation,
  Check,
  ExternalLink,
  MessageCircle,
  HelpCircle,
  Map,
  Smartphone,
  X,
  Crosshair,
  Share2,
  RotateCcw,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { emergencyApi } from '../services/api';
import { BreakdownType, EmergencyRequest, EmergencyStatus } from '../types';
import { validateIvorianPhone } from '../utils/format';
import { useToast } from '../context/ToastContext';
import { useSiteSettings } from '../context/SiteSettingsContext';

// Preset landmarks with verified GPS coordinates in Bingerville and Grand Abidjan
const ABIDJAN_LANDMARKS = [
  { name: 'Bingerville - Carrefour CIE / Centre', lat: 5.3582, lng: -3.8912, zone: 'Bingerville Centre' },
  { name: 'Bingerville - Adjin Palmeraie (Garage Officina)', lat: 5.3721, lng: -3.8645, zone: 'Atelier Officina' },
  { name: 'Bingerville - Faya / Nouveau Goudron', lat: 5.3654, lng: -3.9120, zone: 'Bingerville' },
  { name: 'Bingerville - Carrefour Feh Kessé', lat: 5.3620, lng: -3.9010, zone: 'Bingerville' },
  { name: 'Riviera Palmeraie - Rond-Point', lat: 5.3610, lng: -3.9480, zone: 'Cocody' },
  { name: 'Boulevard Mitterrand - Carrefour Duncan', lat: 5.3520, lng: -3.9350, zone: 'Cocody' },
  { name: 'Riviera 2 - Carrefour La Vie', lat: 5.3470, lng: -3.9850, zone: 'Cocody' },
  { name: 'Angré - 8ème Tranche / Château', lat: 5.3780, lng: -3.9780, zone: 'Cocody' },
  { name: 'Yopougon - Siporex / Lubafrique', lat: 5.3340, lng: -4.0810, zone: 'Yopougon' },
  { name: 'Pont Henri Konan Bédié (HKB)', lat: 5.3210, lng: -4.0150, zone: 'Lagunaire' },
];

export const EmergencyPage: React.FC = () => {
  const { showToast } = useToast();
  const { settings, cleanPhone } = useSiteSettings();

  // Form states
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [locationName, setLocationName] = useState('');
  const [vehicleDetails, setVehicleDetails] = useState('');
  const [breakdownType, setBreakdownType] = useState<BreakdownType>('batterie');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | undefined>();
  const [geolocating, setGeolocating] = useState(false);
  const [geolocSuccess, setGeolocSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Mobile GPS helpers state
  const [gpsDenied, setGpsDenied] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpTab, setHelpTab] = useState<'iphone' | 'android'>('iphone');
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [manualLinkInput, setManualLinkInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  // Active tracking state
  const [activeRequest, setActiveRequest] = useState<EmergencyRequest | null>(null);

  // Parse raw coordinates or Google Maps link
  const parseCoordinatesOrMapsUrl = (input: string): { lat: number; lng: number } | null => {
    if (!input) return null;
    const trimmed = input.trim();

    // 1. Raw numbers like "5.3582, -3.8912" or "5.3582 -3.8912"
    const rawMatch = trimmed.match(/^(-?\d{1,2}\.\d+)[,\s;]+(-?\d{1,3}\.\d+)$/);
    if (rawMatch) {
      const lat = parseFloat(rawMatch[1]);
      const lng = parseFloat(rawMatch[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng };
      }
    }

    // 2. Google Maps URL with ?q=lat,lng or /@lat,lng or !3dlat!4dlng
    const qMatch = trimmed.match(/[?&]q=(-?\d{1,2}\.\d+)[,\s]+(-?\d{1,3}\.\d+)/i);
    if (qMatch) {
      return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
    }

    const atMatch = trimmed.match(/@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/);
    if (atMatch) {
      return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
    }

    const placeMatch = trimmed.match(/!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/);
    if (placeMatch) {
      return { lat: parseFloat(placeMatch[1]), lng: parseFloat(placeMatch[2]) };
    }

    return null;
  };

  const handleApplyManualCoordinates = () => {
    const parsed = parseCoordinatesOrMapsUrl(manualLinkInput);
    if (parsed) {
      setCoordinates(parsed);
      setGeolocSuccess(true);
      setGpsDenied(false);
      if (!locationName || locationName.startsWith('Position GPS')) {
        setLocationName(`Position GPS (${parsed.lat.toFixed(5)}, ${parsed.lng.toFixed(5)})`);
      }
      showToast(`Coordonnées GPS verrouillées : ${parsed.lat.toFixed(5)}, ${parsed.lng.toFixed(5)}`, 'success');
      setShowManualInput(false);
    } else {
      showToast('Format non reconnu. Collez un lien Maps ou entrez deux nombres (ex: 5.3582, -3.8912).', 'error');
    }
  };

  // Preset Landmark quick tap
  const handleSelectLandmark = (item: typeof ABIDJAN_LANDMARKS[0]) => {
    setCoordinates({ lat: item.lat, lng: item.lng });
    setLocationName(item.name);
    setGeolocSuccess(true);
    setGpsDenied(false);
    showToast(`Repère sélectionné : ${item.name}`, 'success');
  };

  // Direct WhatsApp Live Location Share
  const handleShareViaWhatsApp = () => {
    const rawNum = settings.telephone_whatsapp || '+225 07 78 03 03 75';
    const phone = cleanPhone(rawNum);
    const gpsSuffix = coordinates ? `\n📍 Coordonnées GPS captées : https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}` : '';
    const locSuffix = locationName ? `\n📍 Repère / Quartier : ${locationName}` : '';
    const vehicleSuffix = vehicleDetails ? `\n🚗 Véhicule : ${vehicleDetails}` : '';
    const breakdownLabel = {
      batterie: 'Batterie à plat',
      pneu: 'Pneu / Crevaison',
      moteur: 'Panne Moteur',
      accident: 'Accrochage',
      autre: 'Autre panne',
    }[breakdownType];

    const message = `🚨 URGENCE DÉPANNAGE - Officina Djeneka :\nBonjour, je suis en panne (${breakdownLabel})${vehicleSuffix}.${locSuffix}${gpsSuffix}\n\n👉 Je vous partage ma localisation ci-dessous (via le trombone 📎 ou bouton + de WhatsApp) :`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Robust Mobile Geolocation with 25s timeout & 5-minute cached fallback
  const handleRequestGeolocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsDenied(true);
      showToast('La géolocalisation n’est pas disponible sur votre navigateur. Utilisez WhatsApp ou les repères ci-dessous.', 'warning');
      return;
    }

    setGeolocating(true);
    setGpsDenied(false);

    let resolved = false;

    // Safety timeout at 26 seconds to prevent infinite spinning on mobile
    const timeoutTimer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        setGeolocating(false);
        setGpsDenied(true);
        showToast('Délai dépassé pour le signal GPS. Utilisez WhatsApp ou sélectionnez votre carrefour ci-dessous.', 'info');
      }
    }, 26000);

    const onLocationSuccess = async (position: GeolocationPosition) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeoutTimer);

      const { latitude, longitude, accuracy } = position.coords;
      setCoordinates({ lat: latitude, lng: longitude });
      setGeolocSuccess(true);
      setGeolocating(false);
      setGpsDenied(false);

      // Attempt reverse geocoding via OpenStreetMap with a 3.5s timeout
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`,
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          const road = data.address?.road || data.address?.suburb || data.address?.neighbourhood || '';
          const city = data.address?.city || data.address?.town || data.address?.municipality || 'Bingerville';
          const formatted = road ? `${road}, ${city}` : (data.display_name ? data.display_name.split(',').slice(0, 3).join(',') : '');
          if (formatted) {
            setLocationName(formatted);
            showToast(`Position captée : ${formatted}`, 'success');
            return;
          }
        }
      } catch {
        // Fallback silently if reverse-geocoding fails
      }

      if (!locationName || locationName.startsWith('Position GPS')) {
        setLocationName(`Position GPS (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`);
      }
      showToast(`Position GPS captée avec succès (précision ~${Math.round(accuracy)}m) !`, 'success');
    };

    const handleFinalError = (error: GeolocationPositionError) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeoutTimer);
      setGeolocating(false);
      setGeolocSuccess(false);

      if (error.code === 1) { // PERMISSION_DENIED
        setGpsDenied(true);
        showToast(
          'Accès GPS bloqué sur ce mobile. Touchez "Partager via WhatsApp" ou choisissez un repère ci-dessous.',
          'warning'
        );
      } else if (error.code === 2) { // POSITION_UNAVAILABLE
        setGpsDenied(true);
        showToast(
          'Signal GPS indisponible. Vérifiez que la localisation de votre téléphone est activée.',
          'warning'
        );
      } else if (error.code === 3) { // TIMEOUT
        setGpsDenied(true);
        showToast(
          'Délai GPS dépassé. Vous pouvez choisir un repère ou envoyer votre position par WhatsApp.',
          'info'
        );
      } else {
        setGpsDenied(true);
        showToast('Impossible de capter la position. Utilisez les repères ou WhatsApp.', 'info');
      }
    };

    // First attempt: High accuracy with cached fallback (up to 5 min old)
    navigator.geolocation.getCurrentPosition(
      onLocationSuccess,
      (err) => {
        // If high accuracy times out or fails, retry with network-based geolocation
        if (err.code === 2 || err.code === 3) {
          navigator.geolocation.getCurrentPosition(
            onLocationSuccess,
            handleFinalError,
            { enableHighAccuracy: false, timeout: 20000, maximumAge: 300000 }
          );
        } else {
          handleFinalError(err);
        }
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 300000 }
    );
  };

  const handleSendEmergency = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientPhone.trim() || !locationName.trim()) {
      showToast('Veuillez renseigner votre téléphone et votre localisation.', 'error');
      return;
    }

    if (!validateIvorianPhone(clientPhone)) {
      showToast('Numéro de téléphone invalide (10 chiffres, ex: 07 78 03 03 75).', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const req = await emergencyApi.create({
        clientName: clientName.trim() || 'Client Dépannage',
        clientPhone,
        locationName,
        coordinates,
        breakdownType,
        vehicleDetails: vehicleDetails || 'Véhicule standard',
      });

      setActiveRequest(req);
      showToast('Alerte SOS transmise ! Un dépanneur va être assigné.', 'success');
    } catch {
      showToast('Erreur lors de l’envoi de la demande de dépannage.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Automated status progression simulation for the demo
  useEffect(() => {
    if (!activeRequest || activeRequest.status === 'termine') return;

    let timer: ReturnType<typeof setTimeout>;

    if (activeRequest.status === 'demande_envoyee') {
      timer = setTimeout(async () => {
        const updated = await emergencyApi.updateStatus(activeRequest.id, 'prise_en_charge', 'Ibrahim Koné');
        setActiveRequest(updated);
        showToast('Demande prise en charge par notre chef mécanicien !', 'info');
      }, 3500);
    } else if (activeRequest.status === 'prise_en_charge') {
      timer = setTimeout(async () => {
        const updated = await emergencyApi.updateStatus(activeRequest.id, 'depanneur_en_route', 'Ibrahim Koné');
        setActiveRequest({ ...updated, etaMinutes: 18 });
        showToast('Camion plateau en route vers votre position !', 'warning');
      }, 4500);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [activeRequest?.id, activeRequest?.status]);

  const steps: { key: EmergencyStatus; label: string; desc: string }[] = [
    { key: 'demande_envoyee', label: '1. Demande envoyée', desc: 'Alerte transmise au central' },
    { key: 'prise_en_charge', label: '2. Prise en charge', desc: 'Opérateur assigné' },
    { key: 'depanneur_en_route', label: '3. Dépanneur en route', desc: 'Arrivée sous 20 min' },
    { key: 'termine', label: '4. Terminé', desc: 'Véhicule dépanné / remorqué' },
  ];

  const getStepIndex = (status: EmergencyStatus) => {
    switch (status) {
      case 'demande_envoyee':
        return 0;
      case 'prise_en_charge':
        return 1;
      case 'depanneur_en_route':
        return 2;
      case 'termine':
        return 3;
    }
  };

  return (
    <div className="py-10 sm:py-16 space-y-12 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header Banner with emergency call */}
      <div className="bg-linear-to-r from-[#D62828] to-[#B71C1C] text-white rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10 text-center sm:text-left">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              Assistance Immédiate 24/7
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold font-heading">
              Dépannage & Remorquage Express
            </h1>
            <p className="text-sm text-red-100 max-w-lg">
              Une panne à Bingerville, la Palmeraie, Faya ou sur le Boulevard Mitterrand ?
              Nos dépanneuses interviennent en 20 minutes chrono.
            </p>
          </div>

          <div className="flex flex-col gap-3 w-full sm:w-auto">
            <a
              href={`tel:${settings.telephone_principal || '+2250778030375'}`}
              className="inline-flex items-center justify-center gap-2 bg-white text-[#D62828] hover:bg-slate-100 px-6 py-3.5 rounded-2xl font-extrabold text-sm shadow-lg transition-transform hover:scale-105"
            >
              <Phone className="w-5 h-5 fill-[#D62828] text-transparent" />
              <span>Appel d'Urgence Immédiat</span>
            </a>
            <button
              type="button"
              onClick={handleShareViaWhatsApp}
              className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white px-6 py-3 rounded-2xl font-bold text-xs shadow-md transition-transform hover:scale-105 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-white text-transparent" />
              <span>Envoyer ma Position sur WhatsApp</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Request Tracking Interface */}
      {activeRequest ? (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-sm space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <span className="text-xs font-mono font-bold text-slate-400 block">DOSSIER #{activeRequest.id}</span>
              <h3 className="text-xl sm:text-2xl font-bold font-heading text-slate-900 mt-1">
                Suivi de votre Dépanneuse en Direct
              </h3>
            </div>
            <Badge variant="danger" size="md">
              Astreinte Active
            </Badge>
          </div>

          {/* Stepper */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {steps.map((st, idx) => {
              const currentIdx = getStepIndex(activeRequest.status);
              const isPast = idx < currentIdx;
              const isCurrent = idx === currentIdx;

              return (
                <div
                  key={st.key}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    isCurrent
                      ? 'bg-red-50 border-[#D62828] text-[#D62828] font-bold shadow-xs'
                      : isPast
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-2 font-bold text-xs">
                    {isPast ? (
                      <Check className="w-5 h-5 text-emerald-600" />
                    ) : isCurrent ? (
                      <Loader2 className="w-5 h-5 animate-spin text-[#D62828]" />
                    ) : (
                      idx + 1
                    )}
                  </div>
                  <h4 className="font-bold text-xs uppercase tracking-wide">{st.label}</h4>
                  <p className="text-[11px] mt-0.5 opacity-80">{st.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Live ETA Box */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#1B2A6B] text-white flex items-center justify-center font-bold">
                <Navigation className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Position d'intervention :</p>
                <p className="text-sm font-bold text-slate-800">{activeRequest.locationName}</p>
                {activeRequest.coordinates && (
                  <p className="text-[11px] text-emerald-700 font-mono">
                    GPS : {activeRequest.coordinates.lat.toFixed(5)}, {activeRequest.coordinates.lng.toFixed(5)}
                  </p>
                )}
                <p className="text-xs text-slate-500 mt-1">
                  Panne : <span className="font-semibold capitalize">{activeRequest.breakdownType}</span> • Contact : {activeRequest.clientPhone}
                </p>
              </div>
            </div>

            <div className="text-center sm:text-right">
              <span className="text-xs text-slate-500 block">Temps d'arrivée estimé</span>
              <span className="text-2xl font-extrabold text-[#D62828]">
                {activeRequest.status === 'termine' ? 'Arrivé sur place' : `~ ${activeRequest.etaMinutes || 20} min`}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <a href={`tel:${settings.telephone_principal || '+2250778030375'}`} className="flex-1">
              <Button variant="danger" size="lg" className="w-full">
                Parler directement avec le dépanneur
              </Button>
            </a>
            <Button
              variant="outline"
              size="lg"
              className="flex-1"
              onClick={() => setActiveRequest(null)}
            >
              Nouvelle demande de dépannage
            </Button>
          </div>
        </div>
      ) : (
        /* Emergency Form */
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl sm:text-2xl font-bold font-heading text-[#1B2A6B]">
              Déclarer une Urgence sur la Route
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Remplissez ce formulaire d'urgence en 30 secondes. Notre équipe d'astreinte est notifiée instantanément.
            </p>
          </div>

          <form onSubmit={handleSendEmergency} className="space-y-6">
            {/* 1. SECTION: GÉOLOCALISATION ET POSITION */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                  1. Localisation du véhicule en panne <span className="text-[#D62828]">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowHelpModal(true)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Aide GPS mobile</span>
                </button>
              </div>

              {/* ACTION BUTTONS ON MOBILE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Button A: Native Browser Geolocation */}
                <Button
                  type="button"
                  variant={geolocSuccess ? 'whatsapp' : 'outline'}
                  size="md"
                  onClick={handleRequestGeolocation}
                  loading={geolocating}
                  icon={<Compass className="w-4 h-4 text-blue-600" />}
                  className="w-full text-xs font-bold justify-center"
                >
                  {geolocSuccess ? 'Position GPS Verrouillée ✓' : 'Partager ma position GPS'}
                </Button>

                {/* Button B: Direct WhatsApp Sharing (Guaranteed to work 100% on any mobile) */}
                <button
                  type="button"
                  onClick={handleShareViaWhatsApp}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs transition-transform active:scale-98 cursor-pointer"
                  title="Partager ma position en direct sur WhatsApp"
                >
                  <MessageCircle className="w-4 h-4 fill-white text-transparent" />
                  <span>Partager ma position via WhatsApp</span>
                </button>
              </div>

              {/* Status Banner when geolocating */}
              {geolocating && (
                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center gap-3 animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
                  <div className="flex-1">
                    <p className="font-bold">Recherche de vos coordonnées satellites en cours...</p>
                    <p className="text-[11px] text-blue-700">
                      💡 Si votre téléphone affiche <em>« Autoriser l'accès à votre position »</em>, touchez <strong>Autoriser</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* Fallback Banner if GPS is denied on mobile */}
              {gpsDenied && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-950">
                        La géolocalisation automatique a été bloquée par votre navigateur mobile.
                      </p>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        Pas de panique ! Utilisez l'une des 3 solutions rapides ci-dessous :
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleShareViaWhatsApp}
                      className="p-2 rounded-xl bg-white border border-amber-300 hover:bg-emerald-50 text-left flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-[11px] text-emerald-800">1. Envoyer via WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowMapPicker(!showMapPicker)}
                      className="p-2 rounded-xl bg-white border border-amber-300 hover:bg-blue-50 text-left flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Map className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="font-bold text-[11px] text-blue-800">2. Pointer sur la carte</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowHelpModal(true)}
                      className="p-2 rounded-xl bg-white border border-amber-300 hover:bg-slate-100 text-left flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Smartphone className="w-4 h-4 text-slate-700 shrink-0" />
                      <span className="font-bold text-[11px] text-slate-800">3. Débloquer Safari/Chrome</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Locked coordinates pill */}
              {coordinates && (
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl px-3.5 py-2">
                  <span className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Point GPS verrouillé : <strong>{coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)}</strong></span>
                  </span>
                  <div className="flex items-center gap-3">
                    <a
                      href={`https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-900 underline"
                    >
                      Vérifier sur Google Maps <ExternalLink className="w-3 h-3" />
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        setCoordinates(undefined);
                        setGeolocSuccess(false);
                      }}
                      className="text-[11px] text-rose-600 hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      <RotateCcw className="w-3 h-3" /> Réinitialiser
                    </button>
                  </div>
                </div>
              )}

              {/* Text input for street / landmark */}
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Quartier, carrefour, repère (ex: Bingerville carrefour CIE, ou après le pont)"
                  className="w-full text-sm pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] bg-white"
                />
              </div>

              {/* QUICK REPERES / CARREFOURS DE BINGERVILLE ET ABIDJAN */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500">
                    Repères fréquents en 1 clic (Bingerville & Grand Abidjan) :
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowMapPicker(!showMapPicker)}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Map className="w-3 h-3" />
                    {showMapPicker ? 'Masquer la carte' : 'Ouvrir la carte'}
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {ABIDJAN_LANDMARKS.map((lm) => {
                    const isSelected = coordinates?.lat === lm.lat && coordinates?.lng === lm.lng;
                    return (
                      <button
                        key={lm.name}
                        type="button"
                        onClick={() => handleSelectLandmark(lm)}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-emerald-100 border-emerald-400 text-emerald-900 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-emerald-600" />}
                        <span>{lm.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* INTERACTIVE MAP VIEW (OPENSTREETMAP EMBED) */}
              {showMapPicker && (
                <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Crosshair className="w-3.5 h-3.5 text-[#D62828]" />
                      Carte de localisation (Bingerville / Côte d'Ivoire)
                    </span>
                    <a
                      href={`https://www.google.com/maps?q=${coordinates?.lat || 5.3582},${coordinates?.lng || -3.8912}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-blue-600 hover:underline font-semibold flex items-center gap-1"
                    >
                      Ouvrir dans Google Maps <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="relative aspect-video sm:aspect-21/9 w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-200">
                    <iframe
                      title="Carte de localisation"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${(coordinates?.lng || -3.8912) - 0.04}%2C${(coordinates?.lat || 5.3582) - 0.04}%2C${(coordinates?.lng || -3.8912) + 0.04}%2C${(coordinates?.lat || 5.3582) + 0.04}&layer=mapnik&marker=${coordinates?.lat || 5.3582}%2C${coordinates?.lng || -3.8912}`}
                      className="w-full h-full border-0"
                    />
                  </div>

                  <p className="text-[11px] text-slate-500 italic">
                    Astuce : Cliquez sur un des repères ci-dessus pour pointer instantanément la carte sur votre zone.
                  </p>
                </div>
              )}

              {/* OPTIONAL PASTE GOOGLE MAPS LINK OR RAW COORDINATES */}
              <div className="pt-1">
                {!showManualInput ? (
                  <button
                    type="button"
                    onClick={() => setShowManualInput(true)}
                    className="text-[11px] text-slate-500 hover:text-slate-700 underline cursor-pointer"
                  >
                    + Coller un lien Google Maps ou saisir des coordonnées GPS manuelles
                  </button>
                ) : (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">Lien Google Maps ou coordonnées GPS :</span>
                      <button
                        type="button"
                        onClick={() => setShowManualInput(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={manualLinkInput}
                        onChange={(e) => setManualLinkInput(e.target.value)}
                        placeholder="Ex: https://maps.app.goo.gl/... ou 5.3582, -3.8912"
                        className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
                      />
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={handleApplyManualCoordinates}
                      >
                        Appliquer
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 2. CHOOSE BREAKDOWN TYPE */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                2. Nature du problème <span className="text-[#D62828]">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {[
                  { id: 'batterie', label: 'Batterie à plat', icon: '⚡' },
                  { id: 'pneu', label: 'Pneu / Crevaison', icon: '🛞' },
                  { id: 'moteur', label: 'Panne Moteur', icon: '🔧' },
                  { id: 'accident', label: 'Accrochage', icon: '💥' },
                  { id: 'autre', label: 'Autre panne', icon: '❓' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setBreakdownType(item.id as BreakdownType)}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      breakdownType === item.id
                        ? 'bg-[#1B2A6B] text-white border-[#1B2A6B] font-bold shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-xl block mb-1">{item.icon}</span>
                    <span className="text-xs block leading-tight">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. PHONE & VEHICLE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">
                  Numéro de téléphone joignable <span className="text-[#D62828]">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    required
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="07 78 03 03 75"
                    className="w-full text-sm pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">
                  Marque & Modèle du véhicule
                </label>
                <div className="relative">
                  <Car className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={vehicleDetails}
                    onChange={(e) => setVehicleDetails(e.target.value)}
                    placeholder="Ex: Toyota Prado noir, ou Peugeot 208"
                    className="w-full text-sm pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] bg-white"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide mb-1">
                Votre nom ou nom du conducteur
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ex: M. Patrick"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] bg-white"
              />
            </div>

            {/* BIG RED ACTION BUTTON */}
            <Button
              type="submit"
              variant="danger"
              size="lg"
              loading={submitting}
              className="w-full font-bold uppercase tracking-wider text-sm shadow-xl min-h-[52px]"
            >
              Envoyer l'appel de dépannage d'urgence
            </Button>
          </form>
        </div>
      )}

      {/* MOBILE GPS HELP MODAL */}
      <Modal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        title="Comment activer le GPS sur votre mobile ?"
        subtitle="Guide étape par étape pour autoriser la localisation"
      >
        <div className="space-y-4">
          {/* Tabs for iPhone / Android */}
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => setHelpTab('iphone')}
              className={`flex-1 py-2 text-center text-xs font-bold border-b-2 cursor-pointer ${
                helpTab === 'iphone'
                  ? 'border-[#1B2A6B] text-[#1B2A6B]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Sur iPhone (Safari)
            </button>
            <button
              type="button"
              onClick={() => setHelpTab('android')}
              className={`flex-1 py-2 text-center text-xs font-bold border-b-2 cursor-pointer ${
                helpTab === 'android'
                  ? 'border-[#1B2A6B] text-[#1B2A6B]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              Sur Android (Chrome)
            </button>
          </div>

          {helpTab === 'iphone' ? (
            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#1B2A6B] text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                  1
                </span>
                <p>
                  Dans la barre d'adresse en bas de Safari, touchez l'icône <strong>« aA »</strong> ou les petits curseurs à gauche du lien.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#1B2A6B] text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                  2
                </span>
                <p>
                  Touchez <strong>« Réglages du site web »</strong>, puis dans la ligne <strong>« Emplacement »</strong>, choisissez <strong>« Autoriser »</strong>.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#1B2A6B] text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                  3
                </span>
                <p>
                  Revenez sur cette page et appuyez sur <strong>« Partager ma position GPS »</strong>.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#1B2A6B] text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                  1
                </span>
                <p>
                  Touchez l'icône de <strong>cadenas 🔒</strong> ou de réglages située juste à gauche de l'adresse web dans Chrome.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#1B2A6B] text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                  2
                </span>
                <p>
                  Touchez <strong>« Autorisations »</strong> (ou « Paramètres du site »), puis activez <strong>« Localisation »</strong> sur <strong>Autorisé</strong>.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#1B2A6B] text-white font-bold flex items-center justify-center shrink-0 text-[10px]">
                  3
                </span>
                <p>
                  Revenez sur cette page, rechargez si demandé et appuyez sur <strong>« Partager ma position GPS »</strong>.
                </p>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setShowHelpModal(false);
                handleShareViaWhatsApp();
              }}
              className="w-full py-2.5 rounded-xl bg-[#25D366] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <MessageCircle className="w-4 h-4 fill-white text-transparent" />
              <span>Plus simple : Partager ma position sur WhatsApp</span>
            </button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowHelpModal(false)}
            >
              Fermer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
