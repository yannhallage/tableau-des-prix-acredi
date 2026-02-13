import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Briefcase } from 'lucide-react';
import { ClientType } from '@/types';
import { EmptyState } from '@/components/EmptyState';

export default function ClientTypesPage() {
  const { clientTypes, updateClientType, addClientType, deleteClientType, isLoadingClientTypes } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<ClientType | null>(null);
  const [formData, setFormData] = useState({ name: '', coefficient: '', description: '' });

  const handleOpenDialog = (type?: ClientType) => {
    if (type) {
      setEditingType(type);
      setFormData({
        name: type.name,
        coefficient: type.coefficient.toString(),
        description: type.description,
      });
    } else {
      setEditingType(null);
      setFormData({ name: '', coefficient: '1.0', description: '' });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Veuillez saisir un nom');
      return;
    }
    if (!formData.coefficient || parseFloat(formData.coefficient) <= 0) {
      toast.error('Veuillez saisir un coefficient valide');
      return;
    }

    const success = editingType
      ? await updateClientType({
          ...editingType,
          name: formData.name,
          coefficient: parseFloat(formData.coefficient),
          description: formData.description,
        })
      : await addClientType({
          name: formData.name,
          coefficient: parseFloat(formData.coefficient),
          description: formData.description,
        });

    if (success) {
      toast.success(editingType ? 'Type de client modifié' : 'Type de client ajouté');
      setIsDialogOpen(false);
    } else {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${name}" ?`)) {
      const success = await deleteClientType(id);
      if (success) {
        toast.success('Type de client supprimé');
      } else {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  return (
    <DashboardLayout
      title="Types de Clients"
      subtitle="Gérez les catégories de clients et leurs coefficients"
    >
      <div className="flex justify-end mb-6">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingType ? 'Modifier le type' : 'Ajouter un type de client'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du type</Label>
                <Input
                  id="name"
                  placeholder="Ex: Grande Entreprise"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="coefficient">Coefficient</Label>
                <Input
                  id="coefficient"
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="1.0"
                  value={formData.coefficient}
                  onChange={(e) => setFormData(prev => ({ ...prev, coefficient: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  Un coefficient de 1.0 signifie aucune modification. 1.5 = +50%, 0.8 = -20%
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description interne</Label>
                <Textarea
                  id="description"
                  placeholder="Notes internes sur ce type de client..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                  Annuler
                </Button>
                <Button type="submit" className="flex-1 btn-primary">
                  {editingType ? 'Modifier' : 'Ajouter'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoadingClientTypes ? (
        <div className="py-12 text-center text-muted-foreground">Chargement...</div>
      ) : clientTypes.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="Aucun type de client"
          description="Commencez par ajouter votre premier type de client pour organiser vos tarifications."
          action={
            <Button onClick={() => handleOpenDialog()} className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un type
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientTypes.map((type, index) => (
            <div
              key={type.id}
              className="card-elevated p-5 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDialog(type)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(type.id, type.name)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <h3 className="font-semibold text-foreground mb-1">{type.name}</h3>
              <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-accent/20 text-accent-foreground text-sm font-medium mb-2">
                ×{type.coefficient.toFixed(2)}
              </div>
              {type.description && (
                <p className="text-sm text-muted-foreground mt-2">{type.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
