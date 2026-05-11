-- ════════════════════════════════════════════════════════════════════════════
-- SDM RLS estricto — escritura requiere header x-sdm-write-secret.
--
-- Lectura: pública (cualquiera con la anon key puede SELECT, igual que antes).
-- Escritura (INSERT/UPDATE/DELETE): solo si la request trae el header
-- "x-sdm-write-secret" con el valor que coincide con la configuración
-- almacenada (custom GUC app.sdm_write_secret).
--
-- Configurar el secret una vez:
--   ALTER DATABASE postgres SET app.sdm_write_secret = '<tu_secret_aqui>';
--   SELECT pg_reload_conf();
--
-- Después, en el cliente JS:
--   createClient(url, anonKey, { global: { headers: { 'x-sdm-write-secret': '<...>' } } });
--
-- Para revertir (volver a write-all): re-aplicar la policy "*  write all" antigua.
-- ════════════════════════════════════════════════════════════════════════════

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

    -- Limpiar policies antiguas
    EXECUTE format('DROP POLICY IF EXISTS "%s read all" ON public.%I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "%s write all" ON public.%I', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS "%s write with secret" ON public.%I', tbl, tbl);

    -- Lectura pública
    EXECUTE format($f$CREATE POLICY "%s read all" ON public.%I FOR SELECT USING (true)$f$, tbl, tbl);

    -- Escritura con header secret
    EXECUTE format($f$
      CREATE POLICY "%s write with secret" ON public.%I FOR ALL
      USING (
        current_setting('app.sdm_write_secret', true) IS NOT NULL
        AND current_setting('app.sdm_write_secret', true) <> ''
        AND current_setting('request.headers', true)::jsonb ->> 'x-sdm-write-secret' = current_setting('app.sdm_write_secret', true)
      )
      WITH CHECK (
        current_setting('app.sdm_write_secret', true) IS NOT NULL
        AND current_setting('app.sdm_write_secret', true) <> ''
        AND current_setting('request.headers', true)::jsonb ->> 'x-sdm-write-secret' = current_setting('app.sdm_write_secret', true)
      )
    $f$, tbl, tbl);
  END LOOP;
END $$;
