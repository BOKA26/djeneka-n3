import { supabase } from '../lib/supabase';
import {
  User,
  AutoPart,
  RentalVehicle,
  Reservation,
  EmergencyRequest,
  QuoteRequest,
  ClientVehicle,
  Intervention,
  Review,
  BlogPost,
  EngineOrder,
  StockStatus,
  ReservationStatus,
  EmergencyStatus,
  ServiceItem,
} from '../types';

import {
  testSupabaseConnection,
  updateSupabaseConfig,
  getSupabaseConfig,
  resetSupabaseConfig,
  isValidSupabaseUrl,
  normalizeSupabaseUrl,
  SUPABASE_SQL_SCHEMA,
  ConnectionStatus,
  SupabaseConfig,
} from './supabase';

export {
  testSupabaseConnection,
  updateSupabaseConfig,
  getSupabaseConfig,
  resetSupabaseConfig,
  isValidSupabaseUrl,
  normalizeSupabaseUrl,
  SUPABASE_SQL_SCHEMA,
};

export type { ConnectionStatus, SupabaseConfig };

/**
 * Calcule la liste des dates (YYYY-MM-DD) incluses entre deux dates
 */
export function getDatesBetween(startStr: string, endStr: string): string[] {
  const dates: string[] = [];
  if (!startStr || !endStr) return dates;
  const curr = new Date(startStr);
  const end = new Date(endStr);
  if (isNaN(curr.getTime()) || isNaN(end.getTime())) return dates;
  while (curr <= end) {
    dates.push(curr.toISOString().split('T')[0]);
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
}

/* ============================================================================
   1. AUTHENTICATION SERVICE (SUPABASE AUTH)
   ============================================================================ */
export const authApi = {
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user: authUser }, error } = await supabase.auth.getUser();
      if (error || !authUser) return null;

      // Charger le profil depuis public.profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      const meta = authUser.user_metadata || {};
      return {
        id: authUser.id,
        name: profile?.nom || meta.nom || meta.name || authUser.email?.split('@')[0] || 'Client',
        email: authUser.email || profile?.email || '',
        phone: profile?.telephone || meta.telephone || meta.phone || '',
        role: profile?.role || 'client',
        address: profile?.adresse || undefined,
        avatarUrl: profile?.avatar_url || undefined,
        notifyEmail: profile?.notif_email ?? true,
        notifyWhatsapp: profile?.notif_whatsapp ?? true,
      };
    } catch (err) {
      console.error('Erreur getCurrentUser:', err);
      return null;
    }
  },

  async login(email: string, pass: string): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: pass,
    });

    if (error || !data.user) {
      if (error?.message?.includes('Invalid login credentials')) {
        throw new Error('Email ou mot de passe incorrect.');
      }
      if (error?.message?.includes('Email not confirmed')) {
        throw new Error('Votre adresse email n’a pas encore été confirmée. Vérifiez vos emails.');
      }
      throw new Error(error?.message || 'Échec de connexion.');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    const meta = data.user.user_metadata || {};
    return {
      id: data.user.id,
      name: profile?.nom || meta.nom || meta.name || data.user.email?.split('@')[0] || 'Client',
      email: data.user.email || profile?.email || '',
      phone: profile?.telephone || meta.telephone || meta.phone || '',
      role: profile?.role || 'client',
      address: profile?.adresse || undefined,
      avatarUrl: profile?.avatar_url || undefined,
      notifyEmail: profile?.notif_email ?? true,
      notifyWhatsapp: profile?.notif_whatsapp ?? true,
    };
  },

  async register(name: string, email: string, phone: string, pass: string): Promise<User> {
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password: pass,
      options: {
        data: {
          nom: name.trim(),
          name: name.trim(),
          telephone: phone.trim(),
          phone: phone.trim(),
        },
      },
    });

    if (error) {
      if (error.message?.includes('already registered')) {
        throw new Error('Un compte existe déjà avec cette adresse email.');
      }
      throw new Error(error.message || 'Erreur lors de la création du compte.');
    }

    if (!data.user) {
      throw new Error('Impossible de finaliser l’inscription.');
    }

    return {
      id: data.user.id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      role: 'client',
      notifyEmail: true,
      notifyWhatsapp: true,
    };
  },

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.warn('Erreur déconnexion Supabase:', error.message);
    }
  },

  async updateProfile(updated: Partial<User>): Promise<User> {
    const curr = await this.getCurrentUser();
    if (!curr) throw new Error('Vous devez être connecté.');

    const updates: Record<string, unknown> = {};
    if (updated.name !== undefined) updates.nom = updated.name;
    if (updated.phone !== undefined) updates.telephone = updated.phone;
    if (updated.address !== undefined) updates.adresse = updated.address;
    if (updated.avatarUrl !== undefined) updates.avatar_url = updated.avatarUrl;
    if (updated.notifyEmail !== undefined) updates.notif_email = updated.notifyEmail;
    if (updated.notifyWhatsapp !== undefined) updates.notif_whatsapp = updated.notifyWhatsapp;

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', curr.id);

    if (error) {
      throw new Error(`Erreur lors de la mise à jour du profil: ${error.message}`);
    }

    return { ...curr, ...updated };
  },

  async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: window.location.origin + '/connexion',
    });
    if (error) {
      throw new Error(error.message || 'Impossible d’envoyer l’email de réinitialisation.');
    }
  },
};

/* ============================================================================
   2. SERVICES DE L'ATELIER (SERVICES API)
   ============================================================================ */
export const servicesApi = {
  async getAll(): Promise<ServiceItem[]> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('actif', true)
      .order('created_at', { ascending: true });

    if (error || !data) {
      console.warn('Erreur servicesApi.getAll:', error?.message);
      return [];
    }

    return data.map((d: any) => ({
      id: d.id,
      slug: d.slug,
      name: d.nom,
      icon: d.icone || 'Wrench',
      shortDesc: d.description?.slice(0, 120) + (d.description?.length > 120 ? '...' : ''),
      fullDesc: d.description,
      priceEstimate: d.tarif_estime || 'Sur devis',
      duration: d.duree_estimee || 'Variable',
      popular: Boolean(d.populaire),
      highlights: d.points_forts || [],
    }));
  },

  async getBySlug(slug: string): Promise<ServiceItem | undefined> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error || !data) return undefined;
    return {
      id: data.id,
      slug: data.slug,
      name: data.nom,
      icon: data.icone || 'Wrench',
      shortDesc: data.description?.slice(0, 120) || '',
      fullDesc: data.description,
      priceEstimate: data.tarif_estime || 'Sur devis',
      duration: data.duree_estimee || 'Variable',
      popular: Boolean(data.populaire),
      highlights: data.points_forts || [],
    };
  },

  async getById(id: string): Promise<ServiceItem | undefined> {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return undefined;
    return {
      id: data.id,
      slug: data.slug,
      name: data.nom,
      icon: data.icone || 'Wrench',
      shortDesc: data.description?.slice(0, 120) || '',
      fullDesc: data.description,
      priceEstimate: data.tarif_estime || 'Sur devis',
      duration: data.duree_estimee || 'Variable',
      popular: Boolean(data.populaire),
      highlights: data.points_forts || [],
    };
  },
};

