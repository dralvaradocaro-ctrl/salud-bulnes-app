const STORAGE_KEY = 'proa_pseudonymous_registry_v1';
const PENDING_KEY = 'proa_pending_form_v1';

const clone = (value) => JSON.parse(JSON.stringify(value));

export function sanitizeProaRecord(form) {
  const sanitized = clone(form || {});
  sanitized.paciente = '';
  sanitized.rut = '';
  sanitized.n_ficha = '';
  delete sanitized.__proaRegistryMode;
  return sanitized;
}

export function generateProaCode({ paciente = '', rut = '' } = {}) {
  const initials = String(paciente)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'PX';
  const cleanRut = String(rut).replace(/[^0-9kK]/g, '').toUpperCase();
  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1) || 'X';
  const lastTwo = body.slice(-2).padStart(2, '0');
  const random = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `${initials}${lastTwo}-${dv}-${random}`;
}

export function readProaRegistry() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeProaRegistry(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records || []));
}

export function saveProaRecord(form, options = {}) {
  const now = new Date().toISOString();
  const safeForm = sanitizeProaRecord(form);
  const bedCode = safeForm.cama || 'SIN-CAMA';
  const existing = readProaRegistry();
  const replaceExisting = options.replaceExisting || form?.__proaRegistryMode === 'new_patient';
  const sameBed = replaceExisting ? null : existing.find((record) => record.bedCode === bedCode);
  const record = {
    id: sameBed?.id || globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`,
    code: sameBed?.code || generateProaCode(form),
    bedCode,
    servicio: safeForm.servicio || '',
    updatedAt: now,
    evolutions: [
      {
        savedAt: now,
        form: safeForm,
      },
      ...(sameBed?.evolutions || []),
    ].slice(0, 12),
  };
  const next = [record, ...existing.filter((item) => item.id !== record.id && item.bedCode !== bedCode)];
  writeProaRegistry(next);
  return record;
}

export function getProaRecordByBed(bedCode) {
  return readProaRegistry().find((record) => record.bedCode === bedCode) || null;
}

export function getLatestProaForm(record) {
  return record?.evolutions?.[0]?.form || null;
}

export function setPendingProaForm(form) {
  const pending = sanitizeProaRecord(form);
  if (form?.__proaRegistryMode) pending.__proaRegistryMode = form.__proaRegistryMode;
  sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));
}

export function takePendingProaForm() {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(PENDING_KEY);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
