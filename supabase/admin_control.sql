-- ============================================================================
-- OFFICINA DJENEKA (GARAGE MODERNE - BINGERVILLE)
-- SCRIPT SQL DE CONTRÔLE TOTAL ADMINISTRATEUR & RLS ÉTENDUE
-- Fichier : supabase/admin_control.sql
-- ============================================================================
-- Ce script est 100% IDEMPOTENT (peut être exécuté plusieurs fois en toute sécurité).
-- À exécuter dans : Supabase Dashboard > SQL Editor > New Query > Coller > Run
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS REQUISES
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 2. AJOUT COLONNE 'actif' SUR PROFILES & ENUMS
-- ----------------------------------------------------------------------------
DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS actif BOOLEAN NOT NULL DEFAULT true;
EXCEPTION WHEN undefined_table THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role public.user_role NOT NULL DEFAULT 'client';
EXCEPTION
  WHEN duplicate_column THEN null;
  WHEN undefined_object THEN null;
  WHEN undefined_table THEN null;
END $$;

-- ----------------------------------------------------------------------------
-- 3. NOUVELLES TABLES : SITE_SETTINGS, GALLERY_ITEMS, AUDIT_LOG
-- ----------------------------------------------------------------------------

-- 3.1. Table des Paramètres de l'Entreprise (ligne unique id = 1)
CREATE TABLE IF NOT EXISTS public.site_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  nom_entreprise TEXT NOT NULL DEFAULT 'Officina Djeneka (Garage Moderne)',
  slogan TEXT NOT NULL DEFAULT 'Performance & Fiabilité',
  description_courte TEXT NOT NULL DEFAULT 'Centre automobile moderne de référence à Bingerville Adjin Palmeraie : mécanique de pointe, valise diagnostic, pièces détachées certifiées et location de véhicules.',
  a_propos TEXT NOT NULL DEFAULT 'Fondé sur des exigences strictes de rigueur, de précision et de respect des normes constructeurs, Officina Djeneka accompagne les particuliers et entreprises dans la maintenance, la réparation moteur, la carrosserie et l''entretien préventif de leur parc automobile avec des équipements de dernière génération.',
  adresse TEXT NOT NULL DEFAULT 'Bingerville, Adjin Palmeraie',
  ville TEXT NOT NULL DEFAULT 'Bingerville, Abidjan (Côte d''Ivoire)',
  latitude DOUBLE PRECISION NOT NULL DEFAULT 5.358249,
  longitude DOUBLE PRECISION NOT NULL DEFAULT -3.896616,
  telephone_principal TEXT NOT NULL DEFAULT '+225 07 78 03 03 75',
  telephone_whatsapp TEXT NOT NULL DEFAULT '+39 349 080 2320',
  email TEXT NOT NULL DEFAULT 'contact@officina-djeneka.ci',
  horaires JSONB NOT NULL DEFAULT '{
    "lundi": "07h30 - 18h30",
    "mardi": "07h30 - 18h30",
    "mercredi": "07h30 - 18h30",
    "jeudi": "07h30 - 18h30",
    "vendredi": "07h30 - 18h30",
    "samedi": "07h30 - 18h30",
    "dimanche": "Fermé (astreinte dépannage 24/7)"
  }'::jsonb,
  facebook_url TEXT DEFAULT 'https://facebook.com',
  instagram_url TEXT DEFAULT 'https://instagram.com',
  tiktok_url TEXT DEFAULT '',
  youtube_url TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  favicon_url TEXT DEFAULT '',
  image_heros_url TEXT DEFAULT '',
  couleur_primaire TEXT NOT NULL DEFAULT '#1B2A6B',
  couleur_accent TEXT NOT NULL DEFAULT '#D62828',
  message_bandeau TEXT DEFAULT 'Promotion du mois : Contrôle électronique valise offert pour toute révision générale !',
  bandeau_actif BOOLEAN NOT NULL DEFAULT false,
  devise TEXT NOT NULL DEFAULT 'FCFA',
  prix_vidange_rapide NUMERIC DEFAULT 15000,
  seo_titre TEXT NOT NULL DEFAULT 'Officina Djeneka (Garage Moderne) | Performance & Fiabilité - Bingerville',
  seo_description TEXT NOT NULL DEFAULT 'Garage automobile moderne à Bingerville, Adjin Palmeraie. Mécanique générale, diagnostic électronique, tôlerie peinture, pièces détachées d''origine et dépannage urgent 24/7.',
  mode_maintenance BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Insertion de la ligne initiale par défaut (idempotent)
