import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, RefreshCw, Save, Printer, Plus, Trash2 } from 'lucide-react';
import { generateAgenda, validateAgenda, getMondayOfWeek, fmtDate, weekDates } from './lib/generateAgenda';

const ABSENCE_TYPES = ['FL', 'P', 'A', 'DT', 'LM', 'CAP', 'PAS', 'OTRO'];
const ABSENCE_LABELS = {
  FL: 'Feriado Legal', P: 'Postnatal', A: 'Administrativo', DT: 'Devolución Tiempo',
  LM: 'Licencia Médica', CAP: 'Capacitación', PAS: 'Pasantía', OTRO: 'Otro'
};

export default function AgendaSemanal() {
  const [monday, setMonday] = useState(getMondayOfWeek(new Date()));
  const [doctors, setDoctors] = useState([]);
  const [rotation, setRotation] = useState([]);
  const [shiftCalendar, setShiftCalendar] = useState([]);
  const [blockTemplates, setBlockTemplates] = useState([]);
  const [programAssignments, setProgramAssignments] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [oneoffBlocks, setOneoffBlocks] = useState([]);
  const [reinforcements, setReinforcements] = useState({});
  const [loading, setLoading] = useState(true);
  const [savedAgendaId, setSavedAgendaId] = useState(null);
  const [showAbsenceDialog, setShowAbsenceDialog] = useState(false);
  const [newAbs, setNewAbs] = useState({ doctor_id: '', date: '', type: 'A', notes: '' });

  const weekStart = fmtDate(monday);
  const weekDays = useMemo(() => weekDates(monday), [monday]);
  const weekEnd = weekDays[4].date;

  // Carga de catálogos + datos de la semana
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const [d1, d2, d3, d4, d5] = await Promise.all([
        supabase.from('sdm_doctors').select('*').order('display_name'),
        supabase.from('sdm_shift_rotation').select('*'),
        supabase.from('sdm_block_templates').select('*'),
        supabase.from('sdm_program_assignments').select('*'),
        supabase.from('sdm_shift_calendar').select('*').gte('date', fmtDate(new Date(monday.getTime() - 7*86400000))).lte('date', weekEnd),
      ]);
      if (!alive) return;
      setDoctors(d1.data || []);
      setRotation(d2.data || []);
      setBlockTemplates(d3.data || []);
      setProgramAssignments(d4.data || []);
      setShiftCalendar(d5.data || []);

      // Carga ausencias y oneoff de la semana
      const [a, o, ag] = await Promise.all([
        supabase.from('sdm_absences').select('*').gte('date', weekStart).lte('date', weekEnd),
        supabase.from('sdm_oneoff_blocks').select('*').eq('week_start', weekStart),
        supabase.from('sdm_weekly_agendas').select('*').eq('week_start', weekStart).maybeSingle(),
      ]);
      if (!alive) return;
      setAbsences(a.data || []);
      setOneoffBlocks(o.data || []);
      if (ag.data?.data?.reinforcements) setReinforcements(ag.data.data.reinforcements);
      else setReinforcements({});
      setSavedAgendaId(ag.data?.id || null);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [weekStart, weekEnd]);

  const agenda = useMemo(() => {
    if (loading) return [];
    return generateAgenda({
      weekStart: monday,
      doctors, rotation, shiftCalendar, blockTemplates,
      programAssignments, absences, oneoffBlocks,
      manualReinforcements: reinforcements,
    });
  }, [loading, monday, doctors, rotation, shiftCalendar, blockTemplates, programAssignments, absences, oneoffBlocks, reinforcements]);

  const validation = useMemo(() => validateAgenda(agenda, doctors), [agenda, doctors]);
  const doctorName = id => doctors.find(d => d.id === id)?.display_name || id;

  function shiftWeek(deltaDays) {
    const d = new Date(monday);
    d.setDate(d.getDate() + deltaDays);
    setMonday(d);
  }

  async function saveAgenda() {
    const payload = {
      week_start: weekStart,
      data: { agenda, reinforcements, generated_at: new Date().toISOString() },
      status: 'editada',
      updated_at: new Date().toISOString(),
    };
    if (savedAgendaId) {
      const { error } = await supabase.from('sdm_weekly_agendas').update(payload).eq('id', savedAgendaId);
      if (error) alert('Error: ' + error.message);
      else alert('Agenda actualizada.');
    } else {
      const { data, error } = await supabase.from('sdm_weekly_agendas').insert(payload).select('id').single();
      if (error) alert('Error: ' + error.message);
      else { setSavedAgendaId(data.id); alert('Agenda guardada.'); }
    }
  }

  async function addAbsence() {
    if (!newAbs.doctor_id || !newAbs.date) return;
    const { error } = await supabase.from('sdm_absences').insert(newAbs);
    if (error) { alert('Error: ' + error.message); return; }
    const { data } = await supabase.from('sdm_absences').select('*').gte('date', weekStart).lte('date', weekEnd);
    setAbsences(data || []);
    setShowAbsenceDialog(false);
    setNewAbs({ doctor_id: '', date: '', type: 'A', notes: '' });
  }

  async function deleteAbsence(id) {
    await supabase.from('sdm_absences').delete().eq('id', id);
    setAbsences(absences.filter(a => a.id !== id));
  }

  function updateReinforcement(date, slot, doctorId) {
    setReinforcements(prev => ({ ...prev, [date]: { ...(prev[date] || {}), [slot]: doctorId || null } }));
  }

  if (loading) return <div className="p-6 text-slate-500">Cargando catálogos...</div>;
  if (doctors.length === 0) {
    return (
      <Card className="border-amber-300 bg-amber-50">
        <CardHeader><CardTitle className="text-amber-900">Configuración pendiente</CardTitle></CardHeader>
        <CardContent className="text-sm text-amber-900 space-y-2">
          <p>No hay médicos en la BD. Para inicializar:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Ejecutar <code className="bg-amber-100 px-1">supabase/migrations/20260509120000_create_sdm_tables.sql</code> en Supabase Studio.</li>
            <li>Correr <code className="bg-amber-100 px-1">node scripts/seed-sdm-v1.mjs --apply</code></li>
          </ol>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Selector semana + acciones */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="outline" size="sm" onClick={() => shiftWeek(-7)}><ChevronLeft className="h-4 w-4" /></Button>
        <div className="font-semibold text-slate-700">
          Semana del {weekDays[0].date} al {weekDays[4].date}
        </div>
        <Button variant="outline" size="sm" onClick={() => shiftWeek(7)}><ChevronRight className="h-4 w-4" /></Button>
        <Button variant="outline" size="sm" onClick={() => setMonday(getMondayOfWeek(new Date()))}>Hoy</Button>
        <div className="flex-1" />
        <Button onClick={saveAgenda} className="gap-1.5"><Save className="h-4 w-4" /> Guardar</Button>
        <Button variant="outline" onClick={() => window.print()} className="gap-1.5"><Printer className="h-4 w-4" /> Imprimir</Button>
      </div>

      {/* Banners de validación */}
      {(validation.errors.length > 0 || validation.warnings.length > 0) && (
        <Card className={validation.errors.length ? 'border-red-300 bg-red-50' : 'border-amber-300 bg-amber-50'}>
          <CardContent className="pt-4 text-sm space-y-1">
            {validation.errors.map((e, i) => <div key={'e' + i} className="text-red-800">⛔ {e}</div>)}
            {validation.warnings.map((w, i) => <div key={'w' + i} className="text-amber-800">⚠️ {w}</div>)}
          </CardContent>
        </Card>
      )}

      {/* Panel de ausencias */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Ausencias de la semana ({absences.length})</CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowAbsenceDialog(true)} className="gap-1.5">
            <Plus className="h-4 w-4" /> Agregar
          </Button>
        </CardHeader>
        <CardContent>
          {absences.length === 0 ? (
            <p className="text-sm text-slate-500">Sin ausencias registradas para la semana.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {absences.map(a => (
                <Badge key={a.id} variant="secondary" className="gap-1.5">
                  {doctorName(a.doctor_id)} · {a.date} · {a.type}
                  <button onClick={() => deleteAbsence(a.id)} className="hover:text-red-600"><Trash2 className="h-3 w-3" /></button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabla agenda 5x8 */}
      <div className="overflow-x-auto rounded-lg border border-emerald-300 print:border-black">
        <table className="min-w-full text-xs">
          <thead className="bg-emerald-700 text-white print:bg-emerald-900">
            <tr>
              <th className="px-2 py-2 text-left">DÍA</th>
              <th className="px-2 py-2 text-left">TURNOS</th>
              <th className="px-2 py-2 text-left">REFUERZOS</th>
              <th className="px-2 py-2 text-left">POSTTURNO</th>
              <th className="px-2 py-2 text-left">AUSENCIAS</th>
              <th className="px-2 py-2 text-left w-72">BLOQUEOS</th>
              <th className="px-2 py-2 text-left">VISITA</th>
              <th className="px-2 py-2 text-left">POLICLÍNICO</th>
              <th className="px-2 py-2 text-left">POLI 8 AM</th>
            </tr>
          </thead>
          <tbody>
            {agenda.map(day => (
              <tr key={day.date} className="border-b border-slate-200 align-top hover:bg-slate-50">
                <td className="px-2 py-2 font-bold text-slate-800">{day.label}<div className="text-[10px] font-normal text-slate-500">{day.date}<br/>T{day.turnoNumber ?? '–'}</div></td>
                <td className="px-2 py-2">{day.turnos.map((t, i) => <div key={i}>{doctorName(t.doctor_id)}{t.replaced && <span className="text-amber-600"> (←{doctorName(t.original_doctor_id)})</span>}</div>)}</td>
                <td className="px-2 py-2 space-y-1">
                  <Select value={day.refuerzos.am || ''} onValueChange={v => updateReinforcement(day.date, 'am', v)}>
                    <SelectTrigger className="h-7 text-[11px]"><SelectValue placeholder="AM…" /></SelectTrigger>
                    <SelectContent>{doctors.map(d => <SelectItem key={d.id} value={d.id}>{d.display_name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={day.refuerzos.pm || ''} onValueChange={v => updateReinforcement(day.date, 'pm', v)}>
                    <SelectTrigger className="h-7 text-[11px]"><SelectValue placeholder="PM…" /></SelectTrigger>
                    <SelectContent>{doctors.map(d => <SelectItem key={d.id} value={d.id}>{d.display_name}</SelectItem>)}</SelectContent>
                  </Select>
                </td>
                <td className="px-2 py-2 text-slate-600">{day.posturno.map((t, i) => <div key={i}>{doctorName(t.doctor_id)}</div>)}</td>
                <td className="px-2 py-2">{day.ausencias.map((a, i) => <div key={i} className="text-red-700">{doctorName(a.doctor_id)} ({a.type})</div>)}</td>
                <td className="px-2 py-2 space-y-0.5">
                  {day.bloqueos.length === 0 ? <span className="text-slate-400">–</span> :
                    day.bloqueos.sort((x, y) => (x.from || '').localeCompare(y.from || '')).map((b, i) => (
                      <div key={i} className={`text-[11px] ${b.unassigned ? 'text-red-600 font-semibold' : 'text-slate-700'}`}>
                        {b.from && b.to ? `${b.from}–${b.to} ` : ''}
                        {b.doctor_id ? doctorName(b.doctor_id) : '⚠ SIN ASIGNAR'} <span className="text-slate-500">{b.name}</span>
                      </div>
                    ))
                  }
                </td>
                <td className="px-2 py-2 text-[11px]">{day.visita.slice(0, 6).map((v, i) => <div key={i}>{doctorName(v.doctor_id)}</div>)}</td>
                <td className="px-2 py-2">{day.policlinico_pm ? doctorName(day.policlinico_pm) : <span className="text-slate-400">–</span>}</td>
                <td className="px-2 py-2">{day.poli_am ? doctorName(day.poli_am) : <span className="text-slate-400">–</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Dialog agregar ausencia */}
      <Dialog open={showAbsenceDialog} onOpenChange={setShowAbsenceDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Agregar ausencia</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-slate-600">Médico</label>
              <Select value={newAbs.doctor_id} onValueChange={v => setNewAbs({ ...newAbs, doctor_id: v })}>
                <SelectTrigger><SelectValue placeholder="Elegir…" /></SelectTrigger>
                <SelectContent>{doctors.map(d => <SelectItem key={d.id} value={d.id}>{d.display_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Fecha</label>
              <Input type="date" value={newAbs.date} onChange={e => setNewAbs({ ...newAbs, date: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Tipo</label>
              <Select value={newAbs.type} onValueChange={v => setNewAbs({ ...newAbs, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ABSENCE_TYPES.map(t => <SelectItem key={t} value={t}>{t} — {ABSENCE_LABELS[t]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Notas (opcional)</label>
              <Input value={newAbs.notes} onChange={e => setNewAbs({ ...newAbs, notes: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAbsenceDialog(false)}>Cancelar</Button>
            <Button onClick={addAbsence}>Agregar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
