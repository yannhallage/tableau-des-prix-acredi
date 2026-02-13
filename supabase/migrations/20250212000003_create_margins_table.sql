-- Create margins table
CREATE TABLE public.margins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  percentage INTEGER NOT NULL CHECK (percentage >= 1 AND percentage <= 100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (percentage)
);

-- Enable RLS
ALTER TABLE public.margins ENABLE ROW LEVEL SECURITY;

-- margins: everyone authenticated can read
CREATE POLICY "Anyone can view margins"
ON public.margins FOR SELECT
TO authenticated
USING (true);

-- margins: only admins can manage
CREATE POLICY "Admins can insert margins"
ON public.margins FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update margins"
ON public.margins FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete margins"
ON public.margins FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_margins_updated_at
BEFORE UPDATE ON public.margins
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Seed default margins
INSERT INTO public.margins (percentage, is_active) VALUES
(30, true),
(40, true),
(50, true);