/* ============================================================================
   3. CATALOGUE DE PIÈCES DÉTACHÉES (PARTS API)
   ============================================================================ */
export const partsApi = {
  async getAll(params?: {
    search?: string;
    category?: string;
    brand?: string;
  }): Promise<AutoPart[]> {
    let query = supabase
      .from('parts')
      .select('*')
      .eq('actif', true)
      .order('created_at', { ascending: false });

    if (params?.category && params.category !== 'Toutes') {
      query = query.eq('categorie', params.category);
    }

    if (params?.brand && params.brand !== 'Toutes') {
      query = query.eq('marque', params.brand);
    }

    if (params?.search && params.search.trim()) {
      const term = `%${params.search.trim()}%`;
      query = query.or(`nom.ilike.${term},reference.ilike.${term},marque.ilike.${term}`);
    }

    const { data, error } = await query;
    if (error || !data) {
      console.warn('Erreur partsApi.getAll:', error?.message);
      return [];
    }

    return data.map((d: any) => ({
      id: d.id,
      name: d.nom,
      reference: d.reference,
      category: d.categorie as any,
      brand: d.marque,
      compatibleBrands: d.compatibilite || [],
      compatibleModels: d.compatibilite_modeles || [],
      yearRange: d.plage_annees || 'Universel',
      price: Number(d.prix || 0),
      stockStatus: (d.disponibilite === 'en_stock'
        ? 'in_stock'
        : d.disponibilite === 'sur_commande'
        ? 'on_order'
        : 'out_of_stock') as StockStatus,
      stockQuantity: Number(d.stock || 0),
      imageUrl: d.photos?.[0] || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=400&auto=format&fit=crop&q=80',
      description: d.description || '',
    }));
  },

  async getById(id: string): Promise<AutoPart | undefined> {
    const { data, error } = await supabase
      .from('parts')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return undefined;
    return {
      id: data.id,
      name: data.nom,
      reference: data.reference,
      category: data.categorie as any,
      brand: data.marque,
      compatibleBrands: data.compatibilite || [],
      compatibleModels: data.compatibilite_modeles || [],
      yearRange: data.plage_annees || 'Universel',
      price: Number(data.prix || 0),
      stockStatus: (data.disponibilite === 'en_stock'
        ? 'in_stock'
        : data.disponibilite === 'sur_commande'
        ? 'on_order'
        : 'out_of_stock') as StockStatus,
      stockQuantity: Number(data.stock || 0),
      imageUrl: data.photos?.[0] || '',
      description: data.description || '',
    };
  },

  async create(partData: Omit<AutoPart, 'id'>): Promise<AutoPart> {
    const { data, error } = await supabase
      .from('parts')
      .insert({
        nom: partData.name,
        reference: partData.reference,
        categorie: partData.category,
        marque: partData.brand,
        compatibilite: partData.compatibleBrands,
        compatibilite_modeles: partData.compatibleModels,
        plage_annees: partData.yearRange,
        prix: partData.price,
        stock: partData.stockQuantity,
        disponibilite:
          partData.stockStatus === 'in_stock'
            ? 'en_stock'
            : partData.stockStatus === 'on_order'
            ? 'sur_commande'
            : 'indisponible',
        photos: partData.imageUrl ? [partData.imageUrl] : [],
        description: partData.description,
        actif: true,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de l’ajout de la pièce: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.nom,
      reference: data.reference,
      category: data.categorie as any,
      brand: data.marque,
      compatibleBrands: data.compatibilite || [],
      compatibleModels: data.compatibilite_modeles || [],
      yearRange: data.plage_annees || 'Universel',
      price: Number(data.prix),
      stockStatus: partData.stockStatus,
      stockQuantity: Number(data.stock),
      imageUrl: data.photos?.[0] || '',
      description: data.description || '',
    };
  },

  async update(id: string, updates: Partial<AutoPart>): Promise<AutoPart> {
    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload.nom = updates.name;
    if (updates.reference !== undefined) payload.reference = updates.reference;
    if (updates.category !== undefined) payload.categorie = updates.category;
    if (updates.brand !== undefined) payload.marque = updates.brand;
    if (updates.price !== undefined) payload.prix = updates.price;
    if (updates.stockQuantity !== undefined) payload.stock = updates.stockQuantity;
    if (updates.stockStatus !== undefined) {
      payload.disponibilite =
        updates.stockStatus === 'in_stock'
          ? 'en_stock'
          : updates.stockStatus === 'on_order'
          ? 'sur_commande'
          : 'indisponible';
    }
    if (updates.imageUrl !== undefined) payload.photos = [updates.imageUrl];
    if (updates.description !== undefined) payload.description = updates.description;

    const { data, error } = await supabase
      .from('parts')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur modification pièce: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.nom,
      reference: data.reference,
      category: data.categorie as any,
      brand: data.marque,
      compatibleBrands: data.compatibilite || [],
      compatibleModels: data.compatibilite_modeles || [],
      yearRange: data.plage_annees || 'Universel',
      price: Number(data.prix),
      stockStatus: updates.stockStatus || 'in_stock',
      stockQuantity: Number(data.stock),
      imageUrl: data.photos?.[0] || '',
      description: data.description || '',
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('parts').delete().eq('id', id);
    if (error) {
      throw new Error(`Erreur suppression pièce: ${error.message}`);
    }
  },

  async importCsv(items: Array<Partial<AutoPart> & { name: string }>): Promise<number> {
    let count = 0;
    for (const item of items) {
      await this.create({
        name: item.name,
        reference: item.reference || `REF-${Math.floor(1000 + Math.random() * 9000)}`,
        category: (item.category as any) || 'Filtration',
        brand: item.brand || 'Générique',
        compatibleBrands: item.compatibleBrands || ['Toutes marques'],
        compatibleModels: item.compatibleModels || ['Tous modèles'],
        yearRange: item.yearRange || 'Universel',
        price: item.price || 15000,
        stockStatus: 'in_stock',
        stockQuantity: item.stockQuantity || 5,
        imageUrl: item.imageUrl || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=400&auto=format&fit=crop&q=80',
        description: item.description || '',
      });
      count++;
    }
    return count;
  },
};

/* ============================================================================
   4. VÉHICULES DE LOCATION (RENTALS API)
   ============================================================================ */
export const rentalsApi = {
  async getAll(): Promise<RentalVehicle[]> {
    const { data, error } = await supabase
      .from('rental_vehicles')
      .select('*')
      .order('prix_jour', { ascending: false });

    if (error || !data) {
      console.warn('Erreur rentalsApi.getAll:', error?.message);
      return [];
    }

    return data.map((d: any) => ({
      id: d.id,
      name: d.nom,
      brand: d.marque,
      model: d.modele,
      year: Number(d.annee),
      category: d.categorie as any,
      seats: Number(d.places || 5),
      transmission: (d.boite || 'Automatique') as any,
      fuel: (d.carburant || 'Essence') as any,
      airConditioned: Boolean(d.clim),
      pricePerDay: Number(d.prix_jour),
      weeklyDiscountPercent: d.prix_semaine
        ? Math.max(5, Math.round((1 - Number(d.prix_semaine) / (Number(d.prix_jour) * 7)) * 100))
        : 15,
      deposit: Number(d.caution || 150000),
      images: d.photos || [],
      features: d.caracteristiques || [],
      unavailableDates: [],
    }));
  },

  async getById(id: string): Promise<RentalVehicle | undefined> {
    const { data, error } = await supabase
      .from('rental_vehicles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return undefined;

    // Charger les dates indisponibles via RPC get_unavailable_dates
    const unavDates = await this.getUnavailableDates(id);

    return {
      id: data.id,
      name: data.nom,
      brand: data.marque,
      model: data.modele,
      year: Number(data.annee),
      category: data.categorie as any,
      seats: Number(data.places || 5),
      transmission: (data.boite || 'Automatique') as any,
      fuel: (data.carburant || 'Essence') as any,
      airConditioned: Boolean(data.clim),
      pricePerDay: Number(data.prix_jour),
      weeklyDiscountPercent: data.prix_semaine
        ? Math.max(5, Math.round((1 - Number(data.prix_semaine) / (Number(data.prix_jour) * 7)) * 100))
        : 15,
      deposit: Number(data.caution || 150000),
      images: data.photos || [],
      features: data.caracteristiques || [],
      unavailableDates: unavDates,
    };
  },

  async getUnavailableDates(vehicleId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase.rpc('get_unavailable_dates', {
        p_vehicle: vehicleId,
      });

      if (error || !data) return [];

      const fullList: string[] = [];
      for (const row of data as any[]) {
        if (row.date_debut && row.date_fin) {
          const range = getDatesBetween(row.date_debut, row.date_fin);
          fullList.push(...range);
        }
      }
      return Array.from(new Set(fullList));
    } catch {
      return [];
    }
  },

  async blockDate(vehicleId: string, dateStr: string, motif = 'Maintenance atelier'): Promise<void> {
    const { error } = await supabase.from('blocked_dates').insert({
      rental_vehicle_id: vehicleId,
      date_debut: dateStr,
      date_fin: dateStr,
      motif,
    });
    if (error) {
      throw new Error(`Erreur blocage date: ${error.message}`);
    }
  },

  async create(data: Omit<RentalVehicle, 'id'>): Promise<RentalVehicle> {
    const { data: created, error } = await supabase
      .from('rental_vehicles')
      .insert({
        nom: data.name,
        marque: data.brand,
        modele: data.model,
        annee: data.year,
        categorie: data.category,
        places: data.seats,
        boite: data.transmission,
        carburant: data.fuel,
        clim: data.airConditioned,
        prix_jour: data.pricePerDay,
        prix_semaine: data.weeklyDiscountPercent
          ? Math.round(data.pricePerDay * 7 * (1 - data.weeklyDiscountPercent / 100))
          : null,
        caution: data.deposit,
        photos: data.images,
        caracteristiques: data.features,
        statut: 'disponible',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur création véhicule: ${error.message}`);
    }

    return {
      id: created.id,
      name: created.nom,
      brand: created.marque,
      model: created.modele,
      year: created.annee,
      category: created.categorie as any,
      seats: created.places,
      transmission: created.boite as any,
      fuel: created.carburant as any,
      airConditioned: created.clim,
      pricePerDay: Number(created.prix_jour),
      weeklyDiscountPercent: data.weeklyDiscountPercent,
      deposit: Number(created.caution),
      images: created.photos || [],
      features: created.caracteristiques || [],
      unavailableDates: [],
    };
  },

  async update(id: string, updates: Partial<RentalVehicle>): Promise<RentalVehicle> {
    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload.nom = updates.name;
    if (updates.pricePerDay !== undefined) payload.prix_jour = updates.pricePerDay;
    if (updates.deposit !== undefined) payload.caution = updates.deposit;
    if (updates.features !== undefined) payload.caracteristiques = updates.features;
    if (updates.images !== undefined) payload.photos = updates.images;

    const { data, error } = await supabase
      .from('rental_vehicles')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur mise à jour véhicule: ${error.message}`);
    }

    return {
      id: data.id,
      name: data.nom,
      brand: data.marque,
      model: data.modele,
      year: data.annee,
      category: data.categorie as any,
      seats: data.places,
      transmission: data.boite as any,
      fuel: data.carburant as any,
      airConditioned: data.clim,
      pricePerDay: Number(data.prix_jour),
      weeklyDiscountPercent: updates.weeklyDiscountPercent || 12,
      deposit: Number(data.caution),
      images: data.photos || [],
      features: data.caracteristiques || [],
      unavailableDates: [],
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('rental_vehicles').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async toggleBlockDate(vehicleId: string, dateStr: string): Promise<RentalVehicle> {
    const { data: existing } = await supabase
      .from('blocked_dates')
      .select('id')
      .eq('rental_vehicle_id', vehicleId)
      .eq('date_debut', dateStr)
      .maybeSingle();

    if (existing) {
      await supabase.from('blocked_dates').delete().eq('id', existing.id);
    } else {
      await supabase.from('blocked_dates').insert({
        rental_vehicle_id: vehicleId,
        date_debut: dateStr,
        date_fin: dateStr,
        motif: 'Maintenance atelier programmée',
      });
    }

    const updated = await this.getById(vehicleId);
    return updated!;
  },
};

/* ============================================================================
   5. RÉSERVATIONS DE VÉHICULES (RESERVATIONS API - ANTI-DOUBLON GIST RPC)
   ============================================================================ */
export const reservationsApi = {
  async getAll(): Promise<Reservation[]> {
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        rental_vehicles (nom, photos)
      `)
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.warn('Erreur reservationsApi.getAll:', error?.message);
      return [];
    }

    return data.map((d: any) => ({
      id: d.id,
      vehicleId: d.rental_vehicle_id,
      vehicleName: d.rental_vehicles?.nom || 'Véhicule de location',
      vehicleImage: d.rental_vehicles?.photos?.[0] || '',
      userId: d.client_id,
      clientName: d.client_nom || 'Client',
      clientPhone: d.client_telephone || '',
      clientEmail: d.client_email || '',
      startDate: d.date_debut,
      endDate: d.date_fin,
      totalDays: Number(d.total_jours || 1),
      pricePerDay: Number(d.prix_jour || 0),
      totalPrice: Number(d.prix_total || 0),
      deposit: Number(d.caution || 0),
      status: d.statut as ReservationStatus,
      licenseFile: d.permis_url || undefined,
      idCardFile: d.identite_url || undefined,
      createdAt: d.created_at,
      notes: d.notes || undefined,
    }));
  },

  async getByUserId(userId: string): Promise<Reservation[]> {
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        rental_vehicles (nom, photos)
      `)
      .eq('client_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((d: any) => ({
      id: d.id,
      vehicleId: d.rental_vehicle_id,
      vehicleName: d.rental_vehicles?.nom || 'Véhicule de location',
      vehicleImage: d.rental_vehicles?.photos?.[0] || '',
      userId: d.client_id,
      clientName: d.client_nom || 'Client',
      clientPhone: d.client_telephone || '',
      clientEmail: d.client_email || '',
      startDate: d.date_debut,
      endDate: d.date_fin,
      totalDays: Number(d.total_jours || 1),
      pricePerDay: Number(d.prix_jour || 0),
      totalPrice: Number(d.prix_total || 0),
      deposit: Number(d.caution || 0),
      status: d.statut as ReservationStatus,
      licenseFile: d.permis_url || undefined,
      idCardFile: d.identite_url || undefined,
      createdAt: d.created_at,
      notes: d.notes || undefined,
    }));
  },

  /**
   * Création sécurisée via RPC Postgres anti-chevauchement
   */
  async create(data: Omit<Reservation, 'id' | 'createdAt'>): Promise<Reservation> {
    const { data: res, error } = await supabase.rpc('create_reservation', {
      p_vehicle: data.vehicleId,
      p_debut: data.startDate,
      p_fin: data.endDate,
      p_permis: data.licenseFile || null,
      p_identite: data.idCardFile || null,
      p_nom: data.clientName,
      p_telephone: data.clientPhone,
      p_email: data.clientEmail || null,
      p_notes: data.notes || null,
    });

    if (error) {
      if (error.message?.includes('déjà réservé') || error.message?.includes('Ces dates ne sont pas disponibles')) {
        throw new Error('Ces dates ne sont plus disponibles pour ce véhicule. Veuillez choisir une autre période.');
      }
      if (error.message?.includes('connecté')) {
        throw new Error('Vous devez être connecté à votre compte pour réserver.');
      }
      throw new Error(error.message || 'Erreur lors de la réservation.');
    }

    const inserted = res as any;
    return {
      id: inserted.id,
      vehicleId: inserted.rental_vehicle_id,
      vehicleName: data.vehicleName,
      vehicleImage: data.vehicleImage,
      userId: inserted.client_id,
      clientName: inserted.client_nom,
      clientPhone: inserted.client_telephone,
      clientEmail: inserted.client_email,
      startDate: inserted.date_debut,
      endDate: inserted.date_fin,
      totalDays: Number(inserted.total_jours),
      pricePerDay: Number(inserted.prix_jour),
      totalPrice: Number(inserted.prix_total),
      deposit: Number(inserted.caution),
      status: inserted.statut as ReservationStatus,
      licenseFile: inserted.permis_url || undefined,
      idCardFile: inserted.identite_url || undefined,
      createdAt: inserted.created_at,
      notes: inserted.notes || undefined,
    };
  },

  async createReservation(data: any): Promise<Reservation> {
    return this.create(data);
  },

  async updateStatus(id: string, status: ReservationStatus): Promise<Reservation> {
    const { data, error } = await supabase
      .from('reservations')
      .update({ statut: status })
      .eq('id', id)
      .select(`
        *,
        rental_vehicles (nom, photos)
      `)
      .single();

    if (error || !data) {
      throw new Error(`Erreur mise à jour statut réservation: ${error?.message || 'Inconnue'}`);
    }

    return {
      id: data.id,
      vehicleId: data.rental_vehicle_id,
      vehicleName: data.rental_vehicles?.nom || 'Véhicule',
      vehicleImage: data.rental_vehicles?.photos?.[0],
      userId: data.client_id,
      clientName: data.client_nom,
      clientPhone: data.client_telephone,
      clientEmail: data.client_email,
      startDate: data.date_debut,
      endDate: data.date_fin,
      totalDays: Number(data.total_jours || 1),
      pricePerDay: Number(data.prix_jour || 0),
      totalPrice: Number(data.prix_total || 0),
      deposit: Number(data.caution || 0),
      status: data.statut as ReservationStatus,
      licenseFile: data.permis_url || undefined,
      idCardFile: data.identite_url || undefined,
      createdAt: data.created_at,
      notes: data.notes || undefined,
    };
  },

  async cancel(id: string): Promise<Reservation> {
    return this.updateStatus(id, 'annulee');
  },
};

