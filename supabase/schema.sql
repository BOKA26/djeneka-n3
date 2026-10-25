-- ============================================================================
-- OFFICINA DJENEKA (GARAGE MODERNE - BINGERVILLE / GRAND ABIDJAN)
-- SCHEMA COMPLET SUPABASE POSTGRESQL & POLITIQUES RLS
-- ============================================================================
-- Ce script est idempotent (peut être exécuté plusieurs fois sans erreur).
-- À exécuter dans : Supabase Dashboard > SQL Editor > New Query > Run
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ----------------------------------------------------------------------------
-- 2. TYPES ENUMÉRÉS
-- ----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('client', 'mecanicien', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.request_type AS ENUM ('devis', 'rdv', 'depannage', 'piece', 'moteur');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.request_status AS ENUM (
    'nouvelle', 'confirmee', 'reportee', 'refusee', 'prise_en_charge', 'en_route', 'terminee'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.reservation_status AS ENUM (
    'en_attente', 'confirmee', 'en_cours', 'terminee', 'refusee', 'annulee'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.part_availability AS ENUM ('en_stock', 'sur_commande', 'indisponible');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.rental_status AS ENUM ('disponible', 'en_maintenance');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ----------------------------------------------------------------------------
-- 3. TABLES DU SYSTÈME
-- ----------------------------------------------------------------------------

-- 3.1. Profils Utilisateurs (liés à auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nom TEXT NOT NULL DEFAULT '',
  telephone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  role public.user_role NOT NULL DEFAULT 'client',
  notif_email BOOLEAN NOT NULL DEFAULT true,
  notif_whatsapp BOOLEAN NOT NULL DEFAULT true,
  adresse TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.2. Véhicules Clients (Carnet d'entretien digital)
CREATE TABLE IF NOT EXISTS public.client_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  marque TEXT NOT NULL,
  modele TEXT NOT NULL,
  annee INTEGER,
  plaque TEXT NOT NULL UNIQUE,
  kilometrage INTEGER NOT NULL DEFAULT 0,
  prochaine_echeance_date DATE,
  prochaine_echeance_km INTEGER,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.3. Services de l'Atelier
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  nom TEXT NOT NULL,
  description TEXT NOT NULL,
  icone TEXT NOT NULL DEFAULT 'Wrench',
  photos TEXT[] NOT NULL DEFAULT '{}',
  duree_estimee TEXT,
  tarif_estime TEXT,
  populaire BOOLEAN NOT NULL DEFAULT false,
  points_forts TEXT[] NOT NULL DEFAULT '{}',
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.4. Interventions & Factures
CREATE TABLE IF NOT EXISTS public.interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.client_vehicles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  kilometrage INTEGER NOT NULL,
  services TEXT[] NOT NULL DEFAULT '{}',
  pieces TEXT[] NOT NULL DEFAULT '{}',
  cout NUMERIC NOT NULL DEFAULT 0,
  mecanicien_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  mecanicien_nom TEXT,
  notes TEXT,
  facture_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.5. Catalogue de Pièces Détachées
CREATE TABLE IF NOT EXISTS public.parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  reference TEXT NOT NULL,
  marque TEXT NOT NULL,
  categorie TEXT NOT NULL,
  compatibilite TEXT[] NOT NULL DEFAULT '{}',
  compatibilite_modeles TEXT[] NOT NULL DEFAULT '{}',
  plage_annees TEXT DEFAULT 'Universel',
  prix NUMERIC,
  stock INTEGER NOT NULL DEFAULT 0,
  disponibilite public.part_availability NOT NULL DEFAULT 'en_stock',
  photos TEXT[] NOT NULL DEFAULT '{}',
  description TEXT,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.6. Flotte de Véhicules de Location
CREATE TABLE IF NOT EXISTS public.rental_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  marque TEXT NOT NULL,
  modele TEXT NOT NULL,
  annee INTEGER NOT NULL,
  categorie TEXT NOT NULL DEFAULT 'SUV',
  places INTEGER NOT NULL DEFAULT 5,
  boite TEXT NOT NULL DEFAULT 'Automatique',
  carburant TEXT NOT NULL DEFAULT 'Essence',
  clim BOOLEAN NOT NULL DEFAULT true,
  prix_jour NUMERIC NOT NULL,
  prix_semaine NUMERIC,
  caution NUMERIC NOT NULL DEFAULT 100000,
  photos TEXT[] NOT NULL DEFAULT '{}',
  caracteristiques TEXT[] NOT NULL DEFAULT '{}',
  statut public.rental_status NOT NULL DEFAULT 'disponible',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.7. Réservations de Véhicules (avec exclusion anti-doublon)
CREATE TABLE IF NOT EXISTS public.reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  rental_vehicle_id UUID NOT NULL REFERENCES public.rental_vehicles(id) ON DELETE CASCADE,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  total_jours INTEGER NOT NULL DEFAULT 1,
  prix_jour NUMERIC NOT NULL DEFAULT 0,
  prix_total NUMERIC NOT NULL,
  caution NUMERIC NOT NULL DEFAULT 0,
  statut public.reservation_status NOT NULL DEFAULT 'en_attente',
  permis_url TEXT,
  identite_url TEXT,
  client_nom TEXT,
  client_telephone TEXT,
  client_email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_dates_valid CHECK (date_fin >= date_debut)
);

-- Contrainte d'exclusion GiST pour empêcher tout chevauchement sur les réservations confirmées ou en cours
DO $$ BEGIN
  ALTER TABLE public.reservations
    ADD CONSTRAINT no_overlapping_confirmed_reservations
    EXCLUDE USING gist (
      rental_vehicle_id WITH =,
      daterange(date_debut, date_fin, '[]') WITH &&
    ) WHERE (statut IN ('confirmee', 'en_cours'));
EXCEPTION
  WHEN duplicate_table THEN null;
  WHEN duplicate_object THEN null;
END $$;

-- 3.8. Dates Bloquées (maintenance, indisponibilité interne)
CREATE TABLE IF NOT EXISTS public.blocked_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rental_vehicle_id UUID NOT NULL REFERENCES public.rental_vehicles(id) ON DELETE CASCADE,
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  motif TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_blocked_dates_valid CHECK (date_fin >= date_debut)
);

-- 3.9. Demandes Unifiées (Devis, SOS Dépannage, RDV Atelier, Recherche Pièce, Swap Moteur)
CREATE TABLE IF NOT EXISTS public.requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.request_type NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  nom TEXT NOT NULL,
  telephone TEXT NOT NULL,
  email TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  statut public.request_status NOT NULL DEFAULT 'nouvelle',
  agent_assigne TEXT,
  eta_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.10. Avis & Témoignages Clients
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  client_nom TEXT NOT NULL,
  vehicule TEXT,
  note INTEGER NOT NULL CHECK (note BETWEEN 1 AND 5),
  texte TEXT NOT NULL,
  valide BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.11. Articles de Blog & Conseils Mécaniques
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  extrait TEXT,
  contenu TEXT NOT NULL,
  image TEXT,
  auteur TEXT NOT NULL DEFAULT 'Officina Djeneka',
  categorie TEXT NOT NULL DEFAULT 'Conseils Entretien',
  temps_lecture TEXT NOT NULL DEFAULT '4 min de lecture',
  publie BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.12. Notifications Utilisateurs
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destinataire_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  canal TEXT NOT NULL DEFAULT 'app',
  lu BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 4. FONCTIONS UTILITAIRES & SÉCURITÉ
-- ----------------------------------------------------------------------------

-- 4.1. Vérification du rôle Administrateur
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 4.2. Vérification du rôle Staff (Admin ou Mécanicien)
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'mecanicien')
  );
$$;

-- 4.3. Déclencheur automatique à l'inscription auth.users -> public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nom, telephone, email, role)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'nom',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'telephone',
      NEW.raw_user_meta_data->>'phone',
      ''
    ),
    COALESCE(NEW.email, ''),
    'client'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nom = CASE WHEN public.profiles.nom = '' THEN EXCLUDED.nom ELSE public.profiles.nom END,
    telephone = CASE WHEN public.profiles.telephone = '' THEN EXCLUDED.telephone ELSE public.profiles.telephone END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4.4. Empêcher un utilisateur non-admin de modifier son propre rôle
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role <> OLD.role AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Seul un administrateur peut modifier le rôle d''un utilisateur.';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_protect_profile_role ON public.profiles;
CREATE TRIGGER tr_protect_profile_role
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();

-- 4.5. Calcul automatique de la prochaine échéance d'entretien (Vidange -> +5000 km, +6 mois)
CREATE OR REPLACE FUNCTION public.compute_next_service()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_vidange BOOLEAN := false;
  s TEXT;
BEGIN
  IF NEW.services IS NOT NULL THEN
    FOREACH s IN ARRAY NEW.services LOOP
      IF lower(s) LIKE '%vidange%' THEN
        v_has_vidange := true;
        EXIT;
      END IF;
    END LOOP;
  END IF;

  IF v_has_vidange AND NEW.vehicle_id IS NOT NULL THEN
    UPDATE public.client_vehicles
    SET
      prochaine_echeance_km = NEW.kilometrage + 5000,
      prochaine_echeance_date = (COALESCE(NEW.date, CURRENT_DATE) + INTERVAL '6 months')::DATE,
      kilometrage = GREATEST(kilometrage, NEW.kilometrage)
    WHERE id = NEW.vehicle_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_compute_next_service ON public.interventions;
CREATE TRIGGER tr_compute_next_service
  AFTER INSERT ON public.interventions
  FOR EACH ROW EXECUTE FUNCTION public.compute_next_service();

-- ----------------------------------------------------------------------------
-- 5. ANTI-DOUBLON DE RÉSERVATION & FONCTIONS RPC
-- ----------------------------------------------------------------------------

-- 5.1. RPC: create_reservation
CREATE OR REPLACE FUNCTION public.create_reservation(
  p_vehicle UUID,
  p_debut DATE,
  p_fin DATE,
  p_permis TEXT DEFAULT NULL,
  p_identite TEXT DEFAULT NULL,
  p_nom TEXT DEFAULT NULL,
  p_telephone TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID;
  v_profile RECORD;
  v_vehicle RECORD;
  v_days INTEGER;
  v_weeks INTEGER;
  v_rem_days INTEGER;
  v_total_price NUMERIC;
  v_new_res RECORD;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Vous devez être connecté pour réserver un véhicule.';
  END IF;

  IF p_fin < p_debut THEN
    RAISE EXCEPTION 'La date de restitution doit être postérieure ou égale à la date de début.';
  END IF;

  -- Récupérer le véhicule
  SELECT * INTO v_vehicle FROM public.rental_vehicles WHERE id = p_vehicle;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Véhicule de location introuvable.';
  END IF;

  IF v_vehicle.statut <> 'disponible' THEN
    RAISE EXCEPTION 'Ce véhicule est actuellement en maintenance.';
  END IF;

  -- Vérifier chevauchement avec réservations confirmées ou en cours
  IF EXISTS (
    SELECT 1 FROM public.reservations
    WHERE rental_vehicle_id = p_vehicle
      AND statut IN ('confirmee', 'en_cours')
      AND daterange(date_debut, date_fin, '[]') && daterange(p_debut, p_fin, '[]')
  ) THEN
    RAISE EXCEPTION 'Ces dates ne sont pas disponibles (déjà réservé).';
  END IF;

  -- Vérifier chevauchement avec dates bloquées
  IF EXISTS (
    SELECT 1 FROM public.blocked_dates
    WHERE rental_vehicle_id = p_vehicle
      AND daterange(date_debut, date_fin, '[]') && daterange(p_debut, p_fin, '[]')
  ) THEN
    RAISE EXCEPTION 'Ces dates ne sont pas disponibles (période bloquée).';
  END IF;

  -- Récupérer coordonnées du client
  SELECT * INTO v_profile FROM public.profiles WHERE id = v_uid;

  -- Calcul du nombre de jours (inclusif)
  v_days := (p_fin - p_debut) + 1;
  IF v_days < 1 THEN
    v_days := 1;
  END IF;

  -- Calcul du prix avec réduction à la semaine si définie
  IF v_vehicle.prix_semaine IS NOT NULL AND v_vehicle.prix_semaine > 0 AND v_days >= 7 THEN
    v_weeks := v_days / 7;
    v_rem_days := v_days % 7;
    v_total_price := (v_weeks * v_vehicle.prix_semaine) + (v_rem_days * v_vehicle.prix_jour);
  ELSE
    v_total_price := v_days * v_vehicle.prix_jour;
  END IF;

  -- Insertion de la réservation en statut 'en_attente'
  INSERT INTO public.reservations (
    client_id,
    rental_vehicle_id,
    date_debut,
    date_fin,
    total_jours,
    prix_jour,
    prix_total,
    caution,
    statut,
    permis_url,
    identite_url,
    client_nom,
    client_telephone,
    client_email,
    notes
  )
  VALUES (
    v_uid,
    p_vehicle,
    p_debut,
    p_fin,
    v_days,
    v_vehicle.prix_jour,
    v_total_price,
    v_vehicle.caution,
    'en_attente',
    p_permis,
    p_identite,
    COALESCE(p_nom, v_profile.nom, 'Client'),
    COALESCE(p_telephone, v_profile.telephone, ''),
    COALESCE(p_email, v_profile.email, ''),
    p_notes
  )
  RETURNING * INTO v_new_res;

  RETURN to_jsonb(v_new_res);
END;
$$;

-- 5.2. RPC: get_unavailable_dates (accessible publiquement sans fuite de données personnelles)
CREATE OR REPLACE FUNCTION public.get_unavailable_dates(p_vehicle UUID)
RETURNS TABLE (
  date_debut DATE,
  date_fin DATE,
  type TEXT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  -- Réservations confirmées ou en cours
  SELECT
    r.date_debut,
    r.date_fin,
    'reserve'::TEXT AS type
  FROM public.reservations r
  WHERE r.rental_vehicle_id = p_vehicle
    AND r.statut IN ('confirmee', 'en_cours')

  UNION ALL

  -- Dates bloquées pour maintenance
  SELECT
    b.date_debut,
    b.date_fin,
    'bloque'::TEXT AS type
  FROM public.blocked_dates b
  WHERE b.rental_vehicle_id = p_vehicle;
$$;

GRANT EXECUTE ON FUNCTION public.get_unavailable_dates(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_reservation(UUID, DATE, DATE, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

-- ----------------------------------------------------------------------------
-- 6. POLITIQUES DE SÉCURITÉ ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 6.1. PROFILES
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_staff());

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
CREATE POLICY "profiles_insert_policy" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());

-- 6.2. CLIENT_VEHICLES
DROP POLICY IF EXISTS "client_vehicles_select" ON public.client_vehicles;
CREATE POLICY "client_vehicles_select" ON public.client_vehicles
  FOR SELECT USING (owner_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "client_vehicles_insert" ON public.client_vehicles;
CREATE POLICY "client_vehicles_insert" ON public.client_vehicles
  FOR INSERT WITH CHECK (owner_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "client_vehicles_update" ON public.client_vehicles;
CREATE POLICY "client_vehicles_update" ON public.client_vehicles
  FOR UPDATE USING (owner_id = auth.uid() OR public.is_staff())
  WITH CHECK (owner_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "client_vehicles_delete" ON public.client_vehicles;
CREATE POLICY "client_vehicles_delete" ON public.client_vehicles
  FOR DELETE USING (owner_id = auth.uid() OR public.is_admin());

-- 6.3. SERVICES (Lecture publique pour le site vitrine, écriture admin)
DROP POLICY IF EXISTS "services_select_public" ON public.services;
CREATE POLICY "services_select_public" ON public.services
  FOR SELECT USING (actif = true OR public.is_admin());

DROP POLICY IF EXISTS "services_write_admin" ON public.services;
CREATE POLICY "services_write_admin" ON public.services
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 6.4. INTERVENTIONS
DROP POLICY IF EXISTS "interventions_select" ON public.interventions;
CREATE POLICY "interventions_select" ON public.interventions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.client_vehicles cv
      WHERE cv.id = interventions.vehicle_id AND cv.owner_id = auth.uid()
    )
    OR public.is_staff()
  );

DROP POLICY IF EXISTS "interventions_staff_write" ON public.interventions;
CREATE POLICY "interventions_staff_write" ON public.interventions
  FOR INSERT WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "interventions_staff_update" ON public.interventions;
CREATE POLICY "interventions_staff_update" ON public.interventions
  FOR UPDATE USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "interventions_admin_delete" ON public.interventions;
CREATE POLICY "interventions_admin_delete" ON public.interventions
  FOR DELETE USING (public.is_admin());

-- 6.5. PARTS (Catalogue public, modification admin)
DROP POLICY IF EXISTS "parts_select_public" ON public.parts;
CREATE POLICY "parts_select_public" ON public.parts
  FOR SELECT USING (actif = true OR public.is_admin());

DROP POLICY IF EXISTS "parts_admin_all" ON public.parts;
CREATE POLICY "parts_admin_all" ON public.parts
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 6.6. RENTAL_VEHICLES (Flotte visible de tous, gestion admin)
DROP POLICY IF EXISTS "rental_vehicles_select" ON public.rental_vehicles;
CREATE POLICY "rental_vehicles_select" ON public.rental_vehicles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "rental_vehicles_admin_all" ON public.rental_vehicles;
CREATE POLICY "rental_vehicles_admin_all" ON public.rental_vehicles
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 6.7. RESERVATIONS
DROP POLICY IF EXISTS "reservations_select" ON public.reservations;
CREATE POLICY "reservations_select" ON public.reservations
  FOR SELECT USING (client_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "reservations_insert" ON public.reservations;
CREATE POLICY "reservations_insert" ON public.reservations
  FOR INSERT WITH CHECK (client_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "reservations_client_cancel" ON public.reservations;
CREATE POLICY "reservations_client_cancel" ON public.reservations
  FOR UPDATE USING (
    (client_id = auth.uid() AND statut = 'en_attente')
    OR public.is_staff()
  )
  WITH CHECK (
    (client_id = auth.uid() AND statut = 'annulee')
    OR public.is_staff()
  );

DROP POLICY IF EXISTS "reservations_admin_delete" ON public.reservations;
CREATE POLICY "reservations_admin_delete" ON public.reservations
  FOR DELETE USING (public.is_admin());

-- 6.8. BLOCKED_DATES
DROP POLICY IF EXISTS "blocked_dates_staff_all" ON public.blocked_dates;
CREATE POLICY "blocked_dates_staff_all" ON public.blocked_dates
  FOR ALL USING (public.is_staff()) WITH CHECK (public.is_staff());

-- 6.9. REQUESTS (Devis, SOS Dépannage, Swap Moteur - Insertion ouverte à tous)
DROP POLICY IF EXISTS "requests_insert_any" ON public.requests;
CREATE POLICY "requests_insert_any" ON public.requests
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "requests_select" ON public.requests;
CREATE POLICY "requests_select" ON public.requests
  FOR SELECT USING (user_id = auth.uid() OR public.is_staff());

DROP POLICY IF EXISTS "requests_staff_update" ON public.requests;
CREATE POLICY "requests_staff_update" ON public.requests
  FOR UPDATE USING (public.is_staff()) WITH CHECK (public.is_staff());

DROP POLICY IF EXISTS "requests_admin_delete" ON public.requests;
CREATE POLICY "requests_admin_delete" ON public.requests
  FOR DELETE USING (public.is_admin());

-- 6.10. REVIEWS
DROP POLICY IF EXISTS "reviews_select_public" ON public.reviews;
CREATE POLICY "reviews_select_public" ON public.reviews
  FOR SELECT USING (valide = true OR public.is_admin());

DROP POLICY IF EXISTS "reviews_insert_client" ON public.reviews;
CREATE POLICY "reviews_insert_client" ON public.reviews
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
    AND client_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1 FROM public.client_vehicles cv
        JOIN public.interventions i ON i.vehicle_id = cv.id
        WHERE cv.owner_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1 FROM public.reservations r
        WHERE r.client_id = auth.uid() AND r.statut = 'terminee'
      )
    )
  );

DROP POLICY IF EXISTS "reviews_admin_mod" ON public.reviews;
CREATE POLICY "reviews_admin_mod" ON public.reviews
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 6.11. POSTS (Blog public)
DROP POLICY IF EXISTS "posts_select_public" ON public.posts;
CREATE POLICY "posts_select_public" ON public.posts
  FOR SELECT USING (publie = true OR public.is_admin());

DROP POLICY IF EXISTS "posts_admin_all" ON public.posts;
CREATE POLICY "posts_admin_all" ON public.posts
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 6.12. NOTIFICATIONS
DROP POLICY IF EXISTS "notifications_select" ON public.notifications;
CREATE POLICY "notifications_select" ON public.notifications
  FOR SELECT USING (destinataire_id = auth.uid());

DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
CREATE POLICY "notifications_update" ON public.notifications
  FOR UPDATE USING (destinataire_id = auth.uid())
  WITH CHECK (destinataire_id = auth.uid());

DROP POLICY IF EXISTS "notifications_staff_insert" ON public.notifications;
CREATE POLICY "notifications_staff_insert" ON public.notifications
  FOR INSERT WITH CHECK (public.is_staff());

-- ----------------------------------------------------------------------------
-- 7. STOCKAGE SUPABASE (STORAGE BUCKETS & POLITIQUES)
-- ----------------------------------------------------------------------------

-- Création des buckets (media public, documents privé)
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Politiques sur storage.objects

-- 7.1. BUCKET MEDIA (Public en lecture, Admin en écriture)
DROP POLICY IF EXISTS "media_public_read" ON storage.objects;
CREATE POLICY "media_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');

DROP POLICY IF EXISTS "media_admin_write" ON storage.objects;
CREATE POLICY "media_admin_write" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'media' AND public.is_admin());

DROP POLICY IF EXISTS "media_admin_update" ON storage.objects;
CREATE POLICY "media_admin_update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'media' AND public.is_admin());

DROP POLICY IF EXISTS "media_admin_delete" ON storage.objects;
CREATE POLICY "media_admin_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'media' AND public.is_admin());

-- 7.2. BUCKET DOCUMENTS (Permis, CNI, Factures - Privé par dossier userId/)
DROP POLICY IF EXISTS "documents_user_select" ON storage.objects;
CREATE POLICY "documents_user_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents'
    AND ((storage.foldername(name))[1] = auth.uid()::TEXT OR public.is_staff())
  );

