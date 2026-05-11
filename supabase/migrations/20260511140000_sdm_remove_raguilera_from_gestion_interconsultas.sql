-- R. Aguilera ya no participa del pool de subrogancias de "Gestión Interconsultas".
-- Se elimina cualquier asignación (titular o subrogante) que lo vincule con ese bloque.

DELETE FROM public.sdm_program_assignments
WHERE doctor_id IN (
  SELECT id FROM public.sdm_doctors
  WHERE display_name ILIKE 'R%AGUILERA%' OR display_name ILIKE 'R. AGUILERA%'
)
AND block_template_id IN (
  SELECT id FROM public.sdm_block_templates
  WHERE name ILIKE '%interconsulta%' AND name ILIKE '%gesti%'
);
