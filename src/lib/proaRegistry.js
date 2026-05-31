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

export function moveProaRecordToBed(sourceBedCode, targetBedCode, targetService = '') {
  const existing = readProaRegistry();
  const source = existing.find((record) => record.bedCode === sourceBedCode);
  if (!source || !targetBedCode || sourceBedCode === targetBedCode) return null;

  const now = new Date().toISOString();
  const moved = {
    ...source,
    bedCode: targetBedCode,
    servicio: targetService || source.servicio || '',
    updatedAt: now,
    evolutions: (source.evolutions || []).map((evolution) => ({
      ...evolution,
      form: sanitizeProaRecord({
        ...(evolution.form || {}),
        cama: targetBedCode,
        servicio: targetService || evolution.form?.servicio || source.servicio || '',
      }),
    })),
  };

  const next = [
    moved,
    ...existing.filter((record) => record.id !== source.id && record.bedCode !== targetBedCode),
  ];
  writeProaRegistry(next);
  return moved;
}

export function getProaRecordByBed(bedCode) {
  return readProaRegistry().find((record) => record.bedCode === bedCode) || null;
}

export function moveProaRecord(recordId, newBedCode, newServicio = '') {
  const existing = readProaRegistry();
  const recordIndex = existing.findIndex((r) => r.id === recordId);
  if (recordIndex === -1) return null;

  const targetRecord = existing[recordIndex];
  targetRecord.bedCode = newBedCode;
  if (newServicio) targetRecord.servicio = newServicio;
  targetRecord.updatedAt = new Date().toISOString();

  // If there's an existing record in the target bed, it will be overwritten
  // to avoid having two records in the same bed.
  const updatedRecords = [
    targetRecord,
    ...existing.filter((item) => item.id !== targetRecord.id && item.bedCode !== newBedCode)
  ];
  writeProaRegistry(updatedRecords);
  return targetRecord;
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
