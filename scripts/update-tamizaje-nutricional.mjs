/**
 * Actualiza el topic "Protocolo de Tamizaje y Estratificación del Riesgo Nutricional"
 * con los metadatos reales del protocolo HCSFB 163 (Febrero 2026) y activa la señal
 * de protocolo local.
 *
 * Uso:  node scripts/update-tamizaje-nutricional.mjs
 *       node scripts/update-tamizaje-nutricional.mjs --apply   (escribe en BD)
 */
import { createClient } from '@supabase/supabase-js';

const TOPIC_ID  = '699c845c6050f253dd81526f';
const APPLY     = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

const PATCH = {
  // Señal de protocolo local
  has_local_protocol: true,
  status: 'published',

  // Metadatos del protocolo HCSFB 163
  protocol_code: 'HCSFB 163',
  protocol_edition: 'Primera',
  protocol_date: 'Febrero 2026',
  protocol_validity: 'Febrero 2031',
  protocol_objective:
    'Establecer un proceso estandarizado, escalonado y con plazos definidos para el tamizaje y evaluación nutricional de pacientes hospitalizados en el Servicio de Medicina del Hospital de Bulnes.',
  protocol_participants: [
    'TENS / Enfermería',
    'Enfermero/a a cargo',
    'Equipo Médico',
    'Equipo de Nutrición',
  ],
  protocol_authors: [
    { name: 'Dr. Fernando Alvarado Caro',    role: 'Elaborador — Médico Cirujano EDF, Subrogante Servicio Medicina' },
    { name: 'Dr. Rodrigo Enríquez Heredia',   role: 'Elaborador — Médico Cirujano EDF' },
    { name: 'Nutr. Daniela Yáñez Navarrete',  role: 'Elaboradora — Nutricionista Jefe SAN/SEDILE' },
    { name: 'Dr. Ignacio San Martín P.',       role: 'Revisor — Médico Cirujano EDF, Jefe Servicio Medicina' },
    { name: 'Dr. Rodrigo Sandoval C.',         role: 'Revisor — Médico Internista, Hospital Herminda Martín' },
    { name: 'Dra. Micaela Fasani Montagna',    role: 'Aprobadora — Subdirectora Médica HCSFB' },
    { name: 'Dr. Álvaro Lagos Llanos',         role: 'Aprobador — Director HCSFB' },
  ],
  // URL del protocolo (dejar vacío hasta tener PDF alojado)
  protocol_file_url: '',

  // Tags para búsqueda
  tags: [
    'NRS-2002',
    'Tamizaje nutricional',
    'Riesgo nutricional',
    'Hospitalizados',
    'Nutrición',
    'HCSFB 163',
    'Protocolos locales',
  ],

  last_updated: new Date().toISOString(),
};

console.log('--- PATCH a aplicar ---');
console.log(JSON.stringify(PATCH, null, 2));

if (!APPLY) {
  console.log('\n⚠️  Modo dry-run. Agrega --apply para escribir en la base de datos.');
  process.exit(0);
}

const { error } = await supabase
  .from('topics')
  .update(PATCH)
  .eq('id', TOPIC_ID);

if (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

console.log('✅ Topic actualizado correctamente.');
