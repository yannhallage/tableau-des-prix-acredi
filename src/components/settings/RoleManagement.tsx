import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, Plus, Edit, Trash2, Lock, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CustomRole, AVAILABLE_PERMISSIONS } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function RoleManagement() {
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<CustomRole | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPermissions, setFormPermissions] = useState<Record<string, boolean>>({});

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_roles')
        .select('*')
        .order('is_system', { ascending: false })
        .order('name');

      if (error) throw error;

      const typedRoles: CustomRole[] = (data || []).map(role => ({
        ...role,
        permissions: role.permissions as Record<string, boolean>,
      }));

      setRoles(typedRoles);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Erreur lors du chargement des rôles');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const openCreateDialog = () => {
    setEditingRole(null);
    setFormName('');
    setFormDescription('');
    setFormPermissions({});
    setIsDialogOpen(true);
  };

  const openEditDialog = (role: CustomRole) => {
    setEditingRole(role);
    setFormName(role.name);
    setFormDescription(role.description || '');
    setFormPermissions(role.permissions);
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (role: CustomRole) => {
    setRoleToDelete(role);
    setIsDeleteDialogOpen(true);
  };

  const togglePermission = (key: string) => {
    setFormPermissions(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error('Le nom du rôle est requis');
      return;
    }

    setIsSaving(true);

    try {
      if (editingRole) {
        // Update existing role
        const { error } = await supabase
          .from('custom_roles')
          .update({
            name: formName.trim(),
            description: formDescription.trim() || null,
            permissions: formPermissions,
          })
          .eq('id', editingRole.id);

        if (error) throw error;
        toast.success('Rôle mis à jour avec succès');
      } else {
        // Create new role
        const { error } = await supabase
          .from('custom_roles')
          .insert({
            name: formName.trim(),
            description: formDescription.trim() || null,
            permissions: formPermissions,
            is_system: false,
          });

        if (error) {
          if (error.code === '23505') {
            toast.error('Un rôle avec ce nom existe déjà');
            return;
          }
          throw error;
        }
        toast.success('Rôle créé avec succès');
      }

      setIsDialogOpen(false);
      fetchRoles();
    } catch (error) {
      console.error('Error saving role:', error);
      toast.error('Erreur lors de l\'enregistrement du rôle');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!roleToDelete) return;

    try {
      const { error } = await supabase
        .from('custom_roles')
        .delete()
        .eq('id', roleToDelete.id);

      if (error) throw error;

      toast.success('Rôle supprimé avec succès');
      setIsDeleteDialogOpen(false);
      setRoleToDelete(null);
      fetchRoles();
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.error('Erreur lors de la suppression du rôle');
    }
  };

  const countActivePermissions = (permissions: Record<string, boolean>) => {
    return Object.values(permissions).filter(Boolean).length;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Gestion des Rôles
            </CardTitle>
            <CardDescription>
              Créez et gérez les rôles avec leurs permissions
            </CardDescription>
          </div>
          <Button onClick={openCreateDialog} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nouveau rôle
          </Button>
        </CardHeader>
        <CardContent>
          {roles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun rôle configuré
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Modifié le</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {roles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {role.is_system && <Lock className="h-3 w-3 text-muted-foreground" />}
                        {role.name}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {role.description || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {countActivePermissions(role.permissions)} / {AVAILABLE_PERMISSIONS.length}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={role.is_system ? 'default' : 'outline'}>
                        {role.is_system ? 'Système' : 'Personnalisé'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(role.updated_at), 'dd MMM yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(role)}
                          disabled={role.is_system}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(role)}
                          disabled={role.is_system}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? 'Modifier le rôle' : 'Créer un nouveau rôle'}
            </DialogTitle>
            <DialogDescription>
              {editingRole 
                ? 'Modifiez les informations et les permissions de ce rôle'
                : 'Définissez un nouveau rôle avec ses permissions'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du rôle *</Label>
                <Input
                  id="name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Comptable, Directeur..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Description du rôle..."
                  rows={1}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Permissions</Label>
              <ScrollArea className="h-64 rounded-md border p-4">
                <div className="space-y-4">
                  {AVAILABLE_PERMISSIONS.map((permission) => (
                    <div
                      key={permission.key}
                      className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        id={permission.key}
                        checked={formPermissions[permission.key] || false}
                        onCheckedChange={() => togglePermission(permission.key)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label
                          htmlFor={permission.key}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {permission.label}
                        </label>
                        <p className="text-xs text-muted-foreground">
                          {permission.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <p className="text-xs text-muted-foreground">
                {countActivePermissions(formPermissions)} permission(s) sélectionnée(s)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                editingRole ? 'Mettre à jour' : 'Créer le rôle'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le rôle</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer le rôle "{roleToDelete?.name}" ?
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}