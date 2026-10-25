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
  UserRole,
  RentalVehicle,
  ReservationStatus,
  EmergencyStatus,
  StockStatus,
  GalleryItem,
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
  galleryApi,
  usersApi,
} from '../../services/api';
import { supabase } from '../../lib/supabase';
import { formatFCFA, formatDateFR } from '../../utils/format';
import { StatusPill } from '../../components/common/StatusPill';
import { Table } from '../../components/common/Table';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { CompanySettingsTab } from '../../components/admin/CompanySettingsTab';
import { AuditLogTab } from '../../components/admin/AuditLogTab';
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
  Plus,
  Upload,
  AlertTriangle,
  FileText,
  Truck,
  Phone,
  Shield,
  Trash2,
  Edit,
  CheckCircle2,
  XCircle,
  Building2,
  History,
  Image as ImageIcon,
  UserPlus,
  UserCheck,
  UserX,
  ExternalLink,
  Lock,
  Eye,
  RefreshCw,
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
    | 'gallery'
    | 'users'
    | 'settings'
    | 'audit'
    | 'stats'
  >('dashboard');

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
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Generic Deletion Confirmation Modal State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    itemDescription?: string;
    onConfirm: () => Promise<void>;
    loading: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: async () => {},
    loading: false,
  });

  // ==================== MODALS & FORM STATES ====================

  // 1. Intervention Modal
  const [newInterventionModal, setNewInterventionModal] = useState(false);
  const [editingIntervention, setEditingIntervention] = useState<Intervention | null>(null);
  const [intClientId, setIntClientId] = useState('');
  const [intVehicleId, setIntVehicleId] = useState('');
  const [intMileage, setIntMileage] = useState(80000);
  const [intServices, setIntServices] = useState('Vidange rapide 15 min, Contrôle freinage');
  const [intParts, setIntParts] = useState('Filtre huile d’origine, Huile 5W30 (5L)');
  const [intCost, setIntCost] = useState(35000);
  const [intNotes, setIntNotes] = useState('Révision générale effectuée sans anomalie.');

  // 2. Part Modal
  const [partModalOpen, setPartModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<AutoPart | null>(null);
  const [partName, setPartName] = useState('');
  const [partRef, setPartRef] = useState('');
  const [partCategory, setPartCategory] = useState<AutoPart['category']>('Freinage');
  const [partBrand, setPartBrand] = useState('Toyota');
  const [partPrice, setPartPrice] = useState(25000);
  const [partStatus, setPartStatus] = useState<StockStatus>('in_stock');
  const [partQuantity, setPartQuantity] = useState(5);

  // 3. Blog Modal
  const [blogModalOpen, setBlogModalOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
  const [blogTitle, setBlogTitle] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [blogCategory, setBlogCategory] = useState('Conseils Entretien');
  const [blogCover, setBlogCover] = useState('https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=80');

  // 4. Client Vehicle Modal
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<ClientVehicle | null>(null);
  const [vehBrand, setVehBrand] = useState('Toyota');
  const [vehModel, setVehModel] = useState('Corolla');
  const [vehYear, setVehYear] = useState(2021);
  const [vehPlate, setVehPlate] = useState('');
  const [vehMileage, setVehMileage] = useState(65000);
  const [vehClientId, setVehClientId] = useState('');

  // 5. Fleet Rental Vehicle Modal
  const [fleetModalOpen, setFleetModalOpen] = useState(false);
  const [editingFleet, setEditingFleet] = useState<RentalVehicle | null>(null);
  const [fleetName, setFleetName] = useState('Toyota RAV4 4x4');
  const [fleetBrand, setFleetBrand] = useState('Toyota');
  const [fleetModel, setFleetModel] = useState('RAV4');
  const [fleetYear, setFleetYear] = useState(2023);
  const [fleetCategory, setFleetCategory] = useState<RentalVehicle['category']>('SUV');
  const [fleetSeats, setFleetSeats] = useState(5);
  const [fleetTransmission, setFleetTransmission] = useState<'Automatique' | 'Manuelle'>('Automatique');
  const [fleetFuel, setFleetFuel] = useState<'Essence' | 'Diesel'>('Essence');
  const [fleetPricePerDay, setFleetPricePerDay] = useState(45000);
  const [fleetDeposit, setFleetDeposit] = useState(150000);
  const [fleetImage, setFleetImage] = useState('https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80');

  // 6. Reservation Modal
  const [resModalOpen, setResModalOpen] = useState(false);
  const [editingRes, setEditingRes] = useState<Reservation | null>(null);
  const [resVehicleId, setResVehicleId] = useState('');
  const [resClientName, setResClientName] = useState('');
  const [resClientPhone, setResClientPhone] = useState('');
  const [resClientEmail, setResClientEmail] = useState('');
  const [resStartDate, setResStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [resEndDate, setResEndDate] = useState(new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]);
  const [resStatus, setResStatus] = useState<ReservationStatus>('confirmee');
  const [resPrice, setResPrice] = useState(135000);

  // 7. Gallery Modal
  const [galleryModalOpen, setGalleryModalOpen] = useState(false);
  const [editingGallery, setEditingGallery] = useState<GalleryItem | null>(null);
  const [galTitle, setGalTitle] = useState('');
  const [galCategory, setGalCategory] = useState('Atelier & Équipements');
  const [galUrl, setGalUrl] = useState('');
  const [galOrder, setGalOrder] = useState(1);
  const [galActive, setGalActive] = useState(true);

  // 8. Staff Account Creation Modal
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffRole, setStaffRole] = useState<'mecanicien' | 'admin'>('mecanicien');
  const [creatingStaff, setCreatingStaff] = useState(false);

  // 9. Manual Review Modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [revAuthor, setRevAuthor] = useState('');
  const [revRating, setRevRating] = useState(5);
  const [revComment, setRevComment] = useState('');
  const [revService, setRevService] = useState('Vidange rapide');

  // Load all operational data from Supabase
  const loadData = async () => {
    setLoadingData(true);
    try {
      const [emList, quList, resList, pList, revList, bList, vList, iList, fList, uList, gList] = await Promise.all([
        emergencyApi.getAll(),
        quotesApi.getAll(),
        reservationsApi.getAll(),
        partsApi.getAll(),
        reviewsApi.getAll(),
        blogApi.getAll(),
        vehiclesApi.getAll(),
        interventionsApi.getAll(),
        rentalsApi.getAll(),
        usersApi.getAll(),
        galleryApi.getAll(),
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
      setGalleryItems(gList);
    } catch (err) {
      console.warn('Erreur chargement dashboard admin:', err);
    } finally {
      setLoadingData(false);
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

  // Confirmation Trigger Helper
  const triggerDeleteConfirm = (
    title: string,
    message: string,
    itemDescription: string,
    onConfirmAction: () => Promise<void>
  ) => {
    setDeleteConfirm({
      isOpen: true,
      title,
      message,
      itemDescription,
      onConfirm: async () => {
        setDeleteConfirm((prev) => ({ ...prev, loading: true }));
        try {
          await onConfirmAction();
          setDeleteConfirm((prev) => ({ ...prev, isOpen: false, loading: false }));
        } catch (err: any) {
          showToast(err.message || 'Erreur lors de la suppression', 'error');
          setDeleteConfirm((prev) => ({ ...prev, loading: false }));
        }
      },
      loading: false,
    });
  };

  // ==================== ACTIONS HANDLERS ====================

  // Emergency actions
  const handleTakeEmergency = async (id: string) => {
    try {
      const updated = await emergencyApi.updateStatus(id, 'prise_en_charge', user.name);
      setEmergencies(emergencies.map((e) => (e.id === id ? updated : e)));
      showToast(`Vous avez pris en charge le dossier SOS #${id} !`, 'success');
    } catch {
      showToast('Erreur de prise en charge', 'error');
    }
  };

  const handleChangeEmergencyStatus = async (id: string, newStatus: EmergencyStatus) => {
    try {
      const updated = await emergencyApi.updateStatus(id, newStatus);
      setEmergencies(emergencies.map((e) => (e.id === id ? updated : e)));
      showToast('Statut de dépannage mis à jour', 'info');
    } catch {
      showToast('Erreur mise à jour statut', 'error');
    }
  };

  const handleDeleteEmergency = (em: EmergencyRequest) => {
    triggerDeleteConfirm(
      'Supprimer l\'alerte SOS',
      'Supprimer définitivement cette alerte de dépannage ? Cette action est irréversible.',
      `Dossier #${em.id} - ${em.clientName} (${em.locationName})`,
      async () => {
        await emergencyApi.delete(em.id);
        setEmergencies(emergencies.filter((e) => e.id !== em.id));
        showToast('Alerte supprimée avec succès', 'info');
      }
    );
  };

  // Quotes actions
  const handleChangeQuoteStatus = async (id: string, newStatus: 'nouveau' | 'en_cours' | 'traite') => {
    try {
      await quotesApi.updateStatus(id, newStatus);
      setQuotes(quotes.map((q) => (q.id === id ? { ...q, status: newStatus } : q)));
      showToast('Statut du devis actualisé', 'info');
    } catch {
      showToast('Erreur mise à jour devis', 'error');
    }
  };

  const handleDeleteQuote = (q: QuoteRequest) => {
    triggerDeleteConfirm(
      'Supprimer la demande de devis',
      'Supprimer définitivement ce devis ? Cette action est irréversible.',
      `${q.serviceName} pour ${q.clientName} (${q.vehicleInfo})`,
      async () => {
        await quotesApi.delete(q.id);
        setQuotes(quotes.filter((item) => item.id !== q.id));
        showToast('Devis supprimé', 'info');
      }
    );
  };

  // Reservation actions
  const handleChangeReservationStatus = async (id: string, newStatus: ReservationStatus) => {
    try {
      const updated = await reservationsApi.updateStatus(id, newStatus);
      setReservations(reservations.map((r) => (r.id === id ? updated : r)));
      showToast(`Réservation #${id} passée en statut : ${newStatus.toUpperCase()}`, 'success');
    } catch {
      showToast('Erreur mise à jour statut réservation', 'error');
    }
  };

  const handleDeleteReservation = (r: Reservation) => {
    triggerDeleteConfirm(
      'Supprimer la réservation',
      'Supprimer définitivement cette réservation ? Les dates bloquées associées seront libérées.',
      `${r.vehicleName} réservé par ${r.clientName} (${r.startDate} au ${r.endDate})`,
      async () => {
        await reservationsApi.delete(r.id);
        setReservations(reservations.filter((item) => item.id !== r.id));
        showToast('Réservation supprimée définitivement', 'info');
      }
    );
  };

  // Reviews actions
  const handleApproveReview = async (id: string) => {
    await reviewsApi.approve(id);
    setReviews(reviews.map((r) => (r.id === id ? { ...r, status: 'approuve' } : r)));
    showToast('Avis approuvé et publié sur le site !', 'success');
  };

  const handleDeleteReview = (rev: Review) => {
    triggerDeleteConfirm(
      'Supprimer l\'avis client',
      'Supprimer définitivement cet avis ? Cette action est irréversible.',
      `Avis de ${rev.authorName} (${rev.rating}/5) : "${rev.comment.slice(0, 40)}..."`,
      async () => {
        await reviewsApi.delete(rev.id);
        setReviews(reviews.filter((r) => r.id !== rev.id));
        showToast('Avis supprimé avec succès', 'info');
      }
    );
  };

  // Intervention CRUD
  const handleSaveIntervention = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const targetVehicle = vehicles.find((v) => v.id === intVehicleId) || vehicles[0];
      if (editingIntervention) {
        const updated = await interventionsApi.update(editingIntervention.id, {
          vehicleName: `${targetVehicle?.brand} ${targetVehicle?.model}`,
          vehiclePlate: targetVehicle?.plate || '8492-HH-01',
          mileage: Number(intMileage),
          services: intServices.split(',').map((s) => s.trim()),
          partsChanged: intParts.split(',').map((p) => p.trim()),
          cost: Number(intCost),
          notes: intNotes,
        });
        setInterventions(interventions.map((i) => (i.id === updated.id ? updated : i)));
        showToast('Intervention mise à jour avec succès', 'success');
      } else {
        const newInv = await interventionsApi.create({
          clientId: intClientId || user.id,
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
        showToast('Intervention enregistrée et carnet d\'entretien actualisé !', 'success');
      }
      setNewInterventionModal(false);
      setEditingIntervention(null);
    } catch {
      showToast('Erreur lors de l’enregistrement de l’intervention', 'error');
    }
  };

  const handleDeleteIntervention = (inv: Intervention) => {
    triggerDeleteConfirm(
      'Supprimer l\'intervention atelier',
      'Supprimer définitivement cette intervention du registre ? Le carnet client sera actualisé.',
      `${inv.vehicleName} (${inv.vehiclePlate}) - ${inv.date} - ${formatFCFA(inv.cost)}`,
      async () => {
        await interventionsApi.delete(inv.id);
        setInterventions(interventions.filter((i) => i.id !== inv.id));
        showToast('Intervention supprimée', 'info');
      }
    );
  };

  // Part CRUD
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

  const handleDeletePart = (p: AutoPart) => {
    triggerDeleteConfirm(
      'Supprimer la pièce du catalogue',
      'Supprimer définitivement cette référence du stock ? Cette action est irréversible.',
      `${p.name} (Réf: ${p.reference}) - ${formatFCFA(p.price)}`,
      async () => {
        await partsApi.delete(p.id);
        setParts(parts.filter((item) => item.id !== p.id));
        showToast('Pièce supprimée du catalogue', 'info');
      }
    );
  };

  // Quick part stock status toggle
  const handleQuickUpdatePartStatus = async (partId: string, newStatus: StockStatus) => {
    try {
      const updated = await partsApi.update(partId, { stockStatus: newStatus });
      setParts(parts.map((p) => (p.id === partId ? updated : p)));
      showToast('Statut de stock actualisé', 'info');
    } catch {
      showToast('Erreur mise à jour stock', 'error');
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

  // Blog CRUD
  const handleSaveBlogPost = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBlog) {
        const updated = await blogApi.update(editingBlog.id, {
          title: blogTitle,
          content: blogContent,
          category: blogCategory,
          coverImage: blogCover,
        });
        setBlogPosts(blogPosts.map((b) => (b.id === updated.id ? updated : b)));
        showToast('Article modifié avec succès', 'success');
      } else {
        const created = await blogApi.savePost({
          title: blogTitle,
          content: blogContent,
          category: blogCategory,
          author: user.name,
          coverImage: blogCover,
        });
        setBlogPosts([created, ...blogPosts]);
        showToast('Article de blog publié avec succès !', 'success');
      }
      setBlogModalOpen(false);
      setEditingBlog(null);
    } catch {
      showToast('Erreur enregistrement article', 'error');
    }
  };

  const handleDeleteBlog = (post: BlogPost) => {
    triggerDeleteConfirm(
      'Supprimer l\'article de blog',
      'Supprimer définitivement cet article du site ? Cette action est irréversible.',
      `"${post.title}" (${post.category})`,
      async () => {
        await blogApi.delete(post.id);
        setBlogPosts(blogPosts.filter((b) => b.id !== post.id));
        showToast('Article supprimé avec succès', 'info');
      }
    );
  };

  // Fleet Rental CRUD
  const handleSaveFleet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingFleet) {
        const updated = await rentalsApi.update(editingFleet.id, {
          name: fleetName,
          pricePerDay: Number(fleetPricePerDay),
          deposit: Number(fleetDeposit),
          images: [fleetImage],
        });
        setFleet(fleet.map((v) => (v.id === updated.id ? updated : v)));
        showToast('Véhicule de flotte mis à jour', 'success');
      } else {
        const created = await rentalsApi.create({
          name: fleetName,
          brand: fleetBrand,
          model: fleetModel,
          year: Number(fleetYear),
          category: fleetCategory,
          seats: Number(fleetSeats),
          transmission: fleetTransmission,
          fuel: fleetFuel,
          airConditioned: true,
          pricePerDay: Number(fleetPricePerDay),
          weeklyDiscountPercent: 12,
          deposit: Number(fleetDeposit),
          images: [fleetImage],
          features: ['Climatisation', 'Bluetooth', 'GPS', 'Assurance tout risque'],
          unavailableDates: [],
        });
        setFleet([created, ...fleet]);
        showToast('Véhicule ajouté à la flotte de location', 'success');
      }
      setFleetModalOpen(false);
      setEditingFleet(null);
    } catch (err: any) {
      showToast(err.message || 'Erreur enregistrement véhicule', 'error');
    }
  };

  const handleDeleteFleet = (v: RentalVehicle) => {
    triggerDeleteConfirm(
      'Supprimer le véhicule de location',
      'Supprimer définitivement ce véhicule de la flotte ? Ses réservations archivées resteront visibles.',
      `${v.name} (${v.category}) - ${formatFCFA(v.pricePerDay)}/j`,
      async () => {
        await rentalsApi.delete(v.id);
        setFleet(fleet.filter((item) => item.id !== v.id));
        showToast('Véhicule retiré de la flotte', 'info');
      }
    );
  };

  const handleToggleBlockDate = async (vehicleId: string, dateStr: string) => {
    try {
      const updated = await rentalsApi.toggleBlockDate(vehicleId, dateStr);
      setFleet(fleet.map((v) => (v.id === vehicleId ? updated : v)));
      showToast(`Date ${dateStr} mise à jour (maintenance).`, 'info');
    } catch {
      showToast('Erreur modification date de maintenance', 'error');
    }
  };

  // Client Vehicle CRUD
  const handleSaveVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVehicle) {
        const updated = await vehiclesApi.update(editingVehicle.id, {
          mileage: Number(vehMileage),
          nextServiceMileage: Number(vehMileage) + 5000,
        });
        setVehicles(vehicles.map((v) => (v.id === updated.id ? updated : v)));
        showToast('Véhicule client mis à jour', 'success');
      } else {
        const created = await vehiclesApi.create({
          clientId: vehClientId || user.id,
          brand: vehBrand,
          model: vehModel,
          year: Number(vehYear),
          plate: vehPlate,
          mileage: Number(vehMileage),
          nextServiceMileage: Number(vehMileage) + 5000,
          lastServiceDate: 'Récemment enregistré',
        });
        setVehicles([created, ...vehicles]);
        showToast('Véhicule client enregistré au registre', 'success');
      }
      setVehicleModalOpen(false);
      setEditingVehicle(null);
    } catch (err: any) {
      showToast(err.message || 'Erreur enregistrement véhicule client', 'error');
    }
  };

  const handleDeleteVehicle = (v: ClientVehicle) => {
    triggerDeleteConfirm(
      'Supprimer le véhicule client',
      'Supprimer définitivement ce véhicule client ? Les interventions rattachées seront également supprimées.',
      `${v.brand} ${v.model} (${v.plate})`,
      async () => {
        await vehiclesApi.delete(v.id);
        setVehicles(vehicles.filter((item) => item.id !== v.id));
        showToast('Véhicule client supprimé', 'info');
      }
    );
  };

  // Gallery CRUD
  const handleSaveGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingGallery) {
        const updated = await galleryApi.update(editingGallery.id, {
          titre: galTitle,
          categorie: galCategory,
          image_url: galUrl,
          ordre: Number(galOrder),
          actif: galActive,
        });
        setGalleryItems(galleryItems.map((g) => (g.id === updated.id ? updated : g)));
        showToast('Photo de galerie mise à jour', 'success');
      } else {
        const created = await galleryApi.create({
          title: galTitle,
          category: galCategory,
          imageUrl: galUrl,
          titre: galTitle,
          categorie: galCategory,
          image_url: galUrl,
          description: '',
          ordre: Number(galOrder),
          actif: galActive,
        });
        setGalleryItems([created, ...galleryItems]);
        showToast('Photo ajoutée à la galerie publique', 'success');
      }
      setGalleryModalOpen(false);
      setEditingGallery(null);
    } catch (err: any) {
      showToast(err.message || 'Erreur enregistrement photo', 'error');
    }
  };

  const handleDeleteGallery = (g: GalleryItem) => {
    triggerDeleteConfirm(
      'Supprimer la photo de la galerie',
      'Supprimer définitivement cette photo de la galerie du site ?',
      `Photo : ${g.titre || g.title || 'Sans titre'} (${g.categorie || g.category})`,
      async () => {
        await galleryApi.delete(g.id);
        setGalleryItems(galleryItems.filter((item) => item.id !== g.id));
        showToast('Photo supprimée de la galerie', 'info');
      }
    );
  };

  const handleToggleGalleryActive = async (item: GalleryItem) => {
    try {
      const currentActive = item.actif !== undefined ? item.actif : true;
      const updated = await galleryApi.update(item.id, { actif: !currentActive });
      setGalleryItems(galleryItems.map((g) => (g.id === item.id ? updated : g)));
      showToast(`Visibilité photo : ${!currentActive ? 'Publiée' : 'Masquée'}`, 'info');
    } catch {
      showToast('Erreur mise à jour visibilité', 'error');
    }
  };

  // User Management
  const handleUpdateUserRole = async (targetUser: User, newRole: UserRole) => {
    if (targetUser.role === 'admin' && newRole !== 'admin') {
      const adminCount = usersList.filter((u) => u.role === 'admin' && (u.actif ?? true)).length;
      if (adminCount <= 1) {
        showToast('Protection : Impossible de rétrograder le dernier administrateur actif.', 'error');
        return;
      }
    }

    try {
      await usersApi.updateRole(targetUser.id, newRole);
      setUsersList(usersList.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u)));
      showToast(`Rôle de ${targetUser.name} modifié en : ${newRole.toUpperCase()}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Erreur modification de rôle', 'error');
    }
  };

  const handleToggleUserActive = async (targetUser: User) => {
    const currentActif = targetUser.actif ?? true;
    if (targetUser.role === 'admin' && currentActif) {
      const activeAdmins = usersList.filter((u) => u.role === 'admin' && (u.actif ?? true)).length;
      if (activeAdmins <= 1) {
        showToast('Protection : Vous ne pouvez pas désactiver le dernier administrateur actif.', 'error');
        return;
      }
    }

    try {
      await usersApi.toggleActive(targetUser.id, !currentActif);
      setUsersList(usersList.map((u) => (u.id === targetUser.id ? { ...u, actif: !currentActif } : u)));
      showToast(`Compte de ${targetUser.name} ${!currentActif ? 'activé' : 'désactivé'}`, 'info');
    } catch (err: any) {
      showToast(err.message || 'Erreur modification statut compte', 'error');
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingStaff(true);
    try {
      const res = await usersApi.createStaff({
        email: staffEmail,
        password: staffPassword,
        nom: staffName,
        telephone: staffPhone,
        role: staffRole,
      });

      showToast(res.message, 'success');
      setStaffModalOpen(false);
      setStaffName('');
      setStaffEmail('');
      setStaffPassword('');
      setStaffPhone('');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Erreur création compte personnel', 'error');
    } finally {
      setCreatingStaff(false);
    }
  };

  // Navigation Items
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
    { id: 'gallery', label: 'Galerie Photos', icon: <ImageIcon className="w-4 h-4" />, adminOnly: true },
    { id: 'users', label: 'Utilisateurs & Équipe', icon: <Users className="w-4 h-4 text-indigo-600" />, adminOnly: true },
    { id: 'settings', label: 'Paramètres Entreprise', icon: <Building2 className="w-4 h-4 text-[#D62828]" />, adminOnly: true },
    { id: 'audit', label: 'Journal d\'Activité', icon: <History className="w-4 h-4 text-emerald-600" />, adminOnly: true },
    { id: 'stats', label: 'Statistiques & KPIs', icon: <BarChart3 className="w-4 h-4" />, adminOnly: true },
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
                      Rendez-vous atelier
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

              {/* Raccourcis sur le tableau de bord (Requis Mission 2.5) */}
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
                <h3 className="font-heading font-bold text-base text-slate-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#1B2A6B]" />
                  Raccourcis d'Administration Rapide
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('settings')}
                    className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors flex flex-col gap-2 group cursor-pointer"
                  >
                    <Building2 className="w-5 h-5 text-[#D62828] group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-slate-800">Infos Entreprise</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingPart(null);
                      setPartName('');
                      setPartRef('');
                      setPartPrice(25000);
                      setPartQuantity(5);
                      setPartModalOpen(true);
                    }}
                    className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors flex flex-col gap-2 group cursor-pointer"
                  >
                    <Package className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-slate-800">+ Ajouter une pièce</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingFleet(null);
                      setFleetName('');
                      setFleetBrand('Toyota');
                      setFleetModel('');
                      setFleetPricePerDay(45000);
                      setFleetDeposit(150000);
                      setFleetModalOpen(true);
                    }}
                    className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors flex flex-col gap-2 group cursor-pointer"
                  >
                    <Car className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-slate-800">+ Véhicule à louer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingBlog(null);
                      setBlogTitle('');
                      setBlogContent('');
                      setBlogModalOpen(true);
                    }}
                    className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors flex flex-col gap-2 group cursor-pointer"
                  >
                    <BookOpen className="w-5 h-5 text-amber-600 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-slate-800">Publier un article</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('audit')}
                    className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors flex flex-col gap-2 group cursor-pointer"
                  >
                    <History className="w-5 h-5 text-[#1B2A6B] group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-slate-800">Journal d'activité</span>
                  </button>
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

                      <div className="flex items-center gap-2">
                        {em.status === 'demande_envoyee' && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleTakeEmergency(em.id)}
                          >
                            Je prends en charge
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 className="w-4 h-4 text-rose-500" />}
                          onClick={() => handleDeleteEmergency(em)}
                        />
                      </div>
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
                    Changez le statut en 1 clic ou supprimez les demandes obsolètes
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

                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 className="w-4 h-4 text-rose-500" />}
                          onClick={() => handleDeleteEmergency(em)}
                          title="Supprimer définitivement"
                        />
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
                        <select
                          value={q.status}
                          onChange={(e) =>
                            handleChangeQuoteStatus(q.id, e.target.value as any)
                          }
                          className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white"
                        >
                          <option value="nouveau">Nouveau</option>
                          <option value="en_cours">En cours</option>
                          <option value="traite">Traité</option>
                        </select>

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
                            WhatsApp
                          </Button>
                        </a>

                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 className="w-4 h-4 text-rose-500" />}
                          onClick={() => handleDeleteQuote(q)}
                          title="Supprimer définitivement"
                        />
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
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold font-heading text-slate-900">
                    Parc des Véhicules Clients ({vehicles.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ajoutez, modifiez ou supprimez des véhicules au carnet numérique
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() => {
                    setEditingVehicle(null);
                    setVehBrand('Toyota');
                    setVehModel('');
                    setVehPlate('');
                    setVehMileage(60000);
                    setVehicleModalOpen(true);
                  }}
                >
                  Ajouter un véhicule
                </Button>
              </div>

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
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setIntVehicleId(v.id);
                            setEditingIntervention(null);
                            setNewInterventionModal(true);
                          }}
                        >
                          + Intervention
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={<Edit className="w-3.5 h-3.5 text-blue-600" />}
                          onClick={() => {
                            setEditingVehicle(v);
                            setVehBrand(v.brand);
                            setVehModel(v.model);
                            setVehYear(v.year);
                            setVehPlate(v.plate);
                            setVehMileage(v.mileage);
                            setVehicleModalOpen(true);
                          }}
                          title="Modifier"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                          onClick={() => handleDeleteVehicle(v)}
                          title="Supprimer"
                        />
                      </div>
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
                    Registre des Interventions Atelier ({interventions.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Enregistrez les travaux réalisés pour mettre à jour l'historique client
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() => {
                    setEditingIntervention(null);
                    setIntServices('Vidange rapide 15 min, Contrôle freinage');
                    setIntParts('Filtre huile d’origine, Huile 5W30 (5L)');
                    setIntCost(35000);
                    setNewInterventionModal(true);
                  }}
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

                      <div className="flex items-center gap-3">
                        <span className="text-base font-extrabold text-[#1B2A6B]">
                          {formatFCFA(inv.cost)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Edit className="w-3.5 h-3.5 text-blue-600" />}
                          onClick={() => {
                            setEditingIntervention(inv);
                            setIntMileage(inv.mileage);
                            setIntServices(inv.services.join(', '));
                            setIntParts(inv.partsChanged.join(', '));
                            setIntCost(inv.cost);
                            setIntNotes(inv.notes || '');
                            setNewInterventionModal(true);
                          }}
                          title="Modifier l'intervention"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                          onClick={() => handleDeleteIntervention(inv)}
                          title="Supprimer définitivement"
                        />
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                      <p>
                        <strong>Prestations :</strong> {inv.services.join(', ')}
                      </p>
                      <p>
                        <strong>Fournitures / Pièces :</strong> {inv.partsChanged.join(', ')}
                      </p>
                      {inv.notes && <p className="text-slate-500 italic mt-1">« {inv.notes} »</p>}
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
                    Flotte de Location & Calendrier ({fleet.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ajoutez, modifiez ou bloquez des dates de maintenance
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() => {
                    setEditingFleet(null);
                    setFleetName('');
                    setFleetBrand('Toyota');
                    setFleetModel('');
                    setFleetPricePerDay(45000);
                    setFleetDeposit(150000);
                    setFleetModalOpen(true);
                  }}
                >
                  Ajouter un véhicule
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {fleet.map((v) => (
                  <div
                    key={v.id}
                    className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4"
                  >
                    <div className="flex items-center justify-between gap-4">
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

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Edit className="w-3.5 h-3.5 text-blue-600" />}
                          onClick={() => {
                            setEditingFleet(v);
                            setFleetName(v.name);
                            setFleetPricePerDay(v.pricePerDay);
                            setFleetDeposit(v.deposit);
                            setFleetImage(v.images[0] || '');
                            setFleetModalOpen(true);
                          }}
                          title="Modifier véhicule"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                          onClick={() => handleDeleteFleet(v)}
                          title="Supprimer véhicule"
                        />
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
                                className="hover:text-red-900 font-bold ml-1 cursor-pointer"
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
                          Clés remises (En cours)
                        </Button>
                      )}

                      {r.status === 'en_cours' && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleChangeReservationStatus(r.id, 'terminee')}
                        >
                          Restitué (Terminée)
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 className="w-4 h-4 text-rose-500" />}
                        onClick={() => handleDeleteReservation(r)}
                        title="Supprimer la réservation"
                      />
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
                    Ajoutez, modifiez ou supprimez des références au catalogue
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<Upload className="w-4 h-4" />}
                    onClick={handleSimulateCsvImport}
                  >
                    Importer CSV
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
                      render: (p: AutoPart) => (
                        <select
                          value={p.stockStatus}
                          onChange={(e) => handleQuickUpdatePartStatus(p.id, e.target.value as StockStatus)}
                          className="text-xs font-semibold px-2 py-1 rounded-lg border border-slate-200 bg-white"
                        >
                          <option value="in_stock">En stock</option>
                          <option value="low_stock">Stock faible</option>
                          <option value="out_of_stock">Rupture</option>
                        </select>
                      ),
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
                        <div className="flex items-center gap-1.5">
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
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                            onClick={() => handleDeletePart(p)}
                            title="Supprimer"
                          />
                        </div>
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
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold font-heading text-slate-900">
                    Modération des Avis Clients ({reviews.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Approuvez, ajoutez ou supprimez les avis publiés
                  </p>
                </div>
              </div>

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
                        onClick={() => handleDeleteReview(rev)}
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
                    Publiez, modifiez ou supprimez des conseils d'entretien
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() => {
                    setEditingBlog(null);
                    setBlogTitle('');
                    setBlogContent('');
                    setBlogModalOpen(true);
                  }}
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
                    <div className="flex items-center gap-2">
                      <Badge variant={post.status === 'publie' ? 'success' : 'default'}>
                        {post.status === 'publie' ? 'Publié' : 'Brouillon'}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<Edit className="w-3.5 h-3.5 text-blue-600" />}
                        onClick={() => {
                          setEditingBlog(post);
                          setBlogTitle(post.title);
                          setBlogContent(post.content);
                          setBlogCategory(post.category);
                          setBlogModalOpen(true);
                        }}
                        title="Modifier l'article"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                        onClick={() => handleDeleteBlog(post)}
                        title="Supprimer l'article"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 10: GALERIE PHOTOS */}
          {activeTab === 'gallery' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold font-heading text-slate-900">
                    Galerie Photos de l'Atelier ({galleryItems.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Gérez les réalisations, bancs d'essai et installations visibles sur le site
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() => {
                    setEditingGallery(null);
                    setGalTitle('');
                    setGalUrl('https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&auto=format&fit=crop&q=80');
                    setGalCategory('Atelier & Équipements');
                    setGalleryModalOpen(true);
                  }}
                >
                  Ajouter une photo
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {galleryItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between"
                  >
                    <div className="relative aspect-video bg-slate-900">
                      <img
                        src={item.image_url || item.imageUrl || ''}
                        alt={item.titre || item.title || ''}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 left-2 text-[10px] bg-black/70 text-white font-semibold px-2 py-0.5 rounded-full backdrop-blur-xs">
                        {item.categorie || item.category}
                      </span>
                    </div>

                    <div className="p-4 space-y-2">
                      <h4 className="font-bold text-sm text-slate-900 truncate">
                        {item.titre || item.title || 'Photo atelier'}
                      </h4>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <button
                          type="button"
                          onClick={() => handleToggleGalleryActive(item)}
                          className={`font-semibold text-xs px-2 py-0.5 rounded cursor-pointer ${
                            item.actif !== false
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {item.actif !== false ? 'Actif' : 'Masqué'}
                        </button>

                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={<Edit className="w-3.5 h-3.5 text-blue-600" />}
                            onClick={() => {
                              setEditingGallery(item);
                              setGalTitle(item.titre || item.title || '');
                              setGalCategory(item.categorie || item.category || 'Atelier');
                              setGalUrl(item.image_url || item.imageUrl || '');
                              setGalleryModalOpen(true);
                            }}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                            onClick={() => handleDeleteGallery(item)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 11: GESTION DES UTILISATEURS & ÉQUIPE */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold font-heading text-slate-900 flex items-center gap-2">
                    <Users className="w-6 h-6 text-indigo-600" />
                    Utilisateurs & Gestion de l'Équipe ({usersList.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Gérez les rôles (admin, mécanicien, client), activez/désactivez des comptes ou créez des accès personnel
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  icon={<UserPlus className="w-4 h-4" />}
                  onClick={() => setStaffModalOpen(true)}
                >
                  Créer un compte personnel
                </Button>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
                <Table
                  columns={[
                    {
                      header: 'Utilisateur',
                      render: (u: User) => (
                        <div>
                          <p className="font-bold text-slate-900 text-xs sm:text-sm">{u.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{u.email}</p>
                          {u.phone && <p className="text-[10px] text-slate-500">📞 {u.phone}</p>}
                        </div>
                      ),
                    },
                    {
                      header: 'Rôle Système',
                      render: (u: User) => (
                        <select
                          value={u.role}
                          onChange={(e) => handleUpdateUserRole(u, e.target.value as UserRole)}
                          className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white cursor-pointer"
                        >
                          <option value="client">Client</option>
                          <option value="mecanicien">Mécanicien</option>
                          <option value="receptionniste">Réceptionniste</option>
                          <option value="admin">Administrateur</option>
                        </select>
                      ),
                    },
                    {
                      header: 'État Compte',
                      render: (u: User) => {
                        const isActif = u.actif ?? true;
                        return (
                          <button
                            type="button"
                            onClick={() => handleToggleUserActive(u)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold cursor-pointer transition-colors ${
                              isActif
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            }`}
                          >
                            {isActif ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                            {isActif ? 'Actif' : 'Désactivé'}
                          </button>
                        );
                      },
                    },
                    {
                      header: 'Actions',
                      render: (u: User) => (
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                            onClick={() => {
                              triggerDeleteConfirm(
                                'Supprimer le profil utilisateur',
                                'Supprimer définitivement ce compte ? Les données rattachées seront archivées ou supprimées.',
                                `${u.name} (${u.email}) - Rôle : ${u.role}`,
                                async () => {
                                  await usersApi.deleteUser(u.id);
                                  setUsersList(usersList.filter((item) => item.id !== u.id));
                                  showToast('Utilisateur supprimé', 'info');
                                }
                              );
                            }}
                            title="Supprimer compte"
                          />
                        </div>
                      ),
                    },
                  ]}
                  data={usersList}
                  keyExtractor={(u) => u.id}
                />
              </div>
            </div>
          )}

          {/* TAB 12: INFORMATIONS DE L'ENTREPRISE (SITE_SETTINGS) */}
          {activeTab === 'settings' && (
            <CompanySettingsTab />
          )}

          {/* TAB 13: JOURNAL D'ACTIVITÉ & AUDIT */}
          {activeTab === 'audit' && (
            <AuditLogTab />
          )}

          {/* TAB 14: STATISTIQUES & CHARTS */}
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
        </main>
      </div>

      {/* =========================================================================
         CONFIRMATION DIALOG DE SUPPRESSION (Requis 2.1)
         ========================================================================= */}
      {deleteConfirm.isOpen && (
        <Modal
          isOpen={true}
          onClose={() => setDeleteConfirm((prev) => ({ ...prev, isOpen: false }))}
          title={deleteConfirm.title}
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-red-600 text-white shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-bold text-slate-900 text-sm">Attention : Action irréversible</p>
                <p className="text-slate-600">{deleteConfirm.message}</p>
                {deleteConfirm.itemDescription && (
                  <div className="mt-2 p-2 rounded-lg bg-white border border-rose-200 font-mono text-[11px] text-slate-800">
                    {deleteConfirm.itemDescription}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirm((prev) => ({ ...prev, isOpen: false }))}
                disabled={deleteConfirm.loading}
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={<Trash2 className="w-4 h-4" />}
                loading={deleteConfirm.loading}
                onClick={deleteConfirm.onConfirm}
              >
                Supprimer définitivement
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* =========================================================================
         MODALS CRUD
         ========================================================================= */}

      {/* 1. MODAL: INTERVENTION */}
      <Modal
        isOpen={newInterventionModal}
        onClose={() => {
          setNewInterventionModal(false);
          setEditingIntervention(null);
        }}
        title={editingIntervention ? 'Modifier l\'intervention' : 'Enregistrer une Intervention Atelier'}
        subtitle="Mise à jour automatique du carnet d'entretien client"
      >
        <form onSubmit={handleSaveIntervention} className="space-y-4">
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
            {editingIntervention ? 'Enregistrer les modifications' : 'Valider l\'intervention'}
          </Button>
        </form>
      </Modal>

      {/* 2. MODAL: PIÈCE */}
      <Modal
        isOpen={partModalOpen}
        onClose={() => {
          setPartModalOpen(false);
          setEditingPart(null);
        }}
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
            {editingPart ? 'Enregistrer les modifications' : 'Enregistrer la référence'}
          </Button>
        </form>
      </Modal>

      {/* 3. MODAL: ARTICLE BLOG */}
      <Modal
        isOpen={blogModalOpen}
        onClose={() => {
          setBlogModalOpen(false);
          setEditingBlog(null);
        }}
        title={editingBlog ? 'Modifier l\'article de blog' : 'Rédiger un Article de Blog'}
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
              URL Image de couverture
            </label>
            <input
              type="url"
              value={blogCover}
              onChange={(e) => setBlogCover(e.target.value)}
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
            {editingBlog ? 'Enregistrer les modifications' : 'Publier l\'article'}
          </Button>
        </form>
      </Modal>

      {/* 4. MODAL: VÉHICULE CLIENT */}
      <Modal
        isOpen={vehicleModalOpen}
        onClose={() => {
          setVehicleModalOpen(false);
          setEditingVehicle(null);
        }}
        title={editingVehicle ? 'Modifier le véhicule client' : 'Ajouter un Véhicule Client'}
      >
        <form onSubmit={handleSaveVehicle} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Marque <span className="text-[#D62828]">*</span>
              </label>
              <input
                type="text"
                required
                value={vehBrand}
                onChange={(e) => setVehBrand(e.target.value)}
                placeholder="Ex: Toyota"
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Modèle <span className="text-[#D62828]">*</span>
              </label>
              <input
                type="text"
                required
                value={vehModel}
                onChange={(e) => setVehModel(e.target.value)}
                placeholder="Ex: Hilux"
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Immatriculation (Plaque) <span className="text-[#D62828]">*</span>
              </label>
              <input
                type="text"
                required
                value={vehPlate}
                onChange={(e) => setVehPlate(e.target.value)}
                placeholder="Ex: 8492-HH-01"
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Année
              </label>
              <input
                type="number"
                value={vehYear}
                onChange={(e) => setVehYear(Number(e.target.value))}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kilométrage actuel (km)
            </label>
            <input
              type="number"
              value={vehMileage}
              onChange={(e) => setVehMileage(Number(e.target.value))}
              className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300"
            />
          </div>

          <Button type="submit" variant="primary" className="w-full font-bold text-xs uppercase">
            {editingVehicle ? 'Enregistrer les modifications' : 'Enregistrer le véhicule'}
          </Button>
        </form>
      </Modal>

      {/* 5. MODAL: VÉHICULE DE FLOTTE (LOCATION) */}
      <Modal
        isOpen={fleetModalOpen}
        onClose={() => {
          setFleetModalOpen(false);
          setEditingFleet(null);
        }}
        title={editingFleet ? 'Modifier le véhicule de flotte' : 'Ajouter un Véhicule de Location'}
      >
        <form onSubmit={handleSaveFleet} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nom complet du modèle <span className="text-[#D62828]">*</span>
            </label>
            <input
              type="text"
              required
              value={fleetName}
              onChange={(e) => setFleetName(e.target.value)}
              placeholder="Ex: Toyota Land Cruiser Prado TXL"
              className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tarif / jour (FCFA) <span className="text-[#D62828]">*</span>
              </label>
              <input
                type="number"
                required
                value={fleetPricePerDay}
                onChange={(e) => setFleetPricePerDay(Number(e.target.value))}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 font-bold text-[#1B2A6B]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Caution requise (FCFA)
              </label>
              <input
                type="number"
                value={fleetDeposit}
                onChange={(e) => setFleetDeposit(Number(e.target.value))}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              URL Photo principale
            </label>
            <input
              type="url"
              value={fleetImage}
              onChange={(e) => setFleetImage(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300"
            />
          </div>

          <Button type="submit" variant="primary" className="w-full font-bold text-xs uppercase">
            {editingFleet ? 'Enregistrer les modifications' : 'Ajouter à la flotte'}
          </Button>
        </form>
      </Modal>

      {/* 6. MODAL: GALERIE PHOTO */}
      <Modal
        isOpen={galleryModalOpen}
        onClose={() => {
          setGalleryModalOpen(false);
          setEditingGallery(null);
        }}
        title={editingGallery ? 'Modifier la photo' : 'Ajouter une photo à la Galerie'}
      >
        <form onSubmit={handleSaveGallery} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Titre de la réalisation / installation <span className="text-[#D62828]">*</span>
            </label>
            <input
              type="text"
              required
              value={galTitle}
              onChange={(e) => setGalTitle(e.target.value)}
              placeholder="Ex: Pont élévateur et banc de diagnostic 3D"
              className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catégorie
            </label>
            <select
              value={galCategory}
              onChange={(e) => setGalCategory(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 bg-white"
            >
              <option value="Atelier & Équipements">Atelier & Équipements</option>
              <option value="Mécanique Générale">Mécanique Générale</option>
              <option value="Diagnostic Électronique">Diagnostic Électronique</option>
              <option value="Tôlerie & Peinture">Tôlerie & Peinture</option>
              <option value="Flotte de Véhicules">Flotte de Véhicules</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              URL de l'image (haute résolution) <span className="text-[#D62828]">*</span>
            </label>
            <input
              type="url"
              required
              value={galUrl}
              onChange={(e) => setGalUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300"
            />
          </div>

          <Button type="submit" variant="primary" className="w-full font-bold text-xs uppercase">
            {editingGallery ? 'Enregistrer les modifications' : 'Ajouter la photo'}
          </Button>
        </form>
      </Modal>

      {/* 7. MODAL: CRÉER COMPTE PERSONNEL (Requis Mission 2.3) */}
      <Modal
        isOpen={staffModalOpen}
        onClose={() => setStaffModalOpen(false)}
        title="Créer un compte membre du personnel"
        subtitle="Création sécurisée avec privilèges d'accès à l'atelier"
      >
        <form onSubmit={handleCreateStaff} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nom complet <span className="text-[#D62828]">*</span>
            </label>
            <input
              type="text"
              required
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              placeholder="Ex: Kouamé Jean-Baptiste"
              className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Adresse email professionnelle <span className="text-[#D62828]">*</span>
            </label>
            <input
              type="email"
              required
              value={staffEmail}
              onChange={(e) => setStaffEmail(e.target.value)}
              placeholder="jean.kouame@officina-djeneka.ci"
              className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Numéro de téléphone
            </label>
            <input
              type="tel"
              value={staffPhone}
              onChange={(e) => setStaffPhone(e.target.value)}
              placeholder="+225 07 00 00 00 00"
              className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rôle attribué <span className="text-[#D62828]">*</span>
              </label>
              <select
                value={staffRole}
                onChange={(e) => setStaffRole(e.target.value as any)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 bg-white"
              >
                <option value="mecanicien">Mécanicien (Atelier)</option>
                <option value="admin">Administrateur (Complet)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mot de passe temporaire <span className="text-[#D62828]">*</span>
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={staffPassword}
                onChange={(e) => setStaffPassword(e.target.value)}
                placeholder="Minimum 8 caractères"
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full font-bold text-xs uppercase"
            loading={creatingStaff}
          >
            Créer le compte collaborateur
          </Button>
        </form>
      </Modal>
    </div>
  );
};
