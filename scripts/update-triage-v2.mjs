// Actualiza el protocolo AOC 1.2 "Categorización de la Atención en el
// Servicio de Urgencias" (id 2dc4e979...) expandiendo el sistema de
// categorización: pestaña Equipo separada, flujo paso-a-paso con responsable
// explícito, algoritmo ESI con criterios objetivos por pregunta, regla de
// reclasificación, signos vitales adulto, registro obligatorio y casos
// especiales con referencias a HCSFB 159, GCL 1.10 y Cuidados Paliativos.
//
// Uso:
//   node scripts/update-triage-v2.mjs           # dry-run, imprime distribución
//   node scripts/update-triage-v2.mjs --apply   # aplica a Supabase
//
// Sigue el patrón canónico GES: DELETE_IDS (bloques a borrar, incl. UUIDs
// residuales del seed) + TAB_ASSIGNMENTS para los bloques que sobreviven +
// nuevos bloques con tab explícito. Renderer en modo tabs explícitos.

import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');
const TOPIC_ID = '2dc4e979-9547-4b81-9471-145e4ed3f55d';

const REF = {
  agitacion:   '13e6128f-882a-4a19-8e18-47cbf13203eb', // HCSFB 159
  suicida:     '64dfc162-38ac-40c9-8cff-2e898bd40988', // GCL 1.10
  paliativos:  '6346cd35-61c7-45e6-807b-daeaa2461b7e', // Urgencias en Cuidados Paliativos
  rrapida:     '099cba54-aec4-4d2b-9760-64b5302fe77e', // HCSFB 165
};

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

// IDs de la versión anterior (v1) — los reemplazamos íntegros con la nueva versión.
// Cualquier UUID residual del seed que no tenga `tab` también se borra
// para no contaminar pestañas explícitas.
const DELETE_IDS = new Set([
  'triage-protocolo',
  'triage-decision',
  'triage-categorias',
  'triage-recursos',
  'triage-casos',
  'triage-vitales-pedi',
  'triage-mermaid',
]);

// ════════════════════════════════════════════════════════════════════════════
// PESTAÑA 1 — triage_protocolo
// ════════════════════════════════════════════════════════════════════════════

const BLOCK_PROTOCOLO = {
  id: 'triage-protocolo',
  tab: 'triage_protocolo',
  type: 'flowchart',
  color: 'blue',
  order: 1,
  title: 'Flujo de categorización — Quién hace qué y cuándo',
  content: 'Desde el ingreso administrativo hasta la asignación de nivel ESI. Cada paso indica el responsable.',
  details: [
    '━━━ INGRESO ADMINISTRATIVO (Admisor 24/7) ━━━',
    'ADMISOR: recepciona al paciente y verifica datos de identidad',
    'ADMISOR: inscribe en SIDRA y genera RAU/DAU con motivo de consulta',
    'ADMISOR: si detecta riesgo vital aparente (inconciencia, sangrado activo, dolor torácico, dificultad respiratoria, embarazada con sangrado) avisa inmediatamente a categorización SIN esperar al llamado regular',
    'ADMISOR: indica al paciente que será llamado por categorización en breve',
    '━━━ LLAMADO A CATEGORIZACIÓN (Enfermera/o categorizador/a) ━━━',
    'ENFERMERA: llama al paciente dentro de los primeros 10 minutos del ingreso administrativo',
    'ENFERMERA: si no se presenta al tercer llamado consecutivo (intervalos de 3 minutos): cerrar atención en SIDRA, dejar registro de no presentación y reabrir solo si el paciente regresa',
    '━━━ EVALUACIÓN EN BOX EXCLUSIVO (Enfermera/o + TENS) ━━━',
    'ENFERMERA: apreciación visual de 30 segundos — conciencia, dificultad respiratoria, hipoperfusión, palidez, sudoración, dolor (EVA mayor a 3)',
    'ENFERMERA: pesquisa signos potenciales de gravedad — taquicardia mayor 120, bradicardia menor 50, arritmia, hipotensión, taquipnea mayor 24, SatO2 menor 92 por ciento',
    'TENS: instala oxímetro y registra signos vitales (PA, FC, FR, SatO2, T°)',
    'ENFERMERA: hemoglucotest a embarazadas, diabéticos, pacientes con mareos, vértigo o sospecha de descompensación glicémica',
    'ENFERMERA: ECG de 12 derivaciones si dolor precordial, epigastralgia con sudoración, dolor en extremidad superior izquierda o crisis hipertensiva',
    'ENFERMERA: entrevista breve dirigida (síntoma principal, tiempo de evolución, antecedentes mórbidos, alergias, fármacos crónicos, embarazo)',
    '━━━ DECISIÓN Y COMUNICACIÓN (Enfermera/o) ━━━',
    'ENFERMERA: aplica algoritmo ESI de 4 preguntas (ver bloque siguiente)',
    'ENFERMERA: registra categoría ESI, signos vitales, alergias, antecedentes y motivo en ficha electrónica (SIDRA)',
    'ENFERMERA: comunica verbalmente al paciente y al acompañante la categoría asignada y el tiempo máximo de espera correspondiente',
    'ENFERMERA: deriva físicamente al paciente al sector que corresponde (sala de espera, box clínico, reanimación)',
    '━━━ ENTREGA AL MÉDICO (Enfermera/o → Médico/a) ━━━',
    'ENFERMERA: entrega ficha electrónica al médico de urgencias con categoría y hallazgos relevantes',
    'MÉDICO: recibe paciente respetando orden ESI; si hay duda clínica, puede reclasificar y debe dejarlo registrado',
  ],
  layout_position: 'main',
};

