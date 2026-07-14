-- Aviso diario de medicamentos por Web Push + privacidad de patient_notifications.

-- 1) Idempotencia del aviso diario: fecha del último envío por paciente.
ALTER TABLE public.patient_notifications
  ADD COLUMN IF NOT EXISTS last_daily_sent DATE;

-- 2) Privacidad: los datos de contacto dejan de ser legibles con la clave
--    anónima. Se bloquea a nivel de columnas para no romper el portal, que
--    sólo necesita leer id/push_enabled para su flujo de guardado (los
--    INSERT/UPDATE del propio paciente siguen funcionando igual).
REVOKE SELECT ON public.patient_notifications FROM anon;
GRANT SELECT (id, patient_id, push_enabled, last_daily_sent, created_at, updated_at)
  ON public.patient_notifications TO anon;

-- 3) Cron diario que invoca la Edge Function de envío.
--    11:00 UTC = 08:00 en Chile en horario de verano (UTC-3) y 07:00 en
--    invierno (UTC-4). La función además sólo actúa entre 06:00 y 11:59
--    hora de Chile y es idempotente por día.
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'enviar-avisos-diarios-medicamentos',
  '0 11 * * *',
  $$
  SELECT net.http_post(
    url := 'https://gcuevpxondfepbowvyqa.supabase.co/functions/v1/enviar-avisos-diarios',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
