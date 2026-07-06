import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const CATEGORY_ID = '696ea6ff245ef362de4f431e';
const TOPIC_NAME = 'Criterios de derivación a Ginecología';

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
    institution: 'Ginecología HCHM',
    department: 'Telemedicina en Ginecología · Red Ñuble',
    date: 'Fuente local',
    summary:
      'Criterios prácticos para derivación a Ginecología general, infantojuvenil, piso pélvico, oncoginecología, patología cervical y fertilidad.',
  };
}

const content_blocks = [
  headerBlock(),
  alertBlock(
    'Regla general',
    'Derivar a la unidad específica según el problema principal y adjuntar una SIC completa: motivo claro, anamnesis resumida, examen ginecológico, PAP al día cuando corresponda, exámenes e informe ecográfico con caracterización de lesiones.',
  ),
  textBlock(
    'Áreas de derivación',
    'El documento local organiza la telemedicina de Ginecología en: Ginecología General, Ginecología Infanto Juvenil, Piso Pélvico, Oncología Ginecológica, Fertilidad y Patología Cervical.',
  ),
  tableBlock(
    'Requisitos generales de SIC a Ginecología',
    ['Elemento', 'Debe incluir'],
    [
      ['Motivo de derivación', 'Descripción resumida del problema principal e hipótesis diagnóstica.'],
      ['Anamnesis', 'Tiempo de evolución, síntomas relevantes, tratamientos realizados y respuesta.'],
      ['Antecedentes gineco-obstétricos', 'FUR, fórmula obstétrica, método anticonceptivo y cirugías ginecológicas relevantes.'],
      ['Examen ginecológico', 'Registrar hallazgos pertinentes y examen dirigido según el motivo.'],
      ['PAP', 'PAP al día cuando corresponda.'],
      ['Laboratorio', 'Hemograma y pruebas de coagulación según contexto; FSH/estradiol día 3 si perimenopausia; CA-125 ante sospecha oncológica ovárica.'],
      ['Ecografía ginecológica', 'Describir lesión, tamaño y características. Adjuntar informe completo.'],
    ],
    'Resumen',
  ),
  tableBlock(
    'Ginecología general: derivar',
    ['Condición', 'Criterio'],
    [
      ['Sangrado uterino anormal', 'SUA persistente por más de 6 meses que no responde a tratamiento médico y/o asociado a anemia.'],
      ['Endometrio engrosado sintomático', 'Endometrio engrosado con metrorragia.'],
      ['Pólipo endometrial', 'Sintomático o mayor a 10 mm.'],
      ['SOP', 'SOP con deseo de fertilidad. Sin deseo de fertilidad, derivar a Endocrinología/SOMP según fuente local.'],
      ['Amenorrea', 'Amenorrea a estudio.'],
      ['Tumor anexial benigno', 'Tumores anexiales de aspecto benigno.'],
      ['Metrorragia postmenopáusica', 'Derivar por oncoginecología/NO GES según criterios locales, independiente del grosor endometrial.'],
      ['Mioma uterino', 'Sintomático, mayor de 4 cm o FIGO 0-1.'],
      ['Adenomiosis', 'Sintomática por metrorragia persistente mayor a 6 meses, sin respuesta a progestinas o asociada a anemia.'],
      ['Algia pélvica crónica', 'Dolor pélvico crónico ≥ 6 meses, recurrente/persistente y con impacto funcional.'],
      ['Endometriosis', 'Sospecha o diagnóstico de endometriosis.'],
      ['Esterilización', 'Solicitud de esterilización quirúrgica.'],
    ],
  ),
  tableBlock(
    'Ginecología general: no derivar',
    ['Situación', 'Conducta'],
    [
      ['Vaginitis o vaginosis', 'Manejo en APS según cuadro clínico.'],
      ['Mioma uterino < 4 cm asintomático', 'No derivar si no hay síntomas ni criterios de complejidad.'],
      ['Quiste simple < 5 cm en mujer < 50 años', 'Seguimiento ecográfico anual en APS.'],
      ['Pólipo endometrial asintomático < 10 mm', 'No derivar por este hallazgo aislado.'],
      ['Pólipo cervical asintomático < 10 mm con PAP normal', 'No derivar por este hallazgo aislado.'],
    ],
    'No derivar',
  ),
  tableBlock(
    'Caracterización ecográfica esperada',
    ['Hallazgo', 'Describir'],
    [
      ['Lesión ovárica', 'Tamaño; uni/multilocular; quística, sólida o mixta; componente sólido presente/ausente y tamaño; papilas y número; tabiques/grosor; Doppler.'],
      ['Endometrio', 'Grosor en mm en plano sagital en zona más gruesa; si hay líquido intracavitario, medir cada capa y sumar; indicar si no es medible; homogeneidad, lesión focal y Doppler.'],
      ['Miomas', 'Tamaño, ubicación y clasificación FIGO 0 a 8.'],
    ],
    'Adjuntar',
  ),
  tableBlock(
    'Ginecología infantojuvenil',
    ['Derivar', 'SIC debe incluir'],
    [
      ['Pubertad precoz', 'Desarrollo de caracteres sexuales secundarios, Tanner y edad de aparición.'],
      ['Amenorrea primaria ≥ 15 años', 'Edad de menarca si ocurrió, desarrollo puberal y antecedentes relevantes.'],
      ['Amenorrea secundaria', 'Ciclo menstrual, FUR, tratamientos y patologías concomitantes.'],
      ['Dismenorrea severa', 'Tratamientos probados, fármacos y forma de toma.'],
      ['Menstruación excesiva en pubertad', 'Duración > 7 días y/o asociación a anemia.'],
      ['Hipertrofia de labios menores en niñas > 14 años', 'Síntomas, examen y repercusión funcional.'],
      ['Sinequias vulvares', 'Examen y tratamientos realizados.'],
      ['Pubertad retrasada', 'Tanner, edad de aparición de caracteres sexuales y antecedentes.'],
    ],
  ),
  tableBlock(
    'Piso pélvico',
    ['Condición', 'Criterio y prioridad'],
    [
      ['Incontinencia de orina de esfuerzo', 'Derivar IOE moderada a severa asociada a POP. Alta si IO severa; media si IO moderada. IOE leve: manejo en APS.'],
      ['Manejo APS para IOE leve', 'Kinesioterapia de piso pélvico, evitar irritantes vesicales como alcohol/tabaco/café, revisar diuréticos, manejo de sobrepeso/obesidad y estreñimiento.'],
      ['POP sintomático', 'Derivar POP estadio II en adelante y sintomático (+1).'],
      ['Prioridad POP', 'Alta estadio IV, media estadio III, baja estadio II. SIC debe incluir POP-Q, tiempo de evolución y asociación a IOE.'],
    ],
  ),
  tableBlock(
    'Test de severidad de Sandvick',
    ['Puntaje', 'Interpretación'],
    [
      ['1-2', 'Leve'],
      ['3-6', 'Moderada'],
      ['8-9', 'Severa'],
      ['12', 'Muy severa'],
    ],
    'Adjuntar',
  ),
  tableBlock(
    'Oncología ginecológica y GES',
    ['Condición', 'Criterio'],
    [
      ['Cáncer de cuello uterino GES', 'Cuello uterino sospechoso, PAP alterado, VPH 16/18/45 positivo o PAP ASCUS + VPH positivo para otros virus. Derivar a UPC.'],
      ['Cáncer de ovario GES', 'ORADS 4-5 o tumor > 10 cm. Derivar siempre con ecografía y CA-125. Resto de tumores ováricos a Ginecología General.'],
      ['Cáncer de endometrio NO GES', 'Metrorragia postmenopáusica independiente del grosor endometrial.'],
      ['Endometrio engrosado asintomático', '> 10 mm asintomático: Ginecología General para estudio biópsico.'],
      ['Patología vulvar NO GES', 'Lesión vulvar persistente o sospechosa, o prurito vulvar por más de 4-6 meses pese a tratamiento con clobetasol.'],
      ['Prioridad oncogine', 'Alta: evaluación 20-30 días según fuente local.'],
    ],
  ),
  tableBlock(
    'Patología cervical NO GES',
    ['Derivar', 'Criterio'],
    [
      ['Pólipo cervical', 'Mayor a 10 mm.'],
      ['Ectropion', 'Ectropion sintomático.'],
      ['Sinusorragia', 'Sinusorragia persistente.'],
    ],
  ),
  tableBlock(
    'Fertilidad: criterios de derivación',
    ['Criterio', 'Detalle'],
    [
      ['Previsión', 'Es vital la previsión de la mujer: FONASA, DIPRECA o CAPREDENA según fuente local.'],
      ['IMC', 'IMC < 38; hasta 37,9 se acepta.'],
      ['Edad mujer', 'Mujer < 42 años.'],
      ['Infertilidad en mujer < 35 años', 'No lograr embarazo tras 1 año de vida sexual sin protección.'],
      ['Infertilidad en mujer ≥ 35 años', 'No lograr embarazo tras 6 meses de vida sexual sin protección.'],
      ['Causa evidente de infertilidad', 'Ejemplos: salpingectomía bilateral, hidrosalpinx bilateral, azoospermia.'],
      ['Recanalización', 'Solo se puede ofrecer a mujeres menores de 35 años; mayores reciben orientación sobre FIV extrasistema.'],
      ['Pareja homoparental femenina', 'Se ofrece inseminación artificial con semen donante; la paciente debe costear muestra en banco espermático acreditado.'],
    ],
  ),
  tableBlock(
    'Fertilidad: adjuntos y prioridad',
    ['Elemento', 'Detalle'],
    [
      ['Exámenes ambos integrantes', 'VDRL y VIH de ambos.'],
      ['Mujer', 'PAP vigente.'],
      ['Interconsultas', 'Realizar 2 interconsultas, una para paciente y una para pareja, registrando en ambas nombre y RUT de la pareja respectiva.'],
      ['Prioridad alta', 'Mujeres de 35 años y menores de 42 años.'],
      ['Prioridad media', 'Mujeres entre 30 y 34 años.'],
      ['Prioridad baja', 'Mujeres menores de 30 años.'],
    ],
    'Adjuntar',
  ),
  tableBlock(
    'Plazos por prioridad',
    ['Prioridad', 'Plazo de evaluación'],
    [
      ['Alta', '1 a 60 días.'],
      ['Media', '61 a 120 días.'],
      ['Baja', '121 a 240 días.'],
    ],
    'Resumen',
  ),
  tableBlock(
    'Errores frecuentes a evitar',
    ['Error', 'Corrección'],
    [
      ['Derivar sin motivo claro ni hipótesis diagnóstica.', 'Especificar problema principal, evolución y pregunta clínica.'],
      ['Enviar ecografía sin caracterizar lesión.', 'Describir tamaño, tipo, componentes, Doppler y clasificación cuando aplique.'],
      ['Derivar hallazgos menores asintomáticos.', 'No derivar quistes simples < 5 cm en < 50 años, pólipos pequeños asintomáticos o miomas < 4 cm asintomáticos.'],
      ['Derivar IOE leve directamente.', 'Manejo inicial en APS con kinesioterapia y medidas conservadoras.'],
      ['Derivar fertilidad sin datos de pareja.', 'Emitir 2 IC y registrar nombre/RUT de pareja en ambas.'],
    ],
    'Errores',
  ),
  textBlock(
    'Nota de conversión',
    'Tema construido desde el documento local convertido a Markdown: data/markdown/criterios-derivacion-ginecologia.md. Corresponde a actualización operativa de red, no a protocolo institucional.',
    'Errores',
  ),
];