const BLOCK_DECISION = {
  id: 'triage-decision',
  tab: 'triage_protocolo',
  type: 'criteria',
  color: 'amber',
  order: 2,
  title: 'Algoritmo ESI — 4 preguntas con criterios objetivos',
  content: 'Se aplican en orden estricto; al primer "Sí" se asigna el nivel correspondiente. Si llega a la pregunta C, se cuentan recursos previstos para resolver la consulta.',
  items: [
    '━━━ A. ¿Necesita REANIMACIÓN INMEDIATA? ━━━',
    'Apnea o vía aérea comprometida',
    'Hipoxemia severa (SatO2 menor 90 por ciento con oxígeno suplementario o cianosis central)',
    'Shock (PAS menor 90 con hipoperfusión periférica, o llene capilar mayor a 3 segundos)',
    'Paro cardiorrespiratorio o ritmo de paro',
    'Compromiso de conciencia profundo (Glasgow menor o igual 8)',
    'Convulsión activa',
    'Hemorragia masiva no controlable',
    'Sí a CUALQUIERA: ESI 1 — atención inmediata',
    '━━━ B. ¿NO DEBE ESPERAR? (alto riesgo o deterioro inminente) ━━━',
    'Dolor torácico con sospecha de SCA (irradiado, sudoración, vómitos, antecedentes)',
    'Disnea moderada a severa (uso de musculatura accesoria, habla entrecortada)',
    'Compromiso de conciencia parcial (Glasgow 9 a 13) o foco neurológico nuevo',
    'Dolor severo no controlable (EVA mayor o igual 7) sin causa banal evidente',
    'Sangrado digestivo, vaginal o por herida con compromiso hemodinámico',
    'Crisis hipertensiva con daño de órgano (cefalea intensa, visión borrosa, dolor torácico)',
    'Sospecha de sepsis (fiebre + taquicardia + hipotensión o alteración mental)',
    'Embarazada con sangrado activo, dolor abdominal severo o disminución de movimientos fetales',
    'Paciente psiquiátrico con riesgo suicida activo o agitación psicomotora severa',
    'Quemado mayor (más del 10 por ciento SCQ o quemadura de vía aérea)',
    'Sí a CUALQUIERA: ESI 2 — atención antes de 30 minutos',
    '━━━ C. ¿Cuántos RECURSOS necesitará para resolver? ━━━',
    '0 recursos esperados: ESI 5 (hasta 300 minutos)',
    '1 recurso esperado: ESI 4 (hasta 180 minutos)',
    '2 o más recursos esperados: ESI 3 (hasta 90 minutos)',
    'Ver bloque "¿Qué cuenta como recurso?" para la lista operativa',
    '━━━ D. Si quedó en ESI 3: ¿signos vitales fuera de rango de alto riesgo? ━━━',
    'Adulto: FC mayor 120 o menor 50, FR mayor 24 o menor 10, PAS menor 90, SatO2 menor 92 por ciento, T° mayor 40 o menor 35',
    'Pediátrico: usar rangos por edad del bloque "Signos vitales pediátricos"',
    'Sí: reclasificar a ESI 2 y dejar registro de la razón',
    'No: confirmar ESI 3',
  ],
  layout_position: 'main',
};

