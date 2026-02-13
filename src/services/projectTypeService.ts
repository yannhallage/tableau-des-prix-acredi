import { supabase } from '@/integrations/supabase/client';
import type { ProjectType } from '@/types';

/**
 * Récupère tous les types de projets depuis Supabase
 */
export async function getProjectTypes(): Promise<{
  data: ProjectType[];
  error: Error | null;
}> {
  try {
    const { data: rows, error } = await supabase
      .from('project_types')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      return { data: [], error };
    }

    const projectTypes: ProjectType[] = (rows || []).map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description || '',
      complexityLevel: row.complexity_level as 'low' | 'medium' | 'high',
    }));

    return { data: projectTypes, error: null };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err : new Error('Erreur lors de la récupération'),
    };
  }
}

/**
 * Crée un nouveau type de projet
 */
export async function createProjectType(
  data: Omit<ProjectType, 'id'>
): Promise<{ data: ProjectType | null; error: Error | null }> {
  try {
    const { data: row, error } = await supabase
      .from('project_types')
      .insert({
        name: data.name,
        description: data.description,
        complexity_level: data.complexityLevel,
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
        description: row.description || '',
        complexityLevel: row.complexity_level as 'low' | 'medium' | 'high',
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
 * Met à jour un type de projet
 */
export async function updateProjectType(
  data: ProjectType
): Promise<{ data: ProjectType | null; error: Error | null }> {
  try {
    const { data: row, error } = await supabase
      .from('project_types')
      .update({
        name: data.name,
        description: data.description,
        complexity_level: data.complexityLevel,
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
        description: row.description || '',
        complexityLevel: row.complexity_level as 'low' | 'medium' | 'high',
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
 * Supprime un type de projet (soft delete)
 */
export async function deleteProjectType(
  id: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('project_types')
      .update({ is_active: false })
      .eq('id', id);

    return { error };
  } catch (err) {
    return {
      error: err instanceof Error ? err : new Error('Erreur lors de la suppression'),
    };
  }
}
