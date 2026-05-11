-- ════════════════════════════════════════════════════════════════════════════
-- SDM v3 — Cupos de visita, feriados, especialistas externos y tipo G en ausencias.
--
-- Cambios:
--   1. sdm_doctors:        + is_urgentologist (Rubilar excluido de bloqueos no-urg)
--   2. sdm_program_assignments: + capacity (cupos en VISITA; Rubilar fijo en 3)
--   3. sdm_shift_calendar: + is_holiday y + external_visitors JSONB
--   4. sdm_absences.type:  agrega 'G' (Gerencia/Gestión)
-- ════════════════════════════════════════════════════════════════════════════

-- 1) Flag de urgenciólogo en sdm_doctors
ALTER TABLE public.sdm_doctors
  ADD COLUMN IF NOT EXISTS is_urgentologist BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.sdm_doctors.is_urgentologist IS
  'Si true, el médico es urgenciólogo: solo participa de visita con cupo fijo y NO entra al pool de otros bloqueos.';

-- 2) Capacidad (cupos) en asignaciones de programa
ALTER TABLE public.sdm_program_assignments
  ADD COLUMN IF NOT EXISTS capacity INT;

COMMENT ON COLUMN public.sdm_program_assignments.capacity IS
  'Cupos asignados al médico en este bloqueo. NULL = capacidad estándar (6 visitas, no se muestra sufijo).';

-- 3) Feriado y visitantes externos en sdm_shift_calendar
ALTER TABLE public.sdm_shift_calendar
  ADD COLUMN IF NOT EXISTS is_holiday BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS external_visitors JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.sdm_shift_calendar.is_holiday IS
  'Día feriado: el render muestra solo Turnos + Posturno + Ausencias; resto vacío; BLOQUEOS muestra "FERIADO".';

COMMENT ON COLUMN public.sdm_shift_calendar.external_visitors IS
  'Especialistas externos que visitan ese día. Formato: [{"name":"Dra. Rissi","specialty":"Pediatría"}].';

-- 4) Tipo G (Gerencia/Gestión) en ausencias
ALTER TABLE public.sdm_absences
  DROP CONSTRAINT IF EXISTS sdm_absences_type_check;

ALTER TABLE public.sdm_absences
  ADD CONSTRAINT sdm_absences_type_check
  CHECK (type IN ('FL','P','A','DT','LM','CAP','PAS','G','OTRO'));

-- 5) Marcar Rubilar como urgenciólogo + capacidad 3 en visita (si existen los registros)
UPDATE public.sdm_doctors SET is_urgentologist = TRUE WHERE id = 'rubilar';

-- Capacidad fija de Rubilar en bloqueo "visita_medica" si está asignado
UPDATE public.sdm_program_assignments
SET capacity = 3
WHERE doctor_id = 'rubilar'
  AND block_template_id IN (SELECT id FROM public.sdm_block_templates WHERE id LIKE '%visita%');