const BLOCK_RECLASIF = {
  id: 'triage-reclasif',
  tab: 'triage_protocolo',
  type: 'criteria',
  color: 'red',
  order: 3,
  title: 'Reclasificación durante la espera — Cuándo y quién',
  content: 'La categoría ESI no es estática: si el paciente se deteriora antes de la atención médica, se reclasifica al nivel correspondiente.',
  items: [
    '━━━ QUIÉN PUEDE RECLASIFICAR ━━━',
    'Enfermera/o categorizador/a: en cualquier momento mientras el paciente espera',
    'Enfermera/o de sala de espera o médico/a evaluador: si detecta cambio clínico',
    'Médico/a tratante: al recibir al paciente, si la evaluación inicial difiere',
    '━━━ CUÁNDO RECLASIFICAR HACIA UN NIVEL MÁS URGENTE ━━━',
    'Aparición de signos vitales fuera de rango (ver bloque adulto / pediátrico)',
    'Aumento de EVA mayor o igual 2 puntos',
    'Compromiso de conciencia nuevo o progresivo',
    'Sangrado activo nuevo o aumentado',
    'Síncope o presíncope durante la espera',
    'Familiar o acompañante reporta empeoramiento clínico — siempre re-evaluar',
    '━━━ REGISTRO OBLIGATORIO ━━━',
    'Hora exacta de la reclasificación',
    'Categoría previa y nueva (ej: ESI 3 → ESI 2)',
    'Razón objetiva (signos vitales, hallazgo, síntoma nuevo)',
    'Identificación del profesional que reclasifica',
    '━━━ NO SE RECLASIFICA HACIA UN NIVEL MENOS URGENTE ━━━',
    'Una vez asignada una categoría más alta no se reduce, salvo error administrativo evidente y con visto bueno del médico de turno',
  ],
  layout_position: 'main',
};

const BLOCK_REGISTRO = {
  id: 'triage-registro',
  tab: 'triage_protocolo',
  type: 'criteria',
  color: 'green',
  order: 4,
  title: 'Registro obligatorio — Qué se documenta y dónde',
  content: 'Trazabilidad completa de la categorización para auditoría de tiempos y cumplimiento ESI.',
  items: [
    '━━━ EN SIDRA / FICHA ELECTRÓNICA ━━━',
    'Hora de ingreso administrativo (RAU/DAU)',
    'Hora de llamado a categorización',
    'Hora de inicio de evaluación en box',
    'Hora de asignación de categoría ESI',
    'Categoría ESI asignada (1 a 5)',
    'Signos vitales completos (PA, FC, FR, SatO2, T°, glicemia si aplica)',
    'EVA inicial',
    'Motivo de consulta textual',
    'Antecedentes mórbidos relevantes y alergias',
    'Fármacos crónicos',
    'Profesional responsable (nombre y rol)',
    '━━━ EN PIZARRA / VISTA DE SALA ━━━',
    'Categoría visible (color ESI) para enfermería y médicos',
    'Tiempo máximo de espera restante',
    '━━━ EVENTOS ESPECIALES ━━━',
    'Si reclasificación: hora, motivo, categorías previa y nueva, profesional',
    'Si no presentación al tercer llamado: hora del último llamado, observación administrativa',
    'Si abandono voluntario antes de atención: hora, motivo verbal del paciente, firma si es posible',
  ],
  layout_position: 'main',
};

// ════════════════════════════════════════════════════════════════════════════
// PESTAÑA 2 — triage_equipo
// ════════════════════════════════════════════════════════════════════════════