INSERT INTO public.site_settings (id, nom_entreprise, slogan, adresse, telephone_principal, telephone_whatsapp, couleur_primaire, couleur_accent)
VALUES (
  1,
  'Officina Djeneka (Garage Moderne)',
  'Performance & Fiabilité',
  'Bingerville, Adjin Palmeraie',
  '+225 07 78 03 03 75',
  '+39 349 080 2320',
  '#1B2A6B',
  '#D62828'
)
ON CONFLICT (id) DO NOTHING;

-- 3.2. Table de la Galerie Réalisations
CREATE TABLE IF NOT EXISTS public.gallery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titre TEXT NOT NULL,
  categorie TEXT NOT NULL DEFAULT 'Atelier',
  image_url TEXT NOT NULL,
  description TEXT,
  ordre INTEGER NOT NULL DEFAULT 0,
  actif BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3.3. Table du Journal d'Audit (Activités sensibles)
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_role TEXT,
  action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
  table_name TEXT NOT NULL,
  record_id TEXT,
  avant JSONB,
  apres JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_table ON public.audit_log(table_name);

-- ----------------------------------------------------------------------------
-- 4. FONCTIONS DE SÉCURITÉ & TRIGGER D'ADMINISTRATION
-- ----------------------------------------------------------------------------

-- 4.1. Vérification du rôle Administrateur (Anti-récursion RLS, Security Definer)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
      AND COALESCE(actif, true) = true
  );
$$;

-- 4.2. Vérification du rôle Staff (Admin ou Mécanicien actif)
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'mecanicien')
      AND COALESCE(actif, true) = true
  );
$$;

-- 4.3. Protection : Empêcher le retrait du dernier administrateur actif
CREATE OR REPLACE FUNCTION public.prevent_remove_last_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_count INTEGER;
BEGIN
  -- Vérifier seulement si l'ancien profil était un admin actif
  IF (OLD.role = 'admin' AND COALESCE(OLD.actif, true) = true) THEN
    -- Si suppression OU changement de rôle OU désactivation
    IF (TG_OP = 'DELETE' OR NEW.role <> 'admin' OR NEW.actif = false) THEN
      SELECT COUNT(*) INTO v_admin_count
      FROM public.profiles
      WHERE role = 'admin'
        AND COALESCE(actif, true) = true
        AND id <> OLD.id;

      IF v_admin_count < 1 THEN
        RAISE EXCEPTION 'Action impossible : le système doit obligatoirement conserver au moins un administrateur actif.'
          USING ERRCODE = '23514';
      END IF;
    END IF;
  END IF;

  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_remove_last_admin ON public.profiles;
CREATE TRIGGER trg_prevent_remove_last_admin
  BEFORE UPDATE OR DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_remove_last_admin();

-- 4.4. Trigger générique d'audit
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_user_email TEXT := null;
  v_user_role TEXT := null;
  v_record_id TEXT := null;
  v_avant JSONB := null;
  v_apres JSONB := null;
BEGIN
  IF v_user_id IS NOT NULL THEN
    SELECT email, role INTO v_user_email, v_user_role
    FROM public.profiles WHERE id = v_user_id;
  END IF;

  IF (TG_OP = 'INSERT') THEN
    BEGIN
      v_record_id := NEW.id::text;
    EXCEPTION WHEN OTHERS THEN
      v_record_id := null;
    END;
    v_apres := to_jsonb(NEW);
  ELSIF (TG_OP = 'UPDATE') THEN
    BEGIN
      v_record_id := NEW.id::text;
    EXCEPTION WHEN OTHERS THEN
      v_record_id := null;
    END;
    v_avant := to_jsonb(OLD);
    v_apres := to_jsonb(NEW);
  ELSIF (TG_OP = 'DELETE') THEN
    BEGIN
      v_record_id := OLD.id::text;
    EXCEPTION WHEN OTHERS THEN
      v_record_id := null;
    END;
    v_avant := to_jsonb(OLD);
  END IF;

  INSERT INTO public.audit_log (
    user_id, user_email, user_role, action, table_name, record_id, avant, apres
  ) VALUES (
    v_user_id, v_user_email, v_user_role, TG_OP, TG_TABLE_NAME, v_record_id, v_avant, v_apres
  );

  IF (TG_OP = 'DELETE') THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Attacher le déclencheur d'audit aux tables sensibles
DO $$
DECLARE
  tbl TEXT;
  target_tables TEXT[] := ARRAY[
    'services', 'parts', 'rental_vehicles', 'reservations',
    'site_settings', 'profiles', 'posts', 'reviews', 'requests', 'gallery_items'
  ];
BEGIN
  FOREACH tbl IN ARRAY target_tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%I ON public.%I;', tbl, tbl);
      EXECUTE format('CREATE TRIGGER trg_audit_%I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();', tbl, tbl);
    END IF;
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 5. POLITIQUES RLS : CONTRÔLE TOTAL ADMIN SUR TOUTES LES TABLES
-- ----------------------------------------------------------------------------

