import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Pause, Play, AlertCircle } from 'lucide-react';

/**
 * Modal para editar la celda BLOQUEOS de un día + propiedades del día:
 *   - is_holiday
 *   - external_visitors [{name, specialty}]
 *
 * Devuelve via onSave({ bloqueos, is_holiday, external_visitors }).
 */
export default function CellEditor({ open, onOpenChange, day, bloqueos, doctors, blockSuggestions = [], onSave }) {
  const [items, setItems] = useState([]);
  const [isHoliday, setIsHoliday] = useState(false);
  const [visitors, setVisitors] = useState([]);

  useEffect(() => {
    if (open) {
      setItems(bloqueos.map((b, i) => ({ ...b, _key: `${b.block_id}-${i}` })));
      setIsHoliday(!!day?.is_holiday);
      setVisitors(Array.isArray(day?.external_visitors) ? day.external_visitors.map((v, i) => ({ ...v, _key: `v-${i}` })) : []);
    }
  }, [open, bloqueos, day]);

  const update = (key, field, value) =>
    setItems(items.map(it => it._key === key ? { ...it, [field]: value } : it));
  const updateName = (key, value) => {
    const suggestion = blockSuggestions.find(s => s.matchValue === value.trim().toLowerCase());
    setItems(items.map(it => it._key === key
      ? {
          ...it,
          name: suggestion?.name || value,
          category: suggestion?.category || it.category,
        }
      : it));
  };
  const remove = (key) => setItems(items.filter(it => it._key !== key));
  const add = () => setItems([
    ...items,
    {
      _key: `new-${Date.now()}`,
      block_id: `oneoff-${Date.now()}`,
      name: '', from: '', to: '', doctor_id: null,
      category: 'otro', source: 'manual',
    },
  ]);

  const updateVisitor = (key, field, value) =>
    setVisitors(visitors.map(v => v._key === key ? { ...v, [field]: value } : v));
  const removeVisitor = (key) => setVisitors(visitors.filter(v => v._key !== key));
  const addVisitor = () => setVisitors([
    ...visitors,
    { _key: `vnew-${Date.now()}`, name: '', specialty: '' },
  ]);

  // Validaciones por bloqueo:
  //   - itemErrors (bloquean guardar): rango horario inválido (desde >= hasta)
  //   - itemWarnings (no bloquean): solapamiento mismo médico — informativo,
  //     porque a veces SDM/jefatura tiene legítimamente bloques superpuestos.
  const { itemErrors, itemWarnings } = useMemo(() => {
    const errs = {};
    const warns = {};
    const activos = items.filter(it => it.name && it.name.trim() && !it.suspended);
    activos.forEach(it => {
      if (it.from && it.to && it.from >= it.to) {
        errs[it._key] = 'Desde debe ser anterior a Hasta';
      }
    });
    for (let i = 0; i < activos.length; i++) {
      const a = activos[i];
      if (!a.doctor_id || !a.from || !a.to || a.from >= a.to) continue;
      for (let j = i + 1; j < activos.length; j++) {
        const b = activos[j];
        if (b.doctor_id !== a.doctor_id || !b.from || !b.to || b.from >= b.to) continue;
        if (a.from < b.to && b.from < a.to) {
          const other = b.name?.slice(0, 30) || 'otro bloqueo';
          warns[a._key] = warns[a._key] || `Solapa con "${other}"`;
          warns[b._key] = warns[b._key] || `Solapa con "${(a.name || '').slice(0, 30)}"`;
        }
      }
    }
    return { itemErrors: errs, itemWarnings: warns };
  }, [items]);

  const hasErrors = Object.keys(itemErrors).length > 0;

  const save = () => {
    if (hasErrors) {
      toast.error('Hay bloqueos con horarios inválidos. Corregilos antes de guardar.');
      return;
    }
    const cleanedBloqueos = items
      .filter(it => it.name && it.name.trim())
      .map(({ _key, ...rest }) => ({ ...rest, unassigned: !rest.doctor_id }));
    const cleanedVisitors = visitors
      .filter(v => v.name && v.name.trim())
      .map(({ _key, ...rest }) => rest);
    onSave({
      bloqueos: cleanedBloqueos,
      is_holiday: isHoliday,
      external_visitors: cleanedVisitors,
    });
    onOpenChange(false);
  };

  if (!day) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar día · {day.label} {day.date}</DialogTitle>
        </DialogHeader>

        {/* Toggle FERIADO */}
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-2.5">
          <input
            type="checkbox"
            id="holiday-toggle"
            checked={isHoliday}
            onChange={e => setIsHoliday(e.target.checked)}
            className="h-4 w-4"
          />
          <label htmlFor="holiday-toggle" className="text-sm font-semibold text-amber-900 cursor-pointer">
            Día feriado
          </label>
          <span className="text-[11px] text-amber-700">
            (al activar: solo se muestran Turnos · Posturno · Ausencias; resto vacío)
          </span>
        </div>

        {/* Bloqueos (oculto si feriado) */}
        {!isHoliday && (
          <div className="space-y-2 py-2">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">Bloqueos del día</h4>
            {items.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">Sin bloqueos. Clickeá "+ Agregar" para crear uno.</p>
            )}
            {items.map(it => (
              <div key={it._key} className={`flex flex-col gap-1 p-2 border rounded-lg ${it.suspended ? 'border-slate-300 bg-slate-50 opacity-70' : itemErrors[it._key] ? 'border-red-400 bg-red-50' : itemWarnings[it._key] ? 'border-amber-300 bg-amber-50/40' : 'border-slate-200'}`}>
                <div className="flex items-start gap-2">
                <div className={`flex-1 grid grid-cols-12 gap-2 ${it.suspended ? 'line-through decoration-slate-400' : ''}`}>
                  <div className="col-span-5">
                    <label className="text-[10px] uppercase tracking-wide text-slate-500">Programa / Descripción</label>
                    <Input
                      className="h-8"
                      value={it.name || ''}
                      onChange={e => updateName(it._key, e.target.value)}
                      placeholder="ej. ECICEP, Cardiovascular"
                      list="sdm-block-suggestions"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] uppercase tracking-wide text-slate-500">Desde</label>
                    <Input className="h-8" type="time" value={it.from || ''} onChange={e => update(it._key, 'from', e.target.value)} />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] uppercase tracking-wide text-slate-500">Hasta</label>
                    <Input className="h-8" type="time" value={it.to || ''} onChange={e => update(it._key, 'to', e.target.value)} />
                  </div>
                  <div className="col-span-3">
                    <label className="text-[10px] uppercase tracking-wide text-slate-500">Médico</label>
                    <Select value={it.doctor_id || ''} onValueChange={v => update(it._key, 'doctor_id', v === '__none__' ? null : v)}>
                      <SelectTrigger className={`h-8 ${!it.doctor_id && !it.suspended && 'border-amber-300'}`}>
                        <SelectValue placeholder="Sin asignar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— Sin asignar —</SelectItem>
                        {doctors.map(d => <SelectItem key={d.id} value={d.id}>{d.display_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-12 flex gap-2 items-center flex-wrap">
                    <Badge variant="outline" className="text-[10px]">
                      {it.source === 'template' ? 'Del template' : it.source === 'monthly' ? 'Mensual' : it.source === 'oneoff' ? 'Puntual' : 'Manual'}
                    </Badge>
                    <Badge className="text-[10px] bg-slate-100 text-slate-700">{it.category || 'otro'}</Badge>
                    {it.suspended && (
                      <Badge className="text-[10px] bg-slate-200 text-slate-700 border border-slate-400">SUSPENDIDO</Badge>
                    )}
                    {it.suspended && (
                      <Input
                        className="h-6 text-[10px] w-48"
                        value={it.suspended_reason || ''}
                        onChange={e => update(it._key, 'suspended_reason', e.target.value)}
                        placeholder="Motivo (ej. diferido a próxima semana)"
                      />
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => update(it._key, 'suspended', !it.suspended)}
                    className={it.suspended ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-500 hover:bg-slate-100'}
                    title={it.suspended ? 'Reanudar bloqueo' : 'Suspender bloqueo (diferir / no cubrir esta semana)'}
                  >
                    {it.suspended ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => remove(it._key)} className="text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                </div>
                {itemErrors[it._key] && (
                  <div className="flex items-center gap-1.5 text-[11px] text-red-700 px-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{itemErrors[it._key]}</span>
                  </div>
                )}
                {!itemErrors[it._key] && itemWarnings[it._key] && (
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-700 px-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{itemWarnings[it._key]} (se permite guardar)</span>
                  </div>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={add} className="gap-1.5">
              <Plus className="h-4 w-4" /> Agregar bloqueo
            </Button>
          </div>
        )}

        {/* Especialistas externos */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500">Especialistas externos visitantes</h4>
          {visitors.length === 0 && (
            <p className="text-xs text-slate-400 italic">Sin visitantes. Ej: "Dra. Rissi · Pediatría", "Dr. Rubilar · Urgencia".</p>
          )}
          {visitors.map(v => (
            <div key={v._key} className="flex items-center gap-2">
              <Input
                className="h-8 flex-1"
                value={v.name || ''}
                onChange={e => updateVisitor(v._key, 'name', e.target.value)}
                placeholder="Nombre (ej. Dra. Rissi)"
              />
              <Input
                className="h-8 flex-1"
                value={v.specialty || ''}
                onChange={e => updateVisitor(v._key, 'specialty', e.target.value)}
                placeholder="Especialidad (ej. Pediatría)"
              />
              <Button variant="ghost" size="sm" onClick={() => removeVisitor(v._key)} className="text-red-600 hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addVisitor} className="gap-1.5">
            <Plus className="h-4 w-4" /> Agregar visitante externo
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save} disabled={hasErrors} title={hasErrors ? 'Corregí los bloqueos con error antes de guardar' : ''}>
            Guardar cambios{hasErrors && ' (corregir errores)'}
          </Button>
        </DialogFooter>
        <datalist id="sdm-block-suggestions">
          {blockSuggestions.map(s => <option key={s.key} value={s.value} />)}
        </datalist>
      </DialogContent>
    </Dialog>
  );
}
