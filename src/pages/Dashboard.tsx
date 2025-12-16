import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Calculator, History, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROLE_LABELS } from '@/types';
import { PeriodFilter, PeriodType, DateRange, filterByPeriod } from '@/components/filters/PeriodFilter';

export default function Dashboard() {
  const { user, hasPermission } = useAuth();
  const { simulations, dailyRates, clientTypes, projectTypes } = useData();
  
  const [periodFilter, setPeriodFilter] = useState<PeriodType>('month');
  const [customRange, setCustomRange] = useState<DateRange>({ start: null, end: null });

  const isAdmin = hasPermission(['admin']);

  // Filter simulations by period
  const filteredSimulations = useMemo(() => {
    return filterByPeriod(
      simulations,
      (s) => new Date(s.createdAt),
      periodFilter,
      customRange
    );
  }, [simulations, periodFilter, customRange]);

  // Calculate stats based on filtered simulations
  const totalSimulations = filteredSimulations.length;
  const totalRevenue = filteredSimulations.reduce((sum, s) => sum + s.recommendedPrice, 0);
  const activeRoles = dailyRates.filter(r => r.isActive).length;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value) + ' FCFA';
  };

  const stats = [
    {
      title: 'Simulations',
      value: totalSimulations.toString(),
      description: 'Sur la période sélectionnée',
      icon: Calculator,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      title: 'Valeur Totale',
      value: formatCurrency(totalRevenue),
      description: 'Montant total des devis',
      icon: TrendingUp,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Rôles Actifs',
      value: activeRoles.toString(),
      description: 'Profils tarifaires configurés',
      icon: Users,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Types de Projets',
      value: projectTypes.length.toString(),
      description: 'Catégories de projets',
      icon: History,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
  ];

  const quickActions = [
    {
      title: 'Nouveau Calcul',
      description: 'Créer une nouvelle simulation de prix',
      href: '/calculator',
      icon: Calculator,
      primary: true,
    },
    {
      title: 'Historique',
      description: 'Consulter les simulations précédentes',
      href: '/history',
      icon: History,
      primary: false,
    },
  ];

  return (
    <DashboardLayout
      title={`Bonjour, ${user?.name.split(' ')[0]}`}
      subtitle={`Bienvenue sur votre espace ${user?.role ? ROLE_LABELS[user.role] : ''}`}
    >
      {/* Period Filter */}
      <div className="flex items-center justify-end mb-4">
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={stat.title}
            className="stat-card animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="mt-2 text-2xl font-semibold text-foreground">{stat.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.description}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">Actions Rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              to={action.href}
              className={`group flex items-center gap-4 p-6 rounded-xl border transition-all duration-200 ${
                action.primary
                  ? 'bg-primary text-primary-foreground border-primary hover:opacity-90'
                  : 'bg-card text-card-foreground border-border hover:border-primary/30 hover:shadow-md'
              }`}
            >
              <div className={`p-3 rounded-lg ${
                action.primary
                  ? 'bg-primary-foreground/10'
                  : 'bg-muted'
              }`}>
                <action.icon className={`h-6 w-6 ${
                  action.primary ? 'text-primary-foreground' : 'text-foreground'
                }`} />
              </div>
              <div>
                <h3 className="font-semibold">{action.title}</h3>
                <p className={`text-sm ${
                  action.primary ? 'text-primary-foreground/80' : 'text-muted-foreground'
                }`}>
                  {action.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Simulations */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Simulations Récentes</h2>
          {filteredSimulations.length > 0 && (
            <Link
              to="/history"
              className="text-sm font-medium text-primary hover:underline"
            >
              Voir tout →
            </Link>
          )}
        </div>
        
        {filteredSimulations.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <History className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">Aucune simulation</h3>
            <p className="text-muted-foreground mb-4">
              Aucune simulation sur cette période.
            </p>
            <Link
              to="/calculator"
              className="inline-flex items-center gap-2 btn-accent"
            >
              <Calculator className="h-4 w-4" />
              Créer une simulation
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full">
              <thead className="table-header">
                <tr>
                  <th className="px-6 py-3 text-left">Client</th>
                  <th className="px-6 py-3 text-left">Type de Projet</th>
                  <th className="px-6 py-3 text-left">Date</th>
                  <th className="px-6 py-3 text-right">Prix Recommandé</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSimulations.slice(0, 5).map((simulation) => (
                  <tr key={simulation.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-foreground">{simulation.clientName}</p>
                        <p className="text-sm text-muted-foreground">{simulation.clientType.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-foreground">{simulation.projectType.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(simulation.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-semibold text-foreground">
                        {formatCurrency(simulation.recommendedPrice)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
