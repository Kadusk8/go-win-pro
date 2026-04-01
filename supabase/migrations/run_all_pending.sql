-- Execute este arquivo no Supabase SQL Editor para aplicar todas as migrations pendentes

-- 005: Campos espirituais
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS campo TEXT,
  ADD COLUMN IF NOT EXISTS gc TEXT,
  ADD COLUMN IF NOT EXISTS cursos TEXT[] DEFAULT '{}';

-- 006: Esposo e esposa
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS esposo TEXT,
  ADD COLUMN IF NOT EXISTS esposa TEXT;

-- 007: company_id opcional nos agendamentos
ALTER TABLE public.appointments
  ALTER COLUMN company_id DROP NOT NULL;

-- 008: Status e relatório nos agendamentos
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Agendado',
  ADD COLUMN IF NOT EXISTS relatorio TEXT;

-- Indexes de performance
CREATE INDEX IF NOT EXISTS companies_status_idx ON public.companies (status);
CREATE INDEX IF NOT EXISTS companies_created_at_idx ON public.companies (created_at DESC);
CREATE INDEX IF NOT EXISTS companies_campo_idx ON public.companies (campo);
CREATE INDEX IF NOT EXISTS appointments_date_idx ON public.appointments (date ASC);
CREATE INDEX IF NOT EXISTS appointments_company_id_idx ON public.appointments (company_id);
