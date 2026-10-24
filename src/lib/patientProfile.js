// Datos del paciente que se escriben una sola vez en el generador múltiple y se reparten a
// todos los documentos. Cada formulario histórico lee el mismo dato con otro nombre
// (`edad`, `patient_edad`, `patient_age`…); `expandPatientProfile` agrega todos esos alias
// para que cualquier formulario encuentre lo suyo sin tener que modificarlo.

export const PATIENT_FIELD_GROUPS = [
  { id: 'identificacion', title: 'Identificación' },
  { id: 'contacto', title: 'Contacto' },
  { id: 'atencion', title: 'Atención' },
  { id: 'clinico', title: 'Clínico' },
];

export const PATIENT_FIELDS = [
  { key: 'patient_name', label: 'Nombre (Apellidos, Nombres)', group: 'identificacion', placeholder: 'Pérez Soto, Juan Andrés', wide: true },
  { key: 'patient_rut', label: 'RUT', group: 'identificacion', placeholder: '12.345.678-9' },
  { key: 'patient_fecha_nac', label: 'Fecha de nacimiento', group: 'identificacion', type: 'date' },
  { key: 'patient_edad', label: 'Edad', group: 'identificacion', placeholder: 'Se calcula con la fecha de nacimiento' },
  { key: 'patient_sexo', label: 'Sexo', group: 'identificacion', type: 'select', options: ['Femenino', 'Masculino'] },
  { key: 'patient_direccion', label: 'Dirección', group: 'contacto', wide: true },
  { key: 'patient_comuna', label: 'Comuna', group: 'contacto' },
  { key: 'patient_telefono', label: 'Teléfono', group: 'contacto' },
  { key: 'patient_correo', label: 'Correo electrónico', group: 'contacto' },
  { key: 'prevision', label: 'Previsión', group: 'atencion', placeholder: 'Fonasa A, Isapre…' },
  { key: 'n_ficha', label: 'N° de ficha', group: 'atencion' },
  { key: 'servicio', label: 'Servicio', group: 'atencion' },
  { key: 'cama', label: 'Sala / cama', group: 'atencion' },
  { key: 'diagnostico', label: 'Diagnóstico', group: 'clinico', type: 'textarea', wide: true },
  { key: 'resumen_caso', label: 'Resumen clínico / antecedentes', group: 'clinico', type: 'textarea', wide: true },
];

export const PATIENT_FIELD_KEYS = PATIENT_FIELDS.map(field => field.key);
export const patientFieldLabel = key => PATIENT_FIELDS.find(field => field.key === key)?.label || key;

// Otros nombres con que formularios y plantillas de la BD piden cada dato.
const ALIASES = {
  patient_name: ['nombre_paciente', 'paciente', 'nombre'],
  patient_rut: ['rut'],
  patient_edad: ['edad', 'patient_age'],
  patient_sexo: ['sexo'],
  patient_direccion: ['direccion', 'domicilio'],
  patient_comuna: ['comuna'],
  patient_telefono: ['telefono'],
  patient_correo: ['correo'],
  cama: ['sala_cama'],
  diagnostico: ['diagnostico_principal'],
  resumen_caso: ['antecedentes', 'antecedentes_relevantes', 'clinical_text'],
};
const ALIAS_TO_KEY = Object.fromEntries(Object.entries(ALIASES).flatMap(([key, names]) => names.map(name => [name, key])));

// Campo canónico al que corresponde el nombre que usa un formulario (null si es propio del formulario).
export function canonicalPatientKey(fieldName) {
  if (PATIENT_FIELD_KEYS.includes(fieldName)) return fieldName;
  return ALIAS_TO_KEY[fieldName] || null;
}

// Edad en años cumplidos a partir de una fecha ISO (AAAA-MM-DD); '' si no es válida.
export function ageFromBirthDate(iso, today = new Date()) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  if (!match) return '';
  const [, y, m, d] = match.map(Number);
  let age = today.getFullYear() - y;
  if (today.getMonth() + 1 < m || (today.getMonth() + 1 === m && today.getDate() < d)) age -= 1;
  return age >= 0 && age < 130 ? String(age) : '';
}

const todayChile = (now = new Date()) => new Intl.DateTimeFormat('es-CL', {
  timeZone: 'America/Santiago', day: '2-digit', month: '2-digit', year: 'numeric',
}).format(now);

export function expandPatientProfile(profile = {}, now = new Date()) {
  const base = { ...profile };
  if (!String(base.patient_edad || '').trim()) {
    const age = ageFromBirthDate(base.patient_fecha_nac, now);
    if (age) base.patient_edad = age;
  }
  const out = { ...base };
  Object.entries(ALIASES).forEach(([key, names]) => {
    const value = base[key];
    if (value === undefined || value === '') return;
    names.forEach(name => { if (!String(out[name] ?? '').trim()) out[name] = value; });
  });
  if (!out.ubicacion && (base.servicio || base.cama)) out.ubicacion = [base.servicio, base.cama].filter(Boolean).join(' · ');
  if (!out.fecha) out.fecha = todayChile(now);
  return out;
}
