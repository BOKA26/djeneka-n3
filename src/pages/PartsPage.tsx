import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AutoPart, StockStatus } from '../types';
import { partsApi, engineApi } from '../services/api';
import { formatFCFA, validateIvorianPhone } from '../utils/format';
import { StatusPill } from '../components/common/StatusPill';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Badge } from '../components/common/Badge';
import { useToast } from '../context/ToastContext';
import {
  Search,
  Filter,
  CheckCircle2,
  Package,
  Wrench,
  MessageCircle,
  Car,
  Tag,
  Shield,
  Layers,
} from 'lucide-react';

export const PartsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'moteurs' ? 'moteurs' : 'pieces';
  const [activeTab, setActiveTab] = useState<'pieces' | 'moteurs'>(initialTab);

  const [parts, setParts] = useState<AutoPart[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [selectedBrand, setSelectedBrand] = useState<string>('Toutes');
  const [selectedStock, setSelectedStock] = useState<string>('Tous');

  // Selected Part Modal
  const [selectedPart, setSelectedPart] = useState<AutoPart | null>(null);

  // Engine Order Form
  const { showToast } = useToast();
  const [engineModel, setEngineModel] = useState('');
  const [engineYear, setEngineYear] = useState<number>(2018);
  const [engineOrigin, setEngineOrigin] = useState<'asiatique' | 'europeenne'>('asiatique');
  const [engineChassis, setEngineChassis] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [engineNotes, setEngineNotes] = useState('');
  const [engineSubmitting, setEngineSubmitting] = useState(false);

  useEffect(() => {
    partsApi.getAll().then((data) => {
      setParts(data);
      setLoading(false);
    });
  }, []);

  // Filter categories and brands
  const categories = ['Tous', 'Freinage', 'Filtration', 'Suspension', 'Moteur', 'Électrique', 'Éclairage', 'Transmission', 'Climatisation'];
  const brands = ['Toutes', 'Toyota', 'Hyundai', 'Kia', 'Peugeot', 'Renault', 'Mercedes-Benz', 'Bosch', 'Valeo'];

  const filteredParts = parts.filter((part) => {
    const matchesSearch =
      part.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.compatibleModels.some((m) => m.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'Tous' || part.category === selectedCategory;
    const matchesBrand =
      selectedBrand === 'Toutes' ||
      part.brand.toLowerCase().includes(selectedBrand.toLowerCase()) ||
      part.compatibleBrands.some((b) => b.toLowerCase().includes(selectedBrand.toLowerCase()));

    const matchesStock =
      selectedStock === 'Tous' ||
      (selectedStock === 'in_stock' && part.stockStatus === 'in_stock') ||
      (selectedStock === 'on_order' && part.stockStatus === 'on_order') ||
      (selectedStock === 'out_of_stock' && part.stockStatus === 'out_of_stock');

    return matchesSearch && matchesCategory && matchesBrand && matchesStock;
  });

  const handleEngineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!engineModel.trim() || !clientName.trim() || !clientPhone.trim() || !engineChassis.trim()) {
      showToast('Veuillez remplir tous les champs requis du moteur.', 'error');
      return;
    }

    if (!validateIvorianPhone(clientPhone)) {
      showToast('Numéro de téléphone ivoirien invalide (10 chiffres).', 'error');
      return;
    }

    try {
      setEngineSubmitting(true);
      await engineApi.create({
        clientName,
        phone: clientPhone,
        vehicleModel: engineModel,
        year: Number(engineYear),
        origin: engineOrigin,
        chassisNumber: engineChassis,
        notes: engineNotes,
      });

      showToast('Votre demande de recherche moteur a été enregistrée avec succès !', 'success');
      // Reset form
      setEngineModel('');
      setEngineChassis('');
      setEngineNotes('');
    } catch {
      showToast('Erreur lors de l’envoi de la commande moteur.', 'error');
    } finally {
      setEngineSubmitting(false);
    }
  };

  return (
    <div className="py-10 sm:py-16 space-y-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge variant="navy">Pièces Garanties & Moteurs</Badge>
        <h1 className="text-3xl sm:text-5xl font-extrabold font-heading text-[#1B2A6B]">
          Catalogue Pièces & Moteurs d'Origine
        </h1>
        <p className="text-sm sm:text-base text-slate-600">
          Trouvez la pièce exacte pour votre modèle parmi notre stock disponible à Bingerville ou commandez un moteur complet importé d'Asie ou d'Europe.
        </p>

        {/* Tab switchers */}
        <div className="inline-flex p-1.5 rounded-2xl bg-slate-200/80 max-w-md mx-auto mt-4">
          <button
            onClick={() => setActiveTab('pieces')}
            className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'pieces'
                ? 'bg-white text-[#1B2A6B] shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pièces Détachées en Stock ({parts.length})
          </button>
          <button
            onClick={() => setActiveTab('moteurs')}
            className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'moteurs'
                ? 'bg-[#D62828] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Moteurs sur Commande ⚙️
          </button>
        </div>
      </div>

      {activeTab === 'pieces' ? (
        <div className="space-y-8">
          {/* Search & Filters Bar */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
              {/* Search text */}
              <div className="md:col-span-2 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher par référence, pièce, modèle (ex: plaquettes, RAV4, Bosch)..."
                  className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] bg-white"
                />
              </div>

              {/* Category */}
              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] bg-white"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      Catégorie : {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stock status */}
              <div>
                <select
                  value={selectedStock}
                  onChange={(e) => setSelectedStock(e.target.value)}
                  className="w-full text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] bg-white"
                >
                  <option value="Tous">Disponibilité : Tous</option>
                  <option value="in_stock">En stock uniquement</option>
                  <option value="on_order">Sur commande</option>
                  <option value="out_of_stock">Indisponible</option>
                </select>
              </div>
            </div>

            {/* Brands Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 text-xs">
              <span className="font-semibold text-slate-500 shrink-0">Marques compatibles :</span>
              {brands.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setSelectedBrand(b)}
                  className={`px-3 py-1 rounded-full font-medium transition-colors shrink-0 cursor-pointer ${
                    selectedBrand === b
                      ? 'bg-[#1B2A6B] text-white font-semibold'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Results stats */}
          <div className="flex items-center justify-between text-xs text-slate-500 px-2">
            <span>{filteredParts.length} pièce(s) trouvée(s)</span>
            {(searchQuery || selectedCategory !== 'Tous' || selectedBrand !== 'Toutes' || selectedStock !== 'Tous') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('Tous');
                  setSelectedBrand('Toutes');
                  setSelectedStock('Tous');
                }}
                className="text-[#D62828] font-semibold hover:underline cursor-pointer"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>

          {/* Parts Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredParts.map((part) => (
              <div
                key={part.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  <div className="relative h-44 bg-slate-100 overflow-hidden">
                    <img
                      src={part.imageUrl}
                      alt={part.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <StatusPill status={part.stockStatus} type="stock" />
                    </div>
                    <div className="absolute top-2.5 right-2.5 bg-white/90 text-slate-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md">
                      {part.reference}
                    </div>
                  </div>

                  <div className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-600">{part.brand}</span>
                      <span>{part.category}</span>
                    </div>

                    <h3 className="font-heading font-bold text-sm text-slate-900 group-hover:text-[#1B2A6B] line-clamp-2">
                      {part.name}
                    </h3>

                    <p className="text-xs text-slate-500 line-clamp-2">
                      {part.description}
                    </p>

                    <div className="bg-slate-50 p-2 rounded-xl text-[11px] text-slate-600">
                      <span className="font-semibold block text-slate-500">Compatibilité :</span>
                      <span className="truncate block font-medium">
                        {part.compatibleModels.join(', ')} ({part.yearRange})
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0 space-y-2">
                  <div className="flex items-center justify-between border-t border-slate-100 pt-2">
                    <span className="text-xs text-slate-400">Prix public</span>
                    <span className="text-base font-extrabold text-[#1B2A6B]">
                      {formatFCFA(part.price)}
                    </span>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full font-semibold text-xs"
                    onClick={() => setSelectedPart(part)}
                  >
                    Voir la pièce & Commander
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* MOTEURS SUR COMMANDE SECTION */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs space-y-4">
              <span className="text-xs font-bold text-[#D62828] bg-rose-50 px-3 py-1 rounded-full uppercase tracking-wider">
                Service Premium Swap & Import
              </span>
              <h2 className="text-2xl font-bold font-heading text-[#1B2A6B]">
                Moteurs Reconditionnés et Neufs sur Commande
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Officina Djeneka importe directement vos blocs moteurs d'occasion vérifiés ou neufs avec prise des compressions, contrôle du jeu aux soupapes et historique de provenance.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <Shield className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-slate-800">Garantie 3 à 6 Mois</p>
                    <p className="text-slate-500">Garantie formelle sur bloc moteur et culasse.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <Wrench className="w-5 h-5 text-[#1B2A6B] shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-slate-800">Option Pose Clé en Main</p>
                    <p className="text-slate-500">Montage professionnel dans nos ateliers d'Adjin Palmeraie.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-md">
            <h3 className="font-heading font-bold text-xl text-[#1B2A6B] mb-1">
              Formulaire de Commande Moteur
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Renseignez les détails du moteur souhaité. Nos experts vous transmettront un chiffrage avec photos et délai d'acheminement sous 24h.
            </p>

            <form onSubmit={handleEngineSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Modèle & Motorisation <span className="text-[#D62828]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={engineModel}
                    onChange={(e) => setEngineModel(e.target.value)}
                    placeholder="Ex: Toyota Hilux 2.8 D-4D 1GD ou Mercedes OM651"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Année du véhicule <span className="text-[#D62828]">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1995}
                    max={2026}
                    value={engineYear}
                    onChange={(e) => setEngineYear(Number(e.target.value))}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Origine souhaitée <span className="text-[#D62828]">*</span>
                  </label>
                  <select
                    value={engineOrigin}
                    onChange={(e) => setEngineOrigin(e.target.value as 'asiatique' | 'europeenne')}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] bg-white"
                  >
                    <option value="asiatique">Origine Asiatique (Japon / Corée - Faible kilométrage)</option>
                    <option value="europeenne">Origine Européenne (Allemagne / France / Italie)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Numéro de Châssis (VIN) <span className="text-[#D62828]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={engineChassis}
                    onChange={(e) => setEngineChassis(e.target.value)}
                    placeholder="Ex: 17 caractères (sur la carte grise)"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] bg-white font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Votre Nom & Prénoms <span className="text-[#D62828]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ex: M. Diarra"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Téléphone (Côte d'Ivoire) <span className="text-[#D62828]">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="Ex: 07 78 03 03 75"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Accessoires souhaités ou remarques
                </label>
                <textarea
                  rows={3}
                  value={engineNotes}
                  onChange={(e) => setEngineNotes(e.target.value)}
                  placeholder="Ex: Moteur nu ou complet avec alternateur, démarreur et turbo ? Boîte manuelle ou automatique ?"
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] bg-white"
                />
              </div>

              <Button
                type="submit"
                variant="danger"
                size="lg"
                loading={engineSubmitting}
                className="w-full font-bold uppercase tracking-wider text-xs"
              >
                Transmettre la demande de recherche moteur
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FICHE PIÈCE */}
      {selectedPart && (
        <Modal
          isOpen={!!selectedPart}
          onClose={() => setSelectedPart(null)}
          title={selectedPart.name}
          subtitle={`Référence constructeur : ${selectedPart.reference}`}
          maxWidth="lg"
        >
          <div className="space-y-5">
            <div className="relative h-60 rounded-2xl overflow-hidden bg-slate-100">
              <img
                src={selectedPart.imageUrl}
                alt={selectedPart.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3">
                <StatusPill status={selectedPart.stockStatus} type="stock" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400">Prix public TTC</span>
                  <p className="text-2xl font-extrabold text-[#1B2A6B]">
                    {formatFCFA(selectedPart.price)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">Stock atelier</span>
                  <p className="text-xs font-semibold text-slate-700">
                    {selectedPart.stockQuantity > 0
                      ? `${selectedPart.stockQuantity} unité(s) disponibles`
                      : 'Disponible sous 48h'}
                  </p>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">
                {selectedPart.description}
              </p>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Marque :</span>
                  <span className="font-semibold text-slate-800">{selectedPart.brand}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Catégorie :</span>
                  <span className="font-semibold text-slate-800">{selectedPart.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Véhicules compatibles :</span>
                  <span className="font-semibold text-slate-800 text-right">
                    {selectedPart.compatibleModels.join(', ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Années modèles :</span>
                  <span className="font-semibold text-slate-800">{selectedPart.yearRange}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Button
                variant="danger"
                className="w-full font-bold uppercase text-xs"
                onClick={() => {
                  showToast(
                    `Votre demande pour ${selectedPart.name} a été prise en compte. Un conseiller vous contacte.`,
                    'success'
                  );
                  setSelectedPart(null);
                }}
              >
                Demander cette pièce
              </Button>

              <a
                href={`https://wa.me/393490802320?text=Bonjour%20Officina%20Djeneka,%20je%20souhaite%20acheter%20la%20pièce%20:%20${encodeURIComponent(
                  selectedPart.name
                )}%20(Ref:%20${selectedPart.reference})`}
                target="_blank"
                rel="noreferrer"
                className="w-full block"
              >
                <Button variant="whatsapp" className="w-full text-xs">
                  Acheter via WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
