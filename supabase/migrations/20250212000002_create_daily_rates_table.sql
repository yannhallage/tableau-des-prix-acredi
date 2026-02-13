-- Create daily_rates table
CREATE TABLE public.daily_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name TEXT NOT NULL,
  rate NUMERIC NOT NULL,
  hourly_rate NUMERIC NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.daily_rates ENABLE ROW LEVEL SECURITY;

-- daily_rates: everyone authenticated can read
CREATE POLICY "Anyone can view daily rates"
ON public.daily_rates FOR SELECT
TO authenticated
USING (true);

-- daily_rates: only admins can manage
CREATE POLICY "Admins can insert daily rates"
ON public.daily_rates FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update daily rates"
ON public.daily_rates FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete daily rates"
ON public.daily_rates FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_daily_rates_updated_at
BEFORE UPDATE ON public.daily_rates
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Seed default daily rates
INSERT INTO public.daily_rates (role_name, rate, hourly_rate, is_active) VALUES
('Directeur Général', 500000, 62500, true),
('Chef de Projet', 350000, 43750, true),
('Designer', 250000, 31250, true),
('Rédacteur', 200000, 25000, true),
('Community Manager', 180000, 22500, true),
('Motion Designer', 300000, 37500, true),
('Développeur', 350000, 43750, true),
('Assistant', 100000, 12500, true);
