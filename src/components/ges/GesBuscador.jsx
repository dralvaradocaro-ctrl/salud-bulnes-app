import { useState, useRef, useCallback, useEffect } from 'react';
import { searchGes } from '@/lib/ges-search';

export default function GesBuscador({ edad, onSelect, value }) {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => { setQuery(value || ''); }, [value]);

  const handleSearch = useCallback((q) => {
    setQuery(q);
    if (q.length >= 1) {
      setResults(searchGes(q, edad).slice(0, 15));
      setOpen(true);
    } else if (edad !== undefined) {
      setResults(searchGes('', edad).slice(0, 15));
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [edad]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative flex-1">
      <input
        type="text"
        className="f-input w-full"
        value={query}
        onChange={e => handleSearch(e.target.value)}
        onFocus={() => handleSearch(query)}
        placeholder="Buscar problema de salud GES..."
      />
      {open && results.length > 0 && (
        <div className="absolute z-50 left-0 right-0 top-full bg-white border border-gray-300 shadow-lg max-h-60 overflow-y-auto" style={{ fontSize: '11px' }}>
          {results.map(p => (
            <div
              key={p.id}
              className="px-2 py-1.5 cursor-pointer hover:bg-gray-100 flex items-center gap-2"
              onMouseDown={() => { onSelect(p); setQuery(p.nombre); setOpen(false); }}
            >
              <span className="flex-1">{p.nombre}</span>
              {p.oncologico && (
                <span className="text-red-600 font-semibold" style={{ fontSize: '9px' }}>ONC</span>
              )}
              <span className="text-gray-400" style={{ fontSize: '9px' }}>{p.categoria}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
