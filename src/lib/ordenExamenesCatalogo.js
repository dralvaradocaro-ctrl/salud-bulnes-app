import { fechaLarga } from '@/lib/certificadoPdf';

const normalizar = value => String(value || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
// Nombres de estudios para selección manual, sin protocolos ni indicaciones automáticas.
const grupos = [
  ['Laboratorio', false, 'laboratorio sangre', [
    'Hemograma', 'VHS', 'Proteína C reactiva (PCR)', 'Perfil bioquímico', 'Perfil lipídico', 'Perfil hepático',
    'Glicemia', 'Hemoglobina glicosilada (HbA1c)', 'Test de tolerancia a la glucosa oral', 'Insulina basal',
    'Creatinina sérica', 'Urea / nitrógeno ureico (BUN)', 'Electrolitos plasmáticos (Na, K, Cl)',
    'Sodio', 'Potasio', 'Cloro', 'Calcio', 'Fósforo', 'Magnesio', 'Ácido úrico',
    'Colesterol total', 'Colesterol HDL', 'Colesterol LDL', 'Triglicéridos',
    'Transaminasa GOT / AST', 'Transaminasa GPT / ALT', 'Fosfatasa alcalina', 'GGT', 'Bilirrubina total y directa',
    'Albúmina', 'Proteínas totales', 'Amilasa', 'Lipasa', 'LDH', 'CK total', 'CK-MB', 'Troponina',
    'Tiempo de protrombina (TP / INR)', 'TTPa', 'Dímero D', 'Fibrinógeno', 'Grupo sanguíneo ABO y Rh',
    'TSH', 'T4 libre', 'T3', 'Anticuerpos antiperoxidasa (anti-TPO)', 'Cortisol', 'Prolactina', 'FSH', 'LH',
    'Estradiol', 'Progesterona', 'Testosterona total', 'Beta-hCG cuantitativa', 'PSA total', 'PSA libre',
    'Ferritina', 'Ferremia', 'Transferrina', 'Reticulocitos', 'Vitamina B12', 'Ácido fólico', 'Vitamina D (25-OH)',
    'Factor reumatoideo', 'Anticuerpos antinucleares (ANA)', 'Anti-DNA', 'Anti-CCP',
    'Gases arteriales', 'Gases venosos', 'Lactato', 'Procalcitonina',
  ]],
  ['Orina y deposiciones', false, 'laboratorio muestra', [
    'Orina completa', 'Urocultivo y antibiograma', 'Relación albúmina / creatinina urinaria (RAC)',
    'Microalbuminuria', 'Proteinuria de 24 horas', 'Creatininuria de 24 horas', 'Clearance de creatinina',
    'Test de embarazo en orina', 'Parasitológico seriado de deposiciones', 'Coprocultivo',
    'Sangre oculta en deposiciones', 'Antígeno de Helicobacter pylori en deposiciones', 'Test de Graham',
    'Calprotectina fecal',
  ]],
  ['Microbiología y serología', false, 'laboratorio infeccioso', [
    'VIH', 'VDRL', 'RPR', 'Antígeno de superficie hepatitis B (HBsAg)', 'Anticuerpos hepatitis C (anti-VHC)',
    'Hepatitis A IgM', 'Hemocultivos', 'Cultivo de secreción', 'Cultivo de expectoración',
    'PCR SARS-CoV-2', 'Panel viral respiratorio', 'Baciloscopía', 'PCR Mycobacterium tuberculosis',
  ]],
  ['Radiografía', false, 'rx rayos x radiografia imagenologia', [
    'Radiografía de tórax PA y lateral', 'Radiografía de abdomen simple', 'Radiografía de columna cervical',
    'Radiografía de columna dorsal', 'Radiografía de columna lumbar', 'Radiografía de pelvis',
    'Radiografía de cadera', 'Radiografía de hombro', 'Radiografía de codo', 'Radiografía de muñeca',
    'Radiografía de mano', 'Radiografía de rodilla', 'Radiografía de tobillo', 'Radiografía de pie',
  ]],
  ['Ecografía', false, 'eco ultrasonido us imagenologia', [
    'Ecografía abdominal', 'Ecografía renal y vesical', 'Ecografía de partes blandas', 'Ecografía tiroidea',
    'Ecografía mamaria', 'Ecografía pélvica', 'Ecografía transvaginal', 'Ecografía testicular',
    'Ecografía musculoesquelética', 'Ecografía Doppler venoso de extremidades inferiores',
    'Ecografía Doppler arterial de extremidades inferiores', 'Ecografía Doppler carotídeo',
  ]],
  ['Tomografía', true, 'tc tac scanner tomografia imagenologia', [
    'TC de cerebro', 'TC de tórax', 'TC de abdomen y pelvis', 'TC de abdomen', 'TC de pelvis',
    'TC de cuello', 'TC de senos paranasales', 'TC de columna cervical', 'TC de columna lumbar',
    'Angio-TC de tórax', 'Angio-TC de aorta', 'Angio-TC cerebral', 'Uro-TC',
  ]],
  ['Resonancia', true, 'rm rnm resonancia magnetica imagenologia', [
    'RM de cerebro', 'RM de columna cervical', 'RM de columna dorsal', 'RM de columna lumbar',
    'RM de abdomen', 'RM de pelvis', 'RM de rodilla', 'RM de hombro', 'RM de cadera',
    'RM de tobillo', 'RM de muñeca', 'RM de próstata', 'Colangiorresonancia',
  ]],
  ['Otros estudios', false, 'procedimiento estudio', [
    'Mamografía bilateral', 'Densitometría ósea', 'Electrocardiograma (ECG)', 'Ecocardiograma Doppler',
    'Holter de ritmo', 'Monitoreo ambulatorio de presión arterial (MAPA)', 'Test de esfuerzo',
    'Espirometría basal y postbroncodilatador', 'Endoscopía digestiva alta', 'Colonoscopía',
    'Electroencefalograma (EEG)', 'Electromiografía', 'Audiometría', 'Impedanciometría',
    'Polisomnografía', 'Fondo de ojo',
  ]],
];
export const EXAMENES_CATALOGO = grupos.flatMap(([categoria, permiteContraste, alias, nombres]) => nombres.map(nombre => ({ nombre, categoria, permiteContraste, alias })));
export const EXAMENES_CATEGORIAS = grupos.map(([categoria]) => categoria);
export const CONTRASTES = ['Sin contraste', 'Con contraste', 'Sin y con contraste'];
export function buscarExamenes(query = '', categoria = '') {
  const tokens = normalizar(query).split(/\s+/).filter(Boolean);
  return EXAMENES_CATALOGO.filter(item => (!categoria || item.categoria === categoria) && tokens.every(t => normalizar(`${item.nombre} ${item.categoria} ${item.alias}`).includes(t)));
}
export function nuevoExamen(item = {}) {
  return { id: crypto.randomUUID(), nombre: item.nombre || '', permiteContraste: !!item.permiteContraste, contraste: '', detalle: '' };
}
export function textoExamen(item) {
  return [item.nombre.trim(), item.permiteContraste && item.contraste, item.detalle.trim()].filter(Boolean).join(' · ');
}
export function mostrarCreatinina(orden) {
  return orden.incluirCreatinina || orden.examenes.some(item => item.permiteContraste && ['Con contraste', 'Sin y con contraste'].includes(item.contraste));
}
export function textoCreatinina(orden) {
  if (!mostrarCreatinina(orden)) return '';
  if (!orden.creatinina.trim()) return 'Última creatinina: no informada';
  return `Última creatinina: ${orden.creatinina} ${orden.unidadCreatinina}${orden.fechaCreatinina ? ` · Fecha: ${fechaLarga(orden.fechaCreatinina)}` : ''}`;
}
export function validarEstudios(orden) {
  const errores = [];
  if (!orden.examenes.length) errores.push('al menos un examen');
  if (orden.examenes.some(e => !e.nombre.trim())) errores.push('nombre de cada examen');
  if (orden.examenes.some(e => e.permiteContraste && !CONTRASTES.includes(e.contraste))) errores.push('con o sin contraste para cada estudio que corresponda');
  if (mostrarCreatinina(orden) && orden.creatinina.trim()) {
    if (!/^\d+(?:[.,]\d+)?$/.test(orden.creatinina.trim()) || Number(orden.creatinina.replace(',', '.')) <= 0) errores.push('creatinina mayor que cero');
    if (!orden.fechaCreatinina || orden.fechaCreatinina > orden.fecha) errores.push('fecha de creatinina igual o anterior a la orden');
    if (!['mg/dL', 'µmol/L'].includes(orden.unidadCreatinina)) errores.push('unidad de creatinina');
  }
  return errores;
}
