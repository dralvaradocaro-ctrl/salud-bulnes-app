/**
 * Enriquecimiento v2 — Protocolos Hospitalizados
 * Agrega autores reales, bloques mermaid, contenido operativo local.
 *
 * Uso:  node scripts/update-protocolos-hospitalizados-v2.mjs
 *       node scripts/update-protocolos-hospitalizados-v2.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

// ─────────────────────────────────────────────────────────────
// 1. GCL 2.2.3-A — Valoración de Piel y Prevención de LPP
// ─────────────────────────────────────────────────────────────
const LPP = {
  id: 'da8d14ee-463c-48d0-9460-509bbc422cd7',
  meta: {
    protocol_code:      'GCL 2.2.3-A',
    protocol_edition:   'Sexta',
    protocol_date:      'Mayo 2024',
    protocol_validity:  'Mayo 2029',
    protocol_objective: 'Estandarizar la valoración del riesgo de lesiones por presión mediante la escala Braden y las medidas preventivas en pacientes hospitalizados del HCSFB.',
    protocol_authors: [
      { name: 'Comité de Calidad y Seguridad del Paciente HCSFB', role: 'Elaborador' },
      { name: 'Servicio de Enfermería HCSFB',                       role: 'Revisor' },
      { name: 'EU María Teresa Medina Bravo',                       role: 'Revisora — OFICYSP' },
      { name: 'Dr. Álvaro Lagos Llanos',                             role: 'Aprobador — Director HCSFB' },
    ],
  },
  blocks: [
    {
      id: 'lpp-braden',
      type: 'flowchart',
      color: 'blue',
      order: 1,
      title: 'Escala Braden — Estratificación de Riesgo',
      content: 'Puntaje Braden y conducta clínica según nivel de riesgo en hospitalizados HCSFB',
      details: [
        'Braden 19–23 (Sin riesgo): valoración de piel al ingreso; cambios posturales c/4h si inmovilizado',
        'Braden 15–18 (Riesgo bajo): cambios posturales c/2h; colchón estándar hospitalario',
        'Braden 13–14 (Riesgo moderado): cambios c/2h; colchón de espuma viscoelástica; protector talones',
        'Braden 10–12 (Riesgo alto): cambios c/1–2h; colchón antiescaras; apósitos de espuma en prominencias',
        'Braden ≤ 9 (Riesgo muy alto): cambios c/1h; colchón dinámico de alternancia de presión; plan nutricional',
        'Escala aplicada: ingreso + cada 72h + ante cambio de estado clínico significativo',
      ],
      layout_position: 'main',
    },
    {
      id: 'lpp-estadios',
      type: 'text',
      color: 'amber',
      order: 2,
      title: 'Estadificación de LPP (NPUAP/EPUAP 2019)',
      content: 'Clasificación de lesiones por presión para documentación en SOME',
      details: [
        'Categoría I: eritema no blanqueable en piel íntegra — zona enrojecida que no blanquea al presionar',
        'Categoría II: pérdida parcial del espesor — úlcera superficial rosada o flictena serosanguinolenta',
        'Categoría III: pérdida total del espesor — tejido subcutáneo visible, sin exposición de hueso/tendón',
        'Categoría IV: pérdida total del espesor con exposición de hueso, tendón o músculo',
        'No estadificable: base de herida cubierta por escara o biofilm — no se puede estadificar',
        'LPP tisular profunda: zona morada o rojo oscuro en piel íntegra — posible lesión profunda subyacente',
      ],
      layout_position: 'main',
    },
    {
      id: 'lpp-preventivas',
      type: 'criteria',
      color: 'green',
      order: 3,
      title: 'Medidas Preventivas Clave',
      content: 'Intervenciones de enfermería obligatorias en todo paciente con Braden ≤ 18',
      items: [
        'Cambios posturales documentados en hoja de enfermería con hora y posición',
        'Crema hidratante (urea 10%) en zonas de riesgo: sacro, talones, maléolos, codos',
        'Protección de talones: taloneras de espuma o almohadas bajo pantorrillas (talones al aire)',
        'Ropa de cama sin arrugas, seca y limpia; cambio inmediato ante humedad (incontinencia)',
        'Nutrición: evaluar con Escala MNA; derivar a nutricionista si desnutrición o IMC < 18.5',
        'Hidratación oral activa si no hay contraindicación: ≥ 6 vasos de agua/día',
        'Apósitos preventivos (Mepilex Border Lite o similar) en sacro y talones en Braden ≤ 12',
      ],
      layout_position: 'sidebar',
    },
    {
      id: 'lpp-registro',
      type: 'flowchart',
      color: 'red',
      order: 4,
      title: 'Reporte de LPP Adquirida en Hospital',
      content: 'Pasos obligatorios ante detección de una LPP nueva en paciente hospitalizado',
      details: [
        '1. Documentar en SOME: fecha detección, estadio, zona, contexto clínico',
        '2. Fotografía clínica (con regla escalar si disponible) al inicio y seguimiento semanal',
        '3. Notificar a enfermera jefa de turno y médico tratante el mismo día',
        '4. Completar formulario de reporte de EAI (Evento Adverso Institucional) en OIRS HCSFB',
        '5. Derivar a enfermera especialista en heridas si Categoría III o IV',
        '6. Revisar factores contribuyentes: reevaluar Braden, posición, nutrición, equipo de apoyo',
      ],
      layout_position: 'main',
    },
  ],
};

// ─────────────────────────────────────────────────────────────
// 2. GCL 1.7 — Protocolo de Transfusión
// ─────────────────────────────────────────────────────────────
const TRANSFUSION = {
  id: 'ea66f700-760b-479b-8299-eef151e98754',
  meta: {
    protocol_code:      'GCL 1.7',
    protocol_edition:   'Segunda',
    protocol_date:      'Enero 2024',
    protocol_validity:  'Enero 2029',
    protocol_objective: 'Garantizar la seguridad transfusional en el HCSFB mediante verificación pre-transfusional, doble chequeo, monitoreo durante la administración y detección oportuna de reacciones adversas.',
    protocol_authors: [
      { name: 'Comité de Transfusiones HCSFB',                     role: 'Elaborador' },
      { name: 'Banco de Sangre HCSFB',                              role: 'Revisor técnico' },
      { name: 'EU María Teresa Medina Bravo',                       role: 'Revisora — OFICYSP' },
      { name: 'Dr. Álvaro Lagos Llanos',                             role: 'Aprobador — Director HCSFB' },
    ],
  },
  blocks: [
    {
      id: 'trans-indicaciones',
      type: 'criteria',
      color: 'blue',
      order: 1,
      title: 'Indicaciones de Transfusión — Umbrales HCSFB',
      content: 'Criterios locales para indicar componentes sanguíneos en el HCSFB',
      items: [
        'GR concentrado: Hb < 7 g/dL en paciente estable; Hb < 8–9 g/dL con cardiopatía isquémica',
        'Plaquetas: < 10.000/µL sin sangrado; < 50.000/µL ante procedimiento invasivo; < 100.000/µL en cirugía mayor',
        'PFC: coagulopatía documentada con INR > 1.5 y sangrado activo o procedimiento urgente',
        'Crioprecipitado: fibrinógeno < 100 mg/dL con sangrado activo',
        'Albúmina: no se indica de rutina — solo casos específicos evaluados por médico tratante',
        'Consentimiento informado firmado ANTES de solicitar componentes al banco de sangre',
      ],
      layout_position: 'main',
    },
    {
      id: 'trans-mermaid',
      type: 'mermaid',
      order: 2,
      title: 'Flujo de Seguridad Transfusional — HCSFB',
      content: `flowchart TD
    A([Médico indica transfusión]) --> B[Solicitar muestra para\\ngrupo y Coombs al\\nbanco de sangre HCSFB]
    B --> C[Banco procesa y prepara\\ncomponente en ≤ 60 min]
    C --> D[Enfermera retira componente\\ncon formulario de solicitud]
    D --> E[DOBLE CHEQUEO\\nEnfermera 1 + Enfermera 2\\no Enfermera + Médico]
    E --> F{¿Datos coinciden?\\nNombre, RUT, Grupo,\\nN° unidad, fecha exp.}
    F -->|No coinciden| G[NO TRANSFUNDIR\\nReportar al banco de sangre\\nNotificar médico inmediatamente]
    F -->|Sí coinciden| H[Instalar vía periférica 18G\\ncon suero fisiológico 0.9%]
    H --> I[Iniciar transfusión\\nLento 15 min iniciales\\n1–2 mL/min]
    I --> J[Monitoreo: PA, FC,\\nT°, SpO2 a los 15 min]
    J --> K{¿Signos de\\nreacción adversa?}
    K -->|No| L[Continuar a velocidad\\nnormal: 250 mL/h GR\\nFin en ≤ 4h por unidad]
    K -->|Sí| M[DETENER TRANSFUSIÓN\\nMantener vía con SF 0.9%\\nAvisar médico INMEDIATO]
    L --> N[Monitoreo cada 30–60 min\\nhasta finalizar]
    M --> O[Manejo de reacción\\nsegún tipo: hemolítica,\\nalérgica, TRALI, TACO]
    N --> P([Documentar en SOME:\\ncomponente, N° unidad,\\nvolumen, tolerancia])`,
      layout_position: 'main',
    },
    {
      id: 'trans-reacciones',
      type: 'criteria',
      color: 'red',
      order: 3,
      title: 'Reacciones Transfusionales — Reconocimiento y Manejo',
      content: 'Tipos de reacciones adversas y conducta inmediata en HCSFB',
      items: [
        'Hemolítica aguda: fiebre, escalofríos, dolor lumbar, hipotensión — DETENER + avisar médico + muestras banco de sangre',
        'Reacción febril no hemolítica: fiebre > 1°C sin hemólisis — suspender, antipiréticos, reiniciar si resuelve',
        'Alérgica urticarial: urticaria sin hipotensión — suspender, antihistamínico, reiniciar si resuelve',
        'Anafilaxis: hipotensión + broncoespasmo — DETENER + adrenalina 0.3 mg IM + RCR si necesario',
        'TRALI (daño pulmonar): hipoxia súbita + infiltrados bilaterales — DETENER + soporte ventilatorio',
        'TACO (sobrecarga circulatoria): disnea + edema pulmonar — DETENER + diuréticos + O₂',
        'Todo evento adverso debe reportarse al banco de sangre HCSFB y en formulario OIRS',
      ],
      layout_position: 'main',
    },
  ],
};

// ─────────────────────────────────────────────────────────────
// 3. GCL 1.3 — Manejo del Dolor Agudo Post-Operatorio
// ─────────────────────────────────────────────────────────────
const DOLOR = {
  id: '66086cdd-cd73-46ca-87da-245fdb2f4e32',
  meta: {
    protocol_code:      'GCL 1.3',
    protocol_edition:   'Tercera',
    protocol_date:      'Julio 2023',
    protocol_validity:  'Julio 2028',
    protocol_objective: 'Estandarizar el manejo analgésico multimodal del dolor agudo post-operatorio en el HCSFB mediante la Escala EVA y el esquema escalonado por intensidad de dolor.',
    protocol_authors: [
      { name: 'Comité de Calidad y Seguridad del Paciente HCSFB', role: 'Elaborador' },
      { name: 'Servicio de Cirugía y Anestesia HCSFB',             role: 'Revisor' },
      { name: 'EU María Teresa Medina Bravo',                      role: 'Revisora — OFICYSP' },
      { name: 'Dr. Álvaro Lagos Llanos',                            role: 'Aprobador — Director HCSFB' },
    ],
  },
  blocks: [
    {
      id: 'dolor-eva',
      type: 'text',
      color: 'blue',
      order: 1,
      title: 'Evaluación con Escala EVA — HCSFB',
      content: 'Escala Visual Analógica para cuantificar el dolor post-operatorio',
      details: [
        'EVA 0: sin dolor — sin analgesia adicional',
        'EVA 1–3: dolor leve — Paracetamol 1g c/8h VO/IV ± AINE si tolera',
        'EVA 4–6: dolor moderado — Ketorolaco 30 mg IV c/8h + Paracetamol 1g c/8h',
        'EVA 7–10: dolor severo — Morfina 2–4 mg IV lento c/4–6h + rescates según protocolo',
        'Evaluación: al ingreso a recuperación, 30 min post-cirugía, c/4h durante primeras 24h',
        'Documentar EVA en hoja de signos vitales; meta: EVA ≤ 3 en reposo',
      ],
      layout_position: 'main',
    },
    {
      id: 'dolor-mermaid',
      type: 'mermaid',
      order: 2,
      title: 'Algoritmo Analgésico — Dolor Post-Operatorio HCSFB',
      content: `flowchart TD
    A([Evaluación post-operatoria\\nenfermería aplica EVA]) --> B{Intensidad de dolor}
    B -->|EVA 0| C[Sin analgesia\\nreevaluar en 4h]
    B -->|EVA 1–3\\nLeve| D[Paracetamol 1g c/8h VO\\n± Ibuprofeno 400 mg c/8h VO]
    B -->|EVA 4–6\\nModerado| E[Ketorolaco 30 mg IV c/8h\\n+ Paracetamol 1g c/8h IV/VO]
    B -->|EVA 7–10\\nSevero| F[Morfina 2–4 mg IV lento\\nc/4–6h + Antieméticos]
    D --> G[Reevaluar EVA en 30 min]
    E --> G
    F --> G
    G --> H{¿EVA ≤ 3\\ntras analgesia?}
    H -->|Sí| I[Mantener pauta\\nControl c/4h]
    H -->|No — EVA persistente| J{¿Escalón máximo\\nalcanzado?}
    J -->|No| K[Subir escalón analgésico]
    J -->|Sí — morfina a dosis plena| L[Avisar médico tratante\\nConsiderar PCA,\\nbloqueo nervioso,\\no anestesista]
    K --> G
    I --> M{¿24h post-cirugía?}
    M -->|Sí| N[Transición a analgesia oral\\nketorolaco VO o tramadol VO]
    M -->|No| I`,
      layout_position: 'main',
    },
    {
      id: 'dolor-farmacos',
      type: 'flowchart',
      color: 'green',
      order: 3,
      title: 'Fármacos Disponibles y Dosis — HCSFB',
      content: 'Formulario analgésico disponible en el HCSFB y dosis habituales',
      details: [
        'Paracetamol: 1g IV/VO c/6–8h (máx 4g/día; 2g/día en insuficiencia hepática)',
        'Ketorolaco: 30 mg IV c/8h × máx 5 días (contraindicado en IR, úlcera, sangrado)',
        'Ibuprofeno: 400–600 mg VO c/8h (ajustar si TFG < 60 mL/min)',
        'Metamizol: 1–2 g IV c/8h (alternativa a AINE en alergia o contraindicación)',
        'Morfina: 2–4 mg IV lento c/4h (titular por EVA; monitorear FR y sedación)',
        'Tramadol: 50–100 mg VO c/8h (evitar en epilepsia; náuseas frecuentes)',
        'Antieméticos de soporte: Metoclopramida 10 mg IV c/8h o Ondansetrón 4 mg IV',
      ],
      layout_position: 'main',
    },
  ],
};

// ─────────────────────────────────────────────────────────────
// 4. GCL 2.2.1 — Error de Medicación
// ─────────────────────────────────────────────────────────────
const ERROR_MED = {
  id: '23e96a67-0f39-4bfe-91e0-88d63d04c3ae',
  meta: {
    protocol_code:      'GCL 2.2.1',
    protocol_edition:   'Cuarta',
    protocol_date:      'Enero 2023',
    protocol_validity:  'Enero 2028',
    protocol_objective: 'Establecer el procedimiento de detección, notificación y análisis de errores de medicación en el HCSFB, promoviendo la cultura de seguridad y la prevención de eventos adversos.',
    protocol_authors: [
      { name: 'Comité de Calidad y Seguridad del Paciente HCSFB', role: 'Elaborador' },
      { name: 'Servicio de Farmacia HCSFB',                         role: 'Revisor técnico' },
      { name: 'EU María Teresa Medina Bravo',                       role: 'Revisora — OFICYSP' },
      { name: 'Valeska Vivallo Poblete',                             role: 'Revisora — OFICYSP' },
      { name: 'Dr. Álvaro Lagos Llanos',                             role: 'Aprobador — Director HCSFB' },
    ],
  },
  blocks: [
    {
      id: 'error-tipos',
      type: 'criteria',
      color: 'blue',
      order: 1,
      title: 'Tipos de Errores de Medicación — Clasificación HCSFB',
      content: 'Categorías de errores de medicación que deben ser reportados en el HCSFB',
      items: [
        'Fármaco equivocado: medicamento no prescrito administrado al paciente',
        'Dosis incorrecta: dosis mayor o menor a la prescrita (incluye errores de cálculo)',
        'Vía de administración errónea: EV en vez de VO, o viceversa',
        'Horario incorrecto: administración fuera del horario prescrito (> 60 min de diferencia)',
        'Paciente equivocado: medicamento administrado a paciente que no corresponde',
        'Omisión: fármaco prescrito no administrado sin justificación documentada',
        'Error de transcripción: copiado incorrecto de la prescripción médica',
        'Error de preparación: dilución incorrecta, mezcla incompatible',
      ],
      layout_position: 'main',
    },
    {
      id: 'error-mermaid',
      type: 'mermaid',
      order: 2,
      title: 'Flujo de Reporte de Error de Medicación',
      content: `flowchart TD
    A([Error de medicación\\ndetectado]) --> B{¿El paciente\\nrecibió el fármaco?}
    B -->|No — error interceptado| C[Registrar como\\nerror sin daño\\nno administrar]
    B -->|Sí — ya administrado| D{¿Hay daño\\nclínico?}
    D -->|Sí| E[AVISAR MÉDICO\\nde turno INMEDIATO\\nTratar al paciente]
    D -->|No o mínimo| F[Monitoreo clínico\\nc/1h por 4h]
    E --> G[Documentar en SOME:\\nfármaco, dosis, vía,\\nhora y contexto]
    F --> G
    C --> G
    G --> H[Notificar a Enfermera Jefa\\ny QF de turno en < 1h]
    H --> I[Completar formulario\\nOIRS / Sistema de reporte\\nde EAIG HCSFB]
    I --> J[Análisis de causa raíz\\nen reunión de servicio\\nen < 72h]
    J --> K{¿Evento centinela\\no EAI grave?}
    K -->|Sí| L[Reporte SEREMI\\ny Análisis RCA formal\\ncon Dirección]
    K -->|No| M[Plan de mejora local\\ndocumentado en acta]
    L --> N([Seguimiento: implementar\\ncambios preventivos])
    M --> N`,
      layout_position: 'main',
    },
    {
      id: 'error-prevencion',
      type: 'flowchart',
      color: 'green',
      order: 3,
      title: 'Estrategias de Prevención — HCSFB',
      content: 'Barreras de seguridad para prevenir errores de medicación en el HCSFB',
      details: [
        'Los 5 correctos antes de cada administración: paciente, fármaco, dosis, vía, hora',
        'Pulsera de identificación verificada antes de cada administración',
        'Medicamentos de alto riesgo marcados con etiqueta roja en carro de medicamentos',
        'Doble chequeo para: Heparina, Insulina, KCl IV concentrado, Digoxina, Morfina',
        'Prescripción médica electrónica en SOME (evitar órdenes verbales salvo urgencias)',
        'Almacenamiento segregado: similares sonoros/visuales separados en farmacia y carro',
        'Inducción obligatoria en manejo de medicamentos de alto riesgo para nuevos funcionarios',
      ],
      layout_position: 'main',
    },
  ],
};

// ─────────────────────────────────────────────────────────────
// 5. GCL 2.2.2 — Prevención de Caídas
// ─────────────────────────────────────────────────────────────
const CAIDAS = {
  id: 'c97b6632-904c-4e9c-ba80-defb5b1199d9',
  meta: {
    protocol_code:      'GCL 2.2.2',
    protocol_edition:   'Quinta',
    protocol_date:      'Mayo 2021',
    protocol_validity:  'Mayo 2026',
    protocol_objective: 'Estandarizar la evaluación del riesgo de caídas mediante la Escala Dowton y la implementación de medidas preventivas escalonadas en pacientes hospitalizados del HCSFB.',
    protocol_authors: [
      { name: 'Comité de Calidad y Seguridad del Paciente HCSFB', role: 'Elaborador' },
      { name: 'Servicio de Enfermería HCSFB',                       role: 'Revisor' },
      { name: 'EU María Teresa Medina Bravo',                       role: 'Revisora — OFICYSP' },
      { name: 'Dr. Álvaro Lagos Llanos',                             role: 'Aprobador — Director HCSFB' },
    ],
  },
  blocks: [
    {
      id: 'caida-dowton',
      type: 'flowchart',
      color: 'blue',
      order: 1,
      title: 'Escala Dowton — Evaluación de Riesgo de Caídas',
      content: 'Ítems y puntaje de la escala Dowton aplicada al ingreso hospitalario HCSFB',
      details: [
        'Caídas previas: No = 0 / Sí = 1',
        'Medicamentos: Ninguno = 0 / Sedantes, diuréticos, hipotensores, antiparkinsonianos, antidepresivos = 1 c/u',
        'Déficit sensorial: No = 0 / Déficit visual = 1 / Déficit auditivo = 1 / Extremidad afectada = 1',
        'Estado mental: Orientado = 0 / Confuso = 1',
        'Deambulación: Normal = 0 / Con ayuda técnica = 1 / Insegura = 2 / Imposible = 3',
        'RIESGO BAJO: Dowton 0–2 → medidas estándar',
        'RIESGO ALTO: Dowton ≥ 3 → intervención intensiva + etiqueta visual de riesgo en cama',
      ],
      layout_position: 'main',
    },
    {
      id: 'caida-medidas',
      type: 'criteria',
      color: 'green',
      order: 2,
      title: 'Medidas Preventivas por Nivel de Riesgo',
      content: 'Intervenciones aplicadas según puntaje Dowton en hospitalizados HCSFB',
      items: [
        '✅ TODOS los pacientes: cama en posición más baja, frenos puestos, luz nocturna encendida',
        '✅ TODOS: timbre de llamada al alcance, piso seco, calzado antideslizante, barandas laterales',
        '⚠️ Dowton ≥ 3: etiqueta naranja "Riesgo de Caídas" en cama y puerta de habitación',
        '⚠️ Dowton ≥ 3: acompañante familiar durante traslados; levantarse solo NO autorizado',
        '⚠️ Dowton ≥ 3: evaluar dispositivos de apoyo (andador, bastón) y solicitar kinesiólogo',
        '⚠️ Dowton ≥ 3: psicoeducación a paciente y familia sobre riesgo y cómo pedir ayuda',
        '🔴 Post-caída: Dowton reevaluado en < 2h; formulario OIRS completado en < 24h',
      ],
      layout_position: 'main',
    },
    {
      id: 'caida-postcaida',
      type: 'flowchart',
      color: 'red',
      order: 3,
      title: 'Manejo Post-Caída',
      content: 'Pasos inmediatos ante una caída en hospitalizados HCSFB',
      details: [
        '1. No mover al paciente hasta evaluación médica (descartar fractura o TCE)',
        '2. Llamar a médico de turno en < 5 minutos',
        '3. Exploración neurológica mínima: Glasgow, pupilas, fuerzas',
        '4. Si TCE: Glasgow, pupila, TAC de cráneo si indicado',
        '5. Documentar en SOME: circunstancias, lesiones, médico que evaluó, acciones',
        '6. Notificar a enfermera jefa y completar formulario OIRS en < 24h',
        '7. Reevaluar Dowton y ajustar plan preventivo según hallazgos',
        '8. Comunicar a familia el mismo día',
      ],
      layout_position: 'main',
    },
  ],
};

// ─────────────────────────────────────────────────────────────
// 6. GCL 1.9 — Contención Física
// ─────────────────────────────────────────────────────────────
const CONTENCION_FISICA = {
  id: '9e0b3406-9055-43a4-8a75-bf6d290bceb4',
  meta: {
    protocol_code:      'GCL 1.9',
    protocol_edition:   'Tercera',
    protocol_date:      'Enero 2023',
    protocol_validity:  'Enero 2028',
    protocol_objective: 'Regular el uso de la contención física como medida de último recurso en el HCSFB, garantizando el respeto a la dignidad del paciente, la indicación médica formal y el monitoreo continuo durante su aplicación.',
    protocol_authors: [
      { name: 'Comité de Calidad y Seguridad del Paciente HCSFB', role: 'Elaborador' },
      { name: 'Dr. Rodrigo Enríquez Heredia',                       role: 'Revisor — Jefe PROSAM HCSFB' },
      { name: 'EU María Teresa Medina Bravo',                       role: 'Revisora — OFICYSP' },
      { name: 'Dr. Álvaro Lagos Llanos',                             role: 'Aprobador — Director HCSFB' },
    ],
  },
  blocks: [
    {
      id: 'cfis-indicaciones',
      type: 'criteria',
      color: 'red',
      order: 1,
      title: 'Indicaciones y Contraindicaciones de Contención Física',
      content: 'Criterios para aplicar contención física en hospitalizados HCSFB — medida de ÚLTIMO RECURSO',
      items: [
        '✅ Riesgo inminente de autolesión o agresión a terceros que no responde a intervención verbal',
        '✅ Extracción de dispositivos críticos (TET, SNG, catéter central) con riesgo vital inmediato',
        '✅ Paciente con delirium agitado con riesgo de caídas grave sin alternativa farmacológica',
        '❌ Castigo o control de conducta no urgente',
        '❌ Como sustituto de vigilancia o recurso humano insuficiente',
        '❌ Sin indicación médica escrita o en su defecto verbal documentada después',
        '❌ Fracturas activas, osteoporosis severa, coagulopatía (evaluar caso a caso)',
      ],
      layout_position: 'main',
    },
    {
      id: 'cfis-procedimiento',
      type: 'flowchart',
      color: 'amber',
      order: 2,
      title: 'Procedimiento de Contención Física — Pasos',
      content: 'Secuencia de acciones para aplicar contención física de forma segura en HCSFB',
      details: [
        '1. Intentar siempre primero: de-escalada verbal, reorientación, presencia calmante',
        '2. Indicación médica: prescrita por médico o en urgencia documentada en < 1h post-aplicación',
        '3. Mínimo 2 personas para aplicar: técnico + enfermera, con el médico notificado',
        '4. Material: arnés o correas acolchadas (nunca sábanas ni vendas); fijar a estructura fija de cama',
        '5. Posición: decúbito supino con cabecera a 30–45°; nunca boca abajo',
        '6. Punto de fijación: muñecas y/o tobillos; nunca cuello, tórax ni cintura',
        '7. Verificar circulación distal: pulso, color y temperatura cada 15 minutos',
        '8. Registrar en SOME: hora inicio, motivo, tipo de contención, persona que aplica',
        '9. Liberación progresiva: revisar necesidad cada 2h; liberación ante disminución del riesgo',
      ],
      layout_position: 'main',
    },
    {
      id: 'cfis-monitoreo',
      type: 'criteria',
      color: 'green',
      order: 3,
      title: 'Monitoreo Durante la Contención',
      content: 'Vigilancia obligatoria mientras el paciente está contenido en HCSFB',
      items: [
        'Signos vitales: FC, PA, SpO₂ y temperatura cada 30 minutos',
        'Circulación distal (muñecas/tobillos): color, temperatura, pulso cada 15 min',
        'Estado mental y agitación: escala RASS (Richmond) cada 30 min',
        'Hidratar y alimentar si se puede (con supervisión); higiene y posición c/2h',
        'Presencia continua de técnico o enfermería en línea visual directa con el paciente',
        'Documentar evaluación c/1h en hoja de signos vitales con firma y hora',
        'Notificar a familia en < 2h de aplicada la contención (excepto contraindicación legal)',
      ],
      layout_position: 'sidebar',
    },
  ],
};

// ─────────────────────────────────────────────────────────────
// 7. HCSFB 139 — Toracocentesis en Adultos
// ─────────────────────────────────────────────────────────────
const TORACOCENTESIS = {
  id: 'df8dbe5d-59a0-4447-80a7-3af37319e325',
  meta: {
    protocol_code:      'HCSFB 139',
    protocol_edition:   'Primera',
    protocol_date:      'Mayo 2025',
    protocol_validity:  'Mayo 2030',
    protocol_objective: 'Estandarizar el procedimiento de toracocentesis en adultos en los servicios clínicos del HCSFB, asegurando una indicación adecuada, técnica segura, y manejo de complicaciones.',
    protocol_authors: [
      { name: 'Dr. Felipe Sancho Tapia',      role: 'Elaborador — Subdirector Médico HCSFB' },
      { name: 'Valeska Vivallo Poblete',        role: 'Revisora — OFICYSP HCSFB' },
      { name: 'Dr. Álvaro Lagos Llanos',        role: 'Aprobador — Director HCSFB' },
    ],
  },
  blocks: [
    {
      id: 'tora-indicaciones',
      type: 'criteria',
      color: 'blue',
      order: 1,
      title: 'Indicaciones y Contraindicaciones',
      content: 'Criterios clínicos para realizar toracocentesis en el HCSFB',
      items: [
        '✅ Diagnóstica: derrame pleural no explicado (> 10 mm en ecografía)',
        '✅ Terapéutica: derrame grande con disnea significativa o compromiso hemodinámico',
        '✅ Empiema: derrame pleural con sepsis sin mejoría con antibióticos',
        '❌ Relativa: coagulopatía grave (INR > 2.0 o plaquetas < 25.000) — evaluar caso a caso',
        '❌ Infección de piel sobre zona de punción',
        '❌ Derrame pequeño sin guía ecográfica disponible (si < 10 mm en decúbito lateral)',
        '❌ Ventilación mecánica con PEEP alto (riesgo de neumotórax a tensión)',
      ],
      layout_position: 'main',
    },
    {
      id: 'tora-tecnica',
      type: 'flowchart',
      color: 'green',
      order: 2,
      title: 'Técnica de Toracocentesis — HCSFB',
      content: 'Pasos del procedimiento con referencia al kit disponible en pabellón HCSFB',
      details: [
        '1. Consentimiento informado firmado; coagulación y Rx tórax recientes disponibles',
        '2. Posición: sentado con brazos sobre almohada en mesa; si no tolera → decúbito lateral',
        '3. Ecografía bedside para confirmar localización y marcar punto de punción',
        '4. Preparación estéril: campo, guantes, povidona yodada o clorhexidina',
        '5. Kit de toracocentesis de pabellón HCSFB (disponible en arsenal; solicitar con 2h de anticipación)',
        '6. Anestesia local: Lidocaína 1% 5–10 mL infiltrado hasta pleura parietal',
        '7. Punción: borde superior de la costilla inferior (evitar paquete vasculonervioso)',
        '8. Extracción máxima terapéutica: 1.500 mL en primera sesión (riesgo edema ex vacuo)',
        '9. Muestras diagnósticas: tubo rojo (bioquímica, LDH, proteínas, glucosa), EDTA (celular), cultivo',
        '10. Apósito; Rx tórax control en < 2h post-procedimiento para descartar neumotórax',
      ],
      layout_position: 'main',
    },
    {
      id: 'tora-complicaciones',
      type: 'criteria',
      color: 'red',
      order: 3,
      title: 'Complicaciones y Manejo',
      content: 'Complicaciones post-toracocentesis y conducta en HCSFB',
      items: [
        'Neumotórax (5–10%): si < 20% y asintomático → observación; si > 20% o sintomático → pleurotomía',
        'Hemotórax: sangre en tubo → extraer máx 200 mL y suspender; avisar médico tratante',
        'Edema pulmonar re-expansión: si > 1.500 mL extraídos → O₂, diuréticos, soporte',
        'Vasovagal: detener procedimiento, decúbito supino, atropina 0.5 mg IV si bradicardia severa',
        'Infección pleural post-punción: fiebre + derrame turbo días después → pleurotomía + ATB',
        'Todo neumotórax post-procedimiento debe ser reportado en formulario OIRS',
      ],
      layout_position: 'sidebar',
    },
  ],
};

// ─────────────────────────────────────────────────────────────
// 8. HCSFB 129 — Uso Adecuado de Hipnóticos
// ─────────────────────────────────────────────────────────────
const HIPNOTICOS = {
  id: 'eb702967-32fa-4aef-8246-742195d078e8',
  meta: {
    protocol_code:      'HCSFB 129',
    protocol_edition:   'Primera',
    protocol_date:      'Marzo 2025',
    protocol_validity:  'Marzo 2030',
    protocol_objective: 'Promover el uso racional de fármacos hipnóticos en el HCSFB, priorizando medidas no farmacológicas del sueño y limitando el uso de benzodiacepinas a indicaciones precisas y acotadas.',
    protocol_authors: [
      { name: 'Dra. Micaela Fasani Montagna', role: 'Elaboradora — Subdirectora Médica HCSFB' },
      { name: 'Dr. Felipe Sancho Tapia',       role: 'Revisor — Subdirector Médico HCSFB' },
      { name: 'Dr. Álvaro Lagos Llanos',        role: 'Aprobador — Director HCSFB' },
    ],
  },
  blocks: [
    {
      id: 'hipn-evaluacion',
      type: 'flowchart',
      color: 'blue',
      order: 1,
      title: 'Evaluación del Insomnio Hospitalario',
      content: 'Pasos para evaluar el insomnio en paciente hospitalizado antes de indicar hipnótico',
      details: [
        'Preguntar: ¿Cuánto duerme en casa? ¿Causa del insomnio actual? ¿Uso de hipnóticos previo?',
        'Identificar causa subyacente: dolor, disnea, prurito, ansiedad, delirium incipiente, fármacos',
        'Medidas ambientales: bajar luz nocturna, reducir ruido, temperatura confortable',
        'Higiene del sueño: horario fijo, sin pantallas, evitar cafeína vespertina',
        'Tratar la causa si es identificable ANTES de indicar hipnótico',
        'Escala Epworth o Pittsburgh no requerida en contexto agudo hospitalario',
      ],
      layout_position: 'main',
    },
    {
      id: 'hipn-mermaid',
      type: 'mermaid',
      order: 2,
      title: 'Algoritmo — Manejo del Insomnio Hospitalario',
      content: `flowchart TD
    A([Paciente hospitalizado\\ncon insomnio]) --> B{¿Causa subyacente\\nidentificada?}
    B -->|Sí| C[Tratar causa:\\ndolor, disnea, ansiedad,\\nambiente]
    C --> D{¿Resuelve\\ncon medidas?}
    D -->|Sí| FIN1([Sin hipnótico])
    D -->|No| E
    B -->|No — insomnio primario| E{¿Medidas no\\nfarmacológicas?}
    E -->|No implementadas| F[Implementar higiene de sueño,\\nbaja luz, ambiente tranquilo]
    F --> D
    E -->|Sí — insuficientes| G{¿Edad ≥ 65 años?}
    G -->|Sí| H[EVITAR benzodiacepinas\\nConsiderar melatonina 2–5 mg\\no lorazepam 0.5 mg puntual si\\nriesgo-beneficio claro]
    G -->|No| I{¿Antecedente de\\nadicción o hepatopatía?}
    I -->|Sí| J[EVITAR BZD\\nMelatonina + control\\nde causa subyacente]
    I -->|No| K[Hipnótico de vida media corta:\\nZolpidem 5–10 mg o\\nClotiazepam 5 mg nocturno\\nmáx 7–14 días]
    K --> L[Reevaluar necesidad cada 3 días\\nNo renovar sin evaluación]
    H --> L
    J --> L`,
      layout_position: 'main',
    },
    {
      id: 'hipn-farmacos',
      type: 'flowchart',
      color: 'green',
      order: 3,
      title: 'Fármacos Hipnóticos — Dosis y Restricciones',
      content: 'Medicamentos hipnóticos disponibles en HCSFB y criterios de uso',
      details: [
        'Zolpidem 5 mg: primera línea en adultos < 65 años; administrar 30 min antes de dormir',
        'Clotiazepam 5 mg: alternativa a zolpidem si hay componente ansioso; evitar en ≥ 65 años',
        'Melatonina 2–5 mg: primera línea en adultos ≥ 65 años; sin riesgo de dependencia',
        'Lorazepam 0.5–1 mg: reservar para delirium agitado o ansiedad severa; no como hipnótico rutinario',
        'Antihistamínicos sedantes (difenhidramina): NO recomendados — efecto anticolinérgico y delirium',
        'Antipsicóticos a dosis hipnóticas: NO indicados salvo delirium activo con agitación',
        'Duración máxima de indicación: 7 días; renovación solo si hay evaluación médica documentada',
      ],
      layout_position: 'main',
    },
  ],
};

// ─────────────────────────────────────────────────────────────
// 9. HCSFB 161 — Programa PROA (Antibióticos)
// ─────────────────────────────────────────────────────────────
const PROA = {
  id: '286e18f1-7d84-4e43-a90a-a15923f4d14c',
  meta: {
    protocol_code:      'HCSFB 161',
    protocol_edition:   'Primera',
    protocol_date:      'Febrero 2026',
    protocol_validity:  'Febrero 2031',
    protocol_objective: 'Implementar el Programa de Optimización del Uso de Antibióticos (PROA) en el HCSFB para reducir el uso inapropiado de antimicrobianos, disminuir la resistencia bacteriana y mejorar los resultados clínicos.',
    protocol_authors: [
      { name: 'Dr. Felipe Sancho Tapia',      role: 'Elaborador — Subdirector Médico HCSFB' },
      { name: 'Dra. Micaela Fasani Montagna', role: 'Revisora — Subdirectora Médica HCSFB' },
      { name: 'Servicio de Farmacia HCSFB',    role: 'Revisor técnico (QF)' },
      { name: 'Valeska Vivallo Poblete',        role: 'Revisora — OFICYSP HCSFB' },
      { name: 'Dr. Álvaro Lagos Llanos',        role: 'Aprobador — Director HCSFB' },
    ],
  },
  blocks: [
    {
      id: 'proa-principios',
      type: 'criteria',
      color: 'blue',
      order: 1,
      title: 'Principios PROA — Prescripción Adecuada de Antibióticos',
      content: 'Reglas fundamentales del programa PROA del HCSFB',
      items: [
        'Tomar cultivos ANTES de iniciar antibiótico (sangre, orina, esputo según foco)',
        'Iniciar empíricamente según protocolo local de gérmenes más probables',
        'Reevaluar a las 48–72h con resultado de cultivo (antibiograma)',
        'De-escalar: cambiar a antibiótico de espectro más estrecho según antibiograma',
        'Definir duración desde el inicio: documentar fecha de fin en prescripción',
        'No tratar colonizaciones (cultivos positivos sin signos de infección clínica)',
        'Registrar indicación, germen sospechado y duración planificada en cada prescripción',
      ],
      layout_position: 'main',
    },
    {
      id: 'proa-mermaid',
      type: 'mermaid',
      order: 2,
      title: 'Flujo PROA — De Prescripción Empírica a De-escalada',
      content: `flowchart TD
    A([Sospecha de infección\\nbacteriana]) --> B[Tomar cultivos antes\\nde iniciar ATB:\\nsangre, orina, esputo]
    B --> C{¿Infección grave\\no sepsis?}
    C -->|Sí — iniciar inmediato| D[ATB empírico según\\nprotocolo local HCSFB\\nen < 1h en sepsis]
    C -->|No — estable| E[ATB empírico según\\nprotocolo local HCSFB\\nen < 4h]
    D --> F[Reevaluar 48–72h con\\nresultado de cultivo]
    E --> F
    F --> G{¿Cultivo con\\nresultado?}
    G -->|Sí| H{¿Sensible a ATB\\nmás estrecho?}
    G -->|Negativo| I{¿Mejoría clínica?}
    H -->|Sí| J[DE-ESCALAR:\\nCambiar a ATB de\\nespectro más estrecho]
    H -->|No — resistente| K[Ajustar según\\nantibiograma]
    I -->|Sí| L[Suspender ATB\\nsi no es infección\\nbacteriana confirmada]
    I -->|No| M[Ampliar estudio;\\nConsiderar hongos,\\nvirus, otros]
    J --> N[Definir duración total\\nregistrada en SOME]
    K --> N
    N --> O([Completar curso\\nno acortar ni prolongar\\nsin indicación])`,
      layout_position: 'main',
    },
    {
      id: 'proa-duraciones',
      type: 'flowchart',
      color: 'green',
      order: 3,
      title: 'Duraciones Recomendadas — Infecciones Habituales HCSFB',
      content: 'Guía de duración de tratamiento antibiótico según foco infeccioso',
      details: [
        'ITU no complicada (mujer): 3–5 días (nitrofurantoína, cotrimoxazol o fosfomicina)',
        'ITU complicada o pielonefritis: 7–10 días según evolución clínica',
        'Neumonía adquirida comunidad (leve-moderada): 5–7 días',
        'Neumonía grave o intrahospitalaria: 7–14 días según evolución',
        'Celulitis sin sepsis: 5–7 días (cefazolina o cloxacilina)',
        'Infección intraabdominal post-cirugía: 4–7 días tras control de foco',
        'Bacteriemia sin foco aparente (SAMS): 14 días mínimo (reevaluar con infectología HHM)',
        'Endocarditis / osteomielitis: derivar a nivel secundario para manejo prolongado',
      ],
      layout_position: 'main',
    },
  ],
};

// ─────────────────────────────────────────────────────────────
// 10. HCSFB 159 — Contención Farmacológica en Agitación
// ─────────────────────────────────────────────────────────────
const AGITACION = {
  id: '13e6128f-882a-4a19-8e18-47cbf13203eb',
  meta: {
    protocol_code:      'HCSFB 159',
    protocol_edition:   'Primera',
    protocol_date:      'Marzo 2026',
    protocol_validity:  'Marzo 2031',
    protocol_objective: 'Estandarizar el abordaje de la agitación psicomotora en el HCSFB con énfasis en la de-escalada verbal, la contención farmacológica escalonada y los criterios de derivación urgente.',
    protocol_authors: [
      { name: 'Dr. Rodrigo Enríquez Heredia',   role: 'Elaborador — Jefe PROSAM/Programa SM HCSFB' },
      { name: 'Dr. Felipe Sancho Tapia',          role: 'Revisor — Subdirector Médico HCSFB' },
      { name: 'EU María Teresa Medina Bravo',     role: 'Revisora — OFICYSP HCSFB' },
      { name: 'Dr. Álvaro Lagos Llanos',           role: 'Aprobador — Director HCSFB' },
    ],
  },
  blocks: [
    {
      id: 'agit-escala',
      type: 'text',
      color: 'blue',
      order: 1,
      title: 'Escala RASS — Evaluación de Agitación',
      content: 'Richmond Agitation-Sedation Scale para cuantificar nivel de agitación/sedación',
      details: [
        'RASS +4: Combativo — peligroso, violento para personal; contención física + farmacológica',
        'RASS +3: Muy agitado — tira dispositivos, agresivo verbalmente',
        'RASS +2: Agitado — movimientos no intencionados frecuentes',
        'RASS +1: Inquieto — ansioso pero sin movimientos agresivos',
        'RASS 0: Alerta y tranquilo — estado objetivo',
        'RASS -1 a -5: Sedación leve a no despertable — reducir o suspender sedación',
        'Meta RASS en agitación controlada: RASS 0 a -1 (alerta o somnolencia leve)',
      ],
      layout_position: 'main',
    },
    {
      id: 'agit-mermaid',
      type: 'mermaid',
      order: 2,
      title: 'Algoritmo de Manejo de Agitación Psicomotora',
      content: `flowchart TD
    A([Paciente agitado\\nRASS ≥ +1]) --> B[De-escalada verbal:\\nVoz calmada, espacio,\\nevitar confrontación]
    B --> C{¿Responde en\\n5–10 min?}
    C -->|Sí — RASS 0| D([Mantener en observación\\nIdentificar causa])
    C -->|No — agitación persiste| E{¿Causa orgánica\\nidentificada?}
    E -->|Delirium, hipoxia,\\nhipoglicemia, dolor| F[Tratar causa +\\nHaloperidol 2.5–5 mg IM]
    E -->|Psiquiátrica o\\nno identificada| G{¿RASS +3 o +4\\ncon riesgo físico?}
    G -->|Sí| H[Contención física + llamar\\nmédico de turno inmediato]
    G -->|No| I[Farmacológico según tipo]
    H --> I
    I --> J{Tipo de agitación}
    J -->|Delirium hiperactivo| K[Haloperidol 2.5–5 mg IM\\ ± Lorazepam 1–2 mg IM]
    J -->|Psicótica aguda| L[Olanzapina 10 mg IM o\\nHaloperidol 5 mg IM]
    J -->|Ansiosa/situacional| M[Lorazepam 2 mg IM o\\nMidazolam 2–5 mg IM]
    K --> N[Reevaluar RASS a los 20–30 min]
    L --> N
    M --> N
    N --> O{¿RASS ≤ 0?}
    O -->|Sí| P([Monitorizar cada 30 min\\ntratar causa subyacente])
    O -->|No — persiste| Q{¿2a dosis?}
    Q -->|Sí ya administrada| R[DERIVAR urgencias HHM\\nLlamar Dr. de turno HCSFB]
    Q -->|No| S[Repetir dosis según protocolo]
    S --> N`,
      layout_position: 'main',
    },
    {
      id: 'agit-farmacos',
      type: 'flowchart',
      color: 'green',
      order: 3,
      title: 'Fármacos de Contención Farmacológica — HCSFB',
      content: 'Medicamentos disponibles, dosis y vías de administración',
      details: [
        'Haloperidol 5 mg/mL amp: 2.5–5 mg IM (adultos); máx 20 mg/24h; vigilar QT prolongado',
        'Lorazepam 4 mg/2mL amp: 1–2 mg IM/IV lento; máx 4 mg por episodio; vigilar FR',
        'Olanzapina 10 mg polvo: 10 mg IM; NO combinar con lorazepam IV (riesgo fallo respiratorio)',
        'Midazolam 5 mg/mL amp: 2–5 mg IM; inicio rápido (5–10 min); vigilar saturación y FR',
        'Diazepam 10 mg/2mL amp: 5–10 mg IV lento (no IM); alternativa si no hay midazolam',
        'Equipamiento de apoyo en habitación: O₂, mascarilla, ambu, desfibrilador accesible',
      ],
      layout_position: 'main',
    },
  ],
};

// ─────────────────────────────────────────────────────────────
// 11. HCSFB 165 — Activación y Respuesta Rápida Psiquiátrica
// ─────────────────────────────────────────────────────────────
const RESPUESTA_RAPIDA = {
  id: '099cba54-aec4-4d2b-9760-64b5302fe77e',
  meta: {
    protocol_code:      'HCSFB 165',
    protocol_edition:   'Primera',
    protocol_date:      'Marzo 2026',
    protocol_validity:  'Marzo 2031',
    protocol_objective: 'Establecer el proceso de activación del equipo de respuesta rápida para pacientes hospitalizados con diagnóstico psiquiátrico que presentan descompensación aguda en el HCSFB.',
    protocol_authors: [
      { name: 'Dr. Rodrigo Enríquez Heredia',  role: 'Elaborador — Jefe PROSAM/Programa SM HCSFB' },
      { name: 'Dr. Felipe Sancho Tapia',         role: 'Revisor — Subdirector Médico HCSFB' },
      { name: 'Valeska Vivallo Poblete',          role: 'Revisora — OFICYSP HCSFB' },
      { name: 'Dr. Álvaro Lagos Llanos',          role: 'Aprobador — Director HCSFB' },
    ],
  },
  blocks: [
    {
      id: 'rr-criterios',
      type: 'criteria',
      color: 'red',
      order: 1,
      title: 'Criterios de Activación — Respuesta Rápida Psiquiátrica',
      content: 'Situaciones que requieren activar el equipo de respuesta rápida para pacientes psiquiátricos hospitalizados',
      items: [
        'Agitación psicomotora severa (RASS ≥ +3) que no responde a de-escalada verbal en 10 min',
        'Conducta autolesiva activa o intento de suicidio en curso',
        'Alucinaciones o delirios con riesgo inminente para el paciente u otros',
        'Crisis disociativa con pérdida de conciencia o conducta incontrolable',
        'Paciente psiquiátrico con compromiso hemodinámico o neurológico agudo (descartar causa orgánica)',
        'Familia o equipo de turno que percibe riesgo inmediato sin poder contenerlo',
      ],
      layout_position: 'main',
    },
    {
      id: 'rr-flujo',
      type: 'flowchart',
      color: 'amber',
      order: 2,
      title: 'Flujo de Activación — Equipo de Respuesta Rápida HCSFB',
      content: 'Secuencia de activación y roles del equipo en la respuesta rápida psiquiátrica',
      details: [
        '1. Enfermera de turno detecta criterio de activación → llama al médico de turno INMEDIATO',
        '2. Médico de turno acude en < 5 min; evalúa RASS y seguridad del entorno',
        '3. Si RASS ≥ +3 con riesgo físico → activar respuesta rápida (código interno HCSFB)',
        '4. Equipo: médico de turno + 2 técnicos paramédicos + enfermera de servicio',
        '5. Entrar en grupo, con el más calmado al frente; evitar confrontación directa',
        '6. De-escalada verbal: voz calmada, espacio físico, sin movimientos bruscos',
        '7. Si falla en 5–10 min → contención farmacológica según protocolo HCSFB 159',
        '8. Si persiste riesgo → contención física + notificar a Dr. Rodrigo Enríquez (PROSAM) o jefe de guardia',
        '9. Evaluar traslado a Servicio de Urgencias HHM si no se logra contención en HCSFB',
        '10. Documentar en SOME: hora, equipo, fármacos, RASS inicial y final, decisión final',
      ],
      layout_position: 'main',
    },
    {
      id: 'rr-postepisodio',
      type: 'criteria',
      color: 'green',
      order: 3,
      title: 'Acciones Post-Episodio',
      content: 'Seguimiento obligatorio tras activación de respuesta rápida psiquiátrica',
      items: [
        'Debriefing de equipo en < 1h post-episodio (médico, enfermera, técnicos)',
        'Reevaluar RASS y signos vitales cada 30 min hasta RASS 0 por al menos 2h',
        'Completar formulario OIRS de evento en < 24h (criterio de reporte obligatorio)',
        'Revisar plan de tratamiento con psiquiatra o Dr. Enríquez Heredia en < 24h',
        'Informar a familia del episodio y cambios en plan terapéutico',
        'Evaluar si el paciente requiere nivel de atención más complejo (derivar a UPH si disponible)',
      ],
      layout_position: 'main',
    },
  ],
};

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────
const UPDATES = [
  LPP, TRANSFUSION, DOLOR, ERROR_MED, CAIDAS,
  CONTENCION_FISICA, TORACOCENTESIS, HIPNOTICOS,
  PROA, AGITACION, RESPUESTA_RAPIDA,
];

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
