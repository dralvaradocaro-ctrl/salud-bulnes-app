/**
 * Historial de modificaciones de la agenda SDM.
 *
 * - Selector de editor: se persiste en localStorage bajo la key `sdm_editor_name`.
 * - summarizeSdmChanges(prev, curr): genera un resumen humano de los cambios
 *   entre el último guardado (savedData) y el estado actual.
 * - logSdmEdit: inserta una fila en sdm_edit_history.
 */

import { sdmSupabase as supabase } from './sdmSupabase';

export const SDM_EDITOR_KEY = 'sdm_editor_name';
export const ADMIN_PROFILE_KEY = 'admin_profile_name';

/**
 * Devuelve quien edita la agenda SDM:
 *  1) Override manual del picker (localStorage `sdm_editor_name`) si esta seteado.
 *  2) En su defecto, el `admin_profile_name` de la sesion logueada (set por AdminLogin).
 *  3) Vacio si no hay nada.
 *
 * Asi, por defecto, quien tiene su sesion abierta queda registrado en el
 * historial sin requerir un paso extra de seleccion.
 */
export function getSdmEditor() {
  try {
    const override = localStorage.getItem(SDM_EDITOR_KEY);
    if (override) return override;
    return localStorage.getItem(ADMIN_PROFILE_KEY) || '';
  } catch (_) {
    return '';
  }
}

export function setSdmEditor(name) {
  try {
    if (name) localStorage.setItem(SDM_EDITOR_KEY, name);
    else localStorage.removeItem(SDM_EDITOR_KEY);
  } catch (_) { /* ignore */ }
}

/** True si el editor actual proviene del override manual (no del login). */
export function isSdmEditorOverride() {
  try { return !!localStorage.getItem(SDM_EDITOR_KEY); } catch (_) { return false; }
}

function countDayBlockChanges(prevDay, currDay) {
  const prev = Array.isArray(prevDay) ? prevDay : [];
  const curr = Array.isArray(currDay) ? currDay : [];
  const byId = (arr) => Object.fromEntries(arr.filter(b => b?.block_id).map(b => [b.block_id, b]));
  const prevById = byId(prev);
  const currById = byId(curr);
  let added = 0, removed = 0, edited = 0;
  Object.keys(currById).forEach(id => {
    if (!prevById[id]) { added++; return; }
    const a = prevById[id], b = currById[id];
    const idsA = (a.doctor_ids || (a.doctor_id ? [a.doctor_id] : [])).join(',');
    const idsB = (b.doctor_ids || (b.doctor_id ? [b.doctor_id] : [])).join(',');
    if (idsA !== idsB || a.from !== b.from || a.to !== b.to || a.name !== b.name || !!a.suspended !== !!b.suspended) edited++;
  });
  Object.keys(prevById).forEach(id => { if (!currById[id]) removed++; });
  return { added, removed, edited };
}

