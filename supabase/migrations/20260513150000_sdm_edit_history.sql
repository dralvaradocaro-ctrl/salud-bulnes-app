-- Historial de modificaciones de la agenda SDM.
-- Cada fila representa un evento "guardar agenda" disparado por un usuario
-- identificado por el selector del front (localStorage), con un resumen
-- automatico de los cambios respecto del estado previamente guardado.

CREATE TABLE IF NOT EXISTS sdm_edit_history (
  id          BIGSERIAL PRIMARY KEY,
  week_start  DATE NOT NULL,
  editor_name TEXT NOT NULL,
  action      TEXT NOT NULL DEFAULT 'save_agenda',
  summary     TEXT NOT NULL,
  details     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sdm_edit_history_week_start_idx ON sdm_edit_history (week_start, created_at DESC);
CREATE INDEX IF NOT EXISTS sdm_edit_history_created_idx    ON sdm_edit_history (created_at DESC);

-- RLS: lectura publica, escritura con secret SDM (mismo patron que el resto).
ALTER TABLE sdm_edit_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "sdm_edit_history read all"          ON sdm_edit_history;
DROP POLICY IF EXISTS "sdm_edit_history write with secret" ON sdm_edit_history;

CREATE POLICY "sdm_edit_history read all" ON sdm_edit_history
  FOR SELECT USING (true);

CREATE POLICY "sdm_edit_history write with secret" ON sdm_edit_history
  FOR ALL
  USING (
    current_setting('app.sdm_write_secret', true) IS NOT NULL
    AND current_setting('app.sdm_write_secret', true) <> ''
    AND current_setting('request.headers', true)::jsonb ->> 'x-sdm-write-secret' = current_setting('app.sdm_write_secret', true)
  )
  WITH CHECK (
    current_setting('app.sdm_write_secret', true) IS NOT NULL
    AND current_setting('app.sdm_write_secret', true) <> ''
    AND current_setting('request.headers', true)::jsonb ->> 'x-sdm-write-secret' = current_setting('app.sdm_write_secret', true)
  );
