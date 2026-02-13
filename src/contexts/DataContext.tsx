import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  DailyRate,
  ClientType,
  Margin,
  ProjectType,
  Simulation,
} from '@/types';
import * as clientTypeService from '@/services/clientTypeService';
import * as projectTypeService from '@/services/projectTypeService';
import * as dailyRateService from '@/services/dailyRateService';
import * as marginService from '@/services/marginService';

interface DataContextType {
  dailyRates: DailyRate[];
  clientTypes: ClientType[];
  margins: Margin[];
  projectTypes: ProjectType[];
  simulations: Simulation[];
  isLoadingClientTypes: boolean;
  isLoadingProjectTypes: boolean;
  isLoadingDailyRates: boolean;
  isLoadingMargins: boolean;
  updateDailyRate: (rate: DailyRate) => Promise<boolean>;
  addDailyRate: (rate: Omit<DailyRate, 'id'>) => Promise<boolean>;
  deleteDailyRate: (id: string) => Promise<boolean>;
  refreshDailyRates: () => Promise<void>;
  updateClientType: (type: ClientType) => Promise<boolean>;
  addClientType: (type: Omit<ClientType, 'id'>) => Promise<boolean>;
  deleteClientType: (id: string) => Promise<boolean>;
  refreshClientTypes: () => Promise<void>;
  updateMargin: (margin: Margin) => Promise<boolean>;
  addMargin: (margin: Omit<Margin, 'id'>) => Promise<boolean>;
  deleteMargin: (id: string) => Promise<boolean>;
  refreshMargins: () => Promise<void>;
  updateProjectType: (type: ProjectType) => Promise<boolean>;
  addProjectType: (type: Omit<ProjectType, 'id'>) => Promise<boolean>;
  deleteProjectType: (id: string) => Promise<boolean>;
  refreshProjectTypes: () => Promise<void>;
  addSimulation: (simulation: Omit<Simulation, 'id'> & { id?: string }) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const generateId = () => Math.random().toString(36).substr(2, 9);

export function DataProvider({ children }: { children: ReactNode }) {
  const [dailyRates, setDailyRates] = useState<DailyRate[]>([]);
  const [clientTypes, setClientTypes] = useState<ClientType[]>([]);
  const [margins, setMargins] = useState<Margin[]>([]);
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([]);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [isLoadingClientTypes, setIsLoadingClientTypes] = useState(true);
  const [isLoadingProjectTypes, setIsLoadingProjectTypes] = useState(true);
  const [isLoadingDailyRates, setIsLoadingDailyRates] = useState(true);
  const [isLoadingMargins, setIsLoadingMargins] = useState(true);

  const refreshDailyRates = async () => {
    setIsLoadingDailyRates(true);
    const { data, error } = await dailyRateService.getDailyRates();
    if (!error && data) {
      setDailyRates(data);
    }
    setIsLoadingDailyRates(false);
  };

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

  const refreshMargins = async () => {
    setIsLoadingMargins(true);
    const { data, error } = await marginService.getMargins();
    if (!error && data) {
      setMargins(data);
    }
    setIsLoadingMargins(false);
  };

  useEffect(() => {
    refreshClientTypes();
  }, []);

  useEffect(() => {
    refreshProjectTypes();
  }, []);

  useEffect(() => {
    refreshDailyRates();
  }, []);

  useEffect(() => {
    refreshMargins();
  }, []);

  const updateDailyRate = async (rate: DailyRate): Promise<boolean> => {
    const { data, error } = await dailyRateService.updateDailyRate(rate);
    if (error || !data) return false;
    setDailyRates(prev => prev.map(r => r.id === rate.id ? data : r));
    return true;
  };

  const addDailyRate = async (rate: Omit<DailyRate, 'id'>): Promise<boolean> => {
    const { data, error } = await dailyRateService.createDailyRate(rate);
    if (error || !data) return false;
    setDailyRates(prev => [...prev, data]);
    return true;
  };

  const deleteDailyRate = async (id: string): Promise<boolean> => {
    const { error } = await dailyRateService.deleteDailyRate(id);
    if (error) return false;
    setDailyRates(prev => prev.filter(r => r.id !== id));
    return true;
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

  const updateMargin = async (margin: Margin): Promise<boolean> => {
    const { data, error } = await marginService.updateMargin(margin);
    if (error || !data) return false;
    setMargins(prev => prev.map(m => m.id === margin.id ? data : m));
    return true;
  };

  const addMargin = async (margin: Omit<Margin, 'id'>): Promise<boolean> => {
    const { data, error } = await marginService.createMargin(margin);
    if (error || !data) return false;
    setMargins(prev => [...prev, data]);
    return true;
  };

  const deleteMargin = async (id: string): Promise<boolean> => {
    const { error } = await marginService.deleteMargin(id);
    if (error) return false;
    setMargins(prev => prev.filter(m => m.id !== id));
    return true;
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
      isLoadingDailyRates,
      isLoadingMargins,
      updateDailyRate,
      addDailyRate,
      deleteDailyRate,
      refreshDailyRates,
      updateClientType,
      addClientType,
      deleteClientType,
      refreshClientTypes,
      updateMargin,
      addMargin,
      deleteMargin,
      refreshMargins,
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
