import Fuse from 'fuse.js';
import gesCatalog from '@/data/ges_catalog.json';

const catalog = gesCatalog;

const fuse = new Fuse(catalog.filter(p => p.activo), {
  keys: [
    { name: 'nombre', weight: 0.5 },
    { name: 'keywords', weight: 0.4 },
    { name: 'categoria', weight: 0.1 },
  ],
  threshold: 0.4,
  includeScore: true,
  minMatchCharLength: 2,
});

export function searchGes(query, edad) {
  if (!query.trim()) {
    if (edad !== undefined) return suggestByAge(edad);
    return catalog.filter(p => p.activo);
  }
  const results = fuse.search(query);
  let items = results.map(r => r.item);
  if (edad !== undefined) {
    const byAge = items.filter(p => edad >= p.edadMin && edad <= p.edadMax);
    const rest = items.filter(p => edad < p.edadMin || edad > p.edadMax);
    items = [...byAge, ...rest];
  }
  return items;
}

export function suggestByAge(edad) {
  return catalog.filter(p => p.activo && edad >= p.edadMin && edad <= p.edadMax);
}

export function getAllPathologies() {
  return catalog;
}
