// Índice de términos del arsenal local para destacar medicamentos dentro del texto de los protocolos.
// Cada término (principio activo, o su primera palabra si es distintiva: "Heparina" de "Heparina sódica")
// apunta a todas las presentaciones que lo contienen, incluidas las asociaciones ("Amoxicilina + …").

// Primeras palabras que no identifican un fármaco por sí solas.
const GENERIC_FIRST_WORDS = new Set([
  'acido', 'sulfato', 'cloruro', 'fosfato', 'bicarbonato', 'gluconato', 'carbonato', 'citrato', 'sodio',
  'potasio', 'calcio', 'magnesio', 'solucion', 'suero', 'vitamina', 'complejo', 'agua', 'alcohol', 'oxido',
]);

// Pliega un carácter (sin tildes, minúscula) conservando la longitud, para mapear posiciones 1 a 1.
export const foldChar = ch => (ch.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()[0] || ch);
export const foldText = text => Array.from(text, foldChar).join('');

const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function formatPresentation(med) {
  const dose = med.dose_value ? `${String(med.dose_value).replace('.', ',')} ${med.dose_unit || ''}`.trim() : '';
  return [med.presentation, dose].filter(Boolean).join(' · ');
}

export function buildArsenalIndex(meds = []) {
  const groups = new Map(); // término plegado → { label, items: Map(ingrediente → Set(presentación)) }
  const add = (term, label, med) => {
    if (term.length < 4) return;
    if (!groups.has(term)) groups.set(term, { label, items: new Map() });
    const ingredient = med.active_ingredient || med.name;
    const items = groups.get(term).items;
    if (!items.has(ingredient)) items.set(ingredient, new Set());
    items.get(ingredient).add(formatPresentation(med));
  };
  meds.forEach(med => {
    const ingredient = String(med.active_ingredient || med.name || '').trim();
    if (!ingredient) return;
    ingredient.split('+').map(part => part.trim()).filter(Boolean).forEach(part => {
      const folded = foldText(part);
      add(folded, part, med);
      const [first] = folded.split(/\s+/);
      if (first !== folded && first.length >= 6 && !GENERIC_FIRST_WORDS.has(first)) add(first, part.split(/\s+/)[0], med);
    });
  });
  if (groups.size === 0) return null;
  // Los términos largos primero, para que "heparina sodica" gane a "heparina".
  const terms = [...groups.keys()].sort((a, b) => b.length - a.length);
  const pattern = new RegExp(`(?<![a-z0-9])(?:${terms.map(escapeRegex).join('|')})(?![a-z0-9])`, 'g');
  return { pattern, groups };
}

// Coincidencias [{ start, end, term }] dentro de un texto (posiciones del texto original).
export function findArsenalTerms(index, text) {
  if (!index || !text) return [];
  const folded = foldText(text);
  const found = [];
  index.pattern.lastIndex = 0;
  let match;
  while ((match = index.pattern.exec(folded))) found.push({ start: match.index, end: match.index + match[0].length, term: match[0] });
  return found;
}
