import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CustomRole, AVAILABLE_PERMISSIONS } from '@/types';

interface UserPermissions {
  roleId: string | null;
  roleName: string | null;
  permissions: Record<string, boolean>;
  isLoading: boolean;
}

export function usePermissions() {
  const [userPermissions, setUserPermissions] = useState<UserPermissions>({
    roleId: null,
    roleName: null,
    permissions: {},
    isLoading: true,
  });

  const fetchUserPermissions = useCallback(async (userId: string) => {
    try {
      // Get user's role assignment
      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select('role, custom_role_id')
        .eq('user_id', userId)
        .single();

      if (roleError) throw roleError;

      let permissions: Record<string, boolean> = {};
      let roleName: string | null = null;
      let roleId: string | null = null;

      if (userRole?.custom_role_id) {
        // User has a custom role assigned
        const { data: customRole, error: customRoleError } = await supabase
          .from('custom_roles')
          .select('*')
          .eq('id', userRole.custom_role_id)
          .single();

        if (!customRoleError && customRole) {
          permissions = customRole.permissions as Record<string, boolean>;
          roleName = customRole.name;
          roleId = customRole.id;
        }
      } else if (userRole?.role) {
        // Fallback to legacy enum role - map to system role permissions
        const roleMapping: Record<string, string> = {
          admin: 'Admin',
          project_manager: 'Chef de Projet',
          sales: 'Commercial',
        };

        const mappedRoleName = roleMapping[userRole.role] || 'Commercial';

        const { data: systemRole, error: systemRoleError } = await supabase
          .from('custom_roles')
          .select('*')
          .eq('name', mappedRoleName)
          .eq('is_system', true)
          .single();

        if (!systemRoleError && systemRole) {
          permissions = systemRole.permissions as Record<string, boolean>;
          roleName = systemRole.name;
          roleId = systemRole.id;
        }
      }

      setUserPermissions({
        roleId,
        roleName,
        permissions,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      setUserPermissions({
        roleId: null,
        roleName: null,
        permissions: {},
        isLoading: false,
      });
    }
  }, []);

  useEffect(() => {
    const initPermissions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        fetchUserPermissions(user.id);
      } else {
        setUserPermissions({
          roleId: null,
          roleName: null,
          permissions: {},
          isLoading: false,
        });
      }
    };

    initPermissions();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        fetchUserPermissions(session.user.id);
      } else {
        setUserPermissions({
          roleId: null,
          roleName: null,
          permissions: {},
          isLoading: false,
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchUserPermissions]);

  const hasPermission = useCallback((permissionKey: string): boolean => {
    return userPermissions.permissions[permissionKey] === true;
  }, [userPermissions.permissions]);

  const hasAnyPermission = useCallback((permissionKeys: string[]): boolean => {
    return permissionKeys.some(key => userPermissions.permissions[key] === true);
  }, [userPermissions.permissions]);

  const hasAllPermissions = useCallback((permissionKeys: string[]): boolean => {
    return permissionKeys.every(key => userPermissions.permissions[key] === true);
  }, [userPermissions.permissions]);

  const refreshPermissions = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await fetchUserPermissions(user.id);
    }
  }, [fetchUserPermissions]);

  return {
    ...userPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refreshPermissions,
  };
}

// Permission keys for easy reference
export const PERMISSIONS = {
  CREATE_SIMULATIONS: 'can_create_simulations',
  VIEW_ALL_SIMULATIONS: 'can_view_all_simulations',
  EDIT_DAILY_RATES: 'can_edit_daily_rates',
  EDIT_CLIENT_TYPES: 'can_edit_client_types',
  EDIT_MARGINS: 'can_edit_margins',
  EDIT_PROJECT_TYPES: 'can_edit_project_types',
  MANAGE_USERS: 'can_manage_users',
  DELETE_USERS: 'can_delete_users',
  MANAGE_ROLES: 'can_manage_roles',
  VIEW_ANALYTICS: 'can_view_analytics',
  VIEW_USAGE_HISTORY: 'can_view_usage_history',
} as const;