DROP POLICY IF EXISTS "documents_user_insert" ON storage.objects;
CREATE POLICY "documents_user_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents'
    AND ((storage.foldername(name))[1] = auth.uid()::TEXT OR public.is_staff())
  );

DROP POLICY IF EXISTS "documents_admin_delete" ON storage.objects;
CREATE POLICY "documents_admin_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents'
    AND ((storage.foldername(name))[1] = auth.uid()::TEXT OR public.is_admin())
  );

-- ----------------------------------------------------------------------------
-- 8. RAPPELS AUTOMATIQUES D'ENTRETIEN
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.send_service_reminders()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
  r RECORD;
BEGIN
  -- Trouver les véhicules dont l'échéance arrive dans 7 jours ou moins
  FOR r IN
    SELECT
      cv.id AS vehicle_id,
      cv.owner_id,
      cv.marque,
      cv.modele,
      cv.plaque,
      cv.prochaine_echeance_date,
      cv.prochaine_echeance_km
    FROM public.client_vehicles cv
    WHERE cv.prochaine_echeance_date IS NOT NULL
      AND cv.prochaine_echeance_date <= (CURRENT_DATE + INTERVAL '7 days')
      AND cv.prochaine_echeance_date >= CURRENT_DATE
  LOOP
    -- Insérer notification si elle n'a pas déjà été envoyée aujourd'hui
    IF NOT EXISTS (
      SELECT 1 FROM public.notifications
      WHERE destinataire_id = r.owner_id
        AND message LIKE '%' || r.plaque || '%'
        AND created_at >= (now() - INTERVAL '3 days')
    ) THEN
      INSERT INTO public.notifications (destinataire_id, message, canal)
      VALUES (
        r.owner_id,
        'Rappel entretien : Votre véhicule ' || r.marque || ' ' || r.modele || ' (' || r.plaque || ') arrive à échéance de révision le ' || to_char(r.prochaine_echeance_date, 'DD/MM/YYYY') || '. Prenez rendez-vous chez Officina Djeneka !',
        'app'
      );
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

-- Pour activer l'exécution automatique quotidienne à 8h avec pg_cron (dans Supabase Dashboard > Database > Extensions > pg_cron):
-- SELECT cron.schedule('rappel-entretien-quotidien', '0 8 * * *', 'SELECT public.send_service_reminders()');

-- ----------------------------------------------------------------------------
-- 9. TEMPS RÉEL (SUPABASE REALTIME)
-- ----------------------------------------------------------------------------
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.requests;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ----------------------------------------------------------------------------
-- 10. DONNÉES D'EXEMPLE INITIALES (SEED INDÉPENDANT)
-- ----------------------------------------------------------------------------

