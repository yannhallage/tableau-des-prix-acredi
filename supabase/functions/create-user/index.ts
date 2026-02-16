import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // ✅ CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // 🔐 Récupération du JWT
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing Authorization header" }),
        { status: 401, headers: corsHeaders }
      );
    }

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Invalid token format" }),
        { status: 401, headers: corsHeaders }
      );
    }

    // 🔑 Client ADMIN (service role)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    // ✅ VALIDATION DU JWT (LA BONNE MÉTHODE)
    const {
      data: { user: currentUser },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !currentUser) {
      return new Response(
        JSON.stringify({ error: "Invalid JWT" }),
        { status: 401, headers: corsHeaders }
      );
    }

    // 🔐 Vérification des permissions
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role, custom_role_id")
      .eq("user_id", currentUser.id)
      .single();

    let canManageUsers = roleData?.role === "admin";

    if (!canManageUsers && roleData?.custom_role_id) {
      const { data: customRole } = await supabase
        .from("custom_roles")
        .select("permissions")
        .eq("id", roleData.custom_role_id)
        .single();

      canManageUsers = !!customRole?.permissions?.can_manage_users;
    }

    if (!canManageUsers) {
      return new Response(
        JSON.stringify({ error: "Accès réservé aux administrateurs" }),
        { status: 403, headers: corsHeaders }
      );
    }

    // 📥 Payload
    const { email, password, name, customRoleId } = await req.json();

    if (!email || !password || !name) {
      return new Response(
        JSON.stringify({ error: "Tous les champs sont requis" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 👤 Création utilisateur
    const { data: created, error: createError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name },
      });

    if (createError || !created.user) {
      return new Response(
        JSON.stringify({ error: createError?.message }),
        { status: 400, headers: corsHeaders }
      );
    }

    const newUserId = created.user.id;

    // ⏳ attendre le trigger profile
    await new Promise((r) => setTimeout(r, 300));

    // 🎭 Attribution rôle
    if (customRoleId) {
      await supabase
        .from("user_roles")
        .update({
          custom_role_id: customRoleId,
          assigned_by: currentUser.id,
        })
        .eq("user_id", newUserId);
    }

    // 🧾 Historique
    await supabase.from("usage_history").insert({
      user_id: currentUser.id,
      action: "Création utilisateur",
      details: { created_user_email: email },
    });

    return new Response(
      JSON.stringify({ success: true, user: created.user }),
      { status: 200, headers: corsHeaders }
    );

  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: "Erreur serveur" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
