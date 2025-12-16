import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import { Menu } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  const { open: openSidebar } = useSidebar();

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="transition-all duration-300 md:pl-64">
        <div className="px-4 md:px-8 py-4 md:py-6">
          <header className="mb-6 md:mb-8">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
              {/* Bouton menu mobile */}
              <button
                onClick={openSidebar}
                className="md:hidden rounded-lg p-2 hover:bg-muted transition-colors"
                aria-label="Ouvrir le menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="text-xl md:text-2xl font-semibold text-foreground">
                {title}
              </h1>
            </div>

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
