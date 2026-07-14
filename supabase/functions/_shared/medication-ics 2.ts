/**
 * Genera un calendario .ics con las tomas de medicamentos del paciente:
 * un evento recurrente por cada (medicamento, hora) con alarma 20 minutos
 * antes. La alarma la dispara el propio teléfono (iPhone/Android), con la
 * app cerrada y sin internet — por eso es la vía más confiable y gratuita
 * de recordar cada toma.
 *
 * Se usan horas "flotantes" (sin zona horaria): 08:00 significa las 08:00
 * del reloj del dispositivo, que es lo que corresponde para una toma.
 */

interface IcsPrescriptionItem {
  id: string;
  medication_name: string;
  prescribed_dose: number;
  prescribed_unit: string;
  frequency: string;
  schedule: string[] | null;
  fractionation: string | null;
  is_sos: boolean;
  is_annulled?: boolean;
}

interface IcsPrescription {
  id: string;
  issue_date: string;
  expiry_date: string;
  items: IcsPrescriptionItem[];
}

const BYDAY = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']; // índice lunes=0 … domingo=6

const pad = (n: number) => String(n).padStart(2, '0');

/** Fecha local → YYYYMMDD */
const fmtDate = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;

/** dayIndex lunes=0 … domingo=6 (mismo criterio que el portal) */
const dayIndexOf = (d: Date) => (d.getDay() === 0 ? 6 : d.getDay() - 1);

const parseIsoDate = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
};