-- 10.1. LES 10 SERVICES DU GARAGE
INSERT INTO public.services (slug, nom, description, icone, duree_estimee, tarif_estime, populaire, points_forts, actif)
VALUES
(
  'mecanique-generale',
  'Mécanique Générale',
  'Réparation moteur, embrayage, freinage, direction et organes vitaux toutes marques (asiatiques, européennes, américaines). Conformité stricte aux tolérances constructeur.',
  'Wrench',
  '1h à 48h selon intervention',
  'À partir de 15 000 FCFA',
  true,
  ARRAY['Garantie pièces et main-d''œuvre', 'Outillage pneumatique et hydraulique certifié', 'Contrôle sécurité 30 points offert'],
  true
),
(
  'diagnostic-electronique',
  'Diagnostic Électronique',
  'Lecture des calculateurs par valises multimarques professionnelles (Bosch, Launch, Autel), analyse Live Data, effacement voyants et calibration capteurs.',
  'Cpu',
  '30 à 45 minutes',
  '10 000 FCFA',
  true,
  ARRAY['Rapport de diagnostic imprimé remis au client', 'Effacement des voyants moteur après réparation', 'Mises à jour calculateurs'],
  true
),
(
  'tolerie-peinture',
  'Tôlerie & Peinture au Four',
  'Redressage châssis laser, débosselage sans mastic superflu, apprêt antirouille et cabine de peinture pressurisée chauffée pour une finition d''origine sans peau d''orange.',
  'Palette',
  '24h à 5 jours',
  'Sur devis (dès 30 000 FCFA / panneau)',
  false,
  ARRAY['Cabine de peinture moderne étuvée', 'Peintures et vernis haute résistance UV', 'Traitement anticorrosion tropical'],
  true
),
(
  'polissage-detailing',
  'Polissage & Detailing',
  'Décontamination à la clay bar, polissage abrasif pour éliminer micro-rayures et hologrammes, puis lustrage de finition pour une brillance miroir spectaculaire.',
  'Sparkles',
  '3h à 6h',
  '25 000 à 60 000 FCFA',
  false,
  ARRAY['Efface jusqu''à 90% des micro-rayures', 'Rénovation optiques de phares incluse', 'Traitement hydrophobe pour pare-brise'],
  true
),
(
  'brillance-protection',
  'Brillance & Protection Céramique',
  'Application de cires protectrices et vitrification céramique 9H longue durée résistant au soleil ivoirien, aux résines d''arbres et aux projections latéritiques.',
  'ShieldCheck',
  '1 journée complète',
  '45 000 à 120 000 FCFA',
  false,
  ARRAY['Protection solaire anti-décoloration UV', 'Nettoyage futur facilité sans frottement', 'Garantie hydro-répulsive'],
  true
),
(
  'programmation-cles-calculateur',
  'Programmation & Électronique',
  'Taille au laser et programmation de clés à puce, Smart Keys avec transpondeur, clonage BSI, appairage d''injecteurs et réinitialisation calculateurs.',
  'Key',
  '30 minutes à 2h',
  'Dès 25 000 FCFA',
  false,
  ARRAY['Clés originales taillées au laser', 'Appairage immédiat avec le transpondeur', 'Suppression des anciennes clés égarées'],
  true
),
(
  'climatisation-auto',
  'Climatisation & Réfrigération',
  'Recharge gaz R134a/R1234yf, tirage au vide 25 minutes, détection de fuites sous azote et traceur UV, remplacement compresseurs et condenseurs.',
  'Snowflake',
  '40 minutes',
  '20 000 FCFA (Recharge complète + traceur UV)',
  true,
  ARRAY['Test d''étanchéité à haute pression', 'Traitement antibactérien de l''évaporateur', 'Air frais mesuré en sortie à 4°C-7°C'],
  true
),
(
  'depannage-remorquage',
  'Dépannage & Remorquage 24/7',
  'Plateau porte-véhicule rapide d''intervention à Bingerville, Palmeraie, Riviera, Cocody et Grand Abidjan en moins de 35 minutes.',
  'Truck',
  'Intervention moyenne sous 35 min',
  'Dès 25 000 FCFA (selon distance)',
  true,
  ARRAY['Disponible 7j/7 et 24h/24', 'Prise en charge avec géolocalisation directe', 'Plateau basculant adapté aux véhicules bas'],
  true
),
(
  'lavage-interieur-moteur',
  'Lavage Intérieur & Nettoyage Moteur',
  'Lavage vapeur haute pression sécurisé pour l''électronique, shampouinage en profondeur des sièges et moquettes, traitement plastiques satiné.',
  'Droplets',
  '1h à 2h30',
  '10 000 à 25 000 FCFA',
  false,
  ARRAY['Protection préalable des boîtiers électroniques', 'Séchage complet à l''air chaud pulsé', 'Désodorisation et assainissement'],
  true
),
(
  'vidange-rapide-15min',
  'Vidange Express en 15 Minutes',
  'Sans rendez-vous préalable. Huiles premium 100% synthèse (5W30, 5W40, 10W40), filtre neuf d''origine et contrôle gratuit des 15 points de sécurité.',
  'Timer',
  '15 minutes chrono',
  'Dès 18 000 FCFA (huile + filtre + MO)',
  true,
  ARRAY['Sans rendez-vous requis', 'Huiles homologuées TotalEnergies / Castrol', 'Remise à zéro de l''indicateur de vidange'],
  true
)
ON CONFLICT (slug) DO UPDATE SET
  nom = EXCLUDED.nom,
  description = EXCLUDED.description,
  tarif_estime = EXCLUDED.tarif_estime,
  points_forts = EXCLUDED.points_forts;

