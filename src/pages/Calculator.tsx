import { useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useData } from '@/contexts/DataContext';
import { useUsageTracking } from '@/hooks/useUsageTracking';
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
import { Calculator, Save, RotateCcw, MessageSquareText } from 'lucide-react';

export default function CalculatorPage() {
  const { user } = useAuth();
  const { dailyRates, clientTypes, margins, projectTypes, addSimulation } = useData();
  const { trackAction } = useUsageTracking();

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

  // Generate justification for the price
  const justification = useMemo(() => {
    if (calculations.internalCost === 0) return null;

    const clientType = clientTypes.find(c => c.id === selectedClientType);
    const projectType = projectTypes.find(p => p.id === selectedProjectType);
    
    const usedRoles = activeRates
      .filter(rate => (roleDays[rate.id] || 0) > 0)
      .map(rate => ({
        name: rate.roleName,
        days: roleDays[rate.id],
        cost: roleDays[rate.id] * rate.rate,
      }));

    const totalDays = usedRoles.reduce((sum, r) => sum + r.days, 0);

    const points: string[] = [];

    // Argument 1: Team composition
    if (usedRoles.length > 0) {
      const teamList = usedRoles.map(r => `${r.name} (${r.days} jour${r.days > 1 ? 's' : ''})`).join(', ');
      points.push(`Une équipe pluridisciplinaire de ${usedRoles.length} expert${usedRoles.length > 1 ? 's' : ''} sera mobilisée : ${teamList}.`);
    }

    // Argument 2: Project complexity
    if (projectType) {
      const complexityText = projectType.complexityLevel === 'high' 
        ? 'Ce projet présente une complexité élevée nécessitant une expertise approfondie et un suivi rigoureux.'
        : projectType.complexityLevel === 'medium'
        ? 'Ce projet requiert une approche méthodique et une expertise confirmée pour garantir des livrables de qualité.'
        : "Ce projet bénéficiera d'une exécution efficace grâce à notre maîtrise de ce type de prestation.";
      points.push(complexityText);
    }

    // Argument 3: Client type coefficient justification
    if (clientType && clientType.coefficient !== 1) {
      if (clientType.coefficient > 1) {
        points.push(`Le tarif reflète les exigences spécifiques des ${clientType.name.toLowerCase()}, incluant un niveau de service premium, des délais de validation adaptés et un accompagnement personnalisé.`);
      } else {
        points.push(`Un tarif préférentiel est appliqué pour soutenir les ${clientType.name.toLowerCase()} dans leur développement.`);
      }
    }

    // Argument 4: Total investment context
    points.push(`L'investissement total de ${totalDays} jour${totalDays > 1 ? 's' : ''} de travail garantit une prestation complète, de la conception à la livraison finale.`);

    // Argument 5: Margin justification
    if (calculations.marginValue > 0) {
      const marginText = calculations.marginValue >= 50
        ? 'La marge appliquée couvre les risques projet, les ajustements potentiels et assure la pérennité de notre accompagnement.'
        : calculations.marginValue >= 40
        ? 'La marge inclut la gestion de projet, le suivi qualité et notre garantie de satisfaction.'
        : 'Une marge compétitive est appliquée tout en maintenant notre standard de qualité.';
      points.push(marginText);
    }

    // Argument 6: Value proposition
    points.push("Ce tarif intègre notre expertise sectorielle, nos méthodologies éprouvées et notre engagement qualité qui font la réputation d'Acredi Group.");

    return points;
  }, [calculations, selectedClientType, selectedProjectType, activeRates, roleDays, clientTypes, projectTypes]);

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

    // Track the simulation creation
    trackAction('Simulation créée', {
      clientName,
      clientType: clientType.name,
      projectType: projectType.name,
      recommendedPrice: calculations.recommendedPrice,
      margin: parseFloat(selectedMargin),
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

              {/* Justification Section */}
              {justification && justification.length > 0 && (
                <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquareText className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">
                      Arguments de Justification
                    </h3>
                  </div>
                  <ul className="space-y-2">
                    {justification.map((point, index) => (
                      <li key={index} className="flex gap-2 text-sm text-muted-foreground">
                        <span className="text-primary font-bold shrink-0">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

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
