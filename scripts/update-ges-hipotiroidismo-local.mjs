/**
 * Integra el Protocolo Local HCSFB 98 (Hipotiroidismo en Policlínico APS)
 * dentro del tema GES existente de Hipotiroidismo.
 *
 * Uso:  node scripts/update-ges-hipotiroidismo-local.mjs
 *       node scripts/update-ges-hipotiroidismo-local.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const TOPIC_ID = '696efcff77924d3a78533dce';
const APPLY    = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

// Nuevos bloques locales a AGREGAR (se suman a los 4 bloques GES existentes)
const NEW_LOCAL_BLOCKS = [
  {
    id: 'hipo-local-tamizaje',
    type: 'criteria',
    color: 'blue',
    order: 10,
    title: 'Tamizaje Local — Grupos a Evaluar (HCSFB 98)',
    content: 'Población a la que se debe solicitar perfil tiroideo según protocolo local del HCSFB',
    items: [
      'Antecedentes de cirugía tiroidea, terapia con radioyodo o radioterapia cervical',
      'Disfunción tiroidea previa conocida o anticuerpos antitiroideos positivos',
      'Hipercolesterolemia · IMC > 30 · Infertilidad',
      'Enfermedades autoinmunes: DM1, Sjögren, artritis reumatoide, Addison, celíaca, vitíligo',
      'Uso crónico de amiodarona o litio',
      'Menores de 65 años con depresión confirmada',
      'Mayores de 65 años con sospecha de depresión o trastornos cognitivos',
      'Síndrome de Down o Turner · Embarazadas',
    ],
    layout_position: 'main',
  },
  {
    id: 'hipo-local-laboratorio',
    type: 'text',
    color: 'blue',
    order: 11,
    title: 'Valores de Referencia — Laboratorio HCSFB',
    content: 'Rangos normales utilizados en el laboratorio del Hospital Comunitario de Salud Familiar de Bulnes',
    details: [
      'TSH adultos: 0.38–5.33 µUI/mL',
      'TSH gestantes 1er trimestre: 0.05–3.70 µUI/mL',
      'TSH gestantes 2do trimestre: 0.31–4.35 µUI/mL',
      'TSH gestantes 3er trimestre: 0.41–5.18 µUI/mL',
      'T4 libre: 0.6–1.2 ng/dL',
      'Nota: muestra debe tomarse en ayunas y antes de la dosis de levotiroxina',
    ],
    layout_position: 'main',
  },
  {
    id: 'hipo-local-dosificacion',
    type: 'flowchart',
    color: 'green',
    order: 12,
    title: 'Dosificación de Levotiroxina — Protocolo Local HCSFB',
    content: 'Tabla de dosis iniciales según nivel de TSH (adultos sin cardiopatía)',
    details: [
      'TSH 5–10 µUI/mL (subclínico leve): observar; tratar si AcTPO+ o sintomático',
      'TSH 10–20 µUI/mL: Levotiroxina 25–50 µg/día (inicio), ajustar a 50–100 µg/día',
      'TSH > 20 µUI/mL: Levotiroxina 1.0–1.6 µg/kg/día según edad y peso',
      'Adultos mayores ≥ 75 años: iniciar con 12.5–25 µg/día y titular lentamente',
      'No iniciar tratamiento si TSH < 10 en adultos mayores ≥ 75 años',
      'Tomar en ayunas, separado de calcio, hierro, omeprazol, estatinas y anticonvulsivantes',
    ],
    layout_position: 'main',
  },
  {
    id: 'hipo-local-seguimiento',
    type: 'flowchart',
    color: 'amber',
    order: 13,
    title: 'Seguimiento en Policlínico HCSFB — Flujograma Local',
    content: 'Periodicidad de controles y roles del equipo multidisciplinario (médico + químico-farmacéutico)',
    details: [
      'Inicio de tratamiento: TSH de control en 6–8 semanas + AcTPO + perfil lipídico',
      'Ajuste de dosis: ±25–50 µg (o ±12.5–25 µg en adultos mayores), nuevo control en 6–8 semanas',
      'Paciente controlado (2 TSH en rango): control anual con médico',
      'Controles alternados: médico y químico-farmacéutico cada 6 meses',
      'QF deja orden interna para TSH y perfil lipídico para siguiente control médico',
      'Después de 3 ajustes de dosis sin TSH en rango: derivar a Endocrinología',
      'Meta TSH: 1–3 µUI/mL en adultos, 3–6 µUI/mL en adultos mayores',
    ],
    layout_position: 'main',
  },
  {
    id: 'hipo-local-derivacion',
    type: 'criteria',
    color: 'red',
    order: 14,
    title: 'Criterios de Derivación a Endocrinología — HCSFB',
    content: 'Indicaciones de derivación a nivel secundario según protocolo local HCSFB 98',
    items: [
      'Antecedentes de cáncer tiroideo',
      'Cardiopatía coronaria o insuficiencia cardíaca conocida asociada',
      'Nódulo tiroideo palpable o bocio persistente',
      'TSH elevada en 2 controles pese a terapia bien indicada',
      'Sospecha de hipotiroidismo severo',
      'Sospecha de hipotiroidismo secundario (TSH normal o baja con T4L baja)',
      'Uso de amiodarona o litio',
      'Embarazo (con o sin tratamiento previo)',
    ],
    layout_position: 'main',
  },
];

// Metadata del protocolo local HCSFB 98
const LOCAL_PROTOCOL_META = {
  protocol_code:      'HCSFB 98',
  protocol_edition:   'Primera',
  protocol_date:      'Marzo 2023',
  protocol_validity:  'Marzo 2027',
  protocol_objective: 'Establecer una guía de referencia para la atención del hipotiroidismo primario en el Policlínico APS del HCSFB, mejorando la pesquisa, previniendo complicaciones y garantizando atención oportuna y de calidad.',
  protocol_file_url:  '',
  protocol_authors: [
    { name: 'Dra. Micaela Fasani Montagna', role: 'Elaboradora — Médico Cirujano EDF HCSFB' },
    { name: 'Dr. Maicol Candia Sandoval',   role: 'Revisor — Subdirector Médico HCSFB' },
    { name: 'TM Eva López Ferrada',          role: 'Revisora — D.T. Laboratorio Clínico HCSFB' },
    { name: 'Dr. Felipe Sancho Tapia',       role: 'Aprobador — Subdirector Médico HCSFB' },
    { name: 'Dr. Álvaro Lagos Llanos',       role: 'Aprobador — Director HCSFB' },
  ],
  last_updated: new Date().toISOString(),
};

// --- Main ---
const { data: topic, error: fetchErr } = await supabase
  .from('topics')
  .select('content_blocks')
  .eq('id', TOPIC_ID)
  .single();

if (fetchErr) { console.error('Fetch error:', fetchErr.message); process.exit(1); }

const existingBlocks = topic.content_blocks || [];
const mergedBlocks   = [...existingBlocks, ...NEW_LOCAL_BLOCKS];

console.log(`\nBloques existentes: ${existingBlocks.length}`);
console.log(`Bloques locales nuevos: ${NEW_LOCAL_BLOCKS.length}`);
console.log(`Total tras merge: ${mergedBlocks.length}`);
console.log('\nMeta protocolo local:', JSON.stringify(LOCAL_PROTOCOL_META, null, 2));

if (!APPLY) {
  console.log('\n⚠️  Modo dry-run. Agrega --apply para escribir en la base de datos.');
  process.exit(0);
}

const { error } = await supabase
  .from('topics')
  .update({ ...LOCAL_PROTOCOL_META, content_blocks: mergedBlocks })
  .eq('id', TOPIC_ID);

if (error) { console.error('❌ Error:', error.message); process.exit(1); }
console.log('\n✅ Hipotiroidismo GES actualizado con protocolo local HCSFB 98.');
