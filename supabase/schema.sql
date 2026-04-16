-- ============================================================
-- SCHEMA para Guía Médica Hospital Bulnes
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

CREATE TABLE IF NOT EXISTS categories (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  name        TEXT NOT NULL,
  slug        TEXT,
  description TEXT,
  icon        TEXT,
  color       TEXT,
  "order"     INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS topics (
  id                      TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  name                    TEXT NOT NULL,
  category_id             TEXT,
  subcategory             TEXT,
  status                  TEXT DEFAULT 'draft',
  title                   TEXT,
  description             TEXT,
  tags                    TEXT[],
  "order"                 INTEGER DEFAULT 0,
  authors                 JSONB DEFAULT '[]',
  published_date          TEXT,
  last_updated            TEXT,
  layout_mode             TEXT DEFAULT 'auto',
  tipo_contenido          TEXT[],
  clasificacion_ges       TEXT,
  has_local_protocol      BOOLEAN DEFAULT FALSE,
  content_blocks          JSONB DEFAULT '[]',
  related_topics          JSONB DEFAULT '[]',
  related_tools           JSONB DEFAULT '[]',
  clinical_summary        TEXT,
  diagnostic_orientation  TEXT,
  complementary_studies   TEXT,
  initial_treatment       TEXT,
  guarantee_days          INTEGER,
  guarantee_details       TEXT,
  protocol_code           TEXT,
  protocol_edition        TEXT,
  protocol_date           TEXT,
  protocol_validity       TEXT,
  protocol_authors        JSONB DEFAULT '[]',
  protocol_objective      TEXT,
  protocol_participants   TEXT[],
  protocol_flowchart      JSONB DEFAULT '[]',
  protocol_algorithm      JSONB DEFAULT '[]',
  protocol_medications    JSONB DEFAULT '[]',
  protocol_file_url       TEXT
);

CREATE TABLE IF NOT EXISTS clinical_tools (
  id                    TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  name                  TEXT NOT NULL,
  category_id           TEXT,
  specialty             TEXT,
  type                  TEXT DEFAULT 'calculator',
  status                TEXT DEFAULT 'draft',
  version               TEXT,
  description           TEXT,
  content               TEXT,
  input_schema          JSONB DEFAULT '[]',
  calculation_logic     TEXT,
  result_interpretation JSONB DEFAULT '[]',
  interpretation        TEXT,
  reference_url         TEXT,
  show_patient_info     BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS flow_steps (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  topic_id            TEXT,
  step_number         INTEGER,
  title               TEXT NOT NULL,
  responsible         TEXT,
  description         TEXT,
  time_limit          TEXT,
  location            TEXT,
  derivation_options  JSONB DEFAULT '[]',
  notes               TEXT
);

CREATE TABLE IF NOT EXISTS request_templates (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  name                TEXT NOT NULL,
  category_id         TEXT,
  type                TEXT,
  template_content    TEXT,
  required_fields     JSONB DEFAULT '[]',
  destination_emails  TEXT[],
  instructions        TEXT
);

CREATE TABLE IF NOT EXISTS topic_versions (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  topic_id            TEXT,
  version_number      INTEGER,
  changed_by          TEXT,
  change_description  TEXT,
  content_snapshot    JSONB
);

-- ============================================================
-- Row Level Security: permitir todo (app interna)
-- ============================================================
ALTER TABLE categories        ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics             ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_tools    ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_steps         ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_versions    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all" ON categories        FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON topics             FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON clinical_tools    FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON flow_steps         FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON request_templates FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON topic_versions    FOR ALL TO anon USING (true) WITH CHECK (true);

-- ============================================================
-- Storage bucket para archivos subidos
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
  VALUES ('files', 'files', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "allow_all_files" ON storage.objects
  FOR ALL TO anon
  USING (bucket_id = 'files')
  WITH CHECK (bucket_id = 'files');
