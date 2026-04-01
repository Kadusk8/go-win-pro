-- Equipe
CREATE TABLE IF NOT EXISTS public.team_members (
  id   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.team_members DISABLE ROW LEVEL SECURITY;

-- Tarefas (Kanban)
CREATE TABLE IF NOT EXISTS public.tasks (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title          TEXT NOT NULL,
  description    TEXT,
  status         TEXT DEFAULT 'A fazer',
  responsible_id UUID REFERENCES public.team_members(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS tasks_status_idx ON public.tasks (status);
CREATE INDEX IF NOT EXISTS tasks_responsible_idx ON public.tasks (responsible_id);
