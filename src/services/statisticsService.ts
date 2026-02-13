import type { Simulation } from '@/types';
import { PeriodType, DateRange, filterByPeriod } from '@/components/filters/PeriodFilter';
import { format, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getSimulations, type GetSimulationsParams } from './simulationService';

export interface SummaryStats {
  totalSimulations: number;
  totalRevenue: number;
  avgRevenue: number;
}

export interface ClientTypeData {
  name: string;
  simulations: number;
  revenue: number;
}

export interface MonthData {
  month: string;
  simulations: number;
  revenue: number;
}

export interface GetStatisticsDataParams {
  userId?: string;
  isAdmin?: boolean;
  periodFilter?: PeriodType;
  customRange?: DateRange;
}

export interface StatisticsData {
  summaryStats: SummaryStats;
  dataByClientType: ClientTypeData[];
  dataByMonth: MonthData[];
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
 * Formate un montant en devise compacte (K, M)
 */
export function formatCompactCurrency(value: number): string {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(0) + 'K';
  }
  return value.toString();
}

/**
 * Obtient le nombre de mois pour les données de graphique
 */
export function getMonthsCount(periodFilter: PeriodType, customRange: DateRange): number {
  switch (periodFilter) {
    case 'today': return 1;
    case 'week': return 1;
    case 'month': return 1;
    case '3months': return 3;
    case '6months': return 6;
    case '12months': return 12;
    case 'custom':
      if (customRange.start && customRange.end) {
        const diffTime = Math.abs(customRange.end.getTime() - customRange.start.getTime());
        const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
        return Math.max(1, Math.min(diffMonths, 12));
      }
      return 6;
    default: return 6;
  }
}

/**
 * Récupère toutes les données statistiques
 */
export async function getStatisticsData(
  params: GetStatisticsDataParams = {}
): Promise<{
  data: StatisticsData | null;
  error: Error | null;
}> {
  try {
    const { userId, isAdmin = false, periodFilter = '6months', customRange = { start: null, end: null } } = params;

    // Récupérer les simulations
    const simulationsParams: GetSimulationsParams = {
      userId,
      isAdmin,
    };
    const { data: simulations, error: simulationsError } = await getSimulations(simulationsParams);
    
    if (simulationsError) {
      return { data: null, error: simulationsError };
    }

    // Calculer toutes les statistiques
    const summaryStats = calculateSummaryStats(simulations, periodFilter, customRange);
    const dataByClientType = calculateDataByClientType(simulations, periodFilter, customRange);
    const dataByMonth = calculateDataByMonth(simulations, periodFilter, customRange);

    return {
      data: {
        summaryStats,
        dataByClientType,
        dataByMonth,
      },
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err : new Error('Erreur lors de la récupération des données statistiques'),
    };
  }
}

/**
 * Calcule les statistiques résumées
 */
export function calculateSummaryStats(
  simulations: Simulation[],
  periodFilter: PeriodType,
  customRange: DateRange
): SummaryStats {
  const filteredSimulations = filterByPeriod(
    simulations,
    (sim) => sim.createdAt,
    periodFilter,
    customRange
  );

  const totalSimulations = filteredSimulations.length;
  const totalRevenue = filteredSimulations.reduce((sum, s) => sum + s.recommendedPrice, 0);
  const avgRevenue = totalSimulations > 0 ? totalRevenue / totalSimulations : 0;

  return {
    totalSimulations,
    totalRevenue,
    avgRevenue,
  };
}

/**
 * Calcule les données par type de client
 */
export function calculateDataByClientType(
  simulations: Simulation[],
  periodFilter: PeriodType,
  customRange: DateRange
): ClientTypeData[] {
  const filteredSimulations = filterByPeriod(
    simulations,
    (sim) => sim.createdAt,
    periodFilter,
    customRange
  );

  const grouped = filteredSimulations.reduce((acc, sim) => {
    const typeName = sim.clientType.name;
    if (!acc[typeName]) {
      acc[typeName] = { count: 0, revenue: 0 };
    }
    acc[typeName].count += 1;
    acc[typeName].revenue += sim.recommendedPrice;
    return acc;
  }, {} as Record<string, { count: number; revenue: number }>);

  return Object.entries(grouped).map(([name, data]) => ({
    name,
    simulations: data.count,
    revenue: data.revenue,
  }));
}

/**
 * Calcule les données par mois
 */
export function calculateDataByMonth(
  simulations: Simulation[],
  periodFilter: PeriodType,
  customRange: DateRange
): MonthData[] {
  const filteredSimulations = filterByPeriod(
    simulations,
    (sim) => sim.createdAt,
    periodFilter,
    customRange
  );

  const months = getMonthsCount(periodFilter, customRange);
  const monthsData: Record<string, { month: string; simulations: number; revenue: number }> = {};

  // Initialiser tous les mois
  for (let i = months - 1; i >= 0; i--) {
    const date = subMonths(new Date(), i);
    const key = format(date, 'yyyy-MM');
    const label = format(date, 'MMM yyyy', { locale: fr });
    monthsData[key] = { month: label, simulations: 0, revenue: 0 };
  }

  // Remplir avec les données
  filteredSimulations.forEach(sim => {
    const simDate = sim.createdAt;
    const key = format(simDate, 'yyyy-MM');
    if (monthsData[key]) {
      monthsData[key].simulations += 1;
      monthsData[key].revenue += sim.recommendedPrice;
    }
  });

  return Object.values(monthsData);
}