export function summarizeSdmChanges(prevData, currData) {
  const prev = prevData || {};
  const curr = currData || {};
  const parts = [];

  // Bloqueos por día
  const dates = new Set([
    ...Object.keys(prev.bloqueosOverrides || {}),
    ...Object.keys(curr.bloqueosOverrides || {}),
  ]);
  let totAdd = 0, totRem = 0, totEdit = 0, daysTouched = new Set();
  dates.forEach(date => {
    const { added, removed, edited } = countDayBlockChanges(
      (prev.bloqueosOverrides || {})[date],
      (curr.bloqueosOverrides || {})[date],
    );
    if (added + removed + edited > 0) daysTouched.add(date);
    totAdd += added; totRem += removed; totEdit += edited;
  });
  if (totAdd) parts.push(`${totAdd} bloqueo${totAdd > 1 ? 's' : ''} agregado${totAdd > 1 ? 's' : ''}`);
  if (totEdit) parts.push(`${totEdit} editado${totEdit > 1 ? 's' : ''}`);
  if (totRem) parts.push(`${totRem} eliminado${totRem > 1 ? 's' : ''}`);

  // Refuerzos
  let refChanged = 0;
  const refDates = new Set([
    ...Object.keys(prev.reinforcements || {}),
    ...Object.keys(curr.reinforcements || {}),
  ]);
  refDates.forEach(d => {
    const a = (prev.reinforcements || {})[d] || {};
    const b = (curr.reinforcements || {})[d] || {};
    if ((a.am || null) !== (b.am || null)) refChanged++;
    if ((a.pm || null) !== (b.pm || null)) refChanged++;
  });
  if (refChanged) parts.push(`${refChanged} refuerzo${refChanged > 1 ? 's' : ''} actualizado${refChanged > 1 ? 's' : ''}`);

  // Poli full-day overrides
  const poliBefore = Object.keys(prev.poli8amOverrides || {}).length;
  const poliAfter  = Object.keys(curr.poli8amOverrides || {}).length;
  if (poliBefore !== poliAfter || JSON.stringify(prev.poli8amOverrides || {}) !== JSON.stringify(curr.poli8amOverrides || {})) {
    parts.push('poli full-day modificado');
  }

  // Visita overrides
  if (JSON.stringify(prev.visitaOverrides || {}) !== JSON.stringify(curr.visitaOverrides || {})) {
    parts.push('visita modificada');
  }

  // Visitantes externos
  if (JSON.stringify(prev.externalVisitorOverrides || {}) !== JSON.stringify(curr.externalVisitorOverrides || {})) {
    parts.push('visitantes externos modificados');
  }

  // Alertas archivadas
  const prevHidden = new Set([...(prev.dismissedErrors || []), ...(prev.acknowledgedErrors || [])]);
  const currHidden = new Set([...(curr.dismissedErrors || []), ...(curr.acknowledgedErrors || [])]);
  let alertsArchived = 0, alertsRestored = 0;
  currHidden.forEach(k => { if (!prevHidden.has(k)) alertsArchived++; });
  prevHidden.forEach(k => { if (!currHidden.has(k)) alertsRestored++; });
  if (alertsArchived) parts.push(`${alertsArchived} alerta${alertsArchived > 1 ? 's' : ''} archivada${alertsArchived > 1 ? 's' : ''}`);
  if (alertsRestored) parts.push(`${alertsRestored} alerta${alertsRestored > 1 ? 's' : ''} restaurada${alertsRestored > 1 ? 's' : ''}`);

  if (parts.length === 0) return 'Sin cambios detectados (guardado manual).';
  const dayCount = daysTouched.size;
  const prefix = dayCount > 0 ? `${dayCount} día${dayCount > 1 ? 's' : ''} tocado${dayCount > 1 ? 's' : ''} — ` : '';
  return prefix + parts.join(', ') + '.';
}

export async function logSdmEdit({ weekStart, editorName, summary, details = {}, action = 'save_agenda' }) {
  if (!editorName) return { error: null };
  try {
    const { error } = await supabase.from('sdm_edit_history').insert({
      week_start: weekStart,
      editor_name: editorName,
      summary,
      details,
      action,
    });
    if (error) {
      // Tabla aún no creada — silencioso para no romper el guardado.
      if (/relation.*sdm_edit_history|schema cache/i.test(error.message || '')) {
        console.warn('[sdmEditHistory] tabla sdm_edit_history no existe todavía. Aplicar migración 20260513150000_sdm_edit_history.sql');
        return { error: null };
      }
      console.warn('[sdmEditHistory] error guardando historial:', error.message);
    }
    return { error };
  } catch (e) {
    console.warn('[sdmEditHistory] excepción:', e?.message || e);
    return { error: e };
  }
}

export async function fetchSdmHistory(weekStart, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('sdm_edit_history')
      .select('*')
      .eq('week_start', weekStart)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      if (/relation.*sdm_edit_history|schema cache/i.test(error.message || '')) return { data: [], error: null };
      return { data: [], error };
    }
    return { data: data || [], error: null };
  } catch (e) {
    return { data: [], error: e };
  }
}
