// ============================================================================
// OFFICINA DJENEKA - SUPABASE EDGE FUNCTION: create-staff-user
// Fichier : supabase/functions/create-staff-user/index.ts
// ============================================================================
// Permet à un administrateur connecté de créer un compte employé (mécanicien ou admin)
// en toute sécurité sans jamais exposer la clé service_role dans le front-end.
//
// DÉPLOIEMENT :
//   supabase functions deploy create-staff-user --no-verify-jwt
//
// CONFIGURATION DU SECRET (Dashboard Supabase > Edge Functions > Secrets) :
//   SUPABASE_SERVICE_ROLE_KEY=votre_cle_secrete_service_role
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // Gestion du pre-flight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "En-tête d'autorisation manquant" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Clé service_role manquante dans la configuration Edge Functions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Vérifier que l'utilisateur qui appelle est bien un administrateur connecté
    const clientUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: callerUser }, error: callerError } = await clientUser.auth.getUser();
    if (callerError || !callerUser) {
      return new Response(
        JSON.stringify({ error: "Session invalide ou utilisateur non connecté" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: callerProfile, error: profileError } = await clientUser
      .from("profiles")
      .select("role, actif")
      .eq("id", callerUser.id)
      .single();

    if (profileError || callerProfile?.role !== "admin" || callerProfile?.actif === false) {
      return new Response(
        JSON.stringify({ error: "Accès refusé : Seul un administrateur actif peut créer un compte membre" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Récupérer le payload de création
    const body = await req.json();
    const { email, password, nom, telephone, role } = body;

    if (!email || !password || !nom) {
      return new Response(
        JSON.stringify({ error: "Champs obligatoires manquants : nom, email et mot de passe requis." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const assignedRole = role === "admin" || role === "mecanicien" ? role : "client";

    // 3. Créer l'utilisateur avec le client Admin (service_role)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: newUserData, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nom,
        telephone: telephone || "",
        role: assignedRole,
      },
    });

    if (createError || !newUserData.user) {
      return new Response(
        JSON.stringify({ error: createError?.message || "Erreur lors de la création de l'utilisateur" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const createdUserId = newUserData.user.id;

    // 4. Mettre à jour le profil avec le rôle et les informations
    const { error: upsertError } = await adminClient.from("profiles").upsert({
      id: createdUserId,
      email,
      nom,
      telephone: telephone || "",
      role: assignedRole,
      actif: true,
      updated_at: new Date().toISOString(),
    });

    if (upsertError) {
      console.warn("Erreur upsert profil :", upsertError.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Compte ${assignedRole} créé avec succès pour ${nom} (${email}).`,
        user: {
          id: createdUserId,
          email,
          nom,
          telephone,
          role: assignedRole,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Erreur interne du serveur";
    return new Response(
      JSON.stringify({ error: errorMsg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
