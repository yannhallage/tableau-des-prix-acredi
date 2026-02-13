import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  DailyRate,
  ClientType,
  Margin,
  ProjectType,
  Simulation,
  DEFAULT_ROLES,
} from '@/types';
import * as clientTypeService from '@/services/clientTypeService';
import * as projectTypeService from '@/services/projectTypeService';

interface DataContextType {
  dailyRates: DailyRate[];
  clientTypes: ClientType[];
  margins: Margin[];
  projectTypes: ProjectType[];
  simulations: Simulation[];
  isLoadingClientTypes: boolean;
  isLoadingProjectTypes: boolean;
  updateDailyRate: (rate: DailyRate) => void;
  addDailyRate: (rate: Omit<DailyRate, 'id'>) => void;
  deleteDailyRate: (id: string) => void;
  updateClientType: (type: ClientType) => Promise<boolean>;
  addClientType: (type: Omit<ClientType, 'id'>) => Promise<boolean>;
  deleteClientType: (id: string) => Promise<boolean>;
  refreshClientTypes: () => Promise<void>;
  updateMargin: (margin: Margin) => void;
  addMargin: (margin: Omit<Margin, 'id'>) => void;
  deleteMargin: (id: string) => void;
  updateProjectType: (type: ProjectType) => Promise<boolean>;
  addProjectType: (type: Omit<ProjectType, 'id'>) => Promise<boolean>;
  deleteProjectType: (id: string) => Promise<boolean>;
  refreshProjectTypes: () => Promise<void>;
  addSimulation: (simulation: Omit<Simulation, 'id'> & { id?: string }) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const generateId = () => Math.random().toString(36).substr(2, 9);

const initialDailyRates: DailyRate[] = DEFAULT_ROLES.map((role, index) => {
  const dailyRate = [500000, 350000, 250000, 200000, 180000, 300000, 350000, 100000][index] || 200000;
  return {
    id: generateId(),
    roleName: role,
    rate: dailyRate,
    hourlyRate: Math.round(dailyRate / 8),
    isActive: true,
  };
});

const initialMargins: Margin[] = [
  { id: generateId(), percentage: 30, isActive: true },
  { id: generateId(), percentage: 40, isActive: true },
  { id: generateId(), percentage: 50, isActive: true },
];

export function DataProvider({ children }: { children: ReactNode }) {
  const [dailyRates, setDailyRates] = useState<DailyRate[]>(initialDailyRates);
  const [clientTypes, setClientTypes] = useState<ClientType[]>([]);
  const [margins, setMargins] = useState<Margin[]>(initialMargins);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [isLoadingClientTypes, setIsLoadingClientTypes] = useState(true);
  const [isLoadingProjectTypes, setIsLoadingProjectTypes] = useState(true);

  const refreshClientTypes = async () => {
    setIsLoadingClientTypes(true);
    const { data, error } = await clientTypeService.getClientTypes();
    if (!error && data) {
      setClientTypes(data);
    }
    setIsLoadingClientTypes(false);
  };

  const refreshProjectTypes = async () => {
    setIsLoadingProjectTypes(true);
    const { data, error } = await projectTypeService.getProjectTypes();
    if (!error && data) {
      setProjectTypes(data);
    }
    setIsLoadingProjectTypes(false);
  };

  useEffect(() => {
    refreshClientTypes();
  }, []);

  useEffect(() => {
    refreshProjectTypes();
  }, []);

  const updateDailyRate = (rate: DailyRate) => {
    setDailyRates(prev => prev.map(r => r.id === rate.id ? rate : r));
  };

  const addDailyRate = (rate: Omit<DailyRate, 'id'>) => {
    setDailyRates(prev => [...prev, { ...rate, id: generateId() }]);
  };

  const deleteDailyRate = (id: string) => {
    setDailyRates(prev => prev.filter(r => r.id !== id));
  };

  const updateClientType = async (type: ClientType): Promise<boolean> => {
    const { data, error } = await clientTypeService.updateClientType(type);
    if (error || !data) return false;
    setClientTypes(prev => prev.map(t => t.id === type.id ? data : t));
    return true;
  };

  const addClientType = async (type: Omit<ClientType, 'id'>): Promise<boolean> => {
    const { data, error } = await clientTypeService.createClientType(type);
    if (error || !data) return false;
    setClientTypes(prev => [...prev, data]);
    return true;
  };

  const deleteClientType = async (id: string): Promise<boolean> => {
    const { error } = await clientTypeService.deleteClientType(id);
    if (error) return false;
    setClientTypes(prev => prev.filter(t => t.id !== id));
    return true;
  };

  const updateMargin = (margin: Margin) => {
    setMargins(prev => prev.map(m => m.id === margin.id ? margin : m));
  };

  const addMargin = (margin: Omit<Margin, 'id'>) => {
    setMargins(prev => [...prev, { ...margin, id: generateId() }]);
  };

  const deleteMargin = (id: string) => {
    setMargins(prev => prev.filter(m => m.id !== id));
  };

  const updateProjectType = async (type: ProjectType): Promise<boolean> => {
    const { data, error } = await projectTypeService.updateProjectType(type);
    if (error || !data) return false;
    setProjectTypes(prev => prev.map(t => t.id === type.id ? data : t));
    return true;
  };

  const addProjectType = async (type: Omit<ProjectType, 'id'>): Promise<boolean> => {
    const { data, error } = await projectTypeService.createProjectType(type);
    if (error || !data) return false;
    setProjectTypes(prev => [...prev, data]);
    return true;
  };

  const deleteProjectType = async (id: string): Promise<boolean> => {
    const { error } = await projectTypeService.deleteProjectType(id);
    if (error) return false;
    setProjectTypes(prev => prev.filter(t => t.id !== id));
    return true;
  };

  const addSimulation = (simulation: Omit<Simulation, 'id'> & { id?: string }) => {
    setSimulations(prev => [{ ...simulation, id: simulation.id || generateId() }, ...prev]);
  };

  return (
    <DataContext.Provider value={{
      dailyRates,
      clientTypes,
      margins,
      projectTypes,
      simulations,
      isLoadingClientTypes,
      isLoadingProjectTypes,
      updateDailyRate,
      addDailyRate,
      deleteDailyRate,
      updateClientType,
      addClientType,
      deleteClientType,
      refreshClientTypes,
      updateMargin,
      addMargin,
      deleteMargin,
      updateProjectType,
      addProjectType,
      deleteProjectType,
      refreshProjectTypes,
      addSimulation,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
