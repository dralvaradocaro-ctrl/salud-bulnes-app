// Páginas estáticas de la app (no son Topics ni Calculators) que el buscador
// global debe indexar. Cada entry tiene un name visible, page (key de pages.config),
// description y keywords/tags para matching.

export const staticPages = [
  {
    id: 'protocolo-insulina',
    page: 'ProtocoloInsulina',
    name: 'Protocolo de Corrección Insulínica',
    description: 'Hiperglicemia preprandial · Calculadora interactiva — Protocolo local HCSFB',
    keywords: [
      'insulina', 'insulinica', 'insulínica', 'correccion insulinica', 'corrección insulínica',
      'hiperglicemia', 'hiperglucemia', 'preprandial', 'dm', 'diabetes', 'glicemia', 'glucemia',
      'cristalina', 'NPH', 'esquema insulínico',
    ],
  },
  {
    id: 'solicitud-examenes',
    page: 'SolicitudExamenes',
    name: 'Solicitud de Exámenes — Hospital de Bulnes',
    description: 'Selecciona exámenes con buscador e imprime el formulario oficial (COD. 32)',
    keywords: [
      'examenes', 'exámenes', 'solicitud', 'laboratorio', 'lab', 'hemograma', 'orina', 'cod 32',
      'cod.32', 'orden de examenes', 'orden de exámenes', 'pruebas', 'analisis', 'análisis',
    ],
  },
  {
    id: 'formulario-ges',
    page: 'FormularioGES',
    name: 'Formulario de Constancia GES',
    description: 'Artículo 24° Ley 19.966 — Constancia GES para patologías cubiertas',
    keywords: [
      'ges', 'auge', 'constancia', 'garantias explicitas', 'garantías explícitas',
      'ley 19.966', 'articulo 24', 'patologia ges', 'patología ges',
    ],
  },
  {
    id: 'informe-biomedico',
    page: 'InformeBiomedico',
    name: 'Informe Biomédico Funcional',
    description: 'Informe biomédico y funcional para credencial de discapacidad / pensión',
    keywords: [
      'biomedico', 'biomédico', 'funcional', 'discapacidad', 'compin', 'credencial',
      'informe biomedico', 'informe biomédico', 'pension de invalidez', 'pensión de invalidez',
      'registro nacional', 'inclusión',
    ],
  },
  {
    id: 'prescripcion-inteligente',
    page: 'PrescripcionInteligente',
    name: 'Prescripción Inteligente',
    description: 'Asistente de prescripción con verificación de dosis e interacciones',
    keywords: [
      'prescripcion', 'prescripción', 'receta', 'farmaco', 'fármaco', 'dosis', 'medicamento',
      'interacciones', 'recetar',
    ],
  },
  {
    id: 'subdireccion-medica',
    page: 'SubdireccionMedica',
    name: 'Subdirección Médica — Consola',
    description: 'Agenda SDM, turnos, bloqueos y gestión semanal',
    keywords: [
      'sdm', 'subdireccion', 'subdirección', 'medica', 'médica', 'agenda', 'turnos', 'bloqueos',
      'consola', 'rotacion', 'rotación',
    ],
  },
  {
    id: 'solicitud-microbiologia',
    page: 'SolicitudMicrobiologia',
    name: 'Solicitud de Exámenes Microbiológicos (C 162)',
    description: 'Formulario C 162 — Cultivos, directos al fresco, virológicos. Hospital de Bulnes.',
    keywords: [
      'microbiologia', 'microbiología', 'microbiologicos', 'microbiológicos',
      'urocultivo', 'coprocultivo', 'cultivo', 'gram', 'tinción gram',
      'directo fresco', 'streptococcus', 'gonorrhoeae', 'gonorrea',
      'ureaplasma', 'mycoplasma', 'clamidia', 'chlamydia',
      'hongos', 'micologico', 'micológico', 'acarotest',
      'virus respiratorio', 'vrs', 'sincicial', 'c 162', 'c162',
    ],
  },
  {
    id: 'formulario-ira-grave',
    page: 'FormularioIRAGrave',
    name: 'Formulario IRA grave y 2019-nCoV (ISP)',
    description: 'PR-244.00-007 — Notificación inmediata y envío de muestras al ISP. Imprime PDF.',
    keywords: [
      'ira', 'ira grave', 'ira-grave', 'irag', 'covid', 'coronavirus', '2019-ncov', 'ncov',
      'isp', 'instituto de salud pública', 'instituto de salud publica',
      'influenza', 'vigilancia', 'epivigila', 'pr-244', 'pr244',
      'notificación inmediata', 'notificacion inmediata',
    ],
  },
  {
    id: 'templates',
    page: 'Templates',
    name: 'Plantillas e Interconsultas',
    description: 'Plantillas de informes, interconsultas e indicaciones',
    keywords: [
      'plantilla', 'plantillas', 'interconsulta', 'ic', 'template', 'indicaciones', 'modelos',
    ],
  },
];

// Filtra páginas por query (case-insensitive). Match contra name, description y keywords.
export function filterStaticPages(queryLower) {
  if (!queryLower) return [];
  return staticPages.filter(p =>
    p.name.toLowerCase().includes(queryLower) ||
    (p.description || '').toLowerCase().includes(queryLower) ||
    (p.keywords || []).some(k => k.toLowerCase().includes(queryLower))
  );
}
