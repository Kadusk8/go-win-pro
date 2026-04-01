ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Agendado' CHECK (status IN ('Agendado', 'Realizado', 'Cancelado')),
  ADD COLUMN IF NOT EXISTS relatorio TEXT;