/* ============================================================================
   6. DÉPANNAGE D'URGENCE (SOS REQUESTS API)
   ============================================================================ */
export const emergencyApi = {
  async getAll(): Promise<EmergencyRequest[]> {
    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .eq('type', 'depannage')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((d: any) => {
      const details = d.details || {};
      let mappedStatus: EmergencyStatus = 'demande_envoyee';
      if (d.statut === 'prise_en_charge') mappedStatus = 'prise_en_charge';
      else if (d.statut === 'en_route') mappedStatus = 'depanneur_en_route';
      else if (d.statut === 'terminee') mappedStatus = 'termine';

      return {
        id: d.id,
        clientName: d.nom,
        clientPhone: d.telephone,
        locationName: details.location_name || 'Bingerville / Abidjan',
        coordinates: d.latitude && d.longitude ? { lat: d.latitude, lng: d.longitude } : undefined,
        breakdownType: details.breakdown_type || 'autre',
        vehicleDetails: details.vehicle_details || undefined,
        status: mappedStatus,
        createdAt: d.created_at,
        assignedMechanic: d.agent_assigne || undefined,
        etaMinutes: d.eta_minutes ?? 25,
        notes: details.notes || d.notes || undefined,
      };
    });
  },

  async create(data: Omit<EmergencyRequest, 'id' | 'createdAt' | 'status'> & { status?: EmergencyStatus }): Promise<EmergencyRequest> {
    const { data: created, error } = await supabase
      .from('requests')
      .insert({
        type: 'depannage',
        nom: data.clientName,
        telephone: data.clientPhone,
        details: {
          location_name: data.locationName,
          breakdown_type: data.breakdownType,
          vehicle_details: data.vehicleDetails,
          notes: data.notes,
        },
        latitude: data.coordinates?.lat || null,
        longitude: data.coordinates?.lng || null,
        statut: 'nouvelle',
        eta_minutes: data.etaMinutes || 25,
        agent_assigne: data.assignedMechanic || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de l’envoi du SOS Dépannage: ${error.message}`);
    }

    return {
      id: created.id,
      clientName: created.nom,
      clientPhone: created.telephone,
      locationName: data.locationName,
      coordinates: data.coordinates,
      breakdownType: data.breakdownType,
      vehicleDetails: data.vehicleDetails,
      status: 'demande_envoyee',
      createdAt: created.created_at,
      assignedMechanic: created.agent_assigne || undefined,
      etaMinutes: created.eta_minutes || 25,
      notes: data.notes,
    };
  },

  async updateStatus(
    id: string,
    status: EmergencyStatus,
    assigned?: string,
    eta?: number
  ): Promise<EmergencyRequest> {
    let dbStatut = 'nouvelle';
    if (status === 'prise_en_charge') dbStatut = 'prise_en_charge';
    else if (status === 'depanneur_en_route') dbStatut = 'en_route';
    else if (status === 'termine') dbStatut = 'terminee';

    const updates: Record<string, unknown> = { statut: dbStatut };
    if (assigned !== undefined) updates.agent_assigne = assigned;
    if (eta !== undefined) updates.eta_minutes = eta;

    const { data, error } = await supabase
      .from('requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Erreur mise à jour statut');
    }

    const details = data.details || {};
    return {
      id: data.id,
      clientName: data.nom,
      clientPhone: data.telephone,
      locationName: details.location_name || 'Bingerville / Abidjan',
      coordinates: data.latitude && data.longitude ? { lat: data.latitude, lng: data.longitude } : undefined,
      breakdownType: details.breakdown_type || 'autre',
      vehicleDetails: details.vehicle_details || undefined,
      status,
      createdAt: data.created_at,
      assignedMechanic: data.agent_assigne || assigned || undefined,
      etaMinutes: data.eta_minutes ?? eta ?? 25,
      notes: details.notes || data.notes || undefined,
    };
  },
};

/* ============================================================================
   7. DEMANDES DE DEVIS (QUOTES REQUESTS API)
   ============================================================================ */
export const quotesApi = {
  async getAll(): Promise<QuoteRequest[]> {
    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .eq('type', 'devis')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((d: any) => {
      const details = d.details || {};
      let mappedStatus: 'nouveau' | 'en_cours' | 'traite' = 'nouveau';
      if (d.statut === 'prise_en_charge') mappedStatus = 'en_cours';
      else if (d.statut === 'terminee' || d.statut === 'confirmee') mappedStatus = 'traite';

      return {
        id: d.id,
        serviceId: details.service_id,
        serviceName: details.service_name || 'Mécanique Générale',
        vehicleInfo: details.vehicle_info || 'Non spécifié',
        preferredDate: details.preferred_date || d.created_at.split('T')[0],
        clientName: d.nom,
        clientPhone: d.telephone,
        clientEmail: d.email || undefined,
        message: details.message || d.notes || '',
        status: mappedStatus,
        createdAt: d.created_at,
      };
    });
  },

  async create(data: Omit<QuoteRequest, 'id' | 'createdAt' | 'status'> & { status?: QuoteRequest['status'] }): Promise<QuoteRequest> {
    const { data: created, error } = await supabase
      .from('requests')
      .insert({
        type: 'devis',
        nom: data.clientName,
        telephone: data.clientPhone,
        email: data.clientEmail || null,
        details: {
          service_id: data.serviceId,
          service_name: data.serviceName,
          vehicle_info: data.vehicleInfo,
          preferred_date: data.preferredDate,
          message: data.message,
        },
        statut: 'nouvelle',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de l’envoi de la demande de devis: ${error.message}`);
    }

    return {
      id: created.id,
      serviceId: data.serviceId,
      serviceName: data.serviceName,
      vehicleInfo: data.vehicleInfo,
      preferredDate: data.preferredDate,
      clientName: created.nom,
      clientPhone: created.telephone,
      clientEmail: created.email || undefined,
      message: data.message,
      status: 'nouveau',
      createdAt: created.created_at,
    };
  },

  async updateStatus(id: string, status: 'nouveau' | 'en_cours' | 'traite'): Promise<void> {
    const dbStatut = status === 'nouveau' ? 'nouvelle' : status === 'en_cours' ? 'prise_en_charge' : 'terminee';
    const { error } = await supabase
      .from('requests')
      .update({ statut: dbStatut })
      .eq('id', id);

    if (error) throw new Error(error.message);
  },
};

