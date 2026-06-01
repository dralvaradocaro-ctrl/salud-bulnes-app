/**
 * Reestructura "Trastornos del potasio" con dos pestañas mayores:
 * Hipokalemia e Hiperkalemia, subpestañas, calculadoras, algoritmos y
 * arsenal local HCSFB.
 *
 * Uso:
 *   node --env-file=.env scripts/update-trastornos-potasio-v1.mjs
 *   node --env-file=.env scripts/update-trastornos-potasio-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');
const TOPIC_ID = 'ffbdfb89-2e6d-429c-be7a-dc6b0dda8504';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

const references = [
  'AAFP. Potassium Disorders: Hypokalemia and Hyperkalemia. American Family Physician. 2023.',
  'UK Kidney Association. Treatment of Acute Hyperkalaemia in Adults. Clinical Practice Guideline. 2023.',
  'European Resuscitation Council Guidelines 2021: cardiac arrest in special circumstances.',
  'Merck Manual Professional. Hypokalemia and Hyperkalemia.',
  'StatPearls. Potassium Chloride; Hypokalemia; Hyperkalemia.',
];

const blocks = [
  {
    id: 'kb-advertencia',
    type: 'alert',
    color: 'amber',
    order: 0,
    title: 'Advertencia clínica',
    content:
      'Este tema y sus calculadoras son solo apoyo clínico. La indicación final depende de ECG, síntomas, función renal, diuresis, pH, glicemia, magnesio, velocidad de instalación, controles seriados y disponibilidad local. En hiperkalemia con ECG alterado o hipokalemia con arritmia/debilidad severa, no esperar una calculadora para tratar.',
    layout_position: 'main',
  },

  // ───────────────────────── HIPOKALEMIA ─────────────────────────
  {
    id: 'kb-hipo-resumen',
    tab: 'kb_hipo',
    subtab: 'kb_hipo_diagnostico',
    type: 'text',
    color: 'blue',
    order: 10,
    title: 'Hipokalemia — enfoque inicial',
    content:
      'Hipokalemia es K <3,5 mEq/L. El riesgo depende de magnitud, velocidad de caída, cardiopatía, digoxina, QT largo, hipomagnesemia y síntomas neuromusculares. En hospitalizados, siempre pensar en pérdidas activas, redistribución por insulina/alcalosis y déficit de magnesio.',
  },
  {
    id: 'kb-hipo-severidad',
    tab: 'kb_hipo',
    subtab: 'kb_hipo_diagnostico',
    type: 'criteria',
    color: 'blue',
    order: 11,
    title: 'Clasificación y riesgo',
    items: [
      'Leve: K 3,0-3,4 mEq/L, usualmente asintomática. Preferir vía oral y corregir causa.',
      'Moderada: K 2,5-2,9 mEq/L. Evaluar síntomas, ECG, Mg, pérdidas activas y necesidad de vía EV.',
      'Grave: K <2,5 mEq/L, cambios ECG, arritmia, debilidad marcada, parálisis, íleo, rabdomiólisis o cardiopatía/digoxina: manejo urgente.',
      'ECG: T aplanada, depresión ST, onda U, QT/QU prolongado, extrasístoles, taquiarritmias ventriculares.',
      'Hipomagnesemia vuelve refractaria la reposición de K y aumenta riesgo de arritmia.',
    ],
  },
  {
    id: 'kb-hipo-correcciones',
    tab: 'kb_hipo',
    subtab: 'kb_hipo_diagnostico',
    type: 'criteria',
    color: 'purple',
    order: 12,
    title: 'Interpretación con pH y glicemia',
    items: [
      'Corrección por pH aproximada: K a pH 7,40 ≈ K medido - 0,6 x ((7,40 - pH)/0,1). Es una regla práctica, no exacta.',
      'Alcalosis baja K sérico por shift intracelular: puede existir déficit importante aunque el número parezca solo moderado.',
      'Acidosis sube K sérico por shift: al corregir pH, el K puede caer.',
      'Hiperglicemia/insulinopenia puede ocultar déficit corporal de K; al iniciar insulina, el K puede bajar rápido.',
      'Evitar diluir KCl en soluciones glucosadas para reposición de hipokalemia salvo indicación específica: la insulina endógena puede empeorar el shift intracelular.',
    ],
  },
  {
    id: 'kb-hipo-calc',
    tab: 'kb_hipo',
    subtab: 'kb_hipo_calculadora',
    type: 'hypokalemia_correction_calculator',
    order: 20,
  },
  {
    id: 'kb-hipo-reposicion',
    tab: 'kb_hipo',
    subtab: 'kb_hipo_reposicion',
    type: 'algorithm',
    color: 'blue',
    order: 30,
    title: 'Algoritmo de reposición',
    description: 'Elegir vía y velocidad según gravedad, síntomas, ECG, tolerancia oral y función renal.',
    details: [
      'K 3,0-3,4 sin síntomas graves → KCl VO + corregir causa + control 6-24 h.',
      '~KCl 600 mg = 8 mEq. Usar dosis fraccionadas según déficit y tolerancia.',
      'K 2,5-2,9 o intolerancia VO → KCl VO/EV periférico según contexto.',
      '~EV periférica habitual: 20-40 mEq/L, velocidad 10 mEq/h.',
      'K <2,5, ECG alterado o síntomas graves → KCl EV monitorizado.',
      '~Considerar vía central o dos vías periféricas si se requiere mayor velocidad; monitor ECG.',
      'Siempre medir y corregir Mg si bajo o sospechado.',
      'Recontrol K a las 2-4 h si EV/urgente; 6-24 h si VO estable.',
    ],
  },
  {
    id: 'kb-hipo-urgente',
    tab: 'kb_hipo',
    subtab: 'kb_hipo_urgente',
    type: 'criteria',
    color: 'red',
    order: 40,
    title: 'Manejo urgente de hipokalemia',
    items: [
      'Monitor cardíaco, vía venosa segura y ECG seriado.',
      'KCl EV en suero fisiológico. No bolo directo. No usar glucosado como diluyente de rutina.',
      'Velocidad periférica habitual hasta 10 mEq/h. Si se requiere 20 mEq/h, usar monitorización estricta y vía adecuada.',
      'Evitar sobrecorrección si VFG baja, oliguria o cese de pérdidas.',
      'Si hay arritmia, parálisis o compromiso respiratorio: escalar nivel de cuidado/traslado.',
    ],
  },
  {
    id: 'kb-hipo-arsenal',
    tab: 'kb_hipo',
    subtab: 'kb_hipo_arsenal',
    type: 'table',
    color: 'blue',
    order: 50,
    title: 'Arsenal local y equivalencias — Hipokalemia',
    headers: ['Fármaco local', 'Equivalencia', 'Uso práctico', 'Precaución'],
    rows: [
      ['KCl comprimido 600 mg', '8 mEq por comprimido', 'Reposición VO leve/moderada. Ej: 4 comp = 32 mEq/día fraccionados.', 'Irritación GI; evitar si íleo, vómitos o riesgo de aspiración.'],
      ['KCl solución inyectable 10%', 'Ampolla 10 mL ≈ 13,4 mEq', '20 mEq ≈ 1,5 amp; 40 mEq ≈ 3 amp. Diluir siempre.', 'Alto riesgo. Confirmar volumen/concentración local antes de preparar.'],
      ['Sulfato de magnesio', 'Si está disponible según arsenal vigente', 'Corregir si Mg bajo o hipokalemia refractaria.', 'Sin Mg, la reposición de K puede fallar.'],
      ['NaCl 0,9%', 'Diluyente preferido para KCl EV', 'Evita estimular insulina por glucosa.', 'Ajustar volumen si IC/ERC.'],
    ],
  },
  {
    id: 'kb-hipo-causas',
    tab: 'kb_hipo',
    subtab: 'kb_hipo_arsenal',
    type: 'criteria',
    color: 'amber',
    order: 55,
    title: 'Causas a buscar',
    items: [
      'Pérdidas GI: diarrea, fístulas, ileostomía, vómitos/SNG.',
      'Pérdidas renales: diuréticos, hiperaldosteronismo, tubulopatías, acidosis tubular renal.',
      'Redistribución: insulina, beta-agonistas, alcalosis, tirotoxicosis, parálisis periódica.',
      'Baja ingesta rara vez explica hipokalemia aislada severa sin pérdidas o redistribución.',
    ],
  },
  {
    id: 'kb-hipo-flow',
    tab: 'kb_hipo',
    subtab: 'kb_hipo_flujo',
    type: 'mermaid',
    color: 'blue',
    order: 60,
    title: 'Flowchart — Hipokalemia',
    content: `flowchart TD
    A["K menor 3,5 mEq/L"] --> B{"¿K menor 2,5\\no ECG/síntomas?"}
    B -->|"Sí"| C["Urgente\\nMonitor ECG + KCl EV"]
    C --> D["Corregir Mg\\ncontrol K 2-4 h"]
    B -->|"No"| E{"¿K 2,5-2,9\\no intolerancia VO?"}
    E -->|"Sí"| F["KCl VO o EV periférico\\nsegún tolerancia/contexto"]
    E -->|"No"| G["KCl VO preferente\\ncorregir causa"]
    F --> H["Buscar pérdidas\\nGI, renal, diuréticos"]
    G --> H
    H --> I{"¿pH/glicemia alteran interpretación?"}
    I -->|"Alcalosis o insulina"| J["Puede caer más\\nmonitorizar"]
    I -->|"Acidosis/hiperglicemia"| K["Déficit corporal puede estar oculto\\nprecaución con insulina"]
    J --> L["Recontrol y ajustar"]
    K --> L
    D --> L`,
  },

  // ───────────────────────── HIPERKALEMIA ─────────────────────────
  {
    id: 'kb-hiper-resumen',
    tab: 'kb_hiper',
    subtab: 'kb_hiper_diagnostico',
    type: 'text',
    color: 'red',
    order: 100,
    title: 'Hiperkalemia — enfoque inicial',
    content:
      'Hiperkalemia es K >5,0-5,5 mEq/L según laboratorio. La urgencia la define el ECG, síntomas, velocidad de instalación, K >=6,0-6,5, VFG/diuresis y causa. El tratamiento debe seguir una secuencia: confirmar/monitorizar, proteger miocardio, desplazar K, eliminar K y recontrolar.',
  },
  {
    id: 'kb-hiper-severidad',
    tab: 'kb_hiper',
    subtab: 'kb_hiper_diagnostico',
    type: 'criteria',
    color: 'red',
    order: 101,
    title: 'Clasificación y gatillos de urgencia',
    items: [
      'Leve: K 5,1-5,9 sin ECG ni síntomas. Confirmar, retirar gatillantes, dieta baja en K y control.',
      'Moderada: K 6,0-6,4. ECG obligatorio y tratamiento activo según contexto.',
      'Grave: K >=6,5, ECG alterado, debilidad/parálisis, arritmia, paro/periparo o anuria: emergencia.',
      'Descartar pseudohiperkalemia: hemólisis, torniquete prolongado, trombocitosis/leucocitosis extrema.',
      'ECG: T picudas, PR prolongado, QRS ancho, bradicardia, patrón sinusoidal, TV/FV/asistolia.',
    ],
  },
  {
    id: 'kb-hiper-correcciones',
    tab: 'kb_hiper',
    subtab: 'kb_hiper_diagnostico',
    type: 'criteria',
    color: 'purple',
    order: 102,
    title: 'pH, glicemia y redistribución',
    items: [
      'Corrección por pH aproximada: K a pH 7,40 ≈ K medido - 0,6 x ((7,40 - pH)/0,1). Útil como orientación, no para retrasar tratamiento.',
      'Acidosis metabólica puede elevar K por shift. Aunque sea por shift, si hay ECG alterado se trata igual.',
      'Hiperglicemia/insulinopenia favorece salida de K; al usar insulina el K puede bajar rápido.',
      'Si glicemia >=250 mg/dL durante tratamiento con insulina para hiperkalemia, puede omitirse/reducirse glucosa inicial, pero HGT debe controlarse estrechamente.',
      'Tras insulina-glucosa, vigilar hipoglicemia hasta 4-6 h, especialmente en ERC.',
    ],
  },
  {
    id: 'kb-hiper-calc',
    tab: 'kb_hiper',
    subtab: 'kb_hiper_calculadora',
    type: 'hyperkalemia_management_calculator',
    order: 110,
  },
  {
    id: 'kb-hiper-urgente',
    tab: 'kb_hiper',
    subtab: 'kb_hiper_urgente',
    type: 'algorithm',
    color: 'red',
    order: 120,
    title: 'Algoritmo de manejo urgente',
    description: 'No esperar si hay ECG alterado, K >=6,5 o periparo.',
    details: [
      '1. ECG + monitor + repetir muestra si sospecha pseudohiperkalemia, pero no retrasar si ECG alterado.',
      '2. Proteger membrana si ECG alterado/K >=6,5/periparo: calcio EV.',
      '~Gluconato 10% 30 mL EV en 10 min si disponible.',
      '~Si no disponible, cloruro de calcio 10% 10 mL EV lento por vía central o vena segura.',
      '3. Desplazar K: insulina cristalina 10 UI EV + glucosa 25 g.',
      '~SG 10% 250 mL = 25 g; SG 30% 83 mL ≈ 25 g.',
      '4. Adyuvante: salbutamol nebulizado 10-20 mg.',
      '5. Bicarbonato 8,4% 50 mEq si acidosis metabólica significativa.',
      '6. Eliminar K: diuresis con furosemida si corresponde, quelante si disponible, diálisis/traslado si grave/refractaria/anuria.',
      '7. Recontrol K/ECG a 1-2 h; HGT seriado 0-360 min tras insulina.',
    ],
  },
  {
    id: 'kb-hiper-farmacos',
    tab: 'kb_hiper',
    subtab: 'kb_hiper_farmacos',
    type: 'table',
    color: 'red',
    order: 130,
    title: 'Fármacos y equivalencias — Hiperkalemia',
    headers: ['Objetivo', 'Fármaco local / alternativa', 'Dosis práctica', 'Notas'],
    rows: [
      ['Proteger miocardio', 'Gluconato de calcio 10% si disponible', '30 mL EV en 10 min', 'Repetir si ECG no mejora. No baja K.'],
      ['Proteger miocardio', 'Cloruro de calcio 10% alternativa local', '10 mL EV lento', 'Preferir vía central/vena segura. Usar si no hay gluconato y ECG/periparo.'],
      ['Shift intracelular', 'Insulina cristalina + glucosa', '10 UI EV + 25 g glucosa', 'SG10% 250 mL o SG30% 83 mL. HGT seriado por riesgo hipoglicemia.'],
      ['Shift intracelular', 'Salbutamol nebulizado 5 mg/mL', '10-20 mg = 2-4 mL nebulizados', 'Adyuvante; no usar solo en grave.'],
      ['Acidosis', 'Bicarbonato de sodio 8,4%', '50 mEq ≈ 50 mL EV', 'Solo si acidosis metabólica relevante o indicación avanzada.'],
      ['Eliminar K', 'Furosemida 20 mg/mL', '20-40 mg EV = 1-2 mL', 'Solo si diuresis/volemia lo permiten.'],
      ['Eliminar K', 'Quelantes/resinas', 'Según disponibilidad', 'Si no está en Bulnes, coordinar alternativa/derivación; efecto no inmediato.'],
    ],
  },
  {
    id: 'kb-hiper-eliminacion',
    tab: 'kb_hiper',
    subtab: 'kb_hiper_eliminacion',
    type: 'criteria',
    color: 'amber',
    order: 140,
    title: 'Eliminación y manejo tranquilo',
    items: [
      'Leve estable: suspender K, IECA/ARA-II/ARNI, espironolactona, AINES, cotrimoxazol, heparina si corresponde; dieta baja en K; control.',
      'Diurético de asa si hay diuresis, sobrecarga o necesidad de eliminación renal.',
      'Quelantes/resinas no son tratamiento único de emergencia; considerar si disponibles para evitar rebote.',
      'Diálisis/traslado: K >=6,5 refractario, ECG persistente, anuria/oliguria, ERC avanzada, rabdomiólisis/lisis tumoral o imposibilidad de monitorizar.',
      'Rebote frecuente: shift no elimina K. Repetir K y ECG según severidad.',
    ],
  },
  {
    id: 'kb-hiper-flow',
    tab: 'kb_hiper',
    subtab: 'kb_hiper_flujo',
    type: 'mermaid',
    color: 'red',
    order: 150,
    title: 'Flowchart — Hiperkalemia',
    content: `flowchart TD
    A["K elevado o sospecha clínica/ECG"] --> B["ECG + monitor + confirmar muestra"]
    B --> C{"¿ECG alterado\\nK >= 6,5\\no periparo?"}
    C -->|"Sí"| D["Calcio EV\\nGluconato 30 mL o\\nCloruro calcio 10 mL"]
    C -->|"No"| E{"¿K 6,0-6,4\\no síntomas?"}
    D --> F["Insulina cristalina 10 UI EV\\n+ glucosa 25 g"]
    E -->|"Sí"| F
    E -->|"No"| G["Manejo no urgente\\nretirar gatillantes\\ndieta baja K\\ncontrol"]
    F --> H["Salbutamol 10-20 mg neb\\n± bicarbonato si acidosis"]
    H --> I{"¿Diuresis conservada?"}
    I -->|"Sí"| J["Furosemida si corresponde\\nconsiderar quelante si disponible"]
    I -->|"No"| K["Coordinar diálisis/traslado\\nsi grave o refractaria"]
    J --> L["Recontrol K/ECG 1-2 h\\nHGT seriado 0-360 min"]
    K --> L
    G --> L`,
  },
  {
    id: 'kb-referencias',
    tab: 'kb_hiper',
    subtab: 'kb_hiper_eliminacion',
    type: 'text',
    color: 'gray',
    order: 190,
    title: 'Referencias principales',
    content: references.map(item => `- ${item}`).join('\n'),
  },
];

const payload = {
  description:
    'Manejo clínico de hipokalemia e hiperkalemia en pacientes hospitalizados, con subpestañas, calculadoras, algoritmos, correcciones por pH/glicemia y adaptación al arsenal local.',
  tags: ['potasio', 'hiperkalemia', 'hipokalemia', 'electrolitos', 'nefrología', 'hospitalizados', 'calculadora'],
  related_tools: [
    { tool_id: 'hypokalemia-correction', label: 'Hipokalemia — reposición de KCl' },
    { tool_id: 'hyperkalemia-management', label: 'Hiperkalemia — urgencia y manejo inicial' },
  ],
  clinical_summary:
    'Trastornos del potasio separados en hipokalemia e hiperkalemia, con énfasis en riesgo ECG, pH/glicemia, función renal, arsenal local y controles seriados.',
  diagnostic_orientation:
    'Clasificar por nivel de K, ECG, síntomas, velocidad de instalación, pH, glicemia, magnesio, función renal/diuresis y causa probable. Descartar pseudohiperkalemia.',
  complementary_studies:
    'ECG, electrolitos seriados, gases, glicemia, creatinina/VFG, magnesio, calcio/fósforo, CK si rabdomiólisis, orina y fármacos gatillantes según caso.',
  initial_treatment:
    'Hipokalemia: KCl VO o EV según gravedad, siempre considerar Mg. Hiperkalemia: ECG/monitor, calcio si ECG/K grave, insulina-glucosa/salbutamol, eliminación y recontrol.',
  content_blocks: blocks,
  last_updated: new Date().toISOString(),
};

async function main() {
  const { data: topic, error: findError } = await supabase
    .from('topics')
    .select('id,name,content_blocks')
    .eq('id', TOPIC_ID)
    .single();
  if (findError) throw findError;

  if (!APPLY) {
    console.log(JSON.stringify({
      mode: 'dry-run',
      topic: { id: topic.id, name: topic.name, previousBlocks: topic.content_blocks?.length || 0 },
      nextBlocks: blocks.length,
      tabs: [...new Set(blocks.map(b => b.tab).filter(Boolean))],
    }, null, 2));
    return;
  }

  const { data, error } = await supabase
    .from('topics')
    .update(payload)
    .eq('id', TOPIC_ID)
    .select('id,name,content_blocks,related_tools')
    .single();
  if (error) throw error;

  console.log(JSON.stringify({
    action: 'updated',
    topic: {
      id: data.id,
      name: data.name,
      blocks: data.content_blocks?.length,
      related_tools: data.related_tools,
    },
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
