import { supabase } from '@/integrations/supabase/client';
import type { DailyRate } from '@/types';

/**
 * Récupère tous les taux journaliers depuis Supabase
 */
export async function getDailyRates(): Promise<{
  data: DailyRate[];
  error: Error | null;
}> {
  try {
    const { data: rows, error } = await supabase
      .from('daily_rates')
      .select('*')
      .order('role_name');

    if (error) {
      return { data: [], error };
    }

    const dailyRates: DailyRate[] = (rows || []).map((row) => ({
      id: row.id,
      roleName: row.role_name,
      rate: Number(row.rate),
      hourlyRate: Number(row.hourly_rate),
      isActive: row.is_active,
    }));

    return { data: dailyRates, error: null };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err : new Error('Erreur lors de la récupération'),
    };
  }
}

/**
 * Crée un nouveau taux journalier
 */
export async function createDailyRate(
  data: Omit<DailyRate, 'id'>
): Promise<{ data: DailyRate | null; error: Error | null }> {
  try {
    const { data: row, error } = await supabase
      .from('daily_rates')
      .insert({
        role_name: data.roleName,
        rate: data.rate,
        hourly_rate: data.hourlyRate,
        is_active: data.isActive,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return {
      data: {
        id: row.id,
        roleName: row.role_name,
        rate: Number(row.rate),
        hourlyRate: Number(row.hourly_rate),
        isActive: row.is_active,
      },
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Erreur lors de la création'),
    };
  }
}

/**
 * Met à jour un taux journalier
 */
export async function updateDailyRate(
  data: DailyRate
): Promise<{ data: DailyRate | null; error: Error | null }> {
  try {
    const { data: row, error } = await supabase
      .from('daily_rates')
      .update({
        role_name: data.roleName,
        rate: data.rate,
        hourly_rate: data.hourlyRate,
        is_active: data.isActive,
      })
      .eq('id', data.id)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return {
      data: {
        id: row.id,
        roleName: row.role_name,
        rate: Number(row.rate),
        hourlyRate: Number(row.hourly_rate),
        isActive: row.is_active,
      },
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Erreur lors de la mise à jour'),
    };
  }
}

/**
 * Supprime un taux journalier
 */
export async function deleteDailyRate(
  id: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('daily_rates')
      .delete()
      .eq('id', id);

    return { error };
  } catch (err) {
    return {
      error: err instanceof Error ? err : new Error('Erreur lors de la suppression'),
    };
  }
}
