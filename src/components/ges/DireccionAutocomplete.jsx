import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import regiones from '@/data/chile_regiones.json';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

const stateToRegion = {
  "Arica y Parinacota": "Arica y Parinacota",
  "Tarapacá": "Tarapacá",
  "Antofagasta": "Antofagasta",
  "Atacama": "Atacama",
  "Coquimbo": "Coquimbo",
  "Valparaíso": "Valparaíso",
  "Región Metropolitana de Santiago": "Metropolitana de Santiago",
  "Metropolitana": "Metropolitana de Santiago",
  "Santiago Metropolitan": "Metropolitana de Santiago",
  "Region Metropolitana de Santiago": "Metropolitana de Santiago",
  "Santiago": "Metropolitana de Santiago",
  "O'Higgins": "O'Higgins",
  "Libertador General Bernardo O'Higgins": "O'Higgins",
  "Maule": "Maule",
  "Ñuble": "Ñuble",
  "Biobío": "Biobío",
  "Bío-Bío": "Biobío",
  "Bio-Bio": "Biobío",
  "La Araucanía": "Araucanía",
  "Araucanía": "Araucanía",
  "Los Ríos": "Los Ríos",
  "Los Lagos": "Los Lagos",
  "Aysén": "Aysén",
  "Aisén del General Carlos Ibáñez del Campo": "Aysén",
  "Magallanes y de la Antártica Chilena": "Magallanes y Antártica",
  "Magallanes": "Magallanes y Antártica",
};

function findRegion(state) {
  if (stateToRegion[state]) return stateToRegion[state];
  const lower = state.toLowerCase();
  for (const [key, val] of Object.entries(stateToRegion)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) return val;
  }
  const found = regiones.find(r => r.nombre.toLowerCase().includes(lower) || lower.includes(r.nombre.toLowerCase()));
  return found ? found.nombre : '';
}

function findComuna(city, region) {
  const r = regiones.find(r => r.nombre === region);
  if (!r) return city;
  const lower = city.toLowerCase();
  const found = r.comunas.find(c => c.toLowerCase() === lower);
  if (found) return found;
  const partial = r.comunas.find(c => c.toLowerCase().includes(lower) || lower.includes(c.toLowerCase()));
  return partial || city;
}

function getContextValue(feature, prefix) {
  if (!feature.context) return '';
  const ctx = feature.context.find(c => c.id.startsWith(prefix));
  return ctx ? ctx.text : '';
}

export default function DireccionAutocomplete({ direccion, comuna, region, telefono, correo, onDireccionChange, onComunaChange, onRegionChange, onTelefonoChange, onCorreoChange }) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);
  const debounceRef = useRef(null);

  const comunas = useMemo(() => {
    const r = regiones.find(r => r.nombre === region);
    return r ? r.comunas : [];
  }, [region]);

  const search = useCallback(async (q) => {
    if (q.length < 3) { setSuggestions([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${MAPBOX_TOKEN}&country=cl&language=es&types=address,poi,place,locality&limit=5&autocomplete=true`
      );
      const data = await res.json();
      const features = data.features || [];
      setSuggestions(features);
      setOpen(features.length > 0);
    } catch {
      setSuggestions([]);
    }
    setLoading(false);
  }, []);

  const handleInputChange = (val) => {
    onDireccionChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 400);
  };

  const handleSelect = (feature) => {
    const streetName = feature.text || '';
    const houseNumber = feature.address || '';
    const road = houseNumber ? `${streetName} ${houseNumber}` : streetName;
    onDireccionChange(road || direccion);
    const place = getContextValue(feature, 'place');
    const locality = getContextValue(feature, 'locality');
    const regionCtx = getContextValue(feature, 'region');
    const city = place || locality || '';
    if (regionCtx) {
      const matchedRegion = findRegion(regionCtx);
      if (matchedRegion) {
        onRegionChange(matchedRegion);
        onComunaChange(findComuna(city, matchedRegion));
      } else {
        onComunaChange(city);
      }
    } else if (city) {
      onComunaChange(city);
    }
    setOpen(false);
  };

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <>
      <div className="f-row" ref={ref}>
        <span className="f-label">Dirección:</span>
        <div className="relative flex-1">
          <input
            className="f-input w-full"
            value={direccion}
            onChange={e => handleInputChange(e.target.value)}
            placeholder="Escriba dirección..."
          />
          {loading && (
            <span className="absolute right-2 top-1/2 -translate-y-1/2" style={{ fontSize: '9px', color: '#999' }}>
              Buscando...
            </span>
          )}
          {open && suggestions.length > 0 && (
            <div className="absolute z-50 left-0 right-0 top-full bg-white border border-gray-300 shadow-lg max-h-48 overflow-y-auto" style={{ fontSize: '12px' }}>
              {suggestions.map((s, i) => (
                <div
                  key={i}
                  className="px-2 py-1.5 cursor-pointer hover:bg-gray-100 border-b last:border-b-0"
                  onMouseDown={() => handleSelect(s)}
                >
                  📍 {s.place_name}
                </div>
              ))}
            </div>
          )}
        </div>
        <span className="f-label" style={{ marginLeft: '8px' }}>Comuna:</span>
        <select
          className="f-input"
          style={{ flex: '0 0 25%' }}
          value={comuna}
          onChange={e => onComunaChange(e.target.value)}
        >
          <option value="">Seleccione comuna</option>
          {comunas.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="f-row">
        <span className="f-label">Región:</span>
        <select
          className="f-input"
          style={{ flex: '0 0 25%' }}
          value={region}
          onChange={e => { onRegionChange(e.target.value); onComunaChange(''); }}
        >
          <option value="">Seleccione región</option>
          {regiones.map(r => (
            <option key={r.nombre} value={r.nombre}>{r.nombre}</option>
          ))}
        </select>
        <span className="f-label" style={{ marginLeft: '8px' }}>Teléfono:</span>
        <input className="f-input" style={{ flex: '0 0 18%' }} value={telefono} onChange={e => onTelefonoChange(e.target.value)} />
        <span className="f-label" style={{ marginLeft: '8px' }}>Correo electrónico:</span>
        <input className="f-input" style={{ flex: 1 }} value={correo} onChange={e => onCorreoChange(e.target.value)} />
      </div>
    </>
  );
}
