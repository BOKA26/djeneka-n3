import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Wrench,
  Cpu,
  Palette,
  Sparkles,
  ShieldCheck,
  Key,
  Snowflake,
  Truck,
  Droplets,
  Timer,
  Phone,
  ArrowRight,
  CheckCircle,
  Star,
  Users,
  Car,
  Clock,
  Shield,
  MapPin,
  ChevronRight,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Card } from '../components/common/Card';
import { QuoteModal } from '../components/services/QuoteModal';
import { servicesApi, rentalsApi, reviewsApi } from '../services/api';
import { ServiceItem, RentalVehicle, Review } from '../types';
import { formatFCFA } from '../utils/format';

// Icon mapping helper
const SERVICE_ICONS: Record<string, React.ReactNode> = {
  Wrench: <Wrench className="w-6 h-6 text-[#1B2A6B]" />,
  Cpu: <Cpu className="w-6 h-6 text-[#1B2A6B]" />,
  Palette: <Palette className="w-6 h-6 text-[#1B2A6B]" />,
  Sparkles: <Sparkles className="w-6 h-6 text-[#1B2A6B]" />,
  ShieldCheck: <ShieldCheck className="w-6 h-6 text-[#1B2A6B]" />,
  Key: <Key className="w-6 h-6 text-[#1B2A6B]" />,
  Snowflake: <Snowflake className="w-6 h-6 text-[#1B2A6B]" />,
  Truck: <Truck className="w-6 h-6 text-[#D62828]" />,
  Droplets: <Droplets className="w-6 h-6 text-[#1B2A6B]" />,
  Timer: <Timer className="w-6 h-6 text-[#D62828]" />,
};

