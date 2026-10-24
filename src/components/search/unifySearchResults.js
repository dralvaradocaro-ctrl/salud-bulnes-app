const normalizeName = name => String(name || '').normalize('NFD').replace(/\p{Diacritic}/gu, '')
  .toLowerCase().replace(/^(?:score|escala|calculadora)(?: de)?\s+/, '').replace(/\s+/g, ' ').trim();

// Resolve explicit calculator bindings before deduplicating. Clinical topics
// remain separate: mentioning a score does not make a protocol its calculator.
export function unifySearchResults(results, calculators, resolveCalculatorId) {
  const catalog = new Map(calculators.map(calc => [calc.id, calc]));
  const seen = new Set();
  const unified = [];
  for (const result of results) {
    let item = result;
    if (result.type === 'tool') {
      let calculatorId = resolveCalculatorId(result);
      if (!calculatorId && result.reference_url?.startsWith('/AllCalculators?')) {
        calculatorId = new URLSearchParams(result.reference_url.split('?')[1]).get('calc');
      }
      // Legacy records may have migrated IDs. Match only an exact, unique
      // calculator title/short title, never words mentioned in descriptions.
      const name = normalizeName(result.name);
      const matches = !calculatorId && name ? calculators.filter(calc =>
        normalizeName(calc.name) === name || normalizeName(calc.name.split(/\s+[—–]\s+/)[0]) === name
      ) : [];
      const calculator = catalog.get(calculatorId) || (matches.length === 1 ? matches[0] : null);
      if (calculator) item = { ...calculator, type: 'calculator', ...(result.aiReason ? { aiReason: result.aiReason } : {}) };
    }
    const key = item.type === 'page' ? `page:${item.page}` : `${item.type}:${item.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unified.push(item);
  }
  return unified;
}

export function limitSearchResults(results) {
  const limits = { topic: 5, tool: 3, calculator: 3, page: 4 };
  const counts = {};
  return results.filter(item => {
    counts[item.type] = (counts[item.type] || 0) + 1;
    return counts[item.type] <= (limits[item.type] || 4);
  });
}