const BLOCK_ROLES = {
  id: 'triage-roles',
  tab: 'triage_equipo',
  type: 'criteria',
  color: 'blue',
  order: 1,
  title: 'Roles y responsabilidades en el proceso de categorización',
  content: 'Cada profesional tiene tareas exclusivas; la categorización funciona solo si la cadena se cumple en orden.',
  items: [
    '━━━ ADMISOR/A (24/7) ━━━',
    'Recepción del paciente y verificación de identidad',
    'Inscripción en SIDRA y generación de RAU/DAU',
    'Comunicación inmediata a categorización si detecta riesgo vital aparente',
    'No realiza juicio clínico — solo administrativo',
    '━━━ ENFERMERA/O CATEGORIZADOR/A ━━━',
    'Llama al paciente dentro de los primeros 10 minutos',
    'Realiza evaluación en box exclusivo (apreciación visual, signos vitales, anamnesis breve)',
    'Aplica algoritmo ESI y asigna categoría',
    'Registra en ficha electrónica',
    'Reevalúa pacientes en sala de espera cada 30 a 60 minutos según categoría',
    'Reclasifica si hay deterioro',
    '━━━ TENS DE URGENCIA ━━━',
    'Apoya a la enfermera categorizadora en toma de signos vitales',
    'Traslada al paciente al sector asignado',
    'Vigila sala de espera y avisa a enfermera ante cambios visibles (palidez, agitación, deterioro)',
    'Repone insumos y mantiene operativo el box de categorización',
    '━━━ MÉDICO/A DE URGENCIA ━━━',
    'Recibe paciente respetando orden ESI',
    'Puede reclasificar si difiere de la categoría asignada — debe registrar el cambio',
    'Indica derivación, hospitalización o alta',
    '━━━ AUXILIAR DE SERVICIO ━━━',
    'Aseo del box de categorización entre pacientes',
    'Reposición de insumos básicos',
    '━━━ ENFERMERA/O JEFE DE URGENCIA ━━━',
    'Supervisión del cumplimiento de tiempos ESI por turno',
    'Resolución de conflictos en clasificación dudosa',
    'Auditoría diaria de RAU con tiempo de categorización mayor a 10 minutos',
    'Reporte mensual de indicadores de cumplimiento',
  ],
  layout_position: 'main',
};

const BLOCK_MATERIALES = {
  id: 'triage-materiales',
  tab: 'triage_equipo',
  type: 'criteria',
  color: 'green',
  order: 2,
  title: 'Box de categorización — Materiales mínimos requeridos',
  content: 'Stock permanente verificado al inicio de cada turno por la enfermera categorizadora.',
  items: [
    '━━━ EQUIPAMIENTO BÁSICO ━━━',
    'Camilla con barandas y altura regulable',
    'Esfigmomanómetro manual + automático calibrado',
    'Oxímetro de pulso adulto y pediátrico',
    'Termómetro digital infrarrojo o axilar',
    'Electrocardiógrafo de 12 derivaciones operativo y con papel',
    'Hemoglucómetro con tiras vigentes',
    'Linterna de evaluación pupilar',
    'Báscula para peso adulto y pediátrica',
    '━━━ INSUMOS DESECHABLES ━━━',
    'Mascarillas quirúrgicas y N95',
    'Guantes de procedimiento (S, M, L)',
    'Alcohol gel y solución desinfectante',
    'Apósitos, gasas, vendas elásticas (para inmovilización transitoria)',
    'Bolsas de basura y contenedor de cortopunzantes',
    '━━━ APOYO PARA REGISTRO ━━━',
    'Computador con SIDRA operativo',
    'Impresora de etiquetas con código de paciente',
    'Pizarra o pantalla de visualización de categoría ESI',
    '━━━ DOCUMENTACIÓN AL ALCANCE ━━━',
    'Cartilla impresa con criterios ESI 4 preguntas',
    'Tabla de signos vitales pediátricos por edad',
    'Listado de teléfonos internos HCSFB (jefatura, SAR, ginecología, salud mental)',
  ],
  layout_position: 'main',
};

const BLOCK_EQUIPO_MERMAID = {
  id: 'triage-equipo-mermaid',
  tab: 'triage_equipo',
  type: 'mermaid',
  order: 3,
  title: 'Cadena de comunicación durante la categorización',
  content: 'flowchart LR\n    P(["Paciente<br/>llega"]) --> ADM["ADMISOR<br/>RAU/DAU"]\n    ADM -->|"Riesgo vital aparente"| ENF["ENFERMERA<br/>categorizadora"]\n    ADM -->|"Llamado regular"| ENF\n    ENF --> TENS["TENS<br/>signos vitales"]\n    TENS --> ENF\n    ENF -->|"ESI 1-2"| MED["MÉDICO<br/>urgencia"]\n    ENF -->|"ESI 3-4-5"| ESPERA["Sala de espera<br/>vigilada"]\n    ESPERA -->|"Deterioro"| ENF\n    ESPERA -->|"Tiempo cumplido"| MED\n    MED --> SAL(["Manejo,<br/>derivación o alta"])\n    JEF["JEFE URGENCIAS<br/>supervisión"] -.->|"Audita tiempos"| ENF\n    JEF -.->|"Resuelve conflictos"| MED',
  layout_position: 'main',
};

