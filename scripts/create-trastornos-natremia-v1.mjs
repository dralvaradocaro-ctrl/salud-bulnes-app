/**
 * Crea/actualiza el topic "Trastornos de la natremia" (Hiponatremia e
 * Hipernatremia) en la misma categoría/subcategoría que "Trastornos del potasio".
 * Estructura espejo del potasio: 2 pestañas, subpestañas, calculadoras embebidas,
 * algoritmos, arsenal local HCSFB, recetas e indicaciones con tiempos y máximos.
 *
 * Fuentes: AAFP. Sodium Disorders: Hyponatremia and Hypernatremia (2023);
 * Spasovski G. et al. Hyponatraemia guideline (2014); Adrogué & Madias (NEJM 2000).
 *
 * Uso: node scripts/create-trastornos-natremia-v1.mjs [--apply]
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh',
);

const CATEGORY_ID = '696ea6ff245ef362de4f431d'; // misma que Trastornos del potasio
const SUBCATEGORY = 'Nefrología y Electrolitos';
const TOPIC_NAME = 'Trastornos de la natremia';

const references = [
  'AAFP. Sodium Disorders: Hyponatremia and Hypernatremia. American Family Physician. 2023.',
  'Spasovski G, et al. Clinical practice guideline on diagnosis and treatment of hyponatraemia. Nephrol Dial Transplant. 2014.',
  'Adrogué HJ, Madias NE. Hyponatremia / Hypernatremia. N Engl J Med. 2000.',
  'UpToDate / StatPearls. Hyponatremia; Hypernatremia; Osmotic Demyelination Syndrome.',
];

const blocks = [
  {
    id: 'na-advertencia',
    type: 'alert',
    color: 'amber',
    order: 0,
    title: 'Advertencia clínica',
    content:
      'Tema y calculadoras de apoyo. La indicación final depende del estado de volumen, osmolalidad, síntomas, velocidad de instalación, causa y controles seriados de Na. Lo más peligroso no suele ser la cifra, sino corregir DEMASIADO RÁPIDO: en hiponatremia, riesgo de síndrome de desmielinización osmótica (mielinolisis); en hipernatremia, riesgo de edema cerebral. Respetar los máximos de corrección en 24 h.',
    layout_position: 'main',
  },

  // ─────────────────────────── HIPONATREMIA ───────────────────────────
  {
    id: 'na-hipo-resumen', tab: 'Hiponatremia', subtab: 'Diagnóstico', type: 'text', color: 'blue', order: 10,
    title: 'Hiponatremia — enfoque inicial',
    content:
      'Hiponatremia es Na <135 mEq/L. Confirmar que es hipotónica: medir osmolalidad plasmática (descartar pseudohiponatremia por hiperlipidemia/paraproteínas e hiponatremia hipertónica por hiperglicemia/manitol). Corrección por glicemia: sumar ~2,4 mEq/L al Na por cada 100 mg/dL de glucosa sobre 100. Luego clasificar por gravedad, velocidad de instalación (aguda <48 h vs crónica) y estado de volumen.',
  },
  {
    id: 'na-hipo-clasif', tab: 'Hiponatremia', subtab: 'Diagnóstico', type: 'criteria', color: 'blue', order: 11,
    title: 'Clasificación y riesgo',
    items: [
      'Leve: Na 130-134. Moderada: Na 125-129. Grave: Na <125 mEq/L.',
      'Síntomas graves (emergencia): convulsiones, compromiso de conciencia/coma, vómitos, distrés respiratorio. → rescate con NaCl 3%.',
      'Aguda (<48 h documentada): predomina el riesgo de edema cerebral; tolera corrección algo más rápida.',
      'Crónica o de duración desconocida: predomina el riesgo de mielinolisis si se corrige rápido. Tratar como crónica si hay duda.',
      'Alto riesgo de mielinolisis: Na <120, alcoholismo, desnutrición, hipokalemia, hepatopatía, mujer premenopáusica.',
    ],
  },
  {
    id: 'na-hipo-eval', tab: 'Hiponatremia', subtab: 'Diagnóstico', type: 'criteria', color: 'purple', order: 12,
    title: 'Evaluación: volemia y laboratorio',
    items: [
      'Osmolalidad plasmática: hipotónica (<275) confirma hiponatremia verdadera.',
      'Estado de volumen (clave para el tratamiento): hipovolémica, euvolémica o hipervolémica.',
      'Na urinario y osmolalidad urinaria: Na urinario <20 sugiere pérdidas extrarrenales/hipovolemia; >30 con euvolemia orienta a SIADH.',
      'SIADH (euvolémica): osm urinaria >100, Na urinario >30, euvolemia clínica, función tiroidea/suprarrenal normal.',
      'Hipervolémica: insuficiencia cardiaca, cirrosis, síndrome nefrótico, ERC.',
    ],
  },
  { id: 'na-hipo-calc', tab: 'Hiponatremia', subtab: 'Calculadora', type: 'hyponatremia_correction_calculator', order: 20 },
  {
    id: 'na-hipo-algoritmo', tab: 'Hiponatremia', subtab: 'Manejo', type: 'algorithm', color: 'blue', order: 30,
    title: 'Algoritmo de manejo (receta para la ficha)',
    description: 'Elegir según síntomas y estado de volumen. Respetar SIEMPRE el máximo de corrección de 24 h.',
    details: [
      'Síntomas graves (convulsión/coma/vómitos) → RESCATE con NaCl 3%.',
      '~Indicación: NaCl 3% 100-150 mL EV a pasar en 10-20 min. Repetible hasta 3 veces hasta que cedan los síntomas. Meta del rescate: subir Na 4-6 mEq/L (no más). Control de Na cada 1-2 h.',
      'Hipovolémica (sin síntomas graves) → SF 0,9% EV y tratar la causa.',
      '~Vigilar autocorrección rápida: al reponer volumen se frena la ADH y el Na puede subir solo; controlar Na cada 2-4 h.',
      'Euvolémica / SIADH → restricción hídrica (p. ej. 800-1000 mL/día); tratar la causa. NaCl 0,9% puede empeorar el SIADH si la osm urinaria es alta.',
      'Hipervolémica (IC, cirrosis, ERC) → restricción hídrica + tratar causa ± furosemida. No usar SF.',
      '━━━ MÁXIMOS DE CORRECCIÓN (evitar mielinolisis) ━━━',
      'No subir el Na más de 8 mEq/L en 24 h (≤6 si alto riesgo) ni más de 18 mEq/L en 48 h.',
      'Si hay riesgo de sobrecorrección (hipovolemia que se corrige, SIADH transitorio, post-desmopresina): considerar DDAVP «clamp» y/o aporte de agua libre (SG 5%) para frenar el ascenso.',
      'Medir y corregir el potasio: reponer K también sube el Na y suma al límite de corrección.',
    ],
  },
  {
    id: 'na-hipo-arsenal', tab: 'Hiponatremia', subtab: 'Arsenal', type: 'table', color: 'blue', order: 40,
    title: 'Arsenal local y preparación — Hiponatremia',
    headers: ['Recurso', 'Detalle', 'Uso práctico', 'Precaución'],
    rows: [
      ['NaCl 3% (hipertónico)', 'No premezclado en arsenal; NaCl 3% ≈ 513 mEq/L', 'Rescate sintomático: 100-150 mL en 10-20 min, repetible ×3. Solicitar preparación a farmacia.', 'Confirmar concentración preparada. Vía segura. No exceder el ascenso de 4-6 mEq/L en el rescate.'],
      ['Cloruro de sodio 10%', 'Ampolla concentrada (insumo para preparar el 3%)', 'Base para preparar NaCl 3% junto con SF 0,9%.', 'Nunca administrar NaCl 10% sin diluir.'],
      ['Suero fisiológico 0,9%', '154 mEq/L de Na', 'Hiponatremia hipovolémica; diluyente.', 'Puede empeorar el SIADH si la osmolalidad urinaria es alta.'],
      ['Suero glucosado 5%', 'Aporta agua libre', 'Frenar la sobrecorrección (junto con DDAVP) si el Na sube demasiado rápido.', 'Vigilar glicemia.'],
      ['Furosemida', '20 mg/mL', 'Hiponatremia hipervolémica con sobrecarga.', 'Ajustar a diuresis/volemia.'],
    ],
  },
  {
    id: 'na-hipo-causas', tab: 'Hiponatremia', subtab: 'Arsenal', type: 'criteria', color: 'amber', order: 45,
    title: 'Causas a buscar',
    items: [
      'Hipovolémica: vómitos/diarrea, diuréticos (tiazidas), tercer espacio, pérdidas renales.',
      'Euvolémica: SIADH (dolor, náuseas, fármacos, pulmón, SNC, tumores), hipotiroidismo, insuficiencia suprarrenal, polidipsia, potomanía/«té y tostadas».',
      'Hipervolémica: insuficiencia cardiaca, cirrosis, síndrome nefrótico, ERC.',
      'Fármacos: tiazidas, ISRS, carbamazepina, antipsicóticos, desmopresina.',
    ],
  },
  {
    id: 'na-hipo-flow', tab: 'Hiponatremia', subtab: 'Flujo', type: 'mermaid', color: 'blue', order: 50,
    title: 'Flowchart — Hiponatremia',
    content: `flowchart TD
    A["Na menor 135 mEq/L"] --> B["Confirmar hipotónica\\nosmolalidad + corregir por glicemia"]
    B --> C{"Síntomas graves?\\nconvulsion/coma/vomitos"}
    C -->|"Sí"| D["RESCATE: NaCl 3%\\n100-150 mL en 10-20 min\\nrepetir hasta 3 veces"]
    D --> E["Meta: subir Na 4-6 mEq/L\\ncontrol Na cada 1-2 h"]
    C -->|"No"| F{"Estado de volumen"}
    F -->|"Hipovolemia"| G["SF 0,9% + tratar causa\\nojo autocorreccion"]
    F -->|"Euvolemia / SIADH"| H["Restriccion hidrica\\ntratar causa"]
    F -->|"Hipervolemia"| I["Restriccion hidrica\\n+ tratar causa +/- furosemida"]
    G --> J["Limite: no subir Na mas de 8 mEq/L en 24 h\\n(6 si alto riesgo)"]
    H --> J
    I --> J
    E --> J
    J --> K["Si sube muy rapido:\\nSG 5% +/- DDAVP clamp\\ncontrol Na seriado"]`,
  },

  // ─────────────────────────── HIPERNATREMIA ───────────────────────────
  {
    id: 'na-hiper-resumen', tab: 'Hipernatremia', subtab: 'Diagnóstico', type: 'text', color: 'orange', order: 100,
    title: 'Hipernatremia — enfoque inicial',
    content:
      'Hipernatremia es Na >145 mEq/L. Casi siempre refleja déficit de agua libre (pérdida de agua > pérdida de sodio o aporte insuficiente de agua), habitualmente en pacientes que no acceden libremente al agua (ancianos, postrados, lactantes, sedados). Evaluar estado de volumen, causa y pérdidas en curso; estimar el déficit de agua libre y reponer de forma controlada.',
  },
  {
    id: 'na-hiper-clasif', tab: 'Hipernatremia', subtab: 'Diagnóstico', type: 'criteria', color: 'orange', order: 101,
    title: 'Clasificación y evaluación',
    items: [
      'Leve: Na 146-150. Moderada: 151-160. Grave: >160 mEq/L.',
      'Aguda (<48 h) vs crónica/desconocida: la crónica exige descenso lento del Na.',
      'Estado de volumen: hipovolémica (pérdidas hipotónicas: GI, sudor, diuréticos, diuresis osmótica), euvolémica (pérdidas insensibles, diabetes insípida) o hipervolémica (aporte de sodio, rara).',
      'Diabetes insípida: poliuria con orina diluida; central (responde a desmopresina) o nefrogénica.',
    ],
  },
  { id: 'na-hiper-calc', tab: 'Hipernatremia', subtab: 'Calculadora', type: 'hypernatremia_correction_calculator', order: 110 },
  {
    id: 'na-hiper-algoritmo', tab: 'Hipernatremia', subtab: 'Manejo', type: 'algorithm', color: 'orange', order: 120,
    title: 'Algoritmo de manejo (receta para la ficha)',
    description: 'Reponer el déficit de agua libre de forma controlada. Respetar el máximo de descenso de 24 h.',
    details: [
      'Si hay hipovolemia/inestabilidad → primero estabilizar con SF 0,9% hasta recuperar perfusión.',
      'Reponer el déficit de agua libre (ver calculadora):',
      '~Vía preferente: agua libre VO o por SNG si el tubo digestivo funciona.',
      '~Si EV: suero glucosado 5% (aporta agua libre); NaCl 0,45% si además hay déficit de Na/volumen.',
      '~Sumar la mantención y las pérdidas en curso al volumen calculado.',
      'Diabetes insípida central → desmopresina (si disponible/coordinar); nefrogénica → tratar causa y aporte de agua.',
      '━━━ MÁXIMO DE CORRECCIÓN (evitar edema cerebral) ━━━',
      'No bajar el Na más de 10 mEq/L en 24 h (≈0,5 mEq/L/h) en hipernatremia crónica o de duración desconocida. Aguda documentada: puede ser más rápido (hasta ~1 mEq/L/h).',
      'Control de Na cada 4-6 h y ajustar la velocidad según el resultado.',
    ],
  },
  {
    id: 'na-hiper-arsenal', tab: 'Hipernatremia', subtab: 'Arsenal', type: 'table', color: 'orange', order: 130,
    title: 'Arsenal local — Hipernatremia',
    headers: ['Recurso', 'Detalle', 'Uso práctico', 'Precaución'],
    rows: [
      ['Agua libre VO / SNG', 'Vía preferente si digestivo útil', 'Repartir el déficit estimado en el día.', 'Riesgo de aspiración si compromiso de conciencia.'],
      ['Suero glucosado 5%', 'Aporta agua libre por vía EV', 'Reponer déficit de agua libre titulado por controles de Na.', 'Vigilar glicemia; no bajar Na más rápido que el límite.'],
      ['NaCl 0,45% (medio fisiológico)', 'No premezclado: preparar SF 0,9% + agua/SG según farmacia', 'Si hay déficit de Na/volumen junto con el de agua.', 'Confirmar preparación con farmacia.'],
      ['Suero fisiológico 0,9%', '154 mEq/L de Na', 'Solo para estabilizar la hipovolemia inicial.', 'No corrige el agua libre; no usar como reposición principal.'],
      ['Desmopresina', 'Según disponibilidad', 'Diabetes insípida central.', 'Si no está en arsenal, coordinar/derivar.'],
    ],
  },
  {
    id: 'na-hiper-flow', tab: 'Hipernatremia', subtab: 'Flujo', type: 'mermaid', color: 'orange', order: 140,
    title: 'Flowchart — Hipernatremia',
    content: `flowchart TD
    A["Na mayor 145 mEq/L"] --> B{"Hipovolemia\\no inestabilidad?"}
    B -->|"Sí"| C["Estabilizar con SF 0,9%\\nhasta recuperar perfusion"]
    B -->|"No"| D["Estimar deficit de agua libre\\nver calculadora"]
    C --> D
    D --> E{"Tubo digestivo util?"}
    E -->|"Sí"| F["Agua libre VO / SNG"]
    E -->|"No"| G["SG 5% EV\\n(+/- NaCl 0,45% si deficit de Na)"]
    F --> H["Sumar mantencion + perdidas\\ntratar la causa (DI, diureticos, etc.)"]
    G --> H
    H --> I["Limite: no bajar Na mas de 10 mEq/L en 24 h\\ncontrol Na cada 4-6 h"]`,
  },
  {
    id: 'na-referencias', tab: 'Hipernatremia', subtab: 'Arsenal', type: 'text', color: 'gray', order: 190,
    title: 'Referencias principales',
    content: references.map((r) => `- ${r}`).join('\n'),
  },
];

const payload = {
  name: TOPIC_NAME,
  category_id: CATEGORY_ID,
  subcategory: SUBCATEGORY,
  status: 'published',
  title: TOPIC_NAME,
  description:
    'Manejo de hiponatremia e hipernatremia en hospitalizados: clasificación, evaluación por volemia/osmolalidad, calculadoras, algoritmos con recetas, arsenal local y máximos de corrección para evitar mielinolisis/edema cerebral.',
  tags: ['sodio', 'natremia', 'hiponatremia', 'hipernatremia', 'electrolitos', 'nefrología', 'hospitalizados', 'calculadora'],
  order: 60,
  authors: ['Equipo clínico HCSFB'],
  published_date: new Date().toISOString(),
  last_updated: new Date().toISOString(),
  layout_mode: 'protocol',
  tipo_contenido: ['contenido_medico'],
  clasificacion_ges: null,
  has_local_protocol: false,
  content_blocks: blocks,
  related_topics: [],
  related_tools: [
    { tool_id: 'hyponatremia-correction', label: 'Hiponatremia — corrección (NaCl 3%, límite 24 h)' },
    { tool_id: 'hypernatremia-correction', label: 'Hipernatremia — déficit de agua libre' },
  ],
  clinical_summary:
    'Trastornos de la natremia: hiponatremia (clasificar por gravedad, volemia y cronicidad; rescate con NaCl 3% si síntomas graves; máximo +8 mEq/L/24 h) e hipernatremia (déficit de agua libre; reponer con agua/SG 5%; máximo descenso 10 mEq/L/24 h).',
  diagnostic_orientation:
    'Hiponatremia: confirmar hipotónica (osmolalidad), corregir por glicemia, clasificar por volemia (Na/osm urinaria), gravedad y cronicidad. Hipernatremia: estimar déficit de agua libre, evaluar volemia, causa (DI, pérdidas, aporte) y cronicidad.',
  complementary_studies:
    'Na seriado, osmolalidad plasmática y urinaria, Na urinario, glicemia, función renal, función tiroidea/suprarrenal según sospecha; diuresis y balance.',
  initial_treatment:
    'Hiponatremia sintomática grave: NaCl 3% 100-150 mL EV en 10-20 min (repetible ×3, subir 4-6 mEq/L). Según volemia: SF, restricción hídrica o furosemida. Hipernatremia: reponer agua libre VO/SNG o SG 5% EV; estabilizar con SF si hipovolemia. Respetar máximos de corrección.',
  protocol_objective:
    'Estandarizar el enfoque y la corrección segura de la natremia en hospitalizados del HCSFB, con énfasis en los máximos de corrección para evitar mielinolisis y edema cerebral.',
};

async function main() {
  const { data: existing } = await supabase
    .from('topics').select('id,name').eq('category_id', CATEGORY_ID).eq('name', TOPIC_NAME).limit(1);
  const found = existing?.[0] || null;

  const tabs = [...new Set(blocks.map((b) => b.subtab ? `${b.tab} › ${b.subtab}` : b.tab).filter(Boolean))];
  if (!APPLY) {
    console.log(JSON.stringify({ mode: 'dry-run', exists: found, blocks: blocks.length, tabs }, null, 2));
    console.log('\nDry-run. Ejecuta con --apply para escribir.');
    return;
  }

  if (found?.id) {
    const { data, error } = await supabase.from('topics').update(payload).eq('id', found.id).select('id,name').single();
    if (error) throw error;
    console.log(JSON.stringify({ action: 'updated', topic: data }, null, 2));
    return;
  }
  const { data, error } = await supabase.from('topics').insert(payload).select('id,name').single();
  if (error) throw error;
  console.log(JSON.stringify({ action: 'inserted', topic: data }, null, 2));
}

main().catch((e) => { console.error(e); process.exit(1); });
