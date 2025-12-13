import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useData } from '@/contexts/DataContext';
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
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import { DailyRate } from '@/types';

export default function DailyRatesPage() {
  const { dailyRates, updateDailyRate, addDailyRate, deleteDailyRate } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<DailyRate | null>(null);
  const [formData, setFormData] = useState({ roleName: '', rate: '', isActive: true });

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
        isActive: rate.isActive,
      });
    } else {
      setEditingRate(null);
      setFormData({ roleName: '', rate: '', isActive: true });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.roleName.trim()) {
      toast.error('Veuillez saisir un nom de rôle');
      return;
    }
    if (!formData.rate || parseFloat(formData.rate) <= 0) {
      toast.error('Veuillez saisir un taux valide');
      return;
    }

    if (editingRate) {
      updateDailyRate({
        ...editingRate,
        roleName: formData.roleName,
        rate: parseFloat(formData.rate),
        isActive: formData.isActive,
      });
      toast.success('Taux journalier modifié');
    } else {
      addDailyRate({
        roleName: formData.roleName,
        rate: parseFloat(formData.rate),
        isActive: formData.isActive,
      });
      toast.success('Taux journalier ajouté');
    }

    setIsDialogOpen(false);
  };

  const handleDelete = (id: string, roleName: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le rôle "${roleName}" ?`)) {
      deleteDailyRate(id);
      toast.success('Taux journalier supprimé');
    }
  };

  const handleToggleActive = (rate: DailyRate) => {
    updateDailyRate({ ...rate, isActive: !rate.isActive });
    toast.success(rate.isActive ? 'Rôle désactivé' : 'Rôle activé');
  };

  return (
    <DashboardLayout
      title="Taux Journaliers (TJM)"
      subtitle="Gérez les tarifs journaliers par rôle"
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
              <div className="space-y-2">
                <Label htmlFor="rate">Taux journalier (FCFA)</Label>
                <Input
                  id="rate"
                  type="number"
                  placeholder="350000"
                  value={formData.rate}
                  onChange={(e) => setFormData(prev => ({ ...prev, rate: e.target.value }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Actif</Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                  Annuler
                </Button>
                <Button type="submit" className="flex-1 btn-primary">
                  {editingRate ? 'Modifier' : 'Ajouter'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="card-elevated overflow-hidden">
        <table className="w-full">
          <thead className="table-header">
            <tr>
              <th className="px-6 py-4 text-left">Rôle</th>
              <th className="px-6 py-4 text-right">Taux Journalier</th>
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
                <td className="px-6 py-4 text-center">
                  <Switch
                    checked={rate.isActive}
                    onCheckedChange={() => handleToggleActive(rate)}
                  />
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
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
