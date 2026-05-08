/**
 * Crea topic "Manejo Farmacológico del Dolor Oncológico" en categoría
 * Dependencia Severa, Cuidados Paliativos y Alivio del Dolor (696ea6ff245ef362de4f4320).
 *
 * Fuente: Claudio Fierro. "Evaluación y manejo farmacológico del dolor oncológico".
 * En: Palma A, Taboada P, Nervi F (eds). Medicina Paliativa y Cuidados Continuos.
 * Pontificia Universidad Católica de Chile.
 *
 * Uso:  node scripts/create-paliativos-dolor-oncologico-v1.mjs
 *       node scripts/create-paliativos-dolor-oncologico-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

const CATEGORY_ID = '696ea6ff245ef362de4f4320';
const TOPIC_NAME  = 'Manejo Farmacológico del Dolor Oncológico';

const content_blocks = [
  // ── HEADER ───────────────────────────────────────────────────────────────
  {
    id: 'dolor-onco-header',
    type: 'protocol_header',
    ordinario: 'REFERENCIA CLÍNICA',
    title: 'Evaluación y manejo farmacológico del dolor oncológico',
    institution: 'Pontificia Universidad Católica de Chile',
    department: 'Medicina Paliativa y Cuidados Continuos (cap.)',
    date: 'Autor: Claudio Fierro',
    summary: 'Síntesis del capítulo de Claudio Fierro sobre evaluación clínica del dolor oncológico, escalera analgésica de la OMS, uso racional de AINEs, opioides débiles y potentes, rotación de opioides y fármacos coadyuvantes.',
    order: 1,
  },

  // ── PESTAÑA 1: EVALUACIÓN ───────────────────────────────────────────────
  {
    id: 'dolor-onco-definicion',
    type: 'text',
    tab: 'Evaluación',
    color: 'blue',
    order: 10,
    title: 'Definición y consideraciones generales',
    content:
      'El dolor (IASP) es "una experiencia sensorial y emocional displacentera asociada a un daño tisular actual o potencial, o descrita en tales términos". Es el síntoma más frecuente y temido en cuidados paliativos. ' +
      'Su tratamiento insuficiente se debe a tres causas principales: desconocimiento de las características del dolor crónico oncológico, ignorancia de la farmacología y coadyuvantes, y la idea errónea de que "no queda nada por hacer".',
  },
  {
    id: 'dolor-onco-clasificacion',
    type: 'criteria',
    tab: 'Evaluación',
    color: 'blue',
    order: 11,
    title: 'Clasificación neurofisiológica del dolor',
    content: 'En enfermedad avanzada los mecanismos suelen coexistir; identificarlos orienta el tratamiento.',
    items: [
      '━━━ NOCICEPTIVO SOMÁTICO ━━━',
      'Estímulo de fibras C o Aδ en partes blandas, hueso o articulaciones',
      'Bien localizado, circunscrito a la zona dañada',
      'Responde bien a AINEs y opioides',
      '━━━ NOCICEPTIVO VISCERAL ━━━',
      'Estímulos: distensión de víscera hueca, isquemia, inflamación, espasmo, tracción',
      'Difuso, mal localizado, descrito como cólico u opresivo',
      'Frecuentemente referido a zona distante',
      'Acompañado de reflejos autonómicos (náuseas, sudoración) y motores',
      '━━━ INFLAMATORIO ━━━',
      'Sensibilización por mediadores inflamatorios (disminución del umbral)',
      'Hiperalgesia al calor, dolor pulsátil',
      'Buena respuesta a AINEs y corticoides',
      '━━━ NEUROPÁTICO ━━━',
      'Lesión o disfunción del sistema nervioso central o periférico',
      'Parestesias, sensación de descarga eléctrica, dolor quemante',
      'Alodinia (dolor con estímulos no dolorosos), hiperpatía',
      'Frecuente déficit sensitivo o motor en territorio afectado',
      'Requiere "estabilizadores de membrana": antidepresivos, anticonvulsivantes, antiarrítmicos, ketamina, metadona',
      '━━━ MANTENIDO POR EL SIMPÁTICO ━━━',
      'Se alivia con interrupción farmacológica o quirúrgica del simpático',
      'Manejo complejo, derivar a especialista en dolor',
    ],
  },
  {
    id: 'dolor-onco-eva',
    type: 'criteria',
    tab: 'Evaluación',
    color: 'amber',
    order: 12,
    title: 'Escala Visual Análoga (EVA) — instrumento de elección',
    content: 'Escala subjetiva más sensible y específica para evaluación rutinaria. Línea continua de 0 (sin dolor) a 10 (máximo dolor imaginable).',
    items: [
      '━━━ APLICACIÓN ━━━',
      'Mostrar el anverso (línea sin números) al paciente',
      'Pedir que indique con un cursor o el dedo la intensidad de su dolor',
      'Leer la puntuación en el reverso (0–10)',
      'Aplicar siempre de la misma forma en controles sucesivos',
      '━━━ INTERPRETACIÓN ━━━',
      '0–3: dolor leve',
      '4–6: dolor moderado',
      '7–10: dolor severo',
      '━━━ UMBRALES DE AJUSTE TERAPÉUTICO ━━━',
      'EVA en reposo > 3/10: modificar esquema analgésico',
      'EVA dinámico (con movimiento) > 5/10: modificar esquema analgésico',
      '━━━ EN PALIACIÓN ━━━',
      'Registrar histórico de intensidad a distintas horas del día',
      'Evaluar interferencia con actividad diaria, sueño y autonomía',
      'Preguntar por aspiraciones funcionales del paciente (conducir, deambular, tolerar decúbito)',
    ],
  },
  {
    id: 'dolor-onco-curso',
    type: 'text',
    tab: 'Evaluación',
    color: 'gray',
    order: 13,
    title: 'Aumento progresivo del dolor en enfermedad avanzada',
    content:
      'El curso de la enfermedad oncológica es habitualmente predecible. Anticipar las complicaciones y trazar un plan analgésico individualizado evita reacciones tardías. ' +
      'Considerar siempre: tolerancia farmacológica, efectos adversos intolerables, eventos intercurrentes y comorbilidades. ' +
      'Se recomienda diario del dolor con registro de intensidad por horario, factores agravantes/aliviantes, calidad del sueño, autonomía y efectos colaterales.',
  },

  // ── PESTAÑA 2: ESCALERA OMS ────────────────────────────────────────────
  {
    id: 'dolor-onco-escalera',
    type: 'flowchart',
    tab: 'Escalera OMS',
    color: 'blue',
    order: 20,
    title: 'Escalera analgésica de la OMS (1986)',
    content: 'Uso racional escalonado según intensidad. Iniciar en el escalón apropiado; el buen juicio clínico permite saltar etapas.',
    details: [
      '━━━ ESCALÓN 1 — DOLOR LEVE (EVA 1–3) ━━━',
      'AINEs / metamizol / paracetamol',
      '~Asociar coadyuvantes según mecanismo del dolor',
      '~Reevaluar a las 24–48 h',
      '━━━ ESCALÓN 2 — DOLOR MODERADO (EVA 4–6) ━━━',
      'Mantener no opioide del escalón 1',
      '~Agregar opioide débil: tramadol o codeína',
      '~Coadyuvantes según corresponda',
      '━━━ ESCALÓN 3 — DOLOR SEVERO (EVA 7–10) ━━━',
      'Mantener no opioide del escalón 1',
      '~Sustituir el opioide débil por opioide potente: morfina, oxicodona, metadona, fentanilo o buprenorfina',
      '~Coadyuvantes según mecanismo',
      '~Considerar dosis de rescate para crisis de dolor irruptivo',
    ],
  },
  {
    id: 'dolor-onco-reglas',
    type: 'criteria',
    tab: 'Escalera OMS',
    color: 'green',
    order: 21,
    title: 'Reglas generales de prescripción',
    items: [
      'Administrar con horario fijo, no solo a demanda (SOS)',
      'Privilegiar la vía oral siempre que sea posible',
      'Subir de escalón cuando el actual sea insuficiente, no rotar dentro del mismo escalón sin causa',
      'Asociar siempre fármacos coadyuvantes según el tipo de dolor',
      'Pautar dosis de rescate (extra) para dolor irruptivo o incidental: típicamente 1/6 de la dosis diaria total del opioide',
      'Anticipar y prevenir efectos adversos previsibles (constipación, náuseas)',
      'Reevaluar respuesta y efectos adversos en cada control',
    ],
  },
  {
    id: 'dolor-onco-cuarto-escalon',
    type: 'text',
    tab: 'Escalera OMS',
    color: 'purple',
    order: 22,
    title: 'Cuarto escalón — técnicas invasivas',
    content:
      'Cuando los tres escalones farmacológicos no logran control adecuado, considerar derivación a unidad de dolor para: bloqueos nerviosos somáticos o de plexos (ej. plexo celíaco), neurolisis con alcohol o fenol, radiofrecuencia, catéteres neuroaxiales (intratecal o epidural) para opioides, bombas de infusión implantables y estimulación medular. Permite reducir o suspender analgésicos sistémicos en casos refractarios.',
  },

  // ── PESTAÑA 3: FÁRMACOS ────────────────────────────────────────────────
  {
    id: 'dolor-onco-aines',
    type: 'flowchart',
    tab: 'Fármacos',
    color: 'green',
    order: 30,
    title: 'AINEs y no opioides — Escalón 1',
    content: 'Inhibición de prostaglandinas a nivel central y periférico. Tienen "efecto techo": dosis máximas sobre las cuales no aumenta la analgesia. Útiles en monoterapia para dolor leve-moderado, especialmente somático. Las presentaciones marcadas están disponibles en arsenal HCSFB.',
    details: [
      '━━━ DOSIS HABITUALES (PRESENTACIÓN HCSFB) ━━━',
      'Paracetamol 500–1000 mg cada 6–8 h VO/EV — HCSFB: comp 500 mg, gotas 100 mg/mL, sol inyectable 10 mg/mL (máx 4 g/día; en hepatópata o desnutrido máx 2–3 g/día)',
      'Metamizol (dipirona) 1–2 g cada 6–8 h VO/EV — HCSFB: comp 300 mg (CPU), sol inyectable 0,5 g/mL, supositorio 250 mg (máx 6 g/día)',
      'Ketoprofeno 50–100 mg cada 8 h VO — HCSFB: comp 50 mg (CPU). EV/IM no disponible',
      'Ketorolaco 10 mg cada 6–8 h VO o 30 mg EV/IM — HCSFB: comp 10/30 mg y ampolla 30 mg/mL (CPU). Máx 120 mg/día por 5 días',
      'Diclofenaco 25–75 mg cada 8–12 h VO; EV 75 mg infundir en 30 min — HCSFB: comp 50 mg, sol inyectable 25 mg/mL, supositorio infantil 12,5 mg',
      'Ibuprofeno 400–600 mg cada 6–8 h VO — HCSFB: comp 400 mg, susp oral 200 mg/5 mL',
      'Naproxeno 275–550 mg cada 12 h VO — HCSFB: comp 550 mg (Protocolo cefalea)',
      'Celecoxib 200 mg cada 12–24 h VO — HCSFB: comp 200 mg (PM Artrosis/Artritis Reumatoidea/CPU)',
      'Meloxicam 7,5–15 mg/día VO — HCSFB: comp 15 mg',
      'Ácido mefenámico 500 mg cada 8 h VO — HCSFB: comp 500 mg',
      '━━━ VENTAJAS SOBRE OPIOIDES ━━━',
      'Sin tolerancia ni dependencia',
      'Menor sedación',
      'Asociados a opioides reducen requerimientos en 20–30%',
      '━━━ CONTRAINDICACIONES Y PRECAUCIONES ━━━',
      'Falla renal, hipovolemia, hiperkalemia, falla hepática severa',
      'Riesgo de hemorragia digestiva o úlcera previa',
      'Broncoespasmo por aspirina, pre-eclampsia',
      'Precaución en mayores de 65 años, diabéticos, usuarios de IECA, diuréticos, betabloqueo, ciclosporina o metotrexato',
      'COX-2 selectivos (celecoxib): menor riesgo digestivo pero monitorizar PA y función renal',
    ],
  },
  {
    id: 'dolor-onco-tramadol',
    type: 'criteria',
    tab: 'Fármacos',
    color: 'orange',
    order: 31,
    title: 'Opioides débiles — Escalón 2',
    items: [
      '━━━ TRAMADOL — disponible HCSFB ━━━',
      'HCSFB: comp 50 mg, sol oral gotas 100 mg/mL (≈ 2,5 mg/gota), ampollas 100 mg/mL (todas en CPU y Programa AD y CP)',
      'Mecanismo dual: agonista opioide débil + inhibición de recaptación de noradrenalina y serotonina',
      'Útil en dolor mixto y como rescate durante titulación de esquemas',
      'Dosis VO: 50–100 mg cada 6–8 h (máx 400 mg/día)',
      'En adulto mayor o caquéctico: iniciar con 25 mg (10 gotas) cada 8 h y titular',
      'Efectos adversos frecuentes: náuseas, mareos, sudoración, sequedad bucal',
      'Precaución: no asociar con ondansetrón (antagoniza efecto analgésico) ni con ISRS (riesgo serotoninérgico)',
      '━━━ CODEÍNA — NO disponible en HCSFB ━━━',
      'En arsenal HCSFB no hay codeína. Para escalón 2 usar tramadol como primera línea',
      'Si paciente proviene con codeína desde otro centro: equianalgesia 180–200 mg codeína VO ≈ 30 mg morfina VO ≈ 100–150 mg tramadol VO',
    ],
  },
  {
    id: 'dolor-onco-opioides-potentes',
    type: 'flowchart',
    tab: 'Fármacos',
    color: 'red',
    order: 32,
    title: 'Opioides potentes — Escalón 3',
    content: 'Inhiben la liberación de neurotransmisores y la conducción postsináptica en vías nociceptivas medulares y supraespinales. La dosis inicial sugerida en pacientes naive a opioides es morfina 30–60 mg VO/día. Todos los opioides potentes están disponibles en arsenal HCSFB (Programa AD y CP).',
    details: [
      '━━━ MORFINA — opioide de referencia, disponible HCSFB ━━━',
      'HCSFB: sol oral gotas 2% (= 20 mg/mL ≈ 1 mg/gota), sol inyectable 10 mg/mL y 20 mg/mL (Programa AD y CP / Carro de paro / CPU)',
      'Dosis inicial VO: 5–10 mg cada 4 h (paciente naive, < 65 años)',
      '~En adulto mayor o caquéctico: 2,5–5 mg cada 4 h',
      '~Vía SC/EV: dosis VO dividida por 2–3 (biodisponibilidad oral ~30%)',
      'Rescate: 1/6 de la dosis diaria total, cada 1 h si es necesario',
      '~Sin dosis techo: titular según respuesta y tolerancia',
      'Formulación retard oral no disponible en HCSFB — usar fraccionamiento cada 4 h o rotar a parche de fentanilo cuando dosis estabilizada',
      '━━━ OXICODONA — disponible HCSFB ━━━',
      'HCSFB: comp 10 mg (Programa AD y CP)',
      'Dosis VO: 5–10 mg cada 4–6 h',
      '~Equianalgesia: oxicodona 15–20 mg VO ≈ morfina 30 mg VO',
      '~Mejor tolerancia digestiva y menor prurito que morfina en algunos pacientes',
      '━━━ METADONA — disponible HCSFB ━━━',
      'HCSFB: comp 10 mg (Programa AD y CP)',
      'Antagonista NMDA además de agonista opioide → útil en dolor neuropático y refractario',
      'Vida media muy variable (13–100 h): riesgo de acumulación; titulación lenta y supervisada',
      'Dosis crónica habitual: 2–4 mg cada 8 h VO',
      '~Equianalgesia variable según dosis previa de morfina (ver pestaña Rotación)',
      '~Precaución: prolonga QT — ECG basal y en titulación',
      '━━━ FENTANILO — disponible HCSFB ━━━',
      'HCSFB: parche transdérmico 25 µg/h y 50 µg/h (Programa AD y CP, alternativa a buprenorfina); ampollas 0,1 mg/2 mL y 0,5 mg/10 mL',
      'Parche: recambio cada 72 h. Indicado en dolor estable, intolerancia VO o trastornos digestivos',
      '~No usar en dolor agudo ni en titulación inicial',
      'Equianalgesia: 25 µg/h transdérmico ≈ 60 mg/día de morfina VO',
      'Citrato de fentanilo transmucoso para dolor irruptivo: NO disponible en arsenal HCSFB — usar morfina en gotas como rescate (1/6 dosis diaria)',
      '━━━ BUPRENORFINA — disponible HCSFB ━━━',
      'HCSFB: parche transdérmico 35 µg/h (Programa AD y CP/CPU)',
      'Agonista parcial: efecto techo a dosis altas',
      'Recambio cada 84 h (3,5 días)',
      'Útil en dolor crónico estable, especialmente en falla renal (no se acumula)',
      'Equianalgesia: parche 35 µg/h ≈ 30–60 mg/día de morfina VO',
    ],
  },
  {
    id: 'dolor-onco-efectos-adversos',
    type: 'criteria',
    tab: 'Fármacos',
    color: 'amber',
    order: 33,
    title: 'Efectos adversos de opioides — manejo',
    content: 'La mayoría son transitorios o controlables. Rara vez obligan a suspender el tratamiento.',
    items: [
      '━━━ SEDACIÓN ━━━',
      'Frecuente al inicio, suele remitir en pocos días',
      'Si persiste: reducir dosis o rotar opioide',
      '━━━ NÁUSEAS Y VÓMITOS ━━━',
      'Frecuentes al inicio del tratamiento oral',
      'Metoclopramida 10 mg cada 8 h VO/EV/SC (HCSFB: comp 10 mg, sol inyectable 5 mg/mL) o haloperidol 1,5 mg en la noche o cada 12 h (HCSFB: comp 1/5 mg, ampolla 5 mg/mL — CPU)',
      'Domperidona 10 mg cada 8 h VO (HCSFB: comp 10 mg, gotas 10 mg/mL, sol inyectable 10 mg/2 mL — Programa AD y CP) — alternativa cuando hay síntomas extrapiramidales por metoclopramida',
      'Ondansetrón 4–8 mg cada 8 h VO/EV (HCSFB: comp 4/8 mg, ampolla 4 mg/2 mL — Programa AD y CP/CPU) — útil en náuseas refractarias, evitar combinar con tramadol',
      'Generalmente ceden espontáneamente en 3–7 días',
      '━━━ CONSTIPACIÓN ━━━',
      'Casi universal con opioides — prevenir desde el inicio',
      'Lactulosa 15–30 mL cada 12 h VO (HCSFB: sol oral 65% — CPU)',
      'Polietilenglicol (PEG) 1 sobre disuelto en agua cada 12–24 h (HCSFB: polvo para suspensión oral — Programa AD y CP/CPU)',
      'Picosulfato de sodio 5–15 gotas en la noche (HCSFB: cápsulas 2,5 mg, gotas 7,5 mg/mL — CPU)',
      'No se desarrolla tolerancia: mantener laxantes mientras dure el opioide',
      '━━━ XEROSTOMÍA ━━━',
      'Sorbos frecuentes de agua fría, cubos de hielo, trozos de fruta congelada (piña, melón)',
      'Pastillas sin azúcar, saliva artificial',
      '━━━ MITOS A DESMENTIR ━━━',
      'No transforman al paciente en adicto cuando se usan para dolor',
      'No producen euforia en uso terapéutico',
      'No matan por depresión respiratoria si se titulan correctamente',
      'No se desarrolla tolerancia rápida que invalide su efecto analgésico',
    ],
  },

  // ── PESTAÑA 4: ROTACIÓN DE OPIOIDES ───────────────────────────────────
  {
    id: 'dolor-onco-rotacion-concepto',
    type: 'text',
    tab: 'Rotación',
    color: 'purple',
    order: 40,
    title: '¿Qué es y cuándo rotar?',
    content:
      'Rotar = cambiar de un opioide a otro cuando aparece tolerancia específica al efecto analgésico, efectos adversos intolerables o necesidad de cambio de vía. ' +
      'La tolerancia cruzada entre opioides es parcial: al cambiar de fármaco se requiere una dosis menor que la equianalgésica calculada para obtener el mismo alivio. ' +
      'Tras un mes con el nuevo opioide, suele ser posible volver al previo con menor dosis.',
  },
  {
    id: 'dolor-onco-equianalgesia',
    type: 'criteria',
    tab: 'Rotación',
    color: 'red',
    order: 41,
    title: 'Tabla de dosis equianalgésicas (referencia)',
    content: 'Equivalencias aproximadas a 30 mg de morfina oral. Al rotar usar 50–67% de la dosis equianalgésica calculada (10–25% en metadona) por tolerancia cruzada incompleta.',
    items: [
      '━━━ EQUIVALENCIA A 30 mg DE MORFINA VO ━━━',
      'Morfina VO 30 mg = Morfina SC/EV 10–15 mg',
      'Oxicodona VO 15–20 mg',
      'Hidromorfona VO 7,5 mg',
      'Hidrocodona VO 30 mg',
      'Codeína VO 180–200 mg',
      'Tramadol VO 100–150 mg',
      'Fentanilo SC/EV 0,3 mg (300 µg) — relación 1:100 con morfina parenteral',
      '━━━ FENTANILO TRANSDÉRMICO (regla práctica) ━━━',
      'Morfina VO/día ÷ 2 ≈ µg/h de parche de fentanilo',
      'Ej: 60 mg/día morfina VO → fentanilo 25 µg/h',
      'Ej: 120 mg/día morfina VO → fentanilo 50 µg/h',
      '━━━ METADONA — conversión escalonada según dosis previa de morfina ━━━',
      'Morfina VO < 200 mg/día → metadona 5 mg cada 8 h',
      'Morfina VO 200–500 mg/día → ~7% de la dosis oral de morfina, dividida en 3 tomas',
      'Morfina VO > 500 mg/día → consultar a especialista',
    ],
  },
  {
    id: 'dolor-onco-rotacion-pasos',
    type: 'flowchart',
    tab: 'Rotación',
    color: 'orange',
    order: 42,
    title: 'Procedimiento de rotación — paso a paso',
    details: [
      'Calcular la dosis total de 24 h del opioide actual',
      'Buscar la dosis equianalgésica del nuevo opioide en la vía deseada',
      'Aplicar reducción por tolerancia cruzada incompleta',
      '~Opioides convencionales: usar 50–60% de la dosis equianalgésica calculada',
      '~Metadona: usar 10–25% por riesgo de acumulación',
      'Dividir la dosis nueva total en el número de tomas correspondiente',
      'Mantener disponible dosis de rescate durante el ajuste (1/6 de la dosis diaria total)',
      'Reevaluar a las 24 h y ajustar según respuesta',
      'Vigilar especialmente sedación, depresión respiratoria y signos de abstinencia',
    ],
  },

  // ── PESTAÑA 5: COADYUVANTES ────────────────────────────────────────────
  {
    id: 'dolor-onco-coadyuvantes-tabla',
    type: 'criteria',
    tab: 'Coadyuvantes',
    color: 'green',
    order: 50,
    title: 'Coadyuvantes según indicación (con disponibilidad HCSFB)',
    content: 'Aumentan la eficacia analgésica, permiten reducir dosis de opioides y manejan dolor de mecanismo específico.',
    items: [
      '━━━ DOLOR NEUROPÁTICO ━━━',
      'Amitriptilina 12,5–100 mg/noche — HCSFB: comp 25 mg (CPU). Precaución anticolinérgica en adulto mayor',
      'Pregabalina 75–150 mg cada 12 h, titular desde 25–75 mg/noche — HCSFB: comp 75 mg (Programa AD y CP / CPU / fibromialgia / pie diabético)',
      'Carbamazepina 100–600 mg/día, especialmente en neuralgia trigeminal — HCSFB: comp 200 mg, comp lib prolongada 400 mg (PM Epilepsia)',
      'Duloxetina 30–60 mg/día, neuropatía diabética y dolor crónico musculoesquelético — HCSFB: comp 30 mg (CPU)',
      'Imipramina 25 mg/noche — HCSFB: comp 25 mg. Alternativa a amitriptilina',
      'Gabapentina: NO disponible en arsenal HCSFB. Usar pregabalina como primera línea',
      '━━━ DOLOR ÓSEO METASTÁSICO ━━━',
      'Ácido zoledrónico 4 mg EV cada 4 semanas — HCSFB: sol inyectable 4 mg/5 mL (Programa AD y CP). Corregir hipocalcemia y salud dental previa',
      'Pamidronato 60–90 mg EV cada 4 semanas — HCSFB: liofilizado 30 mg y 90 mg (Programa AD y CP). Alternativa al zoledrónico',
      'Radioterapia paliativa antiálgica (derivación a oncología radioterápica HHM)',
      'AINEs y corticoides como tratamiento concomitante',
      'Denosumab: NO disponible en HCSFB. Si falla renal severa (no candidato a bifosfonatos), evaluar derivación',
      '━━━ COMPRESIÓN NERVIOSA, EDEMA TUMORAL, HIPERTENSIÓN ENDOCRANEAL ━━━',
      'Dexametasona 16–24 mg/día VO/EV/SC, hasta 40–60 mg/día en HIC severa — HCSFB: comp 4 mg (CPU/Programa AD y CP), sol inyectable 4 mg/mL',
      'Prednisona 5–75 mg/día — HCSFB: comp 5 mg, 20 mg, susp oral 20 mg/5 mL. Alternativa oral a dexametasona',
      '━━━ DOLOR VISCERAL POR ESPASMO ━━━',
      'Escopolamina butilbromuro (Buscapina) 20 mg cada 6–8 h SC/EV — HCSFB: ampolla 20 mg/mL (CPU). Útil también para secreciones bronquiales en agonía',
      '━━━ ANSIEDAD Y COMPONENTE EMOCIONAL ━━━',
      'Lorazepam 0,5–2 mg cada 8–12 h VO — HCSFB: comp 2 mg (Programa AD y CP/CPU), comp SL 2 mg (sólo crisis de pánico), sol inyectable 4 mg/mL',
      'Clonazepam 0,5–2 mg cada 12 h VO — HCSFB: comp 0,5 mg y 2 mg',
      'Alprazolam 0,25–1 mg cada 8 h VO — HCSFB: comp 0,5 mg (CPU)',
      'Clotiazepam 5–10 mg cada 8 h VO — HCSFB: comp 10 mg (ansiedad generalizada según protocolo local HCSFB 153)',
      '━━━ DOLOR REFRACTARIO — bloqueadores NMDA ━━━',
      'Metadona como rotación de opioide (disponible HCSFB comp 10 mg)',
      'Ketamina a dosis subanestésicas: derivación a especialista en dolor (no de uso rutinario en hospital comunitario)',
    ],
  },

  // ── PESTAÑA 7: ARSENAL HCSFB (resumen) ────────────────────────────────
  {
    id: 'dolor-onco-arsenal-resumen',
    type: 'criteria',
    tab: 'Arsenal HCSFB',
    color: 'blue',
    order: 70,
    title: 'Resumen: arsenal disponible para dolor oncológico',
    content: 'Síntesis de presentaciones disponibles según Resolución Exenta N°5235 (25 oct 2023, Servicio de Salud Ñuble). Programa AD y CP = Atención Domiciliaria y Cuidados Paliativos; CPU = Cuidados Paliativos Universales.',
    items: [
      '━━━ NO OPIOIDES (ESCALÓN 1) ━━━',
      'Paracetamol comp 500 mg / gotas 100 mg/mL / sol inyectable 10 mg/mL',
      'Metamizol comp 300 mg (CPU) / sol inyectable 0,5 g/mL / supositorio 250 mg',
      'Ketoprofeno comp 50 mg (CPU)',
      'Ketorolaco comp 10/30 mg + ampolla 30 mg/mL (CPU)',
      'Diclofenaco comp 50 mg / sol inyectable 25 mg/mL / supositorio infantil 12,5 mg',
      'Ibuprofeno comp 400 mg / susp oral 200 mg/5 mL',
      'Naproxeno comp 550 mg',
      'Celecoxib comp 200 mg (CPU)',
      'Meloxicam comp 15 mg',
      'Ácido mefenámico comp 500 mg',
      '━━━ OPIOIDES DÉBILES (ESCALÓN 2) ━━━',
      'Tramadol comp 50 mg / gotas 100 mg/mL / ampollas 100 mg/mL (CPU + Programa AD y CP)',
      '━━━ OPIOIDES POTENTES (ESCALÓN 3) — todos en Programa AD y CP ━━━',
      'Morfina sol oral gotas 2% / sol inyectable 10 mg/mL y 20 mg/mL',
      'Oxicodona comp 10 mg',
      'Metadona comp 10 mg',
      'Fentanilo parche 25 µg/h y 50 µg/h / ampollas 0,1 mg/2 mL y 0,5 mg/10 mL',
      'Buprenorfina parche 35 µg/h',
      '━━━ COADYUVANTES NEUROPÁTICOS ━━━',
      'Pregabalina comp 75 mg (CPU + Programa AD y CP)',
      'Amitriptilina comp 25 mg (CPU)',
      'Duloxetina comp 30 mg (CPU)',
      'Carbamazepina comp 200 mg / lib prolongada 400 mg',
      'Imipramina comp 25 mg',
      '━━━ COADYUVANTES OTROS ━━━',
      'Dexametasona comp 4 mg / sol inyectable 4 mg/mL (CPU)',
      'Prednisona comp 5 mg y 20 mg / susp oral 20 mg/5 mL',
      'Escopolamina butilbromuro ampolla 20 mg/mL (CPU)',
      'Ácido zoledrónico sol inyectable 4 mg/5 mL (Programa AD y CP)',
      'Pamidronato liofilizado 30 mg y 90 mg (Programa AD y CP)',
      '━━━ MANEJO DE EFECTOS ADVERSOS ━━━',
      'Metoclopramida comp 10 mg / sol inyectable 5 mg/mL',
      'Domperidona comp 10 mg / gotas 10 mg/mL / sol inyectable 10 mg/2 mL',
      'Ondansetrón comp 4/8 mg / sol inyectable 4 mg/2 mL y 8 mg/4 mL',
      'Haloperidol comp 1/5 mg / sol inyectable 5 mg/mL (CPU) — útil para náuseas refractarias',
      'Lactulosa sol oral 65% (CPU)',
      'Polietilenglicol polvo (CPU)',
      'Picosulfato de sodio cápsulas 2,5 mg / gotas 7,5 mg/mL (CPU)',
      '━━━ ANSIOLÍTICOS ━━━',
      'Lorazepam comp 2 mg / SL 2 mg / sol inyectable 4 mg/mL (CPU)',
      'Clonazepam comp 0,5 mg y 2 mg',
      'Alprazolam comp 0,5 mg (CPU)',
      'Clotiazepam comp 10 mg (HCSFB 153 — ansiedad generalizada)',
      '━━━ NO DISPONIBLES EN ARSENAL HCSFB ━━━',
      'Codeína: usar tramadol como opioide débil',
      'Gabapentina: usar pregabalina como anticonvulsivante',
      'Hidromorfona: usar morfina u oxicodona',
      'Denosumab: usar bifosfonatos (zoledrónico o pamidronato)',
      'Citrato fentanilo transmucoso: para irruptivo usar morfina gotas 1/6 dosis diaria',
    ],
  },

  // ── PESTAÑA 6: ALGORITMO ───────────────────────────────────────────────
  {
    id: 'dolor-onco-mermaid',
    type: 'mermaid',
    tab: 'Algoritmo',
    color: 'blue',
    order: 60,
    title: 'Algoritmo de decisión analgésica',
    diagram: `flowchart TD
  A[Paciente con dolor oncológico] --> B[Evaluar con EVA<br/>+ mecanismo<br/>+ interferencia funcional]
  B --> C{Intensidad}
  C -->|EVA 1-3| D[Escalón 1<br/>Paracetamol / AINE / Metamizol<br/>+ coadyuvantes]
  C -->|EVA 4-6| E[Escalón 2<br/>No opioide + Tramadol o Codeína<br/>+ coadyuvantes]
  C -->|EVA 7-10| F[Escalón 3<br/>No opioide + Opioide potente<br/>Morfina / Oxicodona / Metadona / Fentanilo<br/>+ coadyuvantes]
  D --> G[Reevaluar en 24-48 h]
  E --> G
  F --> G
  G --> H{Control adecuado<br/>EVA reposo menor o igual a 3}
  H -->|Sí| I[Mantener esquema<br/>Pautar rescate 1/6 dosis diaria<br/>Vigilar efectos adversos]
  H -->|No| J{Mecanismo identificado}
  J -->|Neuropático| K[Agregar pregabalina /<br/>gabapentina / amitriptilina]
  J -->|Óseo metastásico| L[Bifosfonato +<br/>Radioterapia paliativa]
  J -->|Visceral espástico| M[Escopolamina butilbromuro]
  J -->|No claro o mixto| N[Subir escalón o<br/>aumentar dosis 25-50%]
  K --> G
  L --> G
  M --> G
  N --> G
  H -->|Refractario tras optimización| O[Rotación de opioide<br/>50-67% dosis equianalgésica]
  O --> G
  H -->|Refractario al 4to nivel| P[Derivación a Unidad de Dolor<br/>Bloqueos / Neurolisis /<br/>Catéter neuroaxial]`,
  },
];

// ── INSERT ───────────────────────────────────────────────────────────────
console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  DOLOR ONCOLÓGICO v1 — ${APPLY ? '⚡ APPLY MODE' : '🔍 DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════\n`);

console.log(`📋 Topic: ${TOPIC_NAME}`);
console.log(`   Categoría: Dependencia Severa, Cuidados Paliativos y Alivio del Dolor`);
console.log(`   Bloques: ${content_blocks.length}`);
console.log(`   Pestañas: ${[...new Set(content_blocks.map(b => b.tab).filter(Boolean))].join(' | ')}\n`);

// Verificar idempotencia
const { data: existing } = await supabase
  .from('topics').select('id, name').eq('category_id', CATEGORY_ID).ilike('name', `%dolor oncol%`);
if (existing && existing.length > 0) {
  console.log(`⚠️  Ya existe un topic similar:`);
  existing.forEach(t => console.log(`   ${t.id} — ${t.name}`));
  if (!APPLY) console.log('\n   (Dry-run: no se modificará. Para reemplazar, usar update script)');
}

if (!APPLY) {
  console.log('\n⚠️  Modo dry-run. Agrega --apply para insertar en la base de datos.');
  process.exit(0);
}

if (existing && existing.length > 0) {
  console.error('❌ Ya existe — abortando para evitar duplicado. Eliminar el existente primero o usar update.');
  process.exit(1);
}

const { data, error } = await supabase.from('topics').insert({
  name: TOPIC_NAME,
  category_id: CATEGORY_ID,
  content_blocks,
  status: 'published',
  has_local_protocol: false,
  authors: {
    elaborado: ['Claudio Fierro — Pontificia Universidad Católica de Chile'],
    revisado: ['Alejandra Palma, Paulina Taboada, Flavio Nervi (eds.) — Medicina Paliativa y Cuidados Continuos'],
    aprobado: [],
  },
}).select().single();

if (error) {
  console.error(`❌ Error: ${error.message}`);
  process.exit(1);
}

console.log(`\n✅ Topic creado: ${data.id}`);
console.log(`   Ver en: /Category?id=${CATEGORY_ID}`);
