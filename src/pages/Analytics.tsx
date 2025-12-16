import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useData } from '@/contexts/DataContext';
import { Card } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { BarChart3, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';
import { format, subMonths, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PeriodFilter, PeriodType, DateRange, filterByPeriod } from '@/components/filters/PeriodFilter';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--info))', 'hsl(var(--success))', 'hsl(var(--warning))', '#8884d8', '#82ca9d', '#ffc658'];

export default function AnalyticsPage() {
  const { simulations, clientTypes } = useData();
  const [periodFilter, setPeriodFilter] = useState<PeriodType>('6months');
  const [customRange, setCustomRange] = useState<DateRange>({ start: null, end: null });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value) + ' FCFA';
  };

  const formatCompactCurrency = (value: number) => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    }
    if (value >= 1000) {
      return (value / 1000).toFixed(0) + 'K';
    }
    return value.toString();
  };

  // Get number of months for chart data
  const getMonthsCount = (): number => {
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
  };

  // Filter simulations by period
  const filteredSimulations = useMemo(() => {
    return filterByPeriod(
      simulations,
      (sim) => new Date(sim.createdAt),
      periodFilter,
      customRange
    );
  }, [simulations, periodFilter, customRange]);

  // Data by client type
  const dataByClientType = useMemo(() => {
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
  }, [filteredSimulations]);

  // Data by month
  const dataByMonth = useMemo(() => {
    const months = getMonthsCount();
    const monthsData: Record<string, { month: string; simulations: number; revenue: number }> = {};
    
    // Initialize all months
    for (let i = months - 1; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const key = format(date, 'yyyy-MM');
      const label = format(date, 'MMM yyyy', { locale: fr });
      monthsData[key] = { month: label, simulations: 0, revenue: 0 };
    }

    // Fill with data
    filteredSimulations.forEach(sim => {
      const simDate = new Date(sim.createdAt);
      const key = format(simDate, 'yyyy-MM');
      if (monthsData[key]) {
        monthsData[key].simulations += 1;
        monthsData[key].revenue += sim.recommendedPrice;
      }
    });

    return Object.values(monthsData);
  }, [filteredSimulations, periodFilter]);

  // Summary stats
  const stats = useMemo(() => {
    const totalSimulations = filteredSimulations.length;
    const totalRevenue = filteredSimulations.reduce((sum, s) => sum + s.recommendedPrice, 0);
    const avgRevenue = totalSimulations > 0 ? totalRevenue / totalSimulations : 0;
    
    return {
      totalSimulations,
      totalRevenue,
      avgRevenue,
    };
  }, [filteredSimulations]);

  return (
    <DashboardLayout
      title="Tableau de Bord Analytique"
      subtitle="Statistiques des simulations et performances"
    >
      {/* Period Filter */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Période :</span>
          <PeriodFilter
            value={periodFilter}
            onChange={setPeriodFilter}
            customRange={customRange}
            onCustomRangeChange={setCustomRange}
            onApplyCustomRange={() => {}}
            showMonthOptions
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Simulations</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalSimulations}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-success/10">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valeur Totale</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.totalRevenue)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-accent/10">
              <PieChartIcon className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Prix Moyen</p>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.avgRevenue)}</p>
            </div>
          </div>
        </Card>
      </div>

      {simulations.length === 0 ? (
        <Card className="p-12 text-center">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Aucune donnée disponible</h3>
          <p className="text-muted-foreground">
            Créez des simulations pour voir les statistiques apparaître ici.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Simulations by Month */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Évolution des Simulations
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dataByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="simulations"
                    name="Simulations"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Revenue by Month */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Évolution du Chiffre d'Affaires
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    tickFormatter={formatCompactCurrency}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number) => [formatCurrency(value), 'Revenus']}
                  />
                  <Bar 
                    dataKey="revenue" 
                    name="Revenus" 
                    fill="hsl(var(--success))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Simulations by Client Type */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Simulations par Type de Client
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataByClientType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    dataKey="simulations"
                  >
                    {dataByClientType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [value, 'Simulations']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Revenue by Client Type */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Revenus par Type de Client
            </h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataByClientType} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    type="number"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    tickFormatter={formatCompactCurrency}
                  />
                  <YAxis 
                    type="category"
                    dataKey="name"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    width={120}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: number) => [formatCurrency(value), 'Revenus']}
                  />
                  <Bar 
                    dataKey="revenue" 
                    name="Revenus" 
                    fill="hsl(var(--accent))" 
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}