import type { Simulation, DailyRate, ProjectType } from '@/types';
import { PeriodType, DateRange, filterByPeriod } from '@/components/filters/PeriodFilter';
import { getSimulations, type GetSimulationsParams } from './simulationService';
import { getDailyRates } from './dailyRateService';
import { getProjectTypes } from './projectTypeService';

export interface DashboardStats {
  totalSimulations: number;
  totalRevenue: number;
  activeRoles: number;
  projectTypesCount: number;
}

export interface DashboardStatCard {
  title: string;
  value: string;
  description: string;
}

export interface RecentSimulation {
  id: string;
  clientName: string;
  clientTypeName: string;
  projectTypeName: string;
  createdAt: Date;
  recommendedPrice: number;
}

export interface GetDashboardDataParams {
  userId?: string;
  isAdmin?: boolean;
  periodFilter?: PeriodType;
  customRange?: DateRange;
}

/**
 * Formate un montant en devise FCFA
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value) + ' FCFA';
}

/**
 * Récupère toutes les données nécessaires pour le dashboard
 */
export async function getDashboardData(
  params: GetDashboardDataParams = {}
): Promise<{
  data: {
    stats: DashboardStats;
    statCards: DashboardStatCard[];
    recentSimulations: RecentSimulation[];
  } | null;
  error: Error | null;
}> {
  try {
    const { userId, isAdmin = false, periodFilter = 'month', customRange = { start: null, end: null } } = params;

    // Récupérer les simulations
    const simulationsParams: GetSimulationsParams = {
      userId,
      isAdmin,
    };
    const { data: simulations, error: simulationsError } = await getSimulations(simulationsParams);
    
    if (simulationsError) {
      return { data: null, error: simulationsError };
    }

    // Récupérer les taux journaliers
    const { data: dailyRates, error: dailyRatesError } = await getDailyRates();
    if (dailyRatesError) {
      return { data: null, error: dailyRatesError };
    }

    // Récupérer les types de projets
    const { data: projectTypes, error: projectTypesError } = await getProjectTypes();
    if (projectTypesError) {
      return { data: null, error: projectTypesError };
    }

    // Calculer les statistiques
    const stats = calculateDashboardStats(
      simulations,
      dailyRates,
      projectTypes,
      periodFilter,
      customRange
    );

    const statCards = getDashboardStatCards(stats);
    const recentSimulations = getRecentSimulations(
      simulations,
      periodFilter,
      customRange,
      5
    );

    return {
      data: {
        stats,
        statCards,
        recentSimulations,
      },
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Erreur lors de la récupération des données du dashboard'),
    };
  }
}

/**
 * Calcule les statistiques du dashboard
 */
export function calculateDashboardStats(
  simulations: Simulation[],
  dailyRates: DailyRate[],
  projectTypes: ProjectType[],
  periodFilter: PeriodType,
  customRange: DateRange
): DashboardStats {
  // Filtrer les simulations par période
  const filteredSimulations = filterByPeriod(
    simulations,
    (s) => s.createdAt,
    periodFilter,
    customRange
  );

  const totalSimulations = filteredSimulations.length;
  const totalRevenue = filteredSimulations.reduce((sum, s) => sum + s.recommendedPrice, 0);
  const activeRoles = dailyRates.filter(r => r.isActive).length;
  const projectTypesCount = projectTypes.length;

  return {
    totalSimulations,
    totalRevenue,
    activeRoles,
    projectTypesCount,
  };
}

/**
 * Génère les cartes de statistiques pour le dashboard
 */
export function getDashboardStatCards(
  stats: DashboardStats
): DashboardStatCard[] {
  return [
    {
      title: 'Simulations',
      value: stats.totalSimulations.toString(),
      description: 'Sur la période sélectionnée',
    },
    {
      title: 'Valeur Totale',
      value:   formatCurrency(stats.totalRevenue),
      description: 'Montant total des devis',
    },
    {
      title: 'Rôles Actifs',
      value: stats.activeRoles.toString(),
      description: 'Profils tarifaires configurés',
    },
    {
      title: 'Types de Projets',
      value: stats.projectTypesCount.toString(),
      description: 'Catégories de projets',
    },
  ];
}

/**
 * Récupère les simulations récentes filtrées par période
 */
export function getRecentSimulations(
  simulations: Simulation[],
  periodFilter: PeriodType,
  customRange: DateRange,
  limit: number = 5
): RecentSimulation[] {
  const filteredSimulations = filterByPeriod(
    simulations,
    (s) => s.createdAt,
    periodFilter,
    customRange
  );

  return filteredSimulations
    .slice(0, limit)
    .map((simulation) => ({
      id: simulation.id,
      clientName: simulation.clientName,
      clientTypeName: simulation.clientType.name,
      projectTypeName: simulation.projectType.name,
      createdAt: simulation.createdAt,
      recommendedPrice: simulation.recommendedPrice,
    }));
}
