import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import {
  EmergencyRequest,
  QuoteRequest,
  Reservation,
  AutoPart,
  Review,
  BlogPost,
  ClientVehicle,
  Intervention,
  User,
  RentalVehicle,
  ReservationStatus,
  EmergencyStatus,
  StockStatus,
} from '../../types';
import {
  emergencyApi,
  quotesApi,
  reservationsApi,
  partsApi,
  reviewsApi,
  blogApi,
  vehiclesApi,
  interventionsApi,
  rentalsApi,
  getDatesBetween,
  testSupabaseConnection,
  updateSupabaseConfig,
  resetSupabaseConfig,
  getSupabaseConfig,
  syncAllMockDataToSupabase,
  SUPABASE_SQL_SCHEMA,
  isValidSupabaseUrl,
  normalizeSupabaseUrl,
  profilesApi,
  ConnectionStatus,
} from '../../services/api';
import { supabase } from '../../lib/supabase';
import { formatFCFA, formatDateFR } from '../../utils/format';
import { StatusPill } from '../../components/common/StatusPill';
import { Table } from '../../components/common/Table';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import {
  LayoutDashboard,
  BellRing,
  Users,
  Wrench,
  Car,
  Calendar,
  Package,
  Star,
  BookOpen,
  BarChart3,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Upload,
  AlertTriangle,
  FileText,
  Truck,
  Phone,
  Shield,
  Layers,
  Check,
  ChevronLeft,
  ChevronRight,
  Database,
  RefreshCw,
  Copy,
  ExternalLink,
  Code2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Role permissions
  const isAdmin = user?.role === 'admin';
  const isMechanic = user?.role === 'mecanicien';

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'demands'
    | 'clients'
    | 'interventions'
    | 'fleet'
    | 'reservations'
    | 'parts'
    | 'reviews'
    | 'blog'
    | 'stats'
    | 'users'
    | 'supabase'
  >('dashboard');

  // Supabase states
  const [supabaseUrl, setSupabaseUrl] = useState(getSupabaseConfig().url);
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(getSupabaseConfig().anonKey);
  const [supabaseStatus, setSupabaseStatus] = useState<ConnectionStatus | null>(null);
  const [testingSupabase, setTestingSupabase] = useState(false);
  const [syncingSupabase, setSyncingSupabase] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlSchema, setShowSqlSchema] = useState(false);

  // Global Quick Search
  const [globalSearch, setGlobalSearch] = useState('');

  // Loaded Collections
  const [emergencies, setEmergencies] = useState<EmergencyRequest[]>([]);
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [parts, setParts] = useState<AutoPart[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [vehicles, setVehicles] = useState<ClientVehicle[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [fleet, setFleet] = useState<RentalVehicle[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);

  // Modals & form state
  const [newInterventionModal, setNewInterventionModal] = useState(false);
  const [intClientId, setIntClientId] = useState('user-client-1');
  const [intVehicleId, setIntVehicleId] = useState('veh-1');
  const [intMileage, setIntMileage] = useState(80000);
  const [intServices, setIntServices] = useState('Vidange rapide 15 min, Contrôle freinage');
  const [intParts, setIntParts] = useState('Filtre huile d’origine, Huile 5W30 (5L)');
  const [intCost, setIntCost] = useState(35000);
  const [intNotes, setIntNotes] = useState('Révision générale effectuée sans anomalie.');

  // Part CRUD Modal
  const [partModalOpen, setPartModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<AutoPart | null>(null);
  const [partName, setPartName] = useState('');
  const [partRef, setPartRef] = useState('');
  const [partCategory, setPartCategory] = useState<AutoPart['category']>('Freinage');
  const [partBrand, setPartBrand] = useState('Toyota');
  const [partPrice, setPartPrice] = useState(25000);
  const [partStatus, setPartStatus] = useState<StockStatus>('in_stock');
  const [partQuantity, setPartQuantity] = useState(5);

  // Blog Editor Modal
  const [blogModalOpen, setBlogModalOpen] = useState(false);
  const [blogTitle, setBlogTitle] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [blogCategory, setBlogCategory] = useState('Conseils Entretien');

  // Fleet calendar maintenance block modal
  const [blockDateModal, setBlockDateModal] = useState(false);
  const [selectedFleetVehicleId, setSelectedFleetVehicleId] = useState('');
  const [blockDateValue, setBlockDateValue] = useState(new Date().toISOString().split('T')[0]);

  // Load all operational data from Supabase
  const loadData = async () => {
    try {
      const [emList, quList, resList, pList, revList, bList, vList, iList, fList, uList] = await Promise.all([
        emergencyApi.getAll(),
        quotesApi.getAll(),
        reservationsApi.getAll(),
        partsApi.getAll(),
        reviewsApi.getAll(),
        blogApi.getAll(),
        vehiclesApi.getAll(),
        interventionsApi.getAll(),
        rentalsApi.getAll(),
        profilesApi.getAll(),
      ]);

      setEmergencies(emList);
      setQuotes(quList);
      setReservations(resList);
      setParts(pList);
      setReviews(revList);
      setBlogPosts(bList);
      setVehicles(vList);
      setInterventions(iList);
      setFleet(fList);
      setUsersList(uList);
    } catch (err) {
      console.warn('Erreur chargement dashboard admin:', err);
    }
  };

  useEffect(() => {
    loadData();

    // Abonnement Supabase Realtime aux nouvelles demandes et réservations
    const channel = supabase
      .channel('admin_live_feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'requests' },
        () => {
          showToast('⚡ Nouvelle demande reçue en direct (Realtime) !', 'info');
          loadData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reservations' },
        () => {
          showToast('⚡ Réservation mise à jour en direct (Realtime) !', 'info');
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Check role authorization
  if (!user || (user.role !== 'admin' && user.role !== 'mecanicien')) {
    return (
      <div className="py-20 text-center max-w-md mx-auto px-4">
        <Shield className="w-16 h-16 text-[#D62828] mx-auto mb-4" />
        <h2 className="text-2xl font-bold font-heading text-slate-900 mb-2">Accès Restreint</h2>
        <p className="text-sm text-slate-500 mb-6">
          Cet espace est réservé au personnel technique et administratif d'Officina Djeneka.
        </p>
        <button
          onClick={() => navigate('/connexion')}
          className="bg-[#1B2A6B] text-white px-5 py-2.5 rounded-xl text-sm font-semibold"
        >
          Se connecter en tant qu'employé
        </button>
      </div>
    );
  }

  // To treat counters (Pending items)
  const pendingReservationsCount = reservations.filter((r) => r.status === 'en_attente').length;
  const pendingQuotesCount = quotes.filter((q) => q.status === 'nouveau').length;
  const pendingReviewsCount = reviews.filter((r) => r.status === 'en_attente').length;
  const activeEmergenciesCount = emergencies.filter((e) => e.status !== 'termine').length;
  const totalPendingActionCount =
    pendingReservationsCount + pendingQuotesCount + pendingReviewsCount + activeEmergenciesCount;

  // Emergency takeover action
  const handleTakeEmergency = async (id: string) => {
    try {
      const updated = await emergencyApi.updateStatus(id, 'prise_en_charge', user.name);
      setEmergencies(emergencies.map((e) => (e.id === id ? updated : e)));
      showToast(`Vous avez pris en charge le dossier SOS #${id} !`, 'success');
    } catch {
      showToast('Erreur de prise en charge', 'error');
    }
  };

  // Change emergency status
  const handleChangeEmergencyStatus = async (id: string, newStatus: EmergencyStatus) => {
    try {
      const updated = await emergencyApi.updateStatus(id, newStatus);
      setEmergencies(emergencies.map((e) => (e.id === id ? updated : e)));
      showToast('Statut de dépannage mis à jour', 'info');
    } catch {
      showToast('Erreur mise à jour statut', 'error');
    }
  };

  // Change reservation status
  const handleChangeReservationStatus = async (id: string, newStatus: ReservationStatus) => {
    try {
      const updated = await reservationsApi.updateStatus(id, newStatus);
      setReservations(reservations.map((r) => (r.id === id ? updated : r)));
      showToast(`Réservation #${id} passée en statut : ${newStatus.toUpperCase()}`, 'success');
    } catch {
      showToast('Erreur mise à jour statut réservation', 'error');
    }
  };

  // Approve or delete review
  const handleApproveReview = async (id: string) => {
    await reviewsApi.approve(id);
    setReviews(reviews.map((r) => (r.id === id ? { ...r, status: 'approuve' } : r)));
    showToast('Avis approuvé et publié sur le site !', 'success');
  };

  const handleDeleteReview = async (id: string) => {
    try {
      await reviewsApi.delete(id);
      setReviews(reviews.filter((r) => r.id !== id));
      showToast('Avis supprimé avec succès', 'info');
    } catch {
      showToast('Erreur suppression avis', 'error');
    }
  };

  // Add intervention
  const handleCreateIntervention = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const targetVehicle = vehicles.find((v) => v.id === intVehicleId) || vehicles[0];
      const newInv = await interventionsApi.create({
        clientId: intClientId,
        vehicleId: targetVehicle?.id || 'veh-1',
        vehicleName: `${targetVehicle?.brand} ${targetVehicle?.model}`,
        vehiclePlate: targetVehicle?.plate || '8492-HH-01',
        date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
        mileage: Number(intMileage),
        services: intServices.split(',').map((s) => s.trim()),
        partsChanged: intParts.split(',').map((p) => p.trim()),
        cost: Number(intCost),
        mechanicName: user.name,
        notes: intNotes,
      });

      setInterventions([newInv, ...interventions]);
      setNewInterventionModal(false);
      showToast('Intervention enregistrée et kilométrage mis à jour !', 'success');
      loadData();
    } catch {
      showToast('Erreur lors de la création de l’intervention', 'error');
    }
  };

  // Part Save / Edit
  const handleSavePart = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPart) {
        const updated = await partsApi.update(editingPart.id, {
          name: partName,
          reference: partRef,
          category: partCategory,
          brand: partBrand,
          price: Number(partPrice),
          stockStatus: partStatus,
          stockQuantity: Number(partQuantity),
        });
        setParts(parts.map((p) => (p.id === updated.id ? updated : p)));
        showToast('Pièce mise à jour avec succès', 'success');
      } else {
        const created = await partsApi.create({
          name: partName,
          reference: partRef,
          category: partCategory,
          brand: partBrand,
          compatibleBrands: [partBrand],
          compatibleModels: ['Multi-modèles'],
          yearRange: 'Universel',
          price: Number(partPrice),
          stockStatus: partStatus,
          stockQuantity: Number(partQuantity),
          imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=400&auto=format&fit=crop&q=80',
          description: 'Pièce neuve enregistrée par le gestionnaire de stock.',
        });
        setParts([created, ...parts]);
        showToast('Nouvelle référence ajoutée au catalogue', 'success');
      }
      setPartModalOpen(false);
      setEditingPart(null);
    } catch {
      showToast('Erreur lors de la sauvegarde de la pièce', 'error');
    }
  };

  // CSV Import simulation
  const handleSimulateCsvImport = async () => {
    const dummy = [
      { name: 'Kit plaquettes arrière Ferodo', reference: 'FRD-PLQ-88', category: 'Freinage', price: 19500, stockQuantity: 6 },
      { name: 'Filtre habitacle charbon Renault', reference: 'RNL-FLT-02', category: 'Filtration', price: 8500, stockQuantity: 10 },
      { name: 'Amortisseur arrière à gaz Monroe', reference: 'MNR-GAS-54', category: 'Suspension', price: 34000, stockQuantity: 4 },
    ];
    const count = await partsApi.importCsv(dummy as any);
    const updated = await partsApi.getAll();
    setParts(updated);
    showToast(`Importation réussie : ${count} nouvelles références ajoutées depuis le fichier CSV !`, 'success');
  };

  // Save Blog Post
  const handleSaveBlogPost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await blogApi.savePost({
        title: blogTitle,
        content: blogContent,
        category: blogCategory,
        author: user.name,
      });
      setBlogPosts([created, ...blogPosts]);
      setBlogModalOpen(false);
      setBlogTitle('');
      setBlogContent('');
      showToast('Article de blog publié avec succès !', 'success');
    } catch {
      showToast('Erreur enregistrement article', 'error');
    }
  };

  // Toggle Maintenance Date for Fleet Vehicle
  const handleToggleBlockDate = async (vehicleId: string, dateStr: string) => {
    try {
      const updated = await rentalsApi.toggleBlockDate(vehicleId, dateStr);
      setFleet(fleet.map((v) => (v.id === vehicleId ? updated : v)));
      showToast(`Date ${dateStr} mise à jour (maintenance) pour ce véhicule.`, 'info');
    } catch {
      showToast('Erreur modification date de maintenance', 'error');
    }
  };

  // Sidebar navigation menu with permission filtering
  const allNavItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: <LayoutDashboard className="w-4 h-4" /> },
    {
      id: 'demands',
      label: 'Demandes & SOS',
      icon: <BellRing className="w-4 h-4" />,
      badge: activeEmergenciesCount + pendingQuotesCount,
    },
    { id: 'clients', label: 'Clients & Véhicules', icon: <Users className="w-4 h-4" /> },
    { id: 'interventions', label: 'Interventions atelier', icon: <Wrench className="w-4 h-4" /> },
    { id: 'fleet', label: 'Flotte & Calendrier', icon: <Car className="w-4 h-4" />, adminOnly: true },
    {
      id: 'reservations',
      label: 'Réservations location',
      icon: <Calendar className="w-4 h-4" />,
      badge: pendingReservationsCount,
    },
    { id: 'parts', label: 'Catalogue Pièces', icon: <Package className="w-4 h-4" />, adminOnly: true },
    { id: 'reviews', label: 'Avis Clients', icon: <Star className="w-4 h-4" />, badge: pendingReviewsCount, adminOnly: true },
    { id: 'blog', label: 'Blog & Conseils', icon: <BookOpen className="w-4 h-4" />, adminOnly: true },
    { id: 'stats', label: 'Statistiques & KPIs', icon: <BarChart3 className="w-4 h-4" />, adminOnly: true },
    { id: 'supabase', label: 'Base Supabase SQL', icon: <Database className="w-4 h-4 text-emerald-600" />, adminOnly: true },
  ];

  const visibleNavItems = allNavItems.filter((item) => (isAdmin ? true : !item.adminOnly));

  return (
    <div className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Admin Header with fast search */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
              Espace {isAdmin ? 'Direction & Administration' : 'Chef Mécanicien'}
            </h1>
            <Badge variant={isAdmin ? 'danger' : 'navy'}>
              {isAdmin ? 'Super Admin' : 'Technique'}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Connecté en tant que <strong>{user.name}</strong> • Centre d'Adjin Palmeraie
          </p>
        </div>

        {/* Global Search Bar (name, phone, plate) */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            placeholder="Recherche client, tel, plaque..."
            className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] bg-slate-50/50"
          />
        </div>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Nav */}
        <aside className="lg:col-span-3 bg-white rounded-3xl p-3 sm:p-4 border border-slate-200/90 shadow-xs">
          <div className="flex lg:flex-col gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {visibleNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as typeof activeTab)}
                className={`flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all shrink-0 lg:w-full cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-[#1B2A6B] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#D62828] text-white animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* Admin Content Area */}
        <main className="lg:col-span-9 space-y-6">
          {/* TAB 1: TABLEAU DE BORD DU JOUR */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Daily 3 Key Blocks */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1. Dépannages en cours */}
                <div className="bg-red-50/60 rounded-3xl p-5 border border-red-200 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#D62828] uppercase tracking-wider block">
                      Dépannages en cours
                    </span>
                    <p className="text-3xl font-extrabold font-heading text-slate-900 mt-1">
                      {activeEmergenciesCount}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">Sur l'axe Bingerville / Riviera</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-[#D62828] text-white flex items-center justify-center">
                    <Truck className="w-6 h-6 animate-pulse" />
                  </div>
                </div>

                {/* 2. Rendez-vous du jour */}
                <div className="bg-blue-50/60 rounded-3xl p-5 border border-blue-200 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-[#1B2A6B] uppercase tracking-wider block">
                      Rendez-vous du jour
                    </span>
                    <p className="text-3xl font-extrabold font-heading text-slate-900 mt-1">
                      {quotes.filter((q) => q.status === 'en_cours').length + 4}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">Atelier & vidanges prévues</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-[#1B2A6B] text-white flex items-center justify-center">
                    <Wrench className="w-6 h-6" />
                  </div>
                </div>

                {/* 3. Départs et retours location */}
                <div className="bg-emerald-50/60 rounded-3xl p-5 border border-emerald-200 shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                      Départs & Retours flotte
                    </span>
                    <p className="text-3xl font-extrabold font-heading text-slate-900 mt-1">
                      {reservations.filter((r) => r.status === 'en_cours').length + 2}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">Véhicules sur la route</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center">
                    <Car className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Bloc "À TRAITER" avec compteurs rouges */}
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#D62828] animate-ping" />
                    <h3 className="font-heading font-bold text-lg text-slate-900">
                      Tâches et dossiers urgents à traiter
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-[#D62828] bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                    {totalPendingActionCount} en attente
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => setActiveTab('reservations')}
                    className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors cursor-pointer"
                  >
                    <span className="text-xs text-slate-500 block">Réservations à valider</span>
                    <span className="text-2xl font-extrabold text-[#D62828]">
                      {pendingReservationsCount}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-1">
                      En attente d'approbation contrat
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('demands')}
                    className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors cursor-pointer"
                  >
                    <span className="text-xs text-slate-500 block">Nouveaux devis clients</span>
                    <span className="text-2xl font-extrabold text-[#1B2A6B]">
                      {pendingQuotesCount}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-1">
                      Chiffrages mécaniques à envoyer
                    </span>
                  </button>

                  <button
                    onClick={() => setActiveTab('reviews')}
                    className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors cursor-pointer"
                  >
                    <span className="text-xs text-slate-500 block">Avis clients à modérer</span>
                    <span className="text-2xl font-extrabold text-amber-600">
                      {pendingReviewsCount}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-1">
                      En attente d'autorisation
                    </span>
                  </button>
                </div>
              </div>

              {/* Live Emergencies quick glance */}
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-base text-slate-900">
                    Dernières alertes SOS reçues
                  </h3>
                  <Button size="sm" variant="outline" onClick={() => setActiveTab('demands')}>
                    Gérer toutes les alertes
                  </Button>
                </div>

                <div className="space-y-3">
                  {emergencies.slice(0, 3).map((em) => (
                    <div
                      key={em.id}
                      className="p-4 rounded-2xl border border-slate-100 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{em.clientName}</span>
                          <StatusPill status={em.status} type="emergency" />
                        </div>
                        <p className="text-xs text-slate-600">
                          📍 {em.locationName} • Panne : <strong>{em.breakdownType}</strong> ({em.vehicleDetails})
                        </p>
                        <p className="text-xs text-[#1B2A6B] font-semibold">📞 {em.clientPhone}</p>
                      </div>

                      {em.status === 'demande_envoyee' && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleTakeEmergency(em.id)}
                        >
                          Je prends en charge
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DEMANDES (DÉPANNAGE & DEVIS) */}
          {activeTab === 'demands' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold font-heading text-slate-900">
                    Gestion des Demandes (Dépannages & Devis)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Changez le statut en 1 clic pour tenir informé le client
                  </p>
                </div>
              </div>

              {/* Emergencies table */}
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
                <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-[#D62828]" />
                  Alertes de Dépannage Urgent ({emergencies.length})
                </h4>

                <div className="space-y-3">
                  {emergencies.map((em) => (
                    <div
                      key={em.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{em.clientName}</span>
                          <span className="text-xs text-slate-500">({em.clientPhone})</span>
                          <StatusPill status={em.status} type="emergency" />
                        </div>
                        <p className="text-xs text-slate-700">
                          <strong>Lieu :</strong> {em.locationName}
                        </p>
                        <p className="text-xs text-slate-500">
                          Véhicule : {em.vehicleDetails} • Date : {formatDateFR(em.createdAt)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {em.status === 'demande_envoyee' && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleTakeEmergency(em.id)}
                          >
                            Prendre en charge
                          </Button>
                        )}

                        <select
                          value={em.status}
                          onChange={(e) =>
                            handleChangeEmergencyStatus(em.id, e.target.value as EmergencyStatus)
                          }
                          className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-300 bg-white"
                        >
                          <option value="demande_envoyee">Demande envoyée</option>
                          <option value="prise_en_charge">Prise en charge</option>
                          <option value="depanneur_en_route">Dépanneur en route</option>
                          <option value="termine">Terminé</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quotes requests */}
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
                <h4 className="font-bold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#1B2A6B]" />
                  Demandes de Devis Reçues ({quotes.length})
                </h4>

                <div className="space-y-3">
                  {quotes.map((q) => (
                    <div
                      key={q.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{q.serviceName}</span>
                          <span className="text-xs text-slate-500">• {q.clientName} ({q.clientPhone})</span>
                          <StatusPill status={q.status} type="quote" />
                        </div>
                        <p className="text-xs text-slate-700">
                          <strong>Véhicule :</strong> {q.vehicleInfo} • <strong>Date souhaitée :</strong> {q.preferredDate}
                        </p>
                        <p className="text-xs text-slate-600 italic">« {q.message} »</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={`https://wa.me/${q.clientPhone.replace(/\D/g, '')}?text=Bonjour%20${encodeURIComponent(
                            q.clientName
                          )},%20concernant%20votre%20demande%20de%20devis%20pour%20${encodeURIComponent(
                            q.serviceName
                          )}...`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <Button variant="whatsapp" size="sm" className="text-xs">
                            Répondre sur WhatsApp
                          </Button>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CLIENTS ET VÉHICULES */}
          {activeTab === 'clients' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold font-heading text-slate-900">
                Parc des Véhicules Clients ({vehicles.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vehicles.map((v) => (
                  <div
                    key={v.id}
                    className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs font-mono font-bold bg-slate-100 px-2.5 py-1 rounded-md text-slate-800">
                          {v.plate}
                        </span>
                        <h4 className="font-bold text-base text-slate-900 mt-2">
                          {v.brand} {v.model} ({v.year})
                        </h4>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 block">Compteur actuel</span>
                        <span className="font-extrabold text-[#1B2A6B]">
                          {v.mileage.toLocaleString('fr-FR')} km
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                      <span>Prochaine vidange : {v.nextServiceMileage.toLocaleString('fr-FR')} km</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIntVehicleId(v.id);
                          setNewInterventionModal(true);
                        }}
                      >
                        Nouvelle intervention
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: INTERVENTIONS */}
          {activeTab === 'interventions' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold font-heading text-slate-900">
                    Registre des Interventions Atelier
                  </h3>
                  <p className="text-xs text-slate-500">
                    Enregistrez les travaux réalisés pour mettre à jour l'historique client
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() => setNewInterventionModal(true)}
                >
                  Saisir une intervention
                </Button>
              </div>

              <div className="space-y-4">
                {interventions.map((inv) => (
                  <div
                    key={inv.id}
                    className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{inv.vehicleName}</span>
                          <span className="text-xs font-mono font-bold text-slate-500">({inv.vehiclePlate})</span>
                          <span className="text-xs text-slate-400">• {inv.date}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Kilométrage relevé : <strong>{inv.mileage.toLocaleString('fr-FR')} km</strong> • Mécanicien : {inv.mechanicName}
                        </p>
                      </div>

                      <span className="text-base font-extrabold text-[#1B2A6B]">
                        {formatFCFA(inv.cost)}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                      <p>
                        <strong>Prestations :</strong> {inv.services.join(', ')}
                      </p>
                      <p>
                        <strong>Fournitures / Pièces :</strong> {inv.partsChanged.join(', ')}
                      </p>
                      <p className="text-slate-500 italic mt-1">« {inv.notes} »</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: FLOTTE ET CALENDRIER GLOBAL */}
          {activeTab === 'fleet' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold font-heading text-slate-900">
                    Flotte de Location & Blocages de Maintenance
                  </h3>
                  <p className="text-xs text-slate-500">
                    Bloquez des dates de maintenance ou créez des réservations manuelles
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {fleet.map((v) => (
                  <div
                    key={v.id}
                    className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={v.images[0]}
                        alt={v.name}
                        className="w-20 h-16 rounded-2xl object-cover bg-slate-900 shrink-0"
                      />
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{v.name}</h4>
                        <p className="text-xs text-slate-400">
                          {formatFCFA(v.pricePerDay)} / jour • {v.category}
                        </p>
                      </div>
                    </div>

                    {/* Blocked dates */}
                    <div className="text-xs space-y-2">
                      <span className="font-semibold text-slate-600 block">
                        Dates actuellement bloquées / maintenance :
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {v.unavailableDates && v.unavailableDates.length > 0 ? (
                          v.unavailableDates.map((d) => (
                            <span
                              key={d}
                              className="bg-rose-50 text-[#D62828] border border-rose-200 px-2 py-0.5 rounded-md font-mono text-[11px] flex items-center gap-1"
                            >
                              {d}
                              <button
                                onClick={() => handleToggleBlockDate(v.id, d)}
                                className="hover:text-red-900 font-bold ml-1"
                                title="Débloquer"
                              >
                                ×
                              </button>
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 italic">Aucune date bloquée</span>
                        )}
                      </div>
                    </div>

                    {/* Quick block date picker */}
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                      <input
                        type="date"
                        defaultValue={new Date().toISOString().split('T')[0]}
                        id={`date-${v.id}`}
                        className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-300"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const input = document.getElementById(`date-${v.id}`) as HTMLInputElement;
                          if (input && input.value) {
                            handleToggleBlockDate(v.id, input.value);
                          }
                        }}
                      >
                        Bloquer date
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: RÉSERVATIONS LOCATION */}
          {activeTab === 'reservations' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold font-heading text-slate-900">
                    Toutes les Réservations de Véhicules ({reservations.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Confirmez, refusez ou marquez les retours de location
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {reservations.map((r) => (
                  <div
                    key={r.id}
                    className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{r.vehicleName}</span>
                        <StatusPill status={r.status} type="reservation" />
                      </div>
                      <p className="text-xs text-slate-700">
                        <strong>Client :</strong> {r.clientName} (📞 {r.clientPhone} • {r.clientEmail})
                      </p>
                      <p className="text-xs text-slate-500">
                        Du <strong>{r.startDate}</strong> au <strong>{r.endDate}</strong> ({r.totalDays} jour(s)) • Montant :{' '}
                        <strong>{formatFCFA(r.totalPrice)}</strong>
                      </p>
                      {r.notes && <p className="text-xs text-slate-400 italic">Remarque : {r.notes}</p>}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {r.status === 'en_attente' && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleChangeReservationStatus(r.id, 'confirmee')}
                          >
                            Confirmer
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-rose-600"
                            onClick={() => handleChangeReservationStatus(r.id, 'refusee')}
                          >
                            Refuser
                          </Button>
                        </>
                      )}

                      {r.status === 'confirmee' && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleChangeReservationStatus(r.id, 'en_cours')}
                        >
                          Marquer "En cours" (Clés remises)
                        </Button>
                      )}

                      {r.status === 'en_cours' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleChangeReservationStatus(r.id, 'terminee')}
                        >
                          Marquer "Terminée" (Véhicule restitué)
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: CATALOGUE PIÈCES CRUD */}
          {activeTab === 'parts' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold font-heading text-slate-900">
                    Gestion du Stock Pièces ({parts.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ajoutez, modifiez ou importez des références par CSV
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Upload className="w-4 h-4" />}
                    onClick={handleSimulateCsvImport}
                  >
                    Importer fichier CSV
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Plus className="w-4 h-4" />}
                    onClick={() => {
                      setEditingPart(null);
                      setPartName('');
                      setPartRef('');
                      setPartPrice(25000);
                      setPartQuantity(5);
                      setPartModalOpen(true);
                    }}
                  >
                    Ajouter une pièce
                  </Button>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
                <Table
                  columns={[
                    {
                      header: 'Référence & Pièce',
                      render: (p: AutoPart) => (
                        <div>
                          <p className="font-bold text-slate-900 text-xs sm:text-sm">{p.name}</p>
                          <p className="text-[11px] font-mono text-slate-400">{p.reference}</p>
                        </div>
                      ),
                    },
                    { header: 'Catégorie', accessor: 'category' },
                    {
                      header: 'Prix public',
                      render: (p: AutoPart) => (
                        <span className="font-extrabold text-[#1B2A6B] text-xs sm:text-sm">
                          {formatFCFA(p.price)}
                        </span>
                      ),
                    },
                    {
                      header: 'Disponibilité',
                      render: (p: AutoPart) => <StatusPill status={p.stockStatus} type="stock" />,
                    },
                    {
                      header: 'Stock',
                      render: (p: AutoPart) => (
                        <span className="font-bold text-slate-700 text-xs">
                          {p.stockQuantity} unité(s)
                        </span>
                      ),
                    },
                    {
                      header: 'Actions',
                      render: (p: AutoPart) => (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingPart(p);
                            setPartName(p.name);
                            setPartRef(p.reference);
                            setPartCategory(p.category);
                            setPartBrand(p.brand);
                            setPartPrice(p.price);
                            setPartStatus(p.stockStatus);
                            setPartQuantity(p.stockQuantity);
                            setPartModalOpen(true);
                          }}
                        >
                          Modifier
                        </Button>
                      ),
                    },
                  ]}
                  data={parts}
                  keyExtractor={(p) => p.id}
                />
              </div>
            </div>
          )}

          {/* TAB 8: AVIS CLIENTS À MODÉRER */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold font-heading text-slate-900">
                Modération des Avis Clients ({reviews.length})
              </h3>

              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{rev.authorName}</span>
                        <span className="text-xs text-amber-500 font-bold">★ {rev.rating}/5</span>
                        <Badge variant={rev.status === 'approuve' ? 'success' : 'warning'}>
                          {rev.status === 'approuve' ? 'Approuvé' : 'En attente'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 italic">« {rev.comment} »</p>
                      <span className="text-[10px] text-slate-400 block">{rev.date}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {rev.status === 'en_attente' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleApproveReview(rev.id)}
                        >
                          Approuver
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-rose-600"
                        onClick={() => handleDeleteReview(rev.id)}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 9: BLOG ÉDITEUR */}
          {activeTab === 'blog' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold font-heading text-slate-900">
                    Articles du Blog ({blogPosts.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Publiez des conseils d'entretien pour vos clients
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() => setBlogModalOpen(true)}
                >
                  Rédiger un article
                </Button>
              </div>

              <div className="space-y-4">
                {blogPosts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{post.title}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {post.category} • Par {post.author} ({post.date})
                      </p>
                    </div>
                    <Badge variant={post.status === 'publie' ? 'success' : 'default'}>
                      {post.status === 'publie' ? 'Publié' : 'Brouillon'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 10: STATISTIQUES & CHARTS */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold font-heading text-slate-900">
                Indicateurs & Statistiques d'Activité
              </h3>

              {/* 4 Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Chiffre Réalisé (Est.)</span>
                  <p className="text-2xl font-extrabold text-[#1B2A6B] mt-1">14.8M FCFA</p>
                  <span className="text-[10px] text-emerald-600 font-bold">+18% ce trimestre</span>
                </Card>

                <Card>
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Jours de Location</span>
                  <p className="text-2xl font-extrabold text-[#D62828] mt-1">84 jours</p>
                  <span className="text-[10px] text-slate-500">Taux d'occupation 76%</span>
                </Card>

                <Card>
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Dépannages Réussis</span>
                  <p className="text-2xl font-extrabold text-emerald-600 mt-1">128</p>
                  <span className="text-[10px] text-slate-500">Temps moyen 28 min</span>
                </Card>

                <Card>
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Note Moyenne</span>
                  <p className="text-2xl font-extrabold text-amber-500 mt-1">4.9 / 5</p>
                  <span className="text-[10px] text-slate-500">Sur 150+ avis vérifiés</span>
                </Card>
              </div>

              {/* Simple visual SVG charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Bar Chart: Locations mensuelles */}
                <Card>
                  <h4 className="font-heading font-bold text-sm text-slate-900 mb-4">
                    Locations de Véhicules par Mois (2026)
                  </h4>
                  <div className="h-48 flex items-end justify-between gap-3 pt-6 px-2">
                    {[
                      { m: 'Mai', val: 14 },
                      { m: 'Juin', val: 19 },
                      { m: 'Juil', val: 24 },
                      { m: 'Août', val: 28 },
                      { m: 'Sept', val: 22 },
                      { m: 'Oct', val: 31 },
                    ].map((item, idx) => (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-600">{item.val}</span>
                        <div
                          className="w-full bg-[#1B2A6B] hover:bg-[#D62828] transition-colors rounded-t-lg"
                          style={{ height: `${(item.val / 35) * 120}px` }}
                        />
                        <span className="text-[11px] text-slate-500">{item.m}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* 2. Top Services Distribution */}
                <Card>
                  <h4 className="font-heading font-bold text-sm text-slate-900 mb-4">
                    Services les plus demandés à l'Atelier
                  </h4>
                  <div className="space-y-3 pt-2 text-xs">
                    {[
                      { name: 'Vidange express 15 min', pct: 38, count: '312 interventions' },
                      { name: 'Climatisation auto (R134a)', pct: 24, count: '198 interventions' },
                      { name: 'Diagnostic électronique valise', pct: 18, count: '144 interventions' },
                      { name: 'Freinage & plaquettes', pct: 12, count: '98 interventions' },
                      { name: 'Tôlerie & peinture au four', pct: 8, count: '64 interventions' },
                    ].map((srv, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between font-semibold">
                          <span className="text-slate-800">{srv.name}</span>
                          <span className="text-slate-500">{srv.pct}% ({srv.count})</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              idx === 0 ? 'bg-[#D62828]' : 'bg-[#1B2A6B]'
                            }`}
                            style={{ width: `${srv.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* 11. BASE DE DONNÉES SUPABASE SQL */}
          {activeTab === 'supabase' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-heading font-bold text-slate-900">
                    Configuration Base de Données Supabase (PostgreSQL)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Liez votre instance Supabase pour stocker durablement pièces, réservations, dépannages et devis.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    onClick={() => {
                      navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
                      setCopiedSql(true);
                      showToast('Script SQL copié dans le presse-papiers !', 'success');
                      setTimeout(() => setCopiedSql(false), 3000);
                    }}
                  >
                    {copiedSql ? 'Copié !' : 'Copier Script SQL'}
                  </Button>
                </div>
              </div>

              {/* Status Banner */}
              <Card>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                      <Database className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-bold text-sm text-slate-900">
                          État de synchronisation Supabase
                        </span>
                        {supabaseStatus ? (
                          supabaseStatus.connected ? (
                            <Badge variant="success">Connecté</Badge>
                          ) : (
                            <Badge variant="danger">Hors ligne</Badge>
                          )
                        ) : (
                          <Badge variant="navy">Prêt</Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {supabaseStatus?.message || 'Cliquez sur « Tester la connexion » pour vérifier la liaison réseau.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={testingSupabase}
                      onClick={async () => {
                        const cleanUrl = normalizeSupabaseUrl(supabaseUrl);
                        if (!isValidSupabaseUrl(cleanUrl)) {
                          showToast("L'URL Supabase est invalide (ex: https://votre-projet.supabase.co).", 'error');
                          return;
                        }
                        setTestingSupabase(true);
                        const res = await testSupabaseConnection({ url: cleanUrl, anonKey: supabaseAnonKey });
                        setSupabaseStatus(res);
                        setTestingSupabase(false);
                        showToast(res.message, res.connected ? 'success' : 'warning');
                      }}
                      icon={<RefreshCw className={`w-3.5 h-3.5 ${testingSupabase ? 'animate-spin' : ''}`} />}
                    >
                      {testingSupabase ? 'Test en cours...' : 'Tester la connexion'}
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Configuration Form */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <h4 className="font-heading font-bold text-sm text-slate-900 mb-1 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#1B2A6B]" />
                    Identifiants de connexion Supabase
                  </h4>
                  <p className="text-xs text-slate-500 mb-4">
                    Renseignez uniquement votre <strong>Project URL</strong> et la clé publique <strong>anon</strong>.
                  </p>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const cleanUrl = normalizeSupabaseUrl(supabaseUrl);
                      const cleanKey = supabaseAnonKey.trim();

                      if (!isValidSupabaseUrl(cleanUrl)) {
                        showToast("L'URL Supabase n'est pas valide (doit commencer par https://).", 'error');
                        return;
                      }
                      if (!cleanKey) {
                        showToast("La clé publique anon est obligatoire.", 'error');
                        return;
                      }

                      setSupabaseUrl(cleanUrl);
                      setSupabaseAnonKey(cleanKey);

                      try {
                        updateSupabaseConfig({ url: cleanUrl, anonKey: cleanKey });
                        showToast('Configuration Supabase enregistrée !', 'success');
                      } catch (err) {
                        showToast(err instanceof Error ? err.message : 'Erreur', 'error');
                      }
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        1. Project URL (URL du projet)
                      </label>
                      <input
                        type="url"
                        value={supabaseUrl}
                        onChange={(e) => setSupabaseUrl(e.target.value)}
                        placeholder="https://xxxx.supabase.co"
                        required
                        className="w-full text-xs font-mono px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B]"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Supabase &gt; Project Settings &gt; Data API &gt; Project URL
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        2. Project Anon Key (clé publique anonyme)
                      </label>
                      <textarea
                        rows={3}
                        value={supabaseAnonKey}
                        onChange={(e) => setSupabaseAnonKey(e.target.value)}
                        placeholder="eyJhbGciOi..."
                        required
                        className="w-full text-xs font-mono px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] resize-none"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Supabase &gt; Project API Keys &gt; anon public (ne jamais utiliser service_role)
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <Button type="submit" variant="primary" size="sm">
                        Enregistrer les identifiants
                      </Button>
                      <button
                        type="button"
                        onClick={() => {
                          resetSupabaseConfig();
                          const cfg = getSupabaseConfig();
                          setSupabaseUrl(cfg.url);
                          setSupabaseAnonKey(cfg.anonKey);
                          showToast('Identifiants réinitialisés', 'info');
                        }}
                        className="text-xs text-slate-500 hover:text-slate-800 underline cursor-pointer"
                      >
                        Réinitialiser
                      </button>
                    </div>
                  </form>
                </Card>

                <Card>
                  <h4 className="font-heading font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-emerald-600" />
                    Injection & Synchronisation des données
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">
                    Une fois vos tables créées dans Supabase via le script SQL, cliquez sur ce bouton pour y injecter automatiquement l'ensemble des données d'Officina Djeneka (catalogue de pièces, véhicules de location, articles de blog, avis clients).
                  </p>

                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 mb-4 space-y-2">
                    <span className="font-semibold text-xs text-emerald-950 block">
                      Ce qui sera injecté dans votre Supabase :
                    </span>
                    <ul className="text-[11px] text-emerald-900 space-y-1 list-disc list-inside">
                      <li>24 pièces détachées d'origine et adaptables</li>
                      <li>6 véhicules de location (SUV, 4x4, Berlines)</li>
                      <li>Articles de blog techniques & conseils d'entretien</li>
                      <li>Avis et témoignages clients vérifiés</li>
                    </ul>
                  </div>

                  <Button
                    variant="secondary"
                    size="md"
                    className="w-full"
                    disabled={syncingSupabase}
                    onClick={async () => {
                      setSyncingSupabase(true);
                      const res = await syncAllMockDataToSupabase();
                      setSyncingSupabase(false);
                      showToast(res.message, res.success ? 'success' : 'warning');
                    }}
                    icon={<RefreshCw className={`w-4 h-4 ${syncingSupabase ? 'animate-spin' : ''}`} />}
                  >
                    {syncingSupabase ? 'Injection en cours...' : 'Injecter les données démo dans Supabase'}
                  </Button>
                </Card>
              </div>

              {/* SQL Schema Preview */}
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-[#1B2A6B]" />
                    <h4 className="font-heading font-bold text-sm text-slate-900">
                      Script SQL de création des tables (DDL)
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSqlSchema(!showSqlSchema)}
                    className="flex items-center gap-1 text-xs text-[#1B2A6B] font-semibold hover:underline"
                  >
                    <span>{showSqlSchema ? 'Masquer' : 'Afficher le script'}</span>
                    {showSqlSchema ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <p className="text-xs text-slate-500 mb-3">
                  Ouvrez <strong>Supabase &gt; SQL Editor &gt; New Query</strong>, collez ce script et cliquez sur <strong>Run</strong> pour initialiser automatiquement les 10 tables requises avec politiques RLS.
                </p>

                {showSqlSchema && (
                  <pre className="p-4 rounded-2xl bg-slate-950 text-slate-100 font-mono text-[11px] leading-relaxed max-h-72 overflow-y-auto">
                    {SUPABASE_SQL_SCHEMA}
                  </pre>
                )}
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* MODAL: NOUVELLE INTERVENTION */}
      <Modal
        isOpen={newInterventionModal}
        onClose={() => setNewInterventionModal(false)}
        title="Enregistrer une Intervention Atelier"
        subtitle="Mise à jour automatique du carnet d'entretien client"
      >
        <form onSubmit={handleCreateIntervention} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Véhicule client concerné <span className="text-[#D62828]">*</span>
            </label>
            <select
              value={intVehicleId}
              onChange={(e) => setIntVehicleId(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.brand} {v.model} ({v.plate})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nouveau Kilométrage compteur (km) <span className="text-[#D62828]">*</span>
              </label>
              <input
                type="number"
                required
                value={intMileage}
                onChange={(e) => setIntMileage(Number(e.target.value))}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Montant total réglé (FCFA) <span className="text-[#D62828]">*</span>
              </label>
              <input
                type="number"
                required
                value={intCost}
                onChange={(e) => setIntCost(Number(e.target.value))}
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-[#1B2A6B]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Prestations réalisées (séparées par des virgules) <span className="text-[#D62828]">*</span>
            </label>
            <input
              type="text"
              required
              value={intServices}
              onChange={(e) => setIntServices(e.target.value)}
              placeholder="Ex: Vidange moteur, Filtre huile, Recharge clim"
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pièces & Fournitures montées
            </label>
            <input
              type="text"
              value={intParts}
              onChange={(e) => setIntParts(e.target.value)}
              placeholder="Ex: Filtre Denso, Huile Total 5W30"
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Rapport technicien & recommandations
            </label>
            <textarea
              rows={3}
              value={intNotes}
              onChange={(e) => setIntNotes(e.target.value)}
              placeholder="Ex: Pneus avant à prévoir dans 5 000 km..."
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300"
            />
          </div>

          <Button type="submit" variant="danger" className="w-full uppercase font-bold text-xs">
            Valider l'intervention
          </Button>
        </form>
      </Modal>

      {/* MODAL: AJOUTER / MODIFIER PIÈCE */}
      <Modal
        isOpen={partModalOpen}
        onClose={() => setPartModalOpen(false)}
        title={editingPart ? 'Modifier la pièce' : 'Ajouter une pièce au catalogue'}
      >
        <form onSubmit={handleSavePart} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Désignation de la pièce <span className="text-[#D62828]">*</span>
            </label>
            <input
              type="text"
              required
              value={partName}
              onChange={(e) => setPartName(e.target.value)}
              placeholder="Ex: Plaquettes de frein avant"
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Référence <span className="text-[#D62828]">*</span>
              </label>
              <input
                type="text"
                required
                value={partRef}
                onChange={(e) => setPartRef(e.target.value)}
                placeholder="Ex: BSH-0986"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Marque
              </label>
              <input
                type="text"
                value={partBrand}
                onChange={(e) => setPartBrand(e.target.value)}
                placeholder="Ex: Bosch / Denso"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catégorie
              </label>
              <select
                value={partCategory}
                onChange={(e) => setPartCategory(e.target.value as AutoPart['category'])}
                className="w-full text-xs px-2.5 py-2.5 rounded-xl border border-slate-300 bg-white"
              >
                <option value="Freinage">Freinage</option>
                <option value="Filtration">Filtration</option>
                <option value="Suspension">Suspension</option>
                <option value="Moteur">Moteur</option>
                <option value="Électrique">Électrique</option>
                <option value="Transmission">Transmission</option>
                <option value="Climatisation">Climatisation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Prix (FCFA)
              </label>
              <input
                type="number"
                value={partPrice}
                onChange={(e) => setPartPrice(Number(e.target.value))}
                className="w-full text-xs px-2.5 py-2.5 rounded-xl border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantité
              </label>
              <input
                type="number"
                value={partQuantity}
                onChange={(e) => setPartQuantity(Number(e.target.value))}
                className="w-full text-xs px-2.5 py-2.5 rounded-xl border border-slate-300"
              />
            </div>
          </div>

          <Button type="submit" variant="primary" className="w-full font-bold text-xs uppercase">
            Enregistrer la référence
          </Button>
        </form>
      </Modal>

      {/* MODAL: RÉDIGER ARTICLE BLOG */}
      <Modal
        isOpen={blogModalOpen}
        onClose={() => setBlogModalOpen(false)}
        title="Rédiger un Article de Blog"
      >
        <form onSubmit={handleSaveBlogPost} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Titre de l'article <span className="text-[#D62828]">*</span>
            </label>
            <input
              type="text"
              required
              value={blogTitle}
              onChange={(e) => setBlogTitle(e.target.value)}
              placeholder="Ex: 5 conseils pour la climatisation à Abidjan"
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catégorie
            </label>
            <input
              type="text"
              value={blogCategory}
              onChange={(e) => setBlogCategory(e.target.value)}
              placeholder="Ex: Conseils Entretien, Climatisation, Sécurité"
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Contenu de l'article <span className="text-[#D62828]">*</span>
            </label>
            <textarea
              required
              rows={6}
              value={blogContent}
              onChange={(e) => setBlogContent(e.target.value)}
              placeholder="Rédigez vos explications et recommandations techniques..."
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300"
            />
          </div>

          <Button type="submit" variant="danger" className="w-full font-bold text-xs uppercase">
            Publier l'article
          </Button>
        </form>
      </Modal>
    </div>
  );
};
