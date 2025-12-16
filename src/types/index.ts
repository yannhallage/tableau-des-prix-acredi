// User and Authentication Types
export type UserRole = 'admin' | 'project_manager' | 'sales';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

// Daily Rate Types
export interface DailyRate {
  id: string;
  roleName: string;
  rate: number; // Taux journalier
  hourlyRate: number; // Taux horaire
  isActive: boolean;
}

// Calculation Mode
export type CalculationMode = 'daily' | 'hourly';
export const HOURS_PER_DAY = 8;

// Client Type
export interface ClientType {
  id: string;
  name: string;
  coefficient: number;
  description: string;
}

// Margin
export interface Margin {
  id: string;
  percentage: number;
  isActive: boolean;
}

// Project Type
export interface ProjectType {
  id: string;
  name: string;
  description: string;
  complexityLevel: 'low' | 'medium' | 'high';
}

// Role Days for Calculator
export interface RoleDays {
  roleId: string;
  roleName: string;
  days: number;
  rate: number;
}

// Simulation
export interface Simulation {
  id: string;
  clientName: string;
  clientType: ClientType;
  projectType: ProjectType;
  roleDays: RoleDays[];
  margin: number;
  internalCost: number;
  costAfterCoefficient: number;
  recommendedPrice: number;
  createdBy: User;
  createdAt: Date;
}

// Role Labels in French
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrateur',
  project_manager: 'Chef de Projet',
  sales: 'Commercial',
};

// Default Roles for TJM
export const DEFAULT_ROLES = [
  'Directeur Général',
  'Chef de Projet',
  'Designer',
  'Rédacteur',
  'Community Manager',
  'Motion Designer',
  'Développeur',
  'Assistant',
];

// Default Client Types
export const DEFAULT_CLIENT_TYPES: Omit<ClientType, 'id'>[] = [
  { name: 'Micro-entreprise', coefficient: 0.8, description: 'Petites structures, startups' },
  { name: 'PME', coefficient: 1.0, description: 'Petites et moyennes entreprises' },
  { name: 'École / Formation', coefficient: 0.85, description: 'Établissements éducatifs' },
  { name: 'Marque / E-commerce', coefficient: 1.2, description: 'Marques et boutiques en ligne' },
  { name: 'ONG Locale', coefficient: 0.7, description: 'Organisations non gouvernementales locales' },
  { name: 'Institution Publique', coefficient: 1.1, description: 'Administrations et services publics' },
  { name: 'Cabinet Juridique', coefficient: 1.3, description: 'Avocats et notaires' },
  { name: 'Organisation Internationale', coefficient: 1.5, description: 'ONG internationales, ambassades' },
];

// Default Project Types
export const DEFAULT_PROJECT_TYPES: Omit<ProjectType, 'id'>[] = [
  { name: 'Gestion des réseaux sociaux', description: 'Community management mensuel', complexityLevel: 'medium' },
  { name: 'Branding', description: 'Identité visuelle complète', complexityLevel: 'high' },
  { name: 'Site vitrine', description: 'Site web institutionnel', complexityLevel: 'medium' },
  { name: 'Stratégie digitale', description: 'Audit et plan stratégique', complexityLevel: 'high' },
  { name: 'Vidéo / Motion', description: 'Production audiovisuelle', complexityLevel: 'high' },
  { name: 'Mandat long terme', description: 'Accompagnement sur plusieurs mois', complexityLevel: 'medium' },
];
