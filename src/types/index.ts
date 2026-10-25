export type UserRole = 'client' | 'mecanicien' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  address?: string;
  avatarUrl?: string;
  notifyEmail: boolean;
  notifyWhatsapp: boolean;
}

export interface ServiceItem {
  id: string;
  slug: string;
  name: string;
  icon: string;
  shortDesc: string;
  fullDesc: string;
  priceEstimate: string;
  duration: string;
  popular?: boolean;
  highlights?: string[];
}

export type StockStatus = 'in_stock' | 'on_order' | 'out_of_stock';

export interface AutoPart {
  id: string;
  name: string;
  reference: string;
  category: 'Freinage' | 'Filtration' | 'Suspension' | 'Moteur' | 'Électrique' | 'Éclairage' | 'Transmission' | 'Climatisation';
  brand: string;
  compatibleBrands: string[];
  compatibleModels: string[];
  yearRange: string;
  price: number; // in FCFA
  stockStatus: StockStatus;
  stockQuantity: number;
  imageUrl: string;
  description: string;
}

export interface EngineOrder {
  id: string;
  clientName: string;
  phone: string;
  vehicleModel: string;
  year: number;
  origin: 'asiatique' | 'europeenne';
  chassisNumber: string;
  notes?: string;
  createdAt: string;
  status: 'en_attente' | 'en_recherche' | 'devis_envoye' | 'confirme' | 'livre';
}

export interface RentalVehicle {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  category: 'SUV' | 'Berline' | 'Pick-up' | 'Citadine' | '4x4 Luxe';
  seats: number;
  transmission: 'Automatique' | 'Manuelle';
  fuel: 'Essence' | 'Diesel';
  airConditioned: boolean;
  pricePerDay: number; // in FCFA
  weeklyDiscountPercent: number; // e.g. 15 for 15% off
  deposit: number; // in FCFA
  images: string[];
  features: string[];
  unavailableDates: string[]; // ['2026-10-20', '2026-10-21']
}

export type ReservationStatus = 'en_attente' | 'confirmee' | 'en_cours' | 'terminee' | 'refusee' | 'annulee';

export interface Reservation {
  id: string;
  vehicleId: string;
  vehicleName: string;
  vehicleImage: string;
  userId?: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalDays: number;
  pricePerDay: number;
  totalPrice: number;
  deposit: number;
  status: ReservationStatus;
  licenseFile?: string;
  idCardFile?: string;
  createdAt: string;
  notes?: string;
}

export type EmergencyStatus = 'demande_envoyee' | 'prise_en_charge' | 'depanneur_en_route' | 'termine';
export type BreakdownType = 'batterie' | 'pneu' | 'moteur' | 'accident' | 'autre';

export interface EmergencyRequest {
  id: string;
  clientName: string;
  clientPhone: string;
  locationName: string;
  coordinates?: { lat: number; lng: number };
  breakdownType: BreakdownType;
  vehicleDetails?: string;
  status: EmergencyStatus;
  createdAt: string;
  assignedMechanic?: string;
  etaMinutes?: number;
  notes?: string;
}

export interface QuoteRequest {
  id: string;
  serviceId?: string;
  serviceName: string;
  vehicleInfo: string;
  preferredDate: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  message: string;
  status: 'nouveau' | 'en_cours' | 'traite';
  createdAt: string;
}

export interface ClientVehicle {
  id: string;
  clientId: string;
  brand: string;
  model: string;
  year: number;
  plate: string;
  mileage: number;
  nextServiceMileage: number;
  lastServiceDate: string;
  photoUrl?: string;
}

export interface Intervention {
  id: string;
  clientId: string;
  vehicleId: string;
  vehicleName: string;
  vehiclePlate: string;
  date: string;
  mileage: number;
  services: string[];
  partsChanged: string[];
  cost: number;
  mechanicName: string;
  notes: string;
}

export interface Review {
  id: string;
  authorName: string;
  authorVehicle?: string;
  rating: number; // 1-5
  comment: string;
  date: string;
  status: 'approuve' | 'en_attente';
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  date: string;
  author: string;
  category: string;
  readTime: string;
  status: 'publie' | 'brouillon';
}

export interface GalleryItem {
  id: string;
  title: string;
  category: 'Atelier' | 'Peinture' | 'Polissage' | 'Location';
  imageUrl: string;
  description: string;
}
