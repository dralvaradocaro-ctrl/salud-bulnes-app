import { useEffect, useMemo, useState } from 'react';
import { loadNrsHospitalLocations } from '@/lib/hospitalNrsRegistry';

// Formato RUT chileno: 12345678K → 12.345.678-K.
export function formatRut(raw) {
  const clean = String(raw || '').replace(/[^0-9kK]/g, '').toUpperCase();
  if (!clean) return '';
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  return body ? `${body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}` : dv;
}

export const EMPTY_PATIENT_LOCATION = { service: '', sala: '', bedCode: '', name: '', rut: '' };

// Una sala es la combinación servicio + sala física; los servicios sin salas usan el nombre del servicio.
const salaKey = location => `${location.service}|${location.unitLabel || ''}`;

export const isPatientLocationComplete = value => Boolean(value?.bedCode && value?.name?.trim() && value?.rut?.trim());

// Etiquetas legibles para imprimir y para confirmar dónde quedó guardado.
export function describePatientLocation(value, locations) {
  const location = locations.find(item => item.code === value?.bedCode);
  return {
    name: value?.name?.trim() || '',
    rut: value?.rut?.trim() || '',
    servicio: location?.serviceLabel || value?.service || '',
    cama: [location?.unitLabel, location?.bedLabel].filter(Boolean).join(' · ') || value?.bedCode || '',
  };
}

export function useHospitalLocations(enabled = true) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!enabled) return undefined;
    let active = true;
    setLoading(true); setError('');
    loadNrsHospitalLocations()
      .then(items => { if (active) setLocations(items); })
      .catch(() => { if (active) setError('No fue posible cargar las camas. Intenta nuevamente.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [enabled]);
  return { locations, loading, error };
}

/**
 * Campos de identificación y ubicación del paciente: nombre, RUT, sala y cama.
 * Controlado: recibe `value` y avisa cada cambio con `onChange(nextValue)`.
 */
export default function PatientLocationFields({ value, onChange, locations, loading = false, disabled = false, compact = false }) {
  const control = compact
    ? 'mt-1 h-9 w-full rounded-md border border-slate-200 bg-white px-2.5 text-sm outline-none focus:border-emerald-500'
    : 'mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500';
  const label = compact ? 'text-[11px] font-semibold text-slate-500' : 'text-xs font-bold text-slate-700';
  const current = { ...EMPTY_PATIENT_LOCATION, ...value };

  const salas = useMemo(() => {
    const groups = new Map();
    locations.forEach(location => {
      if (!groups.has(location.service)) groups.set(location.service, { label: location.serviceLabel, salas: new Map() });
      const key = salaKey(location);
      if (!groups.get(location.service).salas.has(key)) groups.get(location.service).salas.set(key, location.unitLabel || location.serviceLabel);
    });
    return [...groups.entries()];
  }, [locations]);
  const beds = useMemo(() => locations.filter(location => salaKey(location) === current.sala), [locations, current.sala]);

  const set = patch => onChange({ ...current, ...patch });
  const selectSala = key => set({ sala: key, service: key.split('|')[0] || '', bedCode: '' });

  return (
    <div className={`grid gap-3 ${compact ? 'sm:grid-cols-4' : 'sm:grid-cols-2'}`}>
      <label className="block">
        <span className={label}>Nombre</span>
        <input value={current.name} onChange={event => set({ name: event.target.value })} disabled={disabled}
          className={control} placeholder="Nombre y apellidos" autoComplete="off" />
      </label>
      <label className="block">
        <span className={label}>RUT</span>
        <input value={current.rut} onChange={event => set({ rut: formatRut(event.target.value) })} disabled={disabled}
          className={control} placeholder="12.345.678-9" autoComplete="off" />
      </label>
      <label className="block">
        <span className={label}>Sala</span>
        <select value={current.sala} onChange={event => selectSala(event.target.value)} disabled={disabled || loading} className={control}>
          <option value="">{loading ? 'Cargando…' : 'Seleccionar sala…'}</option>
          {salas.map(([service, group]) => (
            <optgroup key={service} label={group.label}>
              {[...group.salas.entries()].map(([key, salaLabel]) => <option key={key} value={key}>{salaLabel}</option>)}
            </optgroup>
          ))}
        </select>
      </label>
      <label className="block">
        <span className={label}>Cama</span>
        <select value={current.bedCode} onChange={event => set({ bedCode: event.target.value })} disabled={disabled || !current.sala} className={control}>
          <option value="">{current.sala ? 'Seleccionar cama…' : 'Primero la sala'}</option>
          {beds.map(location => <option key={location.code} value={location.code}>Cama {location.bedLabel}</option>)}
        </select>
      </label>
    </div>
  );
}
