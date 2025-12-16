import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Shield, Activity, TrendingUp, Clock, UserCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { PeriodFilter, PeriodType, DateRange, filterByPeriod } from '@/components/filters/PeriodFilter';

interface UsersByRole {
  role_name: string;
  count: number;
}

interface UsageStats {
  action: string;
  count: number;
}

interface DailyActivity {
  date: string;
  count: number;
}

interface TopUser {
  user_name: string;
  user_email: string;
  action_count: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [usersByRole, setUsersByRole] = useState<UsersByRole[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats[]>([]);
  const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalActions, setTotalActions] = useState(0);
  const [activeToday, setActiveToday] = useState(0);
  const [filterPeriod, setFilterPeriod] = useState<PeriodType>('month');
  const [customRange, setCustomRange] = useState<DateRange>({ start: null, end: null });

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      // Fetch users by role
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id');

      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('user_id, custom_role_id');

      const { data: customRoles } = await supabase
        .from('custom_roles')
        .select('id, name');

      // Count users by role
      const roleCounts: Record<string, number> = {};
      profiles?.forEach(profile => {
        const userRole = userRoles?.find(r => r.user_id === profile.user_id);
        const roleName = customRoles?.find(r => r.id === userRole?.custom_role_id)?.name || 'Non assigné';
        roleCounts[roleName] = (roleCounts[roleName] || 0) + 1;
      });

      const roleData = Object.entries(roleCounts).map(([role_name, count]) => ({
        role_name,
        count
      }));
      setUsersByRole(roleData);
      setTotalUsers(profiles?.length || 0);

      // Fetch usage history
      const { data: usageHistory } = await supabase
        .from('usage_history')
        .select('*')
        .order('created_at', { ascending: false });

      // Filter by period
      const filteredHistory = filterByPeriod(
        usageHistory || [],
        (entry) => new Date(entry.created_at),
        filterPeriod,
        customRange
      );

      setTotalActions(filteredHistory.length);

      // Count by action type
      const actionCounts: Record<string, number> = {};
      filteredHistory.forEach(entry => {
        actionCounts[entry.action] = (actionCounts[entry.action] || 0) + 1;
      });

      const actionData = Object.entries(actionCounts)
        .map(([action, count]) => ({ action, count }))
        .sort((a, b) => b.count - a.count);
      setUsageStats(actionData);

      // Daily activity for last 30 days
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = subDays(new Date(), 29 - i);
        return {
          date: format(date, 'dd/MM', { locale: fr }),
          fullDate: date,
          count: 0
        };
      });

      filteredHistory.forEach(entry => {
        const entryDate = format(new Date(entry.created_at), 'dd/MM', { locale: fr });
        const dayEntry = last30Days.find(d => d.date === entryDate);
        if (dayEntry) {
          dayEntry.count++;
        }
      });

      setDailyActivity(last30Days.map(({ date, count }) => ({ date, count })));

      // Active users today
      const todayStart = startOfDay(new Date());
      const todayEnd = endOfDay(new Date());
      const todayActivity = usageHistory?.filter(entry => {
        const entryDate = new Date(entry.created_at);
        return entryDate >= todayStart && entryDate <= todayEnd;
      }) || [];

      const uniqueTodayUsers = new Set(todayActivity.map(e => e.user_id));
      setActiveToday(uniqueTodayUsers.size);

      // Top users by activity
      const userActionCounts: Record<string, number> = {};
      filteredHistory.forEach(entry => {
        userActionCounts[entry.user_id] = (userActionCounts[entry.user_id] || 0) + 1;
      });

      const topUserIds = Object.entries(userActionCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      const topUsersData: TopUser[] = await Promise.all(
        topUserIds.map(async ([userId, count]) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('user_id', userId)
            .maybeSingle();

          return {
            user_name: profile?.name || 'Inconnu',
            user_email: profile?.email || '',
            action_count: count
          };
        })
      );

      setTopUsers(topUsersData);

    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [filterPeriod, customRange]);

  if (isLoading) {
    return (
      <DashboardLayout title="Administration">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout 
      title="Tableau de bord Administration" 
      subtitle="Vue d'ensemble des utilisateurs et de l'activité système"
    >
      <div className="space-y-6">
        {/* Period Filter */}
        <div className="flex justify-end">
          <PeriodFilter
            value={filterPeriod}
            onChange={setFilterPeriod}
            customRange={customRange}
            onCustomRangeChange={setCustomRange}
            onApplyCustomRange={() => {}}
            showMonthOptions
          />
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Comptes actifs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Rôles Configurés</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usersByRole.length}</div>
              <p className="text-xs text-muted-foreground">
                Rôles différents
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Actions (période)</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalActions}</div>
              <p className="text-xs text-muted-foreground">
                Activités enregistrées
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Actifs Aujourd'hui</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeToday}</div>
              <p className="text-xs text-muted-foreground">
                Utilisateurs connectés
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Users by Role */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Répartition par Rôle
              </CardTitle>
              <CardDescription>
                Distribution des utilisateurs par rôle
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usersByRole.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  Aucune donnée disponible
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={usersByRole}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="role_name"
                      label={({ role_name, count, percent }) => 
                        `${role_name}: ${count} (${(percent * 100).toFixed(0)}%)`
                      }
                    >
                      {usersByRole.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Actions by Type */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Actions par Type
              </CardTitle>
              <CardDescription>
                Distribution des actions système
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usageStats.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  Aucune donnée disponible
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={usageStats} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis 
                      dataKey="action" 
                      type="category" 
                      width={150}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tendance d'Activité
            </CardTitle>
            <CardDescription>
              Évolution des actions sur les 30 derniers jours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                  name="Actions"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Utilisateurs les Plus Actifs
            </CardTitle>
            <CardDescription>
              Top 5 des utilisateurs par nombre d'actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucune activité enregistrée
              </div>
            ) : (
              <div className="space-y-4">
                {topUsers.map((user, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{user.user_name}</p>
                        <p className="text-sm text-muted-foreground">{user.user_email}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {user.action_count} actions
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}