import React, { useState, useEffect } from 'react';
import { sdmSupabase as supabase, explainSdmWriteError } from './lib/sdmSupabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, CalendarDays } from 'lucide-react';

const CAUSES = [
  { value: 'reunion', label: 'Reunión' },
  { value: 'protocolo', label: 'Protocolo' },
  { value: 'salida', label: 'Salida / Comisión' },
  { value: 'capacitacion', label: 'Capacitación' },
  { value: 'judicial', label: 'Trámite judicial' },
  { value: 'visita_radio', label: 'Visita radio' },
  { value: 'otro', label: 'Otro' },
];
const CAUSE_LABEL = Object.fromEntries(CAUSES.map(c => [c.value, c.label]));
const CAUSE_COLOR = {
  reunion: 'bg-violet-100 text-violet-800',
  protocolo: 'bg-blue-100 text-blue-800',
  salida: 'bg-amber-100 text-amber-800',
  capacitacion: 'bg-cyan-100 text-cyan-800',
  judicial: 'bg-red-100 text-red-800',
  visita_radio: 'bg-pink-100 text-pink-800',
  otro: 'bg-slate-100 text-slate-700',
};

function getMonday(d) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
}

const OTHER_CAUSE_CATEGORIES = CAUSES.map(c => c.value);

export default function MeetingBlocks({ onChanged }) {
  const [doctors, setDoctors] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ date: '', doctor_id: '', time_from: '', time_to: '', cause: 'reunion', description: '' });

  async function load() {
    setLoading(true);
    const today = new Date().toISOString().slice(0, 10);
    const [d, b] = await Promise.all([
      supabase.from('sdm_doctors').select('*').eq('active', true).order('display_name'),
      supabase.from('sdm_oneoff_blocks').select('*').in('category', OTHER_CAUSE_CATEGORIES).gte('date', today).order('date'),
    ]);
    setDoctors(d.data || []);
    setBlocks(b.data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const docName = id => doctors.find(d => d.id === id)?.display_name || id;

  async function add() {
    const missing = [];
    if (!form.date) missing.push('fecha');
    if (!form.doctor_id) missing.push('médico');
    if (!form.description.trim()) missing.push('motivo');
    if (missing.length) {
      console.warn('[MeetingBlocks] add() bloqueado — estado actual del form:', form, 'faltan:', missing);
      alert('Falta: ' + missing.join(', ') + '.');
      return;
    }
    const payload = {
      week_start: getMonday(form.date),
      date: form.date,
      doctor_id: form.doctor_id,
      time_from: form.time_from || null,
      time_to: form.time_to || null,
      description: form.description.trim(),
      category: form.cause,
    };
    const { error } = await supabase.from('sdm_oneoff_blocks').insert(payload);
    if (error) { alert('Error: ' + (explainSdmWriteError(error) || error.message)); return; }
    setShowDialog(false);
    setForm({ date: '', doctor_id: '', time_from: '', time_to: '', cause: 'reunion', description: '' });
    await load();
    onChanged?.();
  }

  async function remove(id) {
    if (!confirm('¿Eliminar bloqueo?')) return;
    await supabase.from('sdm_oneoff_blocks').delete().eq('id', id);
    await load();
    onChanged?.();
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-base flex items-center gap-2"><CalendarDays className="h-5 w-5" />Bloqueos por otras causas</CardTitle>
          <CardDescription>
            Reuniones, protocolos, salidas, capacitaciones, trámites judiciales u otros motivos puntuales que ocupan a un médico. Aparecen en la agenda semanal del día con el motivo.
          </CardDescription>
        </div>
        <Button size="sm" onClick={() => setShowDialog(true)} className="gap-1.5"><Plus className="h-4 w-4" />Nuevo bloqueo</Button>
      </CardHeader>
      <CardContent>
        {loading ? <p className="text-sm text-slate-500">Cargando…</p> :
         blocks.length === 0 ? <p className="text-sm text-slate-500">Sin bloqueos puntuales agendados a futuro.</p> :
         (
          <div className="space-y-2">
            {blocks.map(b => (
              <div key={b.id} className="flex items-center gap-3 p-3 rounded border border-slate-200 bg-white">
                <Badge variant="outline" className="text-xs">{b.date}</Badge>
                <Badge className={`text-[10px] ${CAUSE_COLOR[b.category] || 'bg-slate-100 text-slate-700'}`}>
                  {CAUSE_LABEL[b.category] || b.category}
                </Badge>
                <div className="font-medium">{docName(b.doctor_id)}</div>
                <div className="text-xs text-slate-600">{b.time_from && b.time_to ? `${b.time_from?.slice(0,5)}–${b.time_to?.slice(0,5)}` : 'sin horario'}</div>
                <div className="flex-1 text-sm text-slate-700 italic">{b.description}</div>
                <button onClick={() => remove(b.id)} className="text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
         )}
      </CardContent>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Agendar bloqueo</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-slate-600">Fecha</label>
              <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Médico</label>
              <Select value={form.doctor_id} onValueChange={v => setForm({ ...form, doctor_id: v })}>
                <SelectTrigger><SelectValue placeholder="Elegir…" /></SelectTrigger>
                <SelectContent>{doctors.map(d => <SelectItem key={d.id} value={d.id}>{d.display_name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Tipo de causa</label>
              <Select value={form.cause} onValueChange={v => setForm({ ...form, cause: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CAUSES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-slate-600">Desde</label>
                <Input type="time" value={form.time_from} onChange={e => setForm({ ...form, time_from: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Hasta</label>
                <Input type="time" value={form.time_to} onChange={e => setForm({ ...form, time_to: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Motivo / descripción</label>
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Ej: Revisión protocolo Hipotiroidismo" />
              <p className="text-[10px] text-slate-500 mt-1">Este texto aparecerá en la agenda del día.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={add}>Agregar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
