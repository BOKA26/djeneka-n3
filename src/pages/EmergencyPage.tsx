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
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { emergencyApi } from '../services/api';
import { BreakdownType, EmergencyRequest, EmergencyStatus } from '../types';
import { validateIvorianPhone } from '../utils/format';
import { useToast } from '../context/ToastContext';

export const EmergencyPage: React.FC = () => {
  const { showToast } = useToast();

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

  // Active tracking state
  const [activeRequest, setActiveRequest] = useState<EmergencyRequest | null>(null);

  // Ask for geolocation
  const handleRequestGeolocation = () => {
    if (!navigator.geolocation) {
      showToast('La géolocalisation n’est pas supportée par votre navigateur.', 'warning');
      return;
    }
    setGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ lat: latitude, lng: longitude });
        setGeolocSuccess(true);
        setGeolocating(false);
        if (!locationName) {
          setLocationName(`Position GPS détectée (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
        }
        showToast('Position GPS captée avec succès !', 'success');
      },
      (error) => {
        setGeolocating(false);
        setGeolocSuccess(false);
        showToast('Localisation refusée. Veuillez saisir votre quartier ou repère manuellement.', 'info');
      },
      { timeout: 10000, enableHighAccuracy: true }
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
              Panne de batterie, crevaison, chauffe moteur ou accrochage ? Notre plateau basculant intervient sur tout l'axe Bingerville, Palmeraie, Faya et Riviera.
            </p>
          </div>

          <a href="tel:+2250778030375" className="shrink-0">
            <Button
              variant="secondary"
              size="lg"
              icon={<Phone className="w-5 h-5 text-[#D62828]" />}
              className="bg-white text-slate-900 hover:bg-slate-100 font-extrabold shadow-lg"
            >
              Appel Direct : +225 07 78 03 03 75
            </Button>
          </a>
        </div>
      </div>

      {/* TRACKING PROGRESSION VIEW OR FORM */}
      {activeRequest ? (
        <div className="bg-white rounded-3xl border-2 border-[#D62828] p-6 sm:p-10 shadow-lg space-y-8 animate-in fade-in zoom-in-95 duration-200">
          <div className="text-center space-y-2">
            <span className="text-xs font-mono font-bold uppercase text-[#D62828] bg-red-50 px-3 py-1 rounded-full">
              Dossier SOS #{activeRequest.id}
            </span>
            <h2 className="text-2xl font-bold font-heading text-slate-900">
              Suivi d'Intervention en Direct
            </h2>
            <p className="text-xs text-slate-500">
              Nous localisons nos équipes pour une arrivée la plus rapide possible.
            </p>
          </div>

          {/* Stepper tracker */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {steps.map((st, idx) => {
              const currentIdx = getStepIndex(activeRequest.status);
              const isPast = idx < currentIdx;
              const isCurrent = idx === currentIdx;

              return (
                <div
                  key={st.key}
                  className={`p-4 rounded-2xl border text-center transition-all ${
                    isCurrent
                      ? 'bg-red-50 border-[#D62828] text-[#D62828] shadow-sm'
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
                <p className="text-xs text-slate-500">
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
            <a href="tel:+2250778030375" className="flex-1">
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

          <form onSubmit={handleSendEmergency} className="space-y-5">
            {/* 1. GEOLOCATION OR MANUAL REPERE */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
                1. Localisation du véhicule en panne <span className="text-[#D62828]">*</span>
              </label>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <Button
                  type="button"
                  variant={geolocSuccess ? 'whatsapp' : 'outline'}
                  size="md"
                  onClick={handleRequestGeolocation}
                  loading={geolocating}
                  icon={<Compass className="w-4 h-4" />}
                  className="shrink-0 text-xs"
                >
                  {geolocSuccess ? 'Position GPS Détectée ✓' : 'Partager ma position GPS'}
                </Button>

                <div className="relative flex-1">
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
              </div>
            </div>

            {/* 2. CHOOSE BREAKDOWN TYPE */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">
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
    </div>
  );
};
