import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const POLICLINICO_CATEGORY_ID = '696ea6ff245ef362de4f431e';
const TOPIC_NAME = 'Criterios de derivación a Broncopulmonar Adulto';

function textBlock(title, content, tab = 'Resumen') {
  return {
    id: randomUUID(),
    type: 'text',
    title,
    content,
    tab,
  };
}

function tableBlock(title, headers, rows, tab = 'Criterios') {
  return {
    id: randomUUID(),
    type: 'table',
    title,
    headers,
    rows,
    tab,
  };
}

function alertBlock(title, content, variant = 'info', tab = 'Resumen') {
  return {
    id: randomUUID(),
    type: 'alert',
    title,
    content,
    variant,
    tab,
  };
}

function derivationUpdateHeader({
  title,
  subtitle,
  source,
  author,
  summary,
}) {
  return {
    id: randomUUID(),
    type: 'protocol_header',
    tab: 'Resumen',
    title,
    code: 'Actualización de red',
    institution: source,
    department: subtitle,
    version: 'v1',
    date: 'Fuente local Red Ñuble',
    objective: summary,
    authors: [
      {
        name: author,
        role: 'Autor fuente',
      },
      {
        name: 'Formato MedPlan AI',
        role: 'Síntesis operativa para Policlínico',
      },
    ],
  };
}

