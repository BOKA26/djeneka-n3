import React from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../common/Logo';
import {
  MapPin,
  Phone,
  MessageCircle,
  Clock,
  ShieldCheck,
  Facebook,
  Instagram,
  ArrowRight,
  Mail,
} from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#131E4D] text-slate-300 pt-16 pb-24 md:pb-12 border-t-4 border-[#D62828]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Col 1: Brand & Identity */}
          <div className="space-y-4">
            <Logo variant="light" size="md" />
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              <strong>Officina Djeneka (Garage Moderne)</strong>, « Performance & Fiabilité ». Votre centre de référence automobile à Bingerville pour l'entretien, le diagnostic haute technologie, les pièces d'origine et la location de véhicules.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                aria-label="Facebook Officina Djeneka"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                aria-label="Instagram Officina Djeneka"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://wa.me/393490802320?text=Bonjour%20Officina%20Djeneka,%20je%20souhaite%20un%20renseignement"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366] text-white flex items-center justify-center transition-colors"
                aria-label="WhatsApp Officina Djeneka"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366] hover:text-white" />
              </a>
            </div>
          </div>

          {/* Col 2: Services Rapides */}
          <div>
            <h4 className="text-white font-heading font-semibold text-base mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D62828]" />
              Nos Prestations
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li>
                <Link to="/services" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-blue-300" />
                  Mécanique générale & Moteurs
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-blue-300" />
                  Vidange express en 15 minutes
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-blue-300" />
                  Diagnostic électronique & valise
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-blue-300" />
                  Tôlerie & Peinture au four
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-blue-300" />
                  Climatisation automobile (R134a)
                </Link>
              </li>
              <li>
                <Link to="/pieces" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-blue-300" />
                  Moteurs sur commande (Asie & Europe)
                </Link>
              </li>
              <li>
                <Link to="/location" className="hover:text-white transition-colors flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-blue-300" />
                  Location de véhicules (SUV, Pick-up)
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Localisation & Coordonnées */}
          <div>
            <h4 className="text-white font-heading font-semibold text-base mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D62828]" />
              Coordonnées
            </h4>
            <div className="space-y-3.5 text-xs sm:text-sm">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#D62828] shrink-0 mt-0.5" />
                <span>
                  Bingerville, Adjin Palmeraie, Côte d'Ivoire
                  <span className="block text-slate-400 text-xs mt-0.5">Axe principal vers la lagune</span>
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href="tel:+2250778030375" className="hover:text-white font-semibold">
                  +225 07 78 03 03 75
                </a>
              </div>

              <div className="flex items-center gap-2.5">
                <MessageCircle className="w-4 h-4 text-[#25D366] shrink-0" />
                <a
                  href="https://wa.me/393490802320?text=Bonjour%20Officina%20Djeneka,%20je%20souhaite%20un%20renseignement"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white font-semibold"
                >
                  WhatsApp: +39 349 080 2320
                </a>
              </div>

              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-blue-300 shrink-0" />
                <span>contact@officina-djeneka.ci</span>
              </div>
            </div>
          </div>

          {/* Col 4: Horaires & Urgences */}
          <div>
            <h4 className="text-white font-heading font-semibold text-base mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#D62828]" />
              Horaires d'Ouverture
            </h4>
            <div className="space-y-3 text-xs sm:text-sm">
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-blue-300 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Lundi au Samedi :</p>
                  <p className="text-slate-300">07h30 - 18h30 (non-stop)</p>
                  <p className="font-semibold text-white mt-1">Dimanche :</p>
                  <p className="text-slate-400">Fermé (astreinte dépannage)</p>
                </div>
              </div>

              <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl text-xs space-y-1">
                <p className="font-bold text-red-200 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#D62828] animate-ping" />
                  Dépannage & Remorquage 24/7
                </p>
                <p className="text-slate-300">
                  Plateau d'intervention disponible jour et nuit sur Bingerville et Grand Abidjan.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Legal bar */}
        <div className="pt-8 mt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Officina Djeneka (Garage Moderne). Tous droits réservés.</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/mentions-legales" className="hover:text-white transition-colors">
              Mentions Légales
            </Link>
            <span>•</span>
            <Link to="/conditions-location" className="hover:text-white transition-colors">
              Conditions de Location
            </Link>
            <span>•</span>
            <Link to="/confidentialite" className="hover:text-white transition-colors">
              Politique de Confidentialité
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
