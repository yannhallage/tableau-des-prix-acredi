import { useState, useMemo } from 'react';
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
import { Search, History, Calendar, Filter } from 'lucide-react';
import { Simulation } from '@/types';

export default function HistoryPage() {
  const { user, hasPermission } = useAuth();
  const { simulations, clientTypes } = useData();

  const [searchQuery, setSearchQuery] = useState('');
  const [clientTypeFilter, setClientTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

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

  const filteredSimulations = useMemo(() => {
    let filtered = [...simulations];

    // For non-admin users, only show their own simulations
    if (!isAdmin) {
      filtered = filtered.filter(s => s.createdBy.id === user?.id);
    }

    // Search filter
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

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(s => new Date(s.createdAt) >= filterDate);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter(s => new Date(s.createdAt) >= filterDate);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter(s => new Date(s.createdAt) >= filterDate);
          break;
      }
    }

    return filtered;
  }, [simulations, searchQuery, clientTypeFilter, dateFilter, isAdmin, user]);

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
          <div className="flex gap-3">
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
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-40">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Période" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="today">Aujourd'hui</SelectItem>
                <SelectItem value="week">Cette semaine</SelectItem>
                <SelectItem value="month">Ce mois</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Results */}
      {filteredSimulations.length === 0 ? (
        <div className="card-elevated p-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <History className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            Aucune simulation trouvée
          </h3>
          <p className="text-muted-foreground">
            {searchQuery || clientTypeFilter !== 'all' || dateFilter !== 'all'
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
    </DashboardLayout>
  );
}