// ════════════════════════════════════════════════════════════════════════════
// PESTAÑA 3 — triage_categorias
// ════════════════════════════════════════════════════════════════════════════

const BLOCK_CATEGORIAS = {
  id: 'triage-categorias',
  tab: 'triage_categorias',
  type: 'flowchart',
  color: 'red',
  order: 1,
  title: 'Niveles ESI y tiempos máximos de espera',
  content: 'Tiempo de respuesta entre categorización y atención médica.',
  details: [
    '━━━ ESI 1 — RIESGO VITAL ━━━',
    'Atención inmediata, sin tiempo de espera',
    'Intervenciones esperadas: vía aérea, ventilación, RCP, desfibrilación, fluidos masivos, hemoderivados',
    'Fármacos típicos: adenosina, atropina, dextrosa, dopamina, epinefrina, naloxona',
    'Sector: box de reanimación',
    '━━━ ESI 2 — ALTO RIESGO ━━━',
    'Atención antes de 30 minutos',
    'Riesgo de inestabilidad o deterioro, estado mental alterado, dolor severo, signos vitales de alto riesgo',
    'Sector: box clínico con monitorización continua',
    '━━━ ESI 3 — EVALUACIÓN MEDIATA ━━━',
    'Atención antes de 90 minutos',
    'Asistencialmente compleja, requiere 2 o más recursos',
    'Sector: box clínico o sala de espera con reevaluación cada 30 a 45 minutos',
    '━━━ ESI 4 — MENOR COMPLEJIDAD ━━━',
    'Atención antes de 180 minutos',
    'Bajo riesgo, hemodinámicamente estable, requiere hasta 1 procedimiento',
    'Sector: sala de espera con reevaluación cada 60 minutos',
    '━━━ ESI 5 — BAJA COMPLEJIDAD ━━━',
    'Atención hasta 300 minutos',
    'Estable, sin riesgo, resolución ambulatoria sin estudios',
    'Sector: sala de espera; considerar derivación a SAR si corresponde',
  ],
  layout_position: 'main',
};

const BLOCK_RECURSOS = {
  id: 'triage-recursos',
  tab: 'triage_categorias',
  type: 'criteria',
  color: 'blue',
  order: 2,
  title: '¿Qué cuenta como recurso? (criterio ESI)',
  content: 'Definición operativa para clasificar entre ESI 3, 4 y 5.',
  items: [
    '━━━ SÍ ES RECURSO ━━━',
    'Examen de laboratorio',
    'Electrocardiograma',
    'Imágenes (radiografía, TAC, ecografía)',
    'Medicamento EV, IM o nebulización',
    'Interconsulta o derivación a especialista',
    'Procedimiento simple (instalación SF, SNG, sondaje vesical)',
    'Procedimiento complejo (sedación, sutura, curaciones avanzadas, reducción)',
    '━━━ NO ES RECURSO ━━━',
    'Point of care (test rápido en box)',
    'Administración de vacuna',
    'Inmovilización con cabestrillo o férula',
    'Llenado de receta',
    'Entrega de certificado',
    'Tratamiento oral',
    'Anamnesis y examen físico',
  ],
  layout_position: 'main',
};

const BLOCK_VITALES_ADULTO = {
  id: 'triage-vitales-adulto',
  tab: 'triage_categorias',
  type: 'criteria',
  color: 'amber',
  order: 3,
  title: 'Signos vitales fuera de rango — Adulto (mayores 8 años)',
  content: 'Cualquier valor fuera de estos rangos durante la categorización obliga a considerar ESI 2 o superior.',
  items: [
    '━━━ FRECUENCIA CARDIACA ━━━',
    'Taquicardia: mayor 120 latidos por minuto',
    'Bradicardia: menor 50 latidos por minuto',
    'Arritmia detectable al pulso o ECG',
    '━━━ FRECUENCIA RESPIRATORIA ━━━',
    'Taquipnea: mayor 24 respiraciones por minuto',
    'Bradipnea: menor 10 respiraciones por minuto',
    'Uso de musculatura accesoria o respiración paradojal',
    '━━━ PRESIÓN ARTERIAL ━━━',
    'PAS menor 90 mmHg (hipotensión)',
    'PAS mayor 220 o PAD mayor 120 (crisis hipertensiva)',
    'PAM menor 65 mmHg',
    '━━━ SATURACIÓN ━━━',
    'SatO2 menor 92 por ciento al ambiente',
    'SatO2 menor 90 por ciento con oxígeno suplementario: ESI 1',
    '━━━ TEMPERATURA ━━━',
    'Hipertermia mayor 40°C',
    'Hipotermia menor 35°C',
    '━━━ GLICEMIA (si aplica) ━━━',
    'Menor 60 mg/dL: hipoglicemia sintomática',
    'Mayor 400 mg/dL: descompensación severa',
    '━━━ ESCALAS ━━━',
    'Glasgow menor o igual 13: alteración de conciencia',
    'EVA mayor o igual 7 sin causa banal',
  ],
  layout_position: 'main',
};

