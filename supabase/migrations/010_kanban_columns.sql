CREATE TABLE public.kanban_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.kanban_columns DISABLE ROW LEVEL SECURITY;

INSERT INTO public.kanban_columns (name, position) VALUES
  ('A fazer', 0),
  ('Em andamento', 1),
  ('Concluído', 2);
