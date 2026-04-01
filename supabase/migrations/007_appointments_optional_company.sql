-- Torna company_id opcional nos agendamentos
ALTER TABLE public.appointments
  ALTER COLUMN company_id DROP NOT NULL;
