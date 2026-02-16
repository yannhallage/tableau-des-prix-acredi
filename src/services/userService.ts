import { supabase } from '@/integrations/supabase/client';

export interface CreateUserParams {
  email: string;
  password: string;
  name: string;
  customRoleId: string;
}

export interface CreateUserResult {
  success: boolean;
  user?: {
    id: string;
    email?: string;
  };
  error?: string;
}

/**
 * Crée un nouvel utilisateur via la fonction Edge Supabase
 */
export async function createUser(
  params: CreateUserParams
): Promise<{ data: CreateUserResult | null; error: Error | null }> {
  try {
    // Obtenir l'utilisateur actuel pour forcer la validation du token
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        data: null,
        error: new Error('Vous devez être connecté pour effectuer cette action'),
      };
    }

    // Obtenir la session actuelle et rafraîchir si nécessaire
    let { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session || !session.access_token) {
      // Essayer de rafraîchir la session
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError || !refreshedSession || !refreshedSession.access_token) {
        return {
          data: null,
          error: new Error('Session expirée. Veuillez vous reconnecter.'),
        };
      }
      session = refreshedSession;
    }

    // S'assurer que le token est valide
    if (!session?.access_token) {
      return {
        data: null,
        error: new Error('Token d\'authentification manquant. Veuillez vous reconnecter.'),
      };
    }

    // Utiliser fetch directement pour garantir l'envoi du token dans les headers
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return {
        data: null,
        error: new Error('Configuration Supabase manquante'),
      };
    }

    const functionUrl = `${supabaseUrl}/functions/v1/create-user`;
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2b3VmeWRyYWFmZWZiYW5qaWZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NzI2OTIsImV4cCI6MjA4NjU0ODY5Mn0.bOebjfgmq957FfbDAml-unKXOvOjnn5t1nXalYdZN0o",
      },
      body: JSON.stringify({
        email: params.email,
        password: params.password,
        name: params.name,
        customRoleId: params.customRoleId,
      }),
    });

    const result = await response.json();


    if(result)console.log(result)
    // if (!response.ok) {
    //   // Vérifier si c'est une erreur JWT invalide
    //   if (response.status === 401 || result.error?.includes('Invalid JWT') || result.error?.includes('JWT')) {
    //     return {
    //       data: null,
    //       error: new Error('Token d\'authentification invalide ou expiré. Veuillez vous reconnecter.'),
    //     };
    //   }
    //   // Vérifier si c'est une erreur 403 (permissions)
    //   if (response.status === 403) {
    //     return {
    //       data: null,
    //       error: new Error('Vous n\'avez pas les permissions nécessaires pour créer un utilisateur'),
    //     };
    //   }
    //   // Vérifier si c'est une erreur de déploiement (502)
    //   if (response.status === 502) {
    //     return {
    //       data: null,
    //       error: new Error('La fonction de création n\'est pas déployée. Veuillez déployer la fonction Edge "create-user" avec: supabase functions deploy create-user'),
    //     };
    //   }
    //   return {
    //     data: null,
    //     error: new Error(result.error || `Erreur ${response.status}: ${response.statusText}`),
    //   };
    // }
    
    // if (result?.error) {
    //   return {
    //     data: null,
    //     error: new Error(result.error),
    //   };
    // }

    // return {
    //   data: {
    //     success: true,
    //     user: result.user,
    //   },
    //   error: null,
    // };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Erreur lors de la création de l\'utilisateur'),
    };
  }
}
