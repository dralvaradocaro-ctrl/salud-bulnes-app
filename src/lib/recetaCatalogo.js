import presentaciones from '@/data/recetaPresentaciones.json';
import comerciales from '@/data/recetaComerciales.json';
import { esBenzodiacepina, cantidadControlada } from '@/lib/recetaControlados';

// Catálogo orientativo por principio activo; no implica stock ni pauta terapéutica.
const grupos = {
  'Reumatología · Inmunosupresores': 'Metotrexato|Hidroxicloroquina|Leflunomida|Azatioprina|Sulfasalazina|Micofenolato mofetilo|Micofenolato sódico|Tacrolimus',
  'Anticoagulantes': 'Apixabán|Rivaroxabán|Dabigatrán etexilato|Warfarina|Acenocumarol',
  'Benzodiacepinas': 'Clonazepam|Alprazolam|Lorazepam|Diazepam|Bromazepam|Clotiazepam|Ketazolam|Lormetazepam',
  'HTA y cardiovascular': 'Losartán|Valsartán|Candesartán|Telmisartán|Enalapril|Lisinopril|Amlodipino|Nifedipino|Hidroclorotiazida|Clortalidona|Indapamida|Furosemida|Espironolactona|Carvedilol|Bisoprolol|Atenolol|Metoprolol|Ácido acetilsalicílico|Clopidogrel|Isosorbida dinitrato',
  'DLP · Dislipidemia': 'Atorvastatina|Rosuvastatina|Simvastatina|Ezetimiba|Fenofibrato|Gemfibrozilo',
  'DM2 · Diabetes': 'Metformina|Metformina liberación prolongada|Glibenclamida|Gliclazida|Glimepirida|Sitagliptina|Vildagliptina|Linagliptina|Empagliflozina|Dapagliflozina|Semaglutida|Liraglutida|Insulina NPH|Insulina cristalina|Insulina glargina|Insulina degludec|Insulina lispro|Insulina aspart',
  'Antihistamínicos · Alergia': 'Loratadina|Desloratadina|Cetirizina|Levocetirizina|Fexofenadina|Clorfenamina|Hidroxicina',
  'Respiratorio · Antitusígenos': 'Levodropropizina|Dextrometorfano|Cloperastina|Ambroxol|Bromhexina|Acetilcisteína|Salbutamol|Ipratropio bromuro|Budesonida|Fluticasona|Beclometasona|Budesonida / formoterol|Fluticasona / salmeterol|Tiotropio|Montelukast|Mometasona nasal',
  'Dolor · Antiinflamatorios': 'Paracetamol|Ibuprofeno|Naproxeno|Diclofenaco|Ketoprofeno|Dexketoprofeno|Ketorolaco|Meloxicam|Celecoxib|Etoricoxib|Metamizol',
  'Anestésicos locales': 'Lidocaína solución inyectable|Lidocaína gel|Lidocaína aerosol|Lidocaína / prilocaína crema|Bupivacaína solución inyectable',
  'Antivirales': 'Aciclovir|Valaciclovir|Oseltamivir',
  'Antibióticos': 'Amoxicilina|Amoxicilina / ácido clavulánico|Penicilina benzatina|Cefadroxilo|Cefalexina|Cefuroxima|Ceftriaxona|Azitromicina|Claritromicina|Eritromicina|Doxiciclina|Clindamicina|Ciprofloxacino|Levofloxacino|Moxifloxacino|Cotrimoxazol|Nitrofurantoína|Fosfomicina|Metronidazol',
  'Digestivo': 'Omeprazol|Esomeprazol|Pantoprazol|Lansoprazol|Famotidina|Domperidona|Metoclopramida|Ondansetrón|Trimebutina|Butilbromuro de hioscina|Simeticona|Lactulosa|Polietilenglicol|Bisacodilo|Loperamida|Sales de rehidratación oral|Mesalazina',
  'Dermatología · Antifúngicos': 'Clotrimazol|Miconazol|Ketoconazol|Terbinafina|Fluconazol|Nistatina|Mupirocina|Ácido fusídico|Hidrocortisona|Betametasona|Clobetasol|Permetrina|Peróxido de benzoilo|Adapaleno|Urea crema',
  'Endocrino · Corticoides': 'Levotiroxina|Tiamazol|Prednisona|Prednisolona|Dexametasona|Metilprednisolona',
  'Neurología · Salud mental': 'Sertralina|Fluoxetina|Escitalopram|Venlafaxina|Duloxetina|Amitriptilina|Mirtazapina|Bupropión|Pregabalina|Gabapentina|Carbamazepina|Lamotrigina|Levetiracetam|Ácido valproico|Topiramato|Quetiapina|Risperidona|Aripiprazol|Sumatriptán',
  'Urología · Ginecología': 'Tamsulosina|Finasterida|Dutasterida|Oxibutinina|Solifenacina|Sildenafilo|Tadalafilo|Estradiol|Progesterona|Levonorgestrel|Desogestrel',
  'Oftalmología · Otorrino': 'Carboximetilcelulosa oftálmica|Hipromelosa oftálmica|Tobramicina oftálmica|Moxifloxacino oftálmico|Olopatadina oftálmica|Timolol oftálmico|Latanoprost oftálmico|Ciprofloxacino ótico|Cloruro de sodio nasal',
  'Vitaminas · Otros': 'Ácido fólico|Sulfato ferroso|Hierro polimaltosado|Cianocobalamina|Colecalciferol|Calcio carbonato|Calcio / vitamina D|Alopurinol|Colchicina|Alendronato|Ivermectina|Albendazol|Mebendazol',
};
export const RECETA_CATEGORIAS = Object.keys(grupos);
export const RECETA_CATALOGO = Object.entries(grupos).flatMap(([categoria, nombres]) => nombres.split('|').map(nombre => ({ nombre, categoria, comerciales: comerciales[nombre] || [], presentaciones: (presentaciones[nombre] || []).map(p => p.texto) })));
export const normalizarBusqueda = value => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
const indiceBusqueda = new Map(RECETA_CATALOGO.map(item => [item.nombre, normalizarBusqueda(`${item.nombre} ${item.categoria} ${item.comerciales.join(' ')} ${item.presentaciones.join(' ')}`).replace(/(\d),(\d)/g, '$1.$2')]));
export const hoyChile = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Santiago' }).format(new Date());
export function textoMedicamento(item) {
  const cantidad = esBenzodiacepina(item) ? cantidadControlada(item) : item.cantidad;
  return [item.nombre, item.tipo === 'magistral' && 'Preparación magistral', item.formula && `Fórmula: ${item.formula}`, item.vehiculo && `Vehículo / base: ${item.vehiculo}`, item.presentacion && `Presentación: ${item.presentacion}`, item.dosis && `Dosis: ${item.dosis}`, item.via && `Vía: ${item.via}`, item.frecuencia && `Frecuencia: ${item.frecuencia}`, item.duracion && `Duración: ${item.duracion}`, cantidad && `Cantidad total: ${cantidad}`, item.indicaciones && `Indicaciones: ${item.indicaciones}`].filter(Boolean).join('\n');
}

