// Supabase Edge Function: create-admin
// Déployer avec: supabase functions deploy create-admin
// Utilise la clé Service Role pour inviter un nouvel administrateur via Supabase Auth
// Réservé exclusivement aux requêtes émises par un utilisateur avec le rôle 'super_admin'

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreateAdminPayload {
  full_name: string;
  email: string;
  role: "super_admin" | "admin";
  can_reply: boolean;
}

serve(async (req: Request) => {
  // Gestion preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Configuration serveur incomplète (clés manquantes)." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Client avec la clé service role pour les opérations administratives
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Authentification de l'appelant
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Non autorisé: En-tête Authorization manquant." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Session invalide ou expirée." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Vérification que l'appelant est bien un 'super_admin' actif
    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .single();

    if (profileError || !callerProfile || callerProfile.role !== "super_admin" || callerProfile.status !== "active") {
      return new Response(
        JSON.stringify({ error: "Accès refusé : Seul le Super Admin peut créer des administrateurs." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Extraction et validation du payload
    const body: CreateAdminPayload = await req.json();
    const { full_name, email, role, can_reply } = body;

    if (!full_name || !email) {
      return new Response(
        JSON.stringify({ error: "Le nom complet et l'adresse email sont obligatoires." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const assignedRole = role === "super_admin" ? "super_admin" : "admin";
    const canReplyBool = assignedRole === "super_admin" ? true : Boolean(can_reply);

    // 4. Invitation de l'utilisateur par email via Supabase Auth
    // Envoie un email d'invitation avec un lien de confirmation sécurisé
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      cleanEmail,
      {
        data: {
          full_name: full_name.trim(),
          role: assignedRole,
        },
      }
    );

    if (inviteError) {
      return new Response(
        JSON.stringify({ error: `Erreur création compte Auth: ${inviteError.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const newUserId = inviteData.user?.id;
    if (!newUserId) {
      return new Response(
        JSON.stringify({ error: "Impossible de récupérer l'identifiant du nouvel utilisateur." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Création / Mise à jour du profil dans public.profiles
    const { error: insertProfileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: newUserId,
        full_name: full_name.trim(),
        email: cleanEmail,
        role: assignedRole,
        status: "active",
        can_reply: canReplyBool,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (insertProfileError) {
      return new Response(
        JSON.stringify({ error: `Compte créé mais échec profil: ${insertProfileError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Invitation envoyée avec succès à ${cleanEmail}.`,
        user_id: newUserId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Erreur interne du serveur." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
