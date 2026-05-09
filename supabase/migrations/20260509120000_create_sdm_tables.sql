-- ════════════════════════════════════════════════════════════════════════════
-- Subdirección Médica (SDM): tablas para Consola de Agenda Semanal
-- Aplicar manualmente desde Supabase Studio → SQL Editor
-- ════════════════════════════════════════════════════════════════════════════

-- 1) Catálogo de médicos
CREATE TABLE IF NOT EXISTS public.sdm_doctors (
  id TEXT PRIMARY KEY,                    -- slug, ej "fasani", "san_martin"
  display_name TEXT NOT NULL,             -- ej "FASANI", "SAN MARTIN"
  full_name TEXT,                         -- ej "Dra. Micaela Fasani Montagna"
  role TEXT,                              -- ej "Médico EDF", "Médico de Salud Mental"
  is_reinforcement_eligible BOOLEAN DEFAULT TRUE,
  active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2) Definición fija de los 7 turnos rotativos + volante
CREATE TABLE IF NOT EXISTS public.sdm_shift_rotation (
  id SERIAL PRIMARY KEY,
  turno_number INT NOT NULL,              -- 0 = volante, 1-7 = turnos
  doctor_id TEXT NOT NULL REFERENCES public.sdm_doctors(id) ON DELETE CASCADE,
  position INT DEFAULT 1,                 -- 1 = primero, 2 = segundo
  UNIQUE(turno_number, doctor_id)
);

-- 3) Calendario: qué turno aplica a cada día
CREATE TABLE IF NOT EXISTS public.sdm_shift_calendar (
  date DATE PRIMARY KEY,
  turno_number INT NOT NULL,
  replacements JSONB DEFAULT '[]'::jsonb,  -- [{"doctor_id":"sandoval","replaced_by":"troncoso","reason":"FL"}]
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4) Plantillas de bloqueos semanales (programas, gestión, reuniones)
CREATE TABLE IF NOT EXISTS public.sdm_block_templates (
  id TEXT PRIMARY KEY,                    -- slug
  name TEXT NOT NULL,                     -- nombre display
  weekly_hours NUMERIC,                   -- horas a la semana
  default_schedule TEXT,                  -- texto libre del PDF, ej "8:00 - 11:00 x 5"
  weekday_pattern JSONB DEFAULT '{}'::jsonb,
    -- {"lun":[{"from":"08:00","to":"11:00"}],"mar":[...],"mie":[...],"jue":[...],"vie":[...]}
  category TEXT NOT NULL,                 -- 'clinico'|'gestion'|'reunion'|'visita_radio'|'judicial'|'otro'
  is_monthly BOOLEAN DEFAULT FALSE,       -- true si la frecuencia es mensual (ej "primer lunes del mes")
  monthly_rule JSONB,                     -- {"week_of_month":1,"weekday":"lun"} cuando is_monthly=true
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5) Asignaciones titular/subrogante por bloque
CREATE TABLE IF NOT EXISTS public.sdm_program_assignments (
  id SERIAL PRIMARY KEY,
  block_template_id TEXT NOT NULL REFERENCES public.sdm_block_templates(id) ON DELETE CASCADE,
  doctor_id TEXT NOT NULL REFERENCES public.sdm_doctors(id) ON DELETE CASCADE,
  role_type TEXT NOT NULL CHECK (role_type IN ('titular','subrogante')),
  UNIQUE(block_template_id, doctor_id, role_type)
);

-- 6) Ausencias específicas
CREATE TABLE IF NOT EXISTS public.sdm_absences (
  id SERIAL PRIMARY KEY,
  doctor_id TEXT NOT NULL REFERENCES public.sdm_doctors(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('FL','P','A','DT','LM','CAP','PAS','OTRO')),
    -- FL=Feriado Legal, P=Postnatal, A=Administrativo, DT=Devolución Tiempo,
    -- LM=Licencia Médica, CAP=Capacitación, PAS=Pasantía, OTRO=Otro
  duration_hours NUMERIC,                 -- null = día completo
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(doctor_id, date, type)
);

-- 7) Agendas semanales guardadas
CREATE TABLE IF NOT EXISTS public.sdm_weekly_agendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL UNIQUE,        -- lunes de la semana
  status TEXT DEFAULT 'preliminar' CHECK (status IN ('preliminar','editada','final')),
  data JSONB NOT NULL,                    -- estructura completa de la agenda 5x8
  last_edited_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8) Bloqueos puntuales (no recurrentes) de una semana específica
CREATE TABLE IF NOT EXISTS public.sdm_oneoff_blocks (
  id SERIAL PRIMARY KEY,
  week_start DATE NOT NULL,
  date DATE NOT NULL,
  doctor_id TEXT REFERENCES public.sdm_doctors(id) ON DELETE SET NULL,
  time_from TIME,
  time_to TIME,
  description TEXT NOT NULL,
  category TEXT,                          -- ver categorías de sdm_block_templates
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ÍNDICES ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_sdm_shift_calendar_date ON public.sdm_shift_calendar(date);
CREATE INDEX IF NOT EXISTS idx_sdm_absences_date ON public.sdm_absences(date);
CREATE INDEX IF NOT EXISTS idx_sdm_oneoff_blocks_week ON public.sdm_oneoff_blocks(week_start);

-- ─── RLS — acceso solo a usuarios autenticados ───────────────────────────────
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'sdm_doctors','sdm_shift_rotation','sdm_shift_calendar',
    'sdm_block_templates','sdm_program_assignments','sdm_absences',
    'sdm_weekly_agendas','sdm_oneoff_blocks'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "%s read all" ON public.%I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "%s write all" ON public.%I', tbl, tbl);
    EXECUTE format($f$CREATE POLICY "%s read all" ON public.%I FOR SELECT USING (true)$f$, tbl, tbl);
    EXECUTE format($f$CREATE POLICY "%s write all" ON public.%I FOR ALL USING (true) WITH CHECK (true)$f$, tbl, tbl);
  END LOOP;
END $$;