// ════════════════════════════════════════════════════════════════════════════
// PESTAÑA 4 — triage_casos
// ════════════════════════════════════════════════════════════════════════════

const BLOCK_CASOS = {
  id: 'triage-casos',
  tab: 'triage_casos',
  type: 'criteria',
  color: 'amber',
  order: 1,
  title: 'Casos especiales — Categorización con criterio fijo o ajustado',
  content: 'Situaciones administrativas, demográficas o clínicas donde se aplica una regla distinta al algoritmo ESI estándar.',
  items: [
    '━━━ ADMINISTRATIVOS Y FORENSES ━━━',
    'Alcoholemia con Carabineros: ESI 3, espera en sala',
    'Constatación de lesiones con Carabineros o Gendarmería: ESI 3',
    'Detenido custodiado (Carabineros, Gendarmería, PDI): ESI según motivo clínico, con custodia presente',
    '━━━ CLÍNICOS CON CATEGORÍA MÍNIMA FIJA ━━━',
    'Tratamiento antibiótico endovenoso programado: ESI 3',
    'Paciente inmunosuprimido, oncológico en quimio o trasplantado activo: ESI 3 mínimo aunque parezca estable',
    'Quemado con SCQ menor 10 por ciento sin compromiso de vía aérea: ESI 3',
    '━━━ EMBARAZO Y PERIPARTO ━━━',
    'Embarazada menor 20 semanas con dolor o sangrado leve: ESI 3, evaluar en urgencia',
    'Embarazada mayor o igual 20 semanas con cualquier síntoma: derivar a Maternidad HCHM previa estabilización',
    'Embarazada con sangrado activo, hipotensión, dolor abdominal severo o disminución de movimientos fetales: ESI 2 o 1 + activar derivación urgente',
    'Trabajo de parto inminente: ESI 1, no trasladar sin equipo',
    '━━━ SALUD MENTAL ━━━',
    'Riesgo suicida activo (idea + plan + medio): ESI 2 mínimo + acompañamiento permanente — ver protocolo Intento Suicida GCL 1.10',
    'Intento suicida consumado (intoxicación, herida): ESI 1 o 2 según estabilidad + activación protocolo',
    'Agitación psicomotora severa con riesgo de auto o heteroagresión: ESI 2 + protocolo Agitación HCSFB 159',
    'Descompensación psiquiátrica sin agitación ni riesgo vital: ESI 3 y evaluación de criterios SM HCSFB 166',
    '━━━ CUIDADOS PALIATIVOS ━━━',
    'Paciente con LET documentada (Limitación de Esfuerzo Terapéutico) o en cuidados paliativos al final de vida: NO aplicar ESI estándar — priorizar manejo sintomático y comunicación con familia',
    'Criterios para gestionar como urgencia paliativa: dolor incontrolable, disnea severa, agitación terminal, hemorragia paliativa — ver protocolo Urgencias en Cuidados Paliativos',
    '━━━ EPIDEMIOLÓGICO ━━━',
    'Sospecha de patología de notificación obligatoria (sarampión, COVID grave, tuberculosis bacilífera): aislar al ingreso + ESI según severidad',
    'Brote intrahospitalario activo: aplicar protocolo PCI vigente además de categorización',
    '━━━ VIOLENCIA Y ABUSO ━━━',
    'Violencia intrafamiliar activa con lesiones: ESI según gravedad + cadena de custodia + notificación a Carabineros',
    'Sospecha de abuso sexual: ESI 2 mínimo + activar protocolo de cadena de custodia (no asear, no cambiar ropa)',
    'Sospecha de maltrato infantil o adulto mayor: ESI según motivo + notificación obligatoria',
    '━━━ ATENCIÓN PREFERENTE ━━━',
    'Mayores de 65 años, personas con discapacidad, cuidadores con menores: prioridad DENTRO de la misma categoría ESI (no se sube de nivel automáticamente)',
    'Hijo lactante o menor de 5 años acompañando a paciente: gestionar acompañamiento alternativo',
  ],
  layout_position: 'main',
};

