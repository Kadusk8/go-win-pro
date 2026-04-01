CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.companies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  cnpj TEXT,
  segment TEXT,
  status TEXT CHECK(status IN ('Ativo', 'Prospecto', 'Inativo')),
  phone TEXT,
  email TEXT,
  address TEXT,
  responsible TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS settings (default open for initial development if requested, but we should enable it eventually)
-- ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "allow all" ON public.companies FOR ALL USING (true);
