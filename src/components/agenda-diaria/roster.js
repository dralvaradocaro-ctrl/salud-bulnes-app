// Construye el "roster" del día: una fila por médico con todas sus actividades,
// igual que la planilla institucional. Usado por la tabla en pantalla y el PDF.
//
// Reglas:
//  - Siempre se muestran: turno, post turno, refuerzos, policlínico, ausencias
//    (administrativo) y las visitas asignadas.
//  - Las gestiones/bloqueos SOLO se muestran si PARTEN a las 08:00
//    (ej. Selector de Demanda, Gestión GES/PSCV…). Las que empiezan más tarde
//    (Poli TACO 12:00, Regulación IC 16:00, Cuidados Paliativos 14:00) no salen.
import { groupBeds } from './distribute';

const AUS_LABEL = {
  FL: 'FERIADO LEGAL', P: 'PERMISO', A: 'ADMINISTRATIVO', DT: 'DÍAS LIBRES',
  LM: 'LICENCIA MÉDICA', CAP: 'CAPACITACIÓN', PAS: 'PASANTÍA', OTRO: 'ADMINISTRATIVO',
};

const blockDoctorIds = (b) =>
  Array.isArray(b.doctor_ids) && b.doctor_ids.length ? b.doctor_ids : b.doctor_id ? [b.doctor_id] : [];

// Estilos por tipo de actividad (Tailwind para pantalla, RGB para PDF).
export const KIND_CLASS = {
  admin: 'text-red-700',
  turno: 'text-emerald-700 font-semibold',
  posturno: 'text-sky-700',
  refuerzo: 'text-orange-700',
  gestion: 'text-slate-500',
  visita: 'text-slate-900',
};
export const KIND_RGB = {
  admin: [185, 28, 28],
  turno: [4, 120, 87],
  posturno: [2, 132, 199],
  refuerzo: [194, 65, 12],
  gestion: [100, 116, 139],
  visita: [15, 23, 42],
};

const KIND_ORDER = { admin: 0, turno: 1, posturno: 2, refuerzo: 3, gestion: 4, visita: 5 };

export const groupLabel = (codes) =>
  groupBeds(codes).map((g) => `${g.label} (${g.count})`).join(' + ');

/**
 * @returns { rows: [{ id, name, parts:[{text,kind}], num }], interns: [{ id, name, label, num }] }
 */
export function buildRoster({ day, result, extraBlocks = [], docName }) {
  const rows = {};
  const ensure = (id) => (rows[id] || (rows[id] = { id, name: docName(id), parts: [], num: null }));
  const addPart = (id, text, kind) => { if (id && text) ensure(id).parts.push({ text, kind }); };

  (day.ausencias || []).forEach((a) => addPart(a.doctor_id, AUS_LABEL[a.type] || 'ADMINISTRATIVO', 'admin'));
  (day.turnos || []).forEach((t) => addPart(t.doctor_id, 'TURNO', 'turno'));
  (day.posturno || []).forEach((t) => addPart(t.doctor_id, 'POST TURNO', 'posturno'));
  if (day.refuerzos?.am) addPart(day.refuerzos.am, 'REFUERZO AM', 'refuerzo');
  if (day.refuerzos?.pm) addPart(day.refuerzos.pm, 'REFUERZO PM', 'refuerzo');
  if (day.policlinico?.doctor_id) addPart(day.policlinico.doctor_id, 'POLICLÍNICO', 'refuerzo');

  // Gestiones/bloqueos SOLO si parten 08:00.
  (day.bloqueos || [])
    .filter((b) => !b.suspended && b.name && b.category !== 'feriado' && b.from === '08:00')
    .forEach((b) => blockDoctorIds(b).forEach((id) => addPart(id, b.name, 'gestion')));
  (extraBlocks || [])
    .filter((b) => b.doctorId && b.from === '08:00')
    .forEach((b) => addPart(b.doctorId, b.cause || 'Bloqueo', 'gestion'));

  // Visitas (con internos supervisados sumados al total).
  const internName = (iid) => result.interns.find((i) => i.id === iid)?.name || 'Interno';
  (result.doctors || []).forEach((d) => {
    const g = groupLabel(d.beds);
    const sup = d.supervised.map((iid) => `INT ${internName(iid)}`);
    const txt = [g, ...sup].filter(Boolean).join(' + ');
    if (txt) addPart(d.doctor_id, txt, 'visita');
    if (d.total > 0) ensure(d.doctor_id).num = d.total;
  });

  const hasVisita = (r) => r.parts.some((p) => p.kind === 'visita');
  const rank = (r) => (hasVisita(r) ? 5 : Math.min(...r.parts.map((p) => KIND_ORDER[p.kind] ?? 4)));
  const ordered = Object.values(rows)
    .filter((r) => r.parts.length)
    .sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));

  const interns = (result.interns || [])
    .filter((it) => it.beds.length > 0)
    .map((it) => ({ id: it.id, name: it.name, label: groupLabel(it.beds), num: it.beds.length }));

  return { rows: ordered, interns };
}