const BLOCK_VITALES_PEDI = {
  id: 'triage-vitales-pedi',
  tab: 'triage_casos',
  type: 'criteria',
  color: 'green',
  order: 2,
  title: 'Signos vitales normales — Pediatría (menores 8 años)',
  content: 'Rangos esperados para evaluar estabilidad. Valores fuera obligan a considerar ESI 2 o superior.',
  items: [
    '━━━ RECIÉN NACIDO (1 a 28 días) ━━━',
    'SatO2 mayor o igual 92 por ciento, FR menor 50, FC menor 180, T menor 38.0',
    '━━━ 29 días a 3 meses ━━━',
    'SatO2 mayor o igual 92 por ciento, FR menor 50, FC menor 180, T menor 38.0',
    '━━━ 3 meses a 3 años ━━━',
    'SatO2 mayor o igual 92 por ciento, FR menor 40, FC menor 160, T menor 39.0',
    '━━━ 3 a 8 años ━━━',
    'SatO2 mayor o igual 92 por ciento, FR menor 30, FC menor 140',
    '━━━ Mayor de 8 años (usar rangos adulto) ━━━',
    'SatO2 mayor o igual 92 por ciento, FR menor 20, FC menor 100',
  ],
  layout_position: 'main',
};

const BLOCK_REF_AGITACION = {
  id: 'triage-ref-agitacion',
  tab: 'triage_casos',
  type: 'reference',
  order: 3,
  title: 'Ver también',
  reference_type: 'topic',
  reference_id: REF.agitacion,
  reference_label: 'HCSFB 159 — Contención Farmacológica y No Farmacológica en Agitación Psicomotora',
};

const BLOCK_REF_SUICIDA = {
  id: 'triage-ref-suicida',
  tab: 'triage_casos',
  type: 'reference',
  order: 4,
  title: 'Ver también',
  reference_type: 'topic',
  reference_id: REF.suicida,
  reference_label: 'GCL 1.10 — Manejo de Pacientes con Intento Suicida en Urgencias',
};

const BLOCK_REF_PALIATIVOS = {
  id: 'triage-ref-paliativos',
  tab: 'triage_casos',
  type: 'reference',
  order: 5,
  title: 'Ver también',
  reference_type: 'topic',
  reference_id: REF.paliativos,
  reference_label: 'Urgencias en Cuidados Paliativos',
};

const BLOCK_REF_RRAPIDA = {
  id: 'triage-ref-rrapida',
  tab: 'triage_casos',
  type: 'reference',
  order: 6,
  title: 'Ver también',
  reference_type: 'topic',
  reference_id: REF.rrapida,
  reference_label: 'HCSFB 165 — Activación y Respuesta Rápida (paciente hospitalizado con descompensación psiquiátrica)',
};

// ════════════════════════════════════════════════════════════════════════════
// PESTAÑA 5 — triage_flujogramas
// ════════════════════════════════════════════════════════════════════════════

