import { supabase } from './supabase';

const STORAGE_KEY = 'proa_pseudonymous_registry_v1'; // caché local (respaldo offline)
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

// ─────────────── Mapeo fila Supabase ↔ registro local ───────────────
const rowToRecord = (row) => ({
  id: row.id,
  code: row.code,
  bedCode: row.bed_code,
  servicio: row.servicio || '',
  updatedAt: row.updated_at,
  evolutions: Array.isArray(row.evolutions) ? row.evolutions : [],
});

const recordToRow = (record) => ({
  id: record.id,
  code: record.code,
  bed_code: record.bedCode,
  servicio: record.servicio || '',
  evolutions: record.evolutions || [],
  updated_at: record.updatedAt,
});

const newId = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;

// ─────────────── Caché local (lectura instantánea / offline) ───────────────
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
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records || []));
  } catch {
    // Best-effort cache.
  }
}

// ─────────────── Supabase (fuente de verdad, multi-dispositivo) ───────────────
export async function fetchProaRecords() {
  try {
    const { data, error } = await supabase
      .from('proa_records')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    const records = (data || []).map(rowToRecord);
    writeProaRegistry(records);
    return records;
  } catch {
    // Sin conexión / error → usar la última caché conocida.
    return readProaRegistry();
  }
}

export async function saveProaRecord(form, options = {}) {
  const now = new Date().toISOString();
  const safeForm = sanitizeProaRecord(form);
  const bedCode = safeForm.cama || 'SIN-CAMA';
  const replaceExisting = options.replaceExisting || form?.__proaRegistryMode === 'new_patient';

  // Registro existente en esa cama (para encadenar evoluciones del mismo paciente).
  let existing = null;
  try {
    const { data } = await supabase
      .from('proa_records')
      .select('*')
      .eq('bed_code', bedCode)
      .maybeSingle();
    existing = data ? rowToRecord(data) : null;
  } catch {
    existing = readProaRegistry().find((r) => r.bedCode === bedCode) || null;
  }

  const record = {
    id: existing?.id || newId(),
    code: replaceExisting || !existing ? generateProaCode(form) : existing.code,
    bedCode,
    servicio: safeForm.servicio || '',
    updatedAt: now,
    evolutions: [
      { savedAt: now, form: safeForm },
      ...(replaceExisting ? [] : (existing?.evolutions || [])),
    ].slice(0, 12),
  };

  const { error } = await supabase
    .from('proa_records')
    .upsert(recordToRow(record), { onConflict: 'bed_code' });
  if (error) throw error;

  // Mantener la caché local en sincronía.
  const cache = readProaRegistry();
  writeProaRegistry([record, ...cache.filter((r) => r.id !== record.id && r.bedCode !== bedCode)]);
  return record;
}

export async function moveProaRecordToBed(sourceBedCode, targetBedCode, targetService = '') {
  if (!sourceBedCode || !targetBedCode || sourceBedCode === targetBedCode) return null;

  const { data: srcRow } = await supabase
    .from('proa_records')
    .select('*')
    .eq('bed_code', sourceBedCode)
    .maybeSingle();
  if (!srcRow) return null;

  const src = rowToRecord(srcRow);
  const now = new Date().toISOString();
  const movedEvolutions = (src.evolutions || []).map((evolution) => ({
    ...evolution,
    form: sanitizeProaRecord({
      ...(evolution.form || {}),
      cama: targetBedCode,
      servicio: targetService || evolution.form?.servicio || src.servicio || '',
    }),
  }));

  // Limpiar la cama destino y mover el registro de origen hacia ella.
  await supabase.from('proa_records').delete().eq('bed_code', targetBedCode);
  const { error } = await supabase
    .from('proa_records')
    .update({
      bed_code: targetBedCode,
      servicio: targetService || src.servicio || '',
      updated_at: now,
      evolutions: movedEvolutions,
    })
    .eq('bed_code', sourceBedCode);
  if (error) throw error;

  return { ...src, bedCode: targetBedCode, servicio: targetService || src.servicio || '', updatedAt: now, evolutions: movedEvolutions };
}

export function getLatestProaForm(record) {
  return record?.evolutions?.[0]?.form || null;
}

// ─────────────── Formulario pendiente (traspaso entre páginas) ───────────────
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