function buildDerivationUpdateTopic() {
  const summary =
    'Referencia práctica para derivación de usuarios mayores de 15 años a Broncopulmonar Adulto, con requisitos mínimos, criterios por patología, adjuntos esperados y errores frecuentes.';

  return {
    name: TOPIC_NAME,
    category_id: POLICLINICO_CATEGORY_ID,
    subcategory: 'Respiratorio',
    title: TOPIC_NAME,
    description:
      'Criterios clínico-administrativos para derivación a Broncopulmonar Adulto mediante teleprocesos y flujos habituales de la Red Ñuble.',
    tags: [
      'broncopulmonar',
      'teleprocesos',
      'derivacion',
      'respiratorio',
      'EPOC',
      'asma',
      'cancer pulmonar',
      'tuberculosis',
      'bronquiectasias',
      'derrame pleural',
      'enfermedad pulmonar intersticial',
    ],
    tipo_contenido: ['criterios_derivacion', 'actualizacion_red', 'contenido_medico'],
    clasificacion_ges: 'No GES',
    has_local_protocol: false,
    status: 'published',
    order: 92,
    layout_mode: 'tabs',
    clinical_summary: summary,
    diagnostic_orientation:
      'Usar teleprocesos como regla general para patologias respiratorias que requieren subespecialista; respetar flujos habituales en sospecha de cancer pulmonar y tuberculosis segun corresponda.',
    complementary_studies:
      'Toda derivacion debe incluir antecedentes clinicos, anamnesis dirigida, espirometria basal y post broncodilatador, test de marcha de 6 minutos e imagenes cuando esten disponibles.',
    initial_treatment:
      'APS debe asegurar continuidad de tratamientos indicados por subespecialista, replicando receta cuando corresponda y evitando interrupciones terapeuticas.',
    authors: [
      {
        name: 'Dr. Felipe Rozas C.',
        role: 'Internista Neumologo · Coordinador Equipo Broncopulmonar',
      },
      {
        name: 'Equipo Broncopulmonar · Red Ñuble',
        role: 'Documento fuente: Jornadas de Telemedicina',
      },
    ],
    content_blocks: [
      derivationUpdateHeader({
        title: TOPIC_NAME,
        subtitle: 'Jornadas de Telemedicina · Enfermedades Respiratorias del Adulto',
        source: 'Equipo Broncopulmonar · Red Ñuble',
        author: 'Dr. Felipe Rozas C. · Internista Neumologo',
        summary,
      }),
      alertBlock(
        'Regla general',
        'Todas las patologias respiratorias que requieran evaluacion por subespecialista deben enviarse via teleprocesos. Las excepciones señaladas en la fuente son sospecha de cancer pulmonar y tuberculosis, que mantienen flujo habitual cuando corresponda.',
      ),
      textBlock(
        'Objetivo operativo',
        'Estandarizar la referencia y contrarreferencia entre APS y nivel secundario, mejorando pertinencia, oportunidad de evaluacion, calidad de la informacion enviada y continuidad del tratamiento indicado por subespecialista.',
      ),
      tableBlock(
        'Minimos indispensables para toda derivacion',
        ['Elemento', 'Debe incluir'],
        [
          [
            'Antecedentes clinicos',
            'Comorbilidades, habitos como tabaquismo, farmacos en uso, dosis de inhaladores y antecedentes familiares relevantes.',
          ],
          [
            'Anamnesis',
            'Inicio aproximado de sintomas, motivo de derivacion e historial de exacerbaciones hospitalarias o ambulatorias.',
          ],
          [
            'Funcion pulmonar',
            'Espirometria basal y post broncodilatador. Agregar test de marcha de 6 minutos cuando este disponible.',
          ],
          [
            'Imagenes',
            'Adjuntar informe completo disponible. Si la imagen no es de Red Ñuble, indicar forma de acceso.',
          ],
        ],
        'Resumen',
      ),
      tableBlock(
        'Criterios por patologia',
        ['Patologia', 'Derivar cuando exista', 'Canal'],
        [
          [
            'EPOC',
            'Disnea mMRC > 2, una o mas exacerbaciones con hospitalizacion, dos o mas exacerbaciones ambulatorias, hematocrito > 50% o uso permanente de corticoides orales por mas de 1 mes.',
            'Teleprocesos',
          ],
          [
            'Asma en mayores de 15 años',
            'Duda diagnostica, mal control pese a dosis alta de fluticasona/salmeterol, antecedente de ventilacion mecanica invasiva por exacerbacion, asma no controlada en embarazo o intolerancia a AINES/AAS.',
            'Teleprocesos',
          ],
          [
            'Cancer pulmonar',
            'Biopsia confirmatoria o imagen sugerente segun flujo GES. Nodulo < 2 cm o derrame pleural unilateral especifico pueden enviarse por teleprocesos si no corresponde activar sospecha GES.',
            'Flujo habitual o teleprocesos segun caso',
          ],
          [
            'Enfermedad pulmonar intersticial',
            'Crepitos al examen fisico mas imagen sugerente en radiografia o tomografia de torax.',
            'Teleprocesos',
          ],
          [
            'Derrame pleural',
            'Todo derrame pleural identificado por clinica e imagenes, excepto insuficiencia cardiaca evidente con derrame bilateral.',
            'Teleprocesos',
          ],
          [
            'Tuberculosis',
            'Duda diagnostica, toxicidad a farmacos anti-TBC, TBC extrapulmonar, TBC y VIH, silico-tuberculosis, sospecha de TBC resistente o quimioprofilaxis en VIH/inmunosupresion.',
            'Flujo habitual segun programa TBC',
          ],
          [
            'Bronquiectasias',
            'Sintomas persistentes, mas de una exacerbacion anual o alteracion de funcion pulmonar.',
            'Teleprocesos',
          ],
          [
            'Apnea del sueño',
            'No derivar a Broncopulmonar Adulto.',
            'Derivar a Policlínico de Sueño / Neurología infantil segun corresponda',
          ],
        ],
      ),
      tableBlock(
        'Adjuntos esperados',
        ['Patologia', 'Adjuntar'],
        [
          ['EPOC', 'Espirometria basal y post broncodilatador, test de marcha de 6 minutos y radiografia de torax si disponible.'],
          ['Asma', 'Espirometria basal y post broncodilatador, radiografia de torax si disponible.'],
          ['Cancer pulmonar', 'Imagen disponible al menos radiografia de torax, espirometria basal/post broncodilatador y test de marcha de 6 minutos.'],
          ['Enfermedad pulmonar intersticial', 'Imagen disponible al menos radiografia de torax, espirometria basal/post broncodilatador y test de marcha de 6 minutos.'],
          ['Derrame pleural', 'Imagen disponible e informe completo.'],
          ['Tuberculosis', 'Tarjeton de tratamiento, Xpert TBC, cultivos, baciloscopias disponibles e imagen.'],
          ['Bronquiectasias', 'Espirometria basal/post broncodilatador, test de marcha de 6 minutos, Xpert TBC en expectoracion y cultivo corriente si disponible.'],
        ],
        'Adjuntar',
      ),
      tableBlock(
        'Plantilla breve para teleprocesos',
        ['Seccion', 'Contenido sugerido'],
        [
          ['Motivo', 'Patologia sospechada o confirmada y pregunta clinica concreta para especialista.'],
          ['Resumen clinico', 'Tiempo de evolucion, sintomas principales, exacerbaciones, hospitalizaciones y tratamientos recibidos.'],
          ['Factores relevantes', 'Tabaquismo, exposiciones, comorbilidades, embarazo, inmunosupresion, VIH o antecedentes familiares pertinentes.'],
          ['Tratamiento actual', 'Farmacos, dosis, tecnica/adherencia inhalatoria si aplica y respuesta clinica.'],
          ['Adjuntos', 'PFP completas, imagenes/informes completos y ubicacion en DocLid cuando corresponda.'],
        ],
        'Adjuntar',
      ),
      tableBlock(
        'Errores frecuentes y correccion',
        ['Error', 'Correccion operativa'],
        [
          ['Activar GES cancer por nodulo < 1 cm.', 'No activar sospecha GES solo por nodulo < 1 cm.'],
          ['Enviar interconsulta por canal habitual para nodulos < 2 cm.', 'Enviar por teleprocesos cuando no corresponda activar sospecha GES.'],
          ['Derivar apnea del sueño a broncopulmonar.', 'Derivar a Policlínico de Sueño / Neurología infantil segun corresponda.'],
          ['Derivar niño o adolescente asmatico que pasa a adulto sin criterio adulto.', 'Derivar solo si cumple criterios de adulto.'],
          ['Enviar solo conclusion de espirometria o TM6M.', 'Adjuntar examen completo o indicar explicitamente que esta disponible en DocLid.'],
          ['No enviar imagenes o copiar solo la conclusion del informe.', 'Adjuntar informe completo y acceso a imagenes cuando no sean de Red Ñuble.'],
          ['No replicar receta indicada por subespecialista.', 'APS debe asegurar continuidad terapeutica y replicar receta cuando corresponda.'],
        ],
        'Errores',
      ),
      alertBlock(
        'Continuidad de tratamiento',
        'Cuando el subespecialista indique un tratamiento que corresponde continuar en APS, replicar la receta localmente para evitar interrupciones. Ejemplo de la fuente: budesonida/formoterol indicado por especialista que no se replica en APS.',
        'warning',
        'Errores',
      ),
      textBlock(
        'Nota de conversion',
        'Este tema no corresponde a un protocolo institucional. Es una sintesis operativa tipo actualizacion de red, construida desde el documento local para facilitar lectura rapida en Policlínico.',
        'Errores',
      ),
    ],
  };
}

async function main() {
  const topic = buildDerivationUpdateTopic();

  const { data: existing, error: findError } = await supabase
    .from('topics')
    .select('id')
    .eq('category_id', POLICLINICO_CATEGORY_ID)
    .eq('name', TOPIC_NAME)
    .maybeSingle();

  if (findError) {
    throw findError;
  }

  if (existing?.id) {
    const { error } = await supabase
      .from('topics')
      .update(topic)
      .eq('id', existing.id);

    if (error) {
      throw error;
    }

    console.log(`Updated topic: ${TOPIC_NAME} (${existing.id})`);
    return;
  }

  const { data, error } = await supabase
    .from('topics')
    .insert(topic)
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  console.log(`Created topic: ${TOPIC_NAME} (${data.id})`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
