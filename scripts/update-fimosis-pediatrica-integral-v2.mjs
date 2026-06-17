/**
 * Actualiza "Manejo de la Fimosis Pediátrica" con una estructura integral.
 *
 * Fuentes base:
 * - MINSAL Chile, Orientación Técnica Manejo de Fimosis Pediátrica, Res. Ex. 142/2025.
 * - RCH Melbourne, Clinical Practice Guideline "The penis and foreskin", actualizada Sep 2025.
 * - EAU Paediatric Urology Guidelines, sección Phimosis and penile skin abnormalities.
 * - Cochrane Database Syst Rev 2024: topical corticosteroids for treating phimosis in boys.
 *
 * Uso:
 *   node --env-file=.env scripts/update-fimosis-pediatrica-integral-v2.mjs
 *   node --env-file=.env scripts/update-fimosis-pediatrica-integral-v2.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');
const TOPIC_ID = '700bdcc2-c0ff-446d-8059-07d8150998eb';
const TODAY = new Date().toISOString();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

const content_blocks = [
  {
    id: 'fimo-resumen-operativo',
    tab: 'fimo_protocolo',
    type: 'alert',
    color: 'blue',
    order: 1,
    title: 'Mensaje operativo',
    content: 'La no retractilidad del prepucio en lactantes y niños pequeños suele ser fisiológica. La decisión inicial no es “derivar o circuncidar”, sino distinguir desarrollo normal, fimosis sintomática, fimosis cicatricial/BXO y urgencias urológicas.',
    layout_position: 'main',
  },
  {
    id: 'fimo-definiciones-clave',
    tab: 'fimo_protocolo',
    subtab: 'fimo_dx',
    type: 'criteria',
    color: 'blue',
    order: 2,
    title: 'Definiciones clave',
    content: 'El diagnóstico es clínico y se basa en historia y examen físico cuidadoso, sin retracción forzada.',
    items: [
      'Prepucio no retráctil fisiológico: variante normal por adherencias balanoprepuciales y anillo prepucial estrecho propio del desarrollo.',
      'Fimosis patológica: estrechez cicatricial del anillo prepucial, usualmente con anillo blanquecino/fibroso, pérdida de retractilidad previamente lograda, síntomas persistentes o mala respuesta a corticoide.',
      'Adherencias balanoprepuciales y esmegma: hallazgos normales de separación progresiva; no requieren exámenes, separación manual ni derivación por sí solos.',
      'Balonamiento miccional: puede ser fisiológico; tratar solo si es persistente/problemático, asociado a goteo, chorro fino, infecciones o mala higiene.',
      'BXO o liquen escleroso: sospechar ante piel blanquecina, atrófica, cicatricial, fisuras, compromiso del meato o fimosis rígida. Requiere evaluación por cirugía/urología pediátrica.',
      'Parafimosis: prepucio retraído que no vuelve a cubrir el glande; es urgencia por riesgo de edema, isquemia y necrosis.',
    ],
    layout_position: 'main',
  },
  {
    id: 'fimo-evaluacion-inicial',
    tab: 'fimo_protocolo',
    subtab: 'fimo_dx',
    type: 'criteria',
    color: 'indigo',
    order: 3,
    title: 'Evaluación inicial en APS / policlínico',
    items: [
      'Edad del niño y evolución: nunca retráctil vs pérdida de retractilidad luego de haber sido retráctil.',
      'Síntomas: dolor, disuria, goteo posmiccional, chorro fino, dificultad para orinar, retención, sangrado o fisuras.',
      'Infecciones: balanitis/balanopostitis, celulitis, fiebre, ITU recurrente o cultivos previos.',
      'Examen: inspección suave del anillo prepucial, glande visible si retrae sin dolor, cicatriz blanquecina, fisuras, secreción, edema, eritema, meato puntiforme o estenosis.',
      'No solicitar exámenes de rutina para fimosis aislada. Orina completa/urocultivo solo si fiebre, síntomas urinarios sugerentes o sospecha de ITU.',
      'Registrar si hubo retracción forzada previa, uso de tratamientos, adherencia y número/duración de ciclos de corticoide.',
    ],
    layout_position: 'main',
  },
  {
    id: 'fimo-red-flags',
    tab: 'fimo_protocolo',
    subtab: 'fimo_dx',
    type: 'alert',
    color: 'red',
    order: 4,
    title: 'Signos de alarma',
    content: 'Derivar o resolver en urgencia si hay retención urinaria, parafimosis, coloración azul/negra o tejido distal isquémico, pene rojo e hinchado con fiebre, celulitis extensa, dolor intenso progresivo, sospecha de abuso/trauma, priapismo o lesión con cierre/zipper que compromete glande.',
    layout_position: 'main',
  },
  {
    id: 'fimo-asintomatica-menor6',
    tab: 'fimo_protocolo',
    subtab: 'fimo_asintomatica',
    type: 'criteria',
    color: 'green',
    order: 5,
    title: 'Niño asintomático menor de 6 años',
    content: 'Conducta principal: educación y observación. La evolución espontánea es la regla.',
    items: [
      'No derivar por prepucio no retráctil aislado.',
      'No indicar exámenes ni controles seriados solo por no retractilidad.',
      'No forzar retracción ni separar adherencias.',
      'Educar higiene: lavar por fuera; cuando retraiga naturalmente, retraer suave durante el baño y volver siempre el prepucio a su posición.',
      'Explicar que esmegma, adherencias y balonamiento leve pueden ser parte del desarrollo normal.',
      'Consultar si aparecen dolor persistente, infecciones repetidas, chorro fino, retención, fiebre o cambios de coloración.',
    ],
    layout_position: 'main',
  },
  {
    id: 'fimo-asintomatica-mayor6',
    tab: 'fimo_protocolo',
    subtab: 'fimo_asintomatica',
    type: 'criteria',
    color: 'emerald',
    order: 6,
    title: 'Asintomático desde los 6 años',
    content: 'MINSAL permite explorar manejo médico conservador para reducir derivaciones tardías y cirugía innecesaria.',
    items: [
      'Ofrecer corticoide tópico si la familia desea tratamiento o si preocupa persistencia de anillo estrecho.',
      'Realizar ciclos completos y bien explicados antes de declarar fracaso terapéutico.',
      'Si tras tratamiento queda no retráctil pero asintomático y sin cicatriz/BXO: continuar observación y educación.',
      'Si se completan al menos 2 ciclos bien hechos sin respuesta o con recidiva significativa en mayor de 6 años: derivar a cirugía/urología pediátrica según red.',
    ],
    layout_position: 'main',
  },
  {
    id: 'fimo-sintomatica-clasificacion',
    tab: 'fimo_protocolo',
    subtab: 'fimo_sintomatica',
    type: 'criteria',
    color: 'amber',
    order: 7,
    title: 'Fimosis sintomática: clasificar antes de tratar',
    items: [
      'Síntomas leves/intermitentes sin cicatriz: dolor al intentar retraer, higiene dificultosa, balanitis aislada, balonamiento molesto o goteo posmiccional.',
      'Síntomas urinarios relevantes: chorro fino persistente, esfuerzo miccional, goteo importante, disuria recurrente o ITU.',
      'Sospecha cicatricial/BXO: anillo blanco rígido, fisuras, sangrado con mínima tracción, estenosis meatal, piel atrófica o fimosis adquirida.',
      'Urgencia: parafimosis, retención urinaria, isquemia, fiebre con pene rojo/hinchado o celulitis.',
    ],
    layout_position: 'main',
  },
  {
    id: 'fimo-sintomatica-conducta',
    tab: 'fimo_protocolo',
    subtab: 'fimo_sintomatica',
    type: 'flowchart',
    color: 'blue',
    order: 8,
    title: 'Conducta en fimosis sintomática no urgente',
    details: [
      'Descartar red flags y signos de BXO/cicatriz marcada.',
      'Si no hay BXO ni urgencia: iniciar corticoide tópico + retracción gentil sin dolor.',
      'Controlar técnica, adherencia y respuesta al finalizar el ciclo.',
      'Si resuelve: alta con higiene y retracción suave habitual.',
      'Si mejora parcialmente: completar hasta 8 semanas o repetir ciclo según evolución.',
      'Si no responde y persiste sintomático: derivar a cirugía/urología pediátrica.',
      'Si durante seguimiento aparecen cicatriz, BXO, ITU recurrente, chorro fino persistente o retención: derivar.',
    ],
    layout_position: 'main',
  },
  {
    id: 'fimo-parafimosis',
    tab: 'fimo_protocolo',
    subtab: 'fimo_urgencias',
    type: 'criteria',
    color: 'red',
    order: 9,
    title: 'Parafimosis',
    content: 'Urgencia urológica. El objetivo es reducir edema y devolver el prepucio a su posición normal cuanto antes.',
    items: [
      'Dar analgesia, contención y explicar procedimiento.',
      'Compresión firme del edema del glande/prepucio durante 10 a 15 minutos; puede repetirse si hay respuesta parcial.',
      'Intentar reducción manual suave: presión sostenida sobre glande mientras se avanza el prepucio hacia distal cubriendo el glande.',
      'Si falla reducción, hay isquemia, color azul/negro o dolor intenso: interconsulta quirúrgica urgente.',
      'Después de reducir: no retraer por algunos días; luego retraer solo para higiene y siempre volver a cubrir el glande.',
      'La circuncisión no es obligatoria tras un primer episodio reducido, salvo recurrencia o fimosis patológica asociada.',
    ],
    layout_position: 'main',
  },
  {
    id: 'fimo-retencion-celulitis',
    tab: 'fimo_protocolo',
    subtab: 'fimo_urgencias',
    type: 'criteria',
    color: 'red',
    order: 10,
    title: 'Retención urinaria, infección severa o isquemia',
    items: [
      'Retención urinaria: derivación/consulta quirúrgica urgente. Evitar manipulación repetida del prepucio.',
      'Pene rojo, hinchado y fiebre: evaluar celulitis, descartar ITU con urocultivo e iniciar antibiótico según guía local.',
      'Coloración azul/negra distal o tejido isquémico: urgencia quirúrgica inmediata.',
      'Sospecha de malformación urogenital o ITU recurrente: derivar para estudio por especialidad.',
    ],
    layout_position: 'main',
  },
  {
    id: 'fimo-corticoide-esquema',
    tab: 'fimo_tratamiento',
    subtab: 'fimo_corticoide',
    type: 'flowchart',
    color: 'blue',
    order: 11,
    title: 'Corticoide tópico: esquema práctico',
    content: 'Primera línea en fimosis sintomática no urgente y opción razonable en mayores de 6 años asintomáticos con persistencia.',
    details: [
      'Betametasona 0,05% crema: aplicar sobre el anillo estrecho dos veces al día durante 4 a 8 semanas. En la práctica MINSAL sugiere ciclos de 8 semanas.',
      'Alternativas: hidrocortisona 1% o clobetasol 0,05% con igual frecuencia y duración, según disponibilidad y criterio clínico.',
      'Aplicar cantidad pequeña sobre la zona estenótica, no en toda la piel del pene.',
      'Asociar retracción gentil sin dolor durante y después del ciclo; nunca forzar ni producir fisuras.',
      'Repetir hasta 3 ciclos si hay respuesta parcial o recidiva, verificando técnica y adherencia.',
      'Efectos adversos esperados: irritación local infrecuente; suspender transitoriamente si irrita y reevaluar.',
    ],
    layout_position: 'main',
  },
  {
    id: 'fimo-corticoide-control',
    tab: 'fimo_tratamiento',
    subtab: 'fimo_corticoide',
    type: 'criteria',
    color: 'indigo',
    order: 12,
    title: 'Control y respuesta al tratamiento',
    items: [
      'Control al término del ciclo: registrar grado de retractilidad, síntomas, episodios de balanitis/ITU y adherencia.',
      'Respuesta completa: suspender corticoide, mantener higiene y retracción suave diaria si ya retrae.',
      'Respuesta parcial: prolongar hasta completar 8 semanas o repetir ciclo si persiste estrechez sin alarma.',
      'Sin respuesta pese a técnica correcta: sospechar fimosis patológica/cicatricial y derivar.',
      'Recidiva: revisar técnica de mantención; repetir ciclo si no hay cicatriz ni urgencia.',
    ],
    layout_position: 'main',
  },
  {
    id: 'fimo-balanitis-manejo',
    tab: 'fimo_tratamiento',
    subtab: 'fimo_balanitis',
    type: 'criteria',
    color: 'amber',
    order: 13,
    title: 'Balanitis / balanopostitis',
    items: [
      'Leve irritativa: baños o aseo con agua tibia, evitar jabones/perfumes/talco, analgesia simple, crema barrera o hidrocortisona 1% por pocos días si inflamación.',
      'Sospecha de cándida en lactante/pañal: agregar antifúngico tópico según disponibilidad local.',
      'No retraer durante inflamación aguda: aumenta dolor y riesgo de parafimosis.',
      'No usar antibiótico tópico de rutina: baja eficacia y puede irritar.',
      'Si hay fiebre, celulitis, eritema que progresa por el cuerpo del pene o compromiso sistémico: evaluar ITU, iniciar antibiótico sistémico según guía local y considerar derivación.',
      'Balanitis recurrente: tratar episodio agudo, revisar higiene/irritantes y luego considerar corticoide tópico para fimosis asociada; si persiste, derivar.',
    ],
    layout_position: 'main',
  },
  {
    id: 'fimo-cirugia-indicaciones',
    tab: 'fimo_tratamiento',
    subtab: 'fimo_cirugia',
    type: 'criteria',
    color: 'purple',
    order: 14,
    title: 'Cirugía: cuándo considerar',
    items: [
      'No es primera línea en fimosis fisiológica ni en no retractilidad asintomática de niños pequeños.',
      'Indicaciones habituales: fimosis patológica/cicatricial, BXO probable o confirmada, fracaso de tratamiento tópico con síntomas persistentes, balanitis recurrente refractaria, ITU recurrente asociada o malformación urogenital.',
      'La decisión quirúrgica corresponde a cirugía/urología pediátrica con consentimiento informado familiar.',
      'Enviar antecedentes del tratamiento médico: corticoide usado, duración, número de ciclos, respuesta, recidiva y técnica indicada.',
      'Si se reseca prepucio por sospecha de BXO, considerar estudio histopatológico según criterio quirúrgico por implicancias de seguimiento.',
    ],
    layout_position: 'main',
  },
  {
    id: 'fimo-referencia',
    tab: 'fimo_derivacion',
    subtab: 'fimo_ref',
    type: 'criteria',
    color: 'red',
    order: 15,
    title: 'Referencia a cirugía / urología pediátrica',
    content: 'Derivar con prioridad según severidad clínica y red local.',
    items: [
      'Parafimosis no reducible, isquemia o retención urinaria: urgencia.',
      'Sospecha de BXO, fimosis cicatricial o meato comprometido.',
      'Fimosis sintomática persistente sin respuesta a corticoide tópico bien realizado.',
      'Mayor de 6 años asintomático con al menos 2 ciclos de corticoide sin respuesta o con recidiva significativa.',
      'Balanitis recurrente pese a manejo y corticoide si hay fimosis asociada.',
      'ITU recurrente, malformación urogenital o síntomas miccionales persistentes.',
    ],
    layout_position: 'main',
  },
  {
    id: 'fimo-sic',
    tab: 'fimo_derivacion',
    subtab: 'fimo_ref',
    type: 'criteria',
    color: 'blue',
    order: 16,
    title: 'Qué debe llevar la interconsulta',
    items: [
      'Edad, motivo principal y tiempo de evolución.',
      'Síntomas miccionales: chorro fino, esfuerzo, balonamiento problemático, goteo, disuria o retención.',
      'Episodios de balanitis/balanopostitis e ITU, con fechas y tratamientos si están disponibles.',
      'Examen físico: grado de retractilidad, cicatriz/anillo blanquecino, fisuras, meato, sospecha de BXO o parafimosis.',
      'Tratamiento tópico realizado: fármaco, concentración, frecuencia, duración, número de ciclos, adherencia y respuesta.',
      'Educación entregada y ausencia/presencia de retracción forzada previa.',
    ],
    layout_position: 'main',
  },
  {
    id: 'fimo-contrarreferencia',
    tab: 'fimo_derivacion',
    subtab: 'fimo_contra',
    type: 'criteria',
    color: 'green',
    order: 17,
    title: 'Contrarreferencia a APS',
    items: [
      'Sin fimosis patológica o sin indicación quirúrgica: seguimiento y educación en APS.',
      'Respuesta satisfactoria a tratamiento tópico: alta con medidas de higiene y mantención.',
      'Postoperatorio dado de alta por cirugía: controles habituales y educación familiar en APS.',
      'Reconsulta desde APS si reaparecen síntomas, balanitis recurrente, retención, ITU o sospecha de complicación.',
    ],
    layout_position: 'main',
  },
  {
    id: 'fimo-registro-seguimiento',
    tab: 'fimo_derivacion',
    subtab: 'fimo_registro',
    type: 'text',
    color: 'slate',
    order: 18,
    title: 'Seguimiento y plazo sugerido',
    content: `El subproceso clínico debería resolverse idealmente dentro de 8 semanas desde la primera evaluación: educación inicial, ciclo de tratamiento cuando corresponda, control de respuesta y decisión de alta, repetición de ciclo o derivación.

En la ficha debe quedar explícito: clasificación clínica, ausencia/presencia de signos de alarma, educación sobre no retracción forzada, esquema indicado, fecha de control y criterio de derivación si falla el manejo conservador.`,
    layout_position: 'main',
  },
  {
    id: 'fimo-mermaid',
    tab: 'fimo_flujograma',
    type: 'mermaid',
    order: 19,
    title: 'Algoritmo integral de manejo',
    content: `flowchart TD
    A(["Niño con prepucio no retráctil o síntomas prepuciales"]) --> B{"¿Urgencia?"}
    B -->|"Parafimosis · retención · isquemia · fiebre/celulitis"| U["Manejo urgente\\nanalgesia · reducción si parafimosis\\ninterconsulta quirúrgica si falla o alarma"]
    B -->|"No"| C{"¿Cicatriz/BXO o meato comprometido?"}
    C -->|"Sí"| D["Derivar a Cirugía / Urología Pediátrica\\nSospecha fimosis patológica"]
    C -->|"No"| E{"¿Tiene síntomas?"}
    E -->|"No"| F{"Edad"}
    F -->|"< 6 años"| G["Educación y observación\\nNo exámenes · no derivar\\nNo retracción forzada"]
    F -->|"≥ 6 años"| H["Ofrecer corticoide tópico\\nsi familia desea tratamiento o persistencia"]
    E -->|"Sí leve/moderado"| I["Corticoide tópico 4-8 semanas\\n+ retracción gentil sin dolor"]
    I --> J{"Respuesta"}
    H --> J
    J -->|"Completa"| K(["Alta\\nhigiene + mantención"])
    J -->|"Parcial o recidiva"| L["Revisar técnica/adherencia\\nrepetir hasta 3 ciclos"]
    L --> J
    J -->|"Sin respuesta y sintomático"| D
    J -->|"No retráctil pero asintomático"| G
    U --> M{"¿Reducción exitosa\\ny sin isquemia?"}
    M -->|"Sí"| N["Alta con educación\\nno retraer por algunos días"]
    M -->|"No"| D`,
    layout_position: 'main',
  },
  {
    id: 'fimo-educacion-familia',
    tab: 'fimo_educacion',
    subtab: 'fimo_familia',
    type: 'criteria',
    color: 'teal',
    order: 20,
    title: 'Mensajes para la familia',
    items: [
      'En muchos niños el prepucio no baja completamente y eso puede ser normal.',
      'No hay que forzar la piel hacia atrás: puede doler, sangrar y dejar cicatriz.',
      'El aseo habitual es por fuera; cuando el prepucio baje solo, se puede limpiar suavemente y volverlo siempre hacia adelante.',
      'Smegma o puntos blancos bajo la piel suelen ser normales y no son pus.',
      'El balonamiento leve al orinar puede ser normal; consultar si hay dolor, chorro fino, goteo importante, fiebre o infecciones repetidas.',
      'Si el prepucio queda atrapado detrás del glande y no vuelve a cubrirlo, consultar de inmediato.',
    ],
    layout_position: 'main',
  },
  {
    id: 'fimo-educacion-aplicacion',
    tab: 'fimo_educacion',
    subtab: 'fimo_aplicacion',
    type: 'flowchart',
    color: 'blue',
    order: 21,
    title: 'Cómo aplicar la crema',
    details: [
      'Lavar con agua y secar suavemente.',
      'Retraer apenas hasta ver o palpar el anillo estrecho, sin dolor ni sangrado.',
      'Aplicar una pequeña cantidad de crema directamente en el anillo estrecho.',
      'Volver el prepucio hacia adelante cubriendo el glande.',
      'Repetir dos veces al día durante el tiempo indicado.',
      'Mantener retracción suave diaria después del tratamiento si ya retrae, idealmente en baño u orina, siempre volviendo a cubrir el glande.',
    ],
    layout_position: 'main',
  },
  {
    id: 'fimo-educacion-alarmas',
    tab: 'fimo_educacion',
    subtab: 'fimo_alarmas',
    type: 'alert',
    color: 'red',
    order: 22,
    title: 'Cuándo consultar urgente',
    content: 'Consultar el mismo día si el niño no puede orinar, el prepucio queda atrapado detrás del glande, hay coloración azul/negra, dolor intenso, fiebre con pene rojo/hinchado, secreción purulenta con compromiso general o sangrado importante.',
    layout_position: 'main',
  },
];

const protocol_authors = [
  { name: 'Ministerio de Salud de Chile', role: 'Orientación Técnica nacional — Res. Ex. 142/2025' },
  { name: 'DIVAP / DIGERA / DIPRECE', role: 'Subsecretaría de Redes Asistenciales — revisión técnica' },
  { name: 'Dra. Francisca Yankovic Barceló', role: 'Elaboradora — Urólogo Pediatra, Hospital Exequiel González Cortés' },
  { name: 'Dr. José Manuel Campos Varas', role: 'Elaborador — Cirujano Pediátrico, Hospital Roberto del Río' },
];

const payload = {
  description: 'Manejo integral de fimosis pediátrica basado en Orientación Técnica MINSAL 2025: evaluación clínica, diferenciación entre desarrollo normal y fimosis patológica, tratamiento conservador con corticoide tópico, manejo de balanitis/parafimosis, criterios de referencia y educación familiar.',
  protocol_objective: 'Estandarizar en la red el diagnóstico, educación, tratamiento conservador, identificación de urgencias y criterios de referencia/contrarreferencia en niños con fimosis o problemas del prepucio.',
  protocol_authors,
  content_blocks,
  tags: [
    'ordinario minsal',
    'MINSAL',
    'fimosis',
    'pediatría',
    'prepucio',
    'corticoides tópicos',
    'betametasona',
    'balanitis',
    'balanopostitis',
    'parafimosis',
    'BXO',
    'liquen escleroso',
    'circuncisión',
    'derivación',
    'urología pediátrica',
    'cirugía pediátrica',
    'policlínico',
  ],
  last_updated: TODAY,
};

const tabs = content_blocks.reduce((acc, block) => {
  acc[block.tab] ??= { total: 0, subtabs: {} };
  acc[block.tab].total += 1;
  if (block.subtab) acc[block.tab].subtabs[block.subtab] = (acc[block.tab].subtabs[block.subtab] || 0) + 1;
  return acc;
}, {});

console.log(`\nFimosis pediátrica integral v2 — ${APPLY ? 'APPLY' : 'DRY-RUN'}\n`);
Object.entries(tabs).forEach(([tab, info]) => {
  console.log(`${tab}: ${info.total} bloque(s)`);
  Object.entries(info.subtabs).forEach(([subtab, count]) => console.log(`  - ${subtab}: ${count}`));
});
console.log(`\nTotal bloques: ${content_blocks.length}`);

const { data: current, error: fetchError } = await supabase
  .from('topics')
  .select('id,name,protocol_code')
  .eq('id', TOPIC_ID)
  .single();

if (fetchError) {
  console.error(`No se pudo leer el topic ${TOPIC_ID}: ${fetchError.message}`);
  process.exit(1);
}

console.log(`Topic: ${current.name} (${current.protocol_code})`);

if (!APPLY) {
  console.log('\nDry-run OK. Ejecuta con --apply para actualizar Supabase.\n');
  process.exit(0);
}

const { error: updateError } = await supabase
  .from('topics')
  .update(payload)
  .eq('id', TOPIC_ID);

if (updateError) {
  console.error(`Error actualizando fimosis: ${updateError.message}`);
  process.exit(1);
}

console.log('\nActualizado correctamente.\n');
