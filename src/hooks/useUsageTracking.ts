import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useUsageTracking() {
  const { session } = useAuth();

  const trackAction = async (action: string, details?: Record<string, any>) => {
    if (!session?.user?.id) return;

    try {
      await supabase.from('usage_history').insert({
        user_id: session.user.id,
        action,
        details,
      });
    } catch (error) {
      console.error('Error tracking usage:', error);
    }
  };

  return { trackAction };
}
