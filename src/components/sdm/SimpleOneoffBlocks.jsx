import React, { useEffect, useState } from 'react';
import { sdmSupabase as supabase, explainSdmWriteError, insertOneoffBlock } from './lib/sdmSupabase';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, X } from 'lucide-react';

const blockDocIds = (b) => Array.isArray(b?.doctor_ids) && b.doctor_ids.length
  ? b.doctor_ids.filter(Boolean)
  : (b?.doctor_id ? [b.doctor_id] : []);

const DEFAULT_DESCRIPTION = {
  visita_radio: 'Visita radio',
  judicial: 'Citación judicial',
};

function getMonday(d) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
}

/**
 * Creador minimal de bloqueos puntuales (sdm_oneoff_blocks) para una categoría fija.
 * Útil para tabs Radio (category='visita_radio') y Judiciales (category='judicial').
 * Form solo pide médico + fecha + horario. Descripción se autogenera con un default.
 */
export default function SimpleOneoffBlocks({ category, title, icon: Icon, descriptionLabel, onChanged }) {
  const [doctors, setDoctors] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ date: '', doctor_ids: [], time_from: '', time_to: '', description: '' });
  const defaultDesc = DEFAULT_DESCRIPTION[category] || descriptionLabel || 'Bloqueo';

  async function load() {
    setLoading(true);
    const today = new Date().toISOString().slice(0, 10);
    const [d, b] = await Promise.all([
      supabase.from('sdm_doctors').select('*').eq('active', true).order('display_name'),
      supabase.from('sdm_oneoff_blocks').select('*').eq('category', category).gte('date', today).order('date'),
    ]);
    setDoctors(d.data || []);
    setBlocks(b.data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [category]);

  const docName = (id) => doctors.find(d => d.id === id)?.display_name || id;

  async function add() {
    if (!form.date || form.doctor_ids.length === 0 || !form.time_from || !form.time_to) {
      toast.error('Fecha, médico y horario son obligatorios.');
      return;
    }
    if (form.time_from >= form.time_to) {
      toast.error('La hora "Desde" debe ser menor que "Hasta".');
      return;
    }
    const payload = {
      week_start: getMonday(form.date),
      date: form.date,
      doctor_id: form.doctor_ids[0],
      doctor_ids: form.doctor_ids,
      time_from: form.time_from,
      time_to: form.time_to,
      description: form.description.trim() || defaultDesc,
      category,
    };
    const { error } = await insertOneoffBlock(payload);
    if (error) { toast.error('Error: ' + (explainSdmWriteError(error) || error.message)); return; }
    toast.success(`${defaultDesc} agregado.`);
    setForm({ date: '', doctor_ids: [], time_from: '', time_to: '', description: '' });
    await load();
    onChanged?.();
  }

  async function remove(id) {
    if (!confirm('¿Eliminar este bloqueo?')) return;
    const { error } = await supabase.from('sdm_oneoff_blocks').delete().eq('id', id);
    if (error) { toast.error('Error: ' + error.message); return; }
    await load();
    onChanged?.();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Form de alta */}
        <div className="grid grid-cols-12 gap-2 items-end border border-dashed border-slate-300 rounded-lg p-3 bg-slate-50">
          <div className="col-span-12 sm:col-span-3">
            <label className="text-[11px] uppercase tracking-wide text-slate-500">Fecha</label>
            <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="h-8" />
          </div>
          <div className="col-span-12 sm:col-span-3">
            <label className="text-[11px] uppercase tracking-wide text-slate-500">Médicos</label>
            <div className="min-h-8 rounded-md border border-input px-1.5 py-1 flex flex-wrap gap-1 items-center bg-white">
              {form.doctor_ids.map(id => {
                const d = doctors.find(x => x.id === id);
                return (
                  <Badge key={id} className="text-[10px] bg-blue-50 text-blue-800 border border-blue-200 gap-1 pl-2 pr-1 py-0.5">
                    {d?.display_name || id}
                    <button type="button" onClick={() => setForm({ ...form, doctor_ids: form.doctor_ids.filter(x => x !== id) })} className="hover:bg-blue-200 rounded">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
              <Select value="" onValueChange={v => { if (v && !form.doctor_ids.includes(v)) setForm({ ...form, doctor_ids: [...form.doctor_ids, v] }); }}>
                <SelectTrigger className="h-6 px-1.5 py-0 w-auto border-0 shadow-none text-[10px] text-slate-500 hover:text-slate-700">
                  <SelectValue placeholder={form.doctor_ids.length ? '+ Otro' : 'Seleccionar...'} />
                </SelectTrigger>
                <SelectContent>
                  {doctors.filter(d => !form.doctor_ids.includes(d.id)).map(d => <SelectItem key={d.id} value={d.id}>{d.display_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="col-span-6 sm:col-span-2">
            <label className="text-[11px] uppercase tracking-wide text-slate-500">Desde</label>
            <Input type="time" value={form.time_from} onChange={e => setForm({ ...form, time_from: e.target.value })} className="h-8" />
          </div>
          <div className="col-span-6 sm:col-span-2">
            <label className="text-[11px] uppercase tracking-wide text-slate-500">Hasta</label>
            <Input type="time" value={form.time_to} onChange={e => setForm({ ...form, time_to: e.target.value })} className="h-8" />
          </div>
          <div className="col-span-12 sm:col-span-2">
            <Button onClick={add} size="sm" className="w-full gap-1.5">
              <Plus className="h-4 w-4" /> Agregar
            </Button>
          </div>
          <div className="col-span-12">
            <label className="text-[11px] uppercase tracking-wide text-slate-500">Descripción (opcional)</label>
            <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder={defaultDesc} className="h-8" />
          </div>
        </div>

        {/* Lista */}
        {loading ? (
          <p className="text-sm text-slate-500">Cargando...</p>
        ) : blocks.length === 0 ? (
          <p className="text-sm text-slate-500 italic text-center py-4">Sin bloqueos próximos.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 border-b">
                  <th className="py-2 px-2">Fecha</th>
                  <th className="py-2 px-2">Médico</th>
                  <th className="py-2 px-2">Horario</th>
                  <th className="py-2 px-2">Descripción</th>
                  <th className="py-2 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {blocks.map(b => (
                  <tr key={b.id} className="border-b hover:bg-slate-50">
                    <td className="py-2 px-2 font-mono">{b.date}</td>
                    <td className="py-2 px-2">{blockDocIds(b).map(docName).join(' + ') || '—'}</td>
                    <td className="py-2 px-2 font-mono text-slate-600">{b.time_from || '—'} – {b.time_to || '—'}</td>
                    <td className="py-2 px-2 text-slate-600">{b.description || defaultDesc}</td>
                    <td className="py-2 px-2 text-right">
                      <Button variant="ghost" size="sm" onClick={() => remove(b.id)} className="text-red-600 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
