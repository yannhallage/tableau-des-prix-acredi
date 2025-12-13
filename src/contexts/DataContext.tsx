import { createContext, useContext, useState, ReactNode } from 'react';
import {
  DailyRate,
  ClientType,
  Margin,
  ProjectType,
  Simulation,
  DEFAULT_ROLES,
  DEFAULT_CLIENT_TYPES,
  DEFAULT_PROJECT_TYPES,
} from '@/types';

interface DataContextType {
  dailyRates: DailyRate[];
  clientTypes: ClientType[];
  margins: Margin[];
  projectTypes: ProjectType[];
  simulations: Simulation[];
  updateDailyRate: (rate: DailyRate) => void;
  addDailyRate: (rate: Omit<DailyRate, 'id'>) => void;
  deleteDailyRate: (id: string) => void;
  updateClientType: (type: ClientType) => void;
  addClientType: (type: Omit<ClientType, 'id'>) => void;
  deleteClientType: (id: string) => void;
  updateMargin: (margin: Margin) => void;
  addMargin: (margin: Omit<Margin, 'id'>) => void;
  deleteMargin: (id: string) => void;
  updateProjectType: (type: ProjectType) => void;
  addProjectType: (type: Omit<ProjectType, 'id'>) => void;
  deleteProjectType: (id: string) => void;
  addSimulation: (simulation: Omit<Simulation, 'id'>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Initialize default data
const generateId = () => Math.random().toString(36).substr(2, 9);

const initialDailyRates: DailyRate[] = DEFAULT_ROLES.map((role, index) => ({
  id: generateId(),
  roleName: role,
  rate: [500000, 350000, 250000, 200000, 180000, 300000, 350000, 100000][index] || 200000,
  isActive: true,
}));

const initialClientTypes: ClientType[] = DEFAULT_CLIENT_TYPES.map(type => ({
  ...type,
  id: generateId(),
}));

const initialMargins: Margin[] = [
  { id: generateId(), percentage: 30, isActive: true },
  { id: generateId(), percentage: 40, isActive: true },
  { id: generateId(), percentage: 50, isActive: true },
];

const initialProjectTypes: ProjectType[] = DEFAULT_PROJECT_TYPES.map(type => ({
  ...type,
  id: generateId(),
}));

export function DataProvider({ children }: { children: ReactNode }) {
  const [dailyRates, setDailyRates] = useState<DailyRate[]>(initialDailyRates);
  const [clientTypes, setClientTypes] = useState<ClientType[]>(initialClientTypes);
  const [margins, setMargins] = useState<Margin[]>(initialMargins);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>(initialProjectTypes);
  const [simulations, setSimulations] = useState<Simulation[]>([]);

  const updateDailyRate = (rate: DailyRate) => {
    setDailyRates(prev => prev.map(r => r.id === rate.id ? rate : r));
  };

  const addDailyRate = (rate: Omit<DailyRate, 'id'>) => {
    setDailyRates(prev => [...prev, { ...rate, id: generateId() }]);
  };

  const deleteDailyRate = (id: string) => {
    setDailyRates(prev => prev.filter(r => r.id !== id));
  };

  const updateClientType = (type: ClientType) => {
    setClientTypes(prev => prev.map(t => t.id === type.id ? type : t));
  };

  const addClientType = (type: Omit<ClientType, 'id'>) => {
    setClientTypes(prev => [...prev, { ...type, id: generateId() }]);
  };

  const deleteClientType = (id: string) => {
    setClientTypes(prev => prev.filter(t => t.id !== id));
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

  const updateProjectType = (type: ProjectType) => {
    setProjectTypes(prev => prev.map(t => t.id === type.id ? type : t));
  };

  const addProjectType = (type: Omit<ProjectType, 'id'>) => {
    setProjectTypes(prev => [...prev, { ...type, id: generateId() }]);
  };

  const deleteProjectType = (id: string) => {
    setProjectTypes(prev => prev.filter(t => t.id !== id));
  };

  const addSimulation = (simulation: Omit<Simulation, 'id'>) => {
    setSimulations(prev => [{ ...simulation, id: generateId() }, ...prev]);
  };

  return (
    <DataContext.Provider value={{
      dailyRates,
      clientTypes,
      margins,
      projectTypes,
      simulations,
      updateDailyRate,
      addDailyRate,
      deleteDailyRate,
      updateClientType,
      addClientType,
      deleteClientType,
      updateMargin,
      addMargin,
      deleteMargin,
      updateProjectType,
      addProjectType,
      deleteProjectType,
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
