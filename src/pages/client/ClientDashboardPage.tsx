import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  ClientVehicle,
  Intervention,
  Reservation,
  EmergencyRequest,
  QuoteRequest,
} from '../../types';
import {
  vehiclesApi,
  interventionsApi,
  reservationsApi,
  emergencyApi,
  quotesApi,
} from '../../services/api';
import { formatFCFA, formatDateFR } from '../../utils/format';
import { Timeline } from '../../components/common/Timeline';
import { StatusPill } from '../../components/common/StatusPill';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { QuoteModal } from '../../components/services/QuoteModal';
import {
  LayoutDashboard,
  Car,
  History,
  Calendar,
  FileQuestion,
  User,
  Plus,
  AlertTriangle,
  ArrowRight,
  Shield,
  Gauge,
  Phone,
  Bell,
  CheckCircle,
  Wrench,
  Download,
  XCircle,
} from 'lucide-react';

export const ClientDashboardPage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'vehicles' | 'history' | 'reservations' | 'demands' | 'profile'
  >('dashboard');

  // Client Data
  const [vehicles, setVehicles] = useState<ClientVehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [demands, setDemands] = useState<{
    emergencies: EmergencyRequest[];
    quotes: QuoteRequest[];
  }>({ emergencies: [], quotes: [] });
  const [loading, setLoading] = useState(true);

  // Add Vehicle Modal
  const [addVehicleModal, setAddVehicleModal] = useState(false);
  const [newBrand, setNewBrand] = useState('Toyota');
  const [newModel, setNewModel] = useState('');
  const [newYear, setNewYear] = useState<number>(2020);
  const [newPlate, setNewPlate] = useState('');
  const [newMileage, setNewMileage] = useState<number>(50000);

  // Quote Modal Shortcut
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);

  // Profile Form state
  const [profName, setProfName] = useState(user?.name || '');
  const [profPhone, setProfPhone] = useState(user?.phone || '');
  const [profAddress, setProfAddress] = useState(user?.address || '');
  const [profNotifyEmail, setProfNotifyEmail] = useState(user?.notifyEmail ?? true);
  const [profNotifyWhatsapp, setProfNotifyWhatsapp] = useState(user?.notifyWhatsapp ?? true);
  const [savingProfile, setSavingProfile] = useState(false);

  // Data loader
  useEffect(() => {
    if (user) {
      loadClientData();
    }
  }, [user]);

  // Load client data
  const loadClientData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const vList = await vehiclesApi.getByClientId(user.id);
      setVehicles(vList);

      if (vList.length > 0) {
        setSelectedVehicleId(vList[0].id);
        const invs = await interventionsApi.getByVehicleId(vList[0].id);
        setInterventions(invs);
      } else {
        setSelectedVehicleId('');
        setInterventions([]);
      }

      // Reservations du client connecté
      const myReservations = await reservationsApi.getByUserId(user.id);
      setReservations(myReservations);

      // Demandes SOS et Devis du client
      const allEm = await emergencyApi.getAll();
      const allQu = await quotesApi.getAll();
      const myEm = allEm.filter(
        (e) => (user.phone && e.clientPhone.includes(user.phone.slice(-8))) || e.clientName === user.name
      );
      const myQu = allQu.filter(
        (q) => q.clientEmail === user.email || (user.phone && q.clientPhone.includes(user.phone.slice(-8))) || q.clientName === user.name
      );

      setDemands({
        emergencies: myEm,
        quotes: myQu,
      });
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientData();
  }, [user]);

  // When vehicle selected for history
  const handleSelectHistoryVehicle = async (vehId: string) => {
    setSelectedVehicleId(vehId);
    const invs = await interventionsApi.getByVehicleId(vehId);
    setInterventions(invs);
  };

  // Add vehicle action
  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrand || !newModel || !newPlate) {
      showToast('Veuillez remplir les informations obligatoires.', 'error');
      return;
    }

    try {
      const added = await vehiclesApi.addVehicle({
        clientId: user?.id || 'user-client-1',
        brand: newBrand,
        model: newModel,
        year: newYear,
        plate: newPlate.toUpperCase(),
        mileage: Number(newMileage),
        nextServiceMileage: Number(newMileage) + 7000,
        lastServiceDate: 'Récemment enregistré',
        photoUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=400&auto=format&fit=crop&q=80',
      });

      setVehicles([...vehicles, added]);
      setAddVehicleModal(false);
      showToast(`Le véhicule ${added.brand} ${added.model} a été ajouté avec succès !`, 'success');
      // Reset
      setNewModel('');
      setNewPlate('');
    } catch {
      showToast('Erreur lors de l’ajout du véhicule.', 'error');
    }
  };

  // Cancel reservation safely without blocking confirm
  const handleCancelReservation = async (resId: string) => {
    try {
      const updated = await reservationsApi.cancel(resId);
      setReservations(reservations.map((r) => (r.id === resId ? updated : r)));
      showToast('Réservation annulée avec succès.', 'info');
    } catch {
      showToast('Erreur lors de l’annulation.', 'error');
    }
  };

  // Update Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingProfile(true);
      await updateProfile({
        name: profName,
        phone: profPhone,
        address: profAddress,
        notifyEmail: profNotifyEmail,
        notifyWhatsapp: profNotifyWhatsapp,
      });
    } finally {
      setSavingProfile(false);
    }
  };

  if (!user) {
    return (
      <div className="py-20 text-center max-w-md mx-auto px-4 space-y-4">
        <User className="w-16 h-16 text-[#1B2A6B] mx-auto opacity-70" />
        <h2 className="text-2xl font-bold font-heading text-slate-900">Espace Client Sécurisé</h2>
        <p className="text-sm text-slate-500">
          Connectez-vous pour consulter vos véhicules, vos devis et votre historique d'entretien.
        </p>
        <Link to="/connexion">
          <Button variant="primary" size="lg" className="w-full">
            Se connecter à mon compte
          </Button>
        </Link>
      </div>
    );
  }

  const currentVehicleObj = vehicles.find((v) => v.id === selectedVehicleId) || vehicles[0];

  const navItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'vehicles', label: 'Mes véhicules', icon: <Car className="w-4 h-4" />, count: vehicles.length },
    { id: 'history', label: 'Historique entretien', icon: <History className="w-4 h-4" /> },
    { id: 'reservations', label: 'Mes réservations', icon: <Calendar className="w-4 h-4" />, count: reservations.length },
    { id: 'demands', label: 'Mes demandes', icon: <FileQuestion className="w-4 h-4" /> },
    { id: 'profile', label: 'Mon profil', icon: <User className="w-4 h-4" /> },
  ];

  return (
    <div className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Client Header Welcome */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#1B2A6B] text-white flex items-center justify-center font-heading font-extrabold text-2xl shadow-sm">
            {user.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold font-heading text-slate-900">
                Bonjour, {user.name}
              </h1>
              <Badge variant="navy">Espace Client</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {user.email} • {user.phone}
            </p>
          </div>
        </div>

        {/* Quick Top Actions */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="danger"
            size="sm"
            onClick={() => setQuoteModalOpen(true)}
            icon={<Wrench className="w-4 h-4" />}
          >
            Prendre rendez-vous
          </Button>
          <Link to="/depannage">
            <Button
              variant="outline"
              size="sm"
              icon={<AlertTriangle className="w-4 h-4 text-[#D62828]" />}
            >
              Dépannage SOS
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Grid: Sidebar + Active Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Navigation Sidebar (Desktop) / Mobile horizontal scroll */}
        <aside className="lg:col-span-3 bg-white rounded-3xl p-3 sm:p-4 border border-slate-200/90 shadow-xs">
          <div className="flex lg:flex-col gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {navItems.map((item) => (
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
                {item.count !== undefined && item.count > 0 && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      activeTab === item.id
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </aside>

        {/* Content Area */}
        <main className="lg:col-span-9 space-y-6">
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Top 3 KPI blocks */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 1. Next Service */}
                <Card className="border-l-4 border-l-[#1B2A6B]">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Prochaine Échéance
                  </span>
                  <div className="mt-2">
                    <p className="text-lg font-bold text-slate-900 truncate">
                      {currentVehicleObj?.brand} {currentVehicleObj?.model}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Vidange prévue à{' '}
                      <strong className="text-[#1B2A6B]">
                        {currentVehicleObj?.nextServiceMileage.toLocaleString('fr-FR')} km
                      </strong>
                    </p>
                  </div>
                </Card>

                {/* 2. Last Intervention */}
                <Card className="border-l-4 border-l-emerald-500">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Dernière Révision
                  </span>
                  <div className="mt-2">
                    <p className="text-lg font-bold text-slate-900 truncate">
                      {interventions[0]?.services[0] || 'Vidange & filtres'}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Effectuée le {interventions[0]?.date || '12 Septembre 2026'}
                    </p>
                  </div>
                </Card>

                {/* 3. Upcoming Rental */}
                <Card className="border-l-4 border-l-[#D62828]">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Réservation à Venir
                  </span>
                  <div className="mt-2">
                    {reservations.length > 0 ? (
                      <>
                        <p className="text-lg font-bold text-slate-900 truncate">
                          {reservations[0].vehicleName}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Du {reservations[0].startDate} au {reservations[0].endDate}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-slate-400 pt-1">Aucune réservation active</p>
                    )}
                  </div>
                </Card>
              </div>

              {/* Maintenance summary for current vehicle */}
              {currentVehicleObj && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold font-heading text-slate-900">
                      Suivi du véhicule principal : {currentVehicleObj.brand} {currentVehicleObj.model} ({currentVehicleObj.plate})
                    </h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActiveTab('history')}
                    >
                      Voir historique complet
                    </Button>
                  </div>

                  <Timeline
                    interventions={interventions.slice(0, 2)}
                    currentMileage={currentVehicleObj.mileage}
                    nextServiceMileage={currentVehicleObj.nextServiceMileage}
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MES VÉHICULES */}
          {activeTab === 'vehicles' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold font-heading text-slate-900">
                    Mes Véhicules Enregistrés ({vehicles.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Consultez l'état mécanique et les révisions de chacun de vos véhicules
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() => setAddVehicleModal(true)}
                >
                  Ajouter un véhicule
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {vehicles.map((veh) => (
                  <div
                    key={veh.id}
                    className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-shadow space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className="text-xs font-mono font-bold bg-slate-100 px-2.5 py-1 rounded-md text-slate-700">
                          {veh.plate}
                        </span>
                        <h4 className="text-lg font-bold font-heading text-slate-900 pt-1">
                          {veh.brand} {veh.model}
                        </h4>
                        <p className="text-xs text-slate-400">Année {veh.year}</p>
                      </div>

                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1B2A6B] flex items-center justify-center font-bold">
                        <Car className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <div>
                        <span className="text-slate-400 block">Kilométrage</span>
                        <span className="font-bold text-[#1B2A6B] text-sm">
                          {veh.mileage.toLocaleString('fr-FR')} km
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Prochaine vidange</span>
                        <span className="font-bold text-emerald-700 text-sm">
                          {veh.nextServiceMileage.toLocaleString('fr-FR')} km
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <span className="text-slate-400">Dernier passage : {veh.lastServiceDate}</span>
                      <button
                        onClick={() => {
                          handleSelectHistoryVehicle(veh.id);
                          setActiveTab('history');
                        }}
                        className="font-bold text-[#1B2A6B] hover:underline cursor-pointer"
                      >
                        Voir historique →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: HISTORIQUE D'ENTRETIEN */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold font-heading text-slate-900">
                    Historique Chronologique d'Entretien
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sélectionnez un véhicule pour afficher sa frise complète de maintenance
                  </p>
                </div>

                {/* Vehicle selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">Véhicule :</span>
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => handleSelectHistoryVehicle(e.target.value)}
                    className="text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] bg-white font-medium"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.brand} {v.model} ({v.plate})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {currentVehicleObj && (
                <Timeline
                  interventions={interventions}
                  currentMileage={currentVehicleObj.mileage}
                  nextServiceMileage={currentVehicleObj.nextServiceMileage}
                />
              )}
            </div>
          )}

          {/* TAB 4: MES RÉSERVATIONS */}
          {activeTab === 'reservations' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold font-heading text-slate-900">
                    Mes Réservations de Véhicules ({reservations.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Suivez le statut de validation de vos locations
                  </p>
                </div>
                <Link to="/location">
                  <Button variant="danger" size="sm">
                    Louer un véhicule
                  </Button>
                </Link>
              </div>

              {reservations.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-200">
                  <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-700">Aucune réservation pour le moment</p>
                  <p className="text-xs text-slate-400 mt-1">Consultez notre flotte de SUV et berlines disponibles à Bingerville.</p>
                  <Link to="/location" className="inline-block mt-4">
                    <Button variant="primary" size="sm">
                      Explorer la flotte
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {reservations.map((res) => (
                    <div
                      key={res.id}
                      className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4">
                        {res.vehicleImage && (
                          <img
                            src={res.vehicleImage}
                            alt={res.vehicleName}
                            className="w-20 h-16 rounded-2xl object-cover bg-slate-100 shrink-0"
                          />
                        )}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-base text-slate-900">{res.vehicleName}</h4>
                            <StatusPill status={res.status} type="reservation" />
                          </div>
                          <p className="text-xs text-slate-500">
                            Période : Du <strong>{res.startDate}</strong> au <strong>{res.endDate}</strong> ({res.totalDays} jour(s))
                          </p>
                          <p className="text-xs text-slate-400">
                            Caution : {formatFCFA(res.deposit)} • Paiement sur place
                          </p>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 gap-2">
                        <span className="text-lg font-extrabold text-[#1B2A6B]">
                          {formatFCFA(res.totalPrice)}
                        </span>

                        {['en_attente', 'confirmee'].includes(res.status) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelReservation(res.id)}
                            className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                          >
                            Annuler
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: MES DEMANDES (DEVIS & DÉPANNAGES) */}
          {activeTab === 'demands' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold font-heading text-slate-900">
                Mes Demandes d'Intervention & Devis
              </h3>

              {/* Quotes */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                  Demandes de Devis ({demands.quotes.length})
                </h4>
                {demands.quotes.map((q) => (
                  <div
                    key={q.id}
                    className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{q.serviceName}</span>
                        <StatusPill status={q.status} type="quote" />
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Véhicule : {q.vehicleInfo}</p>
                      <p className="text-xs text-slate-400 italic mt-0.5">« {q.message} »</p>
                    </div>
                    <span className="text-xs text-slate-400">{formatDateFR(q.createdAt)}</span>
                  </div>
                ))}
              </div>

              {/* Emergencies */}
              <div className="space-y-3 pt-4">
                <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide">
                  Demandes de Dépannage Récentes ({demands.emergencies.length})
                </h4>
                {demands.emergencies.map((e) => (
                  <div
                    key={e.id}
                    className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          Panne : {e.breakdownType.toUpperCase()}
                        </span>
                        <StatusPill status={e.status} type="emergency" />
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Lieu : {e.locationName}</p>
                      {e.assignedMechanic && (
                        <p className="text-xs text-emerald-700 font-medium">Dépanneur assigné : {e.assignedMechanic}</p>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">{formatDateFR(e.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: PROFIL & PRÉFÉRENCES */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <h3 className="text-xl font-bold font-heading text-slate-900">
                  Mon Profil & Préférences de Notification
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mettez à jour vos coordonnées pour les rappels de vidange et avis d'arrivée dépanneur.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Nom complet
                    </label>
                    <input
                      type="text"
                      value={profName}
                      onChange={(e) => setProfName(e.target.value)}
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Téléphone mobile
                    </label>
                    <input
                      type="tel"
                      value={profPhone}
                      onChange={(e) => setProfPhone(e.target.value)}
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Adresse de résidence (Bingerville ou Abidjan)
                  </label>
                  <input
                    type="text"
                    value={profAddress}
                    onChange={(e) => setProfAddress(e.target.value)}
                    placeholder="Ex: Bingerville, Adjin Palmeraie, Résidence..."
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B]"
                  />
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Préférences de rappel d'entretien
                  </h4>

                  <label className="flex items-center gap-3 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profNotifyWhatsapp}
                      onChange={(e) => setProfNotifyWhatsapp(e.target.checked)}
                      className="rounded border-slate-300 text-[#1B2A6B] focus:ring-[#1B2A6B] w-4 h-4 cursor-pointer"
                    />
                    <span>Recevoir les alertes de vidange et devis par WhatsApp</span>
                  </label>

                  <label className="flex items-center gap-3 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profNotifyEmail}
                      onChange={(e) => setProfNotifyEmail(e.target.checked)}
                      className="rounded border-slate-300 text-[#1B2A6B] focus:ring-[#1B2A6B] w-4 h-4 cursor-pointer"
                    />
                    <span>Recevoir les factures et récapitulatifs par email</span>
                  </label>
                </div>

                <div className="pt-2">
                  <Button type="submit" variant="primary" loading={savingProfile}>
                    Enregistrer les modifications
                  </Button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* Modal: Ajouter un Véhicule */}
      <Modal
        isOpen={addVehicleModal}
        onClose={() => setAddVehicleModal(false)}
        title="Ajouter un Véhicule Client"
        subtitle="Renseignez la carte grise de votre véhicule"
      >
        <form onSubmit={handleAddVehicle} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Marque <span className="text-[#D62828]">*</span>
              </label>
              <input
                type="text"
                required
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                placeholder="Ex: Toyota"
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Modèle <span className="text-[#D62828]">*</span>
              </label>
              <input
                type="text"
                required
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                placeholder="Ex: RAV4 ou Hilux"
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Immatriculation <span className="text-[#D62828]">*</span>
              </label>
              <input
                type="text"
                required
                value={newPlate}
                onChange={(e) => setNewPlate(e.target.value)}
                placeholder="Ex: 8492-HH-01"
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B] font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Année
              </label>
              <input
                type="number"
                min={1995}
                max={2026}
                value={newYear}
                onChange={(e) => setNewYear(Number(e.target.value))}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kilométrage actuel au compteur (km) <span className="text-[#D62828]">*</span>
            </label>
            <input
              type="number"
              required
              min={0}
              value={newMileage}
              onChange={(e) => setNewMileage(Number(e.target.value))}
              placeholder="Ex: 78500"
              className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1B2A6B]"
            />
          </div>

          <div className="pt-2">
            <Button type="submit" variant="danger" className="w-full uppercase font-bold text-xs">
              Enregistrer mon véhicule
            </Button>
          </div>
        </form>
      </Modal>

      {/* Quote Modal */}
      <QuoteModal
        isOpen={quoteModalOpen}
        onClose={() => setQuoteModalOpen(false)}
      />
    </div>
  );
};
