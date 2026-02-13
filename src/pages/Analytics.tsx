import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
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
import { PeriodFilter, PeriodType, DateRange } from '@/components/filters/PeriodFilter';
import { 
  getStatisticsData, 
  formatCurrency, 
  formatCompactCurrency,
  type SummaryStats,
  type ClientTypeData,
  type MonthData
} from '@/services/statisticsService';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--info))', 'hsl(var(--success))', 'hsl(var(--warning))', '#8884d8', '#82ca9d', '#ffc658'];

export default function AnalyticsPage() {
  const { user, hasPermission } = useAuth();
  const [periodFilter, setPeriodFilter] = useState<PeriodType>('6months');
  const [customRange, setCustomRange] = useState<DateRange>({ start: null, end: null });
  const [stats, setStats] = useState<SummaryStats>({ totalSimulations: 0, totalRevenue: 0, avgRevenue: 0 });
  const [dataByClientType, setDataByClientType] = useState<ClientTypeData[]>([]);
  const [dataByMonth, setDataByMonth] = useState<MonthData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasData, setHasData] = useState(false);

  const isAdmin = hasPermission(['admin']);

  // Charger les données statistiques
  useEffect(() => {
    const loadStatisticsData = async () => {
      if (!user) return;
      
      setIsLoading(true);
      setError(null);
      
      const { data, error: statisticsError } = await getStatisticsData({
        userId: user.user_id,
        isAdmin,
        periodFilter,
        customRange,
      });

      if (statisticsError) {
        setError(statisticsError);
        setIsLoading(false);
        return;
      }

      if (data) {
        setStats(data.summaryStats);
        setDataByClientType(data.dataByClientType);
        setDataByMonth(data.dataByMonth);
        setHasData(data.summaryStats.totalSimulations > 0);
      }
      
      setIsLoading(false);
    };

    loadStatisticsData();
  }, [user, isAdmin, periodFilter, customRange]);

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

      {isLoading ? (
        <Card className="p-12 text-center">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-pulse" />
          <p className="text-muted-foreground">Chargement des statistiques...</p>
        </Card>
      ) : error ? (
        <Card className="p-12 text-center">
          <BarChart3 className="h-12 w-12 mx-auto text-destructive mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Erreur</h3>
          <p className="text-muted-foreground">
            {error.message}
          </p>
        </Card>
      ) : !hasData ? (
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