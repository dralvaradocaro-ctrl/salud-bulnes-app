// Plantillas de composición: el prescriptor completa base, cantidad y pauta.
export const MAGISTRALES = [
  { id: 'fisura-diltiazem', patologia: 'Fisura anal', nombre: 'Diltiazem tópico', formula: 'Diltiazem clorhidrato 2 %', presentacion: '2 % · crema', via: 'Tópica', fuente: 'https://www.nice.org.uk/advice/esuom3/chapter/overview-for-healthcare-professionals' },
  { id: 'xerosis-urea', patologia: 'Xerosis / ictiosis', nombre: 'Urea tópica', formula: 'Urea 10 %', presentacion: '10 % · crema', via: 'Tópica', fuente: 'https://dermnetnz.org/topics/urea' },
  { id: 'hiperqueratosis-urea', patologia: 'Hiperqueratosis', nombre: 'Urea tópica', formula: 'Urea 20 %', presentacion: '20 % · crema', via: 'Tópica', fuente: 'https://dermnetnz.org/topics/urea' },
];
export function nuevaMagistral(plantilla = {}) {
  return { id: crypto.randomUUID(), tipo: 'magistral', nombre: plantilla.nombre || 'Fórmula magistral', formula: plantilla.formula || '', vehiculo: '', presentacion: plantilla.presentacion || '', dosis: '', via: plantilla.via || '', frecuencia: '', duracion: '', cantidad: '', indicaciones: '' };
}
export const validarMagistrales = items => items.some(i => i.tipo === 'magistral' && (!i.formula?.trim() || !i.vehiculo?.trim() || !i.cantidad?.trim())) ? ['composición, vehículo y cantidad final de cada fórmula magistral'] : [];
