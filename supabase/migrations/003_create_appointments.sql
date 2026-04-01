CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  type TEXT,
  responsible TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS settings
-- ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "allow all" ON public.appointments FOR ALL USING (true);
