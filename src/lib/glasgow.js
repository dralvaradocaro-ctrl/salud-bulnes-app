// Escala de coma de Glasgow del adulto: componentes, total y clasificación del TEC.
// Las opciones van de 1 (peor) al máximo de cada componente.
export const GCS_COMPONENTS = [
  { key: 'ocular', label: 'Apertura ocular', options: ['Ninguna', 'Al dolor', 'Al llamado', 'Espontánea'] },
  { key: 'verbal', label: 'Respuesta verbal', options: ['Ninguna', 'Sonidos incomprensibles', 'Palabras inapropiadas', 'Confusa', 'Orientada'] },
  { key: 'motora', label: 'Respuesta motora', options: ['Ninguna', 'Extensión', 'Flexión anormal', 'Retira al dolor', 'Localiza el dolor', 'Obedece órdenes'] },
];

export const GCS_NORMAL = { ocular: 4, verbal: 5, motora: 6 };

export function clampGcsValue(key, value) {
  const component = GCS_COMPONENTS.find(c => c.key === key);
  if (!component) return null;
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return 1;
  return Math.min(component.options.length, Math.max(1, n));
}

export function gcsTotal(values = GCS_NORMAL) {
  return GCS_COMPONENTS.reduce((sum, c) => sum + clampGcsValue(c.key, values[c.key] ?? 1), 0);
}

// Clasificación clásica del TEC: leve 13–15, moderado 9–12, grave 3–8.
export function gcsSeverity(total) {
  if (total >= 13) return { id: 'leve', label: 'TEC leve', range: '13–15' };
  if (total >= 9) return { id: 'moderado', label: 'TEC moderado', range: '9–12' };
  return { id: 'grave', label: 'TEC grave', range: '3–8' };
}

// La calculadora se ofrece solo en protocolos de TEC del adulto.
export function isAdultTbiTopic(topic) {
  const name = String(topic?.name || '');
  if (!/craneoencef|encefalocran|\bTEC\b/i.test(name)) return false;
  return !/pedi[aá]tric|niñ|lactante|neonat/i.test(name);
}
