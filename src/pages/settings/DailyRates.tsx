import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useData } from '@/contexts/DataContext';
import { useUsageTracking } from '@/hooks/useUsageTracking';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Users, Clock, Loader2 } from 'lucide-react';
import { DailyRate, HOURS_PER_DAY } from '@/types';
import { EmptyState } from '@/components/EmptyState';

export default function DailyRatesPage() {
  const { dailyRates, updateDailyRate, addDailyRate, deleteDailyRate, isLoadingDailyRates, refreshDailyRates } = useData();
  const { trackAction } = useUsageTracking();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<DailyRate | null>(null);
  const [formData, setFormData] = useState({ 
    roleName: '', 
    rate: '', 
    hourlyRate: '',
    isActive: true 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    refreshDailyRates();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value) + ' FCFA';
  };

  const handleOpenDialog = (rate?: DailyRate) => {
    if (rate) {
      setEditingRate(rate);
      setFormData({
        roleName: rate.roleName,
        rate: rate.rate.toString(),
        hourlyRate: rate.hourlyRate.toString(),
        isActive: rate.isActive,
      });
    } else {
      setEditingRate(null);
      setFormData({ roleName: '', rate: '', hourlyRate: '', isActive: true });
    }
    setIsDialogOpen(true);
  };

  const handleDailyRateChange = (value: string) => {
    const dailyRate = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      rate: value,
      hourlyRate: dailyRate > 0 ? Math.round(dailyRate / HOURS_PER_DAY).toString() : '',
    }));
  };

  const handleHourlyRateChange = (value: string) => {
    const hourlyRate = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      hourlyRate: value,
      rate: hourlyRate > 0 ? (hourlyRate * HOURS_PER_DAY).toString() : '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.roleName.trim()) {
      toast.error('Veuillez saisir un nom de rôle');
      return;
    }
    if (!formData.rate || parseFloat(formData.rate) <= 0) {
      toast.error('Veuillez saisir un taux valide');
      return;
    }

    setIsSubmitting(true);
    const dailyRate = parseFloat(formData.rate);
    const hourlyRate = parseFloat(formData.hourlyRate) || Math.round(dailyRate / HOURS_PER_DAY);

    const success = editingRate
      ? await updateDailyRate({
          ...editingRate,
          roleName: formData.roleName,
          rate: dailyRate,
          hourlyRate: hourlyRate,
          isActive: formData.isActive,
        })
      : await addDailyRate({
          roleName: formData.roleName,
          rate: dailyRate,
          hourlyRate: hourlyRate,
          isActive: formData.isActive,
        });

    setIsSubmitting(false);
    if (success) {
      trackAction('Modification TJM', {
        action: editingRate ? 'update' : 'add',
        roleName: formData.roleName,
        rate: dailyRate,
        hourlyRate,
      });
      toast.success(editingRate ? 'Taux journalier modifié' : 'Taux journalier ajouté');
      setIsDialogOpen(false);
    } else {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id: string, roleName: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le rôle "${roleName}" ?`)) {
      setDeletingId(id);
      const success = await deleteDailyRate(id);
      setDeletingId(null);
      if (success) {
        trackAction('Modification TJM', { action: 'delete', roleName });
        toast.success('Taux journalier supprimé');
      } else {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  const handleToggleActive = async (rate: DailyRate) => {
    setTogglingId(rate.id);
    const success = await updateDailyRate({ ...rate, isActive: !rate.isActive });
    setTogglingId(null);
    if (success) {
      toast.success(rate.isActive ? 'Rôle désactivé' : 'Rôle activé');
    } else {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  return (
    <DashboardLayout
      title="Taux Journaliers (TJM)"
      subtitle="Gérez les tarifs journaliers et horaires par rôle"
    >
      <div className="flex justify-end mb-6">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un rôle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingRate ? 'Modifier le taux' : 'Ajouter un taux journalier'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="roleName">Nom du rôle</Label>
                <Input
                  id="roleName"
                  placeholder="Ex: Développeur Senior"
                  value={formData.roleName}
                  onChange={(e) => setFormData(prev => ({ ...prev, roleName: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rate">Taux journalier (FCFA)</Label>
                  <Input
                    id="rate"
                    type="number"
                    placeholder="350000"
                    value={formData.rate}
                    onChange={(e) => handleDailyRateChange(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hourlyRate">Taux horaire (FCFA)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    placeholder="43750"
                    value={formData.hourlyRate}
                    onChange={(e) => handleHourlyRateChange(e.target.value)}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Base de calcul : {HOURS_PER_DAY} heures par jour
              </p>
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Actif</Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1" disabled={isSubmitting}>
                  Annuler
                </Button>
                <Button type="submit" className="flex-1 btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {editingRate ? 'Modification...' : 'Ajout...'}
                    </>
                  ) : (
                    editingRate ? 'Modifier' : 'Ajouter'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoadingDailyRates ? (
        <div className="card-elevated p-12 text-center text-muted-foreground">
          Chargement...
        </div>
      ) : dailyRates.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun taux journalier"
          description="Commencez par ajouter votre premier rôle et son TJM pour configurer vos tarifications."
          action={
            <Button onClick={() => handleOpenDialog()} className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un rôle
            </Button>
          }
        />
      ) : (
        <div className="card-elevated overflow-hidden">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="px-6 py-4 text-left">Rôle</th>
                <th className="px-6 py-4 text-right">Taux Journalier</th>
                <th className="px-6 py-4 text-right">Taux Horaire</th>
                <th className="px-6 py-4 text-center">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {dailyRates.map((rate, index) => (
                <tr
                  key={rate.id}
                  className="hover:bg-muted/30 transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="font-medium text-foreground">{rate.roleName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-foreground">
                    {formatCurrency(rate.rate)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatCurrency(rate.hourlyRate)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {togglingId === rate.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mx-auto" />
                    ) : (
                      <Switch
                        checked={rate.isActive}
                        onCheckedChange={() => handleToggleActive(rate)}
                      />
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(rate)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(rate.id, rate.roleName)}
                        className="text-destructive hover:text-destructive"
                        disabled={deletingId === rate.id}
                      >
                        {deletingId === rate.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}