const payload = {
  name: TOPIC_NAME,
  title: TOPIC_NAME,
  category_id: CATEGORY_ID,
  subcategory: 'Ginecología',
  description:
    'Criterios clínico-administrativos para derivación a Ginecología, oncoginecología, piso pélvico, patología cervical y fertilidad.',
  tags: [
    'ginecología',
    'telemedicina',
    'derivación',
    'sangrado uterino anormal',
    'oncoginecología',
    'piso pélvico',
    'fertilidad',
    'patología cervical',
    'infantojuvenil',
    'GES',
  ],
  order: 94,
  status: 'published',
  layout_mode: 'tabs',
  tipo_contenido: ['criterios_derivacion', 'actualizacion_red', 'contenido_medico'],
  clasificacion_ges: 'No GES',
  has_local_protocol: false,
  authors: [
    { name: 'Dra. Marcela Aravena Arroyo', role: 'Médico Gineco Obstetra · SOG-HCHM' },
  ],
  content_blocks,
  related_topics: [],
  related_tools: [],
  clinical_summary:
    'Criterios locales para seleccionar unidad de derivación ginecológica y enviar SIC completa, priorizando oncoginecología, sangrado uterino anormal persistente, piso pélvico, infantojuvenil y fertilidad.',
  diagnostic_orientation:
    'Identificar unidad destino, motivo principal, tiempo de evolución, tratamientos previos, examen ginecológico, PAP, laboratorio e informe ecográfico caracterizado.',
  complementary_studies:
    'Según caso: hemograma, pruebas de coagulación, FSH/estradiol día 3, CA-125, PAP vigente, VDRL/VIH en fertilidad, ecografía ginecológica con caracterización completa.',
  initial_treatment:
    'Manejar en APS condiciones no derivables y cuadros leves: vaginitis/vaginosis, IOE leve con kinesioterapia y medidas conservadoras, quistes simples pequeños y pólipos pequeños asintomáticos.',
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

  if (existing?.id) {
    const { data, error } = await supabase
      .from('topics')
      .update(payload)
      .eq('id', existing.id)
      .select('id,name')
      .single();
    if (error) throw error;
    console.log(`Updated topic: ${data.name} (${data.id})`);
    return;
  }

  const { data, error } = await supabase
    .from('topics')
    .insert(payload)
    .select('id,name')
    .single();
  if (error) throw error;
  console.log(`Created topic: ${data.name} (${data.id})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
