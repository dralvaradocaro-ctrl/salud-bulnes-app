/**
 * Crea topic "Vía Subcutánea en Cuidados Paliativos" en categoría
 * Dependencia Severa, Cuidados Paliativos y Alivio del Dolor.
 *
 * Fuente: E.U. Paula Ossandón Lira. Vía Subcutánea.
 * Pontificia Universidad Católica de Chile, 2020.
 *
 * Uso:  node scripts/create-paliativos-via-subcutanea-v1.mjs
 *       node scripts/create-paliativos-via-subcutanea-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

const CATEGORY_ID = '696ea6ff245ef362de4f4320';
const TOPIC_NAME  = 'Vía Subcutánea en Cuidados Paliativos';

const TOPIC_DESCRIPTION =
  'Síntesis del documento de la E.U. Paula Ossandón Lira (Pontificia Universidad Católica de Chile) sobre administración de fármacos e hidratación por vía subcutánea: indicaciones, técnica, hipodermoclisis y compatibilidad — adaptado al arsenal HCSFB.';

const content_blocks = [
  // ── CITA / FUENTE (discreta, dentro de la primera pestaña) ─────────────
  {
    id: 'sc-fuente',
    type: 'text',
    tab: 'Indicaciones',
    color: 'gray',
    order: 5,
    title: 'Fuente',
    content:
      'E.U. Paula Ossandón Lira. Vía Subcutánea. Material docente, ' +
      'Pontificia Universidad Católica de Chile, 2020.',
  },

  // ── PESTAÑA 1: INDICACIONES ────────────────────────────────────────────
  {
    id: 'sc-concepto',
    type: 'text',
    tab: 'Indicaciones',
    color: 'blue',
    order: 10,
    title: 'Definición y fundamento',
    content:
      'La vía subcutánea es la administración de sustancias (fármacos o hidratación) en el tejido celular subcutáneo. ' +
      'En cuidados paliativos es la ruta de elección cuando no se dispone de vía oral, por ser segura, poco invasiva, de fácil instalación y manejo, con biodisponibilidad similar a la endovenosa para la mayoría de los fármacos paliativos. ' +
      'Permite mantener al paciente en domicilio o servicio sin necesidad de hospitalización y favorece su autonomía. ' +
      'Los fármacos pasan por difusión pasiva al torrente sanguíneo evitando el primer paso hepático; alcanzan niveles plasmáticos en 15–30 minutos.',
  },
  {
    id: 'sc-indicaciones',
    type: 'criteria',
    tab: 'Indicaciones',
    color: 'green',
    order: 11,
    title: 'Indicaciones de uso',
    items: [
      'Disfagia severa u odinofagia que impide la ingesta oral',
      'Náuseas y vómitos persistentes',
      'Malabsorción intestinal',
      'Fístulas esófago-traqueales o entero-cutáneas',
      'Alteraciones de conciencia (sopor, coma)',
      'Debilidad extrema que no permite tragar comprimidos',
      'Síndrome de obstrucción intestinal',
      'Necesidad de dosis altas o múltiples vías que dificultan VO',
      'Situación de últimos días (agonía)',
      'Incumplimiento del régimen oral por dificultad funcional',
    ],
  },
  {
    id: 'sc-contraindicaciones',
    type: 'alert',
    tab: 'Indicaciones',
    color: 'red',
    order: 12,
    title: 'Contraindicaciones',
    content:
      'Edema severo o anasarca; hipoperfusión periférica o estado de shock; trombocitopenia severa con riesgo hemorrágico; alteraciones locales en el sitio de inserción (infección, induración, infiltración tumoral, radioterapia activa, pérdida de continuidad cutánea). En domicilio: situación social no apta o claudicación familiar sin posibilidad de supervisión.',
  },
  {
    id: 'sc-ventajas',
    type: 'criteria',
    tab: 'Indicaciones',
    color: 'amber',
    order: 13,
    title: 'Ventajas y limitaciones',
    items: [
      '━━━ VENTAJAS ━━━',
      'Segura, fácil instalación y manipulación',
      'Poco dolorosa, mínimo riesgo de complicaciones sistémicas',
      'Evita primer paso hepático; biodisponibilidad similar a EV',
      'Permite uso domiciliario',
      'Menor riesgo de infección que vía EV o IM',
      'Vía durable: catéter puede permanecer días o semanas',
      'Permite mezcla de varios fármacos compatibles',
      'Bajo costo',
      '━━━ LIMITACIONES ━━━',
      'Volumen máximo en bolo: 2–3 mL',
      'No apta para urgencias que requieran administración rápida de grandes volúmenes',
      'Número limitado de fármacos compatibles (algunos irritantes o liposolubles contraindicados)',
      'Reacción local al fármaco o material en menos del 5% de los casos',
      'Baja tolerancia en pacientes muy desnutridos o caquécticos extremos',
    ],
  },

  // ── PESTAÑA 2: TÉCNICA ─────────────────────────────────────────────────
  {
    id: 'sc-zonas',
    type: 'criteria',
    tab: 'Técnica',
    color: 'purple',
    order: 20,
    title: 'Zonas de inserción',
    content: 'Requiere espesor mínimo de 1–2,5 cm de tejido subcutáneo.',
    items: [
      '━━━ ZONAS DE ELECCIÓN ━━━',
      'Zona escapular: gran superficie, tolera grandes volúmenes (hipodermoclisis); de elección en pacientes inquietos o desorientados (difícil acceso al sitio)',
      'Zona infraclavicular: superficie menor, ideal para fármacos. Cómoda y de fácil supervisión. Evitar en patología pulmonar o riesgo de neumotórax',
      'Pared abdominal lateral: gran superficie, ideal para hipodermoclisis y pacientes caquécticos. Evitar zona periumbilical',
      'Zona deltoidea: solo bolos pequeños, no apta para hipodermoclisis',
      'Cara anterior del muslo: alternativa para hipodermoclisis, puede ser más dolorosa',
      '━━━ ZONAS A EVITAR ━━━',
      'Prominencias óseas y pliegues',
      'Tejido mamario, área periumbilical',
      'Zonas con tumor, infección, induración o inflamación',
      'Piel lesionada (abrasiones, quemaduras, hematomas, cicatrices)',
      'Áreas con edema, linfedema o ascitis',
      'Sitios irradiados (vasos linfáticos destruidos)',
      'Áreas con incisión quirúrgica previa',
    ],
  },
  {
    id: 'sc-materiales',
    type: 'criteria',
    tab: 'Técnica',
    color: 'gray',
    order: 21,
    title: 'Materiales para instalación',
    items: [
      'Guantes de procedimiento',
      'Catéter de Vialón o Teflón #22 (o #24 en pacientes caquécticos) — preferir sobre mariposa metálica por mayor durabilidad y menor reacción cutánea',
      'Tapón antirreflujo o tapón amarillo',
      'Apósito transparente (Tegaderm®)',
      'Algodón con alcohol 70° o clorhexidina al 2%',
      'Jeringa de 1–5 mL',
      'Caja de eliminación de cortopunzantes',
      'Lápiz o plumón para fechar la fijación',
    ],
  },
  {
    id: 'sc-procedimiento',
    type: 'flowchart',
    tab: 'Técnica',
    color: 'blue',
    order: 22,
    title: 'Procedimiento de instalación paso a paso',
    details: [
      'Reunir material y explicar el procedimiento al paciente',
      'Lavado clínico de manos y colocar guantes de procedimiento',
      'Elegir zona según el tratamiento y la condición del paciente',
      'Aplicar antiséptico en movimientos espirales hacia afuera y dejar secar',
      'Con la mano no dominante pellizcar la piel formando un pliegue de 2 cm',
      'Introducir la aguja con bisel hacia arriba en ángulo de 45–60° en un movimiento rápido',
      '~En pacientes caquécticos disminuir a 30°',
      'Soltar el pliegue cutáneo',
      'Retirar la aguja interna dejando solo el catéter de teflón/vialón en el tejido',
      'Eliminar inmediatamente material cortopunzante',
      'Aspirar con la jeringa (opcional). Si refluye sangre: retirar y descartar — recolocar en otro sitio',
      'Conectar tapón antirreflujo y fijar con apósito transparente',
      'Escribir fecha de instalación y firma sobre el apósito',
      'Dejar cómodo al paciente, retirar guantes y lavarse las manos',
      'Registrar en ficha clínica',
    ],
  },
  {
    id: 'sc-cuidados',
    type: 'criteria',
    tab: 'Técnica',
    color: 'green',
    order: 23,
    title: 'Cuidados y mantención de la vía',
    items: [
      'Observar diariamente: enrojecimiento, induración, signos de infección, fugas, reflujo de sangre o desconexión',
      'Registrar siempre la fecha de instalación visible en el apósito',
      'Si la vía es de uso exclusivo de un fármaco: rotular para evitar mezcla',
      'Si se sospecha reducción de absorción (induración, edema local): cambiar de zona',
      'No exponer la vía a fuentes de calor o frío directas (alteran velocidad de infusión)',
      'Las vías con dexametasona exclusiva: cambiar cada 7 días por riesgo de precipitación',
      'Las demás vías pueden permanecer varios días o semanas mientras estén funcionantes',
      'Familia y paciente deben ser entrenados en signos de alarma e identificación visual de la vía',
    ],
  },

  // ── PESTAÑA 3: MODOS DE ADMINISTRACIÓN ─────────────────────────────────
  {
    id: 'sc-modos',
    type: 'flowchart',
    tab: 'Administración',
    color: 'orange',
    order: 30,
    title: 'Modos de administración',
    details: [
      '━━━ INFUSIÓN INTERMITENTE (BOLOS) ━━━',
      'Volumen máximo por bolo: 2–3 mL',
      '~Si se usa catéter de vialón/teflón: lavar con 0,2–0,5 mL de SF 0,9% post-administración',
      '~En insuflón no requiere lavado posterior',
      '~Permite ajuste de dosis según necesidad (rescates)',
      '━━━ INFUSIÓN CONTINUA — FÁRMACOS ━━━',
      'Velocidad: 2–5 mL/h (máx 7 mL/h)',
      '~Mantiene niveles plasmáticos constantes y permite mezcla de fármacos',
      '~Permite agregar bolos extra de rescate sin interrumpir',
      '━━━ INFUSIÓN CONTINUA — HIDRATACIÓN ━━━',
      'Velocidad sugerida: 40–60 mL/h (máx 80 mL/h)',
      '~Volumen máximo: 1000–1500 mL en 24 h por sitio',
      '~Sin bomba de infusión: regular a aproximadamente 14 gotas/min',
    ],
  },
  {
    id: 'sc-dispositivos',
    type: 'criteria',
    tab: 'Administración',
    color: 'purple',
    order: 31,
    title: 'Dispositivos de infusión',
    items: [
      '━━━ INFUSORES ELASTOMÉRICOS (monouso) ━━━',
      'Desechables, ambulatorios, hasta 4 fármacos compatibles',
      'Cálculo de volumen: vt (mL) = flujo (mL/h) × 24 h × número de días',
      'Inspeccionar diariamente: vaciamiento progresivo, signos de cristalización',
      'Proteger de la luz si contiene fármaco fotosensible (morfina, dexametasona, fentanilo, haloperidol, furosemida)',
      'Asegurar el cebado del circuito antes de iniciar',
      '━━━ INFUSORES MECÁNICOS ━━━',
      'Sistema de resorte que ejerce presión sobre la bolsa',
      'Reutilizables — solo se cambia la bolsa',
      '━━━ BOMBAS DE JERINGA ━━━',
      'Programables, infusión controlada desde una jeringa',
      '━━━ BOMBAS PERISTÁLTICAS ━━━',
      'Electrónicas con programación digital, mayor precisión',
    ],
  },

  // ── PESTAÑA 4: HIPODERMOCLISIS ─────────────────────────────────────────
  {
    id: 'sc-hipodermoclisis',
    type: 'text',
    tab: 'Hipodermoclisis',
    color: 'blue',
    order: 40,
    title: 'Hipodermoclisis',
    content:
      'Administración de hidratación parenteral por vía subcutánea. Útil para corrección hídrica y electrolítica en deshidratación leve a moderada. ' +
      'Las complicaciones suelen ser locales y prevenibles ajustando velocidad y solución; la más frecuente es el edema local (con frecuencia indicador de que se debe rotar el sitio). ' +
      'No es apropiada para todos los pacientes — al final de la vida la decisión debe individualizarse considerando objetivos clínicos y deseos del paciente y familia.',
  },
  {
    id: 'sc-soluciones',
    type: 'criteria',
    tab: 'Hipodermoclisis',
    color: 'green',
    order: 41,
    title: 'Soluciones recomendadas',
    items: [
      '━━━ DE ELECCIÓN ━━━',
      'Suero fisiológico 0,9% (HCSFB: sol inyectable 0,9%) — primera línea',
      'Suero glucosalino — alternativa isotónica',
      '━━━ ALTERNATIVAS ━━━',
      'Ringer Lactato (HCSFB: sol inyectable, carro de paro) — bien tolerado, evidencia limitada',
      'Suero glucosado al 5% solo si se agregan electrolitos (mal tolerado puro: alto riesgo de edema y reacciones)',
      '━━━ CONTRAINDICADAS ━━━',
      'Soluciones hiperosmolares puras (riesgo de daño tisular)',
      'Soluciones hipotónicas sin electrolitos (riesgo de edema masivo y reacción local)',
    ],
  },
  {
    id: 'sc-hipo-parametros',
    type: 'criteria',
    tab: 'Hipodermoclisis',
    color: 'amber',
    order: 42,
    title: 'Parámetros de infusión',
    items: [
      'Volumen máximo por sitio: 1000–1500 mL en 24 h',
      'Si se requiere mayor volumen: utilizar dos sitios distintos (puede llegar a 2000–3000 mL/24 h)',
      'Velocidad habitual: 40–60 mL/h',
      'Velocidad máxima tolerada: 80 mL/h',
      'Sin bomba: aproximadamente 14 gotas/min',
      'Vigilar aparición de edema local: si excesivo, reducir velocidad o cambiar sitio',
    ],
  },

  // ── PESTAÑA 5: FÁRMACOS Y MEZCLAS ──────────────────────────────────────
  {
    id: 'sc-farmacos-criterios',
    type: 'text',
    tab: 'Fármacos',
    color: 'blue',
    order: 50,
    title: 'Criterios para selección de fármacos',
    content:
      'Idealmente: hidrosolubles, pH neutro, bajo peso molecular, baja viscosidad. ' +
      'Evitar excipientes irritantes (glicerina, propilenglicol, etanol). ' +
      'Pocos fármacos tienen autorización formal para vía SC, pero existe amplia experiencia clínica de uso seguro y eficaz, frecuentemente en mezclas combinadas.',
  },
  {
    id: 'sc-farmacos-uso-frecuente',
    type: 'flowchart',
    tab: 'Fármacos',
    color: 'green',
    order: 51,
    title: 'Fármacos de uso frecuente por vía SC (con disponibilidad HCSFB)',
    details: [
      '━━━ MORFINA — disponible HCSFB ━━━',
      'HCSFB: sol inyectable 10 mg/mL y 20 mg/mL (Programa AD y CP / CPU)',
      'Inicio de acción: 15–30 min; peak 30–60 min',
      'Fotosensible — proteger de la luz',
      'Compatible con la mayoría de fármacos paliativos en mezcla',
      'Efectos locales leves: prurito, eritema, rash (poco frecuentes)',
      '━━━ MIDAZOLAM — disponible HCSFB ━━━',
      'HCSFB: sol inyectable 5 mg/mL (carro de paro)',
      'Única benzodiacepina hidrosoluble — primera elección por vía SC',
      'Buena biodisponibilidad y tolerancia, escaso riesgo de depresión respiratoria',
      'Compatible con: morfina, metadona, fentanilo, tramadol, haloperidol, escopolamina, metoclopramida, ondansetrón',
      'Incompatible con: dexametasona, ketorolaco, ranitidina',
      '━━━ METOCLOPRAMIDA — disponible HCSFB ━━━',
      'HCSFB: sol inyectable 5 mg/mL',
      'Dosis subcutánea = dosis oral = dosis EV',
      '~En insuficiencia renal reducir 50%',
      'Compatible con: morfina, metadona, fentanilo, tramadol, midazolam, haloperidol, dexametasona, clonazepam, ondansetrón',
      'Riesgo de precipitación con otros — preferir vía exclusiva si es posible',
      '━━━ ESCOPOLAMINA BUTILBROMURO (BUSCAPINA) — disponible HCSFB ━━━',
      'HCSFB: ampolla 20 mg/mL (CPU)',
      'Dosis: 20 mg cada 6–8 h SC o infusión continua 60–120 mg/24 h',
      'Indicaciones SC: secreciones bronquiales en agonía, dolor visceral cólico, oclusión intestinal',
      'Compatible con: morfina, fentanilo, tramadol, haloperidol, midazolam, metoclopramida, dexametasona, clonazepam',
      '━━━ KETOROLACO — disponible HCSFB ━━━',
      'HCSFB: ampolla 30 mg/mL (CPU)',
      'AINE mejor tolerado por vía SC',
      'Vía exclusiva por riesgo de precipitación',
      'Inyección lenta para reducir irritación',
      'Incompatible con: haloperidol, midazolam',
      '━━━ HALOPERIDOL — disponible HCSFB ━━━',
      'HCSFB: ampolla 5 mg/mL (CPU)',
      'Equivalencia oral:SC = 1:1',
      'Fotosensible',
      'Compatible con: morfina, metadona, fentanilo, tramadol, midazolam, escopolamina, metoclopramida, ondansetrón, clonazepam',
      'Incompatible con: dexametasona, ketorolaco',
      '~A dosis ≥ 15 mg/día puede precipitar con escopolamina ≥ 30 mg/día — diluir con agua bidestilada',
      '━━━ FENTANILO — disponible HCSFB ━━━',
      'HCSFB: ampollas 0,1 mg/2 mL y 0,5 mg/10 mL (Programa AD y CP)',
      'Bien tolerado en infusión continua SC',
      'Equivalencia: 1 mg morfina SC = 10 µg fentanilo SC',
      'Compatible con: dexametasona, haloperidol, midazolam, escopolamina, metoclopramida',
      '━━━ DEXAMETASONA — disponible HCSFB ━━━',
      'HCSFB: sol inyectable 4 mg/mL (CPU)',
      'Vía exclusiva recomendada por alta tasa de precipitación',
      'Si se mezcla: agregar al final, sobre la mayor cantidad de diluyente posible',
      'Inspeccionar la mezcla antes y durante la infusión',
      'Cambiar la vía cada 7 días por acumulación local',
      'Incompatible con: haloperidol, midazolam',
      '━━━ CEFTRIAXONA — disponible HCSFB ━━━',
      'HCSFB: polvo para sol inyectable 1 g',
      'Biodisponibilidad SC: 100%; uso seguro y eficaz para infecciones en cuidados paliativos',
      'Reconstituir y diluir en 100 mL de SF 0,9%, pasar en aproximadamente 20 min',
      'Vía exclusiva — no mezclar',
      '━━━ CLONAZEPAM — disponible HCSFB ━━━',
      'HCSFB: comp 0,5/2 mg (no inyectable en arsenal — uso por vía oral o SL)',
      'Si se cuenta con ampollas: diluir con SF 0,9% para bolo. Equivalencia oral:SC = 1:1',
      'Compatible con: morfina, metadona, metoclopramida, haloperidol, dexametasona, escopolamina',
      '━━━ ONDANSETRÓN — disponible HCSFB ━━━',
      'HCSFB: ampollas 4 mg/2 mL y 8 mg/4 mL (Programa AD y CP / CPU)',
      'Compatible con: morfina, dexametasona, metoclopramida',
      'NO mezclar con tramadol (antagoniza efecto analgésico)',
      '━━━ FUROSEMIDA — disponible HCSFB ━━━',
      'HCSFB: sol inyectable 20 mg/mL (carro de paro)',
      'Fotosensible — proteger',
      'Vía exclusiva, infusión continua mejor tolerada que bolos',
      'Mejor tolerancia en zona pectoral que en extremidades',
    ],
  },
  {
    id: 'sc-mezclas',
    type: 'criteria',
    tab: 'Fármacos',
    color: 'orange',
    order: 52,
    title: 'Mezclas de fármacos en infusor',
    items: [
      '━━━ PRINCIPIOS GENERALES ━━━',
      'Idealmente 2–3 fármacos por mezcla (máx 4)',
      'A más fármacos, mayor riesgo de precipitación e ineficacia',
      'Diluyente preferido: suero fisiológico 0,9%',
      'Alternativa: agua estéril inyectable (puede causar dolor por hipotonicidad)',
      'Inspeccionar visualmente la mezcla antes y durante la infusión: turbidez persistente o cristales = incompatible, descartar',
      '━━━ MEZCLA CLÁSICA EN AGONÍA (compatible) ━━━',
      'Morfina + Midazolam + Haloperidol + Escopolamina butilbromuro + Metoclopramida',
      '━━━ INCOMPATIBILIDADES FRECUENTES ━━━',
      'Dexametasona + Haloperidol',
      'Dexametasona + Midazolam',
      'Haloperidol + Ketorolaco',
      'Midazolam + Ketorolaco',
      'Si dos fármacos requeridos son incompatibles: usar dos vías SC distintas, rotuladas claramente',
      '━━━ FÁRMACOS CONTRAINDICADOS POR VÍA SC ━━━',
      'Diazepam (liposoluble, irritante, riesgo de necrosis tisular)',
      'Clorpromazina (necrosis en sitio de inserción)',
      'Cloruro de potasio en bolo (irritante severo)',
      'Metamizol (irritación local marcada)',
    ],
  },

  // ── PESTAÑA 6: COMPLICACIONES ──────────────────────────────────────────
  {
    id: 'sc-complicaciones',
    type: 'criteria',
    tab: 'Complicaciones',
    color: 'red',
    order: 60,
    title: 'Complicaciones y manejo',
    items: [
      '━━━ LOCALES (las más frecuentes) ━━━',
      'Eritema, induración, dolor o calor local: rotar sitio, evaluar fármaco irritante',
      'Edema local: reducir velocidad de infusión o cambiar zona',
      'Hematoma: presión local, recolocar en otro sitio',
      'Reflujo de sangre o líquido: retirar la vía y reinstalar',
      'Crepitación o absceso: retirar inmediatamente, evaluar tratamiento antibiótico',
      'Cristalización de mezcla: retirar la vía y revisar compatibilidad',
      '━━━ SISTÉMICAS (raras) ━━━',
      'Reacción alérgica al fármaco o material del catéter (< 5%)',
      'Sin riesgo de hipervolemia, hiponatremia o paro como en EV (perfil de seguridad superior)',
      '━━━ FALLA DE LA VÍA ━━━',
      'Salida accidental: reinstalar en zona alternativa',
      'Desconexión del infusor: revisar conexiones, reiniciar tras verificar permeabilidad',
      'Reducción de absorción percibida: rotar zona; descartar tejido lesionado o tumor infiltrante',
    ],
  },

  // ── PESTAÑA 7: ALGORITMO ───────────────────────────────────────────────
  {
    id: 'sc-mermaid',
    type: 'mermaid',
    tab: 'Algoritmo',
    color: 'blue',
    order: 70,
    title: 'Algoritmo de decisión: cuándo y cómo usar vía SC',
    diagram: `flowchart TD
  A[Paciente paliativo<br/>requiere terapia parenteral] --> B{Vía oral disponible<br/>y funcional?}
  B -->|Sí| C[Mantener VO<br/>vía de elección]
  B -->|No| D{Contraindicación SC?<br/>edema masivo / shock /<br/>infección local}
  D -->|Sí| E[Vía endovenosa<br/>o central]
  D -->|No| F[Elegir vía subcutánea]
  F --> G{Tipo de uso}
  G -->|Bolos intermitentes| H[Catéter teflón #22<br/>Volumen menor o igual a 3 mL/bolo<br/>Lavar con 0,2-0,5 mL SF post]
  G -->|Infusión continua fármacos| I[Infusor elastomérico<br/>2-5 mL/h máx 7 mL/h<br/>Mezcla compatible 2-3 fármacos]
  G -->|Hidratación| J[Hipodermoclisis<br/>SF 0,9% 40-60 mL/h<br/>máx 1000-1500 mL/24h por sitio]
  H --> K[Verificar compatibilidad<br/>de fármacos]
  I --> K
  J --> L[Vigilar edema local<br/>Rotar sitio si excesivo]
  K --> M{Mezcla compatible?}
  M -->|Sí| N[Administrar<br/>y monitorizar]
  M -->|No| O[Vías separadas<br/>rotuladas]
  O --> N
  N --> P[Inspección diaria:<br/>signos locales,<br/>fugas, desconexión]
  L --> P
  P --> Q{Alteración local?<br/>induración, dolor,<br/>infección, mala absorción}
  Q -->|Sí| R[Rotar zona<br/>Reinstalar nueva vía]
  Q -->|No| S[Mantener vía<br/>cambio cada 7 días si dexametasona<br/>varios días/semanas otros]
  R --> P`,
  },
];

// ── INSERT ───────────────────────────────────────────────────────────────
console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  VÍA SUBCUTÁNEA v1 — ${APPLY ? '⚡ APPLY MODE' : '🔍 DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════\n`);

console.log(`📋 Topic: ${TOPIC_NAME}`);
console.log(`   Bloques: ${content_blocks.length}`);
console.log(`   Pestañas: ${[...new Set(content_blocks.map(b => b.tab).filter(Boolean))].join(' | ')}\n`);

const { data: existing } = await supabase
  .from('topics').select('id, name').eq('category_id', CATEGORY_ID).ilike('name', `%subcut%`);
if (existing && existing.length > 0) {
  console.log(`⚠️  Ya existe:`);
  existing.forEach(t => console.log(`   ${t.id} — ${t.name}`));
}

if (!APPLY) {
  console.log('\n⚠️  Modo dry-run. Agrega --apply para insertar.');
  process.exit(0);
}

if (existing && existing.length > 0) {
  console.error('❌ Ya existe — abortando.');
  process.exit(1);
}

const { data, error } = await supabase.from('topics').insert({
  name: TOPIC_NAME,
  category_id: CATEGORY_ID,
  description: TOPIC_DESCRIPTION,
  content_blocks,
  status: 'published',
  has_local_protocol: false,
  authors: {
    elaborado: ['E.U. Paula Ossandón Lira — Pontificia Universidad Católica de Chile'],
    revisado: [],
    aprobado: [],
  },
}).select().single();

if (error) {
  console.error(`❌ Error: ${error.message}`);
  process.exit(1);
}

console.log(`\n✅ Topic creado: ${data.id}`);
console.log(`   Ver en: /Category?id=${CATEGORY_ID}`);
