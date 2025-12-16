import React, { createContext, useContext, ReactNode } from 'react';
import { usePermissions, PERMISSIONS } from '@/hooks/usePermissions';

interface PermissionsContextType {
  roleId: string | null;
  roleName: string | null;
  permissions: Record<string, boolean>;
  isLoading: boolean;
  hasPermission: (permissionKey: string) => boolean;
  hasAnyPermission: (permissionKeys: string[]) => boolean;
  hasAllPermissions: (permissionKeys: string[]) => boolean;
  refreshPermissions: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const permissions = usePermissions();

  return (
    <PermissionsContext.Provider value={permissions}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissionsContext() {
  const context = useContext(PermissionsContext);
  if (context === undefined) {
    throw new Error('usePermissionsContext must be used within a PermissionsProvider');
  }
  return context;
}

// Re-export PERMISSIONS for convenience
export { PERMISSIONS };