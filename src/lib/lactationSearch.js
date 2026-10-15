// Búsqueda en el listado de fármacos y lactancia (datos de e-lactancia.org).
// Ignora tildes, mayúsculas y signos; busca en nombre, sinónimos y nombre de la ficha original.

export const normalizeDrugText = value => (value || '')
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const searchableNames = drug => [drug.name, drug.source, ...(drug.aliases || [])].filter(Boolean).map(normalizeDrugText);

// 0 = nombre empieza igual, 1 = alguna palabra empieza igual, 2 = contiene el texto, null = no coincide.
function matchRank(drug, query) {
  const names = searchableNames(drug);
  if (names.some(name => name.startsWith(query))) return 0;
  if (names.some(name => name.split(' ').some(word => word.startsWith(query)))) return 1;
  if (names.some(name => name.includes(query))) return 2;
  return null;
}

export function searchDrugs(drugs, query, level = null) {
  const pool = level === null ? drugs : drugs.filter(drug => drug.level === level);
  const q = normalizeDrugText(query);
  if (!q) return pool;
  return pool
    .map(drug => ({ drug, rank: matchRank(drug, q) }))
    .filter(({ rank }) => rank !== null)
    .sort((a, b) => a.rank - b.rank || a.drug.name.localeCompare(b.drug.name, 'es'))
    .map(({ drug }) => drug);
}

// Las alternativas vienen con el nombre de la ficha de e-lactancia ("Sertralina hidrocloruro"):
// se buscan por nombre exacto y, si no, por la primera palabra del principio activo, solo cuando
// esa palabra identifica a un único fármaco con el mismo nivel (así una variante tópica no salta
// a la sistémica).
export function findDrugByName(drugs, name, level = null) {
  const target = normalizeDrugText(name);
  if (!target) return null;
  const exact = drugs.find(drug => searchableNames(drug).includes(target));
  if (exact) return exact;
  const head = target.split(' ')[0];
  if (head.length < 5) return null;
  const candidates = drugs.filter(drug => normalizeDrugText(drug.name).split(' ')[0] === head);
  if (candidates.length !== 1) return null;
  return level === null || candidates[0].level === level ? candidates[0] : null;
}
