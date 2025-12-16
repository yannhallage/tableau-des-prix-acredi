import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header to verify the admin user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header');
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's token to verify admin status
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

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

    let hasManageUsersPermission = false;

    // Check legacy admin role
    if (roleData?.role === 'admin') {
      hasManageUsersPermission = true;
    }

    // Check custom role permissions
    if (roleData?.custom_role_id) {
      const { data: customRole } = await adminClient
        .from('custom_roles')
        .select('permissions')
        .eq('id', roleData.custom_role_id)
        .single();

      if (customRole?.permissions?.can_manage_users) {
        hasManageUsersPermission = true;
      }
    }

    if (!hasManageUsersPermission) {
      console.error('No manage users permission:', roleData);
      return new Response(
        JSON.stringify({ error: 'Accès réservé aux administrateurs' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { email, password, name, customRoleId } = await req.json();

    if (!email || !password || !name) {
      return new Response(
        JSON.stringify({ error: 'Tous les champs sont requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Creating user:', email, name, customRoleId);

    // Create the user using admin API
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    });

    if (createError) {
      console.error('Create user error:', createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User created:', newUser.user?.id);

    // The trigger creates profile and default role, update with custom role if provided
    if (newUser.user && customRoleId) {
      // Wait a bit for the trigger to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { error: updateRoleError } = await adminClient
        .from('user_roles')
        .update({ 
          custom_role_id: customRoleId, 
          assigned_by: currentUser.id 
        })
        .eq('user_id', newUser.user.id);

      if (updateRoleError) {
        console.error('Update role error:', updateRoleError);
      }
    }

    // Get role name for logging
    let roleName = 'Non assigné';
    if (customRoleId) {
      const { data: roleInfo } = await adminClient
        .from('custom_roles')
        .select('name')
        .eq('id', customRoleId)
        .single();
      roleName = roleInfo?.name || roleName;
    }

    // Log this action
    await adminClient.from('usage_history').insert({
      user_id: currentUser.id,
      action: 'Création utilisateur',
      details: { created_user_email: email, assigned_role: roleName }
    });

    return new Response(
      JSON.stringify({ success: true, user: newUser.user }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Erreur serveur' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
