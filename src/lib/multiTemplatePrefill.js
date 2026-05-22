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

export function setMultiPrefill(data) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(data || {}));
  } catch {
    // sessionStorage puede no estar disponible en modo privado; no es crítico.
  }
}

export function getMultiPrefill() {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearMultiPrefill() {
  try { sessionStorage.removeItem(KEY); } catch { /* noop */ }
}
