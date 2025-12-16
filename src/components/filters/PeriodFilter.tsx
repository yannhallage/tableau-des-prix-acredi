import { useState } from 'react';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export type PeriodType = 'all' | 'today' | 'week' | 'month' | '3months' | '6months' | '12months' | 'custom';

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

interface PeriodFilterProps {
  value: PeriodType;
  onChange: (period: PeriodType) => void;
  customRange: DateRange;
  onCustomRangeChange: (range: DateRange) => void;
  onApplyCustomRange: () => void;
  showMonthOptions?: boolean;
  className?: string;
}

export function PeriodFilter({
  value,
  onChange,
  customRange,
  onCustomRangeChange,
  onApplyCustomRange,
  showMonthOptions = false,
  className = '',
}: PeriodFilterProps) {
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');

  const handlePeriodChange = (newValue: PeriodType) => {
    if (newValue === 'custom') {
      setIsCustomOpen(true);
    } else {
      onChange(newValue);
    }
  };

  const handleApplyCustom = () => {
    if (!tempStartDate || !tempEndDate) return;
    
    const start = new Date(tempStartDate);
    const end = new Date(tempEndDate);
    
    if (start > end) {
      return;
    }
    
    // Set end date to end of day
    end.setHours(23, 59, 59, 999);
    
    onCustomRangeChange({ start, end });
    onChange('custom');
    onApplyCustomRange();
    setIsCustomOpen(false);
  };

  const handleCancelCustom = () => {
    setTempStartDate('');
    setTempEndDate('');
    setIsCustomOpen(false);
  };

  const getDisplayValue = () => {
    if (value === 'custom' && customRange.start && customRange.end) {
      return `${format(customRange.start, 'dd/MM/yy', { locale: fr })} - ${format(customRange.end, 'dd/MM/yy', { locale: fr })}`;
    }
    return undefined;
  };

  const isValidCustomRange = tempStartDate && tempEndDate && new Date(tempStartDate) <= new Date(tempEndDate);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Popover open={isCustomOpen} onOpenChange={setIsCustomOpen}>
        <Select value={value} onValueChange={handlePeriodChange}>
          <SelectTrigger className="w-48">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue>
              {getDisplayValue()}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les périodes</SelectItem>
            <SelectItem value="today">Aujourd'hui</SelectItem>
            <SelectItem value="week">Cette semaine</SelectItem>
            <SelectItem value="month">Ce mois</SelectItem>
            {showMonthOptions && (
              <>
                <SelectItem value="3months">3 derniers mois</SelectItem>
                <SelectItem value="6months">6 derniers mois</SelectItem>
                <SelectItem value="12months">12 derniers mois</SelectItem>
              </>
            )}
            <SelectItem value="custom">Période personnalisée...</SelectItem>
          </SelectContent>
        </Select>
        
        <PopoverTrigger asChild>
          <span />
        </PopoverTrigger>
        
        <PopoverContent className="w-80 p-4" align="start">
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-foreground">Période personnalisée</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Date de début</Label>
                <Input
                  type="date"
                  value={tempStartDate}
                  onChange={(e) => setTempStartDate(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Date de fin</Label>
                <Input
                  type="date"
                  value={tempEndDate}
                  onChange={(e) => setTempEndDate(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
            
            {tempStartDate && tempEndDate && new Date(tempStartDate) > new Date(tempEndDate) && (
              <p className="text-xs text-destructive">
                La date de début doit être antérieure à la date de fin
              </p>
            )}
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelCustom}
              >
                <X className="h-4 w-4 mr-1" />
                Annuler
              </Button>
              <Button
                size="sm"
                onClick={handleApplyCustom}
                disabled={!isValidCustomRange}
              >
                <Check className="h-4 w-4 mr-1" />
                Appliquer
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Utility function to filter data by period
export function filterByPeriod<T>(
  data: T[],
  getDate: (item: T) => Date,
  period: PeriodType,
  customRange: DateRange
): T[] {
  if (period === 'all') return data;
  
  const now = new Date();
  let startDate: Date;
  let endDate = now;
  
  switch (period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '3months':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '6months':
      startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      break;
    case '12months':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    case 'custom':
      if (!customRange.start || !customRange.end) return data;
      startDate = customRange.start;
      endDate = customRange.end;
      break;
    default:
      return data;
  }
  
  return data.filter(item => {
    const itemDate = getDate(item);
    return itemDate >= startDate && itemDate <= endDate;
  });
}
