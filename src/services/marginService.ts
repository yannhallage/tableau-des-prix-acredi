import { supabase } from '@/integrations/supabase/client';
import type { Margin } from '@/types';

/**
 * Récupère toutes les marges depuis Supabase
 */
export async function getMargins(): Promise<{
  data: Margin[];
  error: Error | null;
}> {
  try {
    const { data: rows, error } = await supabase
      .from('margins')
      .select('*')
      .order('percentage');

    if (error) {
      return { data: [], error };
    }

    const margins: Margin[] = (rows || []).map((row) => ({
      id: row.id,
      percentage: row.percentage,
      isActive: row.is_active,
    }));

    return { data: margins, error: null };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err : new Error('Erreur lors de la récupération'),
    };
  }
}

/**
 * Crée une nouvelle marge
 */
export async function createMargin(
  data: Omit<Margin, 'id'>
): Promise<{ data: Margin | null; error: Error | null }> {
  try {
    const { data: row, error } = await supabase
      .from('margins')
      .insert({
        percentage: data.percentage,
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
        percentage: row.percentage,
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
 * Met à jour une marge
 */
export async function updateMargin(
  data: Margin
): Promise<{ data: Margin | null; error: Error | null }> {
  try {
    const { data: row, error } = await supabase
      .from('margins')
      .update({
        percentage: data.percentage,
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
        percentage: row.percentage,
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
 * Supprime une marge
 */
export async function deleteMargin(
  id: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('margins')
      .delete()
      .eq('id', id);

    return { error };
  } catch (err) {
    return {
      error: err instanceof Error ? err : new Error('Erreur lors de la suppression'),
    };
  }
}
