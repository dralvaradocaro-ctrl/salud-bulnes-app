import React from 'react';
import { switchPresentation, parsePresentationStrength } from './switchPresentations';
import { DRUGS } from './antidepressantSwitchEngine';

const number = (n) => Number(n).toLocaleString('es-CL', { maximumFractionDigits: 3 });
export function TabletPicture({ fraction = 1 }) {
  const paths = ['M20 20 L20 3 A17 17 0 0 1 37 20 Z', 'M20 20 L37 20 A17 17 0 0 1 20 37 Z', 'M20 20 L20 37 A17 17 0 0 1 3 20 Z', 'M20 20 L3 20 A17 17 0 0 1 20 3 Z'];
  return <svg width="36" height="36" viewBox="0 0 40 40" aria-hidden="true" style={{ display: 'inline-block', flexShrink: 0 }}>
    <circle cx="20" cy="20" r="17" fill="white" stroke="#64748b" strokeDasharray="2 2" />
    {paths.slice(0, Math.round(fraction * 4)).map((d) => <path key={d} d={d} fill="#334155" stroke="white" strokeWidth="1.5" />)}
  </svg>;
}

export function tabletQuantity(dose, strength, split) {
  if (!(dose > 0) || !(strength > 0)) return null;
  const count = dose / strength;
  if (count > 12 || Math.abs(count * 4 - Math.round(count * 4)) > 1e-8 || (!split && !Number.isInteger(count))) return null;
  const whole = Math.floor(count);
  const fraction = count - whole;
  const parts = [];
  if (whole) parts.push(`${whole} comprimido${whole > 1 ? 's enteros' : ' entero'}`);
  if (fraction) parts.push({ 0.25: '¼ (un cuarto) de comprimido', 0.5: '½ (medio) comprimido', 0.75: '¾ (tres cuartos) de comprimido' }[fraction]);
  return { whole, fraction, label: parts.join(' + ') };
}

// Dated instructions become calendar events. Ranges open a review period. Conditional titrations
// remain written instructions, never an invented dose or an automatic increase.
export function calendarEvents(plan) {
  const stopDay = Number(plan.stopSteps.find((s) => /^Suspender/.test(s.accion))?.dia.match(/\d+/)?.[0] || 1);
  const events = [];
  for (const [side, steps] of [['from', plan.stopSteps], ['to', plan.startSteps]]) {
    for (const step of steps) {
      let day = /^Día \d+(?:\+)?$/.test(step.dia) ? Number(step.dia.match(/\d+/)[0]) : null;
      if (/^Lavado \+ día \d+\+?$/.test(step.dia)) day = stopDay + plan.washoutDias + Number(step.dia.match(/\d+/)[0]) - 1;
      if (step.dia === 'Tras el lavado') day = stopDay + plan.washoutDias;
      if (/^Día \d+-\d+$/.test(step.dia)) day = Number(step.dia.match(/\d+/)[0]);
      if (/^Semana \d+-\d+$/.test(step.dia)) day = (Number(step.dia.match(/\d+/)[0]) - 1) * 7 + 1;
      if (day) events.push({ ...step, day, side });
    }
  }
  return { events, stopDay, undated: [...plan.stopSteps, ...plan.startSteps].filter((s) => !events.some((e) => e.accion === s.accion && e.dia === s.dia)) };
}

function Dose({ event, config, drugKey, day }) {
  if (!event) return null;
  if (/^Suspender/.test(event.accion)) return event.day === day ? <strong>Suspender</strong> : null;
  const matches = [...event.accion.matchAll(/(\d+(?:[,.]\d+)?) mg\/(?:día|noche)/g)];
  const dose = matches.length === 1 && !/Ajustar|según|hasta|Si respuesta/.test(event.accion) ? Number(matches[0][1].replace(',', '.')) : null;
  const presentation = switchPresentation(drugKey);
  const quantity = tabletQuantity(dose, parsePresentationStrength(config?.strength), presentation.canSplit && config?.split);
  const fraction = { 0.25: '1/4', 0.5: '1/2', 0.75: '3/4' }[quantity?.fraction];
  const amount = quantity ? [quantity.whole || '', fraction].filter(Boolean).join(' ') : '';
  const unit = presentation.unit === 'comprimido' ? 'comp' : presentation.unit === 'cápsula' ? 'cáps' : 'unid';
  return <div>
    {quantity && <div className="flex flex-wrap">
      {Array.from({ length: quantity.whole }, (_, i) => presentation.unit === 'cápsula'
        ? <svg key={i} width="36" height="36" viewBox="0 0 40 40" aria-hidden="true"><rect x="5" y="11" width="30" height="18" rx="9" fill="white" stroke="#334155" strokeWidth="2" /><path d="M20 11h6a9 9 0 0 1 0 18h-6Z" fill="#334155" /></svg>
        : <TabletPicture key={i} />)}
      {quantity.fraction > 0 && <TabletPicture fraction={quantity.fraction} />}
    </div>}
    <strong>{quantity ? `${amount} ${unit}` : dose ? `${number(dose)} mg` : event.accion}</strong>
    {dose && event.accion.includes('/noche') && <span> · noche</span>}
    {dose && !quantity && <p className="text-xs">Confirmar presentación</p>}
  </div>;
}

export function calendarMonths(startDate, totalDays) {
  const start = startDate ? new Date(`${startDate}T12:00:00`) : null;
  if (!start || !Number.isFinite(start.getTime())) {
    return [{ key: 'relative', title: 'Días del cambio · completa la fecha de inicio para ver el mes', dated: false,
      weeks: Array.from({ length: Math.ceil(totalDays / 7) }, (_, week) => Array.from({ length: 7 }, (_, index) => {
        const day = week * 7 + index + 1;
        return { day: day <= totalDays ? day : null, date: null };
      })) }];
  }
  const months = new Map();
  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(start);
    date.setDate(date.getDate() + day - 1);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    if (!months.has(key)) months.set(key, { key, date, days: new Map() });
    months.get(key).days.set(date.getDate(), day);
  }
  return [...months.values()].map((month) => {
    const first = new Date(month.date.getFullYear(), month.date.getMonth(), 1, 12);
    const offset = (first.getDay() + 6) % 7;
    const count = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const cells = Array.from({ length: Math.ceil((offset + count) / 7) * 7 }, (_, index) => {
      const number = index - offset + 1;
      if (number < 1 || number > count) return { day: null, date: null };
      return { day: month.days.get(number) || null, date: new Date(first.getFullYear(), first.getMonth(), number, 12) };
    });
    return { key: month.key, title: first.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' }), dated: true,
      weeks: Array.from({ length: cells.length / 7 }, (_, index) => cells.slice(index * 7, index * 7 + 7))
        .filter((week) => week.some((cell) => cell.day))
        .map((week) => week.map((cell) => cell.day ? cell : { day: null, date: null })) };
  });
}

export default function SwitchPatientCalendar({ plan, settings, patientInfo }) {
  const { events, stopDay, undated } = calendarEvents(plan);
  const lastChange = Math.max(1, ...events.map((e) => e.day), stopDay + (plan.washoutDias || 0));
  const days = Array.from({ length: lastChange }, (_, i) => i + 1);
  const months = calendarMonths(settings.date, days.length);
  const date = (day) => {
    if (!settings.date) return `Día ${day}`;
    const d = new Date(`${settings.date}T12:00:00`);
    d.setDate(d.getDate() + day - 1);
    return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };
  const active = (side, day) => events.filter((e) => e.side === side && e.day <= day).sort((a, b) => b.day - a.day)[0];
  return <section className="switch-patient-calendar mt-5 text-slate-900">
    <style>{`
      .switch-month-scroll { overflow-x: auto; }
      .switch-month-calendar { min-width: 840px; }
      .switch-day-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); }
      .switch-day-card { border-radius: 0; border-width: 1px; box-shadow: none; min-width: 0; overflow-wrap: anywhere; }
      .switch-day-card .text-5xl { font-size: 26px; }
      .switch-day-card .p-4 { padding: 6px; }
      .switch-day-card .px-4 { padding-left: 6px; padding-right: 6px; }
      .switch-day-card .py-3 { padding-top: 6px; padding-bottom: 6px; }
      .switch-day-card .text-sm, .switch-day-card .text-xs { font-size: 10px; line-height: 1.35; }
      .switch-day-card svg { width: 24px; height: 24px; }
      .switch-day-card .space-y-3 > :not([hidden]) ~ :not([hidden]) { margin-top: 6px; }
      .switch-day-card .tracking-widest { letter-spacing: 0; }
      .switch-day-card .rounded-full { border: 0; padding: 0; background: transparent; }
      @media print {
        .switch-patient-calendar { margin-top: 0; }
        .switch-day-grid, .switch-calendar-heading { break-inside: avoid; }
        .switch-month-scroll { overflow: visible; }
        .switch-month-calendar { min-width: 0; }
        .switch-day-card .text-5xl { font-size: 18pt; }
        .switch-day-card .text-sm, .switch-day-card .text-xs { font-size: 7pt; }
        .switch-day-card svg { width: 20px; height: 20px; }
      }
    `}</style>
    <div className="switch-calendar-heading">
      <h2 className="text-xl font-bold">Mi calendario de cambio de antidepresivo</h2>
      <p className="mt-1">{DRUGS[plan.from].label} → {DRUGS[plan.to].label}</p>
      {patientInfo?.name && <p>Paciente: {patientInfo.name}{patientInfo.rut ? ` · RUT: ${patientInfo.rut}` : ''}</p>}
      <p className="mt-2 text-sm">Inicio: {settings.date ? date(1) : '____ / ____ / ______'}. Dosis diaria en cada casilla.</p>
      <div className="my-2 text-sm">{['from', 'to'].map((side) => <p key={side}><strong>{DRUGS[plan[side]].label}:</strong> {parsePresentationStrength(settings[side]?.strength) ? `${number(parsePresentationStrength(settings[side].strength))} mg por ${switchPresentation(plan[side]).unit}` : 'presentación por confirmar'}</p>)}</div>
      {plan.washoutDias > 0 && <p className="my-3 border-2 border-slate-800 p-3 font-bold">LAVADO / WASHOUT: {plan.washoutDias} días completos sin ninguno de estos dos antidepresivos. Desde {date(stopDay)} hasta {date(stopDay + plan.washoutDias - 1)}. El nuevo comienza el {date(stopDay + plan.washoutDias)}.</p>}
      {undated.map((s, i) => <p key={i} className="my-2 text-sm"><strong>{s.dia}:</strong> {s.accion}. Confirmar esta indicación con el profesional.</p>)}
    </div>
    <div className="mt-5 space-y-6">
    {months.map((month) => <div key={month.key}>
      <h3 className="mb-2 text-xl font-bold capitalize">{month.title}</h3>
      <div className="switch-month-scroll">
      <div className="switch-month-calendar">
        <div className="switch-day-grid border border-slate-300 bg-slate-100 text-center text-xs font-bold">
          {(month.dated ? ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] : ['1', '2', '3', '4', '5', '6', '7']).map((label) => <div key={label} className="border-r border-slate-300 py-2">{label}</div>)}
        </div>
      {month.weeks.map((week, index) => <div key={index} className="switch-day-grid">
      {week.map((cell, column) => {
        const day = cell.day;
        if (!day) return <div key={`empty-${column}`} className="min-h-12 border border-slate-200 bg-slate-50 p-2 text-sm text-slate-400" aria-hidden="true">{cell.date?.getDate()}</div>;
        const washout = plan.washoutDias > 0 && day >= stopDay && day < stopDay + plan.washoutDias;
        const waiting = !washout && /^Suspender/.test(active('from', day)?.accion || '') && !active('to', day);
        const overlap = !washout && active('from', day) && active('to', day) && !/^Suspender/.test(active('from', day).accion);
        const calendarDate = settings.date ? new Date(`${settings.date}T12:00:00`) : null;
        if (calendarDate) calendarDate.setDate(calendarDate.getDate() + day - 1);
        return <article key={day} data-calendar-day={day} className="switch-day-card overflow-hidden rounded-xl border-2 border-slate-300 bg-white shadow-sm" aria-label={`Día ${day} · ${date(day)}`}>
          <div className={`flex items-center justify-between border-b-2 border-dashed border-slate-300 px-4 py-3 ${washout || waiting ? 'bg-amber-50' : overlap ? 'bg-fuchsia-50' : 'bg-slate-100'}`}>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest">{calendarDate ? calendarDate.toLocaleDateString('es-CL', { weekday: 'long' }) : 'Día del plan'}</p>
              <p className="text-5xl font-bold leading-tight">{calendarDate ? calendarDate.getDate() : day}</p>
              
            </div>
            <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-bold">Día {day}</span>
          </div>
          <div className="space-y-3 p-4 text-sm">
            {washout && <div><p className="font-bold">LAVADO · SIN TOMAS</p><p className="mt-1 text-xs">Día {day - stopDay + 1} de {plan.washoutDias} de lavado</p></div>}
            {overlap && <p className="font-bold text-fuchsia-800">TRASLAPE · ambos</p>}
            {waiting && <p className="font-bold">ESPERA · SIN TOMAS</p>}
            {['from', 'to'].map((side) => {
              const event = active(side, day);
              if (!event || (/^Suspender/.test(event.accion) && event.day !== day)) return null;
              if (washout && !/^Suspender/.test(event.accion)) return null;
              return <div key={side}>
              <h3 className="mb-1 font-bold">{DRUGS[plan[side]].label}</h3>
              <Dose event={event} config={settings[side]} drugKey={plan[side]} day={day} />
            </div>; })}
            <label className="flex items-center gap-2 border-t border-slate-200 pt-3 text-xs">
              <input type="checkbox" className="h-4 w-4 accent-slate-800" aria-label={`Indicaciones completadas del día ${day}`} />
              Tomado
            </label>
          </div>
        </article>;
      })}
      </div>)}
      </div>
      </div>
    </div>)}
    </div>
    <p className="mt-4 text-sm">Mantenga la última dosis hasta el control. Ajustes solo por indicación profesional.</p>
    <p className="mt-5 text-sm">Próximo control: __________________ · Profesional: __________________</p>
  </section>;
}
