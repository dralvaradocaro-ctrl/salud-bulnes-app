/**
 * Inserta 11 protocolos nuevos en la categoría Hospitalizados.
 *
 * Uso:  node scripts/insert-protocolos-hospitalizados.mjs
 *       node scripts/insert-protocolos-hospitalizados.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const CATEGORY_ID = '696ea6ff245ef362de4f431d'; // Hospitalizados
const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

const TOPICS = [
  // ── GCL 2.2.3-A — Lesiones por Presión ────────────────────────────────────
  {
    id: randomUUID(),
    name: 'Prevención y Manejo de Lesiones por Presión',
    category_id: CATEGORY_ID,
    status: 'published',
    has_local_protocol: true,
    tipo_contenido: ['protocolo'],
    tags: ['lpp', 'úlceras', 'prevención', 'hospitalizado', 'piel', 'dowton'],
    protocol_code:      'GCL 2.2.3-A',
    protocol_edition:   'Sexta',
    protocol_date:      'Mayo 2024',
    protocol_validity:  'Mayo 2029',
    protocol_file_url:  '',
    protocol_objective: 'Prevenir la aparición de lesiones por presión y estandarizar su manejo en pacientes hospitalizados en el HCSFB mediante valoración de riesgo, medidas preventivas y tratamiento basado en estadio.',
    protocol_authors: [
      { name: 'Equipo Clínico HCSFB', role: 'Elaboradores — Enfermería y Medicina' },
      { name: 'Oficina de Calidad y Seguridad del Paciente HCSFB', role: 'Revisora y Aprobadora' },
    ],
    content_blocks: [
      {
        id: 'lpp-valoracion',
        type: 'flowchart',
        color: 'blue',
        order: 1,
        title: 'Valoración de Riesgo — Escala de Braden',
        content: 'Clasificación del riesgo de lesión por presión al ingreso y durante la hospitalización',
        details: [
          'Bajo riesgo (Braden 19–23): educación, cambios posturales c/4h, hidratación cutánea',
          'Riesgo moderado (Braden 15–18): cambios posturales c/2h, superficies de alivio de presión, protección de prominencias óseas',
          'Riesgo alto (Braden 10–14): superficies de redistribución de presión, cambios c/2h, nutrición intensificada',
          'Riesgo muy alto (Braden < 10): colchón antiescaras, cambios c/1-2h, interconsulta a heridas y nutrición',
          'Reevaluar en cada turno y ante cambio en condición clínica',
        ],
        layout_position: 'main',
      },
      {
        id: 'lpp-prevencion',
        type: 'criteria',
        color: 'green',
        order: 2,
        title: 'Medidas Preventivas Esenciales',
        content: 'Intervenciones universales para todo paciente en riesgo',
        items: [
          'Inspección diaria de la piel, especialmente en prominencias óseas (sacro, talones, maléolos, caderas)',
          'Mantener piel limpia, seca e hidratada — evitar masajes sobre prominencias enrojecidas',
          'Cambios posturales programados con registros en ficha',
          'Superficies de apoyo adecuadas al nivel de riesgo (colchón, cojín, taloneras)',
          'Manejo nutricional: asegurar aporte proteico e hídrico suficiente',
          'Manejo de la humedad: incontinencia, sudoración, drenajes',
          'Educación al paciente y familia sobre movilización y posicionamiento',
        ],
        layout_position: 'main',
      },
      {
        id: 'lpp-estadios',
        type: 'flowchart',
        color: 'amber',
        order: 3,
        title: 'Clasificación por Estadios y Manejo',
        content: 'Categorización NPUAP/EPUAP y tratamiento por estadio',
        details: [
          'Estadio 1: Eritema no blanqueable — aliviar presión, apósito protector (poliuretano), no masajear',
          'Estadio 2: Pérdida parcial del espesor — limpieza con suero, apósito hidrocoloide o espuma',
          'Estadio 3: Pérdida total del espesor sin exposición ósea — desbridamiento, apósito según exudado, interconsulta enfermera heridas',
          'Estadio 4: Pérdida total con exposición de músculo/hueso — interconsulta cirugía, manejo multidisciplinario',
          'No clasificable / Sospecha de lesión profunda: comunicar inmediatamente y documentar',
        ],
        layout_position: 'main',
      },
    ],
  },

  // ── GCL 1.7 — Transfusión ─────────────────────────────────────────────────
  {
    id: randomUUID(),
    name: 'Protocolo de Transfusión de Hemoderivados',
    category_id: CATEGORY_ID,
    status: 'published',
    has_local_protocol: true,
    tipo_contenido: ['protocolo'],
    tags: ['transfusión', 'hemoderivados', 'sangre', 'hospitalizado', 'banco de sangre'],
    protocol_code:      'GCL 1.7',
    protocol_edition:   'Segunda',
    protocol_date:      'Enero 2024',
    protocol_validity:  'Enero 2029',
    protocol_file_url:  '',
    protocol_objective: 'Estandarizar el proceso de solicitud, preparación, administración y vigilancia de hemoderivados en el HCSFB para garantizar la seguridad transfusional.',
    protocol_authors: [
      { name: 'Equipo Clínico HCSFB', role: 'Elaboradores — Medicina, Enfermería y Banco de Sangre' },
      { name: 'Oficina de Calidad y Seguridad del Paciente HCSFB', role: 'Revisora y Aprobadora' },
    ],
    content_blocks: [
      {
        id: 'transf-indicaciones',
        type: 'criteria',
        color: 'blue',
        order: 1,
        title: 'Indicaciones y Umbrales Transfusionales',
        content: 'Criterios clínicos para transfusión de cada componente sanguíneo',
        items: [
          'Glóbulos Rojos: Hb < 7 g/dL (estable); Hb < 8 g/dL en cardiopatía o anemia sintomática; Hb < 10 g/dL en IAMEST activo',
          'Plaquetas: < 10.000 (profiláctico); < 50.000 antes de procedimiento invasivo; < 100.000 en cirugía mayor o SNC',
          'PFC: INR > 1.5 con sangrado activo o procedimiento urgente; reversión de anticoagulación urgente',
          'Crioprecipitado: fibrinógeno < 100 mg/dL con sangrado o fibrinógeno < 150 mg/dL en CID',
        ],
        layout_position: 'main',
      },
      {
        id: 'transf-proceso',
        type: 'flowchart',
        color: 'green',
        order: 2,
        title: 'Proceso de Solicitud y Administración',
        content: 'Pasos obligatorios para garantizar la seguridad transfusional',
        details: [
          '1. Solicitud médica con indicación, componente, volumen y velocidad',
          '2. Toma de muestra y envío a banco de sangre con identificación correcta',
          '3. Verificación de compatibilidad (grupo, Rh, pruebas cruzadas)',
          '4. Doble chequeo enfermera/TENS al pie de cama: nombre, RUT, grupo, unidad, fecha de expiración',
          '5. Administrar por vía exclusiva con filtro 170-200 µm; velocidad: 1 unidad GR en 2–4 h',
          '6. Monitoreo: signos vitales al inicio, 15 min, 30 min y al finalizar',
          '7. Suspender inmediatamente si reacción adversa; no descartar unidad ni equipo',
        ],
        layout_position: 'main',
      },
      {
        id: 'transf-reacciones',
        type: 'criteria',
        color: 'red',
        order: 3,
        title: 'Reacciones Transfusionales — Reconocimiento y Manejo',
        content: 'Signos de alerta y conducta ante sospecha de reacción adversa',
        items: [
          'Suspender transfusión INMEDIATAMENTE y mantener vía con suero fisiológico',
          'Reacción febril no hemolítica: fiebre > 1°C, escalofrío — antitérmicos, vigilar progresión',
          'Reacción alérgica/anafiláctica: urticaria, broncoespasmo, hipotensión — adrenalina IM, antihistamínico, corticoides',
          'Hemólisis aguda: fiebre alta, dolor lumbar, orina rojiza, hipotensión — hidratación agresiva, furosemida, avisar banco de sangre urgente',
          'TRALI: disnea aguda 6h post-transfusión, infiltrados bilaterales — soporte ventilatorio, notificación obligatoria',
          'Notificar siempre al banco de sangre; conservar unidad, muestras pre y post transfusión',
        ],
        layout_position: 'main',
      },
    ],
  },

  // ── GCL 1.3 — Manejo del Dolor Agudo Post-Operatorio ─────────────────────
  {
    id: randomUUID(),
    name: 'Manejo del Dolor Agudo Post-Operatorio',
    category_id: CATEGORY_ID,
    status: 'published',
    has_local_protocol: true,
    tipo_contenido: ['protocolo'],
    tags: ['dolor', 'postoperatorio', 'analgesia', 'hospitalizado', 'EVA', 'opioides'],
    protocol_code:      'GCL 1.3',
    protocol_edition:   'Tercera',
    protocol_date:      'Julio 2023',
    protocol_validity:  'Julio 2028',
    protocol_file_url:  '',
    protocol_objective: 'Estandarizar la evaluación y el tratamiento del dolor agudo post-operatorio en el HCSFB mediante una escala analgésica escalonada, garantizando confort del paciente y seguridad farmacológica.',
    protocol_authors: [
      { name: 'Equipo Clínico HCSFB', role: 'Elaboradores — Anestesiología, Cirugía y Enfermería' },
      { name: 'Oficina de Calidad y Seguridad del Paciente HCSFB', role: 'Revisora y Aprobadora' },
    ],
    content_blocks: [
      {
        id: 'dolor-evaluacion',
        type: 'flowchart',
        color: 'blue',
        order: 1,
        title: 'Evaluación del Dolor',
        content: 'Escala EVA/NRS y frecuencia de evaluación',
        details: [
          'Usar Escala Visual Análoga (EVA 0–10) o Escala Numérica (NRS) en cada control de signos vitales',
          'En pacientes no verbalizables: escala conductual (CPOT o FLACC según edad)',
          'EVA 0–3: Dolor leve — Paso 1',
          'EVA 4–6: Dolor moderado — Paso 2',
          'EVA 7–10: Dolor severo — Paso 3',
          'Reevaluar 30 min post-analgesia para verificar respuesta',
        ],
        layout_position: 'main',
      },
      {
        id: 'dolor-escalera',
        type: 'flowchart',
        color: 'green',
        order: 2,
        title: 'Escalera Analgésica Post-Operatoria',
        content: 'Fármacos y dosis según nivel de dolor (protocolo HCSFB)',
        details: [
          'Paso 1 — Dolor leve: Paracetamol 1 g c/8h IV/VO + Ketorolaco 15–30 mg c/8h IV (máx 5 días)',
          'Paso 2 — Dolor moderado: Paso 1 + Tramadol 50–100 mg c/8h IV/VO (o Codeína 30 mg c/6h VO)',
          'Paso 3 — Dolor severo: Paso 1 + Morfina 0.05–0.1 mg/kg IV titulada (o infusión PCA si disponible)',
          'Coadyuvantes: Dexametasona 8 mg IV (reduce dolor e inflamación); Gabapentina 300 mg pre-op en dolor neuropático esperado',
          'Contraindicaciones AINE: IRA, úlcera péptica activa, sangrado, ICC descompensada, postoperatorio renal',
          'Monitorear con sedación scale si opioides: Ramsay, FR > 10/min, SpO2 > 92%',
        ],
        layout_position: 'main',
      },
    ],
  },

  // ── GCL 2.2.1 — Error de Medicación ──────────────────────────────────────
  {
    id: randomUUID(),
    name: 'Prevención y Manejo de Errores de Medicación',
    category_id: CATEGORY_ID,
    status: 'published',
    has_local_protocol: true,
    tipo_contenido: ['protocolo'],
    tags: ['medicación', 'error', 'seguridad', 'hospitalizado', 'farmacovigilancia', '5 correctos'],
    protocol_code:      'GCL 2.2.1',
    protocol_edition:   'Cuarta',
    protocol_date:      'Enero 2023',
    protocol_validity:  'Enero 2028',
    protocol_file_url:  '',
    protocol_objective: 'Prevenir los errores de medicación en el HCSFB mediante la aplicación de los 5 correctos, verificaciones dobles en medicamentos de alto riesgo y un sistema de reporte y análisis de eventos.',
    protocol_authors: [
      { name: 'Equipo Clínico HCSFB', role: 'Elaboradores — Enfermería y Farmacia' },
      { name: 'Oficina de Calidad y Seguridad del Paciente HCSFB', role: 'Revisora y Aprobadora' },
    ],
    content_blocks: [
      {
        id: 'error-prevencion',
        type: 'checklist',
        color: 'blue',
        order: 1,
        title: 'Los 5 Correctos — Verificación Obligatoria',
        content: 'Chequeo obligatorio antes de administrar cualquier medicamento',
        items: [
          { text: 'Paciente correcto: verificar con pulsera y preguntar nombre/RUT', completed: false },
          { text: 'Medicamento correcto: comparar con indicación médica escrita', completed: false },
          { text: 'Dosis correcta: calcular según peso si aplica; revisar concentración', completed: false },
          { text: 'Vía correcta: oral, IV, IM, SC — según indicación', completed: false },
          { text: 'Hora correcta: administrar dentro de ±30 min del horario indicado', completed: false },
        ],
        layout_position: 'main',
      },
      {
        id: 'error-alto-riesgo',
        type: 'criteria',
        color: 'red',
        order: 2,
        title: 'Medicamentos de Alto Riesgo — Doble Verificación',
        content: 'Fármacos que requieren doble chequeo por dos profesionales antes de su administración',
        items: [
          'Insulina (todos los tipos): dosis, tipo, vía y horario',
          'Heparina: dosis en UI, velocidad de infusión, peso del paciente',
          'Anticoagulantes orales (warfarina, acenocumarol): dosis variable según INR',
          'Opioides (morfina, fentanilo, tramadol IV): dosis, dilución, velocidad',
          'Potasio endovenoso: concentración máxima 60 mEq/L periférico; siempre con BIC',
          'Quimioterapia: verificación en farmacia + enfermera + médico',
          'Electrolitos concentrados: NaCl hipertónico, MgSO4 — nunca sin dilución adecuada',
        ],
        layout_position: 'main',
      },
      {
        id: 'error-reporte',
        type: 'flowchart',
        color: 'amber',
        order: 3,
        title: 'Reporte de Error de Medicación',
        content: 'Conducta ante la ocurrencia de un error',
        details: [
          '1. Atender al paciente primero — evaluar daño y notificar al médico tratante',
          '2. Documentar en ficha clínica: hora, medicamento, dosis administrada, condición del paciente',
          '3. Completar formulario de reporte de eventos adversos (disponible en OIRS o papel)',
          '4. No buscar culpables — el reporte es cultura de seguridad, no sanción',
          '5. Jefe de servicio analiza causa raíz y propone medidas correctivas',
          '6. Errores graves (daño permanente o muerte): notificación a Dirección y SEREMI en 24–72h',
        ],
        layout_position: 'main',
      },
    ],
  },

  // ── GCL 2.2.2 — Prevención de Caídas ─────────────────────────────────────
  {
    id: randomUUID(),
    name: 'Prevención de Caídas en Pacientes Hospitalizados',
    category_id: CATEGORY_ID,
    status: 'published',
    has_local_protocol: true,
    tipo_contenido: ['protocolo'],
    tags: ['caídas', 'prevención', 'hospitalizado', 'Downton', 'seguridad'],
    protocol_code:      'GCL 2.2.2',
    protocol_edition:   'Quinta',
    protocol_date:      'Mayo 2021',
    protocol_validity:  'Mayo 2026',
    protocol_file_url:  '',
    protocol_objective: 'Prevenir caídas en pacientes hospitalizados en el HCSFB mediante valoración de riesgo (escala Downton), implementación de medidas preventivas y manejo estructurado del evento.',
    protocol_authors: [
      { name: 'Equipo Clínico HCSFB', role: 'Elaboradores — Enfermería y Medicina' },
      { name: 'Oficina de Calidad y Seguridad del Paciente HCSFB', role: 'Revisora y Aprobadora' },
    ],
    content_blocks: [
      {
        id: 'caidas-downton',
        type: 'flowchart',
        color: 'blue',
        order: 1,
        title: 'Escala Downton — Estratificación de Riesgo',
        content: 'Factores de riesgo evaluados al ingreso y cada 24h',
        details: [
          'Caídas previas (sí = 1 punto)',
          'Medicamentos sedantes, tranquilizantes, hipotensores, antidiabéticos, antiparkinsonianos (1 punto c/u)',
          'Déficit sensorial: visual, auditivo, miembros (1 punto c/u)',
          'Estado mental: confusión = 1 punto',
          'Deambulación: insegura sin ayuda = 1pt; necesita ayuda = 1pt',
          'Riesgo bajo: < 3 puntos — medidas universales',
          'Riesgo alto: ≥ 3 puntos — medidas intensificadas + señalización',
        ],
        layout_position: 'main',
      },
      {
        id: 'caidas-medidas',
        type: 'checklist',
        color: 'green',
        order: 2,
        title: 'Medidas Preventivas por Nivel de Riesgo',
        content: 'Intervenciones estandarizadas según riesgo Downton',
        items: [
          { text: 'Identificar con pulsera/señalética de riesgo caídas (riesgo alto)', completed: false },
          { text: 'Cama en posición más baja posible con frenos puestos', completed: false },
          { text: 'Barandas laterales elevadas durante el reposo/sueño', completed: false },
          { text: 'Timbre al alcance del paciente y respuesta oportuna', completed: false },
          { text: 'Calzado antideslizante, piso seco, espacio despejado', completed: false },
          { text: 'Revisión de fármacos de riesgo: ajustar o suspender si es posible', completed: false },
          { text: 'Acompañante durante deambulación en riesgo alto', completed: false },
          { text: 'Educación al paciente y familia sobre factores de riesgo', completed: false },
        ],
        layout_position: 'main',
      },
    ],
  },

  // ── GCL 1.9 — Contención Física ───────────────────────────────────────────
  {
    id: randomUUID(),
    name: 'Procedimiento de Contención Física en Paciente Hospitalizado',
    category_id: CATEGORY_ID,
    status: 'published',
    has_local_protocol: true,
    tipo_contenido: ['protocolo'],
    tags: ['contención', 'física', 'hospitalizado', 'sujeción', 'agitación', 'derechos'],
    protocol_code:      'GCL 1.9',
    protocol_edition:   'Tercera',
    protocol_date:      'Enero 2023',
    protocol_validity:  'Enero 2028',
    protocol_file_url:  '',
    protocol_objective: 'Establecer criterios y procedimientos seguros para la aplicación de contención física en pacientes hospitalizados en el HCSFB, garantizando la seguridad, la dignidad y los derechos del paciente.',
    protocol_authors: [
      { name: 'Equipo Clínico HCSFB', role: 'Elaboradores — Enfermería y Medicina' },
      { name: 'Oficina de Calidad y Seguridad del Paciente HCSFB', role: 'Revisora y Aprobadora' },
    ],
    content_blocks: [
      {
        id: 'contencion-indicaciones',
        type: 'criteria',
        color: 'amber',
        order: 1,
        title: 'Indicaciones y Contraindicaciones de Contención Física',
        content: 'Criterios para su aplicación como medida de última instancia',
        items: [
          'INDICACIÓN: riesgo inminente de daño al paciente o a terceros cuando otras medidas han fallado',
          'INDICACIÓN: extubación, extracción de catéteres o tubos en paciente no cooperador con riesgo vital',
          'CONTRAINDICACIÓN: como medida rutinaria, de conveniencia del equipo o sustituto de vigilancia',
          'Siempre intentar primero: reorientación verbal, presencia familiar, farmacología si aplica',
          'Requiere orden médica escrita con indicación, tipo de contención, fecha y hora',
          'Reevaluar la necesidad cada 2 horas y al cambio de turno',
        ],
        layout_position: 'main',
      },
      {
        id: 'contencion-procedimiento',
        type: 'checklist',
        color: 'blue',
        order: 2,
        title: 'Procedimiento de Aplicación',
        content: 'Pasos obligatorios para la contención física segura',
        items: [
          { text: 'Explicar al paciente (aunque esté agitado) y a la familia el motivo y la medida', completed: false },
          { text: 'Usar material de contención homologado: nunca cuerdas, sábanas atadas ni medidas improvisadas', completed: false },
          { text: 'Aplicar con suficiente personal (mínimo 3–4 personas); una persona lidera', completed: false },
          { text: 'Contener extremidades en posición anatómica — verificar pulso distal y coloración', completed: false },
          { text: 'Control de circulación, sensibilidad y movilidad distal c/1h', completed: false },
          { text: 'Cambios posturales c/2h; aseo e hidratación; atender necesidades fisiológicas', completed: false },
          { text: 'Documentar en ficha: hora inicio, tipo, respuesta del paciente, controles periódicos', completed: false },
          { text: 'Retirar la contención tan pronto desaparezca la indicación', completed: false },
        ],
        layout_position: 'main',
      },
    ],
  },

  // ── HCSFB 139 — Toracocentesis ────────────────────────────────────────────
  {
    id: randomUUID(),
    name: 'Toracocentesis en Adultos en Servicios Clínicos',
    category_id: CATEGORY_ID,
    status: 'published',
    has_local_protocol: true,
    tipo_contenido: ['protocolo'],
    tags: ['toracocentesis', 'pleural', 'hospitalizado', 'procedimiento', 'derrame'],
    protocol_code:      'HCSFB 139',
    protocol_edition:   'Primera',
    protocol_date:      'Mayo 2025',
    protocol_validity:  'Mayo 2030',
    protocol_file_url:  '',
    protocol_objective: 'Estandarizar la técnica y seguridad de la toracocentesis diagnóstica y evacuadora en adultos hospitalizados en el HCSFB, minimizando complicaciones y asegurando indicaciones apropiadas.',
    protocol_authors: [
      { name: 'Equipo Médico HCSFB', role: 'Elaboradores — Medicina Interna y Urgencias' },
      { name: 'Oficina de Calidad y Seguridad del Paciente HCSFB', role: 'Revisora y Aprobadora' },
    ],
    content_blocks: [
      {
        id: 'toracoc-indicaciones',
        type: 'criteria',
        color: 'blue',
        order: 1,
        title: 'Indicaciones y Contraindicaciones',
        content: 'Criterios de selección para toracocentesis diagnóstica o evacuadora',
        items: [
          'Diagnóstica: derrame pleural de etiología incierta (> 1 cm en decúbito lateral)',
          'Evacuadora: disnea significativa por derrame; derrame paraneumónico complicado',
          'Contraindicación relativa: coagulopatía (INR > 1.5 o plaquetas < 50.000), anticoagulación activa, PEEP alto en ventilación mecánica',
          'Contraindicación absoluta: infección de piel en sitio de punción; no hay contraindicaciones absolutas si hay riesgo vital',
          'Requiere ecografía previa o guiada para localizar derrame y marcar sitio',
          'Consentimiento informado firmado (excepto urgencia vital)',
        ],
        layout_position: 'main',
      },
      {
        id: 'toracoc-tecnica',
        type: 'flowchart',
        color: 'green',
        order: 2,
        title: 'Técnica y Materiales',
        content: 'Procedimiento paso a paso según protocolo HCSFB 139',
        details: [
          'Posición: sentado con brazos apoyados o decúbito lateral si no puede sentarse',
          'Sitio: borde superior de la costilla inferior del espacio elegido (evitar nervio, arteria y vena subcostales)',
          'Asepsia: campo estéril, mascarilla y guantes; antisepsia con clorhexidina',
          'Anestesia local: lidocaína 1% 5–10 mL hasta pleura parietal',
          'Punción: aguja 18–20 G o set de toracocentesis; aspirar progresivamente',
          'Evacuadora: máximo 1.000–1.500 mL por sesión para evitar edema de re-expansión',
          'Post-procedimiento: Rx Tórax de control; monitoreo SpO2 y FC 30 min',
        ],
        layout_position: 'main',
      },
      {
        id: 'toracoc-complicaciones',
        type: 'criteria',
        color: 'red',
        order: 3,
        title: 'Complicaciones y Manejo',
        content: 'Eventos adversos esperados y conducta',
        items: [
          'Neumotórax (< 5%): si asintomático y < 20%, observar; si sintomático, drenaje pleural',
          'Edema de re-expansión: disnea y tos al evacuar > 1.5 L — detener, O2, posición semisentada',
          'Hemotórax: sangrado significativo — suspender, avisar cirugía, evaluar drenaje',
          'Infección del sitio: asepsia rigurosa previene; tratar con antibiótico si ocurre',
          'Reacción vasovagal: frecuente — Trendelenburg, atropina 0.5 mg IV si bradicardia',
          'Documentar: volumen, color, aspecto y muestras enviadas al laboratorio',
        ],
        layout_position: 'main',
      },
    ],
  },

  // ── HCSFB 129 — Hipnóticos ───────────────────────────────────────────────
  {
    id: randomUUID(),
    name: 'Uso Adecuado de Hipnóticos en Pacientes Hospitalizados',
    category_id: CATEGORY_ID,
    status: 'published',
    has_local_protocol: true,
    tipo_contenido: ['protocolo'],
    tags: ['hipnóticos', 'insomnio', 'hospitalizado', 'benzodiazepinas', 'sedación', 'sueño'],
    protocol_code:      'HCSFB 129',
    protocol_edition:   'Primera',
    protocol_date:      'Marzo 2025',
    protocol_validity:  'Marzo 2030',
    protocol_file_url:  '',
    protocol_objective: 'Racionalizar el uso de hipnóticos en pacientes hospitalizados en el HCSFB, priorizando medidas no farmacológicas y estableciendo criterios de uso seguro y limitado de fármacos.',
    protocol_authors: [
      { name: 'Equipo Médico HCSFB', role: 'Elaboradores — Medicina Interna y Farmacia' },
      { name: 'Oficina de Calidad y Seguridad del Paciente HCSFB', role: 'Revisora y Aprobadora' },
    ],
    content_blocks: [
      {
        id: 'hipnoticos-no-farm',
        type: 'criteria',
        color: 'green',
        order: 1,
        title: 'Medidas No Farmacológicas — Primera Línea',
        content: 'Intervenciones de higiene del sueño que deben implementarse antes de indicar hipnóticos',
        items: [
          'Minimizar interrupciones nocturnas: agrupar controles, reducir toma de signos vitales si no es crítico',
          'Control de ruido y luz: apagar luces del pasillo, reducir alarmas a lo estrictamente necesario',
          'Temperatura ambiental confortable; ropa de cama cómoda',
          'Evitar cafeína y líquidos en exceso después de las 17h',
          'Técnicas de relajación, música suave si tolera',
          'Manejo del dolor: la analgesia adecuada es la primera causa de insomnio en hospitalizados',
          'Informar al paciente sobre el plan de atención para reducir ansiedad',
        ],
        layout_position: 'main',
      },
      {
        id: 'hipnoticos-farmacos',
        type: 'flowchart',
        color: 'amber',
        order: 2,
        title: 'Uso Farmacológico — Criterios y Fármacos',
        content: 'Indicaciones, opciones y restricciones según protocolo HCSFB 129',
        details: [
          'Indicar solo si insomnio persiste pese a medidas no farmacológicas y causa deterioro clínico',
          'Zopiclona 7.5 mg VO (dosis única nocturna): primera opción — ciclos máx 7 días',
          'Zolpidem 5–10 mg VO: alternativa — adultos mayores solo 5 mg; máx 7 días',
          'Lorazepam 0.5–1 mg VO: si ansiedad significativa asociada — especial precaución en AM y EPOC',
          'Restricciones: NO iniciar hipnoticos sin primero descartar dolor, globo vesical, delirium, disnea',
          'Adultos mayores ≥ 65 años: EVITAR benzodiazepinas — riesgo caídas, delirium y dependencia',
          'Documentar indicación, duración planificada y revisar en cada turno',
        ],
        layout_position: 'main',
      },
    ],
  },

  // ── HCSFB 161 — PROA ─────────────────────────────────────────────────────
  {
    id: randomUUID(),
    name: 'Programa de Optimización del Uso de Antibióticos (PROA)',
    category_id: CATEGORY_ID,
    status: 'published',
    has_local_protocol: true,
    tipo_contenido: ['protocolo'],
    tags: ['antibióticos', 'PROA', 'antimicrobiano', 'resistencia', 'hospitalizado', 'infección'],
    protocol_code:      'HCSFB 161',
    protocol_edition:   'Primera',
    protocol_date:      'Febrero 2026',
    protocol_validity:  'Febrero 2028',
    protocol_file_url:  '',
    protocol_objective: 'Implementar un programa institucional de optimización de antimicrobianos en el HCSFB para reducir la resistencia bacteriana, mejorar los resultados clínicos y disminuir efectos adversos relacionados con el uso inadecuado de antibióticos.',
    protocol_authors: [
      { name: 'Equipo Clínico HCSFB', role: 'Elaboradores — Medicina, Farmacia e Infectología' },
      { name: 'Comité IAAS HCSFB', role: 'Revisor' },
      { name: 'Dirección HCSFB', role: 'Aprobadora' },
    ],
    content_blocks: [
      {
        id: 'proa-principios',
        type: 'flowchart',
        color: 'blue',
        order: 1,
        title: 'Principios del PROA — Uso Racional de Antibióticos',
        content: 'Estrategias clave para optimizar el uso de antimicrobianos en el HCSFB',
        details: [
          'De-escalación: cambiar a antibiótico de menor espectro una vez disponible antibiograma',
          'Duración adecuada: completar el número de días indicado por la evidencia — no prolongar sin causa',
          'Vía oral preferente: cambiar de IV a VO tan pronto el paciente tolere y la infección lo permita',
          'Cultivos antes del antibiótico: siempre hemocultivos (x2) antes de la primera dosis en infecciones graves',
          'Revisión a las 48–72h: reevaluar si antibiótico es necesario, apropiado y suspendible',
          'Restricción de antibióticos de amplio espectro: carbapenémicos, vancomicina y colistin requieren aprobación Infectología/Medicina Interna',
        ],
        layout_position: 'main',
      },
      {
        id: 'proa-antibioticos-restringidos',
        type: 'criteria',
        color: 'red',
        order: 2,
        title: 'Antibióticos de Uso Restringido — HCSFB',
        content: 'Fármacos que requieren justificación clínica documentada o autorización',
        items: [
          'Carbapenémicos (imipenem, meropenem, ertapenem): solo ante confirmación o alta sospecha de enterobacteria BLEE',
          'Vancomicina IV: solo ante sospecha de Staphylococcus aureus resistente (MRSA) o infección grave por gram positivo resistente a betalactámicos',
          'Piperacilina-Tazobactam: infección grave con sospecha de Pseudomonas o gramnegativos multirresistentes',
          'Colistin (polimixina E): último recurso, coordinación con Infectología/Dirección Médica',
          'Fluoroquinolonas sistémicas: evitar en ITU no complicadas; reservar para infecciones respiratorias graves o según antibiograma',
          'Ceftriaxona profiláctica: no indicada, solo en esquemas validados de profilaxis quirúrgica',
        ],
        layout_position: 'main',
      },
    ],
  },

  // ── HCSFB 159 — Contención Farmacológica y No Farmacológica ──────────────
  {
    id: randomUUID(),
    name: 'Contención Farmacológica y No Farmacológica en Agitación Psicomotora',
    category_id: CATEGORY_ID,
    status: 'published',
    has_local_protocol: true,
    tipo_contenido: ['protocolo'],
    tags: ['agitación', 'psicomotora', 'contención', 'farmacológica', 'hospitalizado', 'salud mental'],
    protocol_code:      'HCSFB 159',
    protocol_edition:   'Segunda',
    protocol_date:      'Marzo 2026',
    protocol_validity:  'Marzo 2031',
    protocol_file_url:  '',
    protocol_objective: 'Estandarizar el manejo de la agitación psicomotora en pacientes hospitalizados en el HCSFB, priorizando intervenciones no farmacológicas e indicando fármacos de manera escalonada y segura.',
    protocol_authors: [
      { name: 'Equipo Clínico HCSFB', role: 'Elaboradores — Medicina, Enfermería y Psiquiatría' },
      { name: 'Oficina de Calidad y Seguridad del Paciente HCSFB', role: 'Revisora y Aprobadora' },
    ],
    content_blocks: [
      {
        id: 'agit-no-farm',
        type: 'flowchart',
        color: 'green',
        order: 1,
        title: 'Intervención No Farmacológica — Primera Respuesta',
        content: 'Técnicas de de-escalada verbal y ambiental como primer paso',
        details: [
          'Postura no amenazante: mantener distancia segura, manos visibles, voz calmada y tono bajo',
          'Escucha activa: identificar la fuente de angustia (dolor, miedo, desorientación)',
          'Ofrecer control: opciones simples al paciente para reducir sensación de pérdida de control',
          'Ambiente: reducir estímulos (bajar luz, bajar ruido), presencia familiar si calma',
          'Activar protocolo de respuesta rápida psiquiátrica si disponible (HCSFB 165)',
          'Documentar intentos de de-escalada antes de indicar fármacos o contención física',
        ],
        layout_position: 'main',
      },
      {
        id: 'agit-farm',
        type: 'flowchart',
        color: 'amber',
        order: 2,
        title: 'Contención Farmacológica — Escalada Terapéutica',
        content: 'Fármacos y dosis según nivel de agitación y contexto clínico',
        details: [
          'Agitación leve–moderada, paciente cooperador VO: Lorazepam 1–2 mg VO/SL o Haloperidol 5 mg VO',
          'Agitación moderada–severa, no coopera vía oral: Haloperidol 5 mg IM + Lorazepam 2 mg IM (adultos sin contraindicación)',
          'Agitación severa con agresión activa: Haloperidol 5–10 mg IM + Midazolam 5 mg IM (monitoreo respiratorio)',
          'Delirium en adulto mayor: preferir Haloperidol 0.5–1 mg IM; EVITAR benzodiacepinas excepto abstinencia',
          'Intoxicación por alcohol/benzos: Haloperidol IM; evitar benzodiacepinas adicionales',
          'Controlar FC, FR, SpO2 y nivel de sedación post-administración (escala RASS)',
          'Antídoto disponible: Flumazenil (benzodiacepinas), Naloxona (opioides)',
        ],
        layout_position: 'main',
      },
      {
        id: 'agit-derivacion',
        type: 'criteria',
        color: 'red',
        order: 3,
        title: 'Criterios de Derivación a Psiquiatría o HHM',
        content: 'Indicaciones para derivación a nivel secundario o psiquiátrico',
        items: [
          'Agitación refractaria a 2 ciclos de tratamiento farmacológico escalonado',
          'Diagnóstico psiquiátrico de base descompensado (psicosis aguda, manía, depresión con agitación)',
          'Conducta auto o heteroagresiva que no cede con contención farmacológica y física',
          'Necesidad de hospitalización psiquiátrica involuntaria (Ley 21.331)',
          'Sospecha de causa orgánica no resuelta (encefalopatía metabólica, status epiléptico)',
        ],
        layout_position: 'main',
      },
    ],
  },

  // ── HCSFB 165 — Activación y Respuesta Rápida Psiquiátrica ───────────────
  {
    id: randomUUID(),
    name: 'Activación y Respuesta Rápida para Pacientes Hospitalizados con Diagnóstico Psiquiátrico',
    category_id: CATEGORY_ID,
    status: 'published',
    has_local_protocol: true,
    tipo_contenido: ['protocolo'],
    tags: ['psiquiatría', 'respuesta rápida', 'activación', 'hospitalizado', 'salud mental', 'agitación'],
    protocol_code:      'HCSFB 165',
    protocol_edition:   'Primera',
    protocol_date:      'Marzo 2026',
    protocol_validity:  'Marzo 2031',
    protocol_file_url:  '',
    protocol_objective: 'Establecer un sistema de respuesta rápida para la evaluación y manejo de pacientes hospitalizados con diagnóstico psiquiátrico o conducta de riesgo en el HCSFB, garantizando atención oportuna y segura.',
    protocol_authors: [
      { name: 'Equipo Clínico HCSFB', role: 'Elaboradores — Medicina, Psicología y Enfermería' },
      { name: 'Oficina de Calidad y Seguridad del Paciente HCSFB', role: 'Revisora y Aprobadora' },
    ],
    content_blocks: [
      {
        id: 'rr-psiq-activacion',
        type: 'criteria',
        color: 'amber',
        order: 1,
        title: 'Criterios de Activación — Cuándo Llamar',
        content: 'Situaciones que requieren activar la respuesta rápida psiquiátrica',
        items: [
          'Agitación psicomotora que no responde a de-escalada verbal en 5–10 minutos',
          'Conducta auto o heteroagresiva activa',
          'Ideación suicida activa o intento de autolesión en el servicio',
          'Conducta disruptiva grave que compromete la seguridad del entorno',
          'Descompensación aguda de trastorno psiquiátrico conocido (psicosis, manía, depresión)',
          'Sospecha de cuadro orgánico con compromiso del nivel de conciencia y agitación',
        ],
        layout_position: 'main',
      },
      {
        id: 'rr-psiq-flujograma',
        type: 'mermaid',
        color: 'blue',
        order: 2,
        title: 'Flujograma de Respuesta Rápida Psiquiátrica',
        content: `flowchart TD
    A[Criterio de activación identificado] --> B[Enfermera notifica médico de turno]
    B --> C{¿Hay riesgo inmediato de lesión?}
    C -->|Sí| D[Activar seguridad + contención física\nprotocolo GCL 1.9]
    C -->|No| E[De-escalada verbal\n5–10 min]
    D --> F[Contención farmacológica\nprotocolo HCSFB 159]
    E -->|Funciona| G[Documentar y monitorear c/1h]
    E -->|No funciona| F
    F --> H{¿Paciente estabilizado?}
    H -->|Sí| I[Evaluación psiquiátrica\nelectiva en < 24h]
    H -->|No| J[Contactar psiquiatra de guardia\nHHM]
    J --> K{¿Necesita hospitalización psiquiátrica?}
    K -->|Sí| L[Coordinar traslado a HHM\nLey 21.331 si involuntario]
    K -->|No| M[Manejo en sala con indicaciones\npsiquiátricas y seguimiento]`,
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

console.log(`\n✅ ${data.length} protocolos de Hospitalizados insertados:`);
data.forEach(t => console.log(`  • ${t.name} — ${t.id}`));