-- Macro pour appliquer le contrôle total admin de façon robuste
DO $$
DECLARE
  t TEXT;
  all_tables TEXT[] := ARRAY[
    'profiles', 'client_vehicles', 'interventions', 'services', 'parts',
    'rental_vehicles', 'reservations', 'blocked_dates', 'requests',
    'reviews', 'posts', 'notifications', 'site_settings', 'gallery_items',
    'audit_log', 'quotes', 'emergencies', 'rentals', 'engine_orders'
  ];
BEGIN
  FOREACH t IN ARRAY all_tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
      -- Activer RLS
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
      
      -- Supprimer l'ancienne politique admin si elle existe
      EXECUTE format('DROP POLICY IF EXISTS admin_all_%I ON public.%I;', t, t);
      EXECUTE format('DROP POLICY IF EXISTS "admin_all_%I" ON public.%I;', t, t);
      EXECUTE format('DROP POLICY IF EXISTS admin_full_access ON public.%I;', t);
      EXECUTE format('DROP POLICY IF EXISTS "Admins ont tout contrôle" ON public.%I;', t);
      
      -- Créer la politique d'accès total pour l'administrateur
      EXECUTE format(
        'CREATE POLICY admin_all_%I ON public.%I FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());',
        t, t
      );
    END IF;
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 6. POLITIQUES SPÉCIFIQUES COMPLÉMENTAIRES (PUBLIC & CLIENTS)
-- ----------------------------------------------------------------------------

-- 6.1. PROFILES
DROP POLICY IF EXISTS "profiles_select_own_or_staff" ON public.profiles;
CREATE POLICY "profiles_select_own_or_staff" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.is_staff());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Empêche un utilisateur classique de modifier son propre rôle ou son statut actif
    AND (public.is_admin() OR (
      role IS NOT DISTINCT FROM (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
      AND actif IS NOT DISTINCT FROM (SELECT p.actif FROM public.profiles p WHERE p.id = auth.uid())
    ))
  );

-- 6.2. SITE_SETTINGS (Lecture publique pour tous)
DROP POLICY IF EXISTS "site_settings_public_read" ON public.site_settings;
CREATE POLICY "site_settings_public_read" ON public.site_settings
  FOR SELECT TO public
  USING (true);

-- 6.3. GALLERY_ITEMS (Lecture publique des actifs)
DROP POLICY IF EXISTS "gallery_public_read" ON public.gallery_items;
CREATE POLICY "gallery_public_read" ON public.gallery_items
  FOR SELECT TO public
  USING (actif = true OR public.is_staff());

-- 6.4. SERVICES (Lecture publique des services actifs)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'services') THEN
    DROP POLICY IF EXISTS "services_public_read" ON public.services;
    CREATE POLICY "services_public_read" ON public.services
      FOR SELECT TO public USING (actif = true OR public.is_staff());
  END IF;
END $$;

-- 6.5. PARTS (Lecture publique des pièces actives)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'parts') THEN
    DROP POLICY IF EXISTS "parts_public_read" ON public.parts;
    CREATE POLICY "parts_public_read" ON public.parts
      FOR SELECT TO public USING (actif = true OR public.is_staff());
  END IF;
END $$;

-- 6.6. RENTAL_VEHICLES (Lecture publique de la flotte)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rental_vehicles') THEN
    DROP POLICY IF EXISTS "rental_vehicles_public_read" ON public.rental_vehicles;
    CREATE POLICY "rental_vehicles_public_read" ON public.rental_vehicles
      FOR SELECT TO public USING (true);
  END IF;
END $$;

-- 6.7. REVIEWS (Lecture publique des avis approuvés/validés)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews') THEN
    DROP POLICY IF EXISTS "reviews_public_read" ON public.reviews;
    CREATE POLICY "reviews_public_read" ON public.reviews
      FOR SELECT TO public USING (
        COALESCE(valide, false) = true
        OR status = 'approuve'
        OR public.is_staff()
        OR (auth.uid() IS NOT NULL AND client_id = auth.uid())
      );

    -- Droit de soumettre un avis
    DROP POLICY IF EXISTS "reviews_insert_client" ON public.reviews;
    CREATE POLICY "reviews_insert_client" ON public.reviews
      FOR INSERT TO public WITH CHECK (true);
  END IF;
END $$;

-- 6.8. POSTS (Lecture publique des articles publiés)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'posts') THEN
    DROP POLICY IF EXISTS "posts_public_read" ON public.posts;
    CREATE POLICY "posts_public_read" ON public.posts
      FOR SELECT TO public USING (COALESCE(publie, false) = true OR public.is_staff());
  END IF;
