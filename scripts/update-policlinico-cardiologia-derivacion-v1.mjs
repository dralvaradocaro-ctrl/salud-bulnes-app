import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const CATEGORY_ID = '696ea6ff245ef362de4f431e';
const TOPIC_NAME = 'Criterios y Requisitos de Derivación a Cardiología';

function textBlock(title, content, tab = 'Resumen') {
  return { id: randomUUID(), type: 'text', title, content, tab };
}

function tableBlock(title, headers, rows, tab = 'Criterios') {
  return { id: randomUUID(), type: 'table', title, headers, rows, tab };
}

function alertBlock(title, content, variant = 'info', tab = 'Resumen') {
  return { id: randomUUID(), type: 'alert', title, content, variant, tab };
}

function headerBlock() {
  return {
    id: randomUUID(),
    type: 'protocol_header',
    tab: 'Resumen',
    ordinario: 'ACTUALIZACIÓN DE RED',
    title: TOPIC_NAME,
    institution: 'Unidad de Cardiología · Hospital Clínico Herminda Martín',
    department: 'Flujo de derivación Cardiología 2026',
    date: 'Enero 2026',
    summary:
      'Criterios actualizados para derivación a Cardiología por Teleprocesos, con excepciones por MLE y requisitos mínimos de interconsulta.',
  };
}

