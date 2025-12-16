import { supabase } from '@/integrations/supabase/client';

export function useUsageTracking() {
  const trackAction = async (action: string, details?: Record<string, any>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

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

// Standalone function for use outside of React components
export async function trackUsage(action: string, details?: Record<string, any>) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return;

    await supabase.from('usage_history').insert({
      user_id: session.user.id,
      action,
      details,
    });
  } catch (error) {
    console.error('Error tracking usage:', error);
  }
}