-- 10.2. LES 24 PIÈCES DÉTACHÉES DU GARAGE
INSERT INTO public.parts (nom, reference, categorie, marque, compatibilite, compatibilite_modeles, plage_annees, prix, stock, disponibilite, photos, description, actif)
VALUES
(
  'Plaquettes de frein avant céramique Bosch',
  'BSH-0986-FR',
  'Freinage',
  'Bosch',
  ARRAY['Toyota', 'Hyundai', 'Kia'],
  ARRAY['Toyota RAV4', 'Hyundai Tucson', 'Kia Sportage'],
  '2016 - 2024',
  24500,
  8,
  'en_stock',
  ARRAY['https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=400&auto=format&fit=crop&q=80'],
  'Plaquettes céramiques sans poussière noire, freinage progressif et puissant, sans couinement.',
  true
),
(
  'Jeu de 2 disques de frein ventilés Brembo',
  'BRM-09A8-DSK',
  'Freinage',
  'Brembo',
  ARRAY['Toyota', 'Lexus'],
  ARRAY['Toyota Prado 150', 'Toyota Land Cruiser', 'Lexus RX350'],
  '2012 - 2023',
  68000,
  4,
  'en_stock',
  ARRAY['https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400&auto=format&fit=crop&q=80'],
  'Disques haute teneur en carbone traités anti-corrosion, excellente dissipation thermique.',
  true
),
(
  'Filtre à huile d’origine Toyota Denso',
  'TOY-04152-YZZA1',
  'Filtration',
  'Toyota / Denso',
  ARRAY['Toyota'],
  ARRAY['Toyota Corolla', 'Toyota RAV4', 'Toyota Camry', 'Toyota Yaris'],
  '2010 - 2025',
  6500,
  35,
  'en_stock',
  ARRAY['https://images.unsplash.com/photo-1558441719-74a9e9927909?w=400&auto=format&fit=crop&q=80'],
  'Élément filtrant d’origine garantissant la préservation de la pression d’huile.',
  true
),
(
  'Filtre à air haute filtration Mann-Filter',
  'MNN-C25008',
  'Filtration',
  'Mann-Filter',
  ARRAY['Hyundai', 'Kia'],
  ARRAY['Hyundai Santa Fe', 'Kia Sorento', 'Hyundai Tucson'],
  '2015 - 2023',
  9500,
  14,
  'en_stock',
  ARRAY['https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&auto=format&fit=crop&q=80'],
  'Filtration 99.8% contre la poussière latéritique abidjanaise, débit d’air optimisé.',
  true
),
(
  'Filtre habitacle à charbon actif anti-odeur',
  'VAL-715500',
  'Filtration',
  'Valeo',
  ARRAY['Peugeot', 'Renault'],
  ARRAY['Peugeot 3008', 'Peugeot 5008', 'Renault Duster'],
  '2017 - 2024',
  11000,
  12,
  'en_stock',
  ARRAY['https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=400&auto=format&fit=crop&q=80'],
  'Arrête pollens, odeurs d’échappement et particules fines dans l’habitacle.',
  true
),
(
  'Amortisseur avant à gaz renforcé Kayaba KYB',
  'KYB-334399',
  'Suspension',
  'KYB',
  ARRAY['Toyota'],
  ARRAY['Toyota Corolla', 'Toyota RAV4'],
  '2014 - 2022',
  48000,
  6,
  'en_stock',
  ARRAY['https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=400&auto=format&fit=crop&q=80'],
  'Version renforcée Excel-G conçue pour résister aux pistes et nids-de-poule.',
  true
),
(
  'Triangle de suspension inférieur gauche complet',
  'TRW-JTC1488',
  'Suspension',
  'TRW',
  ARRAY['Hyundai', 'Kia'],
  ARRAY['Hyundai Elantra', 'Kia Cerato'],
  '2016 - 2023',
  36000,
  0,
  'sur_commande',
  ARRAY['https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400&auto=format&fit=crop&q=80'],
  'Avec rotule de suspension et silentblocs pré-montés.',
  true
),
(
  'Jeu de 2 biellettes de barre stabilisatrice',
  'MOOG-TO-LS-2984',
  'Suspension',
  'MOOG',
  ARRAY['Toyota'],
  ARRAY['Toyota Hilux', 'Toyota Fortuner'],
  '2015 - 2024',
  22000,
  9,
  'en_stock',
  ARRAY['https://images.unsplash.com/photo-1558441719-74a9e9927909?w=400&auto=format&fit=crop&q=80'],
  'Supprime les bruits de claquement sur chaussée dégradée.',
  true
),
(
  'Kit de distribution complet avec pompe à eau Gates',
  'GTS-KP15669XS',
  'Moteur',
  'Gates',
  ARRAY['Toyota'],
  ARRAY['Toyota Hilux 2.5/3.0 D-4D', 'Toyota Hiace'],
  '2005 - 2017',
  85000,
  5,
  'en_stock',
  ARRAY['https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&auto=format&fit=crop&q=80'],
  'Courroie renforcée, galets tendeurs NTN et pompe à eau à joint métallique.',
  true
),
(
  'Bougies d’allumage Iridium Tough Denso (jeu de 4)',
  'DNS-IK20TT',
  'Moteur',
  'Denso',
  ARRAY['Toyota', 'Honda', 'Nissan', 'Mazda'],
  ARRAY['Toyota RAV4', 'Honda CR-V', 'Nissan Qashqai'],
  '2010 - 2024',
  32000,
  18,
  'en_stock',
  ARRAY['https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=400&auto=format&fit=crop&q=80'],
  'Pointe iridium 0.4mm, longévité 100 000 km, allumage franc et économie de carburant.',
  true
),
(
  'Batterie tropicalisée sans entretien Varta Blue Dynamic 70Ah',
  'VRT-E23-70AH',
  'Électrique',
  'Varta',
  ARRAY['Toutes marques', 'Toyota', 'Peugeot', 'Hyundai'],
  ARRAY['SUV et berlines essence/diesel'],
  'Universel',
  62000,
  10,
  'en_stock',
  ARRAY['https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=400&auto=format&fit=crop&q=80'],
  'Puissance de démarrage 630A, alliage argent résistant aux fortes températures d’Abidjan.',
  true
),
(
  'Alternateur neuf 12V 100A Valeo',
  'VAL-439545',
  'Électrique',
  'Valeo',
  ARRAY['Peugeot', 'Citroën'],
  ARRAY['Peugeot 208', 'Peugeot 2008', 'Citroën C3'],
  '2014 - 2021',
  115000,
  3,
  'en_stock',
  ARRAY['https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400&auto=format&fit=crop&q=80'],
  'Livré complet avec poulie débrayable, garanti 1 an.',
  true
),
(
  'Démarreur haute puissance Denso 1.4kW',
  'DNS-DSN931',
  'Électrique',
  'Denso',
  ARRAY['Toyota'],
  ARRAY['Toyota Corolla 1.6/1.8', 'Toyota Auris'],
  '2008 - 2019',
  92000,
  4,
  'en_stock',
  ARRAY['https://images.unsplash.com/photo-1558441719-74a9e9927909?w=400&auto=format&fit=crop&q=80'],
  'Démarrage instantané même par fortes chaleurs, solénoïde renforcé étanche.',
  true
),
(
  'Optique de phare avant droit avec signature LED',
  'TYC-20-9831-05',
  'Éclairage',
  'TYC',
  ARRAY['Hyundai'],
  ARRAY['Hyundai Tucson TL'],
  '2018 - 2021',
  85000,
  2,
  'en_stock',
  ARRAY['https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&auto=format&fit=crop&q=80'],
  'Optique certifiée conforme OEM, lentille polycarbonate anti-jaunissement UV.',
  true
),
(
  'Feu arrière gauche LED d’origine',
  'VAL-045398',
  'Éclairage',
  'Valeo',
  ARRAY['Toyota'],
  ARRAY['Toyota RAV4 XA50'],
  '2019 - 2024',
  75000,
  0,
  'sur_commande',
  ARRAY['https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=400&auto=format&fit=crop&q=80'],
  'Éclairage full LED avec clignotant dynamique, étanchéité IP67.',
  true
),
(
  'Paire d’ampoules LED ventilées Philips H7 Ultinon Pro',
  'PHL-11972U60',
  'Éclairage',
  'Philips',
  ARRAY['Toutes marques'],
  ARRAY['Tous véhicules équipés de phares H7'],
  'Universel',
  38000,
  15,
  'en_stock',
  ARRAY['https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=400&auto=format&fit=crop&q=80'],
  '+250% de lumière sur la route, blanc pur 5800K, n’éblouit pas les usagers en face.',
  true
),
(
  'Kit d’embrayage 3 pièces LuK (Mécanisme + Disque + Butée)',
  'LUK-624328500',
  'Transmission',
  'LuK',
  ARRAY['Toyota'],
  ARRAY['Toyota Hilux', 'Toyota Fortuner 2.5 D-4D'],
  '2006 - 2016',
  125000,
  4,
  'en_stock',
  ARRAY['https://images.unsplash.com/photo-1558441719-74a9e9927909?w=400&auto=format&fit=crop&q=80'],
  'Pédale souple, garnitures organiques haute résistance aux démarrages en charge.',
  true
),
(
  'Cardan de transmission avant droit SKF',
  'SKF-VKJC8452',
  'Transmission',
  'SKF',
  ARRAY['Peugeot', 'Citroën'],
  ARRAY['Peugeot 301', 'Citroën C-Elysée'],
  '2013 - 2022',
  58000,
  3,
  'en_stock',
  ARRAY['https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&auto=format&fit=crop&q=80'],
  'Soufflets néoprène résistant à la chaleur, graisse spéciale haute pression incluse.',
  true
),
(
  'Compresseur de climatisation Denso 10S17C',
  'DNS-DCP50016',
  'Climatisation',
  'Denso',
  ARRAY['Toyota', 'Lexus'],
  ARRAY['Toyota Prado', 'Toyota Land Cruiser 200', 'Lexus LX570'],
  '2010 - 2021',
  185000,
  2,
  'en_stock',
  ARRAY['https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400&auto=format&fit=crop&q=80'],
  'Compresseur d’origine pré-rempli d’huile PAG46, performances de froid extrêmes.',
  true
),
(
  'Condenseur de climatisation avec bouteille déshydratante NRF',
  'NRF-35890-CND',
  'Climatisation',
  'NRF',
  ARRAY['Hyundai', 'Kia'],
  ARRAY['Hyundai Tucson', 'Kia Sportage'],
  '2016 - 2023',
  68000,
  3,
  'en_stock',
  ARRAY['https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=400&auto=format&fit=crop&q=80'],
  'Aluminium micro-canaux pour échange thermique maximal par temps chaud à Abidjan.',
  true
),
(
  'Radiateur de refroidissement moteur gros volume Nissens',
  'NIS-64032A',
  'Moteur',
  'Nissens',
  ARRAY['Toyota'],
  ARRAY['Toyota Corolla', 'Toyota Matrix'],
  '2009 - 2018',
  52000,
  4,
  'en_stock',
  ARRAY['https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=400&auto=format&fit=crop&q=80'],
  'Faisceau en aluminium brasé renforcé, prévient toute surchauffe moteur en embouteillages.',
  true
),
(
  'Boîte automatique reconditionnée Toyota Aisin',
  'ASN-U660E-REC',
  'Transmission',
  'Aisin',
  ARRAY['Toyota', 'Lexus'],
  ARRAY['Toyota Camry V6', 'Toyota RAV4 V6', 'Lexus ES350'],
  '2012 - 2020',
  650000,
  0,
  'sur_commande',
  ARRAY['https://images.unsplash.com/photo-1558441719-74a9e9927909?w=400&auto=format&fit=crop&q=80'],
  'Convertisseur neuf, distributeur hydraulique calibré sur banc d’essai, garantie 6 mois.',
  true
),
(
  'Crémaillère de direction assistée complète',
  'BOS-KS00000845',
  'Suspension',
  'Bosch',
  ARRAY['Mercedes-Benz'],
  ARRAY['Mercedes ML / GLE W166'],
  '2012 - 2018',
  320000,
  0,
  'indisponible',
  ARRAY['https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=400&auto=format&fit=crop&q=80'],
  'Direction assistée électrique/hydraulique testée à 100%. Réapprovisionnement sous 10 jours.',
  true
),
(
  'Bidon Huile Moteur Total Quartz Ineo ECS 5W-30 (5L)',
  'TOT-INEO-5W30',
  'Moteur',
  'TotalEnergies',
  ARRAY['Toutes marques', 'Peugeot', 'Toyota', 'Renault'],
  ARRAY['Moteurs essence et diesel récents avec FAP'],
  'Universel',
  28000,
  28,
  'en_stock',
  ARRAY['https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400&auto=format&fit=crop&q=80'],
  'Huile Low SAPS synthétique homologuée constructeurs, protection anti-usure supérieure.',
  true
)
ON CONFLICT (reference) DO NOTHING;

