/**
 * Inserta los protocolos nuevos de Urgencias en la plataforma.
 * Protocolos: RCP Adultos, Código Azul, Trombolisis, TEC, Disyunción AC, RCP Pediátrico, Intento Suicida
 *
 * Uso:  node scripts/insert-protocolos-urgencias.mjs
 *       node scripts/insert-protocolos-urgencias.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const APPLY = process.argv.includes('--apply');
const CAT_URGENCIAS = '696ea6ff245ef362de4f431f';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

const PROTOCOLS = [

  // ── 1. RCP ADULTOS ──────────────────────────────────────────────
  {
    id: randomUUID(),
    name: 'Reanimación Cardiopulmonar Avanzada en Adultos',
    description: 'Protocolo de RCP avanzado en adultos basado en guías AHA 2020. Aplica a Servicio de Urgencia y Médico Quirúrgico del HCSFB.',
    category_id: CAT_URGENCIAS,
    has_local_protocol: true,
    status: 'published',
    protocol_code: 'GCL 1.4',
    protocol_edition: 'Cuarta',
    protocol_date: 'Julio 2023',
    protocol_validity: 'Julio 2028',
    protocol_objective: 'Aumentar la efectividad y supervivencia a través de un RCP temprano y bien realizado, estableciendo el procedimiento de reanimación cardiopulmonar avanzada en adultos dentro de la institución.',
    protocol_file_url: '',
    protocol_authors: [
      { name: 'Dr. Rodrigo Enríquez Heredia', role: 'Elaborador — Médico EDF HCSFB' },
      { name: 'Dr. Felipe Sancho Tapia',       role: 'Elaborador — Médico EDF HCSFB' },
      { name: 'Dr. Maicol Candia Sandoval',    role: 'Revisor — Subdirector Médico HCSFB' },
      { name: 'Dr. Álvaro Lagos Llanos',       role: 'Aprobador — Director HCSFB' },
    ],
    tags: ['RCP', 'Paro cardiorrespiratorio', 'Reanimación', 'Código azul', 'Urgencias'],
    tipo_contenido: ['protocolo'],
    content_blocks: [
      {
        id: 'rcp-roles',
        type: 'flowchart',
        color: 'blue',
        order: 0,
        title: 'Roles del Equipo en PCR',
        content: 'Distribución de funciones según servicio (Médico Quirúrgico, Urgencia o Maternidad)',
        details: [
          'Médico de Turno: Líder del equipo, manejo de vía aérea, prescripción de fármacos, informar a familia',
          'Enfermero(a): Acceso venoso, desfibrilador, descarga eléctrica',
          'Paramédico PM1: Registros en ficha clínica',
          'Paramédico PM2: Masaje cardíaco externo (rotar cada 2 min / 5 ciclos)',
          'Paramédico PM3: Monitor cardíaco + preparación y suministro de medicamentos',
          'En otro servicio o pasillos: Activar Código Azul al 425974 y trasladar a Urgencias',
        ],
        layout_position: 'main',
      },
      {
        id: 'rcp-cabd',
        type: 'flowchart',
        color: 'red',
        order: 1,
        title: 'CABD Primario — Secuencia de Reanimación',
        content: 'Basado en guías AHA 2020 — algoritmo de intervención inmediata',
        details: [
          'C — Circulación: Verificar pulso en ≤ 10 seg. Si ausente → compresiones 100–120/min, 4–5 cm de profundidad, ciclos 30:2',
          'A — Vía Aérea: Apertura frente-mentón o tracción mandibular',
          'B — Respiración: 2 ventilaciones de rescate (1 seg c/u, expansión torácica visible)',
          'D — Desfibrilación: FV/TV sin pulso → DEA lo antes posible. Bifásico 200J, monofásico 360J',
          'PCR presenciado < 4–5 min: desfibrilar inmediatamente',
          'PCR no presenciado > 4–5 min: 2 min de RCP ANTES de desfibrilar',
        ],
        layout_position: 'main',
      },
      {
        id: 'rcp-ritmos',
        type: 'flowchart',
        color: 'amber',
        order: 2,
        title: 'Ritmos de PCR y Tratamiento',
        content: 'Los 4 ritmos de PCR y su manejo farmacológico',
        details: [
          'FV / TV sin pulso (desfibrilables): descarga → RCP → Adrenalina 1 mg EV c/3–5 min (desde 2a descarga)',
          'FV / TV sin pulso persistente: después de 3a descarga → Amiodarona 300 mg EV (+ 150 mg si no revierte)',
          'AESP / Asistolia (no desfibrilables): RCP + Adrenalina 1 mg EV c/3–5 min desde inicio',
          'Buscar 6H y 5T: Hipovolemia, Hipoxia, H+ (acidosis), Hipotermia, Hipoglicemia, Hiper/hipokalemia',
          'Buscar 5T: Toxinas, Taponamiento, Neumotórax tensión, Trombosis coronaria/pulmonar, Trauma',
          'Suspender RCP si: circulación espontánea, enfermedad irreversible confirmada, o > 10 min sin inicio (excl. hipotérmicos, ahogados, niños)',
        ],
        layout_position: 'main',
      },
      {
        id: 'rcp-mermaid',
        type: 'mermaid',
        color: 'blue',
        order: 3,
        title: 'Algoritmo RCP — Ritmos Desfibrilables vs No Desfibrilables',
        content: `flowchart TD
    A([PCR — Solicitar DEA\\nIniciar RCP]) --> B{¿Ritmo\\ndesfibrilable?}
    B -->|FV / TV sin pulso| C[Descarga eléctrica\\nBifásico 200J]
    C --> D[2 min RCP\\nAcceso IV/IO]
    D --> E{¿Ritmo\\ndesfibrilable?}
    E -->|Sí| F[Descarga\\n+ Adrenalina 1mg c/3-5min]
    F --> G[2 min RCP]
    G --> H{¿Ritmo\\ndesfibrilable?}
    H -->|Sí| I[Descarga\\n+ Amiodarona 300mg]
    H -->|No| K
    B -->|AESP / Asistolia| J[Adrenalina 1mg IV\\nlo antes posible]
    J --> K[2 min RCP\\nBuscar 6H y 5T]
    K --> L{¿RCE?}
    L -->|Sí| M([Cuidados Post-PCR\\nEvitar hipoxia e hipotensión])
    L -->|No| B
    style A fill:#1e40af,color:#fff
    style M fill:#16a34a,color:#fff
    style C fill:#dc2626,color:#fff
    style I fill:#dc2626,color:#fff`,
        layout_position: 'main',
      },
      {
        id: 'rcp-embarazada',
        type: 'alert',
        color: 'orange',
        order: 4,
        title: 'RCP en Embarazada — Consideraciones Especiales',
        content: 'Manejo específico del paro cardiorrespiratorio en paciente gestante',
        details: [
          'Desplazamiento uterino lateral hacia la izquierda si útero a nivel umbilical o superior',
          'Priorizar oxigenación y manejo de vía aérea (mayor riesgo de hipoxia)',
          'NO monitoreo fetal durante reanimación — interfiere con maniobras',
          'Cesárea perimortem si no hay RCE en 5 minutos en gestación > 20 semanas',
          'IV por encima del diafragma · Suspender magnesio IV si estaba siendo administrado',
        ],
        layout_position: 'main',
      },
    ],
  },

  // ── 2. CÓDIGO AZUL ──────────────────────────────────────────────
  {
    id: randomUUID(),
    name: 'Sistema de Alerta — Código Azul HCSFB',
    description: 'Sistema de alerta y organización ante emergencias con riesgo vital en cualquier dependencia del Hospital Comunitario de Salud Familiar de Bulnes.',
    category_id: CAT_URGENCIAS,
    has_local_protocol: true,
    status: 'published',
    protocol_code: 'AOC 1.1',
    protocol_edition: 'Cuarta',
    protocol_date: 'Julio 2022',
    protocol_validity: 'Julio 2027',
    protocol_objective: 'Otorgar atención oportuna y eficaz a usuarios y funcionarios que presenten emergencia al interior del establecimiento, a través del reconocimiento e intervenciones anticipadas por el equipo de salud.',
    protocol_file_url: '',
    protocol_authors: [
      { name: 'Dra. Camila Gutiérrez Canales', role: 'Elaboradora — Médico EDF, Jefa Urgencia HCSFB' },
      { name: 'Dr. Maicol Candia Sandoval',    role: 'Revisor — Subdirector Médico HCSFB' },
      { name: 'Dr. Álvaro Lagos Llanos',       role: 'Aprobador — Director HCSFB' },
    ],
    tags: ['Código azul', 'PCR', 'RCP', 'Emergencia intrahospitalaria', 'Urgencias'],
    tipo_contenido: ['protocolo'],
    content_blocks: [
      {
        id: 'azul-pasos',
        type: 'flowchart',
        color: 'blue',
        order: 0,
        title: 'Pasos de Activación — Código Azul',
        content: 'Secuencia de acciones ante compromiso o pérdida de conciencia dentro del HCSFB',
        details: [
          '1. Reconocimiento: Cualquier funcionario detecta persona con pérdida / compromiso de conciencia',
          '2. Verificar respuesta: Golpe suave + "¿Está bien?" — si no responde → activar código azul',
          '3. Llamar al 425974 o 425902 (Urgencias): Identificarse, indicar "Código Azul" y ubicación exacta',
          '4. Si está capacitado en SVB: verificar pulso y respiración en ≤ 10 segundos',
          '5. Si sin pulso/respiración: iniciar compresiones torácicas hasta llegada del equipo de urgencia',
          '6. Equipo de urgencia asume el manejo y evalúa traslado a Servicio de Urgencia',
        ],
        layout_position: 'main',
      },
      {
        id: 'azul-mermaid',
        type: 'mermaid',
        color: 'red',
        order: 1,
        title: 'Flujograma Código Azul',
        content: `flowchart TD
    A([Paciente / Funcionario\\ncon compromiso de conciencia]) --> B[Verificar respuesta\\nGolpe + ¿Está bien?]
    B -->|No responde| C[Activar Código Azul\\nLlamar 425974 ó 425902\\nInformar nombre + ubicación]
    C --> D{¿Capacitado\\nen SVB?}
    D -->|Sí| E[Evaluar pulso y respiración\\nen 5-10 segundos]
    D -->|No| F[Permanecer junto al paciente\\nhasta equipo de urgencia]
    E -->|Sin pulso| G[Iniciar compresiones torácicas\\nContinuar hasta llegada de equipo]
    E -->|Con pulso| F
    G --> H([Equipo de Urgencia asume\\nmanejo y traslado])
    F --> H
    style A fill:#dc2626,color:#fff
    style C fill:#1e40af,color:#fff
    style H fill:#16a34a,color:#fff`,
        layout_position: 'main',
      },
    ],
  },

  // ── 3. TROMBOLISIS ──────────────────────────────────────────────
  {
    id: randomUUID(),
    name: 'Protocolo de Trombolisis — Infarto con SDST (IAMEST)',
    description: 'Protocolo de reperfusión farmacológica para IAMEST en pacientes del Hospital de Bulnes y su microrred. Estandariza el uso de Tenecteplase y Alteplase con criterios claros de indicación, contraindicación y manejo post-trombolisis.',
    category_id: CAT_URGENCIAS,
    has_local_protocol: true,
    status: 'published',
    protocol_code: 'HCSFB',
    protocol_edition: 'Primera',
    protocol_date: 'Marzo 2025',
    protocol_validity: 'Marzo 2030',
    protocol_objective: 'Estandarizar el procedimiento de trombolisis en IAMEST para pacientes de la microrred Bulnes (Santa Clara, Quillón), estableciendo criterios de indicación, dosificación, anticoagulación y manejo de complicaciones.',
    protocol_file_url: '',
    protocol_authors: [
      { name: 'Equipo Médico HCSFB', role: 'Elaboradores' },
      { name: 'Oficina Calidad y Seguridad del Paciente HCSFB', role: 'Revisora' },
    ],
    tags: ['IAMEST', 'Trombolisis', 'Tenecteplase', 'Alteplase', 'Infarto', 'Urgencias'],
    tipo_contenido: ['protocolo'],
    content_blocks: [
      {
        id: 'trombo-indicaciones',
        type: 'criteria',
        color: 'red',
        order: 0,
        title: 'Indicaciones de Trombolisis',
        content: 'Criterios para indicar trombolisis en IAMEST cuando no hay posibilidad de angioplastia primaria oportuna',
        items: [
          'IAMEST confirmado por ECG (elevación ST ≥ 2mm en ≥ 2 derivaciones contiguas)',
          'Inicio de síntomas < 12 horas',
          'Sin acceso a angioplastia primaria dentro de 120 minutos',
          'Paciente hemodinámicamente estable (no shock cardiogénico severo)',
          'Sin contraindicaciones absolutas',
        ],
        layout_position: 'main',
      },
      {
        id: 'trombo-dosificacion',
        type: 'flowchart',
        color: 'green',
        order: 1,
        title: 'Dosificación — Tenecteplase (TNK) por Peso',
        content: 'Administración en bolo IV único. Dosis ajustada por peso corporal',
        details: [
          '< 60 kg → 30 mg (6 mL) IV en bolo único',
          '60–69 kg → 35 mg (7 mL) IV en bolo único',
          '70–79 kg → 40 mg (8 mL) IV en bolo único',
          '80–89 kg → 45 mg (9 mL) IV en bolo único',
          '≥ 90 kg → 50 mg (10 mL) IV en bolo único',
          'Alteplase alternativa: 15 mg bolo IV + 0.75 mg/kg en 30 min + 0.5 mg/kg en 60 min (máx 100 mg)',
        ],
        layout_position: 'main',
      },
      {
        id: 'trombo-anticoagulacion',
        type: 'flowchart',
        color: 'blue',
        order: 2,
        title: 'Anticoagulación Acompañante',
        content: 'Manejo anticoagulante junto a la trombolisis según protocolo local',
        details: [
          'Heparina no fraccionada: bolo 60 UI/kg (máx 4000 UI) → infusión 12 UI/kg/h (máx 1000 UI/h)',
          'Enoxaparina: 30 mg IV bolo → 1 mg/kg SC c/12h (máx 100 mg por dosis)',
          'Reducir dosis de enoxaparina en mayores de 75 años: 0.75 mg/kg SC c/12h sin bolo IV',
          'Monitorear TTPK cada 6h si heparina no fraccionada (objetivo 50–70 seg)',
        ],
        layout_position: 'main',
      },
      {
        id: 'trombo-mermaid',
        type: 'mermaid',
        color: 'red',
        order: 3,
        title: 'Flujograma Trombolisis IAMEST',
        content: `flowchart TD
    A([Dolor torácico sugestivo\\nECG con SDST]) --> B{¿IAMEST confirmado\\ny < 12 horas?}
    B -->|No| Z([Manejo habitual\\nSin trombolisis])
    B -->|Sí| C{¿Angioplastia primaria\\ndisponible < 120 min?}
    C -->|Sí| D([Traslado urgente\\npara ACTP primaria])
    C -->|No| E{¿Contraindicaciones\\nabsolutas?}
    E -->|Sí| D
    E -->|No| F[Trombolisis indicada\\nConsentimiento informado]
    F --> G[Tenecteplase IV bolo\\nsegún peso]
    G --> H[Anticoagulación\\nHeparina o Enoxaparina]
    H --> I[Monitoreo 24h\\nECG seriado + TA + SV]
    I --> J{¿Criterios de reperfusión\\na los 60-90 min?}
    J -->|Sí| K([Éxito → Traslado electivo\\npara coronariografía])
    J -->|No| L([Fallo → Traslado urgente\\npara ACTP de rescate])
    style A fill:#dc2626,color:#fff
    style D fill:#1e40af,color:#fff
    style K fill:#16a34a,color:#fff
    style L fill:#dc2626,color:#fff`,
        layout_position: 'main',
      },
    ],
  },

  // ── 4. TEC ADULTO ──────────────────────────────────────────────
  {
    id: randomUUID(),
    name: 'Manejo del Traumatismo Craneoencefálico del Adulto en Urgencias',
    description: 'Protocolo de manejo del TEC adulto en el Servicio de Urgencias del HCSFB. Clasifica severidad por GCS, establece neuroprotección y criterios de derivación al Hospital Herminda Martín.',
    category_id: CAT_URGENCIAS,
    has_local_protocol: true,
    status: 'published',
    protocol_code: 'HCSFB 130',
    protocol_edition: 'Primera',
    protocol_date: 'Abril 2025',
    protocol_validity: 'Abril 2030',
    protocol_objective: 'Estandarizar el enfoque diagnóstico, estabilización y criterios de derivación del TEC adulto en el Servicio de Urgencia del HCSFB.',
    protocol_file_url: '',
    protocol_authors: [
      { name: 'Equipo Médico de Urgencias HCSFB', role: 'Elaboradores' },
      { name: 'Oficina Calidad y Seguridad del Paciente HCSFB', role: 'Revisora' },
    ],
    tags: ['TEC', 'Traumatismo craneoencefálico', 'GCS', 'Urgencias', 'Neuroprotección'],
    tipo_contenido: ['protocolo'],
    content_blocks: [
      {
        id: 'tec-clasificacion',
        type: 'criteria',
        color: 'amber',
        order: 0,
        title: 'Clasificación por Escala de Coma de Glasgow (GCS)',
        content: 'Severidad del TEC según GCS al ingreso (apertura ocular + respuesta verbal + respuesta motora)',
        items: [
          'TEC Leve: GCS 14–15 — observación ≥ 4h, criterios de alta, educación a cuidadores',
          'TEC Moderado: GCS 9–13 — TC cerebral obligatorio, hospitalización, monitoreo neurológico estrecho',
          'TEC Grave: GCS ≤ 8 — manejo de vía aérea avanzada, intubación, derivación urgente al HHM',
        ],
        layout_position: 'main',
      },
      {
        id: 'tec-neuroproteccion',
        type: 'flowchart',
        color: 'blue',
        order: 1,
        title: 'Medidas de Neuroprotección',
        content: 'Intervenciones para minimizar el daño cerebral secundario',
        details: [
          'Oxigenación: SpO₂ ≥ 94% — intubar si GCS ≤ 8 o vía aérea comprometida',
          'Tensión arterial: PAM ≥ 80 mmHg (evitar hipotensión); evitar también hipertensión severa',
          'Glucosa: normoglicemia 80–180 mg/dL (evitar hipoglicemia e hiperglicemia)',
          'Cabecera a 30° — cuello en posición neutra sin compresión venosa',
          'Solución hipertónica (suero salino 3%) si signos de HTE (midriasis, respuesta extensora)',
          'Evitar corticoides (contraindicados en TEC grave según CRASH trial)',
        ],
        layout_position: 'main',
      },
      {
        id: 'tec-derivacion',
        type: 'criteria',
        color: 'red',
        order: 2,
        title: 'Criterios de Derivación Urgente al HHM',
        content: 'Indicaciones de traslado inmediato al Hospital Herminda Martín',
        items: [
          'TEC grave (GCS ≤ 8)',
          'Deterioro neurológico progresivo (caída de 2+ puntos en GCS)',
          'TC con hallazgos neuroquirúrgicos (hematoma epidural, subdural, contusión hemorrágica)',
          'Fractura de base de cráneo (hemotímpano, signo de Battle, ojos de mapache)',
          'Convulsiones post-TEC',
          'Politraumatismo grave asociado',
        ],
        layout_position: 'main',
      },
    ],
  },

  // ── 5. DISYUNCIÓN ACROMIOCLAVICULAR ─────────────────────────────
  {
    id: randomUUID(),
    name: 'Diagnóstico y Manejo de Disyunción Acromioclavicular',
    description: 'Protocolo para el diagnóstico y manejo de lesiones de la articulación acromioclavicular (AC) en el Servicio de Urgencias del HCSFB, utilizando la clasificación de Rockwood.',
    category_id: CAT_URGENCIAS,
    has_local_protocol: true,
    status: 'published',
    protocol_code: 'HCSFB 128',
    protocol_edition: 'Primera',
    protocol_date: 'Abril 2025',
    protocol_validity: 'Abril 2030',
    protocol_objective: 'Estandarizar el diagnóstico clínico y radiológico de la disyunción acromioclavicular, y orientar el manejo inicial y criterios de derivación según grado de Rockwood.',
    protocol_file_url: '',
    protocol_authors: [
      { name: 'Equipo Médico HCSFB', role: 'Elaboradores' },
      { name: 'Oficina Calidad y Seguridad del Paciente HCSFB', role: 'Revisora' },
    ],
    tags: ['Disyunción acromioclavicular', 'Rockwood', 'Hombro', 'Trauma', 'Urgencias'],
    tipo_contenido: ['protocolo'],
    content_blocks: [
      {
        id: 'dac-clasificacion',
        type: 'flowchart',
        color: 'blue',
        order: 0,
        title: 'Clasificación de Rockwood y Tratamiento',
        content: 'Gradación de la lesión AC y conducta terapéutica según severidad',
        details: [
          'Grado I: Esguince ligamentos AC, sin desplazamiento — Conservador: cabestrillo 1–2 semanas + AINES',
          'Grado II: Ruptura ligamentos AC, articulación subluxada — Conservador: cabestrillo 2–3 semanas + kinesiterapia',
          'Grado III: Ruptura completa, clavícula 100% desplazada — Controversia: conservador inicial, derivar a traumatología',
          'Grado IV–VI: Desplazamientos severos o posteriores — Quirúrgico: derivación urgente a traumatología HHM',
        ],
        layout_position: 'main',
      },
      {
        id: 'dac-imagen',
        type: 'text',
        color: 'blue',
        order: 1,
        title: 'Evaluación Radiológica',
        content: 'Proyecciones y medidas para clasificar correctamente la lesión',
        details: [
          'Radiografía bilateral de hombros AP en carga (peso 5 kg en cada mano)',
          'Espacio AC normal: < 3 mm; sospechoso: 3–5 mm; luxación: > 5 mm',
          'Espacio coracoclavicular normal: 11–13 mm; aumento > 25–50% → Grado III o superior',
          'Proyección axilar: evalúa desplazamiento posterior (Grado IV)',
        ],
        layout_position: 'main',
      },
    ],
  },

  // ── 6. RCP PEDIÁTRICO ───────────────────────────────────────────
  {
    id: randomUUID(),
    name: 'Reanimación Cardiopulmonar Pediátrica',
    description: 'Protocolo de RCP avanzado en pacientes pediátricos basado en guías AHA 2020. Aplica a Urgencia General y Gineco-Obstétrica del HCSFB.',
    category_id: CAT_URGENCIAS,
    has_local_protocol: true,
    status: 'published',
    protocol_code: 'GCL 1.4',
    protocol_edition: 'Cuarta',
    protocol_date: 'Febrero 2024',
    protocol_validity: 'Febrero 2029',
    protocol_objective: 'Establecer el procedimiento de reanimación cardiopulmonar avanzada en pacientes pediátricos en el HCSFB, adaptando técnicas y dosis farmacológicas según edad y peso.',
    protocol_file_url: '',
    protocol_authors: [
      { name: 'Equipo Clínico HCSFB', role: 'Elaboradores' },
      { name: 'Oficina Calidad y Seguridad del Paciente HCSFB', role: 'Revisora' },
    ],
    tags: ['RCP pediátrico', 'Reanimación infantil', 'PCR pediátrico', 'Urgencias'],
    tipo_contenido: ['protocolo'],
    content_blocks: [
      {
        id: 'rcpp-tecnica',
        type: 'flowchart',
        color: 'blue',
        order: 0,
        title: 'Técnica de Compresiones según Edad',
        content: 'Adaptación de la técnica RCP por grupo etario',
        details: [
          'Lactante (< 1 año): 2 dedos en esternón, 1–2 cm de profundidad, 100–120/min',
          'Niño (1 año – pubertad): talón de una mano, 1/3 del diámetro AP del tórax',
          'Sin vía aérea avanzada: ciclos 30:2 (1 reanimador) o 15:2 (2 reanimadores pediátricos)',
          'Con vía aérea avanzada: compresiones continuas a 100–120/min + 1 ventilación c/6 seg',
        ],
        layout_position: 'main',
      },
      {
        id: 'rcpp-farmacos',
        type: 'flowchart',
        color: 'red',
        order: 1,
        title: 'Farmacología Pediátrica en PCR',
        content: 'Dosis de fármacos ajustadas por peso',
        details: [
          'Adrenalina: 0.01 mg/kg IV/IO (máx 1 mg) c/3–5 min, sin límite de dosis',
          'Amiodarona: 5 mg/kg IV/IO bolo en FV/TV sin pulso (máx 300 mg)',
          'Lidocaína alternativa: 1 mg/kg IV/IO',
          'Atropina (bradicardia sintomática): 0.02 mg/kg IV (dosis mín. 0.1 mg; máx. 0.5 mg)',
          'Glucosa: 0.5–1 g/kg IV en hipoglicemia confirmada',
          'Acceso IO si no logra IV en < 60 seg durante PCR',
        ],
        layout_position: 'main',
      },
    ],
  },

  // ── 7. INTENTO SUICIDA (GCL 1.10) ───────────────────────────────
  {
    id: randomUUID(),
    name: 'Manejo de Pacientes con Intento Suicida en Urgencias',
    description: 'Protocolo para la atención, evaluación de riesgo y manejo del paciente con intento de suicidio o ideación suicida activa en el Servicio de Urgencias del HCSFB.',
    category_id: CAT_URGENCIAS,
    has_local_protocol: true,
    status: 'published',
    protocol_code: 'GCL 1.10',
    protocol_edition: 'Tercera',
    protocol_date: 'Noviembre 2022',
    protocol_validity: 'Noviembre 2027',
    protocol_objective: 'Establecer el procedimiento de evaluación del riesgo suicida y manejo clínico del paciente con intento suicida en Urgencias, incluyendo criterios de hospitalización y derivación.',
    protocol_file_url: '',
    protocol_authors: [
      { name: 'Equipo Clínico HCSFB', role: 'Elaboradores' },
      { name: 'Nut. Carmen Gloria Gutiérrez V.', role: 'Revisora OFICYSP' },
    ],
    tags: ['Intento suicida', 'Riesgo suicida', 'SAD PERSONS', 'Salud mental', 'Urgencias'],
    tipo_contenido: ['protocolo'],
    content_blocks: [
      {
        id: 'is-sad-persons',
        type: 'flowchart',
        color: 'red',
        order: 0,
        title: 'Escala SAD PERSONS — Evaluación de Riesgo Suicida',
        content: 'Sistema de puntuación para estratificar el riesgo de nuevo intento (0–10 puntos)',
        details: [
          'S — Sex (Sexo masculino): 1 pt',
          'A — Age (< 19 o > 45 años): 1 pt',
          'D — Depression (depresión activa): 1 pt',
          'P — Previous attempt (intento previo): 1 pt',
          'E — Ethanol/alcohol use (consumo): 1 pt',
          'R — Rational thinking loss (psicosis): 1 pt',
          'S — Social support lacking (sin red): 1 pt',
          'O — Organized plan (plan organizado): 1 pt',
          'N — No spouse (sin pareja): 1 pt',
          'S — Sickness (enfermedad crónica grave): 1 pt',
          'INTERPRETACIÓN: 0–2 pts → Riesgo bajo | 3–6 pts → Hospitalización indicada | 7–10 pts → Hospitalización obligatoria',
        ],
        layout_position: 'main',
      },
      {
        id: 'is-manejo',
        type: 'flowchart',
        color: 'amber',
        order: 1,
        title: 'Manejo Clínico en Urgencias',
        content: 'Secuencia de intervención tras intento suicida o ideación suicida activa',
        details: [
          '1. Estabilización médica: tratar consecuencias físicas del intento (intoxicación, trauma)',
          '2. Evaluación de riesgo: aplicar escala SAD PERSONS + entrevista psicosocial',
          '3. Ambiente seguro: retirar objetos peligrosos, supervisión continua, comunicación empática',
          '4. Puntaje 0–2: plan de seguridad + derivación ambulatoria PROSAM',
          '5. Puntaje 3–6: hospitalización en HCSFB, evaluación psicosocial urgente',
          '6. Puntaje ≥ 7 o psicosis o agitación severa: traslado urgente al HCHM (psiquiatría)',
        ],
        layout_position: 'main',
      },
      {
        id: 'is-mermaid',
        type: 'mermaid',
        color: 'blue',
        order: 2,
        title: 'Flujograma Intento Suicida',
        content: `flowchart TD
    A([Paciente con intento suicida\\no ideación suicida activa]) --> B[Estabilización médica\\nTratar consecuencias físicas]
    B --> C[Aplicar SAD PERSONS\\n+ Entrevista psicosocial]
    C --> D{Puntaje SAD PERSONS}
    D -->|0-2 pts Riesgo bajo| E[Plan de seguridad\\nDerivación ambulatoria PROSAM]
    D -->|3-6 pts Riesgo moderado| F[Hospitalización HCSFB\\nEvaluación psicosocial urgente]
    D -->|7-10 pts Riesgo alto| G[Traslado urgente HCHM\\nPsiquiatría]
    C --> H{¿Psicosis o agitación\\nsevera?}
    H -->|Sí| G
    H -->|No| D
    style A fill:#dc2626,color:#fff
    style G fill:#dc2626,color:#fff
    style E fill:#16a34a,color:#fff`,
        layout_position: 'main',
      },
    ],
  },
];

// --- Main ---
console.log(`\n${PROTOCOLS.length} protocolos de Urgencias a insertar:`);
PROTOCOLS.forEach((p, i) => console.log(`  [${i + 1}] ${p.protocol_code} — ${p.name}`));

if (!APPLY) {
  console.log('\n⚠️  Modo dry-run. Agrega --apply para escribir en la base de datos.');
  process.exit(0);
}

for (const p of PROTOCOLS) {
  const { error } = await supabase.from('topics').insert(p);
  if (error) {
    console.error(`❌ Error insertando "${p.name}":`, error.message);
  } else {
    console.log(`✅ Insertado: ${p.name}`);
  }
}

console.log('\n🏁 Carga de protocolos de Urgencias completada.');
