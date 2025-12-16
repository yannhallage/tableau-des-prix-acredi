import {
  Calculator,
  History,
  Settings,
  Users,
  Briefcase,
  Percent,
  FileText,
  LogOut,
  Menu,
  LayoutDashboard,
  BarChart3,
  Key,
  ShieldCheck,
  X
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissionsContext, PERMISSIONS } from '@/contexts/PermissionsContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function AppSidebar() {
  const { user, logout } = useAuth();
  const { isOpen: isSidebarOpen, close: closeSidebar } = useSidebar();
  const { hasPermission, hasAnyPermission, roleName, isLoading } = usePermissionsContext();
  const location = useLocation();

  // Fermer la sidebar automatiquement après navigation sur mobile
  useEffect(() => {
    const handleClose = () => {
      if (window.innerWidth < 768 && isSidebarOpen) {
        closeSidebar();
      }
    };
    
    // Petit délai pour éviter de fermer immédiatement après ouverture
    const timeoutId = setTimeout(handleClose, 100);
    
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const mainNavItems = [
    {
      title: 'Tableau de bord',
      url: '/dashboard',
      icon: LayoutDashboard,
      show: true
    },
    {
      title: 'Calculateur',
      url: '/calculator',
      icon: Calculator,
      show: hasPermission(PERMISSIONS.CREATE_SIMULATIONS)
    },
    {
      title: 'Historique',
      url: '/history',
      icon: History,
      show: true
    },
    {
      title: 'Statistiques',
      url: '/analytics',
      icon: BarChart3,
      show: hasPermission(PERMISSIONS.VIEW_ANALYTICS)
    },
  ];

  const adminNavItems = [
    {
      title: 'Taux Journaliers (TJM)',
      url: '/settings/rates',
      icon: Users,
      show: hasPermission(PERMISSIONS.EDIT_DAILY_RATES)
    },
    {
      title: 'Types de Clients',
      url: '/settings/clients',
      icon: Briefcase,
      show: hasPermission(PERMISSIONS.EDIT_CLIENT_TYPES)
    },
    {
      title: 'Marges',
      url: '/settings/margins',
      icon: Percent,
      show: hasPermission(PERMISSIONS.EDIT_MARGINS)
    },
    {
      title: 'Types de Projets',
      url: '/settings/projects',
      icon: FileText,
      show: hasPermission(PERMISSIONS.EDIT_PROJECT_TYPES)
    },
    {
      title: 'Gestion Utilisateurs',
      url: '/settings/users',
      icon: Users,
      show: hasPermission(PERMISSIONS.MANAGE_USERS)
    },
    {
      title: 'Administration',
      url: '/admin',
      icon: ShieldCheck,
      show: hasPermission(PERMISSIONS.VIEW_USAGE_HISTORY)
    },
  ];

  const hasAdminAccess = hasAnyPermission([
    PERMISSIONS.EDIT_DAILY_RATES,
    PERMISSIONS.EDIT_CLIENT_TYPES,
    PERMISSIONS.EDIT_MARGINS,
    PERMISSIONS.EDIT_PROJECT_TYPES,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.VIEW_USAGE_HISTORY,
  ]);

  return (
    <>
      {/* Overlay pour mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border",
          "transform transition-transform duration-300 ease-in-out",
          // Sur mobile : contrôlé par l'état
          isSidebarOpen ? "translate-x-0" : "-translate-x-full",
          // Sur desktop : toujours visible (md et plus) - utilise !important pour forcer
          "md:!translate-x-0"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo avec bouton de fermeture sur mobile */}
          <div className="flex items-center justify-between gap-3 px-6 py-5 border-b border-sidebar-border">
            <div className="flex items-center gap-3 flex-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
                <span className="text-lg font-bold text-sidebar-primary-foreground">A</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-sidebar-foreground">Acredi</h1>
                <p className="text-xs text-sidebar-foreground/60">Pricing Engine</p>
              </div>
            </div>
            {/* Bouton de fermeture sur mobile */}
            <button
              onClick={closeSidebar}
              className="md:hidden rounded-lg p-2 hover:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-accent-foreground transition-colors"
              aria-label="Fermer le menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-1">
            {mainNavItems.filter(item => item.show).map((item) => (
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

          {hasAdminAccess && (
            <div className="mt-8">
              <p className="mb-3 px-3 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/50">
                Administration
              </p>
              <div className="space-y-1">
                {adminNavItems.filter(item => item.show).map((item) => (
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
                {roleName || 'Chargement...'}
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
    </>
  );
}
