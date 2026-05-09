import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
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

  const subroganteBy = useMemo(() => {
    const m = {};
    assignments.filter(x => x.role_type === 'subrogante').forEach(x => m[x.block_template_id] = x);
    return m;
  }, [assignments]);

  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return blocks;
    return blocks.filter(b =>
      b.name.toLowerCase().includes(f) ||
      b.id.includes(f) ||
      (b.category || '').includes(f)
    );
  }, [blocks, filter]);

  async function assign(blockId, roleType, doctorId) {
    setSavingFor(`${blockId}:${roleType}`);
    // Borrar asignación previa de esta combinación block+role
    await supabase
      .from('sdm_program_assignments')
      .delete()
      .eq('block_template_id', blockId)
      .eq('role_type', roleType);

    if (doctorId && doctorId !== '__none__') {
      const { error } = await supabase
        .from('sdm_program_assignments')
        .insert({ block_template_id: blockId, doctor_id: doctorId, role_type: roleType });
      if (error) {
        alert('Error: ' + error.message);
        setSavingFor(null);
        return;
      }
    }

    // refrescar
    const { data } = await supabase.from('sdm_program_assignments').select('*');
    setAssignments(data || []);
    setSavingFor(null);
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
                <th className="px-3 py-2 w-56">Titular</th>
                <th className="px-3 py-2 w-56">Subrogante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(b => {
                const t = titularBy[b.id]?.doctor_id || '';
                const s = subroganteBy[b.id]?.doctor_id || '';
                const savingT = savingFor === `${b.id}:titular`;
                const savingS = savingFor === `${b.id}:subrogante`;
                return (
                  <tr key={b.id} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2">
                      <div className="font-medium text-slate-800">{b.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{b.id}</div>
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
                      <div className="flex items-center gap-1">
                        <Select value={t} onValueChange={v => assign(b.id, 'titular', v)} disabled={savingT}>
                          <SelectTrigger className={`h-8 ${!t && 'border-amber-300 bg-amber-50'}`}>
                            <SelectValue placeholder={savingT ? 'Guardando…' : 'Sin asignar'} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">— Sin asignar —</SelectItem>
                            {doctors.map(d => <SelectItem key={d.id} value={d.id}>{d.display_name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <Select value={s} onValueChange={v => assign(b.id, 'subrogante', v)} disabled={savingS}>
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder={savingS ? 'Guardando…' : 'Sin asignar'} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">— Sin asignar —</SelectItem>
                          {doctors.map(d => <SelectItem key={d.id} value={d.id}>{d.display_name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
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
