import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useData } from '@/contexts/DataContext';
import { useUsageTracking } from '@/hooks/useUsageTracking';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Percent, Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Margin } from '@/types';
import { EmptyState } from '@/components/EmptyState';

export default function MarginsPage() {
  const { margins, updateMargin, addMargin, deleteMargin, isLoadingMargins } = useData();
  const { trackAction } = useUsageTracking();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingMargin, setEditingMargin] = useState<Margin | null>(null);
  const [marginToDelete, setMarginToDelete] = useState<Margin | null>(null);
  const [formData, setFormData] = useState({ percentage: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const handleToggle = async (marginId: string, currentState: boolean) => {
    const margin = margins.find(m => m.id === marginId);
    if (margin) {
      setTogglingId(marginId);
      const success = await updateMargin({ ...margin, isActive: !currentState });
      setTogglingId(null);
      if (success) {
        trackAction('Modification marge', { action: 'toggle', percentage: margin.percentage, newState: !currentState });
        toast.success(currentState ? 'Marge désactivée' : 'Marge activée');
      } else {
        toast.error('Erreur lors de la mise à jour');
      }
    }
  };

  const openAddDialog = () => {
    setEditingMargin(null);
    setFormData({ percentage: '' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (margin: Margin) => {
    setEditingMargin(margin);
    setFormData({ percentage: margin.percentage.toString() });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (margin: Margin) => {
    setMarginToDelete(margin);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    const percentage = parseInt(formData.percentage, 10);
    
    if (isNaN(percentage) || percentage <= 0 || percentage > 100) {
      toast.error('Veuillez entrer un pourcentage valide (1-100)');
      return;
    }

    // Check for duplicate percentage
    const isDuplicate = margins.some(
      m => m.percentage === percentage && m.id !== editingMargin?.id
    );
    if (isDuplicate) {
      toast.error('Cette marge existe déjà');
      return;
    }

    setIsSubmitting(true);
    const success = editingMargin
      ? await updateMargin({ ...editingMargin, percentage })
      : await addMargin({ percentage, isActive: true });

    setIsSubmitting(false);
    if (success) {
      toast.success(editingMargin ? 'Marge modifiée' : 'Marge ajoutée');
      setIsDialogOpen(false);
    } else {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async () => {
    if (marginToDelete) {
      setIsDeleting(true);
      const success = await deleteMargin(marginToDelete.id);
      setIsDeleting(false);
      if (success) {
        toast.success('Marge supprimée');
        setIsDeleteDialogOpen(false);
        setMarginToDelete(null);
      } else {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  return (
    <DashboardLayout
      title="Marges"
      subtitle="Gérez les marges disponibles pour le calculateur"
    >
      <div className="max-w-2xl">
        <div className="card-elevated p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/20">
                <Percent className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Configuration des Marges</h2>
                <p className="text-sm text-muted-foreground">
                  Ajoutez, modifiez ou supprimez les marges
                </p>
              </div>
            </div>
            <Button onClick={openAddDialog} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          </div>

          <div className="space-y-4">
            {isLoadingMargins ? (
              <div className="text-center py-12 text-muted-foreground">
                Chargement...
              </div>
            ) : margins.length === 0 ? (
              <EmptyState
                icon={Percent}
                title="Aucune marge configurée"
                description="Commencez par ajouter votre première marge pour configurer les options du calculateur."
                action={
                  <Button onClick={openAddDialog} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter une marge
                  </Button>
                }
              />
            ) : (
              margins
                .sort((a, b) => a.percentage - b.percentage)
                .map((margin, index) => (
                  <div
                    key={margin.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`text-3xl font-bold ${margin.isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {margin.percentage}%
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          Marge de {margin.percentage}%
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Multiplie le coût par {(1 + margin.percentage / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(margin)}
                        className="h-8 w-8"
                        disabled={togglingId === margin.id}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(margin)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        disabled={togglingId === margin.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Switch
                        checked={margin.isActive}
                        onCheckedChange={() => handleToggle(margin.id, margin.isActive)}
                      />
                    </div>
                  </div>
                ))
            )}
          </div>

          <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Les marges définissent le pourcentage ajouté au coût 
              après application du coefficient client pour obtenir le prix recommandé.
            </p>
          </div>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMargin ? 'Modifier la marge' : 'Ajouter une marge'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="percentage">Pourcentage (%)</Label>
              <Input
                id="percentage"
                type="number"
                min="1"
                max="100"
                placeholder="Ex: 35"
                value={formData.percentage}
                onChange={(e) => setFormData({ percentage: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {editingMargin ? 'Modification...' : 'Ajout...'}
                </>
              ) : (
                editingMargin ? 'Modifier' : 'Ajouter'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la marge de {marginToDelete?.percentage}% ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                'Supprimer'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
