// Solo calcula pautas uniformes expresadas explícitamente en comprimidos.
const nombres = ['ketazolam', 'lormetazepam', 'clordiazepoxido', 'amparax', 'neuroval', 'grifoketam', 'ansietil', 'sedavital', 'nocton', 'clonazepam', 'alprazolam', 'lorazepam', 'diazepam', 'bromazepam', 'clobazam', 'clotiazepam', 'clorazepato', 'midazolam', 'nitrazepam', 'flunitrazepam', 'triazolam', 'temazepam', 'oxazepam', 'ravotril', 'rivotril', 'neuryl', 'zotran', 'adax', 'ativan', 'valium', 'lexotanil', 'rize', 'somese', 'tranxilium'];
const normalizar = v => String(v || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
export const esBenzodiacepina = item => Boolean(item.controlado) || nombres.some(n => new RegExp(`\\b${n}\\b`).test(normalizar(`${item.nombre || ''} ${item.formula || ''}`)));
export function numeroEnLetras(n) {
  if (!Number.isInteger(n) || n < 1 || n > 9999) return '';
  const unidades = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
  if (n < 30) return unidades[n];
  if (n < 100) return ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'][Math.floor(n / 10)] + (n % 10 ? ` y ${unidades[n % 10]}` : '');
  if (n === 100) return 'cien';
  if (n < 1000) return ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'][Math.floor(n / 100)] + (n % 100 ? ` ${numeroEnLetras(n % 100)}` : '');
  return (n < 2000 ? 'mil' : `${numeroEnLetras(Math.floor(n / 1000))} mil`) + (n % 1000 ? ` ${numeroEnLetras(n % 1000)}` : '');
}
export function calcularComprimidos(item) {
  if (!/comprimido/.test(normalizar(item.presentacion)) || item.indicaciones?.trim()) return null;
  const dosis = normalizar(item.dosis).replace('½', '0.5').replace('¼', '0.25').replace('¾', '0.75').replace(',', '.');
  const d = dosis.match(/^(\d+(?:\.\d+)?|1\/2|1\/4|3\/4) comprimidos?$/);
  const f = normalizar(item.frecuencia).match(/^cada (\d+) horas?$/);
  const t = normalizar(item.duracion).match(/^(\d+) (dias?|semanas?)$/);
  if (!d || !f || !t) return null;
  const cantidadDosis = d[1].includes('/') ? Number(d[1][0]) / Number(d[1][2]) : Number(d[1]);
  const horas = Number(f[1]);
  const dias = Number(t[1]) * (t[2].startsWith('semana') ? 7 : 1);
  if (cantidadDosis <= 0 || horas <= 0 || dias <= 0) return null;
  // Primera toma al inicio; redondear unidades dispensadas, no dosis administradas.
  const total = Math.ceil(cantidadDosis * Math.ceil(dias * 24 / horas));
  return total <= 9999 ? total : null;
}
export function cantidadControlada(item) {
  const automatico = calcularComprimidos(item);
  const manual = /^\d+$/.test(String(item.cantidadManual || '')) ? Number(item.cantidadManual) : null;
  const total = automatico ?? manual;
  const unidad = /comprimido/.test(normalizar(item.presentacion)) ? 'comprimidos' : item.unidadCantidad;
  return numeroEnLetras(total) && ['comprimidos', 'frascos', 'ampollas', 'cápsulas'].includes(unidad) ? `${total} (${numeroEnLetras(total)}) ${unidad}` : '';
}
export function validarControlados(receta) {
  const items = receta.medicamentos.filter(esBenzodiacepina);
  return [items.length && !receta.direccion?.trim() && 'dirección obligatoria para benzodiacepinas',
    items.some(i => !cantidadControlada(i)) && 'cantidad total de benzodiacepinas (completar pauta o cantidad manual y unidad)'].filter(Boolean);
}
