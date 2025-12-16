-- Create custom_roles table for dynamic role management
CREATE TABLE public.custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{}',
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;

-- Policies for custom_roles
CREATE POLICY "Anyone can view roles" ON public.custom_roles
FOR SELECT USING (true);

CREATE POLICY "Admins can create roles" ON public.custom_roles
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update non-system roles" ON public.custom_roles
FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) AND NOT is_system);

CREATE POLICY "Admins can delete non-system roles" ON public.custom_roles
FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role) AND NOT is_system);

-- Add trigger for updated_at
CREATE TRIGGER update_custom_roles_updated_at
BEFORE UPDATE ON public.custom_roles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Insert default system roles with their current permissions
INSERT INTO public.custom_roles (name, description, permissions, is_system) VALUES
('Admin', 'Accès complet à toutes les fonctionnalités', '{
  "can_create_simulations": true,
  "can_view_all_simulations": true,
  "can_edit_daily_rates": true,
  "can_edit_client_types": true,
  "can_edit_margins": true,
  "can_edit_project_types": true,
  "can_manage_users": true,
  "can_manage_roles": true,
  "can_view_analytics": true,
  "can_view_usage_history": true
}'::jsonb, true),
('Chef de Projet', 'Peut créer et voir ses propres simulations', '{
  "can_create_simulations": true,
  "can_view_all_simulations": false,
  "can_edit_daily_rates": false,
  "can_edit_client_types": false,
  "can_edit_margins": false,
  "can_edit_project_types": false,
  "can_manage_users": false,
  "can_manage_roles": false,
  "can_view_analytics": true,
  "can_view_usage_history": false
}'::jsonb, true),
('Commercial', 'Accès limité en lecture aux simulations', '{
  "can_create_simulations": true,
  "can_view_all_simulations": false,
  "can_edit_daily_rates": false,
  "can_edit_client_types": false,
  "can_edit_margins": false,
  "can_edit_project_types": false,
  "can_manage_users": false,
  "can_manage_roles": false,
  "can_view_analytics": false,
  "can_view_usage_history": false
}'::jsonb, true);

-- Add custom_role_id to user_roles table for linking to dynamic roles
ALTER TABLE public.user_roles ADD COLUMN custom_role_id UUID REFERENCES public.custom_roles(id) ON DELETE SET NULL;