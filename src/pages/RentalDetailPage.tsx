import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { RentalVehicle } from '../types';
import { rentalsApi } from '../services/api';
import { formatFCFA } from '../utils/format';
import { ReservationCalendar } from '../components/rentals/ReservationCalendar';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import {
  Users,
  Settings2,
  Fuel,
  Wind,
  ShieldCheck,
  CheckCircle,
  ArrowLeft,
  Calendar,
  FileText,
  MapPin,
  Sparkles,
} from 'lucide-react';

export const RentalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<RentalVehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      rentalsApi.getById(id).then((v) => {
        if (v) setVehicle(v);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-[#1B2A6B] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-500">Chargement de la fiche véhicule...</p>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="py-20 text-center max-w-md mx-auto px-4">
        <h2 className="text-2xl font-bold font-heading text-slate-800 mb-2">Véhicule introuvable</h2>
        <p className="text-sm text-slate-500 mb-6">Le véhicule demandé n'est pas ou plus disponible dans notre flotte.</p>
        <Link to="/location">
          <Button variant="primary">Retourner à la flotte de location</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="py-8 sm:py-12 space-y-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb / Back button */}
      <div>
        <Link
          to="/location"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-[#1B2A6B] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la liste des véhicules
        </Link>
      </div>

      {/* Vehicle Top Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Photos Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative h-72 sm:h-96 rounded-3xl overflow-hidden bg-slate-900 border border-slate-200 shadow-sm">
            <img
              src={vehicle.images[activeImageIndex] || vehicle.images[0]}
              alt={vehicle.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4">
              <span className="bg-[#1B2A6B] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {vehicle.category}
              </span>
            </div>
          </div>

          {/* Thumbnails */}
          {vehicle.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {vehicle.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-24 h-18 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                    activeImageIndex === idx
                      ? 'border-[#1B2A6B] ring-2 ring-[#1B2A6B]/20 scale-102'
                      : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Vue ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Key Specs & Pricing Card */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Modèle {vehicle.year}</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Contrôlé 30 points
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-slate-900">
              {vehicle.name}
            </h1>
          </div>

          {/* Pricing Highlight */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Tarif Journalier
              </span>
              <div>
                <span className="text-2xl font-extrabold font-heading text-[#1B2A6B]">
                  {formatFCFA(vehicle.pricePerDay)}
                </span>
                <span className="text-xs text-slate-500"> / jour</span>
              </div>
            </div>

            {vehicle.weeklyDiscountPercent > 0 && (
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 bg-emerald-50/80 p-2 rounded-xl">
                <span>Remise dès 7 jours consécutifs :</span>
                <span>-{vehicle.weeklyDiscountPercent}% sur le tarif</span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-slate-600 pt-1 border-t border-slate-200/60">
              <span>Caution obligatoire :</span>
              <span className="font-bold text-slate-800">{formatFCFA(vehicle.deposit)}</span>
            </div>
          </div>

          {/* Technical Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <Users className="w-4 h-4 text-[#1B2A6B]" />
              <div>
                <span className="text-slate-400 block text-[10px]">Capacité</span>
                <span className="font-bold text-slate-800">{vehicle.seats} passagers</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <Settings2 className="w-4 h-4 text-[#1B2A6B]" />
              <div>
                <span className="text-slate-400 block text-[10px]">Boîte de vitesse</span>
                <span className="font-bold text-slate-800">{vehicle.transmission}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <Fuel className="w-4 h-4 text-[#1B2A6B]" />
              <div>
                <span className="text-slate-400 block text-[10px]">Carburant</span>
                <span className="font-bold text-slate-800">{vehicle.fuel}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <Wind className="w-4 h-4 text-[#1B2A6B]" />
              <div>
                <span className="text-slate-400 block text-[10px]">Climatisation</span>
                <span className="font-bold text-emerald-600">Double évaporateur</span>
              </div>
            </div>
          </div>

          {/* Equipments */}
          <div>
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Équipements & Atouts
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
              {vehicle.features.map((feat, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* KEY COMPONENT: Interactive Reservation Calendar */}
      <section className="pt-6">
        <ReservationCalendar vehicle={vehicle} />
      </section>

      {/* Rental Terms & Conditions summary */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
        <h3 className="text-base font-bold font-heading text-slate-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#1B2A6B]" />
          Conditions Générales de Mise à Disposition
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="space-y-1">
            <h4 className="font-bold text-slate-800">1. Documents Requis</h4>
            <p className="text-xs text-slate-500">
              Permis de conduire valide de plus de 2 ans et pièce nationale d'identité (ou passeport).
            </p>
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-slate-800">2. Dépôt de Garantie (Caution)</h4>
            <p className="text-xs text-slate-500">
              Déposée par chèque, empreinte carte ou espèces à la remise des clés et restituée intégralement après état des lieux retour.
            </p>
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-slate-800">3. Carburant & Propreté</h4>
            <p className="text-xs text-slate-500">
              Départ réservoir plein, retour réservoir plein. Véhicule remis nettoyé et désinfecté.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
