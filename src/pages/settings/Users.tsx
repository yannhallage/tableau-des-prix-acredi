import React, { useState, useEffect, useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users, UserPlus, Shield, History, Loader2, Key } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PeriodFilter, PeriodType, DateRange, filterByPeriod } from '@/components/filters/PeriodFilter';
import { RoleManagement } from '@/components/settings/RoleManagement';
import { CustomRole } from '@/types';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  name: string;
  created_at: string;
  custom_role_id?: string | null;
  role_name?: string;
}

interface UsageHistoryEntry {
  id: string;
  user_id: string;
  action: string;
  details: Record<string, any> | null;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [usageHistory, setUsageHistory] = useState<UsageHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [isSavingRole, setIsSavingRole] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // New user form state
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRoleId, setNewUserRoleId] = useState<string>('');

  // Usage history filters
  const [filterUser, setFilterUser] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<PeriodType>('all');
  const [customRange, setCustomRange] = useState<DateRange>({ start: null, end: null });

  const fetchCustomRoles = async () => {
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

      setCustomRoles(typedRoles);
      
      // Set default role for new users (Commercial/sales equivalent)
      const defaultRole = typedRoles.find(r => r.name === 'Commercial');
      if (defaultRole && !newUserRoleId) {
        setNewUserRoleId(defaultRole.id);
      }
    } catch (error) {
      console.error('Error fetching custom roles:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, custom_role_id');

      if (rolesError) throw rolesError;

      const { data: roles } = await supabase
        .from('custom_roles')
        .select('id, name');

      const usersWithRoles: UserProfile[] = (profiles || []).map(profile => {
        const userRole = userRoles?.find(r => r.user_id === profile.user_id);
        const roleName = roles?.find(r => r.id === userRole?.custom_role_id)?.name;
        
        return {
          ...profile,
          custom_role_id: userRole?.custom_role_id || null,
          role_name: roleName || 'Non assigné',
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
    }
  };

  const fetchUsageHistory = async () => {
    try {
      const { data: history, error } = await supabase
        .from('usage_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, name, email');

      const historyWithUsers: UsageHistoryEntry[] = (history || []).map((entry) => {
        const userProfile = profiles?.find(p => p.user_id === entry.user_id);
        return {
          id: entry.id,
          user_id: entry.user_id,
          action: entry.action,
          details: entry.details as Record<string, any> | null,
          created_at: entry.created_at,
          user_name: userProfile?.name || 'Utilisateur inconnu',
          user_email: userProfile?.email || '',
        };
      });

      setUsageHistory(historyWithUsers);
    } catch (error) {
      console.error('Error fetching usage history:', error);
      toast.error('Erreur lors du chargement de l\'historique');
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchCustomRoles(), fetchUsers(), fetchUsageHistory()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const openRoleDialog = (user: UserProfile) => {
    setSelectedUser(user);
    setSelectedRoleId(user.custom_role_id || '');
    setIsRoleDialogOpen(true);
  };

  const handleRoleChange = async () => {
    if (!selectedUser || !selectedRoleId) return;

    setIsSavingRole(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ custom_role_id: selectedRoleId })
        .eq('user_id', selectedUser.user_id);

      if (error) throw error;

      toast.success('Rôle mis à jour avec succès');
      setIsRoleDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Erreur lors de la mise à jour du rôle');
    } finally {
      setIsSavingRole(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUserEmail || !newUserPassword || !newUserName) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    if (newUserPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (!newUserRoleId) {
      toast.error('Veuillez sélectionner un rôle');
      return;
    }

    setIsCreating(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: newUserEmail,
          password: newUserPassword,
          name: newUserName,
          customRoleId: newUserRoleId,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Utilisateur créé avec succès');
      setIsCreateDialogOpen(false);
      resetCreateForm();
      fetchUsers();
      fetchUsageHistory();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Erreur lors de la création de l\'utilisateur');
    } finally {
      setIsCreating(false);
    }
  };

  const resetCreateForm = () => {
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserName('');
    const defaultRole = customRoles.find(r => r.name === 'Commercial');
    setNewUserRoleId(defaultRole?.id || '');
  };

  const openDeleteDialog = (user: UserProfile) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: {
          userId: userToDelete.user_id,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Utilisateur supprimé avec succès');
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchUsers();
      fetchUsageHistory();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Erreur lors de la suppression de l\'utilisateur');
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleBadgeVariant = (roleName: string) => {
    if (roleName === 'Admin') return 'default';
    if (roleName === 'Chef de Projet') return 'secondary';
    return 'outline';
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'Connexion': 'Connexion',
      'Simulation créée': 'Simulation créée',
      'Création utilisateur': 'Création utilisateur',
      'Modification TJM': 'Modification TJM',
      'Modification marge': 'Modification marge',
      'Modification type client': 'Modification type client',
      'Modification type projet': 'Modification type projet',
    };
    return labels[action] || action;
  };

  // Get unique actions for filter
  const uniqueActions = Array.from(new Set(usageHistory.map(h => h.action)));

  // Filter usage history
  const filteredHistory = useMemo(() => {
    let filtered = usageHistory;
    
    // Filter by user
    if (filterUser !== 'all') {
      filtered = filtered.filter(entry => entry.user_id === filterUser);
    }
    
    // Filter by action
    if (filterAction !== 'all') {
      filtered = filtered.filter(entry => entry.action === filterAction);
    }
    
    // Filter by period using the utility function
    filtered = filterByPeriod(
      filtered,
      (entry) => new Date(entry.created_at),
      filterPeriod,
      customRange
    );
    
    return filtered;
  }, [usageHistory, filterUser, filterAction, filterPeriod, customRange]);

  if (isLoading) {
    return (
      <DashboardLayout title="Gestion des Utilisateurs">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Gestion des Utilisateurs" subtitle="Gérez les utilisateurs, leurs rôles et consultez l'historique d'utilisation">
      <div className="space-y-6">
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              Rôles & Permissions
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Historique d'utilisation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Liste des Utilisateurs
                  </CardTitle>
                  <CardDescription>
                    {users.length} utilisateur{users.length > 1 ? 's' : ''} enregistré{users.length > 1 ? 's' : ''}
                  </CardDescription>
                </div>
                <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Nouvel utilisateur
                </Button>
              </CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucun utilisateur enregistré
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Rôle</TableHead>
                        <TableHead>Date d'inscription</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={getRoleBadgeVariant(user.role_name || '')}>
                              {user.role_name || 'Non assigné'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(user.created_at), 'dd MMM yyyy', { locale: fr })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openRoleDialog(user)}
                              >
                                Modifier le rôle
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => openDeleteDialog(user)}
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
          </TabsContent>

          <TabsContent value="roles">
            <RoleManagement />
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Historique d'Utilisation
                </CardTitle>
                <CardDescription>
                  Dernières actions effectuées par les utilisateurs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex-1 min-w-[200px]">
                    <Label className="text-xs text-muted-foreground mb-1 block">Utilisateur</Label>
                    <Select value={filterUser} onValueChange={setFilterUser}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les utilisateurs" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les utilisateurs</SelectItem>
                        {users.map(user => (
                          <SelectItem key={user.user_id} value={user.user_id}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <Label className="text-xs text-muted-foreground mb-1 block">Type d'action</Label>
                    <Select value={filterAction} onValueChange={setFilterAction}>
                      <SelectTrigger>
                        <SelectValue placeholder="Toutes les actions" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les actions</SelectItem>
                        {uniqueActions.map(action => (
                          <SelectItem key={action} value={action}>
                            {getActionLabel(action)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <Label className="text-xs text-muted-foreground mb-1 block">Période</Label>
                    <PeriodFilter
                      value={filterPeriod}
                      onChange={setFilterPeriod}
                      customRange={customRange}
                      onCustomRangeChange={setCustomRange}
                      onApplyCustomRange={() => {}}
                      showMonthOptions
                    />
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  {filteredHistory.length} résultat{filteredHistory.length > 1 ? 's' : ''}
                </div>

                {filteredHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune activité trouvée
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Utilisateur</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Détails</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredHistory.map((entry) => (
                        <TableRow key={entry.id}>
                          <TableCell>
                            {format(new Date(entry.created_at), 'dd MMM yyyy HH:mm', { locale: fr })}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{entry.user_name}</p>
                              <p className="text-xs text-muted-foreground">{entry.user_email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{getActionLabel(entry.action)}</Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {entry.details ? JSON.stringify(entry.details) : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Role Edit Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le rôle</DialogTitle>
            <DialogDescription>
              Changer le rôle de {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nouveau rôle</Label>
              <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {customRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                      {role.is_system && ' (Système)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleRoleChange} disabled={isSavingRole || !selectedRoleId}>
              {isSavingRole ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                'Enregistrer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
        setIsCreateDialogOpen(open);
        if (!open) resetCreateForm();
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Créer un utilisateur
            </DialogTitle>
            <DialogDescription>
              Créez un nouveau compte utilisateur avec un rôle spécifique
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom complet</Label>
              <Input
                id="name"
                placeholder="Jean Dupont"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="jean@acredi.ci"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Minimum 6 caractères</p>
            </div>
            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select value={newUserRoleId} onValueChange={setNewUserRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  {customRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                      {role.is_system && ' (Système)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateUser} disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                'Créer l\'utilisateur'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Supprimer l'utilisateur
            </DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{userToDelete?.name}</strong> ({userToDelete?.email}) ?
              <br />
              <span className="text-destructive font-medium">Cette action est irréversible.</span>
              <br />
              Toutes les données associées (profil, rôles, historique) seront également supprimées.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
