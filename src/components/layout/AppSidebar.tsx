import { 
  Calculator, 
  History, 
  Settings, 
  Users, 
  Briefcase, 
  Percent, 
  FileText,
  LogOut,
  LayoutDashboard,
  BarChart3
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_LABELS } from '@/types';
import { cn } from '@/lib/utils';

export function AppSidebar() {
  const { user, logout, hasPermission } = useAuth();

  const isAdmin = hasPermission(['admin']);

  const mainNavItems = [
    { 
      title: 'Tableau de bord', 
      url: '/dashboard', 
      icon: LayoutDashboard 
    },
    { 
      title: 'Calculateur', 
      url: '/calculator', 
      icon: Calculator 
    },
    { 
      title: 'Historique', 
      url: '/history', 
      icon: History 
    },
    { 
      title: 'Statistiques', 
      url: '/analytics', 
      icon: BarChart3 
    },
  ];

  const adminNavItems = [
    { 
      title: 'Taux Journaliers (TJM)', 
      url: '/settings/rates', 
      icon: Users 
    },
    { 
      title: 'Types de Clients', 
      url: '/settings/clients', 
      icon: Briefcase 
    },
    { 
      title: 'Marges', 
      url: '/settings/margins', 
      icon: Percent 
    },
    { 
      title: 'Types de Projets', 
      url: '/settings/projects', 
      icon: FileText 
    },
    { 
      title: 'Gestion Utilisateurs', 
      url: '/settings/users', 
      icon: Users 
    },
  ];

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
            <span className="text-lg font-bold text-sidebar-primary-foreground">A</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-sidebar-foreground">Acredi</h1>
            <p className="text-xs text-sidebar-foreground/60">Pricing Engine</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-1">
            {mainNavItems.map((item) => (
              <NavLink
                key={item.url}
                to={item.url}
                className="nav-item"
                activeClassName="nav-item-active"
              >
                <item.icon className="h-5 w-5" />
                <span>{item.title}</span>
              </NavLink>
            ))}
          </div>

          {isAdmin && (
            <div className="mt-8">
              <p className="mb-3 px-3 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/50">
                Administration
              </p>
              <div className="space-y-1">
                {adminNavItems.map((item) => (
                  <NavLink
                    key={item.url}
                    to={item.url}
                    className="nav-item"
                    activeClassName="nav-item-active"
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* User Info */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent">
              <span className="text-sm font-medium text-sidebar-accent-foreground">
                {user?.name.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.name}
              </p>
              <p className="text-xs text-sidebar-foreground/60">
                {user?.role && ROLE_LABELS[user.role]}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
