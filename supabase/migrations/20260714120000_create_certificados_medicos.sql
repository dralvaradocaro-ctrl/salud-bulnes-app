-- Registro de certificados médicos emitidos, para poder verificarlos por su
-- código desde cualquier dispositivo (el QR ya lleva los datos, pero el código
-- suelto necesita una fuente central).
CREATE TABLE IF NOT EXISTS certificados_medicos (
  code            TEXT PRIMARY KEY,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  institucion     TEXT NOT NULL DEFAULT 'inalab',
  paciente        TEXT NOT NULL,
  rut             TEXT NOT NULL,
  fecha           DATE NOT NULL,
  texto           TEXT NOT NULL,
  medico          TEXT NOT NULL,
  medico_rut      TEXT NOT NULL,
  emitido_en      TEXT
);

CREATE INDEX IF NOT EXISTS certificados_medicos_created_at_idx
  ON certificados_medicos (created_at DESC);

ALTER TABLE certificados_medicos ENABLE ROW LEVEL SECURITY;

-- Lectura pública: cualquiera con el código puede verificar el certificado.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'certificados_medicos'
      AND policyname = 'certificados_select_publico'
  ) THEN
    CREATE POLICY "certificados_select_publico" ON certificados_medicos
      FOR SELECT TO anon
      USING (true);
  END IF;
END $$;

-- Alta pública: la app emite con la clave anon. No se conceden UPDATE ni
-- DELETE, de modo que un certificado emitido no se puede alterar ni borrar
-- desde el cliente.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'certificados_medicos'
      AND policyname = 'certificados_insert_publico'
  ) THEN
    CREATE POLICY "certificados_insert_publico" ON certificados_medicos
      FOR INSERT TO anon
      WITH CHECK (true);
  END IF;
END $$;
