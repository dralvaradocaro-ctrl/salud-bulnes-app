// Puente entre el generador multi-plantilla y los formularios oficiales
// (GES, Solicitud de Exámenes, Informe Biomédico). Cuando el usuario
// completa los datos del paciente en el wizard, se guardan en
// sessionStorage para que las páginas dedicadas los lean al montar y
// prellenen sus campos.
//
// Forma esperada del payload (cualquier campo es opcional):
//   {
//     patient_name:        'Pérez Soto, Juan',
//     patient_rut:         '12.345.678-9',
//     patient_fecha_nac:   '1975-04-12',
//     patient_direccion:   'Calle 123',
//     patient_comuna:      'Bulnes',
//     patient_region:      'Ñuble',
//     patient_telefono:    '+56 9 1234 5678',
//     patient_correo:      'paciente@correo.cl',
//     prevision:           'Fonasa',
//     diagnostico:         'Texto libre',
//     n_ficha:             '12345',
//   }

import { expandPatientProfile } from '@/lib/patientProfile';

const KEY = 'multiTemplatePrefill_v1';
// Los formularios oficiales se abren en pestañas nuevas con
// `rel="noopener noreferrer"`. Eso impide que la nueva pestaña vea el
// sessionStorage del padre, por lo que el payload debe vivir en
// localStorage (compartido entre pestañas). Lo dejamos expirar pronto
// para que datos de una tanda anterior no contaminen una sesión nueva.
const TTL_MS = 30 * 60 * 1000; // 30 min

// Se guardan los datos con todos sus alias (edad/patient_edad, direccion/domicilio…) para que
// cada formulario encuentre el nombre que ya usa.
export function setMultiPrefill(data) {
  const payload = JSON.stringify({ data: expandPatientProfile(data || {}), ts: Date.now() });
  try { localStorage.setItem(KEY, payload); } catch { /* noop */ }
  // Mantenemos también sessionStorage por compatibilidad (lecturas en la
  // misma pestaña que generó el lote).
  try { sessionStorage.setItem(KEY, payload); } catch { /* noop */ }
}

const readFrom = (storage) => {
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Compatibilidad con el formato viejo (objeto plano, sin {data,ts}).
    if (!parsed || typeof parsed !== 'object') return null;
    if (parsed.data && parsed.ts) {
      if (Date.now() - parsed.ts > TTL_MS) return null;
      return parsed.data;
    }
    return parsed; // formato legado
  } catch { return null; }
};

// Momento en que se guardó el último lote (0 si no hay o expiró).
export function getMultiPrefillTimestamp() {
  if (typeof window === 'undefined') return 0;
  for (const storage of [window.sessionStorage, window.localStorage]) {
    try {
      const parsed = JSON.parse(storage.getItem(KEY) || 'null');
      if (parsed?.ts && Date.now() - parsed.ts <= TTL_MS) return parsed.ts;
    } catch { /* noop */ }
  }
  return 0;
}

export function getMultiPrefill() {
  if (typeof window === 'undefined') return null;
  return readFrom(window.sessionStorage) || readFrom(window.localStorage);
}

export function clearMultiPrefill() {
  try { sessionStorage.removeItem(KEY); } catch { /* noop */ }
  try { localStorage.removeItem(KEY); } catch { /* noop */ }
}
