/**
 * Enriquecimiento v2 — Protocolos Policlínico
 * Agrega autores reales, bloques mermaid, contenido operativo local.
 *
 * Uso:  node scripts/update-protocolos-policlinico-v2.mjs
 *       node scripts/update-protocolos-policlinico-v2.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

// ─────────────────────────────────────────────────────────────
// 1. HCSFB 153 — Clotiazepam (Ansiedad)
// ─────────────────────────────────────────────────────────────
const CLOTIAZEPAM = {
  id: 'ef1502b6-2c86-455a-8f38-e90e355e7d9e',
  meta: {
    protocol_code:      'HCSFB 153',
    protocol_edition:   'Primera',
    protocol_date:      'Noviembre 2025',
    protocol_validity:  'Noviembre 2030',
    protocol_objective: 'Guiar el uso racional del clotiazepam en el policlínico del HCSFB, estableciendo indicaciones, contraindicaciones, dosis y criterios de retiro para el manejo de la ansiedad situacional aguda.',
    protocol_authors: [
      { name: 'Dra. Micaela Fasani Montagna', role: 'Elaboradora — Médico Cirujano HCSFB' },
      { name: 'Dr. Felipe Sancho Tapia',       role: 'Revisor — Subdirector Médico HCSFB' },
      { name: 'Dr. Álvaro Lagos Llanos',        role: 'Aprobador — Director HCSFB' },
    ],
  },
  blocks: [
    {
      id: 'clot-indicaciones',
      type: 'criteria',
      color: 'blue',
      order: 1,
      title: 'Indicaciones y Contraindicaciones',
      content: 'Situaciones clínicas donde el clotiazepam está indicado o contraindicado en el policlínico HCSFB',
      items: [
        '✅ Ansiedad situacional aguda (duelo, procedimientos, crisis vitales) — máx 7 días',
        '✅ Puente de inicio de ISRS (2–4 semanas) en trastorno de ansiedad confirmado',
        '✅ Insomnio de inicio por ansiedad — solo nocturno, máx 2 semanas',
        '❌ Edad ≥ 65 años (riesgo caídas, delirium, deterioro cognitivo)',
        '❌ Antecedente de trastorno por uso de sustancias o alcohol',
        '❌ Insuficiencia hepática moderada a severa',
        '❌ Embarazo (categoría D) o lactancia',
        '❌ Trastorno de personalidad como único diagnóstico',
        '❌ Prescripción crónica sin diagnóstico estructurado',
      ],
      layout_position: 'main',
    },
    {
      id: 'clot-dosis',
      type: 'flowchart',
      color: 'green',
      order: 2,
      title: 'Dosis y Pautas de Uso — Policlínico HCSFB',
      content: 'Esquemas posológicos según indicación clínica',
      details: [
        'Ansiedad situacional aguda: 5–10 mg VO cada 8–12h × 3–7 días (sin repetición automática)',
        'Puente ISRS: 5 mg cada 12h × 2–4 semanas; iniciar ISRS en paralelo desde el día 1',
        'Insomnio por ansiedad: 5 mg nocturno × máx 14 días',
        'Retiro gradual si uso > 2 semanas: reducir 25% de dosis cada semana',
        'Derivar a psicólogo o psiquiatría si se requieren más de 2 ciclos',
        'Farmacia registra dispensación — cantidad máxima por receta: 30 comprimidos',
      ],
      layout_position: 'main',
    },
    {
      id: 'clot-mermaid',
      type: 'mermaid',
      order: 3,
      title: 'Algoritmo de Decisión — Uso de Clotiazepam',
      content: `flowchart TD
    A([Paciente con síntomas ansiosos]) --> B{¿Medidas no farmacológicas\\nimplementadas?}
    B -->|No| C[Iniciar: psicoeducación,\\ntécnicas de relajación,\\nactividad física]
    C --> D{¿Respuesta\\ninsuficiente en\\n1–2 semanas?}
    D -->|No| FIN1([Alta o seguimiento])
    D -->|Sí| E
    B -->|Sí — insuficiente| E{¿Contraindicaciones\\npresentes?}
    E -->|Sí| F[EVITAR clotiazepam\\nDerivación psicología/psiquiatría]
    E -->|No| G{¿Edad ≥ 65 años?}
    G -->|Sí| H[EVITAR clotiazepam\\nConsiderar buspirona o\\nderivación psiquiatría]
    G -->|No| I{Tipo de\\npresentación}
    I -->|Situacional aguda| J[Clotiazepam 5–10 mg c/8–12h\\n× 3–7 días]
    I -->|Puente inicio ISRS| K[Clotiazepam 5 mg c/12h × 2–4 sem\\n+ ISRS desde día 1]
    I -->|Insomnio por ansiedad| L[Clotiazepam 5 mg nocturno\\n× máx 14 días]
    J --> M{¿Requiere nuevo\\nciclo?}
    K --> M
    L --> M
    M -->|No| FIN2([Alta con plan de seguimiento])
    M -->|Sí| N[Derivación psicólogo/psiquiatra]`,
      layout_position: 'main',
    },
    {
      id: 'clot-retiro',
      type: 'flowchart',
      color: 'amber',
      order: 4,
      title: 'Retiro Gradual y Seguimiento',
      content: 'Pauta de descontinuación y monitoreo post-uso',
      details: [
        'Uso < 2 semanas: retiro abrupto generalmente seguro',
        'Uso 2–4 semanas: reducir 25% de dosis por semana (ej: 10→7.5→5→2.5→0 mg)',
        'Uso > 4 semanas: retiro muy gradual con reducción 10% por semana — derivar psiquiatría',
        'Síntomas de abstinencia: ansiedad rebote, insomnio, irritabilidad, sudoración',
        'Control médico a las 2 semanas tras inicio de retiro',
        'Documentar en SOME: indicación, dosis, duración planificada y fecha de reevaluación',
      ],
      layout_position: 'main',
    },
  ],
};

// ─────────────────────────────────────────────────────────────
// 2. HCSFB 151 — Infiltración de Rodilla con Corticoides
// ─────────────────────────────────────────────────────────────
const INFILTRACION = {
  id: '5bb27846-3bb2-4833-a8f5-1774118b88d7',
  meta: {
    protocol_code:      'HCSFB 151',
    protocol_edition:   'Primera',
    protocol_date:      'Octubre 2025',
    protocol_validity:  'Octubre 2030',
    protocol_objective: 'Estandarizar el procedimiento de infiltración de rodilla con corticoides en el Programa de Gonartrosis del HCSFB, asegurando técnica segura, indicaciones correctas y seguimiento adecuado.',
    protocol_authors: [
      { name: 'Dr. Felipe Sancho Tapia',  role: 'Elaborador — Subdirector Médico HCSFB' },
      { name: 'Dr. Álvaro Lagos Llanos',   role: 'Aprobador — Director HCSFB' },
      { name: 'EU María Teresa Medina Bravo', role: 'Revisora — OFICYSP HCSFB' },
    ],
  },
  blocks: [
    {
      id: 'infil-indicaciones',
      type: 'criteria',
      color: 'blue',
      order: 1,
      title: 'Indicaciones y Contraindicaciones',
      content: 'Criterios de selección del paciente para infiltración local en el Programa Gonartrosis HCSFB',
      items: [
        '✅ Gonartrosis grado II–IV (Kellgren-Lawrence) con dolor moderado-severo (EVA ≥ 4)',
        '✅ Respuesta insuficiente a AINES + kinesiterapia por ≥ 4 semanas',
        '✅ Derrame articular activo con limitación funcional',
        '❌ Infección articular activa o celulitis periarticular',
        '❌ Articulación protésica',
        '❌ Trastorno de la coagulación o anticoagulación plena',
        '❌ Alergia conocida a corticoides',
        '❌ Hiperglicemia no controlada (glicemia > 250 mg/dL)',
        '❌ Intervalo < 3 meses desde infiltración previa en la misma rodilla',
      ],
      layout_position: 'main',
    },
    {
      id: 'infil-tecnica',
      type: 'flowchart',
      color: 'green',
      order: 2,
      title: 'Técnica de Infiltración — Policlínico HCSFB',
      content: 'Pasos del procedimiento para infiltración suprapatelar con abordaje lateral',
      details: [
        '1. Consentimiento informado firmado y registrado en ficha clínica',
        '2. Posición: decúbito supino con rodilla en extensión completa sobre camilla',
        '3. Preparación: campo estéril, guantes estériles, povidona yodada zona suprapatelar lateral',
        '4. Fármaco: Betametasona 7 mg/mL (2 mL) + Lidocaína 2% (2 mL) = 4 mL total en jeringa 5 mL',
        '5. Aguja 21G × 1.5" (verde); inserción: borde lateral superior de la rótula, 45° hacia medial',
        '6. Verificar posición aspirando antes de inyectar (fluido sinovial o sin resistencia)',
        '7. Inyección lenta, sin resistencia; si hay resistencia — reposicionar aguja',
        '8. Curar con gasa estéril, sin necesidad de sutura ni apósito compresivo',
        '9. Reposo articular 24–48 horas post-procedimiento (evitar caminata prolongada)',
        '10. Advertir: posible "flare" post-inyección (dolor 12–24h) — AINES si necesario',
      ],
      layout_position: 'main',
    },
    {
      id: 'infil-seguimiento',
      type: 'flowchart',
      color: 'amber',
      order: 3,
      title: 'Seguimiento y Frecuencia Máxima',
      content: 'Control post-infiltración y limitaciones del programa',
      details: [
        'Control médico a las 4 semanas para evaluar respuesta (EVA, funcionalidad, movilidad)',
        'Efecto esperado: inicio 24–48h, máximo a los 7–10 días, duración 4–12 semanas',
        'Frecuencia máxima: 3 infiltraciones por rodilla por año (máx 3 años consecutivos)',
        'Derivar a traumatología si: respuesta < 4 semanas, progresión estructural, prótesis indicada',
        'Monitorear glicemia en diabéticos: puede subir transitoriamente 24–72h post-infiltración',
        'Registrar en SOME: fecha, fármaco, dosis, rodilla tratada, EVA pre y post',
      ],
      layout_position: 'main',
    },
    {
      id: 'infil-complicaciones',
      type: 'criteria',
      color: 'red',
      order: 4,
      title: 'Complicaciones y Manejo',
      content: 'Señales de alarma y conducta ante complicaciones post-infiltración',
      items: [
        'Infección articular (artritis séptica): fiebre, eritema, calor, derrame — derivación urgencias inmediata',
        'Flare post-inyección: dolor transitorio 12–24h — AINES, hielo local, no requiere consulta salvo que persista > 72h',
        'Atrofia cutánea local: evitar inyección subcutánea; garantizar acceso intraarticular',
        'Hiperglicemia en diabéticos: control glicémico a las 24–72h si diabetes descompensada',
        'Tendinitis post-inyección: evitar técnica peritendinosa',
      ],
      layout_position: 'sidebar',
    },
  ],
};

// ─────────────────────────────────────────────────────────────
// 3. HCSFB 138 — Telemedicina para Patologías GES
// ─────────────────────────────────────────────────────────────
const TELEMEDICINA = {
  id: '58b11a9e-eb80-4af3-9eb7-7fa1f86631e2',
  meta: {
    protocol_code:      'HCSFB 138',
    protocol_edition:   'Primera',
    protocol_date:      'Mayo 2025',
    protocol_validity:  'Mayo 2030',
    protocol_objective: 'Establecer el flujo operativo para la atención por telemedicina de patologías GES en el HCSFB, definiendo las plataformas disponibles, responsables del proceso y pasos para la solicitud y realización de teleconsultas.',
    protocol_authors: [
      { name: 'Dra. Micaela Fasani Montagna', role: 'Elaboradora — Subdirectora Médica HCSFB' },
      { name: 'Valeska Vivallo Poblete',        role: 'Revisora — OFICYSP HCSFB' },
      { name: 'Dr. Álvaro Lagos Llanos',         role: 'Aprobador — Director HCSFB' },
    ],
  },
  blocks: [
    {
      id: 'tele-plataformas',
      type: 'flowchart',
      color: 'blue',
      order: 1,
      title: 'Plataformas Disponibles — HCSFB',
      content: 'Sistemas de telemedicina activos y sus usos en el flujo GES del HCSFB',
      details: [
        'Teleprocesos MINSAL: interconsultas electrónicas a especialistas de nivel secundario (HHM)',
        'Hospital Digital MINSAL: teleconsulta médico-paciente para seguimiento GES (agendado)',
        'Unitel HCHM (Hospital Chillán): telemedicina de imágenes (ECG, Rx, ecografías)',
        'Plataforma de Telesalud Regional BI0BÍO: disponible para salud mental y morbilidad crónica',
        'Correo institucional seguro: intercambio de información clínica entre niveles para coordinación',
      ],
      layout_position: 'main',
    },
    {
      id: 'tele-ges',
      type: 'text',
      color: 'blue',
      order: 2,
      title: 'Patologías GES con Telemedicina Disponible',
      content: 'Patologías GES con flujo activo de telemedicina en el HCSFB al momento del protocolo',
      details: [
        'Diabetes Mellitus tipo 2: control endocrinología por Hospital Digital',
        'Hipertensión Arterial: teleconsulta cardiología según riesgo cardiovascular',
        'Epilepsia no refractaria: seguimiento neurología por Teleprocesos',
        'Trastorno bipolar / Esquizofrenia: psiquiatría vía Telesalud Regional',
        'Retinopatía Diabética: retinografía con lectura remota por oftalmología HHM',
        'EPOC: espirometría + teleconsulta broncopulmonar',
        'Artritis Reumatoide: reumatología vía Teleprocesos',
        'VIH/SIDA: infectología por Hospital Digital (confidencialidad reforzada)',
      ],
      layout_position: 'main',
    },
    {
      id: 'tele-mermaid',
      type: 'mermaid',
      order: 3,
      title: 'Flujo Operativo de Telemedicina — HCSFB',
      content: `flowchart TD
    A([Paciente GES requiere\\nevaluación especialista]) --> B{¿Patología en lista\\nde telemedicina\\nactiva?}
    B -->|No| C[Interconsulta\\npresencial habitual\\nvía SOME/Régimen GES]
    B -->|Sí| D{¿Qué plataforma\\ncorresponde?}
    D -->|Teleprocesos| E[Médico HCSFB ingresa IC\\nen Teleprocesos MINSAL]
    D -->|Hospital Digital| F[Secretaría agenda\\npaciente en Hospital Digital]
    D -->|Unitel / imágenes| G[Técnico paramédico\\nenvía estudio digital\\na HHM]
    D -->|Telesalud Regional| H[SOME gestiona acceso\\na plataforma regional]
    E --> I[Especialista HHM\\nresponde vía plataforma\\nen plazo GES]
    F --> J[Paciente conecta desde\\nhogaro CESFAM el día acordado]
    G --> K[Radiólogo/cardiólogo\\nHHM emite informe remoto]
    H --> L[Psiquiatra/especialista\\nrealiza teleconsulta]
    I --> M[Médico HCSFB recibe\\ninforme e implementa plan]
    J --> M
    K --> M
    L --> M
    M --> N{¿Problema resuelto?}
    N -->|Sí| O([Seguimiento APS\\nen HCSFB])
    N -->|No| P[Derivación presencial\\ncon informe de teleconsulta]`,
      layout_position: 'main',
    },
    {
      id: 'tele-responsabilidades',
      type: 'criteria',
      color: 'amber',
      order: 4,
      title: 'Responsabilidades por Rol',
      content: 'Quién hace qué en el flujo de telemedicina HCSFB',
      items: [
        'Médico tratante: solicita teleconsulta, prepara resumen clínico, implementa recomendaciones del especialista',
        'Secretaría/SOME: agenda en Hospital Digital, notifica al paciente, registra en SOME',
        'Técnico paramédico: realiza ECG, Rx o ecografía y sube a Unitel correctamente rotulada',
        'Enfermería: prepara al paciente, verifica conectividad, acompaña teleconsulta si necesario',
        'TIC institucional: mantiene equipos, cámaras y acceso a plataformas actualizado',
      ],
      layout_position: 'main',
    },
  ],
};

// ─────────────────────────────────────────────────────────────
// 4. HCSFB 166 — Criterios SM (Ingreso / Derivación / Egreso)
// ─────────────────────────────────────────────────────────────
const CRITERIOS_SM = {
  id: 'fa57bf50-f39c-4438-af5e-bfa33be36fce',
  meta: {
    protocol_code:      'HCSFB 166',
    protocol_edition:   'Primera',
    protocol_date:      'Marzo 2026',
    protocol_validity:  'Marzo 2031',
    protocol_objective: 'Establecer los criterios clínicos para ingreso, derivación y egreso de pacientes con diagnóstico de salud mental en el HCSFB, garantizando una atención escalonada y segura.',
    protocol_authors: [
      { name: 'Dr. Rodrigo Enríquez Heredia',   role: 'Elaborador — Jefe PROSAM/Programa SM HCSFB' },
      { name: 'Dra. Micaela Fasani Montagna',    role: 'Revisora — Subdirectora Médica HCSFB' },
      { name: 'Valeska Vivallo Poblete',           role: 'Revisora — OFICYSP HCSFB' },
      { name: 'Dr. Álvaro Lagos Llanos',           role: 'Aprobador — Director HCSFB' },
    ],
  },
  blocks: [
    {
      id: 'csm-criterios',
      type: 'criteria',
      color: 'blue',
      order: 1,
      title: 'Criterios de Ingreso al Programa SM — HCSFB',
      content: 'Diagnósticos que permiten ingreso al PROSAM del HCSFB para seguimiento ambulatorio',
      items: [
        'Trastorno depresivo mayor (episodio leve a moderado sin riesgo suicida activo)',
        'Trastorno de ansiedad generalizada, pánico, fobia social — sin complicaciones agudas',
        'Trastorno bipolar estabilizado (eutimia, adherente, sin hospitalización reciente)',
        'Esquizofrenia en fase de mantenimiento — sin síntomas positivos activos',
        'Abuso de sustancias en fase de abstinencia o reducción de daño controlada',
        'Trastorno de personalidad — sin crisis aguda ni conducta autolesiva activa',
        'Seguimiento post-alta hospitalaria psiquiátrica (primeros 30 días)',
      ],
      layout_position: 'main',
    },
    {
      id: 'csm-derivacion',
      type: 'criteria',
      color: 'red',
      order: 2,
      title: 'Criterios de Derivación a Nivel Secundario (HHM)',
      content: 'Indicaciones de derivación a psiquiatría del Hospital Herminda Martín',
      items: [
        'Episodio depresivo severo con riesgo suicida moderado-alto',
        'Primera descompensación psicótica aguda',
        'Trastorno bipolar con episodio maníaco o depresivo grave',
        'Trastorno de personalidad con crisis reiterativas o autolesiones que no responden a manejo local',
        'Dependencia severa de alcohol u otras sustancias (requiere desintoxicación supervisada)',
        'Diagnóstico incierto o necesidad de evaluación psiquiátrica formal',
        'Ajuste o inicio de clozapina, litio u otros fármacos de manejo especializado',
        'Solicitar hora en HHM por Teleprocesos o Telesalud Regional',
      ],
      layout_position: 'main',
    },
    {
      id: 'csm-mermaid',
      type: 'mermaid',
      order: 3,
      title: 'Flujo de Decisión — Ingreso, Derivación y Egreso SM',
      content: `flowchart TD
    A([Consulta médica o PROSAM\\npor problema de SM]) --> B{¿Cumple criterio\\nde ingreso PROSAM?}
    B -->|No| C[Manejo médico general\\no psicoeducación puntual]
    B -->|Sí| D{¿Criterio de\\nderivación HHM?}
    D -->|Sí| E[Derivación vía Teleprocesos\\no Telesalud Regional\\na Psiquiatría HHM]
    D -->|No| F[Ingreso a PROSAM HCSFB]
    F --> G[Plan de tratamiento:\\nmédico + psicólogo + TS]
    G --> H{Control a 4 semanas:\\n¿respuesta adecuada?}
    H -->|Sí| I{¿Criterio de egreso?}
    H -->|No| J{¿Agravamiento\\no riesgo?}
    J -->|Sí| E
    J -->|No| K[Ajuste de plan\\nControl en 4 semanas]
    K --> H
    I -->|Sí| L([Egreso PROSAM\\ncon plan de autocuidado])
    I -->|No| M[Continuar seguimiento\\nsemestral en PROSAM]`,
      layout_position: 'main',
    },
    {
      id: 'csm-egreso',
      type: 'flowchart',
      color: 'green',
      order: 4,
      title: 'Criterios de Egreso del Programa SM',
      content: 'Condiciones que permiten el egreso del PROSAM con plan de autocuidado',
      details: [
        'Remisión sintomática sostenida ≥ 6 meses con funcionalidad recuperada',
        'Adherencia confirmada a tratamiento farmacológico y psicológico',
        'Red de apoyo familiar o comunitaria funcional',
        'Sin hospitalizaciones ni crisis en los últimos 6 meses',
        'Plan de autocuidado conocido por el paciente: señales de alarma + contacto de crisis',
        'Egreso debe ser acordado con el paciente y registrado en SOME con plan de reconsulta',
      ],
      layout_position: 'main',
    },
  ],
};

// ─────────────────────────────────────────────────────────────
// 5. HCSFB 160 — Prevención de Autolesiones y Suicidio (ASQ)
// ─────────────────────────────────────────────────────────────
const SUICIDIO = {
  id: 'c0aecd59-f807-4c2e-af91-408d5f5928b3',
  meta: {
    protocol_code:      'HCSFB 160',
    protocol_edition:   'Primera',
    protocol_date:      'Febrero 2026',
    protocol_validity:  'Febrero 2031',
    protocol_objective: 'Estandarizar la detección y manejo del riesgo suicida en pacientes hospitalizados mediante el instrumento ASQ (Ask Suicide-Screening Questions), garantizando una respuesta escalonada y documentada.',
    protocol_authors: [
      { name: 'Dr. Rodrigo Enríquez Heredia',   role: 'Elaborador — Jefe PROSAM/Programa SM HCSFB' },
      { name: 'Dra. Micaela Fasani Montagna',    role: 'Revisora — Subdirectora Médica HCSFB' },
      { name: 'EU María Teresa Medina Bravo',    role: 'Revisora — OFICYSP HCSFB' },
      { name: 'Dr. Álvaro Lagos Llanos',           role: 'Aprobador — Director HCSFB' },
    ],
  },
  blocks: [
    {
      id: 'asq-screening',
      type: 'text',
      color: 'blue',
      order: 1,
      title: 'Instrumento ASQ — Cuatro Preguntas de Tamizaje',
      content: 'Las 4 preguntas del Ask Suicide-Screening Questions (ASQ) aplicadas en la admisión hospitalaria HCSFB',
      details: [
        '1. "En las últimas semanas, ¿ha deseado estar muerto/a?"',
        '2. "En las últimas semanas, ¿ha tenido pensamientos de quitarse la vida?"',
        '3. "¿Alguna vez ha intentado quitarse la vida?"',
        '4. "Ahora mismo, ¿está pensando en quitarse la vida?"',
        'Resultado POSITIVO: al menos UNA respuesta "Sí"',
        'Aplicación: por enfermería en admisión hospitalaria; formulario disponible en OIRS/SOME',
        'Tiempo de aplicación: 2–3 minutos; se registra en hoja de admisión de enfermería',
      ],
      layout_position: 'main',
    },
    {
      id: 'asq-mermaid',
      type: 'mermaid',
      order: 2,
      title: 'Algoritmo ASQ — Respuesta por Nivel de Riesgo',
      content: `flowchart TD
    A([Admisión hospitalaria\\nenfermería aplica ASQ]) --> B{¿Resultado\\nASQ?}
    B -->|Negativo\\ntodas 'No'| C[Registro en SOME\\nSin intervención adicional]
    B -->|Positivo\\n≥1 respuesta 'Sí'| D{¿Pregunta 4\\npositiva?\\n'Ahora mismo...'\\n}
    D -->|Sí — ideación activa| E[RIESGO ALTO]
    D -->|No — ideación pasada/intento previo| F{¿Pregunta 3\\npositiva?\\nIntento previo}
    F -->|Sí| G[RIESGO MODERADO-ALTO]
    F -->|No — solo ideación pasiva| H[RIESGO MODERADO]
    E --> I[Avisar médico de turno INMEDIATO\\nVigil 1:1 por enfermería\\nRetirar objetos cortopunzantes\\nEvaluar traslado UPH/psiquiatría]
    G --> J[Aviso médico en < 30 min\\nEvaluación psiquiátrica o PROSAM\\nPlan de seguridad documentado]
    H --> K[Aviso médico en < 2 horas\\nEvaluación psicológica o médica\\nPsicoeducación y red de apoyo]
    I --> L[Registrar en SOME:\\nASQ, acciones y responsable]
    J --> L
    K --> L
    L --> M{¿Alta desde hospitalización?}
    M -->|Sí| N[Plan de egreso con\\ncontacto crisis + PROSAM]
    M -->|No| O([Reevaluar ASQ\\ncada 24h en riesgo activo])`,
      layout_position: 'main',
    },
    {
      id: 'asq-seguridad',
      type: 'criteria',
      color: 'red',
      order: 3,
      title: 'Medidas de Seguridad Ambiental',
      content: 'Intervenciones ambientales para pacientes con ASQ positivo en el HCSFB',
      items: [
        'Retirar objetos de riesgo: agujas, bisturíes, cinturones, cables, fármacos del velador',
        'Cama sin ropa de cama extra (evitar riesgos de asfixia)',
        'Ventanas cerradas y aseguradas en habitación del paciente',
        'Visitas supervisadas para ASQ riesgo alto; sin visitas solitarias nocturnas',
        'Vigil 1:1: enfermera o técnico de turno en línea visual directa con el paciente',
        'Llamado de enfermería al alcance visual del equipo, no solo del paciente',
      ],
      layout_position: 'main',
    },
    {
      id: 'asq-egreso',
      type: 'flowchart',
      color: 'green',
      order: 4,
      title: 'Plan de Egreso con Riesgo Suicida',
      content: 'Acciones mínimas obligatorias al dar el alta a un paciente con ASQ positivo previo',
      details: [
        '1. Número de teléfono de crisis: SALUD MENTAL RESPONDE 600-360-7777 (24/7)',
        '2. Contacto familiar o referente de apoyo confirmado y notificado',
        '3. Citación a PROSAM HCSFB en los próximos 5 días hábiles',
        '4. Plan de seguridad firmado por paciente y familiar (formulario OIRS)',
        '5. Fármacos dispensados en cantidad limitada (7–14 días) si hay riesgo residual',
        '6. Médico de turno documenta en SOME: plan, ASQ al egreso, responsable de seguimiento',
      ],
      layout_position: 'main',
    },
  ],
};

// ─────────────────────────────────────────────────────────────
// 6. GCL 1.13 — Anticoagulación Oral / TACO
// ─────────────────────────────────────────────────────────────
const TACO = {
  id: 'b5020c15-94b1-4885-a177-f145682c8ff0',
  meta: {
    protocol_code:      'GCL 1.13',
    protocol_edition:   'Primera',
    protocol_date:      '2023',
    protocol_validity:  '2028',
    protocol_objective: 'Establecer el flujo de atención del Policlínico TACO del HCSFB, incluyendo el manejo del rango terapéutico, ajuste de dosis de warfarina, criterios de derivación y seguimiento del paciente anticoagulado.',
    protocol_authors: [
      { name: 'Comité de Calidad y Seguridad del Paciente HCSFB', role: 'Elaborador' },
      { name: 'Servicio de Medicina Interna HCSFB',                role: 'Revisor' },
      { name: 'EU María Teresa Medina Bravo',                      role: 'Revisora — OFICYSP' },
      { name: 'Dr. Álvaro Lagos Llanos',                            role: 'Aprobador — Director HCSFB' },
    ],
  },
  blocks: [
    {
      id: 'taco-indicaciones',
      type: 'criteria',
      color: 'blue',
      order: 1,
      title: 'Indicaciones de Anticoagulación con Warfarina',
      content: 'Patologías con indicación de warfarina que se atienden en Policlínico TACO HCSFB',
      items: [
        'Fibrilación auricular no valvular (objetivo INR 2.0–3.0)',
        'Trombosis venosa profunda o tromboembolismo pulmonar (INR 2.0–3.0)',
        'Válvula cardíaca mecánica (objetivo INR según tipo de prótesis: 2.0–3.5)',
        'Síndrome antifosfolípido (INR 2.0–3.0 o 3.0–4.0 según perfil)',
        'Miocardiopatía dilatada con trombo intracavitario confirmado',
      ],
      layout_position: 'main',
    },
    {
      id: 'taco-mermaid',
      type: 'mermaid',
      order: 2,
      title: 'Algoritmo de Ajuste INR — Policlínico TACO HCSFB',
      content: `flowchart TD
    A([Paciente TACO en control\\nINR reciente disponible]) --> B{Resultado INR}
    B -->|INR < 1.5| C[Subterapeútico severo\\nAumentar dosis 15–20%\\nControl en 1 semana]
    B -->|INR 1.5–1.9| D[Subterapeútico leve\\nAumentar dosis 5–10%\\nControl en 2 semanas]
    B -->|INR 2.0–3.0| E[✅ Rango terapéutico\\nMantener dosis\\nControl en 4 semanas]
    B -->|INR 3.1–4.4| F[Levemente elevado\\nReducir dosis 5–10%\\nControl en 2 semanas]
    B -->|INR 4.5–8.0| G{¿Sangrado activo?}
    B -->|INR > 8.0| H[URGENCIA\\nSuspender warfarina\\nVit K 2.5–5 mg VO/IV\\nDerivar urgencias]
    G -->|No| I[Suspender warfarina 1–2 días\\nVitamina K 1–2 mg VO\\nControl en 3–5 días]
    G -->|Sí| H
    C --> J[Educar sobre adherencia\\ny causas de variación]
    D --> J
    E --> J
    F --> J
    I --> J
    J --> K{¿Factores desencadenantes?}
    K -->|Dieta, fármacos, EF| L[Intervenir factores\\ny registrar en SOME]
    K -->|No identificado| M([Próximo control según\\nfrecuencia asignada])`,
      layout_position: 'main',
    },
    {
      id: 'taco-interacciones',
      type: 'flowchart',
      color: 'amber',
      order: 3,
      title: 'Interacciones Relevantes y Factores de Variabilidad',
      content: 'Causas frecuentes de descontrol del INR en el Policlínico TACO HCSFB',
      details: [
        'AUMENTAN INR: antibióticos (metronidazol, ciprofloxacino, fluconazol), AINEs, amiodarona, statinas en altas dosis',
        'DISMINUYEN INR: rifampicina, carbamazepina, dieta rica en vitamina K (brócoli, espinaca, col), alcohol crónico',
        'Diarrea o vómitos > 48h: absorción errática — controlar INR en 5 días',
        'Cambios de peso > 5 kg: revisar dosis',
        'Enfermedades agudas febriles: INR puede subir transitoriamente',
        'Siempre preguntar nuevos fármacos (incluso suplementos, hierbas) antes de dar el alta de la consulta',
      ],
      layout_position: 'main',
    },
    {
      id: 'taco-seguimiento',
      type: 'criteria',
      color: 'green',
      order: 4,
      title: 'Frecuencia de Controles — Programa TACO HCSFB',
      content: 'Periodicidad según estabilidad del INR en el policlínico local',
      items: [
        'INR fuera de rango o inicio/cambio de dosis: control en 1–2 semanas',
        'INR en rango en 2 controles consecutivos: control cada 4 semanas',
        'INR en rango en 4–6 controles consecutivos: control cada 6–8 semanas (máx)',
        'Indicador de calidad: meta ≥ 65% de pacientes en rango terapéutico (TTR ≥ 65%)',
        'QF HCSFB revisa lista de pacientes TACO mensualmente y alerta a médico casos fuera de rango',
        'Derivar a hematología/medicina interna HHM si TTR < 50% tras 6 meses de seguimiento local',
      ],
      layout_position: 'main',
    },
  ],
};

// ─────────────────────────────────────────────────────────────
// Main — iterate over all 6 protocols
// ─────────────────────────────────────────────────────────────
const UPDATES = [CLOTIAZEPAM, INFILTRACION, TELEMEDICINA, CRITERIOS_SM, SUICIDIO, TACO];

for (const { id, meta, blocks } of UPDATES) {
  console.log(`\n📋 ${meta.protocol_code} — ${id}`);
  console.log(`   Bloques: ${blocks.length} | Mermaid: ${blocks.some(b => b.type === 'mermaid') ? '✅' : '❌'}`);
  console.log(`   Autores: ${meta.protocol_authors.map(a => a.name).join(', ')}`);

  if (!APPLY) continue;

  const { error } = await supabase
    .from('topics')
    .update({ ...meta, has_local_protocol: true, content_blocks: blocks })
    .eq('id', id);

  if (error) {
    console.error(`   ❌ Error: ${error.message}`);
  } else {
    console.log(`   ✅ Actualizado correctamente`);
  }
}

if (!APPLY) {
  console.log('\n⚠️  Modo dry-run. Agrega --apply para escribir en la base de datos.');
}
