CREATE TABLE IF NOT EXISTS public.visits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type TEXT CHECK(type IN ('Presencial', 'Remota', 'Telefone')),
  responsible TEXT,
  summary TEXT,
  outcome TEXT CHECK(outcome IN ('Positivo', 'Neutro', 'Negativo')),
  next_steps TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS settings
-- ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "allow all" ON public.visits FOR ALL USING (true);
