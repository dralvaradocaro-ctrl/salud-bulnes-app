/**
 * Crea/actualiza tema de sedoanalgesia procedural en Urgencias.
 *
 * Uso:
 *   node --env-file=.env scripts/create-sedoanalgesia-procedural-v1.mjs
 *   node --env-file=.env scripts/create-sedoanalgesia-procedural-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const APPLY = process.argv.includes('--apply');
const CATEGORY_ID = '696ea6ff245ef362de4f431f'; // Urgencias
const TOPIC_NAME = 'Sedoanalgesia procedural para cardioversión, reducciones y procedimientos breves';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

const references = [
  'ACEP Clinical Policy: Procedural Sedation and Analgesia in the Emergency Department. Ann Emerg Med. 2014. DOI: 10.1016/j.annemergmed.2013.10.015',
  'American Society of Anesthesiologists. Practice Guidelines for Moderate Procedural Sedation and Analgesia 2018. Anesthesiology. DOI: 10.1097/ALN.0000000000002043',
  'Bellolio MF, et al. Incidence of adverse events in adults undergoing procedural sedation in the emergency department: systematic review and meta-analysis. Acad Emerg Med. 2016. DOI: 10.1111/acem.12875',
  'Ketamine-propofol versus propofol alone for emergency department procedural sedation: systematic review/meta-analysis. Acad Emerg Med. 2015. DOI: 10.1111/acem.12737',
];

const content_blocks = [
  {
    id: 'sedo-resumen',
    type: 'text',
    tab: 'Estrategia',
    color: 'rose',
    order: 10,
    title: 'Estrategia práctica',
    content:
      'Sedoanalgesia procedural es una intervención de riesgo: el objetivo es lograr analgesia, amnesia y/o hipnosis suficientes para un procedimiento breve, manteniendo respiración espontánea y capacidad de rescate inmediato. En cardioversión suele bastar un hipnótico corto con analgesia mínima; en reducciones y procedimientos dolorosos se requiere analgésico más sedante. Ketamina queda como segunda línea local por stock limitado, especialmente si falla analgesia/sedación convencional, broncoespasmo o hipotensión relativa. Titular siempre a efecto, no a una dosis rígida.',
    details: [
      'No iniciar si no hay monitorización, oxígeno, aspiración, BVM, acceso EV y plan de vía aérea.',
      'Una persona debe dedicarse a monitorizar sedación/vía aérea; el operador del procedimiento no debiera ser el único monitor.',
      'Preferir dosis inicial menor en adulto mayor, EPOC/SAHOS, obesidad, hepatopatía, ERC o ASA III-IV.',
      'Ayuno no debe retrasar una urgencia real, pero el riesgo de aspiración debe quedar considerado y mitigado.',
    ],
    layout_position: 'main',
  },
  {
    id: 'sedo-calculadora',
    type: 'procedural_sedoanalgesia_calculator',
    tab: 'Calculadora',
    order: 20,
    title: 'Calculadora de combinación local',
    layout_position: 'main',
  },
  {
    id: 'sedo-arsenal-local',
    type: 'table',
    tab: 'Arsenal local',
    color: 'rose',
    order: 30,
    title: 'Alternativas locales vigentes indexadas',
    headers: ['Fármaco', 'Presentación local', 'Rol', 'Punto crítico'],
    rows: [
      ['Fentanilo', 'Solución inyectable 0,05 mg/mL = 50 mcg/mL', 'Analgesia EV corta para reducción/procedimiento doloroso; dosis baja en cardioversión si se usa.', 'Depresión respiratoria, más si se combina con midazolam. Tener naloxona.'],
      ['Morfina', 'Solución inyectable 10 mg/mL y 20 mg/mL', 'Alternativa analgésica si no hay fentanilo o dolor persistente.', 'Inicio más lento y recuperación más prolongada; no ideal como única analgesia de procedimiento breve.'],
      ['Midazolam', 'Solución inyectable 5 mg/mL', 'Ansiolisis/amnesia; combinar con analgesia si el procedimiento duele.', 'No es analgésico; sedación prolongada y apnea si se combina con opioides. Tener flumazenil, usar con cautela.'],
      ['Etomidato', 'Solución inyectable 2 mg/mL', 'Hipnótico corto para cardioversión o paciente con riesgo hemodinámico.', 'No aporta analgesia; mioclonías. Considerar dolor del procedimiento por separado.'],
      ['Ketamina', 'SSÑ-2026: 500 mg/10 mL = 50 mg/mL', 'Segunda línea local por stock limitado: reducciones/procedimientos dolorosos si falla esquema convencional, broncoespasmo o hipotensión relativa.', 'Puede subir PA/FC; evitar o usar cautela en HTA severa, disección, isquemia activa o agitación psicótica.'],
      ['Naloxona', 'Solución inyectable 0,4 mg/mL', 'Rescate de depresión respiratoria por opioide.', 'Titular dosis bajas para revertir ventilación sin abolir analgesia.'],
      ['Flumazenil', 'Solución inyectable 0,1 mg/mL', 'Rescate de benzodiacepina.', 'Evitar uso liberal si dependencia a BZD, intoxicación mixta o riesgo convulsivo.'],
      ['Propofol', 'No indexado como arsenal local en scripts vigentes', 'Referencia externa: hipnótico muy corto si disponible por equipo entrenado.', 'No analgésico; hipotensión/apnea. No dejar como alternativa local por defecto.'],
    ],
    layout_position: 'main',
  },
  {
    id: 'sedo-eleccion',
    type: 'table',
    tab: 'Estrategia',
    color: 'blue',
    order: 40,
    title: 'Elección por procedimiento',
    headers: ['Escenario', 'Estrategia sugerida', 'Evitar / cautela'],
    rows: [
      ['Cardioversión eléctrica', 'Hipnótico corto: etomidato titulado. Agregar fentanilo bajo solo si dolor/ansiedad significativa.', 'Evitar sobrecargar opioide+BZD. Si inestable, cardioversión urgente no debe retrasarse por sedación perfecta.'],
      ['Reducción de luxación/fractura', 'Primera línea local: fentanilo + etomidato titulado. Ketamina como segunda línea si analgesia/sedación insuficiente o broncoespasmo/hipotensión relativa.', 'Ketamina con cautela en HTA severa/isquemia activa. Etomidato no cubre analgesia.'],
      ['Procedimiento doloroso breve', 'Primera línea: fentanilo + midazolam titulados. Ketamina segunda línea si se requiere sedoanalgesia en un solo agente o falla esquema convencional.', 'Midazolam en adulto mayor/EPOC/SAHOS: dosis reducida y redosis lenta.'],
      ['Adulto mayor/frágil/ASA III-IV', 'Partir con 25-50% de dosis habitual, bolos pequeños, monitorización estricta y umbral bajo para ayuda/anestesia/traslado.', 'Evitar metas de sedación profunda si no son imprescindibles.'],
    ],
    layout_position: 'main',
  },
  {
    id: 'sedo-excepciones',
    type: 'criteria',
    tab: 'Excepciones',
    color: 'red',
    order: 50,
    title: 'Excepciones seleccionables antes de indicar',
    content: 'Si cualquiera está presente, reducir dosis, cambiar estrategia o escalar recursos.',
    items: [
      'No hay set de rescate/monitorización completo: no sedar hasta corregir.',
      'Vía aérea difícil, hipoventilación basal, SAHOS, EPOC severo u obesidad mórbida: evitar bolos rápidos y asociación opioide + benzodiacepina si es posible.',
      'Hipotensión/shock: evitar fármacos hipotensores; preferir etomidato. Reservar ketamina si broncoespasmo o necesidad analgésica dominante.',
      'Ketamina: segunda línea local por stock limitado; evitarla como primera elección si hay alternativa efectiva.',
      'HTA severa, disección aórtica, isquemia coronaria activa o taquiarritmia catecolaminérgica: evitar ketamina.',
      'Uso crónico de benzodiacepinas, epilepsia o intoxicación mixta: flumazenil puede precipitar convulsiones.',
      'Uso crónico de opioides: naloxona debe titularse para ventilación, no para despertar completamente.',
    ],
    layout_position: 'main',
  },
  {
    id: 'sedo-flow',
    type: 'mermaid',
    tab: 'Algoritmo',
    order: 60,
    title: 'Algoritmo operativo',
    content: `flowchart TD
    A([Procedimiento breve doloroso o no tolerable]) --> B{¿Rescate y monitor listos?}
    B -->|No| C([No sedar aún\\npreparar equipo])
    B -->|Sí| D{¿Procedimiento?}
    D -->|Cardioversión| E[Etomidato titulado\\n± fentanilo bajo]
    D -->|Reducción| F[Fentanilo + etomidato\\nketamina 2ª línea]
    D -->|Doloroso breve| G[Fentanilo + midazolam\\nketamina 2ª línea]
    E --> H[Monitor ECG PA SpO2\\nideal capnografía]
    F --> H
    G --> H
    H --> I{¿Alto riesgo?}
    I -->|Sí| J[Dosis 25-50% menor\\nbolos lentos\\nescalar ayuda]
    I -->|No| K[Titular a efecto\\nreevaluar cada 1-2 min]
    J --> L([Recuperación y alta segura])
    K --> L`,
    layout_position: 'main',
  },
  {
    id: 'sedo-referencias',
    type: 'text',
    tab: 'Referencias',
    color: 'slate',
    order: 70,
    title: 'Evidencia cotejada',
    content: references.map((ref) => `- ${ref}`).join('\n'),
    layout_position: 'main',
  },
];

const payload = {
  id: randomUUID(),
  name: TOPIC_NAME,
  title: TOPIC_NAME,
  category_id: CATEGORY_ID,
  subcategory: 'Procedimientos',
  status: 'published',
  description:
    'Estrategia local de sedoanalgesia procedural para cardioversión, reducciones ortopédicas y procedimientos breves, con calculadora de combinación analgésico + sedante.',
  order: 132,
  tags: ['sedoanalgesia', 'sedación procedural', 'cardioversión', 'reducción', 'ketamina', 'etomidato', 'fentanilo', 'midazolam', 'urgencias'],
  authors: [{ name: 'Equipo Clínico HCSF Bulnes', role: 'Síntesis local basada en evidencia' }],
  published_date: new Date().toISOString(),
  last_updated: new Date().toISOString(),
  layout_mode: 'protocol',
  tipo_contenido: ['contenido_medico', 'herramienta_clinica'],
  clasificacion_ges: 'No GES',
  has_local_protocol: false,
  content_blocks,
  related_topics: [],
  related_tools: [{ tool_id: 'procedural-sedoanalgesia', tool_type: 'calculator', label: 'Sedoanalgesia procedural — combinación local' }],
  clinical_summary:
    'La sedoanalgesia procedural debe combinar objetivo, procedimiento, riesgo del paciente y arsenal disponible. La regla práctica local es analgesia para procedimientos dolorosos más hipnosis/amnésia titulada; ketamina queda como segunda línea por stock limitado.',
  diagnostic_orientation:
    'Antes de indicar: definir procedimiento, dolor esperado, ASA/vía aérea, riesgo respiratorio/hemodinámico, ayuno relativo, acceso EV y capacidad de rescate.',
  complementary_studies:
    'Monitor ECG, PA, SpO2 e idealmente capnografía. En cardioversión: monitor/desfibrilador sincronizado, vía venosa, oxígeno y plan de reanimación.',
  initial_treatment:
    'Usar calculadora local para combinar fentanilo/morfina con etomidato/midazolam según escenario; reservar ketamina como segunda línea o excepción útil. Titular bolos pequeños a efecto y seguridad.',
  protocol_code: 'Referencia clínica local',
  protocol_edition: 'v1',
  protocol_date: 'Julio 2026',
  protocol_validity: '',
  protocol_authors: [{ name: 'Equipo Clínico HCSF Bulnes', role: 'Síntesis local basada en evidencia' }],
  protocol_objective:
    'Estandarizar una estrategia práctica y segura para sedoanalgesia procedural en urgencias usando alternativas locales vigentes.',
};

async function main() {
  const { data: existing, error: findError } = await supabase
    .from('topics')
    .select('id,name')
    .eq('category_id', CATEGORY_ID)
    .eq('name', TOPIC_NAME)
    .maybeSingle();
  if (findError) throw findError;

  if (!APPLY) {
    console.log(JSON.stringify({
      mode: 'dry-run',
      existing,
      topic: TOPIC_NAME,
      category_id: CATEGORY_ID,
      blocks: content_blocks.length,
      related_tools: payload.related_tools,
    }, null, 2));
    console.log('\nDry-run. Ejecuta con --apply para escribir en Supabase.');
    return;
  }

  let topic;
  if (existing?.id) {
    const updatePayload = { ...payload };
    delete updatePayload.id;
    const { data, error } = await supabase
      .from('topics')
      .update(updatePayload)
      .eq('id', existing.id)
      .select('id,name,related_tools')
      .single();
    if (error) throw error;
    topic = data;
  } else {
    const { data, error } = await supabase
      .from('topics')
      .insert(payload)
      .select('id,name,related_tools')
      .single();
    if (error) throw error;
    topic = data;
  }

  console.log(JSON.stringify({ topic }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
