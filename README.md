# Officina Djeneka (Garage Moderne) - Bingerville

Plateforme web officielle du garage moderne automobile **Officina Djeneka**, situé à Bingerville Adjin Palmeraie (Côte d'Ivoire).

## 🚀 Fonctionnalités principales

- **Services & Devis en ligne** : Mécanique générale, diagnostic électronique de pointe, tôlerie et peinture au four, climatisation, entretien périodique.
- **Boutique de Pièces Détachées** : Catalogue complet de pièces d'origine et adaptables certifiées avec recherche rapide et demande de disponibilité.
- **Location de Véhicules** : Flotte de véhicules récents (citadines, berlines, SUV, 4x4) avec calendrier de réservation interactif.
- **Dépannage & Remorquage 24h/7j** : Géolocalisation d'urgence, bouton d'appel direct et assistance rapide.
- **Espace Client & Suivi Véhicule** : Suivi de l'avancement des réparations en temps réel (timeline), historique des interventions et téléchargement des factures/devis.
- **Espace Administrateur & Mécaniciens** : Gestion des véhicules atelier, ordres de réparation, suivi des stocks et des réservations de location.
- **Avis Clients & Galerie Réalisations** : Témoignages vérifiés et aperçu avant/après des travaux de carrosserie et mécanique.

## 🛠️ Stack Technique

- **Frontend** : React 19, TypeScript, Vite
- **Styling** : Tailwind CSS v4, Lucide React (icônes), Motion (animations fluides)
- **Routage** : React Router v7
- **Base de données & Auth** : Supabase (PostgreSQL, Row Level Security, Storage)
- **Environnement** : Node.js / Bun

## 💻 Installation & Démarrage local

```bash
# 1. Cloner le projet
git clone https://github.com/BOKA26/djeneka.git
cd djeneka

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'environnement
cp .env.example .env
# Renseigner vos identifiants Supabase (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)

# 4. Lancer le serveur de développement
npm run dev
```

## 📦 Schéma Supabase

Le schéma de base de données complet et les politiques de sécurité RLS sont disponibles dans `supabase/schema.sql` et `supabase_schema.sql`.

---
*Officina Djeneka — Performance, Sécurité et Fiabilité Automobile.*
