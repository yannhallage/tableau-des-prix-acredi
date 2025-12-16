import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import { Menu, X } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const { isOpen: isSidebarOpen, open: openSidebar, close: closeSidebar } = useSidebar();

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      
      {/* Header fixe sur mobile */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-background border-b border-border shadow-sm">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <button
              onClick={isSidebarOpen ? closeSidebar : openSidebar}
              className="rounded-lg p-2 hover:bg-muted transition-colors flex-shrink-0"
              aria-label={isSidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
            >
              {isSidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-foreground truncate">
                {title}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="transition-all duration-300 md:pl-64 pt-14 md:pt-0">
        <div className="px-4 md:px-8 py-4 md:py-6">
          {/* Header desktop */}
          <header className="hidden md:block mb-6 md:mb-8">
            <h1 className="text-xl md:text-2xl font-semibold text-foreground">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-sm md:text-base text-muted-foreground">
                {subtitle}
              </p>
            )}
          </header>

          <div className="animate-fade-in">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
