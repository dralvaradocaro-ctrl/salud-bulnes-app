/**
 * Inserta 6 protocolos nuevos en la categoría Policlínico.
 *
 * Uso:  node scripts/insert-protocolos-policlinico.mjs
 *       node scripts/insert-protocolos-policlinico.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const CATEGORY_ID = '696ea6ff245ef362de4f431e'; // Policlínico
const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

const TOPICS = [
  // ── GCL 1.13 — TACO Policlínico ───────────────────────────────────────────
  {
    id: randomUUID(),
    name: 'Atención en Policlínico TACO (Terapia Anticoagulante Oral)',
    category_id: CATEGORY_ID,
    status: 'published',
    has_local_protocol: true,
    tipo_contenido: ['protocolo'],
    tags: ['TACO', 'anticoagulación', 'warfarina', 'INR', 'policlínico', 'trombosis'],
    protocol_code:      'GCL 1.13',
    protocol_edition:   'Primera',
    protocol_date:      'Enero 2023',
    protocol_validity:  'Enero 2028',
    protocol_file_url:  '',
    protocol_objective: 'Estandarizar el seguimiento de pacientes en terapia anticoagulante oral (TAO) en el policlínico del HCSFB, garantizando el control del INR, la educación del paciente y el manejo de complicaciones.',
    protocol_authors: [
      { name: 'Equipo Clínico HCSFB', role: 'Elaboradores — Medicina y Enfermería' },
      { name: 'Oficina de Calidad y Seguridad del Paciente HCSFB', role: 'Revisora y Aprobadora' },
    ],
    content_blocks: [
      {
        id: 'taco-indicaciones',
        type: 'criteria',
        color: 'blue',
        order: 1,
        title: 'Indicaciones de Anticoagulación Oral',
        content: 'Condiciones que justifican TACO y rangos de INR objetivo',
        items: [
          'Fibrilación auricular no valvular con riesgo tromboembólico (CHA₂DS₂-VASc ≥ 2): INR 2–3',
          'Prótesis valvular mecánica mitral: INR 2.5–3.5',
          'Prótesis valvular mecánica aórtica sin factores de riesgo: INR 2–3',
          'Trombosis venosa profunda / Tromboembolia pulmonar: INR 2–3 (mínimo 3 meses)',
          'Trombofilia severa: INR 2–3 de forma indefinida',
          'Trombosis valvular reumática: INR 2–3',
        ],
        layout_position: 'main',
      },
      {
        id: 'taco-control',
        type: 'flowchart',
        color: 'green',
        order: 2,
        title: 'Control y Ajuste de Dosis — Flujograma',
        content: 'Periodicidad de controles e interpretación del INR',
        details: [
          'INR en rango terapéutico: control mensual estable; cada 3 meses si ≥ 6 meses sin variación',
          'INR subterapéutico (< 2.0): aumentar dosis semanal 10–15%; control en 1–2 semanas',
          'INR supraterap. leve (3.0–4.5): disminuir dosis 10–15%; control en 1–2 semanas',
          'INR 4.5–8.0 sin sangrado: suspender 1 dosis; repetir INR en 24–48h',
          'INR > 8.0 o sangrado activo: suspender warfarina, evaluar Vitamina K1 oral 1–2 mg; si sangrado grave → urgencias para PFC o concentrado de complejo protrombínico',
          'Cada control: revisar INR, presión arterial, fármacos nuevos, consumo de vitamina K (vegetales verdes) y adherencia',
        ],
        layout_position: 'main',
      },
      {
        id: 'taco-educacion',
        type: 'checklist',
        color: 'amber',
        order: 3,
        title: 'Educación del Paciente — Puntos Clave',
        content: 'Información obligatoria en cada control',
        items: [
          { text: 'Tomar warfarina siempre a la misma hora, preferentemente vespertina', completed: false },
          { text: 'No saltarse dosis — si olvida, tomar el mismo día; no doblar al día siguiente', completed: false },
          { text: 'Mantener consumo de vitamina K constante (no eliminar vegetales verdes, pero sin variaciones bruscas)', completed: false },
          { text: 'Avisar ante cualquier sangrado: encías, orina rojiza, heces negras, contusiones inusuales', completed: false },
          { text: 'Informar a cualquier profesional de salud que está en TACO antes de cualquier procedimiento', completed: false },
          { text: 'Alcohol con moderación; evitar AINEs (ibuprofeno, aspirina) sin indicación médica', completed: false },
          { text: 'Carnet de anticoagulación siempre consigo', completed: false },
        ],
        layout_position: 'main',
      },
    ],
  },

  // ── HCSFB 151 — Infiltración de Rodilla ──────────────────────────────────
  {
    id: randomUUID(),
    name: 'Infiltración de Rodilla con Corticoides — Programa Gonartrosis',
    category_id: CATEGORY_ID,
    status: 'published',
    has_local_protocol: true,
    tipo_contenido: ['protocolo'],
    tags: ['infiltración', 'rodilla', 'gonartrosis', 'corticoides', 'policlínico', 'articulación'],
    protocol_code:      'HCSFB 151',
    protocol_edition:   'Primera',
    protocol_date:      'Octubre 2025',
    protocol_validity:  'Octubre 2030',
    protocol_file_url:  '',
    protocol_objective: 'Estandarizar la técnica y los criterios de indicación para la infiltración intraarticular de rodilla con corticoides en el programa de gonartrosis del HCSFB.',
    protocol_authors: [
      { name: 'Equipo Médico HCSFB', role: 'Elaboradores — Medicina Familiar y Traumatología' },
      { name: 'Oficina de Calidad y Seguridad del Paciente HCSFB', role: 'Revisora y Aprobadora' },
    ],
    content_blocks: [
      {
        id: 'infiltracion-indicaciones',
        type: 'criteria',
        color: 'blue',
        order: 1,
        title: 'Indicaciones y Contraindicaciones',
        content: 'Criterios de selección para infiltración intraarticular de rodilla',
        items: [
          'INDICADA: gonartrosis sintomática con dolor EVA ≥ 5 pese a AINE + paracetamol; derrame articular doloroso',
          'INDICADA: brote inflamatorio en gonartrosis antes de inicio de rehabilitación',
          'CONTRAINDICADA: artritis séptica activa o sospecha de infección articular',
          'CONTRAINDICADA: infección de piel periarticular; alergia al fármaco infiltrado',
          'CONTRAINDICADA RELATIVA: diabetes mal controlada, coagulopatía activa, prótesis articular (infección periprótesis)',
          'No más de 3 infiltraciones por año en la misma articulación',
        ],
        layout_position: 'main',
      },
      {
        id: 'infiltracion-tecnica',
        type: 'flowchart',
        color: 'green',
        order: 2,
        title: 'Técnica de Infiltración — Protocolo HCSFB 151',
        content: 'Procedimiento paso a paso para infiltración de rodilla',
        details: [
          'Fármaco: Betametasona 4–6 mg (o equivalente) + Lidocaína 1% 2–3 mL',
          'Posición: decúbito supino con rodilla en extensión o leve flexión (30°)',
          'Acceso: cara anterolateral subpatelar o medial (según preferencia y hábito del operador)',
          'Asepsia: antisepsia con clorhexidina, campo estéril, guantes estériles',
          'Aspirar derrame si presente antes de inyectar corticoide',
          'Inyectar 1–2 mL Lidocaína subcutánea para anestesia del trayecto',
          'Verificar posición intraarticular (aspiración libre sin resistencia), inyectar lentamente',
          'Post-procedimiento: reposo relativo 24–48h; avisar si dolor significativo post-infiltración',
        ],
        layout_position: 'main',
      },
    ],
  },

  // ── HCSFB 153 — Clotiazepam ───────────────────────────────────────────────
  {
    id: randomUUID(),
    name: 'Uso de Clotiazepam Comprimidos para el Manejo de Ansiedad',
    category_id: CATEGORY_ID,
    status: 'published',
    has_local_protocol: true,
    tipo_contenido: ['protocolo'],
    tags: ['clotiazepam', 'ansiedad', 'benzodiacepinas', 'policlínico', 'ansiolítico', 'trastorno ansiedad'],
    protocol_code:      'HCSFB 153',
    protocol_edition:   'Primera',
    protocol_date:      'Noviembre 2025',
    protocol_validity:  'Noviembre 2030',
    protocol_file_url:  '',
    protocol_objective: 'Normar el uso de clotiazepam en el manejo de trastornos de ansiedad en el policlínico del HCSFB, estableciendo indicaciones, contraindicaciones, dosis y duración adecuada del tratamiento.',
    protocol_authors: [
      { name: 'Equipo Médico HCSFB', role: 'Elaboradores — Medicina Familiar y Salud Mental' },
      { name: 'Oficina de Calidad y Seguridad del Paciente HCSFB', role: 'Revisora y Aprobadora' },
    ],
    content_blocks: [
      {
        id: 'clo-indicaciones',
        type: 'criteria',
        color: 'blue',
        order: 1,
        title: 'Indicaciones y Contraindicaciones',
        content: 'Contextos clínicos apropiados e inapropiados para el uso de clotiazepam',
        items: [
          'INDICADO: trastorno de ansiedad generalizada en el contexto de inicio de tratamiento con ISRS (puente terapéutico, máx 4–6 semanas)',
          'INDICADO: ansiedad aguda situacional severa con interferencia funcional significativa',
          'INDICADO: insomnio de inicio por ansiedad, por ciclos breves (< 2 semanas)',
          'CONTRAINDICADO: glaucoma de ángulo cerrado, insuficiencia respiratoria grave, apnea del sueño',
          'CONTRAINDICADO: consumo activo de alcohol u otras sustancias depresoras del SNC',
          'EVITAR: adultos mayores ≥ 65 años (riesgo caídas, deterioro cognitivo, dependencia); embarazo y lactancia',
          'NO indicar como monoterapia crónica de trastorno de ansiedad — requiere ISRS + psicoterapia',
        ],
        layout_position: 'main',
      },
      {
        id: 'clo-dosificacion',
        type: 'flowchart',
        color: 'green',
        order: 2,
        title: 'Dosificación y Duración — Protocolo HCSFB 153',
        content: 'Esquemas de uso por indicación clínica',
        details: [
          'Ansiedad generalizada (puente): Clotiazepam 5 mg c/12h VO por 2–4 semanas; retirar gradualmente',
          'Ansiedad situacional aguda: Clotiazepam 5–10 mg VO dosis única o c/12h por 3–7 días',
          'Insomnio por ansiedad: Clotiazepam 5 mg nocturno; máximo 2 semanas consecutivas',
          'Adultos jóvenes sin comorbilidades: dosis habitual 5–10 mg/día dividida en 1–2 tomas',
          'Duración máxima sin reevaluación: 4–6 semanas — si requiere extensión, documentar justificación clínica',
          'Nunca suspender abruptamente tras uso prolongado — reducir 25% cada 1–2 semanas',
          'Prescribir cantidad ajustada al período terapéutico; no renovar automáticamente',
        ],
        layout_position: 'main',
      },
    ],
  },

  // ── HCSFB 138 — Telemedicina para Patologías GES ─────────────────────────
  {
    id: randomUUID(),
    name: 'Atención en Telemedicina para Patologías GES — Flujo Operativo HCSFB',
    category_id: CATEGORY_ID,
    status: 'published',
    has_local_protocol: true,
    tipo_contenido: ['protocolo'],
    tags: ['telemedicina', 'GES', 'téleconsulta', 'policlínico', 'hospital digital', 'Unitel', 'teleprocesos'],
    protocol_code:      'HCSFB 138',
    protocol_edition:   'Primera',
    protocol_date:      'Mayo 2025',
    protocol_validity:  'Mayo 2030',
    protocol_file_url:  '',
    protocol_objective: 'Establecer el flujo operativo para la derivación y atención por telemedicina de patologías GES entre el HCSFB y el nivel secundario (HHM), optimizando el acceso oportuno y reduciendo desplazamientos innecesarios.',
    protocol_authors: [
      { name: 'Equipo Clínico HCSFB', role: 'Elaboradores — Medicina y Gestión de Red' },
      { name: 'Dirección HCSFB', role: 'Aprobadora' },
    ],
    content_blocks: [
      {
        id: 'tele-modalidades',
        type: 'flowchart',
        color: 'blue',
        order: 1,
        title: 'Modalidades de Telemedicina Disponibles — HCSFB',
        content: 'Plataformas y tipos de teleconsulta según patología y urgencia',
        details: [
          'Teleprocesos: derivación digital de interconsultas entre HCSFB y HHM, con respuesta del especialista sin traslado del paciente',
          'Hospital Digital (MINSAL): teleconsulta en tiempo real paciente–especialista; se activa desde el policlínico del HCSFB',
          'Unitel HHM: plataforma de telemedicina del Hospital Herminda Martín para resolución de casos GES',
          'Tele-ECG: envío de ECG digital para interpretación remota (cardiopatías isquémicas, arritmias)',
          'Tele-dermatología: envío de fotografías clínicas para evaluación de lesiones cutáneas',
          'Tele-salud mental: videoconsulta con psiquiatra o psicólogo para patologías GES de SM',
        ],
        layout_position: 'main',
      },
      {
        id: 'tele-patologias',
        type: 'flowchart',
        color: 'green',
        order: 2,
        title: 'Patologías GES con Telemedicina Disponible',
        content: 'Condiciones en que se puede usar telemedicina como alternativa o complemento a la atención presencial',
        details: [
          'Diabetes mellitus tipo 2: control metabólico y ajuste de tratamiento vía teleconsulta con endocrinólogo',
          'Hipertensión arterial: seguimiento y ajuste farmacológico remotamente',
          'Epilepsia: control con neurología para ajuste de anticonvulsivantes',
          'Hipotiroidismo: seguimiento TSH y ajuste de levotiroxina',
          'Salud mental (depresión, esquizofrenia, TEA): teleconsulta con psiquiatría',
          'Cardiopatías GES: tele-ECG y consulta cardiología',
          'Retinopatía diabética: tele-oftalmología con envío de retinofotografías',
        ],
        layout_position: 'main',
      },
      {
        id: 'tele-flujo',
        type: 'flowchart',
        color: 'amber',
        order: 3,
        title: 'Flujo Operativo — Paso a Paso',
        content: 'Proceso desde la indicación de telemedicina hasta la respuesta del especialista',
        details: [
          '1. Médico HCSFB indica telemedicina: seleccionar plataforma según tipo de consulta',
          '2. Administrativo o médico ingresa caso al sistema (Teleprocesos / Hospital Digital)',
          '3. Adjuntar exámenes relevantes, fotografías o ECG según protocolo',
          '4. Especialista HHM responde en plazo GES (24–72h según patología)',
          '5. Médico HCSFB revisa respuesta e implementa indicaciones en el control del paciente',
          '6. Si telemedicina no es suficiente: derivación presencial convencional',
          '7. Documentar en ficha clínica: fecha, plataforma, especialista, indicación recibida',
        ],
        layout_position: 'main',
      },
    ],
  },

  // ── HCSFB 166 — Criterios Ingreso/Derivación/Egreso Salud Mental ──────────
  {
    id: randomUUID(),
    name: 'Criterios de Ingreso, Derivación y Egreso de Pacientes con Diagnóstico de Salud Mental',
    category_id: CATEGORY_ID,
    status: 'published',
    has_local_protocol: true,
    tipo_contenido: ['protocolo'],
    tags: ['salud mental', 'criterios ingreso', 'derivación', 'egreso', 'psiquiatría', 'policlínico'],
    protocol_code:      'HCSFB 166',
    protocol_edition:   'Primera',
    protocol_date:      'Marzo 2026',
    protocol_validity:  'Marzo 2031',
    protocol_file_url:  '',
    protocol_objective: 'Establecer criterios claros para el ingreso, seguimiento, derivación a nivel secundario y egreso de pacientes con diagnósticos de salud mental atendidos en el policlínico del HCSFB.',
    protocol_authors: [
      { name: 'Equipo Clínico HCSFB', role: 'Elaboradores — Medicina, Psicología y Trabajo Social' },
      { name: 'Oficina de Calidad y Seguridad del Paciente HCSFB', role: 'Revisora y Aprobadora' },
    ],
    content_blocks: [
      {
        id: 'sm-criterios-ingreso',
        type: 'criteria',
        color: 'blue',
        order: 1,
        title: 'Criterios de Ingreso al Programa de Salud Mental HCSFB',
        content: 'Condiciones que justifican el ingreso al programa de seguimiento en policlínico',
        items: [
          'Trastorno depresivo mayor en episodio activo o en mantenimiento con tratamiento',
          'Trastorno de ansiedad generalizada, fobia social, trastorno de pánico',
          'Trastorno de estrés post-traumático (TEPT)',
          'Trastorno bipolar compensado sin hospitalización reciente (< 6 meses)',
          'Esquizofrenia u otro trastorno psicótico estabilizado, en seguimiento post-alta',
          'Trastorno del uso de sustancias en etapa de tratamiento ambulatorio',
          'Pacientes egresados de hospitalización psiquiátrica en HHM con necesidad de seguimiento',
        ],
        layout_position: 'main',
      },
      {
        id: 'sm-derivacion',
        type: 'criteria',
        color: 'red',
        order: 2,
        title: 'Criterios de Derivación a Psiquiatría (HHM)',
        content: 'Situaciones que requieren evaluación o tratamiento en el nivel secundario',
        items: [
          'Primera crisis psicótica o sospecha diagnóstica de psicosis',
          'Episodio maníaco agudo o depresión severa con riesgo suicida',
          'Trastorno bipolar descompensado o cambio de ánimo sin respuesta a tratamiento en 4 semanas',
          'Diagnóstico incierto o comorbilidades psiquiátricas complejas',
          'Necesidad de farmacología de segunda línea (litio, antipsicóticos atípicos, clozapina)',
          'Intento de suicidio reciente con riesgo persistente',
          'Trastorno de personalidad con crisis frecuentes o conducta autolesiva activa',
        ],
        layout_position: 'main',
      },
      {
        id: 'sm-egreso',
        type: 'criteria',
        color: 'green',
        order: 3,
        title: 'Criterios de Egreso del Programa',
        content: 'Condiciones que permiten dar de alta del seguimiento activo en policlínico',
        items: [
          'Remisión completa de síntomas por ≥ 6 meses con o sin tratamiento farmacológico',
          'Adherencia terapéutica estable, funcionalidad recuperada y red de apoyo adecuada',
          'Completó psicoterapia y mantiene herramientas de autoregulación',
          'Patología crónica estabilizada con seguimiento periódico anual suficiente',
          'Traslado a otro centro de salud (egreso administrativo con derivación)',
          'Al egreso: entregar plan de acción ante recaída y criterios para retornar al programa',
        ],
        layout_position: 'main',
      },
    ],
  },

  // ── HCSFB 160 — Prevención de Autolesiones y Suicidio ────────────────────
  {
    id: randomUUID(),
    name: 'Prevención de Autolesiones y Conducta Suicida en Policlínico',
    category_id: CATEGORY_ID,
    status: 'published',
    has_local_protocol: true,
    tipo_contenido: ['protocolo'],
    tags: ['suicidio', 'autolesiones', 'prevención', 'ASQ', 'policlínico', 'screening', 'riesgo suicida'],
    protocol_code:      'HCSFB 160',
    protocol_edition:   'Primera',
    protocol_date:      'Febrero 2026',
    protocol_validity:  'Febrero 2031',
    protocol_file_url:  '',
    protocol_objective: 'Establecer un protocolo de screening, evaluación y derivación de pacientes con riesgo de autolesiones o conducta suicida atendidos en el policlínico del HCSFB, mediante el uso del instrumento ASQ.',
    protocol_authors: [
      { name: 'Equipo Clínico HCSFB', role: 'Elaboradores — Medicina, Psicología y Enfermería' },
      { name: 'Oficina de Calidad y Seguridad del Paciente HCSFB', role: 'Revisora y Aprobadora' },
    ],
    content_blocks: [
      {
        id: 'prevs-screening',
        type: 'flowchart',
        color: 'blue',
        order: 1,
        title: 'Cuándo y Cómo Aplicar el ASQ',
        content: 'Ask Suicide-Screening Questions — Herramienta de tamizaje validada',
        details: [
          'Aplicar ASQ en: toda consulta de salud mental, ante signos de angustia marcada, en consultas reiterativas sin diagnóstico claro, y en pacientes con antecedente de intento previo',
          'Preguntas ASQ (aplicar todas):',
          '1. "¿En el último mes ha deseado estar muerto?"',
          '2. "¿En el último mes ha querido hacerse daño?"',
          '3. "¿En el último mes ha pensado en quitarse la vida?"',
          '4. "¿Alguna vez ha intentado quitarse la vida?"',
          '5. "¿Ahora mismo tiene algún pensamiento de hacerse daño?"',
          'Respuesta positiva a cualquier pregunta: activar evaluación de riesgo suicida completa',
        ],
        layout_position: 'main',
      },
      {
        id: 'prevs-riesgo',
        type: 'flowchart',
        color: 'amber',
        order: 2,
        title: 'Clasificación de Riesgo y Conducta',
        content: 'Estratificación de riesgo suicida y respuesta clínica correspondiente',
        details: [
          'RIESGO BAJO: ideación pasiva sin plan, sin intento previo, red de apoyo presente — evaluación psicológica ambulatoria en < 72h, plan de seguridad verbal, seguimiento semanal',
          'RIESGO MODERADO: ideación activa con o sin plan vago, red de apoyo limitada — evaluación psicológica urgente mismo día, plan de seguridad escrito, considerar derivación a urgencias si no hay red',
          'RIESGO ALTO: plan estructurado, intención declarada, intento reciente, aislamiento — derivar a Urgencias HCSFB de inmediato; no dejar solo al paciente; llamar a familiar/acompañante',
          'Plan de seguridad: incluir personas de contacto, señales de alarma personales, medidas de restricción de acceso a medios letales (medicamentos, armas)',
        ],
        layout_position: 'main',
      },
      {
        id: 'prevs-derivacion',
        type: 'criteria',
        color: 'red',
        order: 3,
        title: 'Criterios de Derivación Urgente a Urgencias o Psiquiatría',
        content: 'Situaciones que requieren atención inmediata fuera del policlínico',
        items: [
          'Ideación suicida activa con plan y medios de acceso inmediato',
          'Intento de suicidio en las últimas 24–72h aún no evaluado por psiquiatría',
          'Autolesiones activas durante la consulta o revelación de autolesiones recientes graves',
          'Paciente que rechaza plan de seguridad y no tiene red de apoyo',
          'Agitación o conducta impredecible en el contexto de riesgo suicida',
          'Paciente bajo efectos de alcohol u otras sustancias con ideación activa',
          'Tras derivar: comunicarse con servicio receptor y documentar en ficha',
        ],
        layout_position: 'main',
      },
    ],
  },
];

// ── Main ─────────────────────────────────────────────────────────────────────
console.log(`\nProtocolos a insertar: ${TOPICS.length}`);
TOPICS.forEach((t, i) =>
  console.log(`  ${i + 1}. ${t.name} (${t.protocol_code}) — ${t.protocol_validity}`)
);

if (!APPLY) {
  console.log('\n⚠️  Modo dry-run. Agrega --apply para insertar en la base de datos.');
  process.exit(0);
}

const { data, error } = await supabase.from('topics').insert(TOPICS).select('id, name');

if (error) {
  console.error('❌ Error al insertar:', error.message);
  process.exit(1);
}

console.log(`\n✅ ${data.length} protocolos de Policlínico insertados:`);
data.forEach(t => console.log(`  • ${t.name} — ${t.id}`));
