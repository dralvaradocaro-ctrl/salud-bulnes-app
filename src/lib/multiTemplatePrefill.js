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

const KEY = 'multiTemplatePrefill_v1';
// Los formularios oficiales se abren en pestañas nuevas con
// `rel="noopener noreferrer"`. Eso impide que la nueva pestaña vea el
// sessionStorage del padre, por lo que el payload debe vivir en
// localStorage (compartido entre pestañas). Lo dejamos expirar pronto
// para que datos de una tanda anterior no contaminen una sesión nueva.
const TTL_MS = 30 * 60 * 1000; // 30 min

export function setMultiPrefill(data) {
  const payload = JSON.stringify({ data: data || {}, ts: Date.now() });
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

export function getMultiPrefill() {
  if (typeof window === 'undefined') return null;
  return readFrom(window.sessionStorage) || readFrom(window.localStorage);
}

export function clearMultiPrefill() {
  try { sessionStorage.removeItem(KEY); } catch { /* noop */ }
  try { localStorage.removeItem(KEY); } catch { /* noop */ }
}
