import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';

/**
 * Input de hora en formato 24h "HH:MM".
 *
 * Reemplaza al input type="time" cuya UI depende del locale del OS (en Mac
 * con español-CL muestra AM/PM y a veces no commitea el valor hasta
 * blur, perdiendo el horario al guardar). Este componente usa un input de
 * texto con autoformat:
 *
 *  - Acepta tipeo libre y va emitiendo onChange normalizado.
 *  - Al perder foco, intenta normalizar a "HH:MM" (rellena con 0s, fuerza :).
 *  - Si el valor es inválido, queda vacío y el caller lo trata como null.
 *
 * Uso: <TimeInput24h value={form.time_from} onChange={v => setForm(...)} />
 */

function normalizeTime(raw) {
  if (!raw) return '';
  const cleaned = String(raw).replace(/[^0-9:]/g, '');
  if (!cleaned) return '';
  let h = '', m = '';
  if (cleaned.includes(':')) {
    const [a, b] = cleaned.split(':');
    h = a; m = b || '';
  } else {
    if (cleaned.length <= 2) { h = cleaned; m = ''; }
    else { h = cleaned.slice(0, 2); m = cleaned.slice(2, 4); }
  }
  if (h === '') return '';
  let hh = parseInt(h, 10);
  if (Number.isNaN(hh)) return '';
  if (hh > 23) hh = 23;
  let mm = parseInt(m || '0', 10);
  if (Number.isNaN(mm)) mm = 0;
  if (mm > 59) mm = 59;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export default function TimeInput24h({ value, onChange, className = '', placeholder = 'HH:MM', ...rest }) {
  const [draft, setDraft] = useState(value || '');

  // Sincronizar si cambia de afuera (ej. reset del form).
  useEffect(() => {
    setDraft(value || '');
  }, [value]);

  const handleChange = (e) => {
    const v = e.target.value;
    // Permitir tipeo intermedio (ej. "1", "14", "14:", "14:3"); solo aceptar dígitos y ":".
    const filtered = v.replace(/[^0-9:]/g, '').slice(0, 5);
    setDraft(filtered);
    // Si ya parece HH:MM completo, emitir normalizado para que el padre lo guarde.
    if (/^\d{2}:\d{2}$/.test(filtered)) {
      const n = normalizeTime(filtered);
      if (n) onChange(n);
    } else if (filtered === '') {
      onChange('');
    }
  };

  const handleBlur = () => {
    const n = normalizeTime(draft);
    setDraft(n);
    onChange(n);
  };

  return (
    <Input
      type="text"
      inputMode="numeric"
      pattern="[0-2][0-9]:[0-5][0-9]"
      maxLength={5}
      value={draft}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
      {...rest}
    />
  );
}
