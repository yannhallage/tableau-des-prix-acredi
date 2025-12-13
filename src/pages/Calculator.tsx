import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Calculator, Save, RotateCcw, CheckCircle } from 'lucide-react';

export default function CalculatorPage() {
  const { user } = useAuth();
  const { dailyRates, clientTypes, margins, projectTypes, addSimulation } = useData();

  const [clientName, setClientName] = useState('');
  const [selectedClientType, setSelectedClientType] = useState('');
  const [selectedProjectType, setSelectedProjectType] = useState('');
  const [selectedMargin, setSelectedMargin] = useState('');
  const [roleDays, setRoleDays] = useState<Record<string, number>>({});

  const activeRates = dailyRates.filter(r => r.isActive);
  const activeMargins = margins.filter(m => m.isActive);

  const handleDaysChange = (roleId: string, days: number) => {
    setRoleDays(prev => ({
      ...prev,
      [roleId]: days,
    }));
  };

  const calculations = useMemo(() => {
    // Calculate internal cost
    const internalCost = activeRates.reduce((sum, rate) => {
      const days = roleDays[rate.id] || 0;
      return sum + (days * rate.rate);
    }, 0);

    // Get client coefficient
    const clientType = clientTypes.find(c => c.id === selectedClientType);
    const coefficient = clientType?.coefficient || 1;
    const costAfterCoefficient = internalCost * coefficient;

    // Apply margin
    const marginValue = parseFloat(selectedMargin) || 0;
    const marginMultiplier = 1 + (marginValue / 100);
    const recommendedPrice = costAfterCoefficient * marginMultiplier;

    return {
      internalCost,
      coefficient,
      costAfterCoefficient,
      marginValue,
      recommendedPrice,
    };
  }, [activeRates, roleDays, selectedClientType, selectedMargin, clientTypes]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value) + ' FCFA';
  };

  const handleReset = () => {
    setClientName('');
    setSelectedClientType('');
    setSelectedProjectType('');
    setSelectedMargin('');
    setRoleDays({});
  };

  const handleSave = () => {
    if (!clientName.trim()) {
      toast.error('Veuillez saisir le nom du client');
      return;
    }
    if (!selectedClientType) {
      toast.error('Veuillez sélectionner un type de client');
      return;
    }
    if (!selectedProjectType) {
      toast.error('Veuillez sélectionner un type de projet');
      return;
    }
    if (!selectedMargin) {
      toast.error('Veuillez sélectionner une marge');
      return;
    }
    if (calculations.internalCost === 0) {
      toast.error('Veuillez saisir au moins un jour de travail');
      return;
    }

    const clientType = clientTypes.find(c => c.id === selectedClientType)!;
    const projectType = projectTypes.find(p => p.id === selectedProjectType)!;

    const roleDaysData = activeRates
      .filter(rate => (roleDays[rate.id] || 0) > 0)
      .map(rate => ({
        roleId: rate.id,
        roleName: rate.roleName,
        days: roleDays[rate.id],
        rate: rate.rate,
      }));

    addSimulation({
      clientName,
      clientType,
      projectType,
      roleDays: roleDaysData,
      margin: parseFloat(selectedMargin),
      internalCost: calculations.internalCost,
      costAfterCoefficient: calculations.costAfterCoefficient,
      recommendedPrice: calculations.recommendedPrice,
      createdBy: user!,
      createdAt: new Date(),
    });

    toast.success('Simulation enregistrée avec succès');
    handleReset();
  };

  return (
    <DashboardLayout
      title="Calculateur de Prix"
      subtitle="Créez une nouvelle simulation tarifaire"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Info */}
          <div className="card-elevated p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Informations Client
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Nom du client</Label>
                <Input
                  id="clientName"
                  placeholder="Ex: Société ABC"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="input-field"
                />
              </div>
              <div className="space-y-2">
                <Label>Type de client</Label>
                <Select value={selectedClientType} onValueChange={setSelectedClientType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {clientTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name} (×{type.coefficient})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Project Type */}
          <div className="card-elevated p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Type de Projet
            </h2>
            <Select value={selectedProjectType} onValueChange={setSelectedProjectType}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner le type de projet..." />
              </SelectTrigger>
              <SelectContent>
                {projectTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProjectType && (
              <p className="mt-2 text-sm text-muted-foreground">
                {projectTypes.find(p => p.id === selectedProjectType)?.description}
              </p>
            )}
          </div>

          {/* Role Days */}
          <div className="card-elevated p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Jours par Rôle
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeRates.map((rate) => (
                <div key={rate.id} className="flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{rate.roleName}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(rate.rate)}/jour
                    </p>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="0"
                    value={roleDays[rate.id] || ''}
                    onChange={(e) => handleDaysChange(rate.id, parseFloat(e.target.value) || 0)}
                    className="w-24 text-center"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Margin Selection */}
          <div className="card-elevated p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              Marge Appliquée
            </h2>
            <div className="flex flex-wrap gap-3">
              {activeMargins.map((margin) => (
                <button
                  key={margin.id}
                  onClick={() => setSelectedMargin(margin.percentage.toString())}
                  className={`px-6 py-3 rounded-lg border-2 font-semibold transition-all ${
                    selectedMargin === margin.percentage.toString()
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-foreground hover:border-primary/50'
                  }`}
                >
                  {margin.percentage}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          <div className="card-elevated p-6 sticky top-6">
            <div className="flex items-center gap-2 mb-6">
              <Calculator className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">
                Résumé du Calcul
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">Coût interne</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(calculations.internalCost)}
                </span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">
                  Coefficient client (×{calculations.coefficient.toFixed(2)})
                </span>
                <span className="font-medium text-foreground">
                  {formatCurrency(calculations.costAfterCoefficient)}
                </span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-muted-foreground">
                  Marge (+{calculations.marginValue}%)
                </span>
                <span className="font-medium text-foreground">
                  {formatCurrency(calculations.recommendedPrice - calculations.costAfterCoefficient)}
                </span>
              </div>

              {/* Recommended Price - Highlighted */}
              <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-accent to-warning">
                <p className="text-sm font-medium text-accent-foreground/80 mb-1">
                  Prix Recommandé
                </p>
                <p className="text-2xl font-bold text-accent-foreground">
                  {formatCurrency(calculations.recommendedPrice)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={handleReset}
                  className="flex-1"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Réinitialiser
                </Button>
                <Button
                  onClick={handleSave}
                  className="flex-1 btn-primary"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
