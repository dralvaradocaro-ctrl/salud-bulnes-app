import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, X } from 'lucide-react';

/**
 * Modal para editar la celda BLOQUEOS de un día.
 * Recibe `bloqueos` actuales y devuelve `onSave(nuevosBloqueos)`.
 * Cada bloqueo: { block_id, name, from, to, doctor_id, category, source }
 */
export default function CellEditor({ open, onOpenChange, day, bloqueos, doctors, onSave }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (open) setItems(bloqueos.map((b, i) => ({ ...b, _key: `${b.block_id}-${i}` })));
  }, [open, bloqueos]);

  const update = (key, field, value) => {
    setItems(items.map(it => it._key === key ? { ...it, [field]: value } : it));
  };

  const remove = (key) => setItems(items.filter(it => it._key !== key));

  const add = () => setItems([
    ...items,
    {
      _key: `new-${Date.now()}`,
      block_id: `oneoff-${Date.now()}`,
      name: '',
      from: '',
      to: '',
      doctor_id: null,
      category: 'otro',
      source: 'manual',
    },
  ]);

  const save = () => {
    // Quitar _key antes de devolver
    const cleaned = items
      .filter(it => it.name && it.name.trim())
      .map(({ _key, ...rest }) => ({
        ...rest,
        unassigned: !rest.doctor_id,
      }));
    onSave(cleaned);
    onOpenChange(false);
  };

  if (!day) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar bloqueos · {day.label} {day.date}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {items.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-6">Sin bloqueos. Clickeá "+ Agregar" para crear uno.</p>
          )}
          {items.map(it => (
            <div key={it._key} className="flex items-start gap-2 p-2 border border-slate-200 rounded-lg">
              <div className="flex-1 grid grid-cols-12 gap-2">
                <div className="col-span-5">
                  <label className="text-[10px] uppercase tracking-wide text-slate-500">Programa / Descripción</label>
                  <Input
                    className="h-8"
                    value={it.name || ''}
                    onChange={e => update(it._key, 'name', e.target.value)}
                    placeholder="ej. Reunión adicional"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] uppercase tracking-wide text-slate-500">Desde</label>
                  <Input
                    className="h-8"
                    type="time"
                    value={it.from || ''}
                    onChange={e => update(it._key, 'from', e.target.value)}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-[10px] uppercase tracking-wide text-slate-500">Hasta</label>
                  <Input
                    className="h-8"
                    type="time"
                    value={it.to || ''}
                    onChange={e => update(it._key, 'to', e.target.value)}
                  />
                </div>
                <div className="col-span-3">
                  <label className="text-[10px] uppercase tracking-wide text-slate-500">Médico</label>
                  <Select value={it.doctor_id || ''} onValueChange={v => update(it._key, 'doctor_id', v === '__none__' ? null : v)}>
                    <SelectTrigger className={`h-8 ${!it.doctor_id && 'border-amber-300'}`}>
                      <SelectValue placeholder="Sin asignar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— Sin asignar —</SelectItem>
                      {doctors.map(d => <SelectItem key={d.id} value={d.id}>{d.display_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-12 flex gap-2 items-center">
                  <Badge variant="outline" className="text-[10px]">
                    {it.source === 'template' ? 'Del template' : it.source === 'monthly' ? 'Mensual' : it.source === 'oneoff' ? 'Puntual' : 'Manual'}
                  </Badge>
                  <Badge className="text-[10px] bg-slate-100 text-slate-700">{it.category || 'otro'}</Badge>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => remove(it._key)} className="text-red-600 hover:bg-red-50">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <Button variant="outline" size="sm" onClick={add} className="gap-1.5">
          <Plus className="h-4 w-4" /> Agregar bloqueo
        </Button>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={save}>Guardar cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