END $$;

-- 6.9. REQUESTS (Demandes client / devis / SOS)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'requests') THEN
    DROP POLICY IF EXISTS "requests_insert_public" ON public.requests;
    CREATE POLICY "requests_insert_public" ON public.requests
      FOR INSERT TO public WITH CHECK (true);

    DROP POLICY IF EXISTS "requests_select_owner_or_staff" ON public.requests;
    CREATE POLICY "requests_select_owner_or_staff" ON public.requests
      FOR SELECT TO authenticated
      USING (auth.uid() = user_id OR public.is_staff());
  END IF;
END $$;

-- 6.10. RESERVATIONS (Réservations de véhicules)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reservations') THEN
    DROP POLICY IF EXISTS "reservations_insert_client" ON public.reservations;
    CREATE POLICY "reservations_insert_client" ON public.reservations
      FOR INSERT TO public WITH CHECK (true);

    DROP POLICY IF EXISTS "reservations_select_owner_or_staff" ON public.reservations;
    CREATE POLICY "reservations_select_owner_or_staff" ON public.reservations
      FOR SELECT TO authenticated
      USING (auth.uid() = client_id OR auth.uid()::text = user_id OR public.is_staff());
  END IF;
END $$;

-- 6.11. CLIENT_VEHICLES & INTERVENTIONS
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'client_vehicles') THEN
    DROP POLICY IF EXISTS "client_vehicles_owner_or_staff" ON public.client_vehicles;
    CREATE POLICY "client_vehicles_owner_or_staff" ON public.client_vehicles
      FOR ALL TO authenticated
      USING (auth.uid() = owner_id OR public.is_staff())
      WITH CHECK (auth.uid() = owner_id OR public.is_staff());
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'interventions') THEN
    DROP POLICY IF EXISTS "interventions_owner_or_staff" ON public.interventions;
    CREATE POLICY "interventions_owner_or_staff" ON public.interventions
      FOR ALL TO authenticated
      USING (
        public.is_staff() OR
        EXISTS (
          SELECT 1 FROM public.client_vehicles v
          WHERE v.id = interventions.vehicle_id AND v.owner_id = auth.uid()
        )
      )
      WITH CHECK (public.is_staff());
  END IF;
END $$;

-- 6.12. AUDIT_LOG (Consultation réservée à l'administrateur)
DROP POLICY IF EXISTS "audit_log_admin_only" ON public.audit_log;
CREATE POLICY "audit_log_admin_only" ON public.audit_log
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- 7. POLITIQUES DE STOCKAGE (STORAGE BUCKETS : media & documents)
-- ----------------------------------------------------------------------------

-- Créer les buckets s'ils n'existent pas
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Droits admin complets sur tous les fichiers du stockage
DROP POLICY IF EXISTS "storage_admin_all" ON storage.objects;
CREATE POLICY "storage_admin_all" ON storage.objects
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Droits de lecture publique pour le bucket 'media'
DROP POLICY IF EXISTS "storage_media_public_read" ON storage.objects;
CREATE POLICY "storage_media_public_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'media');

-- Droits pour les mécaniciens de consulter les documents clients (permis, cartes grises)
DROP POLICY IF EXISTS "storage_staff_read_documents" ON storage.objects;
CREATE POLICY "storage_staff_read_documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND public.is_staff());

-- Droits pour un client d'uploader ses propres pièces justificatives
DROP POLICY IF EXISTS "storage_client_upload_documents" ON storage.objects;
CREATE POLICY "storage_client_upload_documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ----------------------------------------------------------------------------
-- 8. ATTRIBUTION DES PRIVILÈGES SQL (GRANTS)
-- ----------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Rôle 'authenticated' : accès aux opérations (les règles RLS filtrent les droits exacts)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Rôle 'anon' : lecture des tables publiques seulement + insertion devis/urgences/avis/réservations
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT ON public.gallery_items TO anon;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'services') THEN
    GRANT SELECT ON public.services TO anon;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'parts') THEN
    GRANT SELECT ON public.parts TO anon;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'rental_vehicles') THEN
    GRANT SELECT ON public.rental_vehicles TO anon;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reviews') THEN
    GRANT SELECT, INSERT ON public.reviews TO anon;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'posts') THEN
    GRANT SELECT ON public.posts TO anon;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'requests') THEN
    GRANT INSERT ON public.requests TO anon;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reservations') THEN
    GRANT INSERT ON public.reservations TO anon;
  END IF;
END $$;

-- ============================================================================
-- FIN DU SCRIPT - CONTRÔLE ADMINISTRATEUR ACTIVÉ AVEC SUCCÈS
-- ============================================================================
