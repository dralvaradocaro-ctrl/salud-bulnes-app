import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, RefreshCw, ArrowRight } from 'lucide-react';
import { suggestFixForError } from './lib/aiAssistant';

/**
 * Modal de sugerencias IA para corregir un error/warning del validator.
 * Recibe el error + agenda + doctors. Carga sugerencias on-mount.
 * Cada opción tiene un botón "Aplicar". El parent recibe la opción aplicada
 * vía onApply(option) y decide cómo mutar el estado.
 */
export default function AIFixModal({ open, onOpenChange, error, agenda, doctors, blockTemplates = [], onApply }) {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState(null);
  const [errMsg, setErrMsg] = useState(null);

  const doctorName = (id) => doctors.find(d => d.id === id)?.display_name || id;

  async function fetchSuggestions() {
    setLoading(true);
    setErrMsg(null);
    setOptions(null);
    try {
      const res = await suggestFixForError(error, agenda, doctors, blockTemplates);
      setOptions(Array.isArray(res?.options) ? res.options : []);
    } catch (e) {
      setErrMsg(e.message || 'Error consultando IA');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open && error) fetchSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, error?.blockId, error?.date, error?.kind]);

  if (!error) return null;

  const labelForAction = (opt) => {
    if (opt.action === 'assign') return `Asignar a ${doctorName(opt.doctor_id)}`;
    if (opt.action === 'add') return `Agregar el ${opt.swap_with_day}`;
    if (opt.action === 'swap') return `Mover al ${opt.swap_with_day}`;
    if (opt.action === 'suspend') return 'Suspender (diferir a próxima semana)';
    return opt.action;
  };

  const colorForAction = (action) => ({
    assign: 'border-emerald-300 bg-emerald-50',
    add: 'border-emerald-300 bg-emerald-50',
    swap: 'border-amber-300 bg-amber-50',
    suspend: 'border-slate-300 bg-slate-50',
  }[action] || 'border-slate-200 bg-white');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-violet-600" />
            Sugerencias IA — {error.label} {error.date}
          </DialogTitle>
        </DialogHeader>

        <div className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">
          <span className="font-semibold">Problema:</span> {error.message}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-sm">Consultando IA…</span>
          </div>
        )}

        {errMsg && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {errMsg}
          </div>
        )}

        {!loading && options && options.length === 0 && (
          <p className="text-sm text-slate-500 italic py-6 text-center">La IA no pudo proponer opciones.</p>
        )}

        {!loading && options && options.length > 0 && (
          <div className="space-y-2.5 max-h-[50vh] overflow-y-auto">
            {options.map((opt, i) => (
              <div key={i} className={`rounded-lg border p-3 ${colorForAction(opt.action)}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Opción {i + 1}</span>
                      <span className="text-sm font-semibold text-slate-900">{labelForAction(opt)}</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">{opt.reasoning}</p>
                    {opt.side_effects && (
                      <p className="text-[11px] text-amber-800 mt-1.5 italic">
                        <span className="font-semibold">Considerá:</span> {opt.side_effects}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => { onApply(opt); onOpenChange(false); }}
                    className="gap-1 shrink-0"
                  >
                    Aplicar <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter className="flex !justify-between items-center gap-2">
          <Button variant="ghost" size="sm" onClick={fetchSuggestions} disabled={loading} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Refrescar sugerencias
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
