CREATE TABLE IF NOT EXISTS news_updates (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  published_at        TIMESTAMPTZ DEFAULT NOW(),
  title               TEXT NOT NULL,
  summary             TEXT,
  details             TEXT,
  area                TEXT DEFAULT 'general',
  type                TEXT DEFAULT 'actualizacion',
  status              TEXT DEFAULT 'published',
  topic_id            TEXT,
  link_url            TEXT,
  expires_at          TIMESTAMPTZ,
  created_by          TEXT
);

CREATE INDEX IF NOT EXISTS news_updates_published_at_idx ON news_updates (published_at DESC);
CREATE INDEX IF NOT EXISTS news_updates_area_idx ON news_updates (area);
CREATE INDEX IF NOT EXISTS news_updates_status_idx ON news_updates (status);

ALTER TABLE news_updates ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'news_updates'
      AND policyname = 'allow_all'
  ) THEN
    CREATE POLICY "allow_all" ON news_updates
      FOR ALL TO anon
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

INSERT INTO news_updates (
  title,
  summary,
  details,
  area,
  type,
  status,
  published_at,
  topic_id,
  link_url,
  created_by
)
SELECT
  'Ordinario MINSAL: Fimosis pediátrica',
  'Se incorporó la Orientación Técnica MINSAL 2025 para manejo de fimosis pediátrica.',
  'Disponible en Policlínico / Pediatría. Incluye evaluación clínica, manejo conservador con corticoide tópico, signos de alarma, criterios de derivación y contrarreferencia según Orientación Técnica MINSAL 2025.',
  'policlinico',
  'protocolo',
  'published',
  NOW(),
  topics.id,
  '/TopicDetail?id=' || topics.id,
  'admin'
FROM topics
WHERE topics.name ILIKE '%Fimosis%'
  AND NOT EXISTS (
    SELECT 1
    FROM news_updates
    WHERE title = 'Ordinario MINSAL: Fimosis pediátrica'
  )
ORDER BY topics.created_at DESC
LIMIT 1;

INSERT INTO news_updates (
  title,
  summary,
  details,
  area,
  type,
  status,
  published_at,
  created_by
)
SELECT
  'Reunión médica: inauguración de sala de agudos',
  'Revisión de criterios de ingreso y egreso para la nueva sala de agudos.',
  'Novedad administrativa/clínica para reunión médica: inauguración de sala de agudos, criterios de ingreso y criterios de egreso. Pendiente de consolidar como documento operativo si corresponde.',
  'hospitalizados',
  'operativo',
  'published',
  NOW(),
  'admin'
WHERE NOT EXISTS (
  SELECT 1
  FROM news_updates
  WHERE title = 'Reunión médica: inauguración de sala de agudos'
);

INSERT INTO news_updates (
  title,
  summary,
  details,
  area,
  type,
  status,
  published_at,
  topic_id,
  link_url,
  created_by
)
SELECT
  'Consultas frecuentes: atenciones de Policlínico',
  'Nueva tabla rápida con actividad REM, formulario y observaciones para registros frecuentes.',
  'Incluye cardiovascular, sala ERA/IRA, salud mental, niño sano, morbilidad, recetas, paliativos, dependencia severa, TACO, prenatal, climaterio, telemedicina y ayudas de memoria. Recordatorio: no usar actividades que inicien con AG_ ni opciones que indiquen "No contabilizada en REM".',
  'policlinico',
  'consulta',
  'published',
  NOW(),
  topics.id,
  '/TopicDetail?id=' || topics.id,
  'admin'
FROM topics
WHERE topics.name = 'Atenciones Policlínico HCSF Bulnes'
  AND NOT EXISTS (
    SELECT 1
    FROM news_updates
    WHERE title = 'Consultas frecuentes: atenciones de Policlínico'
  )
ORDER BY topics.created_at DESC
LIMIT 1;
