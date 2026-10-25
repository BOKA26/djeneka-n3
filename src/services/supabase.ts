import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Fallback Supabase project credentials (safe default that is guaranteed valid syntax)
export const FALLBACK_SUPABASE_URL = 'https://retmgeziuujgfwidsumd.supabase.co';
export const FALLBACK_SUPABASE_KEY = 'sb_publishable_lsO8n9EGLP0M8a9TcLPzZQ_cuVWDswp';

const RAW_ENV_URL = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const RAW_ENV_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

/**
 * Validates whether a string is a syntactically valid HTTP or HTTPS URL
 */
export function isValidSupabaseUrl(url: unknown): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.length < 8) return false;
  try {
    const parsed = new URL(trimmed);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname.length > 0;
  } catch {
    return false;
  }
}

/**
 * Normalizes input URL by trimming, removing quotes, and auto-prefixing https:// if missing
 */
export function normalizeSupabaseUrl(input: string | undefined | null): string {
  if (!input || typeof input !== 'string') return FALLBACK_SUPABASE_URL;
  let trimmed = input.trim();
  // Strip outer quotes
  trimmed = trimmed.replace(/^["']+|["']+$/g, '').trim();
  if (!trimmed) return FALLBACK_SUPABASE_URL;

  // If user pasted something like "xxxx.supabase.co" without protocol
  if (!/^https?:\/\//i.test(trimmed)) {
    if (trimmed.includes('.') && !trimmed.includes(' ')) {
      trimmed = `https://${trimmed}`;
    }
  }

  return trimmed;
}

// Validated default credentials
export const DEFAULT_SUPABASE_URL = isValidSupabaseUrl(normalizeSupabaseUrl(RAW_ENV_URL))
  ? normalizeSupabaseUrl(RAW_ENV_URL)
  : FALLBACK_SUPABASE_URL;
export const DEFAULT_SUPABASE_KEY = RAW_ENV_KEY || FALLBACK_SUPABASE_KEY;

// Retrieve current configuration (localStorage takes priority over env defaults)
export function getSupabaseConfig(): SupabaseConfig {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const custom = localStorage.getItem('od_supabase_config');
      if (custom) {
        const parsed = JSON.parse(custom);
        if (parsed && typeof parsed === 'object') {
          const candidateUrl = normalizeSupabaseUrl(parsed.url);
          const candidateKey = typeof parsed.anonKey === 'string' ? parsed.anonKey.trim() : '';

          if (isValidSupabaseUrl(candidateUrl) && candidateKey.length > 0) {
            return {
              url: candidateUrl,
              anonKey: candidateKey,
            };
          } else {
            // Bad config detected in localStorage; clear it so it doesn't crash the app
            console.warn('[Supabase] Corrupt or invalid configuration found in localStorage. Resetting to default.');
            try {
              localStorage.removeItem('od_supabase_config');
            } catch {
              // Ignore
            }
          }
        }
      }
    } catch {
      // Ignore JSON parse errors
    }
  }

  return {
    url: DEFAULT_SUPABASE_URL,
    anonKey: DEFAULT_SUPABASE_KEY,
  };
}

/**
 * Safe client instantiation that never throws uncaught exceptions
 */
function safeCreateClient(url: string, anonKey: string, options?: any): SupabaseClient {
  const normUrl = normalizeSupabaseUrl(url);
  const targetUrl = isValidSupabaseUrl(normUrl) ? normUrl : FALLBACK_SUPABASE_URL;
  const targetKey = (anonKey && typeof anonKey === 'string' && anonKey.trim().length > 0)
    ? anonKey.trim()
    : FALLBACK_SUPABASE_KEY;

  try {
    return createClient(targetUrl, targetKey, options);
  } catch (err) {
    console.warn('[Supabase] Client creation with custom config failed, falling back:', err);
    try {
      return createClient(FALLBACK_SUPABASE_URL, FALLBACK_SUPABASE_KEY, options);
    } catch (fallbackErr) {
      console.error('[Supabase] Critical: Default client creation failed:', fallbackErr);
      return createClient('https://fallback.supabase.co', 'dummy_anon_key', options);
    }
  }
}

// Global active client
const initialCfg = getSupabaseConfig();
let activeClient: SupabaseClient = safeCreateClient(initialCfg.url, initialCfg.anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export function getSupabase(): SupabaseClient {
  return activeClient;
}

// Reconnect with new credentials
export function updateSupabaseConfig(newConfig: SupabaseConfig): SupabaseClient {
  const normUrl = normalizeSupabaseUrl(newConfig.url);
  const key = newConfig.anonKey ? newConfig.anonKey.trim() : '';

  if (!isValidSupabaseUrl(normUrl)) {
    throw new Error("L'URL Supabase n'est pas valide. Elle doit débuter par https:// (ex: https://votre-projet.supabase.co)");
  }

  if (!key) {
    throw new Error("La clé d'API anonyme (anon key) est obligatoire.");
  }

  const cleanConfig: SupabaseConfig = {
    url: normUrl,
    anonKey: key,
  };

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('od_supabase_config', JSON.stringify(cleanConfig));
    }
    activeClient = safeCreateClient(cleanConfig.url, cleanConfig.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    return activeClient;
  } catch (e) {
    console.error('Failed to update Supabase config:', e);
    return activeClient;
  }
}

