import React from 'react';
import { calendarEvents, tabletQuantity } from './SwitchPatientCalendar';
import { DRUGS } from './antidepressantSwitchEngine';
import { parsePresentationStrength, switchPresentation } from './switchPresentations';
import { PRINT_ISOLATION_CSS } from '../print/PrintSheet';

const number = (value) => Number(value).toLocaleString('es-CL', { maximumFractionDigits: 3 });

export function shortDose(event, config, drugKey) {
  const doses = [...event.accion.matchAll(/(\d+(?:[,.]\d+)?) mg\/(?:día|noche)/g)];
  // Conditional adjustments must never become an automatic prescription.
  if (doses.length !== 1 || /Ajustar|según|hasta/.test(event.accion)) return 'Confirmar dosis en control';
  const dose = Number(doses[0][1].replace(',', '.'));
  const presentation = switchPresentation(drugKey);
  const quantity = tabletQuantity(dose, parsePresentationStrength(config?.strength), presentation.canSplit && config?.split);
  const fraction = quantity?.fraction ? { 0.25: '1/4', 0.5: '1/2', 0.75: '3/4' }[quantity.fraction] : '';
  const amount = quantity ? [quantity.whole || '', fraction].filter(Boolean).join(' + ') : null;
  const unit = presentation.unit === 'comprimido' ? 'comp' : presentation.unit === 'cápsula' ? 'cáp' : 'unidad';
  return `${amount ? `${amount} ${unit}` : `${number(dose)} mg`}/${event.accion.includes('/noche') ? 'noche' : 'día'}`;
}

export default function SwitchCalendarPrint({ plan, settings, patientInfo }) {
  const { events, stopDay, undated } = calendarEvents(plan);
  const lastChange = Math.max(1, ...events.map((event) => event.day), stopDay + (plan.washoutDias || 0));
  const dayCount = Math.max(28, lastChange);
  const pages = Array.from({ length: Math.ceil(dayCount / 28) }, (_, page) =>
    Array.from({ length: Math.min(28, dayCount - page * 28) }, (_, i) => page * 28 + i + 1));
  const dateFor = (day) => {
    if (!settings.date) return null;
    const date = new Date(`${settings.date}T12:00:00`);
    date.setDate(date.getDate() + day - 1);
    return date;
  };
  const active = (side, day) => events.filter((event) => event.side === side && event.day <= day).sort((a, b) => b.day - a.day)[0];
  return <div className="switch-print-document">
    <style>{`${PRINT_ISOLATION_CSS}
      .switch-print-document { font-family: Arial, sans-serif; color: #172033; background: white; }
      .switch-print-page { max-width: 186mm; margin: auto; }
      .switch-print-header { display: flex; align-items: center; gap: 12px; border-bottom: 2px solid #334155; padding-bottom: 7px; }
      .switch-print-header img { width: 48px; height: 48px; object-fit: contain; }
      .switch-print-header h1 { font-size: 18px; font-weight: 700; margin: 0; }
      .switch-print-header p, .switch-print-patient { font-size: 11px; margin: 3px 0; }
      .switch-print-presentations { font-size: 10px; margin: 6px 0; }
      .switch-print-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 5px; }
      .switch-print-day { border: 1px solid #94a3b8; border-radius: 6px; overflow: hidden; break-inside: avoid; }
      .switch-print-date { display: flex; align-items: center; gap: 7px; padding: 3px 7px; border-bottom: 1px dashed #94a3b8; background: #f1f5f9; }
      .switch-print-date b { font-size: 24px; line-height: 1.1; }
      .switch-print-date span { font-size: 9px; line-height: 1.2; }
      .switch-print-doses { padding: 5px 7px; min-height: 47px; font-size: 10px; line-height: 1.3; }
      .switch-print-doses p { margin: 0 0 3px; }
      .switch-print-doses strong { font-weight: 700; }
      .switch-print-footer { margin-top: 7px; font-size: 10px; line-height: 1.4; }
      @media print {
        @page { size: A4 portrait; margin: 10mm 12mm; }
        html, body { margin: 0 !important; padding: 0 !important; }
        .switch-print-page { margin: 0; max-width: none; break-after: page; }
        .switch-print-page:last-child { break-after: auto; }
        .switch-print-day { min-height: 25mm; }
      }
    `}</style>
    {pages.map((days, page) => <section className="switch-print-page" key={page}>
      <header className="switch-print-header">
        <img src="/logo-hospital.png" alt="Hospital de Bulnes" />
        <div><h1>Mi calendario de medicamentos</h1><p>Hospital de Bulnes · {DRUGS[plan.from].label} → {DRUGS[plan.to].label}</p></div>
      </header>
      <p className="switch-print-patient"><strong>Paciente:</strong> {patientInfo?.name || '________________________________'} · <strong>RUT:</strong> {patientInfo?.rut || '________________'}</p>
      <p className="switch-print-patient"><strong>Inicio:</strong> {dateFor(1)?.toLocaleDateString('es-CL') || '____ / ____ / ______'} · Días {days[0]}–{days.at(-1)} · Hoja {page + 1}/{pages.length}</p>
      <p className="switch-print-presentations">{['from', 'to'].map((side) => `${DRUGS[plan[side]].label}: ${parsePresentationStrength(settings[side]?.strength) ? `${number(parsePresentationStrength(settings[side].strength))} mg/${switchPresentation(plan[side]).unit === 'cápsula' ? 'cáp' : 'comp'}` : 'presentación por confirmar'}`).join(' · ')}</p>
      {undated.map((step, i) => <p className="switch-print-presentations" key={i}>{step.dia}: {step.accion}</p>)}
      <div className="switch-print-grid">{days.map((day) => {
        const date = dateFor(day);
        const washout = plan.washoutDias > 0 && day >= stopDay && day < stopDay + plan.washoutDias;
        const instructions = ['from', 'to'].flatMap((side) => {
          const event = active(side, day);
          if (!event) return [];
          if (/^Suspender/.test(event.accion)) return event.day === day ? [{ side, text: 'Suspender' }] : [];
          if (washout) return [];
          return [{ side, text: shortDose(event, settings[side], plan[side]) }];
        });
        return <article className="switch-print-day" key={day} aria-label={`Día ${day}`}>
          <div className="switch-print-date"><b>{date ? date.getDate() : day}</b><span>{date ? <>{date.toLocaleDateString('es-CL', { weekday: 'short', month: 'short' })}<br />Día {day}</> : 'Día del plan'}</span></div>
          <div className="switch-print-doses">
            {instructions.map(({ side, text }) => <p key={side}><strong>{DRUGS[plan[side]].label}</strong><br />{text}</p>)}
            {(washout || !instructions.length) && <p>{washout ? 'Lavado · sin tomas' : 'Sin tomas'}</p>}
          </div>
        </article>;
      })}</div>
      <footer className="switch-print-footer">
        <p>No ajuste las dosis sin indicación. Al terminar el calendario, siga la última indicación hasta el control.</p>
        <p>Próximo control: __________________ · Profesional: __________________</p>
      </footer>
    </section>)}
  </div>;
}