/* ============================================================================
   8. COMMANDES DE MOTEURS D'OCCASION (ENGINE ORDERS API)
   ============================================================================ */
export const engineOrdersApi = {
  async getAll(): Promise<EngineOrder[]> {
    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .eq('type', 'moteur')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((d: any) => {
      const details = d.details || {};
      let mappedStatus: EngineOrder['status'] = 'en_attente';
      if (d.statut === 'prise_en_charge') mappedStatus = 'en_recherche';
      else if (d.statut === 'reportee') mappedStatus = 'devis_envoye';
      else if (d.statut === 'confirmee') mappedStatus = 'confirme';
      else if (d.statut === 'terminee') mappedStatus = 'livre';

      return {
        id: d.id,
        clientName: d.nom,
        phone: d.telephone,
        vehicleModel: details.vehicle_model || '',
        year: Number(details.year || 2018),
        origin: details.origin || 'asiatique',
        chassisNumber: details.chassis_number || '',
        notes: details.notes || d.notes || undefined,
        createdAt: d.created_at,
        status: mappedStatus,
      };
    });
  },

  async create(data: Omit<EngineOrder, 'id' | 'createdAt' | 'status'> & { status?: EngineOrder['status'] }): Promise<EngineOrder> {
    const { data: created, error } = await supabase
      .from('requests')
      .insert({
        type: 'moteur',
        nom: data.clientName,
        telephone: data.phone,
        details: {
          vehicle_model: data.vehicleModel,
          year: data.year,
          origin: data.origin,
          chassis_number: data.chassisNumber,
          notes: data.notes,
        },
        statut: 'nouvelle',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur lors de la commande moteur: ${error.message}`);
    }

    return {
      id: created.id,
      clientName: created.nom,
      phone: created.telephone,
      vehicleModel: data.vehicleModel,
      year: data.year,
      origin: data.origin,
      chassisNumber: data.chassisNumber,
      notes: data.notes,
      createdAt: created.created_at,
      status: 'en_attente',
    };
  },

  async updateStatus(id: string, status: EngineOrder['status']): Promise<void> {
    let dbStatut = 'nouvelle';
    if (status === 'en_recherche') dbStatut = 'prise_en_charge';
    else if (status === 'devis_envoye') dbStatut = 'reportee';
    else if (status === 'confirme') dbStatut = 'confirmee';
    else if (status === 'livre') dbStatut = 'terminee';

    const { error } = await supabase
      .from('requests')
      .update({ statut: dbStatut })
      .eq('id', id);

    if (error) throw new Error(error.message);
  },
};

export const engineApi = engineOrdersApi;

/* ============================================================================
   9. VÉHICULES CLIENTS (CARNET D'ENTRETIEN DIGITAL)
   ============================================================================ */
export const vehiclesApi = {
  async getAll(): Promise<ClientVehicle[]> {
    const { data, error } = await supabase
      .from('client_vehicles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((d: any) => ({
      id: d.id,
      clientId: d.owner_id,
      brand: d.marque,
      model: d.modele,
      year: Number(d.annee || 2020),
      plate: d.plaque,
      mileage: Number(d.kilometrage || 0),
      nextServiceMileage: Number(d.prochaine_echeance_km || (Number(d.kilometrage || 0) + 5000)),
      lastServiceDate: d.prochaine_echeance_date || 'À planifier',
      photoUrl: d.photo_url || undefined,
    }));
  },

  async getByClientId(clientId: string): Promise<ClientVehicle[]> {
    const { data, error } = await supabase
      .from('client_vehicles')
      .select('*')
      .eq('owner_id', clientId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((d: any) => ({
      id: d.id,
      clientId: d.owner_id,
      brand: d.marque,
      model: d.modele,
      year: Number(d.annee || 2020),
      plate: d.plaque,
      mileage: Number(d.kilometrage || 0),
      nextServiceMileage: Number(d.prochaine_echeance_km || (Number(d.kilometrage || 0) + 5000)),
      lastServiceDate: d.prochaine_echeance_date || 'À planifier',
      photoUrl: d.photo_url || undefined,
    }));
  },

  async getById(id: string): Promise<ClientVehicle | undefined> {
    const { data, error } = await supabase
      .from('client_vehicles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return undefined;

    return {
      id: data.id,
      clientId: data.owner_id,
      brand: data.marque,
      model: data.modele,
      year: Number(data.annee || 2020),
      plate: data.plaque,
      mileage: Number(data.kilometrage || 0),
      nextServiceMileage: Number(data.prochaine_echeance_km || 0),
      lastServiceDate: data.prochaine_echeance_date || '',
      photoUrl: data.photo_url || undefined,
    };
  },

  async create(data: Omit<ClientVehicle, 'id'>): Promise<ClientVehicle> {
    const { data: created, error } = await supabase
      .from('client_vehicles')
      .insert({
        owner_id: data.clientId,
        marque: data.brand,
        modele: data.model,
        annee: data.year,
        plaque: data.plate.toUpperCase().trim(),
        kilometrage: data.mileage,
        prochaine_echeance_km: data.nextServiceMileage || data.mileage + 5000,
        photo_url: data.photoUrl || null,
      })
      .select()
      .single();

    if (error) {
      if (error.message?.includes('unique') || error.message?.includes('plaque')) {
        throw new Error('Un véhicule avec cette plaque d’immatriculation existe déjà.');
      }
      throw new Error(`Erreur ajout véhicule: ${error.message}`);
    }

    return {
      id: created.id,
      clientId: created.owner_id,
      brand: created.marque,
      model: created.modele,
      year: created.annee,
      plate: created.plaque,
      mileage: created.kilometrage,
      nextServiceMileage: created.prochaine_echeance_km,
      lastServiceDate: created.prochaine_echeance_date || 'À planifier',
      photoUrl: created.photo_url || undefined,
    };
  },

  async update(id: string, updates: Partial<ClientVehicle>): Promise<ClientVehicle> {
    const payload: Record<string, unknown> = {};
    if (updates.mileage !== undefined) payload.kilometrage = updates.mileage;
    if (updates.nextServiceMileage !== undefined) payload.prochaine_echeance_km = updates.nextServiceMileage;
    if (updates.photoUrl !== undefined) payload.photo_url = updates.photoUrl;

    const { data, error } = await supabase
      .from('client_vehicles')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      clientId: data.owner_id,
      brand: data.marque,
      model: data.modele,
      year: data.annee,
      plate: data.plaque,
      mileage: data.kilometrage,
      nextServiceMileage: data.prochaine_echeance_km,
      lastServiceDate: data.prochaine_echeance_date || '',
      photoUrl: data.photo_url || undefined,
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('client_vehicles').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async addVehicle(data: Omit<ClientVehicle, 'id'>): Promise<ClientVehicle> {
    return this.create(data);
  },
};

/* ============================================================================
   10. INTERVENTIONS & FACTURES (CARNET D'ENTRETIEN)
   ============================================================================ */
export const interventionsApi = {
  async getAll(): Promise<Intervention[]> {
    const { data, error } = await supabase
      .from('interventions')
      .select(`
        *,
        client_vehicles (marque, modele, plaque, owner_id)
      `)
      .order('date', { ascending: false });

    if (error || !data) return [];

    return data.map((d: any) => ({
      id: d.id,
      clientId: d.client_vehicles?.owner_id || '',
      vehicleId: d.vehicle_id,
      vehicleName: d.client_vehicles ? `${d.client_vehicles.marque} ${d.client_vehicles.modele}` : 'Véhicule',
      vehiclePlate: d.client_vehicles?.plaque || '',
      date: d.date,
      mileage: Number(d.kilometrage || 0),
      services: d.services || [],
      partsChanged: d.pieces || [],
      cost: Number(d.cout || 0),
      mechanicName: d.mecanicien_nom || 'Ibrahim Koné (Chef Mécanicien)',
      notes: d.notes || '',
    }));
  },

  async getByVehicleId(vehicleId: string): Promise<Intervention[]> {
    const { data, error } = await supabase
      .from('interventions')
      .select(`
        *,
        client_vehicles (marque, modele, plaque, owner_id)
      `)
      .eq('vehicle_id', vehicleId)
      .order('date', { ascending: false });

    if (error || !data) return [];

    return data.map((d: any) => ({
      id: d.id,
      clientId: d.client_vehicles?.owner_id || '',
      vehicleId: d.vehicle_id,
      vehicleName: d.client_vehicles ? `${d.client_vehicles.marque} ${d.client_vehicles.modele}` : 'Véhicule',
      vehiclePlate: d.client_vehicles?.plaque || '',
      date: d.date,
      mileage: Number(d.kilometrage || 0),
      services: d.services || [],
      partsChanged: d.pieces || [],
      cost: Number(d.cout || 0),
      mechanicName: d.mecanicien_nom || 'Chef Mécanicien',
      notes: d.notes || '',
    }));
  },

  async getByClientId(clientId: string): Promise<Intervention[]> {
    const all = await this.getAll();
    return all.filter((i) => i.clientId === clientId);
  },

  async create(data: Omit<Intervention, 'id'>): Promise<Intervention> {
    const { data: created, error } = await supabase
      .from('interventions')
      .insert({
        vehicle_id: data.vehicleId,
        date: data.date.includes('-') ? data.date : new Date().toISOString().split('T')[0],
        kilometrage: data.mileage,
        services: data.services,
        pieces: data.partsChanged,
        cout: data.cost,
        mecanicien_nom: data.mechanicName || 'Chef Mécanicien',
        notes: data.notes,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur enregistrement intervention: ${error.message}`);
    }

    return {
      id: created.id,
      clientId: data.clientId,
      vehicleId: data.vehicleId,
      vehicleName: data.vehicleName,
      vehiclePlate: data.vehiclePlate,
      date: created.date,
      mileage: created.kilometrage,
      services: created.services || [],
      partsChanged: created.pieces || [],
      cost: Number(created.cout),
      mechanicName: created.mecanicien_nom || 'Chef Mécanicien',
      notes: created.notes || '',
    };
  },
};

