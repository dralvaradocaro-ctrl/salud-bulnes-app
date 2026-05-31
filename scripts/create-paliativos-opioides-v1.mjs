/**
 * Crea/actualiza topic "Opioides en Cuidados Paliativos" en la categoría
 * Dependencia Severa, Cuidados Paliativos y Alivio del Dolor.
 *
 * Fuente: Dra. Ximena Pucheu Moris. Opioides en Cuidados Paliativos.
 * Hospital Clínico Herminda Martín, versión 1.0.
 *
 * Uso: node scripts/create-paliativos-opioides-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

const CATEGORY_ID = '696ea6ff245ef362de4f4320';
const TOPIC_NAME = 'Opioides en Cuidados Paliativos';
const PDF_PATH = '/Users/fernandoalvarado/Downloads/opioides-protocolo-XPM.pdf';
const STORAGE_PATH = 'protocolos/cpyad/opioides-protocolo-xpm-v1.pdf';

const content_blocks = [
  {
    id: 'opioides-header',
    type: 'protocol_header',
    ordinario: 'PROTOCOLO CLÍNICO',
    title: 'Opioides en Cuidados Paliativos',
    institution: 'Hospital Clínico Herminda Martín',
    department: 'Servicio Alivio del Dolor y Cuidados Paliativos',
    date: 'Versión 1.0',
    summary:
      'Criterios de selección, uso seguro, titulación, seguimiento y rotación de opioides débiles y fuertes en pacientes adultos con dolor oncológico o en contexto de cuidados paliativos.',
    order: 1,
  },
  {
    id: 'opioides-fuente',
    type: 'text',
    tab: 'Inicio',
    color: 'gray',
    order: 5,
    title: 'Fuente',
    content:
      'Dra. Ximena Pucheu Moris. Opioides en Cuidados Paliativos: criterios de selección, uso seguro y rotación. Hospital Clínico Herminda Martín, Chillán. Protocolo institucional v1.0.',
  },
  {
    id: 'opioides-advertencia',
    type: 'alert',
    tab: 'Inicio',
    color: 'red',
    order: 6,
    title: 'Advertencia institucional',
    content:
      'Guía orientativa. No sustituye juicio clínico individualizado, normativa local de receta cheque/retenida ni registros institucionales. Toda dosificación, conversión y rotación debe verificarse en cada paciente, especialmente en adulto mayor, insuficiencia renal o hepática y polifarmacia.',
  },
  {
    id: 'opioides-resumen',
    type: 'text',
    tab: 'Inicio',
    color: 'blue',
    order: 10,
    title: 'Resumen ejecutivo',
    content:
      'Los opioides son pilar del manejo farmacológico del dolor oncológico moderado a severo y del control sintomático en cuidados paliativos. Las guías contemporáneas permiten iniciar opioides fuertes a dosis bajas en dolor moderado-severo sin pasar obligatoriamente por opioides débiles. El protocolo cubre tramadol, codeína, morfina, tapentadol, metadona, buprenorfina y fentanilo, con énfasis en seguridad, monitoreo y rotación con reducción por tolerancia cruzada incompleta.',
  },
  {
    id: 'opioides-alcance',
    type: 'criteria',
    tab: 'Inicio',
    color: 'green',
    order: 11,
    title: 'Propósito y alcance',
    items: [
      'Estandarizar indicación, ajuste, monitoreo y rotación de opioides débiles y fuertes.',
      'Aplicable a adultos con diagnóstico oncológico activo o en cuidados paliativos.',
      'Uso en atención ambulatoria, hospitalización y consulta de cuidados paliativos.',
      'Dirigido a médicos prescriptores y equipo de enfermería involucrado en titulación, educación y seguimiento.',
      'No aborda procedimientos intervencionistas, anestesia regional ni técnicas avanzadas como PCA o vía neuroaxial.',
    ],
  },
  {
    id: 'opioides-seleccion-rapida',
    type: 'flowchart',
    tab: 'Selección',
    color: 'blue',
    order: 20,
    title: 'Algoritmo general de selección',
    content: 'Elegir según intensidad, mecanismo del dolor, función renal/hepática, edad, vía disponible, polifarmacia y disponibilidad local.',
    details: [
      '━━━ DOLOR LEVE ━━━',
      'EVA 1-3 sin control → optimizar no opioides y coadyuvantes.',
      '~Si persiste: valorar tramadol IR a dosis baja y definir plazo de reevaluación.',
      '━━━ DOLOR MODERADO ━━━',
      'EVA 4-6 sin severidad → tramadol o codeína pautado + rescate.',
      '~Reevaluar a 24-72 h.',
      '~Alternativa válida: morfina oral a dosis baja, especialmente si se anticipa progresión.',
      'EVA 4-6 con fragilidad, >75 años o IR leve → iniciar bajo y monitorizar estrechamente.',
      '~Opciones: tramadol IR 25 mg c/8 h o morfina oral 2,5-5 mg c/4 h.',
      '━━━ DOLOR SEVERO O CRISIS ━━━',
      'EVA >=7 o crisis → iniciar opioide fuerte, habitualmente morfina, con titulación.',
      '~No demorar con opioide débil si el dolor es severo.',
      'Falla de opioide débil tras 48-72 h optimizado → rotar a opioide fuerte a dosis equivalente baja.',
      '━━━ MODIFICADORES DE SEGURIDAD ━━━',
      'VFG <30 mL/min → evitar tramadol, codeína y morfina.',
      '~Preferir fentanilo, buprenorfina o metadona con experiencia.',
      'Dolor mixto nociceptivo-neuropático → considerar tapentadol o metadona y sumar coadyuvantes.',
    ],
  },
  {
    id: 'opioides-decision-seguridad',
    type: 'flowchart',
    tab: 'Selección',
    color: 'amber',
    order: 21,
    title: 'Puntos de decisión antes de elegir opioide',
    content: 'Usar como chequeo rápido para evitar una selección insegura.',
    details: [
      '¿Vía oral disponible? → si no, priorizar vía SC o transdérmica solo si dolor estable.',
      '¿VFG <30 mL/min? → evitar morfina/codeína/tramadol; preferir alternativas sin metabolitos activos renales.',
      '¿Polifarmacia serotoninérgica? → evitar o vigilar estrechamente tramadol/tapentadol.',
      '¿QT prolongado, arritmia o hipokalemia/hipomagnesemia? → extremar precaución con metadona.',
      '¿Dolor inestable o crisis? → no iniciar fentanilo TD; requiere titulación con opioide de acción rápida.',
    ],
  },
  {
    id: 'opioides-evaluacion-basal',
    type: 'criteria',
    tab: 'Selección',
    color: 'purple',
    order: 22,
    title: 'Evaluación basal antes de iniciar o ajustar',
    items: [
      'Caracterizar localización, irradiación, calidad, mecanismo, intensidad EVA/ENV, patrón temporal y dolor irruptivo.',
      'Distinguir causa oncológica y no oncológica; revisar tratamientos activos.',
      'Evaluar función renal, hepática, respiratoria, SAHOS, demencia, estado nutricional y fragilidad.',
      'ECG basal si se planea metadona o dosis altas con riesgo de QT; revisar K+ y Mg2+.',
      'Revisar ISRS/IRSN, IMAO, triptanes, linezolid, benzodiacepinas, antipsicóticos, anticonvulsivantes e inhibidores/inductores CYP3A4/CYP2D6.',
      'Registrar tránsito intestinal basal, red de apoyo, riesgo de uso problemático y educación previa.',
    ],
  },
  {
    id: 'opioides-debiles-tramadol',
    type: 'criteria',
    tab: 'Opioides débiles',
    color: 'orange',
    order: 30,
    title: 'Tramadol',
    items: [
      'Indicación: dolor leve a moderado o dolor mixto con componente neuropático leve.',
      'Inicio: IR 25 mg c/8 h; titular a 50 mg c/6-8 h. Máximo habitual 400 mg/día; en >75 años, 300 mg/día.',
      'Metabolismo CYP2D6 y CYP3A4; eliminación renal del metabolito activo.',
      'VFG <30: reducir 50%, espaciar c/12 h o evitar.',
      'Child C: evitar. Adulto mayor: iniciar al 50% y vigilar sedación, caídas, delirium e hiponatremia.',
      'Interacciones: serotoninérgicos, inhibidores CYP2D6 y depresores del SNC.',
      'Riesgos: náuseas, mareo, somnolencia, convulsiones, hipoglucemia, SIADH y síndrome serotoninérgico.',
    ],
  },
  {
    id: 'opioides-debiles-codeina',
    type: 'criteria',
    tab: 'Opioides débiles',
    color: 'amber',
    order: 31,
    title: 'Codeína',
    items: [
      'Indicación: dolor leve a moderado; antitusivo en dosis menores.',
      'Titular hasta 60 mg c/4-6 h. Máximo usual cercano a 240 mg/día; en Chile el ISP permite hasta 360 mg/día.',
      'Profármaco dependiente de CYP2D6 para conversión a morfina; eficacia y toxicidad variables.',
      'Evitar o reducir fuertemente si VFG <30 mL/min.',
      'Precaución en insuficiencia hepática y combinaciones con paracetamol.',
      'Interacciones: inhibidores CYP2D6 disminuyen eficacia; sedantes aumentan depresión respiratoria.',
      'Evitar en menores de 12 años, lactancia y posamigdalectomía/adenoidectomía.',
    ],
  },
  {
    id: 'opioides-fuertes-morfina',
    type: 'criteria',
    tab: 'Opioides fuertes',
    color: 'blue',
    order: 40,
    title: 'Morfina',
    items: [
      'Opioide fuerte de referencia para dolor oncológico moderado a severo, dolor paliativo y disnea.',
      'Naïve: 2,5-5 mg VO IR c/4 h + rescate 10-15% c/1 h s/p; reevaluar a 24 h y ajustar 30-50% si necesario.',
      'Una vez estable, convertir a liberación prolongada.',
      'Relación VO:parenteral aproximada 2-3:1.',
      'VFG <30: riesgo de acumulación M3G/M6G, neurotoxicidad, sedación y mioclonías; preferir fentanilo, metadona o buprenorfina.',
      'Adulto mayor: iniciar al 50% o menos; vigilar estreñimiento, caídas y delirium.',
    ],
  },
  {
    id: 'opioides-fuertes-tapentadol',
    type: 'criteria',
    tab: 'Opioides fuertes',
    color: 'green',
    order: 41,
    title: 'Tapentadol',
    items: [
      'Útil en dolor moderado-severo con componente neuropático por acción dual agonista mu + inhibición de recaptación de noradrenalina.',
      'Naïve: LP 50 mg c/12 h o IR 50 mg c/4-6 h; dosis habitual 100-500 mg/día.',
      'Metabolismo por glucuronidación; menos interacciones CYP que tramadol.',
      'Evitar en Child C; en Child B iniciar bajo y espaciar.',
      'Precaución con serotoninérgicos y sedantes.',
      'Mejor perfil gastrointestinal que morfina/oxicodona en estudios, sin superioridad analgésica demostrada.',
    ],
  },
  {
    id: 'opioides-fuertes-metadona',
    type: 'alert',
    tab: 'Opioides fuertes',
    color: 'red',
    order: 42,
    title: 'Metadona: solo con experiencia',
    content:
      'Indicación en dolor moderado-severo, componente neuropático o rotación desde dosis altas. Farmacocinética no lineal, vida media larga y variable, riesgo de acumulación tardía y QT prolongado. Iniciar/rotar solo con experiencia. Naïve: 2,5-5 mg VO c/8-12 h o dosis menores en adulto mayor; ajustes no antes de 4-7 días. Solicitar ECG basal y control; corregir K+ y Mg2+. Suspender si QTc >500 ms o aumento >60 ms.',
  },
  {
    id: 'opioides-fuertes-parches',
    type: 'criteria',
    tab: 'Opioides fuertes',
    color: 'purple',
    order: 43,
    title: 'Buprenorfina y fentanilo transdérmicos',
    items: [
      'Buprenorfina: opción en dolor moderado-severo, insuficiencia renal, antecedente de trastorno por uso de opioides o necesidad de vía transdérmica estable.',
      'Buprenorfina naïve: parche 5 microg/h cada 7 días o 35 microg/h c/72-96 h según presentación; cambios con intervalos >=72 h.',
      'Buprenorfina es agonista parcial mu de alta afinidad: planificar rotación desde dosis altas para evitar abstinencia.',
      'Fentanilo TD: usar solo en dolor estable y paciente ya tolerante a opioides; no usar en opioide-naïve, dolor agudo o dolor inestable.',
      'Fentanilo TD: inicio analgésico 12-24 h y persistencia 12-24 h tras retirar; no cortar parches.',
      'Fiebre, calor local, caquexia y piel alterada modifican absorción del parche.',
    ],
  },
  {
    id: 'opioides-seguridad-poblaciones',
    type: 'criteria',
    tab: 'Seguridad',
    color: 'red',
    order: 50,
    title: 'Riesgos por población',
    items: [
      'Adulto mayor: iniciar al 50%, espaciar intervalo y revisar fármacos sedantes.',
      'VFG <30: evitar tramadol, codeína y morfina; preferir fentanilo, buprenorfina o metadona con experiencia.',
      'Insuficiencia hepática avanzada: reducir dosis/intervalo y vigilar encefalopatía.',
      'SAHOS o EPOC avanzada: titular lentamente y evitar benzodiacepinas.',
      'Convulsiones: evitar tramadol.',
      'QT prolongado: ECG basal/control, corregir electrolitos y evitar metadona si QTc >500 ms.',
      'Polifarmacia serotoninérgica: revisar ISRS/IRSN/IMAO/linezolid/triptanes y educar sobre síntomas de alarma.',
      'Antecedente de trastorno por uso de opioides: considerar buprenorfina y manejo multidisciplinario.',
    ],
  },
  {
    id: 'opioides-interacciones',
    type: 'criteria',
    tab: 'Seguridad',
    color: 'amber',
    order: 51,
    title: 'Interacciones críticas',
    items: [
      'Serotoninérgicos + tramadol/tapentadol: riesgo de síndrome serotoninérgico.',
      'Benzodiacepinas, gabapentinoides, antipsicóticos sedantes y alcohol: depresión respiratoria sumativa.',
      'Inhibidores CYP3A4: aumentan niveles de fentanilo, metadona, buprenorfina y oxicodona.',
      'Inductores CYP3A4: reducen niveles y pueden precipitar abstinencia o dolor.',
      'Inhibidores CYP2D6: reducen conversión de codeína y tramadol a metabolitos activos.',
      'Fármacos que prolongan QT + metadona: riesgo de torsades.',
      'Paracetamol crónico >=2 g/día + warfarina: monitorizar INR.',
    ],
  },
  {
    id: 'opioides-eventos-adversos',
    type: 'criteria',
    tab: 'Seguridad',
    color: 'orange',
    order: 52,
    title: 'Eventos adversos y manejo',
    items: [
      'Estreñimiento: profilaxis desde el primer día con laxante osmótico o estimulante; no desarrolla tolerancia.',
      'Náuseas/vómitos iniciales: metoclopramida o haloperidol a dosis baja por 3-7 días y reevaluar.',
      'Sedación: suele ceder en 3-5 días; revisar sedantes y reducir dosis si persiste.',
      'Mioclonías/neurotoxicidad: sospechar acumulación, hidratar, reducir dosis o rotar.',
      'Depresión respiratoria: suspender opioide, soporte y naloxona titulada 0,04-0,1 mg IV en bolos.',
      'No combinar dos agonistas mu en pauta basal regular; sí es válido opioide basal + rescate de acción rápida.',
    ],
  },
  {
    id: 'opioides-calculadora-rotacion',
    type: 'opioid_conversion_calculator',
    tab: 'Rotación',
    order: 60,
  },
  {
    id: 'opioides-rotacion-indicaciones',
    type: 'criteria',
    tab: 'Rotación',
    color: 'blue',
    order: 61,
    title: 'Indicaciones para rotar',
    items: [
      'Analgesia insuficiente pese a titulación adecuada.',
      'Toxicidad intolerable o persistente: sedación, mioclonías, alucinaciones, náuseas refractarias o prurito.',
      'Cambio de vía de administración por disfagia, pérdida de vía oral u oclusión.',
      'Deterioro renal o hepático significativo.',
      'Interacciones nuevas que comprometen el opioide en uso.',
      'Preferencia del paciente en decisión informada.',
    ],
  },
  {
    id: 'opioides-rotacion-proceso',
    type: 'flowchart',
    tab: 'Rotación',
    color: 'green',
    order: 62,
    title: 'Esquema operativo',
    details: [
      '━━━ ANTES DE CALCULAR ━━━',
      'Confirmar que el dolor responde a opioides.',
      '~Optimizar coadyuvantes y tratar causas reversibles.',
      'Calcular dosis diaria total actual.',
      '~Incluir basal + rescates efectivamente usados en 24 h.',
      '━━━ CONVERSIÓN ━━━',
      'Convertir a equivalente de morfina oral (EMO).',
      '~Documentar la relación usada.',
      'Convertir EMO a dosis equianalgésica del opioide destino.',
      'Reducir 25-50% por tolerancia cruzada incompleta.',
      '~Mayor reducción si toxicidad, fragilidad, adulto mayor, dosis alta o incertidumbre.',
      '━━━ PRESCRIPCIÓN Y CONTROL ━━━',
      'Repartir la nueva DDT según farmacocinética, vía e intervalo.',
      'Prescribir rescate 10-15% de la nueva DDT cada 1-2 h s/p.',
      'Reevaluar a 24-72 h → dolor, sedación, función intestinal y rescates.',
      'Documentar resultado y plan a 7 días.',
    ],
  },
  {
    id: 'opioides-equivalencias',
    type: 'criteria',
    tab: 'Rotación',
    color: 'purple',
    order: 63,
    title: 'Equivalencias orientativas a 30 mg de morfina oral/día',
    items: [
      'Morfina oral: 30 mg/día.',
      'Morfina SC/IV: 10-15 mg/día.',
      'Codeína oral: 200-240 mg/día.',
      'Tramadol oral: 150 mg/día.',
      'Oxicodona oral: 15-20 mg/día.',
      'Hidromorfona oral: 4-6 mg/día.',
      'Tapentadol oral: aprox. 100-150 mg/día.',
      'Fentanilo TD: aprox. 12 microg/h equivale a 30 mg EMO/día.',
      'Buprenorfina TD: aprox. 17,5-35 microg/h equivale a 30-60 mg EMO/día, no extrapolar linealmente.',
      'Metadona: conversión no lineal; siempre con equipo experto.',
    ],
  },
  {
    id: 'opioides-seguimiento',
    type: 'criteria',
    tab: 'Seguimiento',
    color: 'green',
    order: 70,
    title: 'Plan de seguimiento',
    items: [
      'Reevaluar 24-72 h tras inicio o ajuste: dolor, rescates, eventos adversos, función intestinal y conciencia.',
      'Documentar EVA basal y posterior; objetivo: reducción >=30-50% o EVA <=3 en reposo, consensuado con paciente.',
      'Control semanal en titulación; quincenal o mensual si estable.',
      'Coordinar con atención primaria y red territorial de cuidados paliativos.',
      'Metadona: ECG y electrolitos según protocolo.',
      'Fentanilo/buprenorfina TD: revisar sitio de aplicación e instrucciones de uso.',
    ],
  },
  {
    id: 'opioides-educacion',
    type: 'criteria',
    tab: 'Seguimiento',
    color: 'amber',
    order: 71,
    title: 'Educación al paciente y familia',
    items: [
      'Explicar que el uso bien indicado no significa necesariamente fase terminal ni induce adicción cuando se usa para dolor.',
      'Diferenciar dolor basal y dolor irruptivo; enseñar uso de rescates.',
      'Consultar por somnolencia excesiva, confusión, frecuencia respiratoria baja, dolor incontrolable, vómitos persistentes o ausencia de deposiciones >3 días.',
      'Prevenir estreñimiento desde el primer día.',
      'Entregar instrucciones escritas de dosis basal, rescate, horarios y contacto.',
      'No combinar con alcohol ni sedantes no prescritos; precaución al conducir al inicio.',
      'Almacenar en lugar seguro, no compartir y devolver sobrantes a farmacia.',
    ],
  },
  {
    id: 'opioides-checklist',
    type: 'criteria',
    tab: 'Seguimiento',
    color: 'blue',
    order: 72,
    title: 'Checklist breve antes de prescribir o rotar',
    items: [
      'Dolor caracterizado y EVA basal documentada.',
      'Función renal/hepática reciente revisada.',
      'Interacciones, sedantes y serotoninérgicos revisados.',
      'Rescate indicado con intervalo mínimo definido.',
      'Profilaxis de estreñimiento iniciada.',
      'Plan de control a 24-72 h definido.',
      'Si parche: confirmado dolor estable y, para fentanilo, tolerancia previa a opioides.',
      'Si metadona: ECG/electrolitos y validación por equipo con experiencia.',
    ],
  },
];

const topicPayload = {
  name: TOPIC_NAME,
  category_id: CATEGORY_ID,
  subcategory: 'Cuidados Paliativos',
  status: 'published',
  title: TOPIC_NAME,
  description:
    'Protocolo clínico de selección, uso seguro, titulación, eventos adversos, seguimiento y rotación de opioides en cuidados paliativos.',
  tags: ['Cuidados Paliativos', 'Opioides', 'Dolor', 'Rotación de opioides', 'Morfina', 'Metadona', 'Protocolo SSÑ'],
  order: 45,
  authors: ['Dra. Ximena Pucheu Moris'],
  published_date: new Date().toISOString(),
  last_updated: new Date().toISOString(),
  layout_mode: 'protocol',
  tipo_contenido: ['contenido_medico'],
  has_local_protocol: true,
  content_blocks,
  related_topics: ['Manejo Farmacológico del Dolor Oncológico', 'Vía Subcutánea en Cuidados Paliativos', 'Sedación Paliativa'],
  related_tools: [
    { tool_id: 'opioid-conversion', label: 'Equivalencia y rotación de opioides' },
  ],
  clinical_summary:
    'Manejo seguro de opioides débiles y fuertes en pacientes adultos con dolor oncológico o cuidados paliativos, incluyendo selección por escenario clínico, evaluación basal, eventos adversos, interacciones y rotación.',
  diagnostic_orientation:
    'Antes de iniciar o ajustar: caracterizar mecanismo e intensidad del dolor, función renal/hepática, riesgo respiratorio, ECG si metadona o alto riesgo de QT, polifarmacia, tránsito intestinal y red de apoyo.',
  complementary_studies:
    'Creatinina/VFG, perfil hepático según contexto, electrolitos K+ y Mg2+ si riesgo de QT/metadona, ECG basal y control cuando corresponda.',
  initial_treatment:
    'EVA 1-3: optimizar no opioides y coadyuvantes. EVA 4-6: opioide débil o morfina oral baja según fragilidad. EVA >=7 o crisis: iniciar opioide fuerte con titulación y rescate.',
  protocol_code: 'Protocolo SSÑ',
  protocol_edition: 'Versión 1.0',
  protocol_date: '2026-05-31',
  protocol_validity: 'Mayo 2028',
  protocol_authors: ['Dra. Ximena Pucheu Moris'],
  protocol_objective:
    'Estandarizar indicación, ajuste, monitoreo y rotación de opioides débiles y fuertes en cuidados paliativos.',
  protocol_participants: ['Médicos/as', 'Residentes', 'Equipo de enfermería en cuidados paliativos'],
  protocol_flowchart: [],
  protocol_algorithm: [],
  protocol_medications: [],
};

async function uploadPdf() {
  const bytes = await readFile(PDF_PATH);
  const { error } = await supabase.storage.from('files').upload(STORAGE_PATH, bytes, {
    contentType: 'application/pdf',
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from('files').getPublicUrl(STORAGE_PATH);
  return data.publicUrl;
}

async function main() {
  const { data: existing, error: findError } = await supabase
    .from('topics')
    .select('id,name,protocol_file_url')
    .eq('category_id', CATEGORY_ID)
    .eq('name', TOPIC_NAME)
    .maybeSingle();

  if (findError) throw findError;

  const protocol_file_url = await uploadPdf();
  const payload = { ...topicPayload, protocol_file_url };

  if (!APPLY) {
    console.log(JSON.stringify({ mode: 'dry-run', existing, payload }, null, 2));
    return;
  }

  if (existing?.id) {
    const { data, error } = await supabase
      .from('topics')
      .update(payload)
      .eq('id', existing.id)
      .select('id,name,protocol_file_url')
      .single();
    if (error) throw error;
    console.log(JSON.stringify({ action: 'updated', topic: data }, null, 2));
    return;
  }

  const { data, error } = await supabase
    .from('topics')
    .insert(payload)
    .select('id,name,protocol_file_url')
    .single();
  if (error) throw error;
  console.log(JSON.stringify({ action: 'inserted', topic: data }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