const content_blocks = [
  headerBlock(),
  alertBlock(
    'Regla general',
    'Desde enero de 2026, toda interconsulta de Cardiología se gestiona a través de Teleprocesos. Excepciones por Módulo Lista de Espera: GES de marcapasos, urgencias, CAE y sala de hospitalizados.',
  ),
  textBlock(
    'Contexto de la unidad',
    'La Unidad de Cardiología HCHM inició en marzo de 2024 y cuenta con policlínicos de prevención secundaria post IAM (PPSIAM), insuficiencia cardiaca, electrofisiología, anticoagulante y consulta de acto único.',
  ),
  tableBlock(
    'Requisitos mínimos de interconsulta',
    ['Área', 'Debe incluir'],
    [
      ['Antecedentes', 'DM2, HTA, tabaquismo, consumo de drogas, IAM previos, cirugías previas, quimioterapia y capacidad de deambular.'],
      ['Síntomas', 'Dolor cardíaco/no cardíaco, disnea, síncope, palpitaciones e insuficiencia cardiaca.'],
      ['Examen físico', 'Soplo carotídeo, yugulares ingurgitadas, crépitos pulmonares, ritmo regular/irregular, caracterización de soplo, reflujo hepatoyugular y edema de EE.II.'],
      ['Exámenes básicos', 'Electrocardiograma, hemoglobina, glicemia/HbA1c, perfil lipídico, TSH y creatinina.'],
      ['Examen útil si sospecha IC', 'NT-proBNP por su alto valor predictivo negativo, cuando esté disponible.'],
    ],
    'Resumen',
  ),
  tableBlock(
    'Cartera de servicios disponible',
    ['Prestación', 'Detalle'],
    [
      ['ECG', 'Electrocardiograma.'],
      ['Holter PA', 'Holter de presión arterial.'],
      ['Holter ritmo', 'Holter de ritmo de 24 horas.'],
      ['Ecocardiografía', 'Ecocardiograma transtorácico.'],
      ['Isquemia', 'Test de esfuerzo.'],
      ['Hemodinamia', 'Coronariografía.'],
      ['Cardioversión', 'Cardioversión eléctrica.'],
    ],
    'Resumen',
  ),
  tableBlock(
    'Dolor torácico',
    ['Derivar cuando', 'Adjuntar / precisar'],
    [
      ['Angina típica', 'Dolor opresivo retroesternal, irradiado a brazo izquierdo, desencadenado por esfuerzo y que alivia con reposo.'],
      ['Refractario a tratamiento', 'Indicar tratamientos probados y respuesta.'],
      ['Síntomas asociados', 'Disnea o síntomas neurovegetativos.'],
      ['ECG alterado', 'Adjuntar ECG y describir alteración.'],
      ['Dolor atípico de alto riesgo', 'Alta probabilidad pretest o alto riesgo cardiovascular. Describir si tolera test de esfuerzo.'],
    ],
  ),
  tableBlock(
    'Disnea, insuficiencia cardiaca y síncope',
    ['Cuadro', 'Derivar cuando'],
    [
      ['Insuficiencia cardiaca', 'Ortopnea, disnea paroxística nocturna, edema, ingurgitación yugular o crépitos pulmonares.'],
      ['Disnea con sospecha cardiológica', 'Sospecha de cardiopatía coronaria o causa respiratoria poco probable.'],
      ['Disnea con exámenes alterados', 'ECG alterado, radiografía de tórax con cardiomegalia/congestión pulmonar o NT-proBNP elevado.'],
      ['Síncope real', 'Inicio súbito, pérdida del tono postural y recuperación ad integrum.'],
      ['Síncope de riesgo', 'ECG alterado, disnea, dolor torácico, insuficiencia cardiaca, antecedente familiar/personal de muerte súbita, cardiopatía conocida o usuario de DAI/TRC.'],
    ],
  ),
  tableBlock(
    'Palpitaciones, arritmias y FA',
    ['Condición', 'Criterio'],
    [
      ['Palpitaciones mal toleradas', 'Sintomáticas, con lipotimia o síncope.'],
      ['Palpitaciones refractarias', 'Sin respuesta a tratamiento de primera línea.'],
      ['FA reciente diagnóstico', 'Derivar directamente. No esperar evaluación para iniciar TACO cuando esté indicado.'],
      ['FA con cardiopatía estructural', 'Derivar por asociación a cardiopatía estructural.'],
      ['FA sintomática', 'Disnea, palpitaciones o síncope.'],
      ['FA refractaria', 'Refractaria a estrategia de control de frecuencia cardiaca.'],
      ['FA lenta sintomática', 'Derivar vía GES/MLE para evaluación de marcapaso.'],
      ['TPSV recurrente', 'Derivar por recurrencia.'],
      ['Flutter auricular', 'Derivar a Cardiología.'],
      ['Síndrome Wolff-Parkinson-White', 'Derivar por preexcitación ventricular/onda delta.'],
    ],
  ),
  tableBlock(
    'Soplo, ECG y cardiopatía coronaria conocida',
    ['Condición', 'Derivar cuando'],
    [
      ['Soplo cardiaco', 'Sintomático con disnea, lipotimia, síncope o insuficiencia cardiaca.'],
      ['Soplo con exámenes alterados', 'ECG alterado, radiografía de tórax alterada o ecocardiograma transtorácico alterado.'],
      ['Bloqueo completo de rama izquierda', 'Derivar.'],
      ['Extrasístoles ventriculares frecuentes', 'Carga > 20%.'],
      ['Signos de HVI', 'Derivar si hay signos electrocardiográficos de hipertrofia ventricular izquierda.'],
      ['Q patológicas', 'Derivar si corresponde; no derivar Q patológica aislada en DIII.'],
      ['Cardiopatía coronaria conocida', 'Reinicio de angina, disnea o insuficiencia cardiaca.'],
    ],
  ),
  tableBlock(
    'Derivar por GES/MLE para evaluación de marcapaso',
    ['Condición', 'Detalle'],
    [
      ['Bloqueo AV alto grado', 'Segundo grado Mobitz II o tercer grado.'],
      ['Bloqueo trifascicular', 'Especialmente si se asocia a síncope.'],
      ['Enfermedad del nodo sinusal', 'FA lenta o bradicardia sinusal sintomática.'],
    ],
  ),
  tableBlock(
    'No derivar',
    ['Situación', 'Conducta'],
    [
      ['Extrasístoles supraventriculares aisladas', 'No derivar si no hay otros criterios de riesgo.'],
      ['Extrasístoles ventriculares aisladas', 'No derivar si aisladas y sin criterios de riesgo.'],
      ['Q patológica aislada en DIII', 'No derivar por este hallazgo aislado.'],
    ],
    'No derivar',
  ),
  tableBlock(
    'Plantilla breve para Teleprocesos',
    ['Sección', 'Contenido sugerido'],
    [
      ['Motivo', 'Síndrome principal: dolor torácico, disnea/IC, síncope, palpitaciones/arritmia, soplo, ECG alterado o cardiopatía coronaria conocida.'],
      ['Historia', 'Inicio, evolución, desencadenantes, síntomas asociados, tolerancia al esfuerzo y respuesta a tratamientos.'],
      ['Riesgo CV', 'DM2, HTA, tabaquismo, drogas, IAM previo, cirugías y quimioterapia.'],
      ['Examen físico', 'Ritmo, soplos, yugulares, crépitos, edema, reflujo hepatoyugular y capacidad de deambular.'],
      ['Adjuntos', 'ECG, laboratorio básico, radiografía/eco si existen y NT-proBNP si sospecha de IC.'],
      ['Excepción MLE', 'Indicar si corresponde GES marcapasos, urgencia, CAE o paciente hospitalizado.'],
    ],
    'Adjuntar',
  ),
  tableBlock(
    'Errores frecuentes a evitar',
    ['Error', 'Corrección'],
    [
      ['Enviar IC sin ECG.', 'Adjuntar ECG en toda derivación cardiológica cuando esté disponible.'],
      ['No describir tolerancia al esfuerzo en dolor torácico.', 'Precisar si puede tolerar test de esfuerzo.'],
      ['Esperar evaluación para TACO en FA reciente.', 'No esperar evaluación cardiológica para iniciar TACO si está indicado.'],
      ['Derivar FA lenta sintomática por flujo habitual.', 'Usar GES/MLE para evaluación de marcapaso.'],
      ['Derivar extrasístoles aisladas sin otros criterios.', 'No derivar extrasístoles supraventriculares o ventriculares aisladas sin criterios de riesgo.'],
    ],
    'Errores',
  ),
  textBlock(
    'Nota de conversión',
    'Tema actualizado desde el documento local convertido a Markdown: data/markdown/criterios-derivacion-cardiologia.md. Corresponde a actualización operativa de red, no a protocolo institucional.',
    'Errores',
  ),
];