// Reset to default credentials
export function resetSupabaseConfig(): SupabaseClient {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.removeItem('od_supabase_config');
    } catch {
      // Ignore
    }
  }
  activeClient = safeCreateClient(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  return activeClient;
}

// Safe query execution with strict timeout to prevent ANY navigation freeze
export async function withTimeout<T>(
  promise: PromiseLike<T> | Promise<T>,
  timeoutMs = 1500,
  fallbackValue?: T
): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((resolve, reject) =>
      setTimeout(() => {
        if (fallbackValue !== undefined) {
          resolve(fallbackValue);
        } else {
          reject(new Error(`Timeout réseau (${timeoutMs}ms) - chargement local instantané`));
        }
      }, timeoutMs)
    ),
  ]);
}

export interface ConnectionStatus {
  connected: boolean;
  message: string;
  url: string;
  tablesFound?: string[];
  missingTables?: string[];
}

// Test connectivity and table presence without throwing
export async function testSupabaseConnection(customConfig?: SupabaseConfig): Promise<ConnectionStatus> {
  const targetUrl = customConfig ? normalizeSupabaseUrl(customConfig.url) : getSupabaseConfig().url;
  const targetKey = customConfig ? (customConfig.anonKey || '').trim() : getSupabaseConfig().anonKey;

  if (!isValidSupabaseUrl(targetUrl)) {
    return {
      connected: false,
      message: "L'URL Supabase est invalide. Elle doit être au format HTTPS valide (ex: https://votre-projet.supabase.co).",
      url: targetUrl || '',
    };
  }

  if (!targetKey) {
    return {
      connected: false,
      message: "La clé d'API anonyme (anon public key) est manquante.",
      url: targetUrl,
    };
  }

  try {
    const client = customConfig
      ? safeCreateClient(targetUrl, targetKey, { auth: { persistSession: false } })
      : activeClient;

    // 2.5s maximum test timeout
    const res = await withTimeout<any>(client.from('parts').select('id').limit(1), 2500);
    const error = res?.error;

    if (error) {
      if (
        error.code === '42P01' ||
        error.message?.includes('relation') ||
        error.message?.includes('does not exist')
      ) {
        return {
          connected: true,
          message: 'Connecté avec succès à Supabase ! Vos tables doivent maintenant être créées avec le script SQL.',
          url: targetUrl,
          tablesFound: [],
          missingTables: ['parts', 'rentals', 'reservations', 'emergencies', 'quotes'],
        };
      }
      return {
        connected: false,
        message: `Erreur Supabase: ${error.message} (${error.code || 'Code inconnu'})`,
        url: targetUrl,
      };
    }

    return {
      connected: true,
      message: 'Base de données Supabase connectée et table des pièces opérationnelle !',
      url: targetUrl,
      tablesFound: ['parts'],
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Délai d’attente dépassé ou réseau inaccessible';
    return {
      connected: false,
      message: `Impossible de contacter Supabase: ${msg}`,
      url: targetUrl,
    };
  }
}

// Complete SQL Schema script ready for Supabase SQL Editor
export const SUPABASE_SQL_SCHEMA = `-- ========================================================
-- OFFICINA DJENEKA (GARAGE MODERNE) - SCHEMA COMPLET SUPABASE
-- À exécuter dans : Supabase Dashboard > SQL Editor > New Query
-- ========================================================

-- 1. Table des Pièces Détachées
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
  stock_status TEXT DEFAULT 'in_stock',
  stock_quantity INTEGER DEFAULT 5,
  image_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table des Commandes de Moteurs
CREATE TABLE IF NOT EXISTS public.engine_orders (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  vehicle_model TEXT NOT NULL,
  year INTEGER,
  origin TEXT NOT NULL,
  chassis_number TEXT,
  notes TEXT,
  status TEXT DEFAULT 'en_attente',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Table des Véhicules de Location
CREATE TABLE IF NOT EXISTS public.rentals (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  category TEXT NOT NULL,
  seats INTEGER DEFAULT 5,
  transmission TEXT DEFAULT 'Automatique',
  fuel TEXT DEFAULT 'Essence',
  air_conditioned BOOLEAN DEFAULT TRUE,
  price_per_day NUMERIC NOT NULL,
  weekly_discount_percent NUMERIC DEFAULT 10,
  deposit NUMERIC DEFAULT 100000,
  images JSONB DEFAULT '[]'::jsonb,
  features JSONB DEFAULT '[]'::jsonb,
  unavailable_dates JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Table des Réservations de Véhicules
CREATE TABLE IF NOT EXISTS public.reservations (
  id TEXT PRIMARY KEY,
  vehicle_id TEXT REFERENCES public.rentals(id) ON DELETE SET NULL,
  vehicle_name TEXT NOT NULL,
  vehicle_image TEXT,
  user_id TEXT,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  total_days INTEGER NOT NULL,
  price_per_day NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  deposit NUMERIC NOT NULL,
  status TEXT DEFAULT 'en_attente',
  license_file TEXT,
  id_card_file TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Table des Dépannages Urgents (SOS)
CREATE TABLE IF NOT EXISTS public.emergencies (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  location_name TEXT NOT NULL,
  coordinates JSONB,
  breakdown_type TEXT NOT NULL,
  vehicle_details TEXT,
  status TEXT DEFAULT 'demande_envoyee',
  assigned_mechanic TEXT,
  eta_minutes INTEGER DEFAULT 25,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Table des Demandes de Devis
CREATE TABLE IF NOT EXISTS public.quotes (
  id TEXT PRIMARY KEY,
  service_id TEXT,
  service_name TEXT NOT NULL,
  vehicle_info TEXT NOT NULL,
  preferred_date TEXT,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT,
  message TEXT,
  status TEXT DEFAULT 'nouveau',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Table des Véhicules Clients (Carnet d'entretien)
CREATE TABLE IF NOT EXISTS public.client_vehicles (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  plate TEXT NOT NULL,
  mileage INTEGER NOT NULL,
  next_service_mileage INTEGER,
  last_service_date TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Table des Interventions & Factures
CREATE TABLE IF NOT EXISTS public.interventions (
  id TEXT PRIMARY KEY,
  client_id TEXT NOT NULL,
  vehicle_id TEXT REFERENCES public.client_vehicles(id) ON DELETE CASCADE,
  vehicle_name TEXT NOT NULL,
  vehicle_plate TEXT NOT NULL,
  date TEXT NOT NULL,
  mileage INTEGER NOT NULL,
  services JSONB DEFAULT '[]'::jsonb,
  parts_changed JSONB DEFAULT '[]'::jsonb,
  cost NUMERIC NOT NULL,
  mechanic_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Table des Avis Clients
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY,
  author_name TEXT NOT NULL,
  author_vehicle TEXT,
  rating INTEGER NOT NULL,
  comment TEXT NOT NULL,
  date TEXT NOT NULL,
  status TEXT DEFAULT 'en_attente',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Table des Articles de Blog
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image TEXT,
  date TEXT NOT NULL,
  author TEXT NOT NULL,
  category TEXT NOT NULL,
  read_time TEXT DEFAULT '4 min de lecture',
  status TEXT DEFAULT 'publie',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Configuration des règles de sécurité (Row Level Security - RLS)
ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engine_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Politiques ouvertes pour l'application front-end (Anon Key)
CREATE POLICY "Public Read Parts" ON public.parts FOR SELECT USING (true);
CREATE POLICY "Public Write Parts" ON public.parts FOR ALL USING (true);

CREATE POLICY "Public Read Engine Orders" ON public.engine_orders FOR SELECT USING (true);
CREATE POLICY "Public Write Engine Orders" ON public.engine_orders FOR ALL USING (true);

CREATE POLICY "Public Read Rentals" ON public.rentals FOR SELECT USING (true);
CREATE POLICY "Public Write Rentals" ON public.rentals FOR ALL USING (true);

CREATE POLICY "Public Read Reservations" ON public.reservations FOR SELECT USING (true);
CREATE POLICY "Public Write Reservations" ON public.reservations FOR ALL USING (true);

CREATE POLICY "Public Read Emergencies" ON public.emergencies FOR SELECT USING (true);
CREATE POLICY "Public Write Emergencies" ON public.emergencies FOR ALL USING (true);

CREATE POLICY "Public Read Quotes" ON public.quotes FOR SELECT USING (true);
CREATE POLICY "Public Write Quotes" ON public.quotes FOR ALL USING (true);

CREATE POLICY "Public Read Client Vehicles" ON public.client_vehicles FOR SELECT USING (true);
CREATE POLICY "Public Write Client Vehicles" ON public.client_vehicles FOR ALL USING (true);

CREATE POLICY "Public Read Interventions" ON public.interventions FOR SELECT USING (true);
CREATE POLICY "Public Write Interventions" ON public.interventions FOR ALL USING (true);

CREATE POLICY "Public Read Reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Public Write Reviews" ON public.reviews FOR ALL USING (true);

CREATE POLICY "Public Read Blog" ON public.blog_posts FOR SELECT USING (true);
CREATE POLICY "Public Write Blog" ON public.blog_posts FOR ALL USING (true);
`;