export const HomePage: React.FC = () => {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [featuredRentals, setFeaturedRentals] = useState<RentalVehicle[]>([]);
  const [approvedReviews, setApprovedReviews] = useState<Review[]>([]);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [selectedServiceForQuote, setSelectedServiceForQuote] = useState<string | undefined>();
  const [reviewIndex, setReviewIndex] = useState(0);
  const [isMapActive, setIsMapActive] = useState(false);

  useEffect(() => {
    servicesApi.getAll().then((data) => {
      if (data && data.length > 0) setServices(data);
    });
    rentalsApi.getAll().then((res) => {
      if (res && res.length > 0) setFeaturedRentals(res.slice(0, 3));
    });
    reviewsApi.getApproved().then((revs) => {
      if (revs && revs.length > 0) setApprovedReviews(revs);
    });
  }, []);

  const openQuoteFor = (serviceName?: string) => {
    setSelectedServiceForQuote(serviceName);
    setQuoteModalOpen(true);
  };

  return (
    <div className="space-y-16 sm:space-y-24 pb-12">
      {/* 1. HERO SECTION */}
      <section className="relative bg-linear-to-b from-slate-900 via-[#1B2A6B] to-[#121E4D] text-white pt-16 pb-24 md:pt-24 md:pb-32 overflow-hidden">
        {/* Background decorative grid & glow */}
        <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#D62828]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Text */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs md:text-sm font-semibold text-blue-200">
                <span className="w-2 h-2 rounded-full bg-[#D62828] animate-ping" />
                Officina Djeneka (Garage Moderne) • Bingerville Adjin
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold font-heading tracking-tight leading-tight">
                Performance & <span className="text-[#D62828]">Fiabilité</span> Automobile.
              </h1>

              <p className="text-base sm:text-lg text-slate-200 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Votre garage de confiance à Bingerville, Adjin Palmeraie. Mécanique de précision, diagnostic électronique multimarque, tôlerie-peinture au four, pièces d'origine et dépannage rapide 24h/24.
              </p>

              {/* CTAs: Demander un devis & Appeler */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Button
                  variant="danger"
                  size="lg"
                  onClick={() => openQuoteFor()}
                  className="w-full sm:w-auto uppercase tracking-wide font-bold"
                >
                  Demander un devis gratuit
                </Button>

                <a href="tel:+2250778030375" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    icon={<Phone className="w-5 h-5 text-emerald-400" />}
                    className="w-full sm:w-auto border-white/40 text-white hover:bg-white/10"
                  >
                    +225 07 78 03 03 75
                  </Button>
                </a>
              </div>

              {/* Guarantees bar */}
              <div className="grid grid-cols-3 gap-3 pt-6 border-t border-white/10 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Pièces d'origine garanties</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-300 shrink-0" />
                  <span>Délais stricts respectés</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Outillage certifié Bosch</span>
                </div>
              </div>
            </div>

            {/* Right Hero Image Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none rounded-3xl overflow-hidden border-2 border-white/20 shadow-2xl shadow-black/40 group">
                <img
                  src="https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=800&auto=format&fit=crop&q=80"
                  alt="Atelier Officina Djeneka Bingerville"
                  className="w-full h-80 sm:h-96 object-cover transform group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-linear-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 text-white">
                  <span className="inline-block bg-[#D62828] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-2">
                    Service Express
                  </span>
                  <h3 className="font-heading font-bold text-lg sm:text-xl">
                    Baie de Service Rapide & Valises Diagnostic
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Prise en charge directe sans attente pour vos vidanges et bilans de sécurité.
                  </p>
                </div>
              </div>

              {/* Badge floating */}
              <div className="absolute -bottom-6 -left-4 sm:left-4 bg-white text-slate-900 p-4 rounded-2xl shadow-xl border border-slate-100 hidden sm:flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-50 text-[#D62828] flex items-center justify-center font-bold">
                  <Truck className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                    Assistance 24/7
                  </span>
                  <p className="text-sm font-bold text-slate-900">Dépannage sous 35 min</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. BANDEAU MIS EN AVANT : VIDANGE RAPIDE EN 15 MINUTES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20">
        <div className="bg-linear-to-r from-white via-slate-50 to-white rounded-3xl p-6 sm:p-8 border-2 border-[#D62828] shadow-xl relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-red-100/50 rounded-full blur-2xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-8 space-y-3">
              <div className="inline-flex items-center gap-2 bg-[#D62828] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                <Timer className="w-4 h-4" />
                Prestation Vedette • Sans Rendez-Vous
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#1B2A6B]">
                Vidange Rapide en 15 Minutes Chrono
              </h2>

              <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
                Présentez-vous directement à notre atelier d'Adjin Palmeraie. Remplacement du filtre à huile neuf, huile 100% synthèse adaptée au climat tropical, mise à niveau de tous les liquides et <strong>contrôle sécurité de 15 points clés offert</strong>.
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700 pt-1">
                <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Huiles TotalEnergies & Castrol
                </span>
                <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Remise à zéro indicateur de bord
                </span>
                <span className="flex items-center gap-1.5 text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg font-bold">
                  Dès 18 000 FCFA tout compris
                </span>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
              <Button
                variant="danger"
                size="lg"
                onClick={() => openQuoteFor('Vidange rapide 15 min')}
                className="w-full font-bold uppercase tracking-wider shadow-lg"
              >
                Réserver mon créneau
              </Button>
              <a
                href="https://wa.me/393490802320?text=Bonjour,%20je%20veux%20passer%20pour%20une%20vidange%20rapide%2015%20minutes"
                target="_blank"
                rel="noreferrer"
                className="w-full"
              >
                <Button variant="whatsapp" size="lg" className="w-full">
                  Discuter sur WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 3. GRILLE DES 10 SERVICES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <Badge variant="navy">Expertise Complète</Badge>
          <h2 className="text-2xl sm:text-4xl font-extrabold font-heading text-[#1B2A6B]">
            Tous nos Services Automobiles à Bingerville
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            Des équipements à la pointe et des mécaniciens formés aux technologies les plus récentes pour préserver la valeur et la sécurité de votre véhicule.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((srv) => (
            <div
              key={srv.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:shadow-lg transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center group-hover:bg-[#1B2A6B]/10 transition-colors">
                    {SERVICE_ICONS[srv.icon] || <Wrench className="w-6 h-6 text-[#1B2A6B]" />}
                  </div>
                  {srv.popular && (
                    <span className="text-[10px] font-bold text-[#D62828] bg-red-50 border border-red-200 px-2 py-0.5 rounded-full uppercase">
                      Populaire
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-heading font-bold text-lg text-slate-900 group-hover:text-[#1B2A6B] transition-colors">
                    {srv.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium">{srv.duration}</p>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {srv.shortDesc}
                </p>

                <div className="pt-2">
                  <span className="text-xs font-semibold text-slate-400 block">Tarif indicatif :</span>
                  <span className="text-sm font-bold text-[#1B2A6B]">{srv.priceEstimate}</span>
                </div>
              </div>

              <div className="pt-6 mt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <Link
                  to={`/services#${srv.slug}`}
                  className="text-xs font-semibold text-[#1B2A6B] hover:underline flex items-center gap-1"
                >
                  En savoir plus
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openQuoteFor(srv.name)}
                  className="hover:border-[#1B2A6B] text-xs font-semibold"
                >
                  Devis
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link to="/services">
            <Button variant="primary" size="lg" iconRight={<ArrowRight className="w-4 h-4" />}>
              Découvrir le détail de toutes nos prestations
            </Button>
          </Link>
        </div>
      </section>

      {/* 4. VÉHICULES À LOUER */}
      <section className="bg-slate-100/70 py-16 sm:py-20 border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <Badge variant="navy">Flotte Moderne</Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#1B2A6B] mt-2">
                Véhicules Disponibles à la Location
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                SUV 4x4 tout-terrain, berlines d'affaires et citadines. Réservez directement en ligne avec calendrier de disponibilité.
              </p>
            </div>
            <Link to="/location">
              <Button variant="outline" iconRight={<ArrowRight className="w-4 h-4" />}>
                Voir toute la flotte (6 véhicules)
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredRentals.map((v) => (
              <div
                key={v.id}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-52 overflow-hidden bg-slate-900">
                    <img
                      src={v.images[0]}
                      alt={v.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="bg-[#1B2A6B] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        {v.category}
                      </span>
                    </div>
                    <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs text-slate-900 px-3 py-1 rounded-xl shadow-xs">
                      <span className="text-sm font-extrabold text-[#1B2A6B]">{formatFCFA(v.pricePerDay)}</span>
                      <span className="text-[10px] text-slate-500 font-medium"> / jour</span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <h3 className="font-heading font-bold text-lg text-slate-900">{v.name}</h3>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Places</span>
                        <span className="font-bold text-slate-700">{v.seats} pers.</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Boîte</span>
                        <span className="font-bold text-slate-700">{v.transmission}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Carburant</span>
                        <span className="font-bold text-slate-700">{v.fuel}</span>
                      </div>
                    </div>

                    <ul className="text-xs text-slate-600 space-y-1 pt-1">
                      {v.features.slice(0, 2).map((feat, idx) => (
                        <li key={idx} className="flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <Link to={`/location/${v.id}`} className="block">
                    <Button variant="danger" className="w-full font-bold uppercase tracking-wider text-xs">
                      Réserver ce véhicule
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. PIÈCES ET MOTEURS SUR COMMANDE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-linear-to-br from-[#1B2A6B] to-[#121E4D] text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-xl">
          <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-15 pointer-events-none bg-[radial-gradient(#ffffff_2px,transparent_2px)] [background-size:20px_20px]" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-8 space-y-4">
              <span className="text-xs font-bold text-blue-200 uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full border border-white/20">
                Import Direct & Pièces Certifiées
              </span>
              <h2 className="text-2xl sm:text-4xl font-extrabold font-heading">
                Pièces Détachées & Moteurs sur Commande
              </h2>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed max-w-2xl">
                Vous recherchez un moteur complet révisé (Japon, Corée, Europe) ou une pièce spécifique introuvable sur le marché abidjanais ? Nous importons, testons les compressions sur banc et vous livrons avec garantie.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
                <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                  <p className="font-bold text-white">Origine Asie</p>
                  <p className="text-blue-200 text-[11px]">Faible kilométrage certifié</p>
                </div>
                <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                  <p className="font-bold text-white">Origine Europe</p>
                  <p className="text-blue-200 text-[11px]">Peugeot, Renault, Mercedes</p>
                </div>
                <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                  <p className="font-bold text-white">Garantie Écrite</p>
                  <p className="text-blue-200 text-[11px]">3 à 6 mois de garantie</p>
                </div>
                <div className="bg-white/10 p-3 rounded-xl border border-white/10">
                  <p className="font-bold text-white">Montage en Atelier</p>
                  <p className="text-blue-200 text-[11px]">Clé en main disponible</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-3">
              <Link to="/pieces?tab=moteurs" className="w-full">
                <Button variant="danger" size="lg" className="w-full font-bold uppercase tracking-wider text-xs">
                  Commander un Moteur Spécifique
                </Button>
              </Link>
              <Link to="/pieces" className="w-full">
                <Button variant="outline" size="lg" className="w-full border-white/40 text-white hover:bg-white/10 text-xs">
                  Explorer le Catalogue Pièces
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CHIFFRES CLÉS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs text-center space-y-1">
            <span className="font-heading font-extrabold text-3xl sm:text-4xl text-[#1B2A6B]">15+</span>
            <p className="text-xs sm:text-sm font-semibold text-slate-800">Années d'Expérience</p>
            <p className="text-[11px] text-slate-400">Maîtrise mécanique absolue</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs text-center space-y-1">
            <span className="font-heading font-extrabold text-3xl sm:text-4xl text-[#D62828]">4 800+</span>
            <p className="text-xs sm:text-sm font-semibold text-slate-800">Véhicules Entretenus</p>
            <p className="text-[11px] text-slate-400">Particuliers et flottes pros</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs text-center space-y-1">
            <span className="font-heading font-extrabold text-3xl sm:text-4xl text-emerald-600">35 min</span>
            <p className="text-xs sm:text-sm font-semibold text-slate-800">Délai Moyen Dépannage</p>
            <p className="text-[11px] text-slate-400">Bingerville, Palmeraie, Riviera</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs text-center space-y-1">
            <span className="font-heading font-extrabold text-3xl sm:text-4xl text-amber-500">99.2%</span>
            <p className="text-xs sm:text-sm font-semibold text-slate-800">Clients Satisfaits</p>
            <p className="text-[11px] text-slate-400">Avis vérifiés et récurrents</p>
          </div>
        </div>
      </section>

      {/* 7. AVIS CLIENTS (CARROUSEL / GRILLE) */}
      <section className="bg-slate-50 py-16 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-10">
            <div>
              <Badge variant="success">Témoignages Réels</Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#1B2A6B] mt-2">
                Ce que nos clients disent de nous
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                La confiance de nos clients d'Abidjan et Bingerville est notre plus grande fierté.
              </p>
            </div>
            <Link to="/avis">
              <Button variant="outline" size="sm" iconRight={<ArrowRight className="w-3.5 h-3.5" />}>
                Tous les avis & Déposer le vôtre
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {approvedReviews.slice(0, 4).map((rev) => (
              <div
                key={rev.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>

                  <p className="text-xs text-slate-700 italic leading-relaxed">
                    « {rev.comment} »
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block">{rev.authorName}</span>
                    {rev.authorVehicle && (
                      <span className="text-[11px] text-slate-400">{rev.authorVehicle}</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">{rev.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. CARTE DE LOCALISATION & ACCÈS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Info Side */}
          <div className="lg:col-span-5 p-6 sm:p-8 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <Badge variant="navy">Plan d'Accès</Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#1B2A6B]">
                Comment Venir à l'Atelier ?
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Situé à Bingerville, secteur Adjin Palmeraie. Accès facile depuis le nouveau goudron menant à la lagune, parking client spacieux et sécurisé.
              </p>

              <div className="space-y-3 text-xs sm:text-sm text-slate-700 pt-2">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#D62828] shrink-0 mt-0.5" />
                  <span>
                    <strong>Adresse :</strong> Bingerville, Adjin Palmeraie (repère : Carrefour Pharmacie Adjin).
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Téléphone atelier :</strong> +225 07 78 03 03 75
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    <strong>Horaires :</strong> 07h30 - 18h30 (Lundi au Samedi)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-4">
              <a
                href="https://maps.google.com/?q=Bingerville+Adjin+Cote+d+Ivoire"
                target="_blank"
                rel="noreferrer"
                className="w-full"
              >
                <Button variant="primary" className="w-full text-xs">
                  Ouvrir sur Google Maps
                </Button>
              </a>
              <a href="tel:+2250778030375" className="w-full">
                <Button variant="outline" className="w-full text-xs">
                  Guider par Téléphone
                </Button>
              </a>
            </div>
          </div>

          {/* Interactive Map Visual with Scroll Protection */}
          <div className="lg:col-span-7 bg-slate-100 min-h-[320px] relative rounded-2xl overflow-hidden group">
            <iframe
              title="Carte Officina Djeneka Bingerville"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d63557.54011681944!2d-3.921616!3d5.358249!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfc194bb8d453001%3A0x6b49e8ba31c79e6!2sBingerville%2C%20C%C3%B4te%20d&#39;Ivoire!5e0!3m2!1sfr!2sci!4v1710000000000!5m2!1sfr!2sci"
              className={`w-full h-full min-h-[320px] border-0 ${isMapActive ? 'pointer-events-auto' : 'pointer-events-none'}`}
              loading="lazy"
            />
            {!isMapActive && (
              <div
                onClick={() => setIsMapActive(true)}
                className="absolute inset-0 bg-slate-900/10 hover:bg-slate-900/20 flex items-center justify-center cursor-pointer transition-colors"
                title="Cliquer pour activer le zoom sur la carte"
              >
                <span className="bg-white/95 text-slate-800 text-xs font-bold px-3.5 py-2 rounded-xl shadow-md border border-slate-200">
                  📍 Cliquez pour naviguer sur la carte
                </span>
              </div>
            )}
            {isMapActive && (
              <button
                onClick={() => setIsMapActive(false)}
                className="absolute top-3 right-3 bg-white/95 text-slate-700 text-xs font-bold px-2.5 py-1.5 rounded-lg shadow-md border border-slate-200 cursor-pointer"
              >
                Figer la carte (défiler)
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 9. FINAL CALL TO ACTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#1B2A6B] text-white rounded-3xl p-8 sm:p-12 text-center space-y-6 relative overflow-hidden shadow-2xl">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-extrabold font-heading">
              Prêt pour une expérience automobile en toute sérénité ?
            </h2>
            <p className="text-blue-100 text-sm sm:text-base">
              Obtenez un devis gratuit en 2 minutes ou rejoignez directement notre atelier à Bingerville pour votre entretien rapide.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <Button
              variant="danger"
              size="lg"
              onClick={() => openQuoteFor()}
              className="w-full sm:w-auto uppercase font-bold text-sm tracking-wider"
            >
              Demander mon devis en ligne
            </Button>
            <Link to="/depannage" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                icon={<AlertTriangle className="w-4 h-4 text-rose-400" />}
                className="w-full sm:w-auto border-white/40 text-white hover:bg-white/10 text-sm"
              >
                Signaler une panne urgente
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Quote Modal */}
      <QuoteModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
        defaultServiceName={selectedServiceForQuote}
      />
    </div>
  );
};
