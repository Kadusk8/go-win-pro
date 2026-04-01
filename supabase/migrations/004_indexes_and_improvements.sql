-- Add updated_at to all tables
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc', now());

ALTER TABLE public.visits
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc', now());

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc', now());

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER visits_updated_at
  BEFORE UPDATE ON public.visits
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Unique constraint on CNPJ (ignore nulls/empty)
CREATE UNIQUE INDEX IF NOT EXISTS companies_cnpj_unique
  ON public.companies (cnpj)
  WHERE cnpj IS NOT NULL AND cnpj <> '';

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS companies_status_idx ON public.companies (status);
CREATE INDEX IF NOT EXISTS companies_created_at_idx ON public.companies (created_at DESC);

CREATE INDEX IF NOT EXISTS visits_company_id_idx ON public.visits (company_id);
CREATE INDEX IF NOT EXISTS visits_date_idx ON public.visits (date DESC);

CREATE INDEX IF NOT EXISTS appointments_company_id_idx ON public.appointments (company_id);
CREATE INDEX IF NOT EXISTS appointments_date_idx ON public.appointments (date ASC);
