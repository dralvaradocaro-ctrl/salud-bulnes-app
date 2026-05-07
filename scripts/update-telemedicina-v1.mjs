/**
 * Telemedicina GES (HCSFB 138, 1ª Ed. Mayo 2025) — Reestructura en 3 pestañas.
 * Protocolo | Patologías GES | Flujogramas
 *
 * Uso:  node scripts/update-telemedicina-v1.mjs
 *       node scripts/update-telemedicina-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const TOPIC_ID = '58b11a9e-eb80-4af3-9eb7-7fa1f86631e2';
const APPLY    = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

const AUTHORS = [
  { name: 'Dra. Valentina Sandoval Valenzuela', role: 'Elaboradora — Médica EDF HCSFB' },
  { name: 'Dr. Roberto Aguilera Jaque',         role: 'Elaborador — Médico EDF HCSFB' },
  { name: 'Dra. Estefanía Acuña Brevis',        role: 'Elaboradora — Médica EDF HCSFB' },
  { name: 'EU Amanda Sepúlveda Vásquez',        role: 'Elaboradora — Enfermera Unidad Telemedicina HCSFB' },
  { name: 'Camila Montanares Ch.',              role: 'Elaboradora — Administrativa Unidad Telemedicina HCSFB' },
  { name: 'Dr. Felipe Sancho Tapia',            role: 'Revisor — Subdirector Médico HCSFB' },
  { name: 'Dr. Álvaro Lagos Llanos',            role: 'Aprobador — Director HCSFB' },
];

// ─────────────────────────────────────────────────────────────────────────────
// PESTAÑA 1: tele_protocolo — Flujo operativo y roles
// ─────────────────────────────────────────────────────────────────────────────
const PROTOCOLO_BLOCKS = [
  {
    id: 'tele-v1-flujo',
    tab: 'tele_protocolo',
    type: 'flowchart',
    color: 'blue',
    order: 1,
    title: 'Flujo Operativo por Modalidad',
    content: 'El médico debe identificar la modalidad correcta según la patología antes de emitir la IC.',
    details: [
      'Registrar consentimiento informado verbal en Rayen o ficha clínica',
      'Emitir IC en Rayen especificando tipo de Telemedicina y marcando casilla GES',
      '━━━ MODALIDAD SINCRÓNICA — UNITEL HCHM ━━━',
      'Enfermera de Telemedicina solicita cupo en Unitel HCHM',
      '~ Enviar calendario semanal a Jefa SOME y Subdirección médica por correo',
      '~ Neurología (Parkinson/Epilepsia): debe estar presente un facilitador médico',
      'Control presencial con especialista y Enfermera de Telemedicina',
      '~ Especialista entrega indicaciones y especifica vía de seguimiento',
      '━━━ MODALIDAD ASINCRÓNICA — TELEPROCESOS / HOSPITAL DIGITAL ━━━',
      'Médico regulador verifica criterios de inclusión (ver pestaña Patologías GES)',
      'Jefa SOME agenda control médico asincrónico abreviado',
      '~ Médico sube el caso a la plataforma correspondiente',
      'Equipo Telemedicina monitorea respuestas diariamente en Teleprocesos / Hospital Digital',
      '~ Con respuesta del especialista: avisar a Jefa SOME → entregar al paciente en control presencial o contacto telefónico',
      '━━━ EGRESO DE PLATAFORMA ━━━',
      'Teleprocesos → Médico egresa caso con causal 17 (Atención Telemedicina)',
      'Hospital Digital → Médico egresa con causal 19 en máximo 30 días + nueva IC en Rayen con folio de respuesta',
    ],
    layout_position: 'main',
  },
  {
    id: 'tele-v1-roles',
    tab: 'tele_protocolo',
    type: 'criteria',
    color: 'purple',
    order: 2,
    title: 'Roles del Equipo de Telemedicina',
    content: 'Responsabilidades por estamento en el flujo de atención.',
    items: [
      'Subdirector médico → cumplimiento del estamento médico y supervisión del proceso',
      'Encargado GES → supervisión del cumplimiento de garantías y plazos de oportunidad',
      'Médico tratante → emite IC en Rayen, registra consentimiento, sube caso en asincrónico',
      'Médico regulador → verifica criterios de inclusión para Teleprocesos y Hospital Digital',
      'Enfermera Unidad Telemedicina → coordina solicitudes sincrónicas y monitoreo diario de plataformas',
      'Administrativa Unidad Telemedicina → gestión de casos asíncronos, coordinación con SOME y especialistas',
      'Jefa SOME → agenda controles asincrónicos abreviados y entrega de respuestas',
    ],
    layout_position: 'main',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PESTAÑA 2: tele_patologias — Patologías disponibles y criterios de inclusión
// ─────────────────────────────────────────────────────────────────────────────
const PATOLOGIAS_BLOCKS = [
  {
    id: 'tele-v1-tabla',
    tab: 'tele_patologias',
    type: 'criteria',
    color: 'blue',
    order: 3,
    title: 'Patologías GES Disponibles por Modalidad',
    content: 'La columna "Genera garantía" indica si la atención se cuenta dentro de las garantías GES del paciente.',
    items: [
      '━━━ HOSPITAL DIGITAL — Sincrónico o asincrónico con especialista ━━━',
      'Enfermedad Renal Crónica etapa 1–2–3 → Genera garantía GES',
      'Diabetes Mellitus 2 (combinado con Teleprocesos) → No genera garantía',
      'ACV / Accidente Cerebrovascular → Genera garantía GES',
      'Epilepsia ≥15 años → Genera garantía GES',
      'Enfermedad de Parkinson → Genera garantía GES',
      '━━━ TELEPROCESOS — Asincrónico ━━━',
      'Asma ≥15 años → No genera garantía',
      'EPOC → No genera garantía',
      'Hipertensión Arterial → No genera garantía',
      'Retinopatía Diabética → No genera garantía',
      'Sospecha Hiperplasia Prostática → No genera garantía',
      'Sospecha Cáncer de Próstata → No genera garantía',
      'Sospecha Cáncer de Vejiga → No genera garantía',
      'Sospecha Cáncer de Pulmón → Genera garantía GES',
      'Displasia Luxante de Cadera (≤3 meses de edad) → Genera garantía GES',
      'Diabetes Mellitus 2 (combinado con Hospital Digital) → No genera garantía',
      '━━━ DERIVACIÓN PRESENCIAL — No telemedicina ━━━',
      'Sospecha Cáncer Renal y Cáncer de Testículo → Enviar presencial con exámenes diagnósticos adjuntos',
      'Artritis Reumatoide y Alzheimer → Derivar presencial como sospecha GES (Hospital Digital disponible pero sin beneficio adicional)',
    ],
    layout_position: 'main',
  },
  {
    id: 'tele-v1-criterios',
    tab: 'tele_patologias',
    type: 'criteria',
    color: 'amber',
    order: 4,
    title: 'Criterios de Inclusión por Especialidad',
    content: 'El médico regulador verifica estos criterios antes de autorizar el envío por Teleprocesos o Hospital Digital.',
    items: [
      '━━━ BRONCOPULMONAR — Teleprocesos ━━━',
      'Asma bien controlada (GINA <2 pts o ACQ <1.5) sin exacerbaciones, con inhaladores que requieren receta de HHM',
      'Asma parcialmente controlada (GINA 1–2 pts) a pesar de ICS a dosis adecuadas (Budesonida 800 mcg) que requiere agregar segundo controlador',
      'EPOC bien controlado (sin exacerbaciones en el año, mMRC <3) con inhaladores que requieren receta de HHM',
      'Desde 2024: Asma y EPOC en mal control con terapias máximas y buena adherencia',
      '━━━ CARDIOLOGÍA / HTA — Teleprocesos ━━━',
      'Incluir: signos vitales, examen físico, FRCV, antecedentes de consultas a urgencia, hospitalizaciones y síntoma predominante',
      'Incluir: Electrocardiograma actualizado',
      '━━━ UROLOGÍA — Teleprocesos ━━━',
      'Hiperplasia prostática sintomática sin respuesta a Tamsulosina',
      'Sospecha Cáncer de Vejiga y Cáncer de Próstata con laboratorio y/o imágenes de sospecha',
      '━━━ DIABETOLOGÍA / DM2 — Teleprocesos ━━━',
      'DM2 con Metformina dosis máxima + insulina basal DT >0.5 U/kg dividida en 2 dosis, HbA1c >8%',
      'DM2 con Metformina + esquema basal-plus (insulina cristalina 1 vez/día), HbA1c >8%, DT >0.5 U/kg',
      'Esquema basal-bolo con HbA1c >8% + fármacos orales en dosis máxima',
      'Usuarios de corticoides y DM2 con mal control metabólico',
      'Sospecha de DM1 u otro tipo de DM2',
      'Dislipidemia mixta primaria/secundaria severa: LDL >190 o TG >500',
      'Adjuntar: HGT x4/semana (ayuna, prealmuerzo, preonce, precena); exámenes <1 mes (glicemia, creatinina, HbA1c, perfil lipídico, hepático, hemograma, microalbuminuria)',
    ],
    layout_position: 'main',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PESTAÑA 3: tele_flujogramas — Algoritmo visual
// ─────────────────────────────────────────────────────────────────────────────
const FLUJOGRAMAS_BLOCKS = [
  {
    id: 'tele-v1-mermaid',
    tab: 'tele_flujogramas',
    type: 'mermaid',
    order: 5,
    title: 'Algoritmo HCSFB 138 — Solicitud de Telemedicina GES',
    content: `flowchart TD
    A([Paciente con patología GES\\ntributaria de Telemedicina]) --> B[Consentimiento informado\\nverbal en Rayen o ficha clínica]
    B --> C[IC en Rayen\\nEspecificar modalidad + casilla GES]
    C --> D{Modalidad}
    D -->|Sincrónica\\nUnitel HCHM| E[Enfermera solicita cupo\\nen Unitel HCHM]
    E --> F[Calendario semanal\\na SOME y Subdirección]
    F --> G[Control con especialista\\npresencia Enfermera]
    G --> H([Indicaciones + vía de seguimiento])
    D -->|Asincrónica\\nTeleprocesos o Hospital Digital| I[Médico regulador verifica\\ncriterios de inclusión]
    I --> J[SOME agenda control\\nasincrónico abreviado]
    J --> K[Médico sube caso\\na plataforma]
    K --> L[Equipo monitorea\\nrespuestas diariamente]
    L --> M{¿Respuesta\\ndel especialista?}
    M -->|No| L
    M -->|Sí| N[SOME agenda entrega\\npresencial o telefónica]
    N --> O{Plataforma}
    O -->|Teleprocesos| P([Egreso causal 17\\nAtención Telemedicina])
    O -->|Hospital Digital| Q([Egreso causal 19\\nnueva IC con folio · máx 30 días])`,
    layout_position: 'main',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
const ALL_BLOCKS = [...PROTOCOLO_BLOCKS, ...PATOLOGIAS_BLOCKS, ...FLUJOGRAMAS_BLOCKS];
const tabs = [...new Set(ALL_BLOCKS.map(b => b.tab))];

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  TELEMEDICINA GES v1 — ${APPLY ? '⚡ APPLY MODE' : '🔍 DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════`);
console.log(`\nBloques totales: ${ALL_BLOCKS.length}`);
console.log(`Pestañas: ${tabs.join(' | ')}`);
tabs.forEach(tab => {
  console.log(`  ${tab}: ${ALL_BLOCKS.filter(b => b.tab === tab).length} bloques`);
});

if (!APPLY) {
  console.log('\n⚠️  Modo dry-run. Agrega --apply para escribir en la base de datos.');
  process.exit(0);
}

const { error } = await supabase.from('topics').update({
  protocol_authors: AUTHORS,
  content_blocks:   ALL_BLOCKS,
  last_updated:     new Date().toISOString(),
}).eq('id', TOPIC_ID);

if (error) { console.error('\n❌ Error:', error.message); process.exit(1); }
console.log('\n✅ Telemedicina GES actualizado con estructura de 3 pestañas.');
