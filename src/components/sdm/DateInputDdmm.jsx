import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';

/**
 * Input de fecha en formato DD/MM/YYYY (autoformatea con "/" al tipear).
 * Emite onChange con valor en formato ISO "YYYY-MM-DD" para que el resto
 * de la app (Supabase columnas DATE) no cambie.
 *
 * Reemplaza al <input type="date" /> nativo, cuya UI varía por OS/locale y
 * que en Mac es-CL a veces no commitea el valor cuando se tipea manualmente.
 */

function isoToDdmm(iso) {
  if (!iso) return '';
  const m = String(iso).slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}

function ddmmToIso(ddmm) {
  if (!ddmm) return '';
  const m = ddmm.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return '';
  const dd = parseInt(m[1], 10), mm = parseInt(m[2], 10), yyyy = parseInt(m[3], 10);
  if (dd < 1 || dd > 31 || mm < 1 || mm > 12 || yyyy < 1900 || yyyy > 2100) return '';
  return `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
}

export default function DateInputDdmm({ value, onChange, placeholder = 'DD/MM/AAAA', className = '', ...rest }) {
  const [draft, setDraft] = useState(isoToDdmm(value));

  useEffect(() => { setDraft(isoToDdmm(value)); }, [value]);

  const handleChange = (e) => {
    let raw = e.target.value.replace(/[^0-9/]/g, '');
    // Autoformatear: insertar "/" después de DD y DD/MM
    let formatted = raw;
    if (!raw.includes('/')) {
      if (raw.length >= 5) formatted = `${raw.slice(0, 2)}/${raw.slice(2, 4)}/${raw.slice(4, 8)}`;
      else if (raw.length >= 3) formatted = `${raw.slice(0, 2)}/${raw.slice(2, 4)}`;
    } else {
      // Si ya tiene "/", solo limitar largo
      formatted = raw.slice(0, 10);
    }
    setDraft(formatted);
    const iso = ddmmToIso(formatted);
    if (iso) onChange(iso);
    else if (formatted === '') onChange('');
  };

  return (
    <Input
      type="text"
      inputMode="numeric"
      maxLength={10}
      value={draft}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
      {...rest}
    />
  );
}