/* ============================================================================
   11. AVIS & TÉMOIGNAGES (REVIEWS API)
   ============================================================================ */
export const reviewsApi = {
  async getApproved(): Promise<Review[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('valide', true)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((d: any) => ({
      id: d.id,
      authorName: d.client_nom,
      authorVehicle: d.vehicule || undefined,
      rating: Number(d.note),
      comment: d.texte,
      date: new Date(d.created_at).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      status: 'approuve',
    }));
  },

  async getAll(): Promise<Review[]> {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((d: any) => ({
      id: d.id,
      authorName: d.client_nom,
      authorVehicle: d.vehicule || undefined,
      rating: Number(d.note),
      comment: d.texte,
      date: new Date(d.created_at).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      status: d.valide ? 'approuve' : 'en_attente',
    }));
  },

  async create(data: Omit<Review, 'id' | 'date' | 'status'>): Promise<Review> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data: created, error } = await supabase
      .from('reviews')
      .insert({
        client_id: user?.id || null,
        client_nom: data.authorName,
        vehicule: data.authorVehicle || null,
        note: data.rating,
        texte: data.comment,
        valide: false, // modéré par admin
      })
      .select()
      .single();

    if (error) {
      if (error.message?.includes('policy') || error.message?.includes('violates row-level security')) {
        throw new Error('Vous devez avoir effectué au moins une intervention ou réservation terminée pour laisser un avis.');
      }
      throw new Error(`Erreur lors du dépôt de l’avis: ${error.message}`);
    }

    return {
      id: created.id,
      authorName: created.client_nom,
      authorVehicle: created.vehicule || undefined,
      rating: created.note,
      comment: created.texte,
      date: 'Aujourd’hui',
      status: 'en_attente',
    };
  },

  async updateStatus(id: string, status: 'approuve' | 'en_attente'): Promise<void> {
    const { error } = await supabase
      .from('reviews')
      .update({ valide: status === 'approuve' })
      .eq('id', id);

    if (error) throw new Error(error.message);
  },

  async approve(id: string): Promise<void> {
    return this.updateStatus(id, 'approuve');
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async submitReview(data: Omit<Review, 'id' | 'date' | 'status'>): Promise<Review> {
    return this.create(data);
  },
};

