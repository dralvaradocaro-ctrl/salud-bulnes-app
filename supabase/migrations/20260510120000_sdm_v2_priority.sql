-- ════════════════════════════════════════════════════════════════════════════
-- SDM v2: agregar columna `priority` para ordenar múltiples subrogantes
-- Aplicar manualmente desde Supabase Studio → SQL Editor
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE public.sdm_program_assignments
  ADD COLUMN IF NOT EXISTS priority INT DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_sdm_assignments_block_role_prio
  ON public.sdm_program_assignments (block_template_id, role_type, priority);
