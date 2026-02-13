// User and Authentication Types
export type UserRole = 'admin' | 'project_manager' | 'sales';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

// Custom Role Types
export interface Permission {
  key: string;
  label: string;
  description: string;
}

export interface CustomRole {
  id: string;
  name: string;
  description: string | null;
  permissions: Record<string, boolean>;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

// Available permissions
export const AVAILABLE_PERMISSIONS: Permission[] = [
  { key: 'can_create_simulations', label: 'Créer des simulations', description: 'Permet de créer de nouvelles simulations de tarification' },
  { key: 'can_view_all_simulations', label: 'Voir toutes les simulations', description: 'Accès à l\'historique complet des simulations' },
  { key: 'can_edit_daily_rates', label: 'Modifier les TJM', description: 'Gérer les taux journaliers par rôle' },
  { key: 'can_edit_client_types', label: 'Modifier les types de clients', description: 'Gérer les coefficients clients' },
  { key: 'can_edit_margins', label: 'Modifier les marges', description: 'Configurer les options de marge' },
  { key: 'can_edit_project_types', label: 'Modifier les types de projets', description: 'Gérer les catégories de projets' },
  { key: 'can_manage_users', label: 'Gérer les utilisateurs', description: 'Créer et modifier les utilisateurs' },
  { key: 'can_manage_roles', label: 'Gérer les rôles', description: 'Créer et modifier les rôles personnalisés' },
  { key: 'can_view_analytics', label: 'Voir les statistiques', description: 'Accès au tableau de bord analytique' },
  { key: 'can_view_usage_history', label: 'Voir l\'historique d\'utilisation', description: 'Consulter les logs d\'activité' },
];

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

// Les types de clients et de projets sont désormais stockés en base de données (Supabase)
// Voir : clientTypeService et projectTypeService