const payload = {
  title: TOPIC_NAME,
  subcategory: 'Cardiovascular',
  description:
    'Criterios 2026 para derivación a Cardiología por Teleprocesos, con excepciones por MLE, requisitos mínimos y cuadros clínicos principales.',
  tags: [
    'cardiología',
    'teleprocesos',
    'derivación',
    'dolor torácico',
    'disnea',
    'síncope',
    'palpitaciones',
    'fibrilación auricular',
    'insuficiencia cardiaca',
    'marcapaso',
  ],
  order: 0,
  status: 'published',
  layout_mode: 'tabs',
  tipo_contenido: ['criterios_derivacion', 'actualizacion_red', 'contenido_medico'],
  clasificacion_ges: 'No GES',
  has_local_protocol: false,
  authors: [
    { name: 'Dr. Andrés San Martín', role: 'Cardiólogo' },
    { name: 'E.U. Verónica Méndez', role: 'Enfermera Coordinadora Cardiología' },
    { name: 'Dr. Antonio Cabezas', role: 'Jefe Unidad de Cardiología' },
  ],
  content_blocks,
  related_topics: [],
  related_tools: [],
  clinical_summary:
    'Desde enero de 2026, Cardiología se deriva por Teleprocesos salvo GES marcapasos, urgencias, CAE y sala de hospitalizados. La SIC debe incluir historia, examen físico dirigido, ECG y laboratorio básico.',
  diagnostic_orientation:
    'Clasificar por síndrome cardiológico: dolor torácico, disnea/IC, síncope, palpitaciones/arritmia, soplo, ECG alterado o cardiopatía coronaria conocida.',
  complementary_studies:
    'ECG, hemoglobina, glicemia/HbA1c, perfil lipídico, TSH, creatinina, radiografía/eco si existen y NT-proBNP si sospecha de insuficiencia cardiaca.',
  initial_treatment:
    'No retrasar manejo inicial en APS cuando corresponda. En FA de reciente diagnóstico, no esperar evaluación cardiológica para iniciar TACO si está indicado.',
  protocol_code: null,
  protocol_edition: null,
  protocol_date: null,
  protocol_validity: null,
  protocol_authors: [],
  protocol_objective: null,
};

async function main() {
  const { data: existing, error: findError } = await supabase
    .from('topics')
    .select('id,name')
    .eq('category_id', CATEGORY_ID)
    .eq('name', TOPIC_NAME)
    .maybeSingle();
  if (findError) throw findError;

  if (!existing?.id) {
    throw new Error(`No existe el tema base: ${TOPIC_NAME}`);
  }

  const { data, error } = await supabase
    .from('topics')
    .update(payload)
    .eq('id', existing.id)
    .select('id,name')
    .single();
  if (error) throw error;
  console.log(`Updated topic: ${data.name} (${data.id})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