-- 10.3. LES 6 VÉHICULES DE LOCATION DU GARAGE
INSERT INTO public.rental_vehicles (nom, marque, modele, annee, categorie, places, boite, carburant, clim, prix_jour, prix_semaine, caution, photos, caracteristiques, statut)
VALUES
(
  'Toyota Prado TXL 4x4 (2022)',
  'Toyota',
  'Prado Land Cruiser TXL',
  2022,
  'SUV',
  7,
  'Automatique',
  'Diesel',
  true,
  60000,
  357000,
  300000,
  ARRAY[
    'https://images.unsplash.com/photo-1594502184342-2e12f877aa73?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80'
  ],
  ARRAY[
    'Climatisation automatique multi-zone',
    '7 places grand confort en cuir',
    'Caméra de recul et radars 360°',
    'Transmission 4 roues motrices permanente',
    'Bluetooth & Écran tactile Apple CarPlay',
    'Coffre spacieux pour voyages en province'
  ],
  'disponible'
),
(
  'Hyundai Tucson 2.0 Luxe (2023)',
  'Hyundai',
  'Tucson Executive',
  2023,
  'SUV',
  5,
  'Automatique',
  'Essence',
  true,
  45000,
  277000,
  200000,
  ARRAY[
    'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=800&auto=format&fit=crop&q=80'
  ],
  ARRAY[
    'Climatisation bi-zone glaciale',
    'Cockpit numérique et écran 10 pouces',
    'Toit ouvrant panoramique',
    'Consommation économique 7.4L/100km',
    'Régulateur et limiteur de vitesse'
  ],
  'disponible'
),
(
  'Toyota Hilux Double Cabine 4x4 (2023)',
  'Toyota',
  'Hilux Revo 2.8 D-4D',
  2023,
  'Pick-up',
  5,
  'Manuelle',
  'Diesel',
  true,
  50000,
  297500,
  250000,
  ARRAY[
    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1559416523-140ddc3d238c?w=800&auto=format&fit=crop&q=80'
  ],
  ARRAY[
    'Capacité de charge 1 tonne',
    'Benne avec arceau et bac plastique protecteur',
    'Passage en 4x4 court / long boîte de transfert',
    'Pneus tout-terrain mixtes neufs',
    'Climatisation renforcée'
  ],
  'disponible'
),
(
  'Toyota Corolla Berline Prestige (2022)',
  'Toyota',
  'Corolla 1.8 Dual VVT-i',
  2022,
  'Berline',
  5,
  'Automatique',
  'Essence',
  true,
  35000,
  220500,
  150000,
  ARRAY[
    'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80'
  ],
  ARRAY[
    'Idéale pour rendez-vous d’affaires à Abidjan',
    'Suspension soyeuse et insonorisation de pointe',
    'Consommation mixte très basse (6.2L/100km)',
    'Caméra de recul et radars avant/arrière',
    'Chargeur téléphone sans fil par induction'
  ],
  'disponible'
),
(
  'Kia Sportage GT-Line (2023)',
  'Kia',
  'Sportage GT-Line AWD',
  2023,
  'SUV',
  5,
  'Automatique',
  'Essence',
  true,
  48000,
  295000,
  220000,
  ARRAY[
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80'
  ],
  ARRAY[
    'Design futuriste avec signature LED boomerang',
    'Système audio premium Harman Kardon',
    'Sièges avant ventilés et chauffants',
    'Aide au maintien dans la voie',
    'Hayon de coffre électrique mains libres'
  ],
  'disponible'
),
(
  'Suzuki Swift Compacte Citadine (2022)',
  'Suzuki',
  'Swift 1.2 GLX',
  2022,
  'Citadine',
  5,
  'Automatique',
  'Essence',
  true,
  25000,
  157500,
  120000,
  ARRAY[
    'https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80'
  ],
  ARRAY[
    'Très agile pour les ruelles et le trafic urbain',
    'Facile à garer partout à Abidjan',
    'Consommation ultra sobre 4.9L/100km',
    'Climatisation puissante',
    'Connectivité Bluetooth et USB'
  ],
  'disponible'
);