const BLOCK_MERMAID = {
  id: 'triage-mermaid',
  tab: 'triage_flujogramas',
  type: 'mermaid',
  order: 1,
  title: 'Algoritmo ESI — Flujo de decisión completo',
  content: 'flowchart TD\n    INI(["Paciente ingresa<br/>RAU generado"]) --> A{"A. ¿Necesita<br/>reanimación inmediata?"}\n    A -->|"Sí: apnea, shock,<br/>paro, GCS≤8, sangrado masivo"| ESI1(["ESI 1<br/>Atención inmediata<br/>Box reanimación"])\n    A -->|"No"| B{"B. ¿Alto riesgo?<br/>No debe esperar"}\n    B -->|"Sí: SCA, disnea severa,<br/>GCS 9-13, EVA≥7,<br/>sepsis, sangrado activo"| ESI2(["ESI 2<br/>Antes de 30 min<br/>Box monitorizado"])\n    B -->|"No"| C{"C. Recursos<br/>necesarios"}\n    C -->|"0"| ESI5(["ESI 5<br/>Hasta 300 min<br/>Considerar SAR"])\n    C -->|"1"| ESI4(["ESI 4<br/>Antes de 180 min<br/>Sala espera"])\n    C -->|"2 o más"| D{"D. Signos vitales<br/>fuera de rango?"}\n    D -->|"Sí: ver bloque adulto/pediátrico"| ESI2\n    D -->|"No"| ESI3(["ESI 3<br/>Antes de 90 min<br/>Sala con reevaluación"])\n    ESI3 -.->|"Deterioro<br/>en espera"| RC{{"Reclasificar"}}\n    ESI4 -.->|"Deterioro<br/>en espera"| RC\n    ESI5 -.->|"Deterioro<br/>en espera"| RC\n    RC -.-> B',
  layout_position: 'main',
};

// ════════════════════════════════════════════════════════════════════════════
// EJECUCIÓN
// ════════════════════════════════════════════════════════════════════════════

const NEW_BLOCKS = [
  BLOCK_PROTOCOLO,
  BLOCK_DECISION,
  BLOCK_RECLASIF,
  BLOCK_REGISTRO,
  BLOCK_ROLES,
  BLOCK_MATERIALES,
  BLOCK_EQUIPO_MERMAID,
  BLOCK_CATEGORIAS,
  BLOCK_RECURSOS,
  BLOCK_VITALES_ADULTO,
  BLOCK_CASOS,
  BLOCK_VITALES_PEDI,
  BLOCK_REF_AGITACION,
  BLOCK_REF_SUICIDA,
  BLOCK_REF_PALIATIVOS,
  BLOCK_REF_RRAPIDA,
  BLOCK_MERMAID,
];

async function main() {
  const { data, error } = await supabase
    .from('topics')
    .select('content_blocks')
    .eq('id', TOPIC_ID)
    .maybeSingle();
  if (error) { console.error('Error leyendo topic:', error); process.exit(1); }
  if (!data) { console.error(`Topic ${TOPIC_ID} no encontrado.`); process.exit(1); }

  const existing = Array.isArray(data.content_blocks) ? data.content_blocks : [];
  console.log(`Bloques existentes: ${existing.length}`);
  existing.forEach((b, i) => console.log(`  ${i}. ${b.id} | ${b.type} | tab=${b.tab || '—'} | ${(b.title || '').slice(0, 60)}`));

  // Preservar bloques que NO están en DELETE_IDS y que tampoco van a ser
  // sobrescritos por uno nuevo con el mismo id. Bloques sin id o sin tab
  // se eliminan si están en DELETE_IDS o si su id está entre los nuevos.
  const newIds = new Set(NEW_BLOCKS.map(b => b.id));
  const preserved = existing
    .filter(b => {
      if (!b || !b.id) return false; // sin id se descarta
      if (DELETE_IDS.has(b.id)) return false;
      if (newIds.has(b.id)) return false;
      return true;
    })
    .map(b => {
      // Modo tabs explícitos: si quedó algún preservado sin tab, lo mandamos
      // a triage_protocolo (por defecto) para que no aparezca en todas.
      if (!b.tab) return { ...b, tab: 'triage_protocolo', order: (b.order || 99) + 10 };
      return b;
    });

  const finalBlocks = [...preserved, ...NEW_BLOCKS];

  console.log('\nDistribución por pestaña tras update:');
  const byTab = {};
  finalBlocks.forEach(b => {
    const t = b.tab || '<sin tab>';
    byTab[t] = (byTab[t] || 0) + 1;
  });
  Object.entries(byTab).forEach(([t, n]) => console.log(`  ${t}: ${n}`));
  console.log(`\nTotal: ${finalBlocks.length} bloques (preservados: ${preserved.length}, nuevos/reemplazados: ${NEW_BLOCKS.length})`);

  if (!APPLY) {
    console.log('\nDry-run. Re-ejecutar con --apply para guardar en Supabase.');
    return;
  }

  const { error: upErr } = await supabase
    .from('topics')
    .update({ content_blocks: finalBlocks })
    .eq('id', TOPIC_ID);
  if (upErr) { console.error('Error guardando:', upErr); process.exit(1); }
  console.log('\nProtocolo actualizado en Supabase.');
}

main();
