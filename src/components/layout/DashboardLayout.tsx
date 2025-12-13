import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <main className="pl-64">
        <div className="px-8 py-6">
          <header className="mb-8">
            <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
            {subtitle && (
              <p className="mt-1 text-muted-foreground">{subtitle}</p>
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
