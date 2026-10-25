-- ========================================================
-- SCHÉMA SQL COMPLET POUR SUPABASE - OFFICINA DJENEKA
-- Projet : Djeneka's Project (ID: retmgeziuujgfwidsumd)
-- ========================================================

-- Activer les extensions utiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLE : PIÈCES DÉTACHÉES (PARTS)
CREATE TABLE IF NOT EXISTS public.parts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    reference TEXT NOT NULL,
    category TEXT NOT NULL,
    brand TEXT NOT NULL,
    compatible_brands JSONB DEFAULT '[]'::jsonb,
    compatible_models JSONB DEFAULT '[]'::jsonb,
    year_range TEXT DEFAULT 'Universel',
    price NUMERIC NOT NULL,
    stock_status TEXT NOT NULL DEFAULT 'in_stock',
    stock_quantity INTEGER NOT NULL DEFAULT 5,
    image_url TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABLE : VÉHICULES DE LOCATION (RENTALS)
CREATE TABLE IF NOT EXISTS public.rentals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    category TEXT NOT NULL,
    seats INTEGER NOT NULL DEFAULT 5,
    transmission TEXT NOT NULL DEFAULT 'Automatique',
    fuel TEXT NOT NULL DEFAULT 'Essence',
    air_conditioned BOOLEAN DEFAULT TRUE,
    price_per_day NUMERIC NOT NULL,
    weekly_discount_percent INTEGER DEFAULT 10,
    deposit NUMERIC NOT NULL,
    images JSONB DEFAULT '[]'::jsonb,
    features JSONB DEFAULT '[]'::jsonb,
    unavailable_dates JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABLE : RÉSERVATIONS DE LOCATION (RESERVATIONS)
CREATE TABLE IF NOT EXISTS public.reservations (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL,
    vehicle_name TEXT NOT NULL,
    vehicle_image TEXT,
    user_id TEXT,
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    client_email TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL,
    price_per_day NUMERIC NOT NULL,
    total_price NUMERIC NOT NULL,
    deposit NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'en_attente',
    license_file TEXT,
    id_card_file TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABLE : DÉPANNAGES SOS D'URGENCE (EMERGENCIES)
CREATE TABLE IF NOT EXISTS public.emergencies (
    id TEXT PRIMARY KEY,
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    location_name TEXT NOT NULL,
    coordinates JSONB,
    breakdown_type TEXT NOT NULL,
    vehicle_details TEXT,
    status TEXT NOT NULL DEFAULT 'demande_envoyee',
    assigned_mechanic TEXT,
    eta_minutes INTEGER DEFAULT 25,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABLE : DEMANDES DE DEVIS (QUOTES)
CREATE TABLE IF NOT EXISTS public.quotes (
    id TEXT PRIMARY KEY,
    service_id TEXT,
    service_name TEXT NOT NULL,
    vehicle_info TEXT NOT NULL,
    preferred_date DATE,
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    client_email TEXT,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'nouveau',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABLE : COMMANDES DE MOTEURS (ENGINE_ORDERS)
CREATE TABLE IF NOT EXISTS public.engine_orders (
    id TEXT PRIMARY KEY,
    client_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    vehicle_model TEXT NOT NULL,
    year INTEGER NOT NULL,
    origin TEXT NOT NULL,
    chassis_number TEXT NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'en_attente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. TABLE : AVIS CLIENTS (REVIEWS)
CREATE TABLE IF NOT EXISTS public.reviews (
    id TEXT PRIMARY KEY,
    author_name TEXT NOT NULL,
    author_vehicle TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    date TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'en_attente',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. TABLE : ARTICLES DE BLOG (BLOG_POSTS)
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    excerpt TEXT,
    content TEXT NOT NULL,
    cover_image TEXT,
    date TEXT NOT NULL,
    author TEXT NOT NULL,
    category TEXT NOT NULL,
    read_time TEXT DEFAULT '4 min de lecture',
    status TEXT NOT NULL DEFAULT 'publie',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. TABLE : VÉHICULES CLIENTS & INTERVENTIONS
CREATE TABLE IF NOT EXISTS public.client_vehicles (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,
    plate TEXT NOT NULL,
    mileage INTEGER NOT NULL,
    next_service_mileage INTEGER NOT NULL,
    last_service_date TEXT,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.interventions (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    vehicle_id TEXT NOT NULL,
    vehicle_name TEXT NOT NULL,
    vehicle_plate TEXT NOT NULL,
    date TEXT NOT NULL,
    mileage INTEGER NOT NULL,
    services JSONB DEFAULT '[]'::jsonb,
    parts_changed JSONB DEFAULT '[]'::jsonb,
    cost NUMERIC NOT NULL,
    mechanic_name TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ========================================================
-- SÉCURITÉ ROW LEVEL SECURITY (RLS) & POLITIQUES PUBLIQUES
-- Permet la lecture et l'écriture anonyme avec la clé publique
-- ========================================================

ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engine_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;

-- Politiques de lecture / écriture publiques pour l'application cliente
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public access parts" ON public.parts;
    CREATE POLICY "Public access parts" ON public.parts FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access rentals" ON public.rentals;
    CREATE POLICY "Public access rentals" ON public.rentals FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access reservations" ON public.reservations;
    CREATE POLICY "Public access reservations" ON public.reservations FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access emergencies" ON public.emergencies;
    CREATE POLICY "Public access emergencies" ON public.emergencies FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access quotes" ON public.quotes;
    CREATE POLICY "Public access quotes" ON public.quotes FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access engine_orders" ON public.engine_orders;
    CREATE POLICY "Public access engine_orders" ON public.engine_orders FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access reviews" ON public.reviews;
    CREATE POLICY "Public access reviews" ON public.reviews FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access blog_posts" ON public.blog_posts;
    CREATE POLICY "Public access blog_posts" ON public.blog_posts FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access client_vehicles" ON public.client_vehicles;
    CREATE POLICY "Public access client_vehicles" ON public.client_vehicles FOR ALL USING (true) WITH CHECK (true);

    DROP POLICY IF EXISTS "Public access interventions" ON public.interventions;
    CREATE POLICY "Public access interventions" ON public.interventions FOR ALL USING (true) WITH CHECK (true);
END $$;
