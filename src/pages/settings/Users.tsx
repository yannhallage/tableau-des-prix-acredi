import React, { useState, useEffect } from 'react';
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
import { Users, UserPlus, Shield, History, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type AppRole = 'admin' | 'project_manager' | 'sales';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  name: string;
  created_at: string;
  role?: AppRole;
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

const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Administrateur',
  project_manager: 'Chef de projet',
  sales: 'Commercial',
};

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usageHistory, setUsageHistory] = useState<UsageHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [newRole, setNewRole] = useState<AppRole>('sales');
  const [isCreating, setIsCreating] = useState(false);
  
  // New user form state
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<AppRole>('sales');

  // Usage history filters
  const [filterUser, setFilterUser] = useState<string>('all');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('all');

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      const usersWithRoles = profiles?.map(profile => ({
        ...profile,
        role: roles?.find(r => r.user_id === profile.user_id)?.role as AppRole || 'sales',
      })) || [];

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
      await Promise.all([fetchUsers(), fetchUsageHistory()]);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const openRoleDialog = (user: UserProfile) => {
    setSelectedUser(user);
    setNewRole(user.role || 'sales');
    setIsRoleDialogOpen(true);
  };

  const handleRoleChange = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', selectedUser.user_id);

      if (error) throw error;

      toast.success('Rôle mis à jour avec succès');
      setIsRoleDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Erreur lors de la mise à jour du rôle');
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

    setIsCreating(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: newUserEmail,
          password: newUserPassword,
          name: newUserName,
          role: newUserRole,
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
    setNewUserRole('sales');
  };

  const getRoleBadgeVariant = (role: AppRole) => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'project_manager':
        return 'secondary';
      case 'sales':
        return 'outline';
      default:
        return 'outline';
    }
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
  const filteredHistory = usageHistory.filter(entry => {
    // Filter by user
    if (filterUser !== 'all' && entry.user_id !== filterUser) return false;
    
    // Filter by action
    if (filterAction !== 'all' && entry.action !== filterAction) return false;
    
    // Filter by period
    if (filterPeriod !== 'all') {
      const entryDate = new Date(entry.created_at);
      const now = new Date();
      
      if (filterPeriod === 'today') {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (entryDate < today) return false;
      } else if (filterPeriod === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (entryDate < weekAgo) return false;
      } else if (filterPeriod === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (entryDate < monthAgo) return false;
      }
    }
    
    return true;
  });

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
                            <Badge variant={getRoleBadgeVariant(user.role!)}>
                              {ROLE_LABELS[user.role!] || user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(user.created_at), 'dd MMM yyyy', { locale: fr })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openRoleDialog(user)}
                            >
                              Modifier le rôle
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
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
                    <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Toutes les périodes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les périodes</SelectItem>
                        <SelectItem value="today">Aujourd'hui</SelectItem>
                        <SelectItem value="week">Cette semaine</SelectItem>
                        <SelectItem value="month">Ce mois</SelectItem>
                      </SelectContent>
                    </Select>
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
              <Select value={newRole} onValueChange={(value) => setNewRole(value as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrateur</SelectItem>
                  <SelectItem value="project_manager">Chef de projet</SelectItem>
                  <SelectItem value="sales">Commercial</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleRoleChange}>
              Enregistrer
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
              <Select value={newUserRole} onValueChange={(value) => setNewUserRole(value as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrateur</SelectItem>
                  <SelectItem value="project_manager">Chef de projet</SelectItem>
                  <SelectItem value="sales">Commercial</SelectItem>
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
    </DashboardLayout>
  );
}
