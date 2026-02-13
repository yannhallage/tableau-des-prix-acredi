import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  try {
    // Debug: Log all headers
    console.log('Request method:', req.method);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
    // Get the authorization header to verify the admin user
    // Try multiple header names as Supabase might use different ones
    const authHeader = req.headers.get('Authorization') || 
                      req.headers.get('authorization') ||
                      req.headers.get('x-authorization');
    
    if (!authHeader) {
      console.error('No authorization header found');
      console.error('Available headers:', Array.from(req.headers.keys()));
      return new Response(
        JSON.stringify({ error: 'Non autorisé - Token d\'authentification manquant' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Authorization header found:', authHeader.substring(0, 20) + '...');

    // Create Supabase client with user's token to verify admin status
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.error('Missing environment variables');
      return new Response(
        JSON.stringify({ error: 'Configuration serveur invalide' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: authHeader } }
    });

    // Get the current user
    const { data: { user: currentUser }, error: userError } = await userClient.auth.getUser();
    if (userError || !currentUser) {
      console.error('User auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin using the service role client
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Get user's custom role and check permissions
    const { data: roleData, error: roleError } = await adminClient
      .from('user_roles')
      .select('role, custom_role_id')
      .eq('user_id', currentUser.id)
      .single();

    let hasDeleteUsersPermission = false;

    // Check legacy admin role
    if (roleData?.role === 'admin') {
      hasDeleteUsersPermission = true;
    }

    // Check custom role permissions
    if (roleData?.custom_role_id) {
      const { data: customRole } = await adminClient
        .from('custom_roles')
        .select('permissions')
        .eq('id', roleData.custom_role_id)
        .single();

      // Vérifier la permission spécifique de suppression OU la permission générale de gestion
      if (customRole?.permissions?.can_delete_users || customRole?.permissions?.can_manage_users) {
        hasDeleteUsersPermission = true;
      }
    }

    if (!hasDeleteUsersPermission) {
      console.error('No delete users permission:', roleData);
      return new Response(
        JSON.stringify({ error: 'Accès réservé aux administrateurs - Permission de suppression requise' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return new Response(
        JSON.stringify({ error: 'Corps de requête invalide' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { userId } = requestBody;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'ID utilisateur requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent self-deletion
    if (userId === currentUser.id) {
      return new Response(
        JSON.stringify({ error: 'Vous ne pouvez pas supprimer votre propre compte' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user info before deletion for logging
    const { data: userProfile } = await adminClient
      .from('profiles')
      .select('email, name')
      .eq('user_id', userId)
      .single();

    console.log('Deleting user:', userId, userProfile?.email);

    // Delete the user using admin API
    // This will cascade delete profiles, user_roles, and usage_history due to ON DELETE CASCADE
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Delete user error:', deleteError);
      return new Response(
        JSON.stringify({ error: deleteError.message || 'Erreur lors de la suppression' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User deleted:', userId);

    // Log this action
    try {
      await adminClient.from('usage_history').insert({
        user_id: currentUser.id,
        action: 'Suppression utilisateur',
        details: { deleted_user_email: userProfile?.email || userId, deleted_user_name: userProfile?.name }
      });
    } catch (logError) {
      console.error('Error logging action:', logError);
      // Don't fail the request if logging fails
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erreur serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
