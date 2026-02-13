import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import type { Simulation, ClientType, ProjectType, RoleDays, User } from '@/types';

export interface SimulationInsert {
  client_name: string;
  client_type: ClientType;
  project_type: ProjectType;
  role_days: RoleDays[];
  margin: number;
  internal_cost: number;
  cost_after_coefficient: number;
  recommended_price: number;
  created_by: string;
  created_by_name: string;
}

/** Row from Supabase (JSON fields) */
interface SimulationDbRow {
  id: string;
  client_name: string;
  client_type: unknown;
  project_type: unknown;
  role_days: unknown;
  margin: number;
  internal_cost: number;
  cost_after_coefficient: number;
  recommended_price: number;
  created_by: string | null;
  created_by_name: string | null;
  created_at: string;
}

export interface GetSimulationsParams {
  userId?: string;
  isAdmin?: boolean;
  searchQuery?: string;
  clientTypeFilter?: string;
  startDate?: Date;
  endDate?: Date;
}

function rowToSimulation(row: SimulationDbRow): Simulation {
  const createdBy: User = {
    id: row.created_by || '',
    email: '',
    name: row.created_by_name || 'Utilisateur inconnu',
    role: 'sales',
  };

  return {
    id: row.id,
    clientName: row.client_name,
    clientType: row.client_type as ClientType,
    projectType: row.project_type as ProjectType,
    roleDays: row.role_days as RoleDays[],
    margin: row.margin,
    internalCost: row.internal_cost,
    costAfterCoefficient: row.cost_after_coefficient,
    recommendedPrice: row.recommended_price,
    createdBy,
    createdAt: new Date(row.created_at),
  };
}

/**
 * Crée une nouvelle simulation dans Supabase
 */
export async function createSimulation(
  data: SimulationInsert
): Promise<{ data: Simulation | null; error: Error | null }> {
  try {
    const { data: row, error } = await supabase
      .from('simulations')
      .insert({
        client_name: data.client_name,
        client_type: data.client_type as unknown as Json,
        project_type: data.project_type as unknown as Json,
        role_days: data.role_days as unknown as Json,
        margin: data.margin,
        internal_cost: data.internal_cost,
        cost_after_coefficient: data.cost_after_coefficient,
        recommended_price: data.recommended_price,
        created_by: data.created_by,
        created_by_name: data.created_by_name,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: rowToSimulation(row as SimulationDbRow), error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Erreur lors de la création'),
    };
  }
}

/**
 * Récupère les simulations avec filtres optionnels
 */
export async function getSimulations(
  params: GetSimulationsParams = {}
): Promise<{ data: Simulation[]; error: Error | null }> {
  try {
    let query = supabase
      .from('simulations')
      .select('*')
      .order('created_at', { ascending: false });

    // Filtrer par utilisateur sauf pour les admins
    if (!params.isAdmin && params.userId) {
      query = query.eq('created_by', params.userId);
    }

    // Filtre par plage de dates
    if (params.startDate) {
      query = query.gte('created_at', params.startDate.toISOString());
    }
    if (params.endDate) {
      query = query.lte('created_at', params.endDate.toISOString());
    }

    // Filtre par type de client
    if (params.clientTypeFilter && params.clientTypeFilter !== 'all') {
      query = query.contains('client_type', { id: params.clientTypeFilter });
    }

    const { data: rows, error } = await query;

    if (error) {
      return { data: [], error };
    }

    let simulations = (rows || []).map((r) => rowToSimulation(r as SimulationDbRow));

    // Filtre de recherche (côté client car il porte sur client_name et project_type.name)
    if (params.searchQuery) {
      const q = params.searchQuery.toLowerCase();
      simulations = simulations.filter(
        (s) =>
          s.clientName.toLowerCase().includes(q) ||
          s.projectType.name.toLowerCase().includes(q)
      );
    }

    return { data: simulations, error: null };
  } catch (err) {
    return {
      data: [],
      error: err instanceof Error ? err : new Error('Erreur lors de la récupération'),
    };
  }
}

/**
 * Récupère une simulation par son ID
 */
export async function getSimulationById(
  id: string
): Promise<{ data: Simulation | null; error: Error | null }> {
  try {
    const { data: row, error } = await supabase
      .from('simulations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return { data: null, error };
    }

    return { data: rowToSimulation(row as SimulationDbRow), error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Erreur lors de la récupération'),
    };
  }
}
