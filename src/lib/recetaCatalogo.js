import presentaciones from '@/data/recetaPresentaciones.json';

// Catálogo orientativo por principio activo; no implica stock ni pauta terapéutica.
const grupos = {
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
export const RECETA_CATALOGO = Object.entries(grupos).flatMap(([categoria, nombres]) => nombres.split('|').map(nombre => ({ nombre, categoria, presentaciones: (presentaciones[nombre] || []).map(p => p.texto) })));
export const normalizarBusqueda = value => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
export const hoyChile = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Santiago' }).format(new Date());
export function textoMedicamento(item) {
  return [item.nombre, item.presentacion && `Presentación: ${item.presentacion}`, item.dosis && `Dosis: ${item.dosis}`, item.via && `Vía: ${item.via}`, item.frecuencia && `Frecuencia: ${item.frecuencia}`, item.duracion && `Duración: ${item.duracion}`, item.cantidad && `Cantidad total: ${item.cantidad}`, item.indicaciones && `Indicaciones: ${item.indicaciones}`].filter(Boolean).join('\n');
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
export function buscarMedicamentos(query) {
  const tokens = normalizarBusqueda(query).split(/\s+/).filter(Boolean);
  return RECETA_CATALOGO.filter(item => {
    const texto = normalizarBusqueda(`${item.nombre} ${item.categoria} ${item.presentaciones.join(' ')}`);
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
export function actualizarPresentacion(item, presentacion) {
  const anterior = precargaPresentacion(item.presentacion);
  const siguiente = precargaPresentacion(presentacion);
  return {
    ...item,
    presentacion,
    dosis: !item.dosis || item.dosis === anterior.dosis ? siguiente.dosis : item.dosis,
    via: !item.via || item.via === anterior.via ? siguiente.via : item.via,
  };
}