/* ============================================================================
   12. BLOG & CONSEILS TECHNIQUES (POSTS API)
   ============================================================================ */
export const blogApi = {
  async getPublished(): Promise<BlogPost[]> {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('publie', true)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((d: any) => ({
      id: d.id,
      title: d.titre,
      slug: d.slug,
      excerpt: d.extrait || '',
      content: d.contenu,
      coverImage: d.image || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=80',
      date: new Date(d.created_at).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      author: d.auteur || 'Officina Djeneka',
      category: d.categorie || 'Conseils Entretien',
      readTime: d.temps_lecture || '4 min de lecture',
      status: 'publie',
    }));
  },

  async getAll(): Promise<BlogPost[]> {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((d: any) => ({
      id: d.id,
      title: d.titre,
      slug: d.slug,
      excerpt: d.extrait || '',
      content: d.contenu,
      coverImage: d.image || '',
      date: new Date(d.created_at).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      author: d.auteur || 'Officina Djeneka',
      category: d.categorie || 'Conseils Entretien',
      readTime: d.temps_lecture || '4 min de lecture',
      status: d.publie ? 'publie' : 'brouillon',
    }));
  },

  async getBySlug(slug: string): Promise<BlogPost | undefined> {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error || !data) return undefined;

    return {
      id: data.id,
      title: data.titre,
      slug: data.slug,
      excerpt: data.extrait || '',
      content: data.contenu,
      coverImage: data.image || '',
      date: new Date(data.created_at).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      author: data.auteur || 'Officina Djeneka',
      category: data.categorie || 'Conseils Entretien',
      readTime: data.temps_lecture || '4 min de lecture',
      status: data.publie ? 'publie' : 'brouillon',
    };
  },

  async create(data: Omit<BlogPost, 'id' | 'date'>): Promise<BlogPost> {
    const { data: created, error } = await supabase
      .from('posts')
      .insert({
        titre: data.title,
        slug: data.slug,
        extrait: data.excerpt,
        contenu: data.content,
        image: data.coverImage,
        auteur: data.author,
        categorie: data.category,
        temps_lecture: data.readTime,
        publie: data.status === 'publie',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erreur création article: ${error.message}`);
    }

    return {
      id: created.id,
      title: created.titre,
      slug: created.slug,
      excerpt: created.extrait || '',
      content: created.contenu,
      coverImage: created.image || '',
      date: 'Aujourd’hui',
      author: created.auteur,
      category: created.categorie,
      readTime: created.temps_lecture,
      status: created.publie ? 'publie' : 'brouillon',
    };
  },

  async update(id: string, updates: Partial<BlogPost>): Promise<BlogPost> {
    const payload: Record<string, unknown> = {};
    if (updates.title !== undefined) payload.titre = updates.title;
    if (updates.slug !== undefined) payload.slug = updates.slug;
    if (updates.excerpt !== undefined) payload.extrait = updates.excerpt;
    if (updates.content !== undefined) payload.contenu = updates.content;
    if (updates.coverImage !== undefined) payload.image = updates.coverImage;
    if (updates.category !== undefined) payload.categorie = updates.category;
    if (updates.status !== undefined) payload.publie = updates.status === 'publie';

    const { data, error } = await supabase
      .from('posts')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      title: data.titre,
      slug: data.slug,
      excerpt: data.extrait || '',
      content: data.contenu,
      coverImage: data.image || '',
      date: new Date(data.created_at).toLocaleDateString('fr-FR'),
      author: data.auteur,
      category: data.categorie,
      readTime: data.temps_lecture,
      status: data.publie ? 'publie' : 'brouillon',
    };
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async savePost(data: {
    title: string;
    content: string;
    category?: string;
    author?: string;
    coverImage?: string;
  }): Promise<BlogPost> {
    const slug =
      data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') +
      '-' +
      Date.now();

    return this.create({
      title: data.title,
      slug,
      content: data.content,
      category: data.category || 'Conseils Entretien',
      author: data.author || 'Officina Djeneka',
      coverImage:
        data.coverImage ||
        'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=80',
      excerpt: data.content.slice(0, 150) + '...',
      readTime: '4 min de lecture',
      status: 'publie',
    });
  },
};

/* ============================================================================
   13. NOTIFICATIONS UTILISATEURS
   ============================================================================ */
export const notificationsApi = {
  async getByUserId(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('destinataire_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data;
  },

  async markAsRead(id: string): Promise<void> {
    await supabase.from('notifications').update({ lu: true }).eq('id', id);
  },
};

/* ============================================================================
   14. PROFILS & GESTION DES UTILISATEURS (ADMIN)
   ============================================================================ */
export const profilesApi = {
  async getAll(): Promise<User[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((p: any) => ({
      id: p.id,
      name: p.nom || 'Utilisateur',
      email: p.email || '',
      phone: p.telephone || '',
      role: p.role,
      address: p.adresse || undefined,
      avatarUrl: p.avatar_url || undefined,
      notifyEmail: Boolean(p.notif_email),
      notifyWhatsapp: Boolean(p.notif_whatsapp),
    }));
  },

  async updateRole(id: string, newRole: User['role']): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', id);

    if (error) throw new Error(`Erreur attribution rôle: ${error.message}`);
  },
};

/* ============================================================================
   15. SUPABASE STORAGE (DOCUMENTS PRIVÉS & MÉDIAS PUBLICS)
   ============================================================================ */
export const storageApi = {
  /**
   * Upload d'un document privé (permis, CNI, facture) dans le dossier de l'utilisateur
   */
  async uploadDocument(file: File, userId: string): Promise<string> {
    const cleanName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = `${userId}/${cleanName}`;

    const { error } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(`Échec upload document: ${error.message}`);
    }

    return filePath;
  },

  /**
   * Obtient une URL signée valable 1 heure pour un document privé
   */
  async getSignedDocumentUrl(filePath: string): Promise<string | null> {
    if (!filePath) return null;
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 3600);

    if (error || !data) return null;
    return data.signedUrl;
  },

  /**
   * Upload d'un fichier média public (photos pièces, véhicules, blog)
   */
  async uploadMedia(file: File, folder = 'general'): Promise<string> {
    const cleanName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = `${folder}/${cleanName}`;

    const { error } = await supabase.storage
      .from('media')
      .upload(filePath, file, {
        cacheControl: '31536000',
        upsert: true,
      });

    if (error) {
      throw new Error(`Échec upload média: ${error.message}`);
    }

    const { data } = supabase.storage.from('media').getPublicUrl(filePath);
    return data.publicUrl;
  },
};

export async function syncAllMockDataToSupabase(): Promise<{
  success: boolean;
  message: string;
  syncedCount: number;
}> {
  return {
    success: true,
    message: 'Le script supabase/schema.sql contient toutes les données de test (services, pièces, flotte, blog, avis). Exécutez-le dans le SQL Editor de Supabase pour peupler la base.',
    syncedCount: 44,
  };
}
