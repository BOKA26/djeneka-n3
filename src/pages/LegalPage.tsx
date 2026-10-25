import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Badge } from '../components/common/Badge';

export const LegalPage: React.FC = () => {
  const location = useLocation();
  const initialTab = location.pathname.includes('conditions')
    ? 'conditions'
    : location.pathname.includes('confidentialite')
    ? 'confidentialite'
    : 'mentions';

  const [tab, setTab] = useState<'mentions' | 'conditions' | 'confidentialite'>(initialTab);

  return (
    <div className="py-10 sm:py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      <div className="text-center space-y-3">
        <Badge variant="navy">Cadre Légal & Réglementaire</Badge>
        <h1 className="text-3xl font-extrabold font-heading text-[#1B2A6B]">
          Informations Légales & Contractuelles
        </h1>

        <div className="flex justify-center gap-2 pt-2">
          <button
            onClick={() => setTab('mentions')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
              tab === 'mentions'
                ? 'bg-[#1B2A6B] text-white'
                : 'bg-white border text-slate-600 hover:bg-slate-50'
            }`}
          >
            Mentions Légales
          </button>
          <button
            onClick={() => setTab('conditions')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
              tab === 'conditions'
                ? 'bg-[#1B2A6B] text-white'
                : 'bg-white border text-slate-600 hover:bg-slate-50'
            }`}
          >
            Conditions de Location
          </button>
          <button
            onClick={() => setTab('confidentialite')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
              tab === 'confidentialite'
                ? 'bg-[#1B2A6B] text-white'
                : 'bg-white border text-slate-600 hover:bg-slate-50'
            }`}
          >
            Confidentialité
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-sm text-sm text-slate-700 leading-relaxed space-y-6">
        {tab === 'mentions' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold font-heading text-slate-900">Mentions Légales</h2>
            <p>
              <strong>Raison sociale :</strong> OFFICINA DJENEKA (Garage Moderne) SARL<br />
              <strong>Siège d'exploitation :</strong> Bingerville, Quartier Adjin Palmeraie, Côte d'Ivoire.<br />
              <strong>Téléphone :</strong> +225 07 78 03 03 75 / WhatsApp : +39 349 080 2320<br />
              <strong>Activité :</strong> Réparation mécanique, diagnostic automobile, tôlerie peinture, négoce de pièces détachées et location de véhicules légers et 4x4.
            </p>
            <p>
              Directeur de publication : Direction Générale Officina Djeneka.
            </p>
          </div>
        )}

        {tab === 'conditions' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold font-heading text-slate-900">Conditions Générales de Location de Véhicules</h2>
            <p>
              <strong>1. Conditions requises pour le conducteur :</strong> Le locataire ou conducteur désigné doit être âgé d'au moins 21 ans et titulaire d'un permis de conduire valide depuis plus de deux ans.
            </p>
            <p>
              <strong>2. Dépôt de garantie (Caution) :</strong> Une caution obligatoire selon le modèle (de 120 000 FCFA à 300 000 FCFA) est remise avant le départ du véhicule. Elle est restituée au retour après vérification de l'état du véhicule.
            </p>
            <p>
              <strong>3. Carburant et kilométrage :</strong> Les véhicules sont remis avec le réservoir plein et doivent être restitués avec le même niveau.
            </p>
            <p>
              <strong>4. Assurance :</strong> Assurance responsabilité civile et dommages tous risques comprise avec franchise contractuelle.
            </p>
          </div>
        )}

        {tab === 'confidentialite' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold font-heading text-slate-900">Politique de Confidentialité</h2>
            <p>
              Officina Djeneka protège les données personnelles de ses clients. Les numéros de téléphone et coordonnées collectés servent exclusivement à la gestion de vos demandes de devis, réservations de location et alertes de dépannage d'urgence.
            </p>
            <p>
              Vos données ne sont ni vendues ni cédées à des tiers publicitaires. Vous pouvez demander la suppression de votre compte client ou la modification de vos véhicules sur simple demande à l'accueil de notre atelier.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
