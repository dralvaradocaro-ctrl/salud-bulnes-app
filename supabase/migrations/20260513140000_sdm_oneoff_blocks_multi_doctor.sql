-- Soporte multi-médico para bloqueos puntuales.
-- Antes: sdm_oneoff_blocks.doctor_id text (un solo médico).
-- Ahora: sdm_oneoff_blocks.doctor_ids text[] (lista; vacío = sin asignar).
-- doctor_id queda como columna deprecada (NULLable) por compatibilidad con
-- queries externas durante la transición; el front no la lee.

ALTER TABLE sdm_oneoff_blocks
  ADD COLUMN IF NOT EXISTS doctor_ids text[] NOT NULL DEFAULT '{}';

UPDATE sdm_oneoff_blocks
  SET doctor_ids = ARRAY[doctor_id]
  WHERE doctor_id IS NOT NULL
    AND (doctor_ids IS NULL OR cardinality(doctor_ids) = 0);

CREATE INDEX IF NOT EXISTS sdm_oneoff_blocks_doctor_ids_gin
  ON sdm_oneoff_blocks USING GIN (doctor_ids);
