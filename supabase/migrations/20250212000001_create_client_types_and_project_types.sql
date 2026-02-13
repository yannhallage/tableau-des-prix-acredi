-- Create complexity_level enum for project types
CREATE TYPE public.complexity_level AS ENUM ('low', 'medium', 'high');

-- Create client_types table
CREATE TABLE public.client_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  coefficient NUMERIC NOT NULL DEFAULT 1,
  description TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_types table
CREATE TABLE public.project_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  complexity_level complexity_level NOT NULL DEFAULT 'medium',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.client_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_types ENABLE ROW LEVEL SECURITY;

-- client_types: everyone authenticated can read
CREATE POLICY "Anyone can view client types"
ON public.client_types FOR SELECT
TO authenticated
USING (true);

-- client_types: only admins can manage
CREATE POLICY "Admins can insert client types"
ON public.client_types FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update client types"
ON public.client_types FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete client types"
ON public.client_types FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- project_types: everyone authenticated can read
CREATE POLICY "Anyone can view project types"
ON public.project_types FOR SELECT
TO authenticated
USING (true);

-- project_types: only admins can manage
CREATE POLICY "Admins can insert project types"
ON public.project_types FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update project types"
ON public.project_types FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete project types"
ON public.project_types FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Triggers for updated_at
CREATE TRIGGER update_client_types_updated_at
BEFORE UPDATE ON public.client_types
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_project_types_updated_at
BEFORE UPDATE ON public.project_types
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Seed default client types
INSERT INTO public.client_types (name, coefficient, description) VALUES
('Micro-entreprise', 0.8, 'Petites structures, startups'),
('PME', 1.0, 'Petites et moyennes entreprises'),
('École / Formation', 0.85, 'Établissements éducatifs'),
('Marque / E-commerce', 1.2, 'Marques et boutiques en ligne'),
('ONG Locale', 0.7, 'Organisations non gouvernementales locales'),
('Institution Publique', 1.1, 'Administrations et services publics'),
('Cabinet Juridique', 1.3, 'Avocats et notaires'),
('Organisation Internationale', 1.5, 'ONG internationales, ambassades');

-- Seed default project types
INSERT INTO public.project_types (name, description, complexity_level) VALUES
('Gestion des réseaux sociaux', 'Community management mensuel', 'medium'),
('Branding', 'Identité visuelle complète', 'high'),
('Site vitrine', 'Site web institutionnel', 'medium'),
('Stratégie digitale', 'Audit et plan stratégique', 'high'),
('Vidéo / Motion', 'Production audiovisuelle', 'high'),
('Mandat long terme', 'Accompagnement sur plusieurs mois', 'medium');
