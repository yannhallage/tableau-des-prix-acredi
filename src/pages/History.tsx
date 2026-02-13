import { useState, useMemo, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, History, Filter, Eye, Users, Briefcase, BarChart3 } from 'lucide-react';
import { Simulation } from '@/types';
import { PeriodFilter, PeriodType, DateRange, filterByPeriod } from '@/components/filters/PeriodFilter';
import { getSimulations } from '@/services/simulationService';

export default function HistoryPage() {
  const { user, hasPermission } = useAuth();
  const { clientTypes } = useData();

  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [clientTypeFilter, setClientTypeFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodType>('all');
  const [customRange, setCustomRange] = useState<DateRange>({ start: null, end: null });
  const [selectedSimulation, setSelectedSimulation] = useState<Simulation | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const isAdmin = hasPermission(['admin']);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value) + ' FCFA';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Fetch simulations from Supabase
  useEffect(() => {
    const fetchSimulations = async () => {
      setIsLoading(true);
      const { data, error } = await getSimulations({
        userId: user?.user_id,
        isAdmin,
      });

      if (!error && data) {
        setSimulations(data);
      } else if (error) {
        console.error('Erreur chargement simulations:', error);
        setSimulations([]);
      }
      setIsLoading(false);
    };

    if (user) {
      fetchSimulations();
    }
  }, [user?.user_id, isAdmin]);

  const filteredSimulations = useMemo(() => {
    let filtered = [...simulations];

    // Search filter (client-side si déjà pas appliqué par l'API)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.clientName.toLowerCase().includes(query) ||
        s.projectType.name.toLowerCase().includes(query)
      );
    }

    // Client type filter
    if (clientTypeFilter !== 'all') {
      filtered = filtered.filter(s => s.clientType.id === clientTypeFilter);
    }

    // Period filter
    filtered = filterByPeriod(
      filtered,
      (s) => new Date(s.createdAt),
      periodFilter,
      customRange
    );

    return filtered;
  }, [simulations, searchQuery, clientTypeFilter, periodFilter, customRange]);

  const handleViewDetails = (simulation: Simulation) => {
    setSelectedSimulation(simulation);
    setDetailOpen(true);
  };

  return (
    <DashboardLayout
      title="Historique des Simulations"
      subtitle="Consultez toutes vos simulations de prix"
    >
      {/* Filters */}
      <div className="card-elevated p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par client ou projet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-3 flex-wrap">
            <Select value={clientTypeFilter} onValueChange={setClientTypeFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Type de client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {clientTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="card-elevated p-12 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement des simulations...</p>
        </div>
      ) : filteredSimulations.length === 0 ? (
        <div className="card-elevated p-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <History className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            Aucune simulation trouvée
          </h3>
          <p className="text-muted-foreground">
            {searchQuery || clientTypeFilter !== 'all' || periodFilter !== 'all'
              ? 'Essayez de modifier vos filtres'
              : 'Créez votre première simulation pour la voir ici'}
          </p>
        </div>
      ) : (
        <div className="card-elevated overflow-hidden">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="px-6 py-4 text-left">Client</th>
                <th className="px-6 py-4 text-left">Type de Projet</th>
                <th className="px-6 py-4 text-left">Marge</th>
                {isAdmin && <th className="px-6 py-4 text-left">Créé par</th>}
                <th className="px-6 py-4 text-left">Date</th>
                <th className="px-6 py-4 text-right">Coût Interne</th>
                <th className="px-6 py-4 text-right">Prix Recommandé</th>
                <th className="px-6 py-4 text-right w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredSimulations.map((simulation, index) => (
                <tr
                  key={simulation.id}
                  className="hover:bg-muted/30 transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-foreground">{simulation.clientName}</p>
                      <p className="text-sm text-muted-foreground">{simulation.clientType.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-foreground">{simulation.projectType.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="badge-info">{simulation.margin}%</span>
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4">
                      <span className="text-muted-foreground">{simulation.createdBy.name}</span>
                    </td>
                  )}
                  <td className="px-6 py-4 text-muted-foreground">
                    {formatDate(simulation.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-right text-muted-foreground">
                    {formatCurrency(simulation.internalCost)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-semibold text-foreground">
                      {formatCurrency(simulation.recommendedPrice)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleViewDetails(simulation)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                      Détails
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Stats */}
      {filteredSimulations.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="stat-card">
            <p className="text-sm text-muted-foreground">Total Simulations</p>
            <p className="text-2xl font-semibold text-foreground mt-1">
              {filteredSimulations.length}
            </p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground">Coût Interne Total</p>
            <p className="text-2xl font-semibold text-foreground mt-1">
              {formatCurrency(filteredSimulations.reduce((sum, s) => sum + s.internalCost, 0))}
            </p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-muted-foreground">Valeur Totale Recommandée</p>
            <p className="text-2xl font-semibold text-foreground mt-1">
              {formatCurrency(filteredSimulations.reduce((sum, s) => sum + s.recommendedPrice, 0))}
            </p>
          </div>
        </div>
      )}

      {/* Detail Sheet */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Détails de la simulation</SheetTitle>
          </SheetHeader>
          {selectedSimulation && (
            <ScrollArea className="h-[calc(100vh-8rem)] mt-6 pr-4">
              <div className="space-y-6">
                {/* Client Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <Users className="h-4 w-4" />
                    Client
                  </div>
                  <div className="pl-6 space-y-1">
                    <p className="font-medium">{selectedSimulation.clientName}</p>
                    <p className="text-sm text-muted-foreground">
                      Type : {selectedSimulation.clientType.name} (×{selectedSimulation.clientType.coefficient})
                    </p>
                  </div>
                </div>

                {/* Project Type */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <Briefcase className="h-4 w-4" />
                    Type de projet
                  </div>
                  <div className="pl-6 space-y-1">
                    <p>{selectedSimulation.projectType.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedSimulation.projectType.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Complexité : {selectedSimulation.projectType.complexityLevel === 'high' ? 'Élevée' : selectedSimulation.projectType.complexityLevel === 'medium' ? 'Moyenne' : 'Faible'}
                    </p>
                  </div>
                </div>

                {/* Role Days */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-foreground font-medium">
                    <BarChart3 className="h-4 w-4" />
                    Charge de travail
                  </div>
                  <div className="pl-6">
                    <div className="space-y-2">
                      {selectedSimulation.roleDays.map((rd, i) => (
                        <div key={i} className="flex justify-between text-sm py-1 border-b border-border/50 last:border-0">
                          <span>{rd.roleName}</span>
                          <span>
                            {rd.days} j × {formatCurrency(rd.rate)} = {formatCurrency(rd.days * rd.rate)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="space-y-3 p-4 rounded-lg bg-muted/50">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Coût interne</span>
                    <span>{formatCurrency(selectedSimulation.internalCost)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Après coefficient</span>
                    <span>{formatCurrency(selectedSimulation.costAfterCoefficient)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Marge ({selectedSimulation.margin}%)</span>
                    <span>{formatCurrency(selectedSimulation.recommendedPrice - selectedSimulation.costAfterCoefficient)}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t border-border">
                    <span>Prix recommandé</span>
                    <span className="text-primary">{formatCurrency(selectedSimulation.recommendedPrice)}</span>
                  </div>
                </div>

                {/* Meta */}
                <div className="text-sm text-muted-foreground pt-2">
                  <p>Créée le {formatDate(selectedSimulation.createdAt)}</p>
                  {selectedSimulation.createdBy?.name && (
                    <p>Par {selectedSimulation.createdBy.name}</p>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
