// ─────────────────────────────────────────────────────────────────────────
// Reparto de pacientes-con-visita del día entre médicos de planta e internos.
//
// Reglas:
//  - Cada interno toma un bloque CONTIGUO (misma sala idealmente) de ~internSize
//    camas. Su asignación de sala es estable (depende solo del set de internos),
//    de modo que al "redistribuir" los internos conservan sus salas.
//  - Cada interno tiene un médico de planta SUPERVISOR; las camas del interno
//    se SUMAN al total del supervisor (no las visita además el médico).
//  - El resto de las camas se reparte homogéneamente entre los médicos en visita,
//    respetando su `capacity` (tope de visitas propias), con preferencia de
//    contigüidad por sala.
//  - Overrides manuales: una cama puede fijarse a un médico/interno concreto, y
//    el supervisor de un interno puede fijarse a mano.
// ─────────────────────────────────────────────────────────────────────────
import { ALL_BEDS, aggregationLabel, bedByCode } from './bedCatalog';

// PRNG determinista (mulberry32) para repartos reproducibles.
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

// Identidad estable de un interno a partir de su nombre (sin acentos, alfanumérico).
// Permite continuidad entre días: el mismo nombre → mismo id → conserva sus camas.
export function slugifyName(name) {
  return (name || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function shuffled(arr, rnd) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Orden canónico de salas (según catálogo) — da contigüidad al reparto.
const SALA_ORDER = [...new Set(ALL_BEDS.map((b) => b.salaId))];

// Capacidad de "jornada completa" (mañana clínica 08:00–11:00 = 5 visitas).
// Un médico con capacity >= este valor NO tiene limitación: puede recibir más
// visitas según la carga del día. Solo se considera "limitado" (y se le anota
// el número entre paréntesis) cuando capacity < FULL_VISITA_CAP.
export const FULL_VISITA_CAP = 5;
export const isLimited = (capacity) => capacity != null && capacity < FULL_VISITA_CAP;
// Tope efectivo para el reparto: los no-limitados no tienen techo.
const effectiveCap = (capacity) => (isLimited(capacity) ? capacity : Infinity);

/**
 * Agrupa una lista de códigos de cama por unidad de agregación (sala o servicio),
 * en el orden del catálogo. Devuelve [{ label, count, codes }].
 */
export function groupBeds(codes) {
  const order = [];
  const map = {};
  SALA_ORDER.forEach((salaId) => {
    ALL_BEDS.filter((b) => b.salaId === salaId).forEach((b) => {
      if (!codes.includes(b.code)) return;
      const label = aggregationLabel(b);
      if (!map[label]) { map[label] = { label, count: 0, codes: [] }; order.push(label); }
      map[label].count++;
      map[label].codes.push(b.code);
    });
  });
  return order.map((l) => map[l]);
}

export function distributeDay({
  visitBedCodes = [],
  visitDocs = [],            // [{ doctor_id, capacity }]
  interns = [],              // [{ id, name }]
  internSize = 3,
  internSeed = 1,
  doctorSeed = 0,
  bedOverrides = {},         // { code: assigneeId }  (doctor_id o intern id)
  supervisorOverrides = {},  // { internId: doctor_id }
  priorAssignments = {},     // { code: assigneeId } heredado del día anterior (continuidad)
}) {
  const internRnd = mulberry32(internSeed || 1);
  const docRnd = mulberry32((doctorSeed * 2654435761 + 1) >>> 0 || 1);

  // Camas disponibles por sala, en orden de catálogo.
  const bedsBySala = {};
  SALA_ORDER.forEach((s) => { bedsBySala[s] = []; });
  const visitSet = new Set(visitBedCodes);
  ALL_BEDS.forEach((b) => { if (visitSet.has(b.code)) bedsBySala[b.salaId].push(b.code); });

  const validDoc = new Set(visitDocs.map((v) => v.doctor_id));
  const validIntern = new Set(interns.map((i) => i.id));
  const isValidAssignee = (who) => who && (validDoc.has(who) || validIntern.has(who));

  const assigned = {}; // code -> assigneeId

  // 1) Overrides manuales (máxima prioridad).
  visitBedCodes.forEach((c) => { if (isValidAssignee(bedOverrides[c])) assigned[c] = bedOverrides[c]; });

  // 1b) Continuidad: camas heredadas del día anterior conservan su médico/interno
  // (seguimiento real). Solo si el asignado sigue participando hoy.
  visitBedCodes.forEach((c) => {
    if (assigned[c]) return;
    if (isValidAssignee(priorAssignments[c])) assigned[c] = priorAssignments[c];
  });

  // 2) Internos: conservan camas heredadas/fijadas; los que no tienen ninguna
  // toman un bloque contiguo por sala.
  const internResult = interns.map((it) => ({
    id: it.id, name: it.name, beds: [], salaId: null, supervisorId: null,
  }));
  const internById = {};
  internResult.forEach((ir) => { internById[ir.id] = ir; });
  visitBedCodes.forEach((c) => {
    const ir = internById[assigned[c]];
    if (ir) ir.beds.push(c);
  });
  internResult.forEach((ir) => { if (ir.beds.length) ir.salaId = bedByCode[ir.beds[0]].salaId; });

  const freeInSala = (s) => bedsBySala[s].filter((c) => !assigned[c]);
  // Salas con disponibilidad, ordenadas por nº de camas libres (desc),
  // con desempate barajado por internSeed (estable salvo cambio de internos).
  const availSalas = shuffled(SALA_ORDER.filter((s) => freeInSala(s).length > 0), internRnd)
    .sort((a, b) => freeInSala(b).length - freeInSala(a).length);
  let salaCursor = 0;
  internResult.filter((ir) => ir.beds.length === 0).forEach((ir) => {
    while (salaCursor < availSalas.length && freeInSala(availSalas[salaCursor]).length === 0) salaCursor++;
    if (salaCursor >= availSalas.length) return;
    const sala = availSalas[salaCursor];
    ir.salaId = sala;
    freeInSala(sala).slice(0, internSize).forEach((c) => { assigned[c] = ir.id; ir.beds.push(c); });
    salaCursor++; // una sala por interno
  });

  // 3) Supervisores: round-robin de internos sobre médicos (por capacidad desc).
  const docsByCap = [...visitDocs].sort((a, b) => (b.capacity ?? 0) - (a.capacity ?? 0));
  internResult.forEach((ir, i) => {
    ir.supervisorId = supervisorOverrides[ir.id]
      || (docsByCap.length ? docsByCap[i % docsByCap.length].doctor_id : null);
  });

  // 4) Reparto del resto entre médicos (homogéneo + contigüidad + capacidad).
  const docState = {};
  visitDocs.forEach((v) => { docState[v.doctor_id] = { beds: [], cap: effectiveCap(v.capacity) }; });
  visitBedCodes.forEach((c) => { if (docState[assigned[c]]) docState[assigned[c]].beds.push(c); });

  // Sin médicos en visita: no se reparte nada (evita crash); las camas con
  // visita quedan sin asignar hasta que la agenda tenga médicos.
  const docs = visitDocs.map((v) => v.doctor_id);
  if (docs.length > 0) {
    const remaining = SALA_ORDER.flatMap((s) => bedsBySala[s]).filter((c) => !assigned[c]);
    remaining.forEach((code) => {
      const sala = bedByCode[code].salaId;
      let pool = docs.filter((d) => docState[d].beds.length < docState[d].cap);
      if (pool.length === 0) pool = docs; // overflow: todos al tope, repartir igual
      const sameSala = pool.filter((d) => docState[d].beds.some((c) => bedByCode[c].salaId === sala));
      let cand = sameSala.length ? sameSala : pool;
      const minCount = Math.min(...cand.map((d) => docState[d].beds.length));
      cand = cand.filter((d) => docState[d].beds.length === minCount);
      const chosen = cand[Math.floor(docRnd() * cand.length)] ?? cand[0];
      if (!chosen || !docState[chosen]) return;
      assigned[code] = chosen;
      docState[chosen].beds.push(code);
    });
  }

  // 5) Resultado por médico, con internos supervisados y total.
  const doctors = visitDocs.map((v) => {
    const sup = internResult.filter((ir) => ir.supervisorId === v.doctor_id);
    const ownCount = docState[v.doctor_id].beds.length;
    const supCount = sup.reduce((s, ir) => s + ir.beds.length, 0);
    return {
      doctor_id: v.doctor_id,
      capacity: v.capacity,
      beds: docState[v.doctor_id].beds,
      supervised: sup.map((s) => s.id),
      ownCount,
      total: ownCount + supCount,
      overCapacity: isLimited(v.capacity) && ownCount > v.capacity,
      limited: isLimited(v.capacity),
    };
  });

  return { doctors, interns: internResult, assigned };
}
