import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Users2, EyeOff } from 'lucide-react';
import { sdmSupabase as supabase, explainSdmWriteError } from './lib/sdmSupabase';
import { fmtDate, weekDates } from './lib/generateAgenda';

/**
 * Panel de reuniones internas de Subdirección Médica de la semana.
 * Se guardan en sdm_oneoff_blocks con category='sdm_interna', sin doctor_id
 * (el bloque corresponde al equipo de SDM, no a un médico específico).
 *
 * Visibles en AgendaSemanal y Cronograma con la clase sdm-print-hide para
 * que NO aparezcan al imprimir la agenda final.
 */
export default function SdmInternalMeetings({ monday, onChanged }) {
  const days = weekDates(monday);
  const weekStart = fmtDate(monday);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ date: days[0].date, time_from: '08:00', time_to: '09:00', description: '' });

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from('sdm_oneoff_blocks')
      .select('*')
      .eq('week_start', weekStart)
      .eq('category', 'sdm_interna')
      .order('date').order('time_from');
    if (error) toast.error('Error al cargar reuniones: ' + (explainSdmWriteError(error) || error.message));
    else setItems(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [weekStart]);

  async function add() {
    if (!form.date || !form.description.trim()) {
      toast.error('Fecha y descripción son obligatorios');
      return;
    }
    if (form.time_from && form.time_to && form.time_from >= form.time_to) {
      toast.error('Desde debe ser anterior a Hasta');
      return;
    }
    const { error } = await supabase.from('sdm_oneoff_blocks').insert({
      week_start: weekStart,
      date: form.date,
      doctor_id: null,
      time_from: form.time_from || null,
      time_to: form.time_to || null,
      description: form.description.trim(),
      category: 'sdm_interna',
    });
    if (error) { toast.error('Error: ' + (explainSdmWriteError(error) || error.message)); return; }
    toast.success('Reunión agregada');
    setForm({ ...form, description: '' });
    await load();
    onChanged?.();
  }

  async function remove(id) {
    const { error } = await supabase.from('sdm_oneoff_blocks').delete().eq('id', id);
    if (error) { toast.error('Error: ' + (explainSdmWriteError(error) || error.message)); return; }
    toast.success('Reunión eliminada');
    await load();
    onChanged?.();
  }

  return (
    <Card className="border-violet-200 bg-violet-50/40 sdm-print-hide">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 text-violet-900">
          <Users2 className="h-4 w-4" />
          Reuniones internas SDM ({items.length})
          <span className="ml-auto text-[10px] font-normal text-violet-700 flex items-center gap-1">
            <EyeOff className="h-3 w-3" /> No se imprimen en la agenda final
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {/* Formulario rápido */}
        <div className="flex flex-wrap gap-2 items-end">
          <div>
            <label className="block text-[10px] uppercase tracking-wide text-violet-700 mb-0.5">Día</label>
            <select
              className="h-8 px-2 text-xs rounded border border-violet-300 bg-white"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
            >
              {days.map(d => <option key={d.date} value={d.date}>{d.label} {d.date.slice(5)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wide text-violet-700 mb-0.5">Desde</label>
            <Input type="time" value={form.time_from} onChange={e => setForm({ ...form, time_from: e.target.value })} className="h-8 w-24 text-xs" />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wide text-violet-700 mb-0.5">Hasta</label>
            <Input type="time" value={form.time_to} onChange={e => setForm({ ...form, time_to: e.target.value })} className="h-8 w-24 text-xs" />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-[10px] uppercase tracking-wide text-violet-700 mb-0.5">Asunto</label>
            <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="ej. Reunión equipo SDM" className="h-8 text-xs" />
          </div>
          <Button size="sm" onClick={add} className="bg-violet-600 hover:bg-violet-700 gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Agregar
          </Button>
        </div>

        {/* Listado */}
        {loading ? (
          <p className="text-xs text-slate-400 italic">Cargando…</p>
        ) : items.length === 0 ? (
          <p className="text-xs text-violet-600/70 italic">Sin reuniones internas esta semana.</p>
        ) : (
          <div className="space-y-1">
            {items.map(it => {
              const day = days.find(d => d.date === it.date);
              return (
                <div key={it.id} className="flex items-center gap-2 bg-white rounded border border-violet-200 px-2 py-1 text-xs">
                  <span className="font-semibold text-violet-900 w-20 shrink-0">{day?.label || it.date}</span>
                  <span className="text-slate-600 w-24 shrink-0">{it.time_from || '—'}–{it.time_to || '—'}</span>
                  <span className="flex-1 text-slate-800">{it.description}</span>
                  <Button variant="ghost" size="sm" onClick={() => remove(it.id)} className="text-red-600 hover:bg-red-50 h-7 w-7 p-0">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
