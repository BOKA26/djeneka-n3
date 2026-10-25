export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'client' | 'mecanicien' | 'admin';
export type RequestType = 'devis' | 'rdv' | 'depannage' | 'piece' | 'moteur';
export type RequestStatus =
  | 'nouvelle'
  | 'confirmee'
  | 'reportee'
  | 'refusee'
  | 'prise_en_charge'
  | 'en_route'
  | 'terminee';
export type ReservationStatus =
  | 'en_attente'
  | 'confirmee'
  | 'en_cours'
  | 'terminee'
  | 'refusee'
  | 'annulee';
export type PartAvailability = 'en_stock' | 'sur_commande' | 'indisponible';
export type RentalStatus = 'disponible' | 'en_maintenance';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nom: string;
          telephone: string;
          email: string;
          role: UserRole;
          notif_email: boolean;
          notif_whatsapp: boolean;
          adresse: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          nom?: string;
          telephone?: string;
          email?: string;
          role?: UserRole;
          notif_email?: boolean;
          notif_whatsapp?: boolean;
          adresse?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nom?: string;
          telephone?: string;
          email?: string;
          role?: UserRole;
          notif_email?: boolean;
          notif_whatsapp?: boolean;
          adresse?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      client_vehicles: {
        Row: {
          id: string;
          owner_id: string;
          marque: string;
          modele: string;
          annee: number | null;
          plaque: string;
          kilometrage: number;
          prochaine_echeance_date: string | null;
          prochaine_echeance_km: number | null;
          photo_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          marque: string;
          modele: string;
          annee?: number | null;
          plaque: string;
          kilometrage?: number;
          prochaine_echeance_date?: string | null;
          prochaine_echeance_km?: number | null;
          photo_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          marque?: string;
          modele?: string;
          annee?: number | null;
          plaque?: string;
          kilometrage?: number;
          prochaine_echeance_date?: string | null;
          prochaine_echeance_km?: number | null;
          photo_url?: string | null;
          created_at?: string;
        };
      };
      services: {
        Row: {
          id: string;
          slug: string;
          nom: string;
          description: string;
          icone: string;
          photos: string[];
          duree_estimee: string | null;
          tarif_estime: string | null;
          populaire: boolean;
          points_forts: string[];
          actif: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          nom: string;
          description: string;
          icone?: string;
          photos?: string[];
          duree_estimee?: string | null;
          tarif_estime?: string | null;
          populaire?: boolean;
          points_forts?: string[];
          actif?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          nom?: string;
          description?: string;
          icone?: string;
          photos?: string[];
          duree_estimee?: string | null;
          tarif_estime?: string | null;
          populaire?: boolean;
          points_forts?: string[];
          actif?: boolean;
          created_at?: string;
        };
      };
      interventions: {
        Row: {
          id: string;
          vehicle_id: string;
          date: string;
          kilometrage: number;
          services: string[];
          pieces: string[];
          cout: number;
          mecanicien_id: string | null;
          mecanicien_nom: string | null;
          notes: string | null;
          facture_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          vehicle_id: string;
          date?: string;
          kilometrage: number;
          services?: string[];
          pieces?: string[];
          cout?: number;
          mecanicien_id?: string | null;
          mecanicien_nom?: string | null;
          notes?: string | null;
          facture_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          vehicle_id?: string;
          date?: string;
          kilometrage?: number;
          services?: string[];
          pieces?: string[];
          cout?: number;
          mecanicien_id?: string | null;
          mecanicien_nom?: string | null;
          notes?: string | null;
          facture_url?: string | null;
          created_at?: string;
        };
      };
      parts: {
        Row: {
          id: string;
          nom: string;
          reference: string;
          marque: string;
          categorie: string;
          compatibilite: string[];
          compatibilite_modeles: string[];
          plage_annees: string | null;
          prix: number | null;
          stock: number;
          disponibilite: PartAvailability;
          photos: string[];
          description: string | null;
          actif: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          nom: string;
          reference: string;
          marque: string;
          categorie: string;
          compatibilite?: string[];
          compatibilite_modeles?: string[];
          plage_annees?: string | null;
          prix?: number | null;
          stock?: number;
          disponibilite?: PartAvailability;
          photos?: string[];
          description?: string | null;
          actif?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          nom?: string;
          reference?: string;
          marque?: string;
          categorie?: string;
          compatibilite?: string[];
          compatibilite_modeles?: string[];
          plage_annees?: string | null;
          prix?: number | null;
          stock?: number;
          disponibilite?: PartAvailability;
          photos?: string[];
          description?: string | null;
          actif?: boolean;
          created_at?: string;
        };
      };
      rental_vehicles: {
        Row: {
          id: string;
          nom: string;
          marque: string;
          modele: string;
          annee: number;
          categorie: string;
          places: number;
          boite: string;
          carburant: string;
          clim: boolean;
          prix_jour: number;
          prix_semaine: number | null;
          caution: number;
          photos: string[];
          caracteristiques: string[];
          statut: RentalStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          nom: string;
          marque: string;
          modele: string;
          annee: number;
          categorie?: string;
          places?: number;
          boite?: string;
          carburant?: string;
          clim?: boolean;
          prix_jour: number;
          prix_semaine?: number | null;
          caution?: number;
          photos?: string[];
          caracteristiques?: string[];
          statut?: RentalStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          nom?: string;
          marque?: string;
          modele?: string;
          annee?: number;
          categorie?: string;
          places?: number;
          boite?: string;
          carburant?: string;
          clim?: boolean;
          prix_jour?: number;
          prix_semaine?: number | null;
          caution?: number;
          photos?: string[];
          caracteristiques?: string[];
          statut?: RentalStatus;
          created_at?: string;
        };
      };
      reservations: {
        Row: {
          id: string;
          client_id: string | null;
          rental_vehicle_id: string;
          date_debut: string;
          date_fin: string;
          total_jours: number;
          prix_jour: number;
          prix_total: number;
          caution: number;
          statut: ReservationStatus;
          permis_url: string | null;
          identite_url: string | null;
          client_nom: string | null;
          client_telephone: string | null;
          client_email: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id?: string | null;
          rental_vehicle_id: string;
          date_debut: string;
          date_fin: string;
          total_jours?: number;
          prix_jour?: number;
          prix_total: number;
          caution?: number;
          statut?: ReservationStatus;
          permis_url?: string | null;
          identite_url?: string | null;
          client_nom?: string | null;
          client_telephone?: string | null;
          client_email?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string | null;
          rental_vehicle_id?: string;
          date_debut?: string;
          date_fin?: string;
          total_jours?: number;
          prix_jour?: number;
          prix_total?: number;
          caution?: number;
          statut?: ReservationStatus;
          permis_url?: string | null;
          identite_url?: string | null;
          client_nom?: string | null;
          client_telephone?: string | null;
          client_email?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      blocked_dates: {
        Row: {
          id: string;
          rental_vehicle_id: string;
          date_debut: string;
          date_fin: string;
          motif: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          rental_vehicle_id: string;
          date_debut: string;
          date_fin: string;
          motif?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          rental_vehicle_id?: string;
          date_debut?: string;
          date_fin?: string;
          motif?: string | null;
          created_at?: string;
        };
      };
      requests: {
        Row: {
          id: string;
          type: RequestType;
          user_id: string | null;
          nom: string;
          telephone: string;
          email: string | null;
          details: Json;
          latitude: number | null;
          longitude: number | null;
          statut: RequestStatus;
          agent_assigne: string | null;
          eta_minutes: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: RequestType;
          user_id?: string | null;
          nom: string;
          telephone: string;
          email?: string | null;
          details?: Json;
          latitude?: number | null;
          longitude?: number | null;
          statut?: RequestStatus;
          agent_assigne?: string | null;
          eta_minutes?: number | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: RequestType;
          user_id?: string | null;
          nom?: string;
          telephone?: string;
          email?: string | null;
          details?: Json;
          latitude?: number | null;
          longitude?: number | null;
          statut?: RequestStatus;
          agent_assigne?: string | null;
          eta_minutes?: number | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      reviews: {
        Row: {
          id: string;
          client_id: string | null;
          client_nom: string;
          vehicule: string | null;
          note: number;
          texte: string;
          valide: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id?: string | null;
          client_nom: string;
          vehicule?: string | null;
          note: number;
          texte: string;
          valide?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string | null;
          client_nom?: string;
          vehicule?: string | null;
          note?: number;
          texte?: string;
          valide?: boolean;
          created_at?: string;
        };
      };
      posts: {
        Row: {
          id: string;
          titre: string;
          slug: string;
          extrait: string | null;
          contenu: string;
          image: string | null;
          auteur: string;
          categorie: string;
          temps_lecture: string;
          publie: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          titre: string;
          slug: string;
          extrait?: string | null;
          contenu: string;
          image?: string | null;
          auteur?: string;
          categorie?: string;
          temps_lecture?: string;
          publie?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          titre?: string;
          slug?: string;
          extrait?: string | null;
          contenu?: string;
          image?: string | null;
          auteur?: string;
          categorie?: string;
          temps_lecture?: string;
          publie?: boolean;
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          destinataire_id: string;
          message: string;
          canal: string;
          lu: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          destinataire_id: string;
          message: string;
          canal?: string;
          lu?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          destinataire_id?: string;
          message?: string;
          canal?: string;
          lu?: boolean;
          created_at?: string;
        };
      };
    };
    Functions: {
      create_reservation: {
        Args: {
          p_vehicle: string;
          p_debut: string;
          p_fin: string;
          p_permis?: string | null;
          p_identite?: string | null;
          p_nom?: string | null;
          p_telephone?: string | null;
          p_email?: string | null;
          p_notes?: string | null;
        };
        Returns: Json;
      };
      get_unavailable_dates: {
        Args: {
          p_vehicle: string;
        };
        Returns: {
          date_debut: string;
          date_fin: string;
          type: string;
        }[];
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_staff: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      send_service_reminders: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
    };
  };
}
