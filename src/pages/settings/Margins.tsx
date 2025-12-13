import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useData } from '@/contexts/DataContext';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Percent } from 'lucide-react';

export default function MarginsPage() {
  const { margins, updateMargin } = useData();

  const handleToggle = (marginId: string, currentState: boolean) => {
    const margin = margins.find(m => m.id === marginId);
    if (margin) {
      updateMargin({ ...margin, isActive: !currentState });
      toast.success(currentState ? 'Marge désactivée' : 'Marge activée');
    }
  };

  return (
    <DashboardLayout
      title="Marges"
      subtitle="Activez ou désactivez les marges disponibles"
    >
      <div className="max-w-2xl">
        <div className="card-elevated p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
            <div className="p-2 rounded-lg bg-accent/20">
              <Percent className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Configuration des Marges</h2>
              <p className="text-sm text-muted-foreground">
                Les marges activées seront disponibles dans le calculateur
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {margins.map((margin, index) => (
              <div
                key={margin.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className={`text-3xl font-bold ${margin.isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {margin.percentage}%
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      Marge de {margin.percentage}%
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Multiplie le coût par {(1 + margin.percentage / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={margin.isActive}
                  onCheckedChange={() => handleToggle(margin.id, margin.isActive)}
                />
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> Les marges définissent le pourcentage ajouté au coût 
              après application du coefficient client pour obtenir le prix recommandé.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
