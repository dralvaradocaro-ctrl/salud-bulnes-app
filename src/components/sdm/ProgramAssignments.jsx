import React, { useState, useEffect, useMemo } from 'react';
import { sdmSupabase as supabase, explainSdmWriteError } from './lib/sdmSupabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';

const CAT_LABEL = {
  clinico: 'Clínico',
  gestion: 'Gestión',
  reunion: 'Reunión',
  visita_radio: 'Radio',
  judicial: 'Judicial',
  otro: 'Otro',
};

const CAT_COLOR = {
  clinico: 'bg-blue-100 text-blue-800',
  gestion: 'bg-amber-100 text-amber-800',
  reunion: 'bg-violet-100 text-violet-800',
  visita_radio: 'bg-pink-100 text-pink-800',
  judicial: 'bg-red-100 text-red-800',
  otro: 'bg-slate-100 text-slate-700',
};

export default function ProgramAssignments() {
  const [doctors, setDoctors] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [savingFor, setSavingFor] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const [d, b, a] = await Promise.all([
        supabase.from('sdm_doctors').select('*').eq('active', true).order('display_name'),
        supabase.from('sdm_block_templates').select('*').order('name'),
        supabase.from('sdm_program_assignments').select('*'),
      ]);
      if (!alive) return;
      setDoctors(d.data || []);
      setBlocks(b.data || []);
      setAssignments(a.data || []);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  const titularBy = useMemo(() => {
    const m = {};
    assignments.filter(x => x.role_type === 'titular').forEach(x => m[x.block_template_id] = x);
    return m;
  }, [assignments]);

  const subrogantesBy = useMemo(() => {
    const m = {};
    assignments.filter(x => x.role_type === 'subrogante').forEach(x => {
      (m[x.block_template_id] = m[x.block_template_id] || []).push(x);
    });
    Object.values(m).forEach(arr => arr.sort((a, b) => (a.priority || 1) - (b.priority || 1)));
    return m;
  }, [assignments]);

  // Un bloque "tiene horario regular" si su weekday_pattern no está vacío,
  // o es mensual (reunión periódica). Estos van primero, destacados.
  const tieneHorarioRegular = (b) => {
    if (b.is_monthly) return true;
    const wp = b.weekday_pattern || {};
    return Object.values(wp).some(slots => Array.isArray(slots) && slots.length > 0);
  };

  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase();
    const matched = !f ? blocks : blocks.filter(b =>
      b.name.toLowerCase().includes(f) ||
      b.id.includes(f) ||
      (b.category || '').includes(f)
    );
    // Ordenar: regulares primero (por nombre), luego incidentales (por nombre)
    return matched.slice().sort((a, b) => {
      const ra = tieneHorarioRegular(a) ? 0 : 1;
      const rb = tieneHorarioRegular(b) ? 0 : 1;
      if (ra !== rb) return ra - rb;
      return a.name.localeCompare(b.name);
    });
  }, [blocks, filter]);

  const regularesCount = useMemo(() => filtered.filter(tieneHorarioRegular).length, [filtered]);

  async function setTitular(blockId, doctorId) {
    setSavingFor(`${blockId}:titular`);
    await supabase.from('sdm_program_assignments')
      .delete()
      .eq('block_template_id', blockId)
      .eq('role_type', 'titular');
    if (doctorId && doctorId !== '__none__') {
      const { error } = await supabase.from('sdm_program_assignments')
        .insert({ block_template_id: blockId, doctor_id: doctorId, role_type: 'titular', priority: 1 });
      if (error) { alert('Error: ' + error.message); setSavingFor(null); return; }
    }
    const { data } = await supabase.from('sdm_program_assignments').select('*');
    setAssignments(data || []);
    setSavingFor(null);
  }

  async function addSubrogante(blockId, doctorId) {
    if (!doctorId || doctorId === '__none__') return;
    setSavingFor(`${blockId}:add_sub`);
    const existing = subrogantesBy[blockId] || [];
    if (existing.some(s => s.doctor_id === doctorId)) {
      alert('Ese médico ya es subrogante de este bloque.');
      setSavingFor(null);
      return;
    }
    const nextPriority = existing.length ? Math.max(...existing.map(s => s.priority || 1)) + 1 : 1;
    const { error } = await supabase.from('sdm_program_assignments')
      .insert({ block_template_id: blockId, doctor_id: doctorId, role_type: 'subrogante', priority: nextPriority });
    if (error) { alert('Error: ' + error.message); setSavingFor(null); return; }
    const { data } = await supabase.from('sdm_program_assignments').select('*');
    setAssignments(data || []);
    setSavingFor(null);
  }

  async function removeSubrogante(assignmentId) {
    await supabase.from('sdm_program_assignments').delete().eq('id', assignmentId);
    const { data } = await supabase.from('sdm_program_assignments').select('*');
    setAssignments(data || []);
  }

  if (loading) return <div className="p-6 text-slate-500">Cargando…</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Asignaciones por programa</CardTitle>
        <CardDescription>
          Definí el médico titular y el subrogante para cada bloqueo recurrente. Los cambios se guardan automáticamente.
        </CardDescription>
        <div className="relative max-w-md mt-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Filtrar por nombre, categoría…"
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs uppercase tracking-wide text-slate-600">
                <th className="px-3 py-2">Programa</th>
                <th className="px-3 py-2">Cat.</th>
                <th className="px-3 py-2">Horario</th>
                <th className="px-3 py-2 w-48">Titular</th>
                <th className="px-3 py-2 w-72">Subrogantes (orden de prioridad)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((b, idx) => {
                const t = titularBy[b.id]?.doctor_id || '';
                const subs = subrogantesBy[b.id] || [];
                const savingT = savingFor === `${b.id}:titular`;
                const savingAdd = savingFor === `${b.id}:add_sub`;
                const regular = tieneHorarioRegular(b);
                // Separador entre regulares e incidentales
                const isFirstIncidental = !regular && idx > 0 && tieneHorarioRegular(filtered[idx - 1]);
                return (
                  <React.Fragment key={b.id}>
                    {isFirstIncidental && (
                      <tr className="bg-slate-100">
                        <td colSpan={5} className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                          Gestiones incidentales · sin bloqueo semanal regular
                        </td>
                      </tr>
                    )}
                    {idx === 0 && regular && (
                      <tr className="bg-emerald-50">
                        <td colSpan={5} className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                          Programas con bloqueo habitual ({regularesCount})
                        </td>
                      </tr>
                    )}
                  <tr className={`hover:bg-slate-50/50 align-top ${regular ? '' : 'opacity-90'}`}>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {regular && <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" title="Bloqueo regular"></span>}
                        <div>
                          <div className="font-medium text-slate-800">{b.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{b.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <Badge className={CAT_COLOR[b.category] || 'bg-slate-100 text-slate-700'}>
                        {CAT_LABEL[b.category] || b.category}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-600 max-w-[200px]">
                      {b.default_schedule}
                      {b.is_monthly && <Badge variant="outline" className="ml-1 text-[10px]">mensual</Badge>}
                    </td>
                    <td className="px-3 py-2">
                      <Select value={t} onValueChange={v => setTitular(b.id, v)} disabled={savingT}>
                        <SelectTrigger className={`h-8 ${!t && 'border-amber-300 bg-amber-50'}`}>
                          <SelectValue placeholder={savingT ? 'Guardando…' : 'Sin asignar'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">— Sin asignar —</SelectItem>
                          {doctors.map(d => <SelectItem key={d.id} value={d.id}>{d.display_name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2 space-y-1">
                      {subs.map((s, idx) => (
                        <div key={s.id} className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[10px] w-5 justify-center">{idx + 1}</Badge>
                          <span className="text-sm flex-1">{doctors.find(d => d.id === s.doctor_id)?.display_name || s.doctor_id}</span>
                          <button onClick={() => removeSubrogante(s.id)} className="text-red-500 hover:text-red-700">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      <Select value="" onValueChange={v => addSubrogante(b.id, v)} disabled={savingAdd}>
                        <SelectTrigger className="h-7 text-xs border-dashed">
                          <SelectValue placeholder={savingAdd ? 'Guardando…' : '+ Agregar subrogante'} />
                        </SelectTrigger>
                        <SelectContent>
                          {doctors.filter(d => !subs.some(s => s.doctor_id === d.id) && d.id !== t)
                            .map(d => <SelectItem key={d.id} value={d.id}>{d.display_name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-6">Sin programas que coincidan con el filtro.</p>
        )}
        <div className="mt-4 text-xs text-slate-500">
          {Object.keys(titularBy).length} de {blocks.length} programas con titular asignado
        </div>
      </CardContent>
    </Card>
  );
}
