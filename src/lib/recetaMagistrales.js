// Plantillas editables de composición y, cuando se proporciona, pauta.
export const MAGISTRALES = [
  { id: 'fisura-diltiazem', patologia: 'Fisura anal', nombre: 'Diltiazem tópico', formula: 'Diltiazem clorhidrato 2 %', presentacion: '2 % · crema', via: 'Tópica', fuente: 'https://www.nice.org.uk/advice/esuom3/chapter/overview-for-healthcare-professionals' },
  { id: 'xerosis-urea', patologia: 'Xerosis / ictiosis', nombre: 'Urea tópica', formula: 'Urea 10 %', presentacion: '10 % · crema', via: 'Tópica', fuente: 'https://dermnetnz.org/topics/urea' },
  { id: 'hiperqueratosis-urea', patologia: 'Hiperqueratosis', nombre: 'Urea tópica', formula: 'Urea 20 %', presentacion: '20 % · crema', via: 'Tópica', fuente: 'https://dermnetnz.org/topics/urea' },
  {
    id: 'dutasteride-minoxidil', patologia: 'Capilar', nombre: 'Dutasteride / Minoxidil',
    formula: 'Dutasteride 0,5 mg\nMinoxidil 5 mg', presentacion: '0,5 mg / 5 mg · cápsulas',
    vehiculo: 'En cápsulas c.s.p. 40 cápsulas', via: 'Oral', dosis: '1 cápsula',
    frecuencia: 'Una vez al día', duracion: '6 meses', cantidad: '40 cápsulas',
    indicaciones: 'Autorizo repetir por 6 meses',
  },
];
export function nuevaMagistral(plantilla = {}) {
  return { id: crypto.randomUUID(), tipo: 'magistral', nombre: plantilla.nombre || 'Fórmula magistral', formula: plantilla.formula || '', vehiculo: plantilla.vehiculo || '', presentacion: plantilla.presentacion || '', dosis: plantilla.dosis || '', via: plantilla.via || '', frecuencia: plantilla.frecuencia || '', duracion: plantilla.duracion || '', cantidad: plantilla.cantidad || '', indicaciones: plantilla.indicaciones || '' };
}
export const validarMagistrales = items => items.some(i => i.tipo === 'magistral' && (!i.formula?.trim() || !i.vehiculo?.trim() || !i.cantidad?.trim())) ? ['composición, vehículo y cantidad final de cada fórmula magistral'] : [];
