/**
 * Crea/actualiza dos temas de Urgencias:
 * - Hipoglicemia en Urgencias
 * - Complicaciones Hiperglicémicas Agudas: CAD y EHH
 *
 * Base principal: Umpierrez GE, Korytkowski M. Diabetic emergencies.
 * Nat Rev Endocrinol. 2016.
 *
 * Uso: node --env-file=.env scripts/create-hospitalizados-emergencias-diabeticas-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

const CATEGORY_ID = '696ea6ff245ef362de4f431f';
const PDF_PATH = '/Users/fernandoalvarado/Downloads/nrendo.2016.15.pdf';
const STORAGE_PATH = 'protocolos/urgencias/diabetic-emergencies-umpierrez-korytkowski-2016.pdf';

const today = new Date().toISOString();

const sharedReferences = [
  'Umpierrez GE, Korytkowski M. Diabetic emergencies: ketoacidosis, hyperglycaemic hyperosmolar state and hypoglycaemia. Nat Rev Endocrinol. 2016.',
  'Hyperglycemic Crises in Adults With Diabetes: A Consensus Report. Diabetes Care. 2024.',
  'Endocrine Society Clinical Practice Guideline: Management of Hyperglycemia in Hospitalized Adult Patients in Non-Critical Care Settings. 2022.',
  'ADA Standards of Care in Diabetes: Diabetes Care in the Hospital.',
];

const hypoglycemiaBlocks = [
  {
    id: 'hipoglicemia-header',
    type: 'protocol_header',
    ordinario: 'REFERENCIA CLÍNICA',
    title: 'Diabetic emergencies: ketoacidosis, hyperglycaemic hyperosmolar state and hypoglycaemia',
    institution: 'Nature Reviews Endocrinology',
    department: 'Umpierrez GE, Korytkowski M',
    date: '2016',
    summary:
      'Síntesis adaptada a Urgencias Hospital de Bulnes: reconocimiento, rescate inmediato, prevención y ajuste terapéutico de hipoglicemia en adultos, con unidades en mg/dL y arsenal local.',
    order: 1,
  },
  {
    id: 'hipoglicemia-alerta',
    type: 'alert',
    tab: 'Inicio',
    color: 'red',
    order: 5,
    title: 'No esperar laboratorio si hay compromiso neurológico',
    content:
      'Si el paciente tiene compromiso de conciencia, convulsión, imposibilidad de deglutir o sospecha clínica fuerte, administrar glucosa de inmediato y controlar HGT a los 15 minutos.',
  },
  {
    id: 'hipoglicemia-resumen',
    type: 'text',
    tab: 'Inicio',
    color: 'blue',
    order: 10,
    title: 'Resumen práctico',
    content:
      'En hospitalizados, cualquier glicemia <70 mg/dL requiere acción. Bajo 54 mg/dL se considera hipoglicemia clínicamente significativa y se asocia a mayor riesgo de eventos adversos. La hipoglicemia severa se define por necesidad de asistencia de terceros, independiente del número exacto. El objetivo local es tratar rápido, evitar aspiración, documentar causa y prevenir recurrencia antes de la próxima dosis de insulina o secretagogo.',
  },
  {
    id: 'hipoglicemia-calculadora',
    type: 'hypoglycemia_treatment_calculator',
    tab: 'Inicio',
    order: 12,
  },
  {
    id: 'hipoglicemia-criterios',
    type: 'criteria',
    tab: 'Diagnóstico',
    color: 'red',
    order: 20,
    title: 'Umbrales diagnósticos en mg/dL',
    items: [
      '<70 mg/dL: hipoglicemia nivel alerta. Debe gatillar tratamiento y revisión de esquema.',
      '<54 mg/dL: hipoglicemia clínicamente significativa. Mayor riesgo de arritmia, caídas, deterioro cognitivo y mortalidad asociada.',
      'Hipoglicemia severa: requiere ayuda de terceros, hay compromiso de conciencia, convulsión, imposibilidad de tragar o necesidad de dextrosa EV/glucagón.',
      'Si hay síntomas con HGT limítrofe, tratar y confirmar con glicemia venosa si el contexto no calza.',
    ],
  },
  {
    id: 'hipoglicemia-causas',
    type: 'criteria',
    tab: 'Diagnóstico',
    color: 'amber',
    order: 25,
    title: 'Causas frecuentes a buscar en sala',
    items: [
      'Insulina NPH o cristalina sin ingesta suficiente, suspensión inesperada de alimentación enteral/parenteral o ayuno para procedimiento.',
      'Correcciones repetidas con insulina cristalina sin reevaluar tendencia.',
      'Deterioro de función renal, bajo peso, adulto mayor, sepsis, insuficiencia hepática o ingesta irregular.',
      'Sulfonilureas: riesgo de hipoglicemia prolongada y recurrente, especialmente en VFG reducida.',
      'Cambios recientes en corticoides, resolución de infección o disminución brusca de requerimientos.',
    ],
  },
  {
    id: 'hipoglicemia-flujo',
    type: 'flowchart',
    tab: 'Tratamiento',
    color: 'green',
    order: 30,
    title: 'Rescate inicial con arsenal local',
    description: 'Aplicar, controlar a 15 minutos y repetir hasta recuperación sostenida.',
    details: [
      '━━━ PACIENTE CONSCIENTE Y DEGLUCIÓN SEGURA ━━━',
      'Dar 15-20 g de carbohidrato de absorción rápida por vía oral.',
      '~Controlar HGT en 15 min; si sigue <70 mg/dL, repetir.',
      '~Cuando supere 70 mg/dL, indicar colación o adelantar comida si no comerá pronto.',
      '━━━ COMPROMISO DE CONCIENCIA O NO PUEDE TRAGAR ━━━',
      'Usar dextrosa EV inmediata.',
      '~SG 30% 50 mL EV aporta 15 g de glucosa: equivale a 2,5 ampollas si la ampolla local es de 20 mL; si no se fracciona, 3 ampollas de 20 mL aportan 18 g.',
      '~SG 10% 150 mL EV aporta 15 g de glucosa y puede evitar rebote excesivo.',
      '~Confirmar volumen de ampolla local antes de prescribir; indicar siempre gramos y mL, no solo ampollas.',
      '~Controlar HGT en 15 min; repetir si persiste bajo.',
      '━━━ SIN VÍA VENOSA ━━━',
      'Asegurar ABC, pedir ayuda y obtener vía EV/IO urgente.',
      '~Si existe glucagón: 1 mg IM/SC mientras se obtiene acceso.',
      '~El glucagón puede fallar en ayuno prolongado, alcoholismo o desnutrición.',
    ],
  },
  {
    id: 'hipoglicemia-algoritmo',
    type: 'algorithm',
    tab: 'Flujo de decisión',
    color: 'blue',
    order: 13,
    title: 'Algoritmo de hipoglicemia en urgencias',
    description: 'Pensado para decidir rápido según conciencia y vía venosa.',
    details: [
      'HGT <70 mg/dL o síntomas neuroglucopénicos → tratar de inmediato.',
      '¿Paciente consciente y deglute seguro?',
      '~Sí → 15-20 g VO, esperar 15 min y repetir HGT.',
      '~No → no dar por boca; buscar vía EV/IO.',
      '¿Hay vía EV?',
      '~Sí → SG 30% 50 mL EV o SG 10% 150 mL EV.',
      '~No → ABC, ayuda, vía urgente; glucagón 1 mg IM/SC si disponible.',
      'HGT sigue <70 mg/dL a los 15 min → repetir rescate.',
      'Al recuperar → colación/comida, ajustar insulina/secretagogos y monitorizar recurrencia.',
    ],
  },
  {
    id: 'hipoglicemia-flowchart-visual',
    type: 'mermaid',
    tab: 'Flowchart',
    color: 'blue',
    order: 14,
    title: 'Flowchart visual — Hipoglicemia en urgencias',
    description: 'Secuencia rápida para rescate y prevención de recurrencia.',
    content: `flowchart TD
    A["HGT menor 70 mg/dL\\no síntomas sugerentes"] --> B{"¿Consciente y\\ndeglute seguro?"}
    B -->|"Sí"| C["15-20 g carbohidrato VO"]
    C --> D["Recontrol HGT en 15 min"]
    D --> E{"¿HGT sigue menor 70?"}
    E -->|"Sí"| C
    E -->|"No"| F["Colación o comida\\najustar insulina/secretagogos"]
    B -->|"No"| G{"¿Vía EV disponible?"}
    G -->|"Sí"| H["SG 30% 50 mL EV = 15 g\\n2,5 ampollas de 20 mL\\no 3 ampollas = 18 g"]
    G -->|"Alternativa EV"| I["SG 10% 150 mL EV = 15 g"]
    H --> D
    I --> D
    G -->|"No"| J["ABC + pedir ayuda\\nconseguir vía EV/IO"]
    J --> K["Glucagón 1 mg IM/SC\\nsi disponible"]
    K --> D
    F --> L["Buscar causa\\nayuno, NPH/cristalina, VFG baja, sulfonilurea"]
    L --> M["HGT seriado\\n15 min hasta recuperar\\nluego 1 h por 2-4 h"]`,
  },
  {
    id: 'hipoglicemia-equivalencias-locales',
    type: 'table',
    tab: 'Tratamiento',
    color: 'green',
    order: 32,
    title: 'Equivalencias prácticas de glucosa EV',
    description: 'Prescribir en gramos + mL; ampollas solo como apoyo operativo.',
    headers: ['Solución', 'Dosis objetivo', 'Equivalencia práctica', 'Comentario'],
    rows: [
      ['SG 30%', '50 mL = 15 g', '2,5 ampollas si ampolla local es de 20 mL; 3 ampollas = 60 mL = 18 g si no se fracciona', 'Uso rápido en compromiso de conciencia o imposibilidad de deglutir.'],
      ['SG 10%', '150 mL = 15 g', '150 mL de solución al 10%', 'Menos hipertónica; útil si se prefiere bolo/infusión menos concentrada.'],
      ['Carbohidrato VO', '15-20 g', 'Glucosa oral, jugo azucarado o equivalente disponible', 'Solo si está consciente y deglute seguro.'],
    ],
  },
  {
    id: 'hipoglicemia-ordenes',
    type: 'criteria',
    tab: 'Tratamiento',
    color: 'blue',
    order: 35,
    title: 'Órdenes posteriores al rescate',
    items: [
      'HGT cada 15 min hasta >70 mg/dL y luego cada 1 h por 2-4 h si fue severa o recurrente.',
      'Suspender corrección/prandial inmediata y revisar la siguiente dosis de NPH/cristalina antes de administrarla.',
      'Si no habrá ingesta, indicar suero glucosado y plan de monitorización en vez de mantener insulina sin soporte de carbohidratos.',
      'Registrar evento, hora, HGT, tratamiento recibido, respuesta y causa probable.',
      'Avisar a médico tratante si <54 mg/dL, evento severo, recurrencia, sulfonilurea, embarazo, arritmia, sepsis o deterioro renal.',
    ],
  },
  {
    id: 'hipoglicemia-prevencion',
    type: 'criteria',
    tab: 'Prevención',
    color: 'purple',
    order: 40,
    title: 'Prevención en hospitalizados',
    items: [
      'Preferir esquemas con dosis basal/prandial/corrección razonada; evitar solo escala móvil repetida sin plan basal cuando corresponde.',
      'En adulto mayor, bajo peso, VFG reducida o antecedente de hipoglicemia severa, usar dosis inicial más conservadora y metas menos estrictas.',
      'Modificar insulina cuando glicemias bajen hacia <100 mg/dL o si se suspende alimentación.',
      'Ajustar NPH nocturna si hay hipoglicemia de madrugada; revisar colación y horario de control.',
      'Evitar sulfonilureas en pacientes de alto riesgo intrahospitalario cuando sea posible.',
    ],
  },
  {
    id: 'hipoglicemia-fuente',
    type: 'text',
    tab: 'Referencias',
    color: 'gray',
    order: 90,
    title: 'Base bibliográfica',
    content: sharedReferences.map(item => `- ${item}`).join('\n'),
  },
];

const hyperglycemiaBlocks = [
  {
    id: 'cad-ehh-header',
    type: 'protocol_header',
    ordinario: 'REFERENCIA CLÍNICA',
    title: 'Diabetic emergencies: ketoacidosis, hyperglycaemic hyperosmolar state and hypoglycaemia',
    institution: 'Nature Reviews Endocrinology',
    department: 'Umpierrez GE, Korytkowski M',
    date: '2016',
    summary:
      'Síntesis adaptada a Urgencias Hospital de Bulnes: diagnóstico y manejo inicial de cetoacidosis diabética y estado hiperglicémico hiperosmolar, con criterios en mg/dL, mEq/L y arsenal local.',
    order: 1,
  },
  {
    id: 'cad-ehh-alerta',
    type: 'alert',
    tab: 'Inicio',
    color: 'red',
    order: 5,
    title: 'La insulina no va antes del potasio',
    content:
      'Si K <3,3 mEq/L, diferir insulina y reponer potasio con monitorización. Iniciar insulina con hipokalemia puede precipitar arritmias graves.',
  },
  {
    id: 'cad-ehh-resumen',
    type: 'text',
    tab: 'Inicio',
    color: 'blue',
    order: 10,
    title: 'Resumen ejecutivo',
    content:
      'La CAD se define por hiperglicemia o contexto compatible, cetosis y acidosis metabólica. El EHH se caracteriza por hiperglicemia marcada, osmolaridad efectiva elevada y deshidratación severa con poca cetosis/acidosis. Ambos requieren fluidos, potasio, insulina cristalina y búsqueda activa del gatillante. En Bulnes, la disponibilidad local práctica incluye insulina humana cristalina 100 UI/mL, NPH 100 UI/mL, sueros glucosados 5-10-30%, NaCl 0,9% y KCl.',
  },
  {
    id: 'cad-ehh-calculadora',
    type: 'hyperglycemic_crisis_calculator',
    tab: 'Inicio',
    order: 12,
  },
  {
    id: 'cad-ehh-tabla-diagnostico',
    type: 'table',
    tab: 'Diagnóstico',
    color: 'red',
    order: 20,
    title: 'Criterios orientadores',
    description: 'Usar junto al contexto clínico y laboratorio seriado.',
    headers: ['Elemento', 'CAD', 'EHH'],
    rows: [
      ['Glicemia', 'Usualmente >=200-250 mg/dL; puede ser menor con iSGLT2, embarazo o ayuno', '>=600 mg/dL'],
      ['Cetonemia', 'Beta-hidroxibutirato >=3 mmol/L o cetonas positivas significativas', 'Ausente o leve; beta-hidroxibutirato habitualmente <3 mmol/L'],
      ['Acidosis', 'pH <7,30 y/o HCO3 <18 mEq/L', 'pH >=7,30 y HCO3 >=15 mEq/L'],
      ['Osmolaridad efectiva', 'Variable', '>=320 mOsm/kg'],
      ['Estado mental', 'Normal a compromiso según severidad', 'Frecuente compromiso por hiperosmolaridad'],
    ],
  },
  {
    id: 'cad-ehh-severidad',
    type: 'criteria',
    tab: 'Diagnóstico',
    color: 'amber',
    order: 25,
    title: 'Severidad de CAD',
    items: [
      'Leve: pH 7,25-7,30 o HCO3 15-18 mEq/L, paciente alerta.',
      'Moderada: pH 7,00-7,24 o HCO3 10-14 mEq/L, alerta o somnoliento.',
      'Severa: pH <7,00 o HCO3 <10 mEq/L, estupor/coma o inestabilidad.',
      'Sospechar cuadro mixto si hay criterios de CAD y osmolaridad efectiva >=320 mOsm/kg.',
    ],
  },
  {
    id: 'cad-ehh-formulas',
    type: 'criteria',
    tab: 'Diagnóstico',
    color: 'blue',
    order: 28,
    title: 'Fórmulas útiles en sala',
    items: [
      'Na corregido = Na medido + 1,6 x ((glicemia - 100) / 100). Si glicemia muy alta, algunos protocolos usan factor 2,4.',
      'Osmolaridad efectiva = 2 x Na medido + glicemia/18. No incluye urea porque no sostiene gradiente osmótico cerebral.',
      'Anion gap = Na - Cl - HCO3. Elevado apoya acidosis metabólica con aniones no medidos, pero no reemplaza cetonemia.',
      'Déficit hídrico orientativo: CAD ~100 mL/kg; EHH ~100-200 mL/kg, reponiendo con cautela en adulto mayor/cardiopatía/renal.',
    ],
  },
  {
    id: 'cad-ehh-flujo-inicial',
    type: 'flowchart',
    tab: 'Manejo inicial',
    color: 'green',
    order: 30,
    title: 'Primeras 2 horas',
    description: 'El orden importa: volumen, potasio, insulina y gatillante.',
    details: [
      'Evaluar ABC, signos de shock, Glasgow, diuresis, ECG si K alterado y acceso venoso.',
      'Tomar glicemia, gases, electrolitos, creatinina, cetonas/beta-hidroxibutirato, hemograma, PCR y cultivos/ECG/troponina según sospecha.',
      'NaCl 0,9% 500-1000 mL/h por 1-2 h si no hay contraindicación.',
      '~Luego ajustar según Na corregido, volemia, diuresis y comorbilidad.',
      'Identificar gatillante: infección, suspensión de insulina, IAM/ACV, corticoides, iSGLT2, pancreatitis, trauma o error de medicación.',
    ],
  },
  {
    id: 'cad-ehh-algoritmo-secuencial',
    type: 'algorithm',
    tab: 'Flujo de decisión',
    color: 'red',
    order: 13,
    title: 'Algoritmo secuencial CAD/EHH',
    description: 'Orden recomendado: primero volumen y potasio, luego insulina, luego dextrosa de transición.',
    details: [
      '━━━ 0-15 MIN: CONFIRMAR Y MONITORIZAR ━━━',
      'ABC, volemia, sensorio, accesos venosos, monitor cardíaco si K alterado.',
      'Labs iniciales: HGT/glicemia, gases, Na/K/Cl/HCO3, creatinina, cetonas/beta-hidroxibutirato, osmolaridad efectiva y gatillante.',
      '━━━ 0-60 MIN: FLUIDOS ━━━',
      'NaCl 0,9% 500-1000 mL/h si no hay contraindicación.',
      '~Si adulto mayor, cardiopatía o falla renal: bolos menores y reevaluación frecuente.',
      '━━━ ANTES DE INSULINA: POTASIO ━━━',
      'K <3,3 mEq/L → KCl primero, NO insulina.',
      'K 3,3-5,0 mEq/L → iniciar insulina + KCl en suero si hay diuresis.',
      'K >5,0 mEq/L → iniciar insulina sin KCl inicial; control K/ECG.',
      '━━━ INSULINA ━━━',
      'Insulina cristalina EV 0,1 UI/kg/h si K >=3,3 mEq/L.',
      '~Preparación: 100 UI en 100 mL NaCl 0,9% = 1 UI/mL; mL/h = UI/h.',
      '━━━ TRANSICIÓN ━━━',
      'CAD con glicemia 200-250 mg/dL o EHH 250-300 mg/dL → agregar SG 5-10% y bajar insulina a 0,05 UI/kg/h.',
      'Continuar hasta cierre de acidosis/cetosis u osmolaridad y transición subcutánea segura.',
    ],
  },
  {
    id: 'cad-ehh-flowchart-visual',
    type: 'mermaid',
    tab: 'Flowchart',
    color: 'red',
    order: 14,
    title: 'Flowchart visual — CAD/EHH',
    description: 'Orden de manejo: volumen, potasio, insulina y glucosa de transición.',
    content: `flowchart TD
    A["Sospecha CAD/EHH\\nHGT alto, cetosis, acidosis u osmolaridad"] --> B["ABC + monitorización\\n2 vías EV si posible"]
    B --> C["Laboratorio inicial\\ngases, Na/K/Cl/HCO3, creatinina\\ncetonemia, osmolaridad, gatillante"]
    C --> D["NaCl 0,9%\\n500-1000 mL/h primera hora"]
    D --> E{"Potasio sérico"}
    E -->|"K menor 3,3"| F["KCl primero\\nNO insulina"]
    F --> G["Recontrol K\\nhasta K 3,3 o más"]
    G --> H["Insulina cristalina EV\\n0,1 UI/kg/h"]
    E -->|"K 3,3 a 5,0"| I["KCl 20-40 mEq/L si diuresis\\n20 mEq aprox 1,5 amp\\n40 mEq aprox 3 amp"]
    I --> H
    E -->|"K mayor 5,0"| J["Sin KCl inicial\\ncontrol K y ECG"]
    J --> H
    H --> K["Preparación insulina\\n100 UI en 100 mL = 1 UI/mL\\nmL/h = UI/h"]
    K --> L{"Glicemia en umbral\\nCAD 200-250\\nEHH 250-300"}
    L -->|"No"| M["Continuar fluidos + insulina\\nHGT horario y labs 2-4 h"]
    M --> L
    L -->|"Sí"| N["Agregar SG 5-10%\\nbajar insulina a 0,05 UI/kg/h"]
    N --> O["Continuar hasta resolución\\nacidosis/cetosis u osmolaridad\\ntransición SC con solape"]`,
  },
  {
    id: 'cad-ehh-potasio',
    type: 'criteria',
    tab: 'Insulina y K',
    color: 'red',
    order: 40,
    title: 'Potasio antes y durante insulina',
    items: [
      'K <3,3 mEq/L: no iniciar insulina. Reponer KCl con monitorización hasta K >=3,3 mEq/L.',
      'K 3,3-5,0 mEq/L: agregar KCl a los fluidos si hay diuresis; objetivo práctico 4-5 mEq/L.',
      'K >5,0 mEq/L: no agregar K inicialmente; controlar cada 2 h y vigilar ECG.',
      'Confirmar concentración local de KCl 10% antes de calcular mL. Prescribir en mEq y velocidad segura según norma institucional.',
    ],
  },
  {
    id: 'cad-ehh-insulina',
    type: 'criteria',
    tab: 'Insulina y K',
    color: 'purple',
    order: 45,
    title: 'Insulina cristalina con disponibilidad local',
    items: [
      'Usar insulina humana cristalina 100 UI/mL. Iniciar solo si K >=3,3 mEq/L.',
      'Infusión estándar: 0,1 UI/kg/h. Preparación práctica: 100 UI en 100 mL de NaCl 0,9% = 1 UI/mL; la velocidad en mL/h equivale a UI/h.',
      'El bolo inicial no es indispensable si se logra infusión continua y monitorización adecuada.',
      'Esperar descenso de glicemia aproximado 50-75 mg/dL/h. Si no baja, revisar vía, bomba, preparación, hidratación y dosis.',
      'Cuando glicemia llegue a 200-250 mg/dL en CAD o 250-300 mg/dL en EHH: añadir SG 5-10% y reducir a 0,05 UI/kg/h hasta resolución metabólica.',
    ],
  },
  {
    id: 'cad-ehh-equivalencias-locales',
    type: 'table',
    tab: 'Insulina y K',
    color: 'red',
    order: 47,
    title: 'Fármacos y equivalencias prácticas',
    description: 'Aterrizaje local para prescripción inicial en CAD/EHH.',
    headers: ['Fármaco / solución', 'Dosis o preparación', 'Equivalente práctico', 'Cuándo usar'],
    rows: [
      ['Insulina humana cristalina 100 UI/mL', '0,1 UI/kg/h EV si K >=3,3 mEq/L', 'Preparar 100 UI en 100 mL NaCl 0,9% = 1 UI/mL; velocidad en mL/h = UI/h', 'Cierre de cetosis y descenso controlado de glicemia.'],
      ['Insulina cristalina en transición', '0,05 UI/kg/h', 'Con la misma dilución 1 UI/mL: mL/h = UI/h', 'Cuando glicemia llega a 200-250 mg/dL en CAD o 250-300 mg/dL en EHH, junto a SG 5-10%.'],
      ['Suero glucosado 5-10%', 'Agregar cuando se alcance rango de transición', 'Mantener aporte de glucosa mientras continúa insulina', 'Evita hipoglicemia y permite continuar cerrando acidosis/osmolaridad.'],
      ['Cloruro de potasio', '20-40 mEq/L si K 3,3-5,0 y hay diuresis', 'Si KCl 10% ampolla 10 mL ≈ 13,4 mEq: 20 mEq ≈ 1,5 ampollas; 30 mEq ≈ 2,25 ampollas; 40 mEq ≈ 3 ampollas por litro', 'Reposición durante insulina para objetivo K 4-5 mEq/L. Confirmar concentración local antes de preparar.'],
      ['Cloruro de potasio con K <3,3', 'Reponer antes de insulina', 'Si KCl 10% ampolla 10 mL ≈ 13,4 mEq: 20 mEq ≈ 1,5 ampollas', 'No iniciar insulina hasta K >=3,3 mEq/L; requiere monitorización estrecha.'],
    ],
  },
  {
    id: 'cad-ehh-resolucion',
    type: 'criteria',
    tab: 'Resolución',
    color: 'green',
    order: 55,
    title: 'Criterios de resolución y transición',
    items: [
      'CAD resuelta: glicemia <200-250 mg/dL con pH >7,3, HCO3 >=18 mEq/L, anion gap cerrado y cetosis en resolución.',
      'EHH resuelto: osmolaridad efectiva <300-320 mOsm/kg, recuperación de sensorio, diuresis y estabilidad hemodinámica.',
      'No suspender infusión EV hasta que exista plan subcutáneo y el paciente pueda comer o tenga aporte de carbohidratos estable.',
      'Solapar insulina EV con subcutánea por 1-2 h. Si el arsenal disponible es NPH + cristalina, individualizar dosis basal y correcciones según esquema local.',
      'Reeducar antes de alta: días de enfermedad, no suspender basal, cuándo consultar, signos de hipoglicemia y revisión de acceso a insulina.',
    ],
  },
  {
    id: 'cad-ehh-derivar',
    type: 'criteria',
    tab: 'Resolución',
    color: 'red',
    order: 60,
    title: 'Cuándo escalar/derivar',
    items: [
      'EHH o cuadro mixto CAD/EHH.',
      'CAD severa, pH <7,0, HCO3 <10, compromiso de conciencia, shock, hipoxemia o sospecha de sepsis grave.',
      'K <3,3 mEq/L, arritmia, ECG alterado o necesidad de reposición rápida monitorizada.',
      'Imposibilidad local de controlar electrolitos/gases con frecuencia, ausencia de bomba segura para insulina EV o necesidad de UPC.',
      'Embarazo, IAM/ACV, pancreatitis, falla renal avanzada o comorbilidad que modifique fluidos de forma importante.',
    ],
  },
  {
    id: 'cad-ehh-fuente',
    type: 'text',
    tab: 'Referencias',
    color: 'gray',
    order: 90,
    title: 'Base bibliográfica',
    content: sharedReferences.map(item => `- ${item}`).join('\n'),
  },
];

const topics = [
  {
    name: 'Hipoglicemia en Urgencias',
    legacyNames: ['Hipoglicemia en Paciente Hospitalizado'],
    order: 86,
    description:
      'Reconocimiento, rescate inmediato y prevención de hipoglicemia en adultos en urgencias, con algoritmo y calculadora adaptados al arsenal local.',
    tags: ['Urgencias', 'Endocrinología', 'Diabetes', 'Hipoglicemia', 'Insulina', 'Dextrosa'],
    content_blocks: hypoglycemiaBlocks,
    related_tools: [{ tool_id: 'hypoglycemia-treatment', label: 'Hipoglicemia en urgencias — Tratamiento inicial' }],
    clinical_summary:
      'Hipoglicemia intrahospitalaria: umbrales <70 y <54 mg/dL, tratamiento oral o EV según conciencia, prevención de recurrencia y ajuste de insulina.',
    diagnostic_orientation:
      'Clasificar por valor, síntomas y necesidad de asistencia; buscar ayuno, exceso de insulina, deterioro renal, sulfonilureas y cambios en aporte nutricional.',
    complementary_studies:
      'HGT seriado, glicemia venosa si discordancia, creatinina/VFG, electrolitos y revisión de fármacos. ECG si hipoglicemia severa, arritmia o K alterado.',
    initial_treatment:
      'Consciente: 15-20 g de carbohidrato VO y control a 15 min. Compromiso/no VO: SG30% 50 mL EV (15 g; 2,5 ampollas de 20 mL o 3 ampollas si no se fracciona) o SG10% 150 mL EV y control a 15 min.',
  },
  {
    name: 'Complicaciones Hiperglicémicas Agudas: CAD y EHH',
    order: 87,
    description:
      'Diagnóstico, severidad y manejo inicial de cetoacidosis diabética y estado hiperglicémico hiperosmolar en adultos en urgencias.',
    tags: ['Urgencias', 'Endocrinología', 'Diabetes', 'Cetoacidosis diabética', 'Estado hiperosmolar', 'Insulina cristalina'],
    content_blocks: hyperglycemiaBlocks,
    related_tools: [{ tool_id: 'hyperglycemic-crisis', label: 'CAD/EHH — Criterios y manejo inicial' }],
    clinical_summary:
      'Criterios y manejo inicial de CAD/EHH con fluidos, potasio, insulina cristalina, dextrosa al cierre y búsqueda de gatillantes.',
    diagnostic_orientation:
      'Diferenciar CAD, EHH y cuadros mixtos con glicemia, pH, bicarbonato, beta-hidroxibutirato, anion gap, osmolaridad efectiva y estado mental.',
    complementary_studies:
      'Gases, electrolitos, creatinina, beta-hidroxibutirato/cetonas, HGT horario, ECG si K alterado, hemograma/PCR/cultivos/imágenes según gatillante.',
    initial_treatment:
      'NaCl 0,9% inicial, reposición de K según nivel, insulina cristalina EV 0,1 UI/kg/h si K >=3,3, SG 5-10% cuando glicemia alcance rango de transición.',
  },
];

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

function buildPayload(topic, protocolFileUrl) {
  return {
    name: topic.name,
    category_id: CATEGORY_ID,
    subcategory: 'Endocrinología',
    status: 'published',
    title: topic.name,
    description: topic.description,
    tags: topic.tags,
    order: topic.order,
    authors: ['Hospital de Bulnes', 'Revisión bibliográfica adaptada'],
    published_date: today,
    last_updated: today,
    layout_mode: 'protocol',
    tipo_contenido: ['contenido_medico'],
    clasificacion_ges: null,
    has_local_protocol: false,
    content_blocks: topic.content_blocks,
    related_topics: [],
    related_tools: topic.related_tools,
    clinical_summary: topic.clinical_summary,
    diagnostic_orientation: topic.diagnostic_orientation,
    complementary_studies: topic.complementary_studies,
    initial_treatment: topic.initial_treatment,
    protocol_code: '',
    protocol_edition: '',
    protocol_date: '',
    protocol_validity: '',
    protocol_authors: [],
    protocol_objective: '',
    protocol_participants: [],
    protocol_flowchart: [],
    protocol_algorithm: [],
    protocol_medications: [],
    protocol_file_url: protocolFileUrl,
  };
}

async function upsertTopic(topic, protocolFileUrl) {
  const { data: existing, error: findError } = await supabase
    .from('topics')
    .select('id,name')
    .in('name', [topic.name, ...(topic.legacyNames || [])])
    .limit(1);

  if (findError) throw findError;
  const existingTopic = existing?.[0] || null;

  const payload = buildPayload(topic, protocolFileUrl);
  if (!APPLY) return { mode: 'dry-run', existing: existingTopic, payload };

  if (existingTopic?.id) {
    const { data, error } = await supabase
      .from('topics')
      .update(payload)
      .eq('id', existingTopic.id)
      .select('id,name')
      .single();
    if (error) throw error;
    return { action: 'updated', topic: data };
  }

  const { data, error } = await supabase
    .from('topics')
    .insert(payload)
    .select('id,name')
    .single();
  if (error) throw error;
  return { action: 'inserted', topic: data };
}

async function main() {
  const protocolFileUrl = await uploadPdf();
  const results = [];
  for (const topic of topics) {
    results.push(await upsertTopic(topic, protocolFileUrl));
  }
  console.log(JSON.stringify({ apply: APPLY, protocolFileUrl, results }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
