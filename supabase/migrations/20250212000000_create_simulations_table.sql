-- Create simulations table for storing calculator data
CREATE TABLE public.simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  client_type JSONB NOT NULL,
  project_type JSONB NOT NULL,
  role_days JSONB NOT NULL DEFAULT '[]',
  margin NUMERIC NOT NULL,
  internal_cost NUMERIC NOT NULL,
  cost_after_coefficient NUMERIC NOT NULL,
  recommended_price NUMERIC NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;

-- Users can insert their own simulations
CREATE POLICY "Users can create their own simulations"
ON public.simulations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Users can view their own simulations
CREATE POLICY "Users can view their own simulations"
ON public.simulations FOR SELECT
TO authenticated
USING (auth.uid() = created_by);

-- Admins can view all simulations
CREATE POLICY "Admins can view all simulations"
ON public.simulations FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create index for faster queries
CREATE INDEX idx_simulations_created_by ON public.simulations(created_by);
CREATE INDEX idx_simulations_created_at ON public.simulations(created_at DESC);
