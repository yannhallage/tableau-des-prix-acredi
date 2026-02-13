import { supabase } from '@/integrations/supabase/client';
import type { ClientType } from '@/types';

/**
 * Récupère tous les types de clients depuis Supabase
 */
export async function getClientTypes(): Promise<{
  data: ClientType[];
  error: Error | null;
}> {
  try {
    const { data: rows, error } = await supabase
      .from('client_types')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      return { data: [], error };
    }

    const clientTypes: ClientType[] = (rows || []).map((row) => ({
      id: row.id,
      name: row.name,
      coefficient: Number(row.coefficient),
      description: row.description || '',
    }));

    return { data: clientTypes, error: null };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err : new Error('Erreur lors de la récupération'),
    };
  }
}

/**
 * Crée un nouveau type de client
 */
export async function createClientType(
  data: Omit<ClientType, 'id'>
): Promise<{ data: ClientType | null; error: Error | null }> {
  try {
    const { data: row, error } = await supabase
      .from('client_types')
      .insert({
        name: data.name,
        coefficient: data.coefficient,
        description: data.description,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return {
      data: {
        id: row.id,
        name: row.name,
        coefficient: Number(row.coefficient),
        description: row.description || '',
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
 * Met à jour un type de client
 */
export async function updateClientType(
  data: ClientType
): Promise<{ data: ClientType | null; error: Error | null }> {
  try {
    const { data: row, error } = await supabase
      .from('client_types')
      .update({
        name: data.name,
        coefficient: data.coefficient,
        description: data.description,
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
        name: row.name,
        coefficient: Number(row.coefficient),
        description: row.description || '',
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
 * Supprime un type de client (soft delete)
 */
export async function deleteClientType(
  id: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('client_types')
      .update({ is_active: false })
      .eq('id', id);

    return { error };
  } catch (err) {
    return {
      error: err instanceof Error ? err : new Error('Erreur lors de la suppression'),
    };
  }
}
