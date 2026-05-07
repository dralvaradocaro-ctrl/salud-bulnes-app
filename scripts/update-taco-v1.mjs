/**
 * TACO (GCL 1.13, 4ª Ed. Marzo 2026) — Reestructura en 4 pestañas.
 * Protocolo | Equipo | Fármacos | Flujogramas
 *
 * Uso:  node scripts/update-taco-v1.mjs
 *       node scripts/update-taco-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const TOPIC_ID = 'b5020c15-94b1-4885-a177-f145682c8ff0';
const APPLY    = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

const AUTHORS = [
  { name: 'Dra. Micaela Fasani Montagna',     role: 'Elaboradora — Subdirectora Médica HCSFB' },
  { name: 'QF Mauro Fuentes Baltierra',        role: 'Elaborador — Jefe de Farmacia HCSFB' },
  { name: 'TM Jorge Defaur Vargas',            role: 'Elaborador — Laboratorio HCSFB' },
  { name: 'Dr. Eduardo Cordero Díaz',          role: 'Revisor — Subdirector Médico (S) HCSFB' },
  { name: 'Dr. Rodrigo Sandoval Contreras',    role: 'Revisor — Internista HCSFB' },
  { name: 'Nut. Carmen Gloria Gutiérrez',      role: 'Revisora — Encargada Calidad y Seguridad HCSFB' },
  { name: 'Dr. Álvaro Lagos Llanos',           role: 'Aprobador — Director HCSFB' },
];

// ─────────────────────────────────────────────────────────────────────────────
// PESTAÑA 1: taco_protocolo — Indicaciones, flujo y manejo de complicaciones
// ─────────────────────────────────────────────────────────────────────────────
const PROTOCOLO_BLOCKS = [
  {
    id: 'taco-v1-indicaciones',
    tab: 'taco_protocolo',
    type: 'criteria',
    color: 'blue',
    order: 1,
    title: 'Indicaciones y Duración del Tratamiento',
    content: 'Todo paciente con indicación de TACO debe iniciar en hospitalización HCSFB. Solo Acenocumarol y Warfarina (AVK) en este programa.',
    items: [
      '━━━ TEP / TVP ━━━',
      'Primer evento con factor de riesgo reversible → 3 meses',
      'Primer evento idiopático → 3–6 meses (permanente si alto riesgo de recurrencia)',
      'Recurrente o con trombofilia → Permanente (AVK o DOAC según tipo de trombofilia)',
      '━━━ ARRITMIAS ━━━',
      'FA / Flutter según CHA2DS2-VASc → Permanente',
      'FA en miocardiopatía hipertrófica o amiloidosis → Permanente (independiente del score)',
      'FA con estenosis mitral moderada-severa → Permanente (solo AVK)',
      '━━━ PRÓTESIS VALVULARES ━━━',
      'Prótesis mecánica (cualquier posición) → Permanente (solo AVK)',
      'Prótesis biológica aórtica sin FR trombótico → 3 meses; con FA u otra indicación → Permanente',
      'Prótesis biológica mitral → ≥3 meses (INR meta 2.0–3.0)',
      '━━━ OTRAS ━━━',
      'IAM anterior extenso con trombo o aneurisma ventricular apical → 3–6 meses',
      'Trastornos de hemostasia / trombofilias → Permanente',
    ],
    layout_position: 'main',
  },
  {
    id: 'taco-v1-flujo-ingreso',
    tab: 'taco_protocolo',
    type: 'flowchart',
    color: 'green',
    order: 2,
    title: 'Flujo de Ingreso y Seguimiento',
    content: 'El inicio SIEMPRE es en hospitalización HCSFB. La mantención es ambulatoria coordinada entre HCSFB y su microrred.',
    details: [
      'Hospitalizar en HCSFB — Solicitar coagulación basal',
      '~ Iniciar heparina en paralelo con anticoagulante oral',
      '~ Ajustar dosis según INR hasta 2 controles en rango (48 hrs)',
      '~ Suspender heparina al lograr rango estable',
      'Realizar IC a PoliTACO HCHM para ingreso formal al programa',
      'Alta hospitalaria con tratamiento 30 días + IC en Rayen/MLE',
      'PoliTACO HCHM confirma indicación, ajusta DTS y define duración',
      'Contrarreferencia a HCSFB al lograr 2 INR seguidos en rango',
      'Seguimiento ambulatorio en HCSFB — INR en laboratorio con registro en TaoNET y Rayen',
      '~ Rendimiento: 6 min/control, 10 min/ingreso',
      '~ Comunicación médico-TM vía "comentarios de visita" en TaoNET',
      '~ Datos mínimos en Rayen: Dx, rango INR objetivo, DTS, TRT, INR actual y 3 previos',
    ],
    layout_position: 'main',
  },
  {
    id: 'taco-v1-complicaciones',
    tab: 'taco_protocolo',
    type: 'criteria',
    color: 'red',
    order: 3,
    title: 'Manejo de Complicaciones y Derivaciones',
    content: 'Criterios de escalonamiento según resultado de INR o estado clínico.',
    items: [
      '━━━ DERIVAR A EDUCACIÓN QF/ENFERMERA/NUTRICIONISTA ━━━',
      'No logra INR en rango en 3 controles seguidos',
      'Variaciones de INR sin causa identificada (misma dosis)',
      'Sospecha de mala adherencia a tratamiento o alimentación',
      'TRT < 60%',
      '━━━ DERIVAR A URGENCIAS HCHM ━━━',
      'Hemorragia activa (independiente del INR)',
      'INR ≥ 8 con antecedente de hemorragia',
      '━━━ MANEJO DE HEMORRAGIA ━━━',
      'Masiva o cirugía de urgencia → Derivar HCHM: 4–6 unidades plasma fresco + Vitamina K 10 mg IV',
      'Moderada → Suspender TACO + Vitamina K 10 mg IV',
      'Leve → Suspender TACO + moderar dosis',
      '━━━ CONTRAINDICACIONES ABSOLUTAS ━━━',
      'Hemorragia activa no controlada',
      'Sangrado intracraneal reciente (<1 mes)',
      'Hipersensibilidad al fármaco anticoagulante',
      'Plaquetopenia severa (<25.000–30.000/mm³)',
      'HTA severa no controlada (PAS ≥180 o PAD ≥110 mmHg sostenida)',
      '━━━ CONTRAINDICACIONES RELATIVAS MAYORES ━━━',
      'Aneurisma intracraneal o cirugía SNC reciente',
      'Retinopatía hemorrágica',
      'Coagulopatía severa (fibrinógeno <100 mg/dL)',
    ],
    layout_position: 'main',
  },
  {
    id: 'taco-v1-alta',
    tab: 'taco_protocolo',
    type: 'criteria',
    color: 'green',
    order: 4,
    title: 'Alta del Programa PoliTACO',
    content: 'Criterios y procedimiento para egreso formal del programa.',
    items: [
      'INR estable y tiempo definido de tratamiento completado según indicación del especialista',
      'Alta clínica definitiva según resolución de nivel secundario (HCHM)',
      '━━━ AL DAR EL ALTA ━━━',
      'Registrar en Rayen diagnóstico inicial y duración del tratamiento',
      'Valorar riesgo individual y red de apoyo antes de suspender',
      'Educar al paciente y familia sobre autocuidado y signos de alarma',
      'Emitir Orden Interna: "alta poli TACO, no agendar" para SOME',
      'Enviar correo a SOME, laboratorio, Enfermera y QF del centro con nombre y RUT del paciente',
    ],
    layout_position: 'main',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PESTAÑA 2: taco_equipo — Roles del equipo PoliTACO
// ─────────────────────────────────────────────────────────────────────────────
const EQUIPO_BLOCKS = [
  {
    id: 'taco-v1-roles',
    tab: 'taco_equipo',
    type: 'flowchart',
    color: 'purple',
    order: 5,
    title: 'Roles del Equipo PoliTACO HCSFB',
    content: 'Cada profesional tiene responsabilidades específicas dentro del programa de anticoagulación.',
    details: [
      'Médico referente PoliTACO → manejo clínico integral, ajuste de DTS, derivaciones y altas',
      '~ Comunicación con TM vía "comentarios de visita" en TaoNET',
      '~ Orden interna a QF al ingreso (educación, interacciones, adherencia)',
      '~ Orden interna a Nutricionista al ingreso si hay disponibilidad',
      'TM Directora Técnica (encargada del programa) → supervisión global y coordinación de la microrred',
      '~ Organiza flujo de pacientes de Bulnes y Quillón',
      '~ Coordina toma domiciliaria en pacientes postrados',
      '~ Gestiona plataformas TaoNET y laboratorio',
      'TM de laboratorio → toma de muestra INR, educación al paciente, registro en TaoNET',
      '~ Revisa "comentarios de visita" diariamente',
      '~ Informa al médico cualquier novedad clínica',
      'Administrativo de laboratorio → extrae lista de pacientes de TaoNET → envía a SOME, farmacia y microrred',
      '~ Ingresa prestación INR en plataforma de laboratorio',
      'QF referente → dispensación, atención farmacéutica, gestión territorial de medicamentos',
      '~ Recibe derivación para pacientes nuevos y quienes no logran INR en rango',
      '~ Atención farmacéutica: entrevista, conciliación, educación, revisión de interacciones y plantas medicinales',
      'Enfermera PoliTACO → seguimiento clínico, registro de INR, identifica candidatos a alta',
      '~ Informa a médico referente sobre pacientes fuera de TRT de forma persistente',
      'Jefe SOME → gestión de agendas y derivaciones, IC a CAE PoliTACO HCHM',
      'Profesionales microrred (Quillón y Santa Clara) → toma INR capilar/venosa, entrega de medicamentos',
    ],
    layout_position: 'main',
  },
  {
    id: 'taco-v1-microrred',
    tab: 'taco_equipo',
    type: 'criteria',
    color: 'blue',
    order: 6,
    title: 'Calendario Microrred — Toma de Muestra y Entrega',
    content: 'Coordinación operativa entre HCSFB, CESFAM Quillón y CESFAM Santa Clara.',
    items: [
      '━━━ CESFAM QUILLÓN ━━━',
      'Lunes → Toma de muestra',
      'Jueves → Toma de muestra',
      'Viernes → Toma de muestra',
      'Martes → Entrega de tratamiento',
      'Viernes → Entrega de tratamiento',
      'Lunes → Entrega de tratamiento',
      '━━━ CESFAM SANTA CLARA ━━━',
      'Miércoles → Toma de muestra',
      'Viernes → Entrega de tratamiento',
      '━━━ PACIENTES POSTRADOS ━━━',
      'Toma de muestra domiciliaria coordinada por TM Directora Técnica',
    ],
    layout_position: 'main',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PESTAÑA 3: taco_farmacos — Fármacos, interacciones y situaciones especiales
// ─────────────────────────────────────────────────────────────────────────────
const FARMACOS_BLOCKS = [
  {
    id: 'taco-v1-farmacos',
    tab: 'taco_farmacos',
    type: 'criteria',
    color: 'blue',
    order: 7,
    title: 'Fármacos Anticoagulantes Orales (AVK)',
    content: 'El HCSFB usa Acenocumarol. La Warfarina se incluye como referencia comparativa.',
    items: [
      '━━━ ACENOCUMAROL — USADO EN HCSFB ━━━',
      'Presentación: comprimido 4 mg biranurado',
      'Dosis inicial: 4–8 mg',
      'Inicio de efecto: 8 hrs | Efecto terapéutico: 68 hrs | Duración: 48 hrs',
      'Unión a albúmina: 90%',
      'Administración: solo con agua (200 mL), a las 17 hrs, alejado 1–2 hrs de comidas y otros fármacos',
      'Marcar en hoja de control el día en que se tomó',
      '━━━ WARFARINA — REFERENCIA ━━━',
      'Presentación: comprimido 5 mg ranurado',
      'Dosis inicial: 5–7.5 mg',
      'Inicio de efecto: 24 hrs | Efecto terapéutico: 84 hrs | Duración: 4–5 días',
      'Unión a albúmina: 97%',
    ],
    layout_position: 'main',
  },
  {
    id: 'taco-v1-interacciones',
    tab: 'taco_farmacos',
    type: 'criteria',
    color: 'amber',
    order: 8,
    title: 'Interacciones Medicamentosas',
    content: 'Notificar siempre al médico tratante antes de agregar o suspender cualquier medicamento.',
    items: [
      '━━━ POTENCIADORES — AUMENTAN EFECTO ANTICOAGULANTE ━━━',
      'Antibióticos: Neomicina oral, Tetraciclinas, Amoxicilina, Metronidazol, Ciprofloxacino',
      'Cardioactivos: Amiodarona',
      'Otros: Antidepresivos, IECA, Hipolipemiantes, AINEs (preferir Diclofenaco o Nabumetona)',
      '━━━ INHIBIDORES — REDUCEN EFECTO ANTICOAGULANTE ━━━',
      'Colestiramina, Sucralfato, Fenobarbital, Rifampicina',
      'Alcohol, Tabaco, Estrógenos',
      '━━━ ALIMENTACIÓN ━━━',
      'Alto contenido Vitamina K (2 veces/sem): Acelga, Espinaca, Brócoli, Lechuga verde oscura, interiores de animales, mayonesa, té verde',
      'Moderado contenido Vitamina K (1 taza/día): Espárragos, Palta, Arvejas, Tomate, Poroto verde, Alcachofa, Repollo, Kiwi',
      'Bajo contenido Vitamina K (sin restricción): Zanahoria, Coliflor, Maíz, Champiñón, Frutas cítricas, Carnes, Lácteos',
    ],
    layout_position: 'main',
  },
  {
    id: 'taco-v1-especiales',
    tab: 'taco_farmacos',
    type: 'criteria',
    color: 'purple',
    order: 9,
    title: 'Situaciones Especiales',
    content: 'Manejo de TACO en escenarios que requieren ajuste del esquema habitual.',
    items: [
      '━━━ EMBARAZO ━━━',
      'Los AVK están contraindicados en el primer trimestre (teratogénicos)',
      'Mujeres con indicación de TACO permanente: manejo exclusivo en policlínico de especialidad',
      '━━━ CIRUGÍA MAYOR ━━━',
      'Suspender TACO 4–5 días previo a la cirugía',
      'Iniciar heparina BPM 48–72 hrs antes y suspender 6 hrs previo a la intervención',
      'Reiniciar TACO lo antes posible tras la cirugía',
      '━━━ CIRUGÍA MENOR / PROCEDIMIENTO DENTAL ━━━',
      'Suspender TACO 48–72 hrs antes del procedimiento',
      'Reiniciar TACO al 1° o 2° día postprocedimiento',
    ],
    layout_position: 'main',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PESTAÑA 4: taco_flujogramas — Algoritmos visuales
// ─────────────────────────────────────────────────────────────────────────────
const FLUJOGRAMAS_BLOCKS = [
  {
    id: 'taco-v1-mermaid-inr',
    tab: 'taco_flujogramas',
    type: 'mermaid',
    order: 10,
    title: 'Algoritmo de Dosificación INR — PoliTACO HCSFB',
    content: `flowchart TD
    A([Control INR\\nPoliTACO HCSFB]) --> B{Resultado INR}
    B -->|< 1.5| C[Aumentar DTS 15–20%\\nControl en 1–2 semanas]
    B -->|1.5–1.9| D[Aumentar DTS 5–10%\\nControl en 2–3 semanas]
    B -->|2.0–3.0| E[Mantener DTS\\nControl en 4–8 semanas]
    B -->|3.1–3.9| F[Reducir DTS 5–10%\\nControl en 2–3 semanas]
    B -->|4.0–4.9| G[Omitir 1–2 días\\nReducir DTS 10–15%]
    B -->|≥ 5.0 sin sangrado| H[Omitir tratamiento\\nControl INR en 1–3 días]
    B -->|≥ 8 o con sangrado| I([Derivar urgencias HCHM\\nPlasma fresco + Vitamina K IV])
    C --> J{¿Fuera de rango\\nen ≥3 controles?}
    D --> J
    F --> J
    G --> J
    H --> J
    J -->|Sí| K([Derivar a QF/Enfermera/Nutricionista\\nEvaluar adherencia y alimentación])
    J -->|No| E`,
    layout_position: 'main',
  },
  {
    id: 'taco-v1-mermaid-flujo',
    tab: 'taco_flujogramas',
    type: 'mermaid',
    order: 11,
    title: 'Flujo de Ingreso al Programa — GCL 1.13',
    content: `flowchart TD
    A([Indicación de TACO\\nidentificada]) --> B[Hospitalizar HCSFB\\nIniciar heparina + anticoagulante oral]
    B --> C[Ajustar dosis hasta\\n2 INR en rango 48 hrs]
    C --> D[Alta + IC PoliTACO HCHM\\nTratamiento 30 días]
    D --> E[PoliTACO HCHM confirma indicación\\nAjusta DTS · Define duración]
    E --> F{¿2 INR seguidos\\nen rango?}
    F -->|No| E
    F -->|Sí| G[Contrarreferencia a HCSFB\\nSeguimiento PoliTACO local]
    G --> H{¿INR estable\\npor tiempo definido?}
    H -->|No — sin causa corregible| I([Recontrarreferir a HCHM])
    H -->|No — causa identificada| G
    H -->|Sí| K([Alta PoliTACO\\nOrden interna SOME · Correo equipo])`,
    layout_position: 'main',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
const ALL_BLOCKS = [...PROTOCOLO_BLOCKS, ...EQUIPO_BLOCKS, ...FARMACOS_BLOCKS, ...FLUJOGRAMAS_BLOCKS];
const tabs = [...new Set(ALL_BLOCKS.map(b => b.tab))];

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  TACO v1 — ${APPLY ? '⚡ APPLY MODE' : '🔍 DRY-RUN'}`);
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
console.log('\n✅ TACO actualizado con estructura de 4 pestañas.');
