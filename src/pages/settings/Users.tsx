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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [newRole, setNewRole] = useState<AppRole>('sales');

  const fetchUsers = async () => {
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Combine profiles with roles
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

      // Fetch profiles to get user names
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
    setIsDialogOpen(true);
  };

  const handleRoleChange = async () => {
    if (!selectedUser) return;

    try {
      // Update the role
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', selectedUser.user_id);

      if (error) throw error;

      toast.success('Rôle mis à jour avec succès');
      setIsDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Erreur lors de la mise à jour du rôle');
    }
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
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Liste des Utilisateurs
                </CardTitle>
                <CardDescription>
                  {users.length} utilisateur{users.length > 1 ? 's' : ''} enregistré{users.length > 1 ? 's' : ''}
                </CardDescription>
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
              <CardContent>
                {usageHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune activité enregistrée
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
                      {usageHistory.map((entry) => (
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
                            <Badge variant="outline">{entry.action}</Badge>
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
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleRoleChange}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