// Opciones de escritura: ninguna frecuencia o dosis se asigna por diagnóstico.
export const FRECUENCIAS_RECETA = [6, 8, 12, 24, 48, 72].map(h => `Cada ${h} horas`);
export const DURACIONES_RECETA = ['3 días', '5 días', '7 días', '10 días', '14 días', '30 días', '60 días', '90 días', 'Uso permanente'];
export const VIAS_RECETA = ['Oral', 'Sublingual', 'Tópica', 'Inhalatoria', 'Nasal', 'Oftálmica', 'Ótica', 'Vaginal', 'Rectal', 'Subcutánea', 'Intramuscular', 'Intravenosa'];
export function opcionesDosis(presentacion = '') {
  const p = normalizarBusqueda(presentacion);
  if ((p.includes('liberacion prolongada') || p.includes('gastrorresistente')) && p.includes('comprimido')) return ['1 comprimido', '2 comprimidos'];
  if (p.includes('comprimido')) return ['½ comprimido', '1 comprimido', '2 comprimidos'];
  if (p.includes('capsula')) return ['1 cápsula', '2 cápsulas'];
  if (/jarabe|suspension oral|solucion oral/.test(p)) return ['2,5 mL', '5 mL', '10 mL'];
  if (/crema|unguento|gel/.test(p)) return ['Aplicar una capa fina'];
  return [];
}
export function buscarMedicamentos(query, categoria = '') {
  const tokens = normalizarBusqueda(query).replace(/(\d),(\d)/g, '$1.$2').split(/\s+/).filter(Boolean);
  return RECETA_CATALOGO.filter(item => {
    if (categoria && item.categoria !== categoria) return false;
    const texto = indiceBusqueda.get(item.nombre);
    return tokens.every(token => texto.includes(token));
  });
}

// Valores iniciales de escritura según la forma elegida; siempre editables.
export function precargaPresentacion(presentacion = '') {
  const p = normalizarBusqueda(presentacion);
  if (/vaginal|sublingual|inhal|inyect|oftalm|otico|rectal/.test(p)) return { dosis: '', via: '' };
  if (p.includes('comprimido')) return { dosis: '1 comprimido', via: 'Oral' };
  if (p.includes('capsula')) return { dosis: '1 cápsula', via: 'Oral' };
  if (/jarabe|suspension oral|solucion oral/.test(p)) return { dosis: '', via: 'Oral' };
  return { dosis: '', via: '' };
}
export const esMetotrexato = nombre => /\b(metotrexato|methotrexate|metoject)\b/.test(normalizarBusqueda(nombre || ''));
export function precargaMedicamento(nombre, presentacion) {
  const inicial = precargaPresentacion(presentacion);
  return esMetotrexato(nombre) ? { ...inicial, dosis: '' } : inicial;
}
export function frecuenciasMedicamento(nombre) {
  return esMetotrexato(nombre)
    ? ['Una vez por semana', ...['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'].map(dia => `Una vez por semana (${dia})`)]
    : [...FRECUENCIAS_RECETA, 'Una vez por semana', 'Dosis única'];
}
export function actualizarPresentacion(item, presentacion) {
  const anterior = precargaMedicamento(item.nombre, item.presentacion);
  const siguiente = precargaMedicamento(item.nombre, presentacion);
  return {
    ...item,
    presentacion,
    dosis: !item.dosis || item.dosis === anterior.dosis ? siguiente.dosis : item.dosis,
    via: !item.via || item.via === anterior.via ? siguiente.via : item.via,
  };
}
