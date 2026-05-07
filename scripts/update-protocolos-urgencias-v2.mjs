/**
 * Enriquecimiento v2 — Protocolos Urgencias
 * Agrega autores reales, bloques mermaid, contenido operativo local.
 * IDs resueltos dinámicamente por nombre de topic.
 *
 * Uso:  node scripts/update-protocolos-urgencias-v2.mjs
 *       node scripts/update-protocolos-urgencias-v2.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

// Helpers
async function resolveId(nameFragment) {
  const { data, error } = await supabase
    .from('topics')
    .select('id, name')
    .ilike('name', `%${nameFragment}%`)
    .limit(1)
    .single();
  if (error || !data) { console.warn(`  ⚠️  No se encontró topic con nombre "%${nameFragment}%"`); return null; }
  console.log(`  🔍 Resuelto: "${data.name}" → ${data.id}`);
  return data.id;
}

// ─────────────────────────────────────────────────────────────
// 1. GCL 1.4 A — RCP Adultos
// ─────────────────────────────────────────────────────────────
const RCP_ADULTOS = {
  nameFragment: 'Reanimación Cardiopulmonar Avanzada',
  meta: {
    protocol_code:      'GCL 1.4 A',
    protocol_edition:   'Cuarta',
    protocol_date:      'Julio 2023',
    protocol_validity:  'Julio 2028',
    protocol_objective: 'Estandarizar el procedimiento de Reanimación Cardiopulmonar (RCP) en adultos en el HCSFB siguiendo las guías AHA 2020, garantizando una respuesta eficiente y coordinada ante el paro cardiorrespiratorio.',
    protocol_authors: [
      { name: 'Comité de Calidad y Seguridad del Paciente HCSFB', role: 'Elaborador' },
      { name: 'Dr. Sebastián Bustos Sepúlveda',                    role: 'Revisor — Jefe Servicio Urgencias HCSFB' },
      { name: 'EU María Teresa Medina Bravo',                       role: 'Revisora — OFICYSP' },
      { name: 'Dr. Álvaro Lagos Llanos',                             role: 'Aprobador — Director HCSFB' },
    ],
  },
  blocks: [
    {
      id: 'rcpa-mermaid',
      type: 'mermaid',
      order: 1,
      title: 'Algoritmo RCP Adultos — AHA 2020 Adaptado HCSFB',
      content: `flowchart TD
    A([Paciente sin respuesta\\nno respira o solo gasping]) --> B[LLAMA A AYUDA\\nActiva código azul:\\nNúmero interno HCSFB]
    B --> C[Verifica pulso carotídeo\\n≤ 10 segundos]
    C -->|Sin pulso o dudoso| D[Inicia compresiones\\n100–120/min · 5–6 cm profundidad]
    C -->|Hay pulso| E[Ventilaciones rescate\\n1 c/5–6 seg · reevaluar c/2 min]
    D --> F[Relación 30:2 si sin vía aérea\\navanzada; continuo si con ETT]
    F --> G[Conectar DEA / desfibrilador\\ncuando esté disponible]
    G --> H{¿Ritmo\\ndesfibrilable?}
    H -->|FV / TV sin pulso| I[Desfibrilar 200 J bifásico\\nReanudar RCP inmediatamente]
    H -->|AESP / Asistolia| J[Adrenalina 1 mg IV c/3–5 min\\nBuscar causas reversibles 4H/4T]
    I --> K[RCP 2 min · Reevaluar ritmo]
    J --> K
    K --> L{¿Ritmo con pulso?}
    L -->|Sí| M[Cuidados post-resucitación:\\nO₂ SpO₂ 94–98%\\nTA, glucemia, ECG 12D]
    L -->|No| H
    M --> N([Traslado a UCI / HHM\\nsi estabilizado])`,
      layout_position: 'main',
    },
    {
      id: 'rcpa-causas',
      type: 'criteria',
      color: 'red',
      order: 2,
      title: '4H y 4T — Causas Reversibles del PCR',
      content: 'Causas tratables a identificar durante la RCP',
      items: [
        '4H: Hipoxia · Hipovolemia · Hipo/Hiperkalemia (electrolitos) · Hipotermia',
        '4T: Taponamiento cardíaco · Trombosis coronaria (IAM) · Tromboembolismo pulmonar · Tórax a tensión (neumotórax)',
        'Hipoglicemia: glucemia capilar obligatoria en todo PCR — SG 50% si < 70 mg/dL',
        'Intoxicación: preguntar medicamentos, historia clínica rápida',
        'Carro de paro ubicado en: Servicio de Urgencias y pabellón HCSFB (revisar mensualmente)',
      ],
      layout_position: 'main',
    },
    {
      id: 'rcpa-farmacos',
      type: 'flowchart',
      color: 'green',
      order: 3,
      title: 'Fármacos del Carro de Paro — HCSFB',
      content: 'Medicamentos disponibles y dosis en el código azul adultos',
      details: [
        'Adrenalina 1 mg/mL: 1 mg IV c/3–5 min (FV/TV y AESP/asistolia)',
        'Amiodarona 150 mg/3mL: 300 mg IV bolo en FV refractaria; 150 mg en recurrencia',
        'Sulfato de Magnesio 1g/5mL: 1–2 g IV en Torsades de Pointes',
        'Atropina 0.5 mg/mL: 0.5–1 mg IV en bradicardia sintomática (no en PCR asistolia)',
        'Bicarbonato de Sodio 8.4%: 1 mEq/kg IV en acidosis severa o hiperkalemia',
        'Glucosa 50%: 25–50 g IV en hipoglicemia documentada',
        'Lidocaína 2%: alternativa a amiodarona si no disponible: 1–1.5 mg/kg IV',
      ],
      layout_position: 'main',
    },
  ],
};

// ─────────────────────────────────────────────────────────────
// 2. GCL 1.4 B — RCP Pediátrico
// ─────────────────────────────────────────────────────────────
const RCP_PEDIATRICO = {
  nameFragment: 'Reanimación Cardiopulmonar Pediátrica',
  meta: {
    protocol_code:      'GCL 1.4 B',
    protocol_edition:   'Cuarta',
    protocol_date:      'Febrero 2024',
    protocol_validity:  'Febrero 2029',
    protocol_objective: 'Estandarizar el procedimiento de RCP pediátrico en el HCSFB con foco en la correcta técnica por edad, dosis de fármacos ajustadas a peso y activación del Código Azul Pediátrico.',
    protocol_authors: [
      { name: 'Comité de Calidad y Seguridad del Paciente HCSFB', role: 'Elaborador' },
      { name: 'Dr. Sebastián Bustos Sepúlveda',                    role: 'Revisor — Jefe Servicio Urgencias HCSFB' },
      { name: 'EU María Teresa Medina Bravo',                       role: 'Revisora — OFICYSP' },
      { name: 'Dr. Álvaro Lagos Llanos',                             role: 'Aprobador — Director HCSFB' },
    ],
  },
  blocks: [
    {
      id: 'rcpp-tecnica',
      type: 'flowchart',
      color: 'blue',
      order: 1,
      title: 'Técnica de Compresiones por Edad',
      content: 'Técnica correcta de compresiones torácicas pediátricas según grupo etario',
      details: [
        'Lactante < 1 año: 2 dedos (índice y medio) sobre esternón; profundidad 4 cm',
        'Lactante 1 rescatador: técnica 2 dedos; 2 rescatadores: técnica 2 pulgares rodeando tórax',
        'Preescolar 1–8 años: talón de una mano; profundidad 5 cm',
        'Escolar > 8 años: técnica adulto (2 manos); profundidad 5–6 cm',
        'Frecuencia en TODOS: 100–120 compresiones/min',
        'Relación: 30:2 (1 rescatador); 15:2 (2 rescatadores)',
        'Ventilaciones: volumen suficiente para elevar tórax (evitar sobreinsuflación)',
      ],
      layout_position: 'main',
    },
    {
      id: 'rcpp-farmacos',
      type: 'text',
      color: 'green',
      order: 2,
      title: 'Fármacos Ajustados a Peso — Referencia Rápida',
      content: 'Dosis de fármacos en código azul pediátrico HCSFB (calculados por kg de peso)',
      details: [
        'Adrenalina: 0.01 mg/kg IV (diluir 1 mg en 10 mL SF = 0.1 mg/mL) c/3–5 min; máx 1 mg',
        'Amiodarona: 5 mg/kg IV en FV/TV refractaria; repetir máx 2 veces',
        'Bicarbonato 8.4%: 1 mEq/kg IV (diluir 1:1 con agua destilada en < 1 año)',
        'Glucosa 10%: 2–5 mL/kg IV (en < 1 año); 1–2 mL/kg de SG 25% en mayores',
        'Adenosina: 0.1 mg/kg IV rápido (TSV); máx 6 mg primera dosis; 12 mg segunda',
        'Regla de oro: PESO (kg) = 2 × (edad en años + 4) para niños 1–10 años',
        'Tabla de Broselow disponible en carro de paro pediátrico (emergencias HCSFB)',
      ],
      layout_position: 'sidebar',
    },
    {
      id: 'rcpp-postparo',
      type: 'criteria',
      color: 'amber',
      order: 3,
      title: 'Cuidados Post-Resucitación Pediátrica',
      content: 'Acciones inmediatas tras recuperación de circulación espontánea (ROSC) en el HCSFB',
      items: [
        'SpO₂ objetivo: 94–99% (evitar hiperoxia: FiO₂ titulada)',
        'Glucemia: control inmediato y c/1h; objetivo 70–180 mg/dL',
        'Temperatura: evitar hipertermia (> 38°C aumenta daño cerebral); manejo febril activo',
        'PA: mantener PAM ≥ percentil 5 para la edad con volumen y drogas vasoactivas',
        'ECG 12 derivaciones: QT, bloqueos, síndrome de Brugada',
        'Traslado inmediato a UCI pediátrica HHM con hoja de resumen de evento',
        'Notificar a familia antes del traslado; contacto con médico pediátrico HHM',
      ],
      layout_position: 'main',
    },
  ],
};

// ─────────────────────────────────────────────────────────────
// 3. AOC 1.1 — Código Azul
// ─────────────────────────────────────────────────────────────
const CODIGO_AZUL = {
  nameFragment: 'Código Azul',
  meta: {
    protocol_code:      'AOC 1.1',
    protocol_edition:   'Cuarta',
    protocol_date:      'Julio 2022',
    protocol_validity:  'Julio 2027',
    protocol_objective: 'Estandarizar la activación y respuesta ante el Código Azul (PCR) en el HCSFB, definiendo los roles de cada integrante del equipo, el tiempo de respuesta esperado y el flujo de comunicación.',
    protocol_authors: [
      { name: 'Comité de Calidad y Seguridad del Paciente HCSFB', role: 'Elaborador' },
      { name: 'Dr. Sebastián Bustos Sepúlveda',                    role: 'Revisor — Jefe Urgencias HCSFB' },
      { name: 'EU María Teresa Medina Bravo',                       role: 'Revisora — OFICYSP' },
      { name: 'Dr. Álvaro Lagos Llanos',                             role: 'Aprobador — Director HCSFB' },
    ],
  },
  blocks: [
    {
      id: 'cazul-activacion',
      type: 'flowchart',
      color: 'red',
      order: 1,
      title: 'Activación del Código Azul — HCSFB',
      content: 'Cómo activar el código azul en el HCSFB y tiempo de respuesta esperado',
      details: [
        '1. Quien detecta el paro llama con voz alta: "¡CÓDIGO AZUL! [ubicación exacta]"',
        '2. Simultáneamente: marcar número interno de urgencias HCSFB para activación formal',
        '3. Iniciar RCP básico inmediatamente (no esperar al equipo)',
        '4. Tiempo de respuesta objetivo del equipo de código azul: ≤ 3 minutos desde activación',
        '5. DEA más cercano: servicio de urgencias, pabellón y acceso principal HCSFB',
        '6. Carro de paro: verificar sello de seguridad intacto antes de abrir',
      ],
      layout_position: 'main',
    },
    {
      id: 'cazul-roles',
      type: 'criteria',
      color: 'blue',
      order: 2,
      title: 'Roles del Equipo Código Azul',
      content: 'Responsabilidades asignadas durante la resucitación en HCSFB',
      items: [
        'Líder (médico de turno): dirige maniobras, decide fármacos, coordina equipo, comunica familia',
        'Compresiones (técnico o enfermera): 100–120/min, turnos cada 2 min para evitar fatiga',
        'Vía aérea (médico o enfermera): bolsa-mascarilla o intubación si disponible',
        'Vía venosa + fármacos (enfermera): canalizar vía periférica, preparar y administrar fármacos',
        'Registro (secretaria o técnico): anota hora inicio, fármacos y dosis, ritmos, eventos',
        'Familiar: informar en sala de espera, con acompañante designado del equipo',
      ],
      layout_position: 'main',
    },
    {
      id: 'cazul-postevento',
      type: 'flowchart',
      color: 'green',
      order: 3,
      title: 'Acciones Post Código Azul',
      content: 'Acciones obligatorias tras todo código azul, con o sin ROSC',
      details: [
        'Si ROSC: cuidados post-resucitación, traslado HHM, comunicar familia, registrar en SOME',
        'Si fallecimiento: constatar defunción con hora exacta, comunicar a familia con apoyo',
        'Reponer inmediatamente el carro de paro (fármacos y materiales usados)',
        'Sellar el carro de paro con nuevo sello de seguridad y registrar fecha',
        'Debriefing del equipo en < 2h: ¿qué funcionó? ¿qué mejorar?',
        'Registrar evento en formulario AOC y en SOME con hoja de código azul',
        'Jefe de urgencias (Dr. Bustos) recibe copia del registro en < 24h',
      ],
      layout_position: 'main',
    },
  ],
};

// ─────────────────────────────────────────────────────────────
// 4. Trombolisis HCSFB — IAMEST
// ─────────────────────────────────────────────────────────────
const TROMBOLISIS = {
  nameFragment: 'Trombolisis',
  meta: {
    protocol_code:      'HCSFB',
    protocol_edition:   'Primera',
    protocol_date:      'Marzo 2025',
    protocol_validity:  'Marzo 2030',
    protocol_objective: 'Estandarizar el protocolo de trombolisis farmacológica en el HCSFB para el IAMEST, con Tenecteplase como primera opción y Alteplase como alternativa, definiendo criterios de inclusión/exclusión, tiempo puerta-aguja y manejo post-trombolisis.',
    protocol_authors: [
      { name: 'Dr. Sebastián Bustos Sepúlveda', role: 'Elaborador — Jefe Servicio Urgencias HCSFB' },
      { name: 'Dr. Felipe Sancho Tapia',          role: 'Revisor — Subdirector Médico HCSFB' },
      { name: 'Dr. Álvaro Lagos Llanos',           role: 'Aprobador — Director HCSFB' },
    ],
  },
  blocks: [
    {
      id: 'trombo-criterios',
      type: 'criteria',
      color: 'blue',
      order: 1,
      title: 'Criterios de Inclusión y Exclusión',
      content: 'Criterios para indicar trombolisis en IAMEST en el HCSFB',
      items: [
        '✅ IAMEST confirmado (supra ≥ 1 mm en ≥ 2 derivadas contiguas)',
        '✅ Tiempo de evolución ≤ 12 horas desde inicio de síntomas',
        '✅ Paciente sin acceso a angioplastia primaria en < 120 min',
        '❌ ACV isquémico en los últimos 3 meses o ACV hemorrágico en cualquier momento',
        '❌ Cirugía mayor, trauma grave o RCP traumática en últimas 3 semanas',
        '❌ Sangrado interno activo (no menstrual)',
        '❌ HTA severa refractaria (PAS > 180 o PAD > 110 mmHg al momento de indicación)',
        '❌ Disección aórtica sospechada',
        '❌ Gestación o parto < 18 días',
      ],
      layout_position: 'main',
    },
    {
      id: 'trombo-mermaid',
      type: 'mermaid',
      order: 2,
      title: 'Flujo Trombolisis IAMEST — Tiempo Puerta-Aguja ≤ 30 min',
      content: `flowchart TD
    A([Llegada a urgencias HCSFB\\nDolor precordial > 20 min]) --> B[ECG 12 derivadas\\nen < 10 min]
    B --> C{¿IAMEST\\nconfirmado?}
    C -->|No| D[Manejo SCA SEST\\no diagnóstico diferencial]
    C -->|Sí| E[Avisar médico urgencias\\nDr. Bustos o de turno]
    E --> F{¿Tiempo evolución\\n≤ 12h?}
    F -->|> 12h sin síntomas activos| G[Derivación HHM\\nsin trombolisis]
    F -->|≤ 12h| H{¿Acceso ATC primaria\\n< 120 min posible?}
    H -->|Sí| I[Derivación URGENTE\\na HHM para ATC primaria]
    H -->|No — HCSFB distante| J[EVALUAR TROMBOLISIS]
    J --> K{¿Contraindicaciones?}
    K -->|Sí| I
    K -->|No| L[Consentimiento informado\\nAspirinas 300 mg + Clopidogrel 300 mg]
    L --> M[TENECTEPLASE IV bolo único\\nTNK por peso: < 60kg=30mg\\n60-69kg=35mg · 70-79kg=40mg\\n80-89kg=45mg · ≥90kg=50mg]
    M --> N[Heparina no fraccionada\\n60 UI/kg IV bolo + infusión]
    N --> O[TIEMPO PUERTA-AGUJA\\nOBJETIVO: ≤ 30 min]
    O --> P[Monitoreo post-trombolisis:\\nECG 30 min · PA c/15 min · FC continua]
    P --> Q{¿Reperfusión exitosa\\na 60–90 min?}
    Q -->|Sí — baja ST 50%, aliv dolor| R[Derivación diferida HHM\\nen < 24h para coronariografía]
    Q -->|No — sin signos reperfusión| S[Derivación URGENTE HHM\\npara ATC rescate]`,
      layout_position: 'main',
    },
    {
      id: 'trombo-postlisis',
      type: 'flowchart',
      color: 'amber',
      order: 3,
      title: 'Monitoreo Post-Trombolisis — HCSFB',
      content: 'Seguimiento y criterios de traslado tras trombolisis exitosa',
      details: [
        'ECG seriado: 30, 60 y 90 min post-infusión; comparar con ECG basal',
        'Signos de reperfusión exitosa: reducción ST ≥ 50%, alivio dolor, ARRITMIA de reperfusión (RIVA)',
        'Monitoreo de PA cada 15 min la primera hora; objetivo PAS 90–140 mmHg',
        'Buscar sangrado: estado neurológico c/30 min (cefalea, déficit neurológico → TAC urgente)',
        'Si hemorragia intracraneal sospechada: SUSPENDER heparina, avisar Dr. de turno, TAC urgencia',
        'Traslado a HHM: ambulancia con monitor en todos los casos (éxito o fracaso) en < 3h',
        'Documentar en SOME: hora ECG, hora trombolisis, fármaco, dosis, signos de reperfusión',
      ],
      layout_position: 'main',
    },
  ],
};

// ─────────────────────────────────────────────────────────────
// 5. HCSFB 130 — Manejo TEC Adulto en Urgencias
// ─────────────────────────────────────────────────────────────
const TEC = {
  nameFragment: 'Traumatismo Craneoencefálico',
  meta: {
    protocol_code:      'HCSFB 130',
    protocol_edition:   'Primera',
    protocol_date:      'Abril 2025',
    protocol_validity:  'Abril 2030',
    protocol_objective: 'Estandarizar el manejo del traumatismo encefalocraneano en adultos en el Servicio de Urgencias del HCSFB, con evaluación GCS, criterios de TAC (Canadian CT Head Rule) y criterios de derivación a HHM.',
    protocol_authors: [
      { name: 'Dr. Sebastián Bustos Sepúlveda', role: 'Elaborador — Jefe Servicio Urgencias HCSFB' },
      { name: 'Dr. Felipe Sancho Tapia',          role: 'Revisor — Subdirector Médico HCSFB' },
      { name: 'Dr. Álvaro Lagos Llanos',           role: 'Aprobador — Director HCSFB' },
    ],
  },
  blocks: [
    {
      id: 'tec-clasificacion',
      type: 'text',
      color: 'blue',
      order: 1,
      title: 'Clasificación por GCS — Urgencias HCSFB',
      content: 'Clasificación del TEC por escala de Glasgow al ingreso',
      details: [
        'TEC Leve: GCS 14–15 · Orientado o con amnesia leve · Sin focalidad',
        'TEC Moderado: GCS 9–13 · Confusión, agitación o focalidad · Amnesia prolongada',
        'TEC Severo: GCS ≤ 8 · Coma · Riesgo vital inmediato · Activar código trauma',
        'Evaluar GCS al ingreso, a los 15 min y tras 1h de observación',
        'Documentar mejor respuesta ocular + verbal + motora (no solo total)',
        'Factores confundentes: alcohol, sedación, hipoglicemia, hipoxia → tratar primero',
      ],
      layout_position: 'main',
    },
    {
      id: 'tec-mermaid',
      type: 'mermaid',
      order: 2,
      title: 'Algoritmo TEC Adulto — HCSFB',
      content: `flowchart TD
    A([TEC adulto en urgencias HCSFB]) --> B[Evaluación primaria ABCDE\\nGCS + pupilas + PA + SpO2]
    B --> C{GCS}
    C -->|GCS ≤ 8\\nSevero| D[Intubación inmediata\\nActivar traslado HHM\\ncomo urgencia vital]
    C -->|GCS 9–13\\nModerado| E[TAC cráneo urgente\\n< 30 min]
    C -->|GCS 14–15\\nLeve| F{Canadian CT Head Rule\\n¿Algún criterio?}
    F -->|SÍ — solicitar TAC| E
    F -->|NO — bajo riesgo| G[Observación 4–6h\\nEvaluar GCS c/1h]
    E --> H{¿Lesión en TAC?}
    H -->|No| I{¿GCS estable?}
    H -->|Sí — hemorragia\\no edema| J[DERIVACIÓN URGENTE HHM\\ncirugía o neurocirugía]
    I -->|GCS estable y orientado| K[Alta con instrucciones\\ny hoja de alarma]
    I -->|GCS cae o síntomas| J
    G --> L{¿Deterioro en\\nobservación?}
    L -->|GCS cae ≥ 2 pts| J
    L -->|Sin deterioro| M[¿Asintomático y\\norientado al alta?]
    M -->|Sí| K
    M -->|No| N[Hospitalizar HCSFB\\npara observación 24h]`,
      layout_position: 'main',
    },
    {
      id: 'tec-canadian',
      type: 'criteria',
      color: 'amber',
      order: 3,
      title: 'Canadian CT Head Rule — Criterios para TAC',
      content: 'Criterios validados para solicitar TAC en TEC leve (GCS 14–15)',
      items: [
        'Alto riesgo (derivación quirúrgica si + en TAC): GCS < 15 a las 2h · Sospecha fractura abierta o deprimida · Cualquier signo de fractura de base de cráneo · Vómitos ≥ 2 episodios · Edad ≥ 65 años',
        'Riesgo moderado (lesión cerebral en TAC): Amnesia anterógrada ≥ 30 min antes del impacto · Mecanismo peligroso (atropello, caída > 1 metro, eyección vehículo)',
        'No aplicar si: GCS < 13, menores de 16 años, anticoagulados, convulsión post-TEC (solicitar TAC directamente)',
      ],
      layout_position: 'main',
    },
    {
      id: 'tec-alarmas',
      type: 'criteria',
      color: 'red',
      order: 4,
      title: 'Criterios de Derivación Urgente a HHM',
      content: 'Indicaciones de traslado desde urgencias HCSFB a Hospital Herminda Martín',
      items: [
        'TEC severo (GCS ≤ 8) con cualquier mecanismo',
        'TEC moderado o leve con lesión en TAC (hematoma, contusión, edema, hemorragia subaracnoidea)',
        'Deterioro neurológico en observación (caída GCS ≥ 2 puntos)',
        'Asimetría pupilar o signos de herniación (posturas anómalas, bradicardia + HTA)',
        'Convulsiones post-TEC',
        'Fractura deprimida o abierta',
        'Paciente anticoagulado con TEC moderado-severo',
        'Llamar a neurocirugía HHM antes de enviar para coordinar recepción',
      ],
      layout_position: 'main',
    },
  ],
};

// ─────────────────────────────────────────────────────────────
// 6. HCSFB 128 — Disyunción Acromioclavicular
// ─────────────────────────────────────────────────────────────
const DISYUNCION = {
  nameFragment: 'Disyunción Acromioclavicular',
  meta: {
    protocol_code:      'HCSFB 128',
    protocol_edition:   'Primera',
    protocol_date:      'Abril 2025',
    protocol_validity:  'Abril 2030',
    protocol_objective: 'Estandarizar el diagnóstico y manejo de la disyunción acromioclavicular en el HCSFB, con clasificación de Rockwood, criterios de manejo conservador vs quirúrgico y seguimiento local.',
    protocol_authors: [
      { name: 'Dr. Sebastián Bustos Sepúlveda', role: 'Elaborador — Jefe Servicio Urgencias HCSFB' },
      { name: 'Dr. Felipe Sancho Tapia',          role: 'Revisor — Subdirector Médico HCSFB' },
      { name: 'Dr. Álvaro Lagos Llanos',           role: 'Aprobador — Director HCSFB' },
    ],
  },
  blocks: [
    {
      id: 'dis-rockwood',
      type: 'text',
      color: 'blue',
      order: 1,
      title: 'Clasificación de Rockwood — Disyunción AC',
      content: 'Grados de lesión acromioclavicular y hallazgos radiológicos',
      details: [
        'Tipo I: Esguince ligamento AC · Sin desplazamiento en Rx · Articulación AC sin ensanchamiento',
        'Tipo II: Ruptura ligamento AC + esguince coracoclavicular · Ensanchamiento leve AC en Rx',
        'Tipo III: Ruptura AC + coracoclavicular · Desplazamiento clavícula > 25% del diámetro humeral',
        'Tipo IV: Clavícula desplazada posteriormente hacia trapecio',
        'Tipo V: Desplazamiento clavícula > 100% (3–5 veces el diámetro); deformidad evidente',
        'Tipo VI: Clavícula desplazada inferior a la coracoides (muy raro)',
      ],
      layout_position: 'main',
    },
    {
      id: 'dis-mermaid',
      type: 'mermaid',
      order: 2,
      title: 'Algoritmo de Manejo — Disyunción Acromioclavicular',
      content: `flowchart TD
    A([Trauma hombro urgencias HCSFB\\nsospecha disyunción AC]) --> B[Rx hombro AP + axial\\n+ Rx AC comparativa bilateral\\ncon y sin pesas 4 kg]
    B --> C{Clasificación\\nRockwood}
    C -->|Tipo I–II| D[CONSERVADOR\\nCabestrillo 2–3 semanas\\nAINES + hielo · No cirugía]
    C -->|Tipo III| E{¿Paciente activo\\nfísicamente o trabajador\\nmanual?}
    E -->|No — sedentario > 50 años| F[CONSERVADOR\\nCabestrillo 4–6 semanas\\nKinesiterapia a las 3 semanas]
    E -->|Sí — activo o laboral| G[DERIVACIÓN TRAUMATOLOGÍA\\nHHM para evaluación quirúrgica]
    C -->|Tipo IV–VI| H[DERIVACIÓN URGENTE\\nTraumatología HHM\\npara cirugía]
    D --> I[Control HCSFB a las 3 semanas\\nKinesiterapia si persiste dolor]
    F --> I
    I --> J{¿Evolución favorable?}
    J -->|Sí| K([Alta + kinesiterapia\\nhasta recuperación funcional])
    J -->|No — dolor > 6 sem o\\ndéficit funcional| G`,
      layout_position: 'main',
    },
    {
      id: 'dis-seguimiento',
      type: 'flowchart',
      color: 'green',
      order: 3,
      title: 'Seguimiento Ambulatorio — HCSFB',
      content: 'Plan de control y kinesiterapia para Rockwood I-II-III conservador',
      details: [
        'Cabestrillo: Tipo I → 2 semanas; Tipo II → 3 semanas; Tipo III conservador → 4–6 semanas',
        'Kinesiterapia: iniciar movilidad pasiva a las 3 semanas (Tipo I-II) o 6 semanas (Tipo III)',
        'Ejercicios activos: desde la semana 6–8 según tolerancia y tipo de lesión',
        'Control Rx a las 6 semanas para verificar posición y consolidación',
        'Retorno al deporte o trabajo manual: mínimo 3 meses post-lesión, con evaluación funcional',
        'Derivar si: dolor persistente, inestabilidad, artrosis AC secundaria o Tipo III sin mejoría',
      ],
      layout_position: 'main',
    },
  ],
};

// ─────────────────────────────────────────────────────────────
// 7. GCL 1.10 — Manejo Paciente con Intento Suicida
// ─────────────────────────────────────────────────────────────
const INTENTO_SUICIDA = {
  nameFragment: 'Intento Suicida',
  meta: {
    protocol_code:      'GCL 1.10',
    protocol_edition:   'Tercera',
    protocol_date:      'Noviembre 2022',
    protocol_validity:  'Noviembre 2027',
    protocol_objective: 'Estandarizar el manejo del paciente con intento suicida en el HCSFB, desde la atención médica inicial, la evaluación del riesgo residual, la hospitalización si corresponde y la coordinación con salud mental.',
    protocol_authors: [
      { name: 'Comité de Calidad y Seguridad del Paciente HCSFB', role: 'Elaborador' },
      { name: 'Dr. Rodrigo Enríquez Heredia',                       role: 'Revisor — Jefe PROSAM/SM HCSFB' },
      { name: 'EU María Teresa Medina Bravo',                       role: 'Revisora — OFICYSP' },
      { name: 'Dr. Álvaro Lagos Llanos',                             role: 'Aprobador — Director HCSFB' },
    ],
  },
  blocks: [
    {
      id: 'is-inicial',
      type: 'flowchart',
      color: 'red',
      order: 1,
      title: 'Atención Médica Inicial — Urgencias HCSFB',
      content: 'Primeros pasos ante paciente con intento suicida que llega a urgencias HCSFB',
      details: [
        '1. Estabilización médica primero: vía aérea, PA, Glasgow, tratar complicación físicas',
        '2. Intoxicación medicamentosa: lavado gástrico si < 1h, carbón activado, antídotos si indicado',
        '3. Heridas auto-infligidas: sutura, control hemostasia, radiología si trauma',
        '4. Observación médica mínima 4h antes de evaluación psiquiátrica (TODOS los casos)',
        '5. Retirar elementos de riesgo del box (medicamentos, instrumentos cortopunzantes)',
        '6. Acompañamiento continuo: técnico o familiar en box (NO dejar solo)',
        '7. Avisar a Dr. Rodrigo Enríquez (PROSAM) o psiquiatra de turno HHM',
      ],
      layout_position: 'main',
    },
    {
      id: 'is-sad',
      type: 'text',
      color: 'amber',
      order: 2,
      title: 'Escala SAD PERSONS — Evaluación de Riesgo Residual',
      content: 'Instrumento de evaluación de riesgo de nuevo intento suicida (puntaje 0–10)',
      details: [
        'S – Sex (hombre = 1)',
        'A – Age (< 19 o > 45 años = 1)',
        'D – Depression or hopelessness (= 1)',
        'P – Previous attempts (= 1)',
        'E – Ethanol abuse (= 1)',
        'R – Rational thinking loss (= 1)',
        'S – Social support lacking (= 1)',
        'O – Organized plan (= 1)',
        'N – No spouse (= 1)',
        'S – Sickness (enfermedad crónica grave = 1)',
        'Puntaje 0–5: riesgo bajo → manejo ambulatorio + psicología; 6–8: riesgo moderado → hospitalizar; 9–10: riesgo alto → hospitalización + interconsulta psiquiátrica urgente',
      ],
      layout_position: 'main',
    },
    {
      id: 'is-criterios',
      type: 'criteria',
      color: 'red',
      order: 3,
      title: 'Criterios de Hospitalización y Derivación',
      content: 'Indicaciones de internación y/o derivación tras intento suicida en HCSFB',
      items: [
        '✅ Hospitalizar en HCSFB: SAD PERSONS ≥ 6 o daño físico que requiere hospitalización',
        '✅ Derivar a psiquiatría HHM: diagnóstico psiquiátrico severo + necesidad de ajuste de fármaco especializado',
        '✅ Derivar urgente HHM: riesgo alto con ideación activa persistente o plan elaborado',
        '✅ Alta ambulatoria SOLO si: SAD PERSONS ≤ 5 + red de apoyo confirmada + cita PROSAM en 48–72h',
        '❌ NUNCA dar alta sola sin familiar o acompañante confirmado',
        '❌ NUNCA dar alta sin plan de egreso documentado (contacto crisis, cita SM, restricción de medios)',
      ],
      layout_position: 'main',
    },
  ],
};

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────
const UPDATES = [
  RCP_ADULTOS, RCP_PEDIATRICO, CODIGO_AZUL,
  TROMBOLISIS, TEC, DISYUNCION, INTENTO_SUICIDA,
];

for (const { nameFragment, meta, blocks } of UPDATES) {
  console.log(`\n📋 ${meta.protocol_code} — buscando por "%${nameFragment}%"`);
  const id = await resolveId(nameFragment);
  if (!id) continue;

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
