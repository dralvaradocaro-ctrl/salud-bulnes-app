import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { sdmSupabase as supabase } from './lib/sdmSupabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, ArrowRight, CheckCircle2, XCircle, MinusCircle, AlertTriangle } from 'lucide-react';
import { generateAgenda, getMondayOfWeek, fmtDate, weekDates, isMonthlyMatch, buildBlockTemplateLookup, resolveBlockTemplateId } from './lib/generateAgenda';
import { BLOCK_SPECS, BLOCK_SPEC_ORDER, isDailyBlock } from './lib/blockSpec';

export default function RevisarBloqueosSemanales() {
  const [searchParams, setSearchParams] = useSearchParams();
  const weekParam = searchParams.get('week');
  const initialMonday = weekParam
    ? getMondayOfWeek(new Date(weekParam + 'T12:00:00'))
    : getMondayOfWeek(new Date());
  const [monday, setMondayState] = useState(initialMonday);
  const setMonday = (d) => {
    setMondayState(d);
    setSearchParams(prev => { const p = new URLSearchParams(prev); p.set('week', fmtDate(d)); return p; }, { replace: true });
  };

  const [data, setData] = useState({ doctors: [], rotation: [], shiftCalendar: [], blockTemplates: [], programAssignments: [], absences: [], oneoffBlocks: [], savedAgenda: null });
  const [loading, setLoading] = useState(true);

  const weekStart = fmtDate(monday);
  const weekDaysArr = useMemo(() => weekDates(monday), [monday]);
  const weekEnd = weekDaysArr[4].date;

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const [d1, d2, d3, d4, d5, abs, oo, ag] = await Promise.all([
        supabase.from('sdm_doctors').select('*'),
        supabase.from('sdm_shift_rotation').select('*'),
        supabase.from('sdm_block_templates').select('*'),
        supabase.from('sdm_program_assignments').select('*'),
        supabase.from('sdm_shift_calendar').select('*').gte('date', fmtDate(new Date(monday.getTime() - 7*86400000))).lte('date', weekEnd),
        supabase.from('sdm_absences').select('*').gte('date', weekStart).lte('date', weekEnd),
        supabase.from('sdm_oneoff_blocks').select('*').eq('week_start', weekStart),
        supabase.from('sdm_weekly_agendas').select('data').eq('week_start', weekStart).maybeSingle(),
      ]);
      if (!alive) return;
      setData({
        doctors: d1.data || [], rotation: d2.data || [],
        blockTemplates: d3.data || [], programAssignments: d4.data || [],
        shiftCalendar: d5.data || [], absences: abs.data || [],
        oneoffBlocks: oo.data || [],
        savedAgenda: ag.data?.data || null,
      });
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [weekStart, weekEnd]);

  const agenda = useMemo(() => {
    if (loading) return [];
    return generateAgenda({
      weekStart: monday,
      doctors: data.doctors, rotation: data.rotation, shiftCalendar: data.shiftCalendar,
      blockTemplates: data.blockTemplates, programAssignments: data.programAssignments,
      absences: data.absences, oneoffBlocks: data.oneoffBlocks,
      manualReinforcements: data.savedAgenda?.reinforcements || {},
      manualPoli8am: data.savedAgenda?.poli8amOverrides || {},
      visitaOverrides: data.savedAgenda?.visitaOverrides || {},
      bloqueosOverrides: data.savedAgenda?.bloqueosOverrides || {},
    });
  }, [loading, monday, data]);

  const holidayDates = useMemo(() => agenda.filter(d => d.is_holiday).map(d => d.date), [agenda]);

  // Conteo actual por block_id (excluyendo días feriado y bloques suspendidos)
  const countByBlock = useMemo(() => {
    const c = {};
    const blockLookup = buildBlockTemplateLookup(data.blockTemplates);
    agenda.forEach(day => {
      if (day.is_holiday) return;
      day.bloqueos.forEach(b => {
        if (b.suspended) return;
        const blockId = resolveBlockTemplateId(b, data.blockTemplates, blockLookup);
        if (!blockId) return;
        c[blockId] = (c[blockId] || 0) + 1;
      });
    });
    return c;
  }, [agenda, data.blockTemplates]);

  // Para mensuales: ¿la fecha objetivo cae en la semana y es feriado?
  const monthlyStatus = useMemo(() => {
    const status = {};
    data.blockTemplates.forEach(bt => {
      if (!bt.is_monthly) return;
      const matchDay = agenda.find(d => isMonthlyMatch(d.date, bt.monthly_rule));
      if (!matchDay) { status[bt.id] = { applies: false }; return; }
      status[bt.id] = { applies: true, date: matchDay.date, label: matchDay.label, holiday: matchDay.is_holiday };
    });
    return status;
  }, [data.blockTemplates, agenda]);

  function shiftWeek(days) {
    const d = new Date(monday);
    d.setDate(d.getDate() + days);
    setMonday(d);
  }
  function goToAgenda() {
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      p.set('subtab', 'agenda_semanal');
      p.set('week', weekStart);
      return p;
    }, { replace: true });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between flex-wrap gap-2">
          <span>Revisar bloqueos semanales</span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => shiftWeek(-7)} className="gap-1"><ChevronLeft className="h-4 w-4" /></Button>
            <Input type="date" value={weekStart} onChange={(e) => setMonday(getMondayOfWeek(new Date(e.target.value + 'T12:00:00')))} className="h-8 w-36 text-sm" />
            <Button variant="outline" size="sm" onClick={() => shiftWeek(7)} className="gap-1"><ChevronRight className="h-4 w-4" /></Button>
            <Button variant="default" size="sm" onClick={goToAgenda} className="gap-1.5"><ArrowRight className="h-4 w-4" /> Ver agenda</Button>
          </div>
        </CardTitle>
        {holidayDates.length > 0 && (
          <p className="text-xs text-amber-700 mt-1">⚠ Semana con feriado(s): {holidayDates.join(', ')}</p>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-slate-500">Cargando...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-emerald-700 text-white">
                  <th className="px-3 py-2 text-left">Bloqueo</th>
                  <th className="px-3 py-2 text-left">HRS semanales</th>
                  <th className="px-3 py-2 text-left">Horario habitual</th>
                  <th className="px-3 py-2 text-center">Esperado</th>
                  <th className="px-3 py-2 text-center">Actual</th>
                  <th className="px-3 py-2 text-center">Estado</th>
                  <th className="px-3 py-2 text-left">Acción</th>
                </tr>
              </thead>
              <tbody>
                {BLOCK_SPEC_ORDER.map((id, i) => {
                  const spec = BLOCK_SPECS[id];
                  const bt = data.blockTemplates.find(b => b.id === id);
                  const name = bt?.name || id;
                  const isMonthly = !!spec.monthly;
                  const isManual = !!spec.manual;
                  const daily = bt ? isDailyBlock(bt) : false;
                  const actual = countByBlock[id] || 0;
                  const nHolidays = holidayDates.length;
                  // Texto del esperado (puede ser rango)
                  const expectedText = isMonthly ? '1/mes'
                    : isManual ? '—'
                    : typeof spec.expected_count_min === 'number' ? `${spec.expected_count_min}-${spec.expected_count_max}`
                    : daily ? `${5 - nHolidays}${nHolidays > 0 ? ` (5−${nHolidays})` : ''}`
                    : (spec.expected_count ?? '—');
                  let estado, estadoLabel, estadoColor;
                  if (isManual) {
                    estado = <MinusCircle className="h-4 w-4 text-slate-400" />;
                    estadoLabel = 'Gestión externa';
                    estadoColor = 'text-slate-500';
                  } else if (isMonthly) {
                    const s = monthlyStatus[id];
                    if (s?.holiday) {
                      estado = <AlertTriangle className="h-4 w-4 text-amber-600" />;
                      estadoLabel = `Cae feriado ${s.date}`;
                      estadoColor = 'text-amber-700';
                    } else if (s?.applies) {
                      estado = actual >= 1 ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <XCircle className="h-4 w-4 text-red-600" />;
                      estadoLabel = actual >= 1 ? 'Agendado' : 'No agendado';
                      estadoColor = actual >= 1 ? 'text-emerald-700' : 'text-red-700';
                    } else {
                      estado = <MinusCircle className="h-4 w-4 text-slate-300" />;
                      estadoLabel = 'No aplica esta semana';
                      estadoColor = 'text-slate-400';
                    }
                  } else if (daily) {
                    const expectedAdjusted = 5 - nHolidays;
                    if (actual >= expectedAdjusted) {
                      estado = <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
                      estadoLabel = nHolidays > 0 ? 'OK (feriado contemplado)' : 'OK';
                      estadoColor = 'text-emerald-700';
                    } else {
                      estado = <XCircle className="h-4 w-4 text-red-600" />;
                      estadoLabel = 'Faltan instancias';
                      estadoColor = 'text-red-700';
                    }
                  } else if (typeof spec.expected_count_min === 'number') {
                    if (actual >= spec.expected_count_min && (!spec.expected_count_max || actual <= spec.expected_count_max)) {
                      estado = <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
                      estadoLabel = 'OK';
                      estadoColor = 'text-emerald-700';
                    } else if (actual < spec.expected_count_min) {
                      const motivoFeriado = nHolidays > 0 && (spec.expected_count_min - actual) <= nHolidays;
                      estado = <AlertTriangle className={`h-4 w-4 ${motivoFeriado ? 'text-amber-600' : 'text-red-600'}`} />;
                      estadoLabel = motivoFeriado ? 'Falta por feriado' : 'Faltan instancias';
                      estadoColor = motivoFeriado ? 'text-amber-700' : 'text-red-700';
                    } else {
                      estado = <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
                      estadoLabel = 'OK';
                      estadoColor = 'text-emerald-700';
                    }
                  } else if (typeof spec.expected_count === 'number' && spec.expected_count >= 1) {
                    if (actual >= spec.expected_count) {
                      estado = <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
                      estadoLabel = 'OK';
                      estadoColor = 'text-emerald-700';
                    } else if (nHolidays > 0 && (spec.expected_count - actual) <= nHolidays) {
                      estado = <AlertTriangle className="h-4 w-4 text-amber-600" />;
                      estadoLabel = 'Falta por feriado';
                      estadoColor = 'text-amber-700';
                    } else {
                      estado = <XCircle className="h-4 w-4 text-red-600" />;
                      estadoLabel = 'Faltan instancias';
                      estadoColor = 'text-red-700';
                    }
                  } else {
                    // semana por medio o sin spec numérica
                    estado = <MinusCircle className="h-4 w-4 text-slate-400" />;
                    estadoLabel = spec.notes || '—';
                    estadoColor = 'text-slate-500';
                  }
                  return (
                    <tr key={id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="px-3 py-2 font-medium">{name}</td>
                      <td className="px-3 py-2 text-slate-600">{spec.weekly_hours}</td>
                      <td className="px-3 py-2 text-slate-600">{spec.expected_schedule}</td>
                      <td className="px-3 py-2 text-center font-mono">{expectedText}</td>
                      <td className="px-3 py-2 text-center font-mono">{actual}</td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {estado}
                          <span className={`text-xs ${estadoColor}`}>{estadoLabel}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <Button variant="ghost" size="sm" onClick={goToAgenda} className="gap-1 text-xs">
                          <ArrowRight className="h-3 w-3" /> Ver en agenda
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-3 text-[11px] text-slate-500">
              Bloqueos semanales que caen en feriado se reubican automáticamente a otro día si hay titular/subrogante disponible. Mensuales en feriado generan warning para reubicación manual.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