/** Normaliza la hora del schedule ('24:00' → '00:00') y valida HH:MM. */
function normalizeTime(time: string): { h: number; m: number } | null {
  const match = (time || '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (h === 24) h = 0;
  if (h > 23 || m > 59) return null;
  return { h, m };
}

/** Escapa texto según RFC 5545 (comas, puntos y coma, saltos de línea). */
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

/** Pliega líneas a 75 octetos como exige RFC 5545. */
function fold(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let current = '';
  let currentBytes = 0;
  for (const ch of line) {
    const chBytes = new TextEncoder().encode(ch).length;
    const limit = out.length === 0 ? 75 : 74; // las continuaciones llevan espacio inicial
    if (currentBytes + chBytes > limit) {
      out.push(current);
      current = ch;
      currentBytes = chBytes;
    } else {
      current += ch;
      currentBytes += chBytes;
    }
  }
  if (current) out.push(current);
  return out.join('\r\n ');
}

const isWeekly = (item: IcsPrescriptionItem) =>
  item.frequency?.includes('7d') || item.frequency?.toLowerCase().includes('semanal') || false;

/** Slug estable del nombre del medicamento, para UIDs que sobreviven renovaciones. */
const slugify = (s: string) =>
  s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const isInsulin = (item: IcsPrescriptionItem) => {
  const n = item.medication_name.toLowerCase();
  return n.includes('insulina') || n.includes('nph');
};

const fmtDose = (n: number) =>
  Number.isInteger(n) ? String(n) : String(n).replace('.', ',');

interface VEventSpec {
  uid: string;
  summary: string;
  description: string;
  startDate: Date;   // primer día de la serie
  time: { h: number; m: number };
  rrule: string;     // sin UNTIL; se añade aquí
  untilDate: Date;   // último día inclusive
}

function buildVEvent(ev: VEventSpec, stamp: string, sequence: number): string[] {
  const dtstart = `${fmtDate(ev.startDate)}T${pad(ev.time.h)}${pad(ev.time.m)}00`;
  const until = `${fmtDate(ev.untilDate)}T235959`;
  return [
    'BEGIN:VEVENT',
    `UID:${ev.uid}`,
    // SEQUENCE creciente: al reimportar, el calendario ACTUALIZA el evento
    // con el mismo UID en vez de duplicarlo.
    `SEQUENCE:${sequence}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${dtstart}`,
    'DURATION:PT15M',
    `RRULE:${ev.rrule};UNTIL=${until}`,
    `SUMMARY:${esc(ev.summary)}`,
    `DESCRIPTION:${esc(ev.description)}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc(ev.summary)}`,
    'TRIGGER:-PT20M',
    'END:VALARM',
    'END:VEVENT',
  ];
}

/**
 * Construye el contenido del .ics. Devuelve null si no hay ningún
 * medicamento con horario que agendar.
 *
 * Los UID son estables por (paciente, medicamento, día, hora) — NO usan el id
 * del ítem de la receta. Así, al renovar o cambiar la receta y volver a
 * descargar, los eventos con el mismo UID se actualizan en el calendario en
 * vez de duplicarse. Sólo queda huérfana una serie si el medicamento cambió
 * de hora o se suspendió; esa serie termina sola al vencer la receta antigua.
 */
export function buildMedicationIcs(
  prescriptions: IcsPrescription[],
  patientName: string,
  patientCode: string,
): string | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const now = new Date();
  const stamp =
    `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}` +
    `T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  const events: VEventSpec[] = [];

  for (const presc of prescriptions) {
    const expiry = parseIsoDate(presc.expiry_date);
    if (expiry < today) continue; // receta vencida
    const issue = parseIsoDate(presc.issue_date);
    const seriesStart = issue > today ? issue : today;

    for (const item of presc.items) {
      if (item.is_annulled || item.is_sos) continue;
      const times = (item.schedule?.length ? item.schedule : ['08:00'])
        .map(normalizeTime)
        .filter((t): t is { h: number; m: number } => t !== null);
      if (!times.length) continue;

      const insulinParts = isInsulin(item) && item.fractionation && times.length >= 2
        ? item.fractionation.split('-').map(Number)
        : null;

      const medSlug = slugify(item.medication_name);

      if (isWeekly(item)) {
        // Días con toma según fractionation "1-0-1-0-1-0-0" (lun→dom).
        // Una serie por día: el UID no depende de la dosis, así un cambio de
        // dosis actualiza el mismo evento en lugar de crear otro.
        const parts = item.fractionation
          ? item.fractionation.split('-').map(Number)
          : [1, 1, 1, 1, 1, 1, 1];
        parts.forEach((dose, day) => {
          if (day > 6 || !(dose > 0)) return;
          const start = new Date(seriesStart);
          while (dayIndexOf(start) !== day) start.setDate(start.getDate() + 1);
          if (start > expiry) return;
          const doseText = `${fmtDose(dose * item.prescribed_dose)} ${item.prescribed_unit}`;
          times.forEach((time) => {
            events.push({
              uid: `sb-${patientCode}-${medSlug}-${BYDAY[day]}-${pad(time.h)}${pad(time.m)}@saludbulnes`,
              summary: `💊 ${item.medication_name} (${doseText})`,
              description: `Tomar ${doseText} de ${item.medication_name}.`,
              startDate: start,
              time,
              rrule: `FREQ=WEEKLY;BYDAY=${BYDAY[day]}`,
              untilDate: expiry,
            });
          });
        });
        continue;
      }

      // Diarios (c/8h, c/12h, c/24h) y c/48h
      const each48h = item.frequency?.includes('48');
      let start = new Date(seriesStart);
      if (each48h && issue < start) {
        // conservar la paridad de días respecto del inicio del tratamiento
        const diffDays = Math.round((start.getTime() - issue.getTime()) / 86400000);
        if (diffDays % 2 !== 0) start = new Date(start.getTime() + 86400000);
      }
      if (start > expiry) continue;

      times.forEach((time, ti) => {
        const doseText = insulinParts && !isNaN(insulinParts[ti])
          ? `${insulinParts[ti]} unidades`
          : `${fmtDose(item.prescribed_dose)} ${item.prescribed_unit}`;
        events.push({
          uid: `sb-${patientCode}-${medSlug}-${pad(time.h)}${pad(time.m)}@saludbulnes`,
          summary: `💊 ${item.medication_name} (${doseText})`,
          description: `Tomar ${doseText} de ${item.medication_name}.`,
          startDate: start,
          time,
          rrule: each48h ? 'FREQ=DAILY;INTERVAL=2' : 'FREQ=DAILY',
          untilDate: expiry,
        });
      });
    }
  }

  if (!events.length) return null;

  // Si la receta antigua sigue vigente junto a su renovación, el mismo
  // medicamento aparece dos veces con el mismo UID: se conserva la serie de
  // la receta que vence más tarde (la nueva).
  const byUid = new Map<string, VEventSpec>();
  for (const ev of events) {
    const previo = byUid.get(ev.uid);
    if (!previo || ev.untilDate > previo.untilDate) byUid.set(ev.uid, ev);
  }

  // SEQUENCE creciente entre descargas para que el reimport actualice.
  const sequence = Math.floor(Date.now() / 1000);

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Salud Bulnes//Medicamentos//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${esc(`Medicamentos — ${patientName}`)}`,
  ];
  for (const ev of byUid.values()) lines.push(...buildVEvent(ev, stamp, sequence));
  lines.push('END:VCALENDAR');

  return lines.map(fold).join('\r\n') + '\r\n';
}

/** Descarga el .ics en el dispositivo; devuelve false si no hay nada que agendar. */
export function downloadMedicationIcs(
  prescriptions: IcsPrescription[],
  patientName: string,
  patientCode: string,
): boolean {
  const ics = buildMedicationIcs(prescriptions, patientName, patientCode);
  if (!ics) return false;
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'medicamentos.ics';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return true;
}
