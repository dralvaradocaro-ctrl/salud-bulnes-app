-- Agenda Diaria: una fila por día con el estado completo del reparto.
-- Se nutre de la agenda semanal vigente. El campo `data` (JSONB) guarda:
--   bedStates, telemed, internos, doctorSeed, bedOverrides,
--   supervisorOverrides y `assigned` (mapa cama→médico/interno) que permite
--   la CONTINUIDAD: la agenda del día siguiente parte de la de hoy para que
--   cada médico siga a sus pacientes y los internos conserven sus camas.

CREATE TABLE IF NOT EXISTS public.sdm_daily_agendas (
  date DATE PRIMARY KEY,
  data JSONB NOT NULL,
  last_edited_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sdm_daily_agendas_date ON public.sdm_daily_agendas(date);

-- RLS — mismo patrón que el resto de tablas SDM (read all / write all).
DO $$
BEGIN
  EXECUTE 'ALTER TABLE public.sdm_daily_agendas ENABLE ROW LEVEL SECURITY';
  EXECUTE 'DROP POLICY IF EXISTS "sdm_daily_agendas read all" ON public.sdm_daily_agendas';
  EXECUTE 'DROP POLICY IF EXISTS "sdm_daily_agendas write all" ON public.sdm_daily_agendas';
  EXECUTE 'CREATE POLICY "sdm_daily_agendas read all" ON public.sdm_daily_agendas FOR SELECT USING (true)';
  EXECUTE 'CREATE POLICY "sdm_daily_agendas write all" ON public.sdm_daily_agendas FOR ALL USING (true) WITH CHECK (true)';
END $$;
