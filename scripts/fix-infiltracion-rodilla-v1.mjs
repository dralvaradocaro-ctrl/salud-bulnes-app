/**
 * Corrige la técnica de Infiltración de Rodilla según el PDF HCSFB 151:
 *  - Posición: sentado con rodilla a 90° (no decúbito supino)
 *  - Abordaje principal: anterolateral 18G/20G (no suprapatelar 21G)
 *  - Fármaco: Betametasona Rapilento 3 mL (no formulación previa)
 *  - Agrega: KOOS-PS/WOMAC, seguimiento telefónico, cupos programa
 *  - Corrige autores: Dr. Fernando Alvarado Caro era co-elaborador
 *
 * Uso:  node scripts/fix-infiltracion-rodilla-v1.mjs
 *       node scripts/fix-infiltracion-rodilla-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');
const ID = '5bb27846-3bb2-4833-a8f5-1774118b88d7';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

const AUTHORS = {
  elaboradores: ['Dr. Rodrigo Enríquez Heredia', 'Dra. Daniella Sbarbaro Arias', 'Dr. Fernando Alvarado Caro'],
  revisores:    ['Dra. Micaela Fasani Montagna'],
  aprobadores:  ['Dr. Álvaro Lagos'],
};

const BLOCKS = [
  {
    id:    'infil-indicaciones',
    type:  'criteria',
    color: 'blue',
    order: 1,
    title: 'Criterios de Selección — Programa Gonartrosis HCSFB',
    content: 'Cupos limitados: 12 pacientes por cohorte · 2 cohortes (24 total) · orden de derivación',
    items: [
      '━━━ INCLUSIÓN ━━━',
      'Gonartrosis con mala respuesta al tratamiento farmacológico',
      'Dolor moderado-severo (EVA ≥ 4) a pesar de AINES + kinesiterapia',
      'Candidato o no candidato a artroplastia (ambos elegibles)',
      'Consentimiento informado otorgado',
      '━━━ EXCLUSIÓN ━━━',
      'Diabetes mal compensada (HbA1c > 7,5%)',
      'Infección de partes blandas en zona a puncionar',
      'Artroplastia presente en la articulación',
      'Embarazo',
      'Enfermedad renal crónica estadio 3b, 4 o 5',
      'Osteomielitis adyacente',
      'Paciente anticoagulado o con coagulopatía',
      'Paciente que no pueda dar consentimiento informado',
    ],
    layout_position: 'main',
  },
  {
    id:    'infil-materiales',
    type:  'criteria',
    color: 'gray',
    order: 2,
    title: 'Materiales Necesarios',
    content: 'Preparar box de procedimientos antes de citar al paciente',
    items: [
      'Guantes estériles',
      'Clorhexidina + alcohol + tórulas',
      'Jeringas 10 mL',
      'Agujas 18G y 21G',
      'Betametasona Rapilento (ampolla 3 mL)',
      'Lidocaína (ampolla)',
      'Gasa estéril + tela adhesiva',
      'Tijeras',
      'Formulario consentimiento informado (digitalizar en DOCLID)',
    ],
    layout_position: 'main',
  },
  {
    id:    'infil-tecnica',
    type:  'flowchart',
    color: 'green',
    order: 3,
    title: 'Técnica de Infiltración — Abordaje Anterolateral (Principal)',
    content: 'Abordaje alternativo suprapatelar lateral si características del paciente o experiencia del médico lo requieren',
    details: [
      '1. Consentimiento informado firmado → digitalizar en DOCLID',
      '2. Aplicar encuesta KOOS-PS y WOMAC antes del procedimiento',
      '3. Posición: paciente sentado en camilla, rodilla a 90° con extremidad colgando (sin soporte)',
      '4. Identificar referencias anatómicas: borde inferior patela · borde lateral tendón patelar · superior al platillo tibial · distal al cóndilo femoral',
      '5. Preparación estéril: limpiar zona con clorhexidina → retirar con alcohol',
      '6. Anestesia local: Lidocaína sobre sitio de entrada + en tejidos profundos a lo largo de la trayectoria (sin ingresar al espacio articular)',
      '7. Aguja 18G o 20G en jeringa 10 mL precargada con Betametasona Rapilento 3 mL',
      '~Dirección: posteromedial con leve inclinación distal (slope de la tibia)',
      '8. Aspirar para confirmar cavidad articular (fluido sinovial o sin resistencia)',
      '9. Inyectar lentamente — debe fluir sin resistencia; si hay resistencia, reposicionar',
      '10. Retirar aguja → movilizar rodilla en toda su amplitud para distribuir el corticoide',
      '11. Cubrir con gasa estéril + tela adhesiva',
      '━━━ ABORDAJE ALTERNATIVO — Suprapatelar Lateral ━━━',
      'Posición: decúbito supino con leve flexión de rodilla',
      '~ Trazar línea horizontal 1 dedo sobre polo superior de rótula',
      '~ Trazar línea vertical en borde posterior',
      '~ Insertar aguja perpendicular en punto de intersección e inyectar',
    ],
    layout_position: 'main',
  },
  {
    id:    'infil-seguimiento',
    type:  'flowchart',
    color: 'amber',
    order: 4,
    title: 'Post-Procedimiento y Seguimiento',
    content: 'El médico jefe del programa artrosis supervisa el seguimiento',
    details: [
      'Indicaciones inmediatas:',
      '~ Reposo relativo 2 semanas',
      '~ Vendaje compresivo de rodilla',
      '~ AINES si dolor post-procedimiento',
      '~ Crioterapia o fisioterapia si necesario',
      'Seguimiento a 2 semanas: contacto telefónico por médico jefe del programa',
      '~ Reaplicar encuestas KOOS-PS y WOMAC por teléfono',
      '~ Evaluar impacto en dolor, rigidez y capacidad funcional',
      'Repetición: si buena respuesta, citar en 4 meses para nueva infiltración',
      'Alta del programa: si respuesta insuficiente o progresión → derivar a traumatología',
      'Registro: Rayen (atención y procedimiento) + DOCLID (consentimiento firmado)',
    ],
    layout_position: 'main',
  },
  {
    id:    'infil-complicaciones',
    type:  'criteria',
    color: 'red',
    order: 5,
    title: 'Complicaciones y Manejo',
    content: 'Señales de alarma y conducta ante complicaciones post-infiltración',
    items: [
      'Artritis séptica: fiebre, eritema, calor, derrame → derivación urgencias inmediata',
      'Flare post-inyección: dolor transitorio 12–24h → AINES + hielo; consultar si persiste > 72h',
      'Hiperglicemia en diabéticos: controlar glicemia 24–72h post-procedimiento',
      'Atrofia cutánea: evitar inyección subcutánea; confirmar acceso intraarticular',
      'Despigmentación de piel: efecto conocido, informar al paciente en el consentimiento',
      'Sensación de calor e insomnio transitorio: esperable, autolimitado',
    ],
    layout_position: 'main',
  },
  {
    id:    'infil-mermaid',
    type:  'mermaid',
    order: 6,
    title: 'Algoritmo HCSFB 151 — Programa Gonartrosis',
    content: `flowchart TD
    A([Médico detecta gonartrosis\\ncon mala respuesta a tratamiento]) --> B{¿Criterios\\nde exclusión?}
    B -->|Sí| C([Continuar AINES + kinesiterapia\\nDerivación traumatología si procede])
    B -->|No| D[Paciente interesado\\nDerivación al médico jefe del programa]
    D --> E{¿Cupos\\ndisponibles?}
    E -->|No| F([Lista de espera\\npróxima cohorte])
    E -->|Sí — máx 24 pacientes| G[SOME agenda hora\\nBox procedimientos]
    G --> H[Consentimiento informado\\nKOOS-PS + WOMAC pre]
    H --> I[Técnica anterolateral\\nBetametasona Rapilento 3 mL]
    I --> J[Reposo 2 sem · vendaje\\nAINES si dolor]
    J --> K[Seguimiento telefónico 2 sem\\nKOOS-PS + WOMAC post]
    K --> L{¿Buena\\nrespuesta?}
    L -->|Sí| M[Citar en 4 meses\\nnueva cohorte]
    L -->|No| N([Alta del programa\\nDerivar traumatología])`,
    layout_position: 'main',
  },
];

// ─── MAIN ────────────────────────────────────────────────────────────────────

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  FIX INFILTRACIÓN RODILLA v1 — ${APPLY ? '⚡ APPLY MODE' : '🔍 DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════\n`);

const { data: topic, error } = await supabase
  .from('topics')
  .select('content_blocks, authors')
  .eq('id', ID)
  .single();

if (error) { console.error('❌ Fetch error:', error.message); process.exit(1); }

console.log(`Bloques actuales: ${(topic.content_blocks||[]).length}  →  nuevos: ${BLOCKS.length}`);
console.log(`Autores actuales: ${JSON.stringify(topic.authors)}`);
console.log(`Autores nuevos:   ${JSON.stringify(AUTHORS)}`);
console.log('\nCambios principales:');
console.log('  - Posición corregida: sentado rodilla 90° (era decúbito supino)');
console.log('  - Aguja corregida: 18G/20G anterolateral (era 21G suprapatelar)');
console.log('  - Fármaco: Betametasona Rapilento 3 mL (era formulación incorrecta)');
console.log('  - Agrega: KOOS-PS/WOMAC, seguimiento telefónico, cupos programa');
console.log('  - Agrega: Dr. Fernando Alvarado Caro como co-elaborador');

if (!APPLY) {
  console.log('\n⚠️  Modo dry-run. Agrega --apply para escribir en la base de datos.');
  process.exit(0);
}

const { error: e } = await supabase
  .from('topics')
  .update({ content_blocks: BLOCKS, authors: AUTHORS })
  .eq('id', ID);

if (e) console.error('❌ Error:', e.message);
else   console.log('\n✅ Infiltración Rodilla corregida.');
