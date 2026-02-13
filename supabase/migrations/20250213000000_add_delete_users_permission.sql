-- Add can_delete_users permission to system roles
-- This migration adds the can_delete_users permission to existing system roles

-- Update Admin role to include can_delete_users permission
UPDATE public.custom_roles
SET permissions = jsonb_set(
  permissions,
  '{can_delete_users}',
  'true'::jsonb
)
WHERE name = 'Admin' AND is_system = true;

-- Chef de Projet and Commercial roles don't get this permission (already false by default)
-- The permission will be false for these roles unless explicitly set
