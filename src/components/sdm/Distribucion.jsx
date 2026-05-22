import React, { useState, useEffect, useMemo } from 'react';
import { sdmSupabase as supabase, explainSdmWriteError } from './lib/sdmSupabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

function monthBounds(year, month) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  const fmt = d => d.toISOString().slice(0, 10);
  return { start: fmt(start), end: fmt(end) };
}

function yearBounds(year) {
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}

const ABSENCE_LABELS = {
  FL: 'Feriado Legal', P: 'Postnatal', A: 'Administrativo', DT: 'Devolución Tiempo',
  LM: 'Licencia Médica', CAP: 'Capacitación', PAS: 'Pasantía', OTRO: 'Otro',
};

export default function Distribucion() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()); // 0-11
  const [viewMode, setViewMode] = useState('month'); // 'month' | 'year'
  const [doctors, setDoctors] = useState([]);
  const [rotation, setRotation] = useState([]);
  const [calendar, setCalendar] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [agendas, setAgendas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const { start, end } = viewMode === 'year' ? yearBounds(year) : monthBounds(year, month);
      // Para refuerzos: incluir semanas cuyo lunes esté ≤ end pero abarquen el periodo
      const weekStartFrom = new Date(start);
      weekStartFrom.setDate(weekStartFrom.getDate() - 7);
      const ws = weekStartFrom.toISOString().slice(0, 10);
      const [d, r, c, a, ag] = await Promise.all([
        supabase.from('sdm_doctors').select('*').eq('active', true).order('display_name'),
        supabase.from('sdm_shift_rotation').select('*'),
        supabase.from('sdm_shift_calendar').select('*').gte('date', start).lte('date', end),
        supabase.from('sdm_absences').select('*').gte('date', start).lte('date', end),
        supabase.from('sdm_weekly_agendas').select('week_start, data').gte('week_start', ws).lte('week_start', end),
      ]);
      if (!alive) return;
      setDoctors(d.data || []);
      setRotation(r.data || []);
      setCalendar(c.data || []);
      setAbsences(a.data || []);
      setAgendas(ag.data || []);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [year, month, viewMode]);

  const stats = useMemo(() => {
    const init = () => ({ turnos: 0, ref_am: 0, ref_pm: 0, ref_pm_vie: 0, FL: 0, LM: 0, A: 0, P: 0, DT: 0, CAP: 0, PAS: 0, OTRO: 0 });
    const byDoctor = {};
    doctors.forEach(d => byDoctor[d.id] = init());

    // Turnos del periodo (mes o año)
    const { start, end } = viewMode === 'year' ? yearBounds(year) : monthBounds(year, month);
    calendar.forEach(c => {
      const docs = rotation.filter(r => r.turno_number === c.turno_number).map(r => r.doctor_id);
      const replacements = c.replacements || [];
      docs.forEach(docId => {
        const repl = replacements.find(rep => rep.doctor_id === docId);
        const finalDoc = repl ? repl.replaced_by : docId;
        if (byDoctor[finalDoc]) byDoctor[finalDoc].turnos++;
      });
    });

    // Refuerzos AM/PM (y PM Viernes aparte): del data de cada agenda semanal, sólo fechas dentro del mes
    agendas.forEach(ag => {
      const reinf = ag.data?.reinforcements || {};
      Object.entries(reinf).forEach(([date, slots]) => {
        if (date < start || date > end) return;
        const isVie = new Date(date + 'T12:00:00').getDay() === 5;
        if (slots?.am && byDoctor[slots.am]) byDoctor[slots.am].ref_am++;
        if (slots?.pm && byDoctor[slots.pm]) {
          byDoctor[slots.pm].ref_pm++;
          if (isVie) byDoctor[slots.pm].ref_pm_vie++;
        }
      });
    });

    // Ausencias: contar días por tipo
    absences.forEach(a => {
      if (byDoctor[a.doctor_id] && a.type in byDoctor[a.doctor_id]) {
        byDoctor[a.doctor_id][a.type]++;
      }
    });

    return doctors.map(d => ({ doctor: d, ...byDoctor[d.id] }));
  }, [doctors, rotation, calendar, absences, agendas, year, month, viewMode]);

  const totals = useMemo(() => {
    const t = { turnos: 0, ref_am: 0, ref_pm: 0, ref_pm_vie: 0, A: 0, FL: 0, LM: 0, CAP: 0, otros: 0 };
    stats.forEach(s => {
      t.turnos += s.turnos; t.ref_am += s.ref_am; t.ref_pm += s.ref_pm; t.ref_pm_vie += s.ref_pm_vie;
      t.A += s.A; t.FL += s.FL; t.LM += s.LM; t.CAP += s.CAP;
      t.otros += s.P + s.DT + s.PAS + s.OTRO;
    });
    return t;
  }, [stats]);

  const pct = (n, total) => total > 0 ? `${((n / total) * 100).toFixed(0)}%` : '';

  function shift(delta) {
    if (viewMode === 'year') {
      setYear(year + delta);
      return;
    }
    let m = month + delta;
    let y = year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setMonth(m); setYear(y);
  }

  const monthLabel = new Date(year, month, 1).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
  const periodLabel = viewMode === 'year' ? `Año ${year}` : monthLabel;
  const isYear = viewMode === 'year';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {isYear ? 'Distribución anual por médico' : 'Distribución mensual por médico'}
            </CardTitle>
            <CardDescription>
              {isYear
                ? 'Resumen acumulado del año: turnos, refuerzos AM/PM, administrativos, feriados y licencias.'
                : 'Turnos, refuerzos AM/PM, administrativos, feriados y licencias del mes seleccionado.'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Toggle Mensual / Anual */}
            <div className="inline-flex rounded-md border border-slate-200 overflow-hidden">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === 'month' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
              >Mensual</button>
              <button
                onClick={() => setViewMode('year')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors border-l border-slate-200 ${viewMode === 'year' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
              >Anual</button>
            </div>
            <Button variant="outline" size="sm" onClick={() => shift(-1)}><ChevronLeft className="h-4 w-4" /></Button>
            <div className="text-sm font-semibold capitalize w-32 text-center">{periodLabel}</div>
            <Button variant="outline" size="sm" onClick={() => shift(1)}><ChevronRight className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => { setYear(today.getFullYear()); if (!isYear) setMonth(today.getMonth()); }}>
              {isYear ? 'Este año' : 'Hoy'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? <p className="text-sm text-slate-500">Cargando…</p> :
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-[11px] uppercase tracking-wide text-slate-600">
                  <th className="px-3 py-2">Médico</th>
                  <th className="px-3 py-2 text-center" title="Turnos asignados en el mes">Turnos</th>
                  <th className="px-3 py-2 text-center" title="Refuerzos AM">Ref AM</th>
                  <th className="px-3 py-2 text-center" title="Refuerzos PM (todos los días)">Ref PM</th>
                  <th className="px-3 py-2 text-center bg-red-50" title="Refuerzos PM solo viernes (carga sensible)">PM Vie</th>
                  <th className="px-3 py-2 text-center" title="Administrativo">Adm</th>
                  <th className="px-3 py-2 text-center" title="Feriado Legal">FL</th>
                  <th className="px-3 py-2 text-center" title="Licencia Médica">LM</th>
                  <th className="px-3 py-2 text-center" title="Capacitación">CAP</th>
                  <th className="px-3 py-2 text-center" title="Postnatal / Pasantía / DT / Otro">Otros</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.map(s => {
                  const otros = s.P + s.DT + s.PAS + s.OTRO;
                  const cell = (n, total, color) => n > 0
                    ? (
                      <div className="leading-tight">
                        <span className={`inline-block min-w-[24px] px-1.5 py-0.5 rounded font-semibold ${color}`}>{n}</span>
                        <div className="text-[9px] text-slate-500">{pct(n, total)}</div>
                      </div>
                    )
                    : <span className="text-slate-300">—</span>;
                  return (
                    <tr key={s.doctor.id} className="hover:bg-slate-50/50">
                      <td className="px-3 py-2 font-medium text-slate-800">{s.doctor.display_name}</td>
                      <td className="px-3 py-2 text-center">{cell(s.turnos, totals.turnos, 'bg-emerald-100 text-emerald-800')}</td>
                      <td className="px-3 py-2 text-center">{cell(s.ref_am, totals.ref_am, 'bg-blue-100 text-blue-800')}</td>
                      <td className="px-3 py-2 text-center">{cell(s.ref_pm, totals.ref_pm, s.ref_pm >= 2 ? 'bg-red-200 text-red-800' : 'bg-violet-100 text-violet-800')}</td>
                      <td className="px-3 py-2 text-center bg-red-50/40">{cell(s.ref_pm_vie, totals.ref_pm_vie, s.ref_pm_vie >= 2 ? 'bg-red-300 text-red-900' : 'bg-red-100 text-red-800')}</td>
                      <td className="px-3 py-2 text-center">{cell(s.A, totals.A, 'bg-amber-100 text-amber-800')}</td>
                      <td className="px-3 py-2 text-center">{cell(s.FL, totals.FL, 'bg-pink-100 text-pink-800')}</td>
                      <td className="px-3 py-2 text-center">{cell(s.LM, totals.LM, 'bg-red-100 text-red-800')}</td>
                      <td className="px-3 py-2 text-center">{cell(s.CAP, totals.CAP, 'bg-cyan-100 text-cyan-800')}</td>
                      <td className="px-3 py-2 text-center">{cell(otros, totals.otros, 'bg-slate-100 text-slate-800')}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50">
                <tr className="text-xs text-slate-600">
                  <td className="px-3 py-2 font-semibold">Total</td>
                  <td className="px-3 py-2 text-center font-semibold">{totals.turnos}</td>
                  <td className="px-3 py-2 text-center font-semibold">{totals.ref_am}</td>
                  <td className="px-3 py-2 text-center font-semibold">{totals.ref_pm}</td>
                  <td className="px-3 py-2 text-center font-semibold bg-red-50/40">{totals.ref_pm_vie}</td>
                  <td className="px-3 py-2 text-center font-semibold">{totals.A}</td>
                  <td className="px-3 py-2 text-center font-semibold">{totals.FL}</td>
                  <td className="px-3 py-2 text-center font-semibold">{totals.LM}</td>
                  <td className="px-3 py-2 text-center font-semibold">{totals.CAP}</td>
                  <td className="px-3 py-2 text-center font-semibold">{totals.otros}</td>
                </tr>
              </tfoot>
            </table>
            <p className="text-[11px] text-slate-500 mt-3">
              Ref PM en rojo cuando un médico tiene ≥ 2 en el mes (carga sensible).
              Tipos de ausencia: {Object.entries(ABSENCE_LABELS).map(([k, v]) => `${k}=${v}`).join(', ')}.
            </p>
          </div>
        }
      </CardContent>
    </Card>
  );
}
