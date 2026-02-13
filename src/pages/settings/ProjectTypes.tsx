import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, FileText, Loader2 } from 'lucide-react';
import { ProjectType } from '@/types';
import { EmptyState } from '@/components/EmptyState';

const COMPLEXITY_LABELS = {
  low: { label: 'Faible', color: 'badge-success' },
  medium: { label: 'Moyen', color: 'badge-warning' },
  high: { label: 'Élevé', color: 'badge-info' },
};

export default function ProjectTypesPage() {
  const { projectTypes, updateProjectType, addProjectType, deleteProjectType, isLoadingProjectTypes } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<ProjectType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    complexityLevel: 'medium' as 'low' | 'medium' | 'high',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleOpenDialog = (type?: ProjectType) => {
    if (type) {
      setEditingType(type);
      setFormData({
        name: type.name,
        description: type.description,
        complexityLevel: type.complexityLevel,
      });
    } else {
      setEditingType(null);
      setFormData({ name: '', description: '', complexityLevel: 'medium' });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Veuillez saisir un nom');
      return;
    }

    setIsSubmitting(true);
    const success = editingType
      ? await updateProjectType({
          ...editingType,
          name: formData.name,
          description: formData.description,
          complexityLevel: formData.complexityLevel,
        })
      : await addProjectType({
          name: formData.name,
          description: formData.description,
          complexityLevel: formData.complexityLevel,
        });

    setIsSubmitting(false);
    if (success) {
      toast.success(editingType ? 'Type de projet modifié' : 'Type de projet ajouté');
      setIsDialogOpen(false);
    } else {
      toast.error('Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${name}" ?`)) {
      setDeletingId(id);
      const success = await deleteProjectType(id);
      setDeletingId(null);
      if (success) {
        toast.success('Type de projet supprimé');
      } else {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  return (
    <DashboardLayout
      title="Types de Projets"
      subtitle="Gérez les catégories de projets"
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
                {editingType ? 'Modifier le type' : 'Ajouter un type de projet'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du type</Label>
                <Input
                  id="name"
                  placeholder="Ex: Application Mobile"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Description du type de projet..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Niveau de complexité</Label>
                <Select
                  value={formData.complexityLevel}
                  onValueChange={(value: 'low' | 'medium' | 'high') =>
                    setFormData(prev => ({ ...prev, complexityLevel: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Faible</SelectItem>
                    <SelectItem value="medium">Moyen</SelectItem>
                    <SelectItem value="high">Élevé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1" disabled={isSubmitting}>
                  Annuler
                </Button>
                <Button type="submit" className="flex-1 btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {editingType ? 'Modification...' : 'Ajout...'}
                    </>
                  ) : (
                    editingType ? 'Modifier' : 'Ajouter'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoadingProjectTypes ? (
        <div className="card-elevated p-12 text-center text-muted-foreground">
          Chargement...
        </div>
      ) : projectTypes.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Aucun type de projet"
          description="Commencez par ajouter votre premier type de projet pour organiser vos tarifications."
          action={
            <Button onClick={() => handleOpenDialog()} className="btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter un type
            </Button>
          }
        />
      ) : (
        <div className="card-elevated overflow-hidden">
          <table className="w-full">
            <thead className="table-header">
              <tr>
                <th className="px-6 py-4 text-left">Type de Projet</th>
                <th className="px-6 py-4 text-left">Description</th>
                <th className="px-6 py-4 text-center">Complexité</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {projectTypes.map((type, index) => (
                <tr
                  key={type.id}
                  className="hover:bg-muted/30 transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="font-medium text-foreground">{type.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground max-w-xs truncate">
                    {type.description || '—'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={COMPLEXITY_LABELS[type.complexityLevel].color}>
                      {COMPLEXITY_LABELS[type.complexityLevel].label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
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
                        disabled={deletingId === type.id}
                      >
                        {deletingId === type.id ? (
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