-- 10.4. LES 4 ARTICLES DE BLOG PUBLIÉS
INSERT INTO public.posts (titre, slug, extrait, contenu, image, auteur, categorie, temps_lecture, publie)
VALUES
(
  'Comment préserver le moteur de votre voiture face à la chaleur et à la poussière d’Abidjan ?',
  'preserver-moteur-chaleur-poussiere-abidjan',
  'En Côte d’Ivoire, le climat tropical humide et la poussière latéritique sollicitent durement les organes mécaniques. Découvrez nos 5 règles d’or.',
  'Le climat ivoirien soumet les moteurs à rude épreuve : températures élevées associées à des embouteillages denses sous le soleil.

1. Contrôlez votre liquide de refroidissement : N''utilisez JAMAIS d''eau du robinet qui bout à 100°C et corrode l''aluminium. Utilisez exclusivement un liquide de refroidissement homologué (point d''ébullition > 115°C).

2. Le filtre à air : Le poumon de votre moteur. La latérite obstrue le filtre deux fois plus vite qu''en Europe. Remplacez-le tous les 10 000 km.

3. La viscosité d''huile : Une huile 5W30 ou 5W40 synthétique garantit un film d''huile lubrifiant résistant même à 38°C à l''arrêt.',
  'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=80',
  'Ibrahim Koné (Chef Mécanicien)',
  'Conseils Entretien',
  '4 min de lecture',
  true
),
(
  'Climatisation automobile : pourquoi votre système ne produit-il plus d’air froid ?',
  'climatisation-auto-pourquoi-plus-air-froid',
  'Votre soufflerie ne crache plus que de l’air tiède ? Découvrez les 4 causes les plus fréquentes et comment y remédier rapidement.',
  'À Bingerville et dans tout le Grand Abidjan, la climatisation automobile est un impératif de santé et de confort.

1. La micro-fuite de gaz : Le fluide R134a ne se détruit pas. S''il en manque, une fuite existe. Chez Officina Djeneka, nous injectons systématiquement un traceur UV fluorescent pour identifier la bague d''étanchéité ou le condenseur fuyard.

2. Le condenseur encrassé de boue séchée : Situé en avant du radiateur, un lavage doux haute pression permet de lui rendre son échange thermique optimal.

3. Le filtre d''habitacle colmaté : Remplacez-le tous les 6 mois pour un débit d''air sain.',
  'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=800&auto=format&fit=crop&q=80',
  'Officina Djeneka',
  'Climatisation',
  '3 min de lecture',
  true
),
(
  'Guide d’achat : comment commander un moteur d’occasion fiable (Asie vs Europe) ?',
  'guide-commander-moteur-occasion-asie-europe',
  'Origine Japon, Corée ou Allemagne : nos experts vous expliquent les spécificités, normes de compression et garanties à exiger.',
  'Le swap moteur complet est la solution la plus rentable face à un bloc coulé ou fendu.

1. Moteurs d''origine asiatique (Japon / JDM) : Kilométrages très faibles certifiés (souvent moins de 70 000 km grâce au contrôle technique Shaken).

2. Moteurs d''origine européenne : Parfaits pour Peugeot, Renault, Mercedes et BMW.

Chez Officina Djeneka, tous nos blocs moteurs importés sont testés au compressiomètre avant livraison ou montage, avec une garantie écrite de 3 à 6 mois.',
  'https://images.unsplash.com/photo-1558441719-74a9e9927909?w=800&auto=format&fit=crop&q=80',
  'Direction Technique',
  'Moteurs & Pièces',
  '5 min de lecture',
  true
),
(
  'Préparer son véhicule pour la saison des pluies en Côte d’Ivoire',
  'preparer-vehicule-saison-pluies-cote-ivoire',
  'Aquaplaning sur la voie express, flaques profondes, essuie-glaces usés : la check-list indispensable pour rouler en toute sérénité.',
  'Les pluies tropicales transforment rapidement la chaussée en piège aquatique.

1. Pneus : Moins de 3 mm de sculpture multiplie par 5 le risque de glissade sur voie rapide.

2. Balais d''essuie-glace : Le soleil brûle les caoutchoucs. Dès qu''ils laissent des stries, changez-les immédiatement.

3. Flaques profondes : Ne franchissez JAMAIS une flaque d''eau en accélérant. L''aspiration d''eau par le filtre crée un coup de bélier hydraulique qui plie les bielles et détruit le moteur.',
  'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&auto=format&fit=crop&q=80',
  'Ibrahim Koné',
  'Sécurité Routière',
  '4 min de lecture',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  titre = EXCLUDED.titre,
  contenu = EXCLUDED.contenu,
  image = EXCLUDED.image;

-- 10.5. AVIS CLIENTS APPROUVÉS (TÉMOIGNAGES VITRINE)
INSERT INTO public.reviews (client_nom, vehicule, note, texte, valide)
VALUES
(
  'Serge Koffi',
  'Toyota RAV4 2018',
  5,
  'La vidange en 15 minutes chrono est vraiment réelle ! Accueil chaleureux, personnel honnête qui ne pousse pas à la dépense inutile. Mon garage de référence à Bingerville désormais.',
  true
),
(
  'Marie-Laure Bamba',
  'Hyundai Tucson 2020',
  5,
  'Problème de climatisation qui fuyait depuis 6 mois non résolu ailleurs. Officina Djeneka a injecté le traceur UV, identifié un raccord fuyard et rechargé le gaz. Glace instantanée ! Merci à Ibrahim.',
  true
),
(
  'Capitaine N’Goran',
  'Toyota Hilux 4x4',
  5,
  'Remorquage d’urgence un dimanche soir sur la route de Bingerville suite à une surchauffe. Dépanneur arrivé en 25 minutes ! Diagnostic clair dès le lendemain matin et pièces d’origine fournies.',
  true
),
(
  'Aristide Kouakou',
  'Location Toyota Prado',
  5,
  'J’ai loué le Prado pour un voyage familial à Yamoussoukro. Véhicule impeccable, intérieur cuir propre comme sorti d’usine, caution restituée immédiatement au retour. Service 5 étoiles.',
  true
);

-- ============================================================================
-- 11. REQUÊTE POUR NOMMER VOTRE PREMIER ADMINISTRATEUR
-- ============================================================================
-- Dès que vous avez créé votre compte sur le site (avec votre adresse email),
-- exécutez la ligne ci-dessous dans le SQL Editor de Supabase pour devenir Administrateur :
--
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'babyshopy6@gmail.com';
--
-- Pour vérifier que votre rôle a bien été mis à jour :
-- SELECT id, email, nom, role FROM public.profiles WHERE email = 'babyshopy6@gmail.com';
-- ============================================================================
