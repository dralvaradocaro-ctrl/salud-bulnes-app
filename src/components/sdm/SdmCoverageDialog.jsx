import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, UserCheck, X } from 'lucide-react';

const SDM_TITULARES = ['alvarado', 'cordero', 'fasani'];
// Quienes pueden combinar turno + SDM (con bloque Urgencias de cobertura).
// Alvarado NO entra: si está en turno se considera no-disponible para SDM.
const TURNO_COVERS_SDM = new Set(['fasani', 'cordero']);

function statusForTitular(id, day) {
  const ausencia = (day?.ausencias || []).find(a => a.doctor_id === id);
  if (ausencia) return { kind: 'unavailable', reason: `ausencia (${ausencia.type})` };
  if ((day?.posturno || []).some(t => t.doctor_id === id)) return { kind: 'unavailable', reason: 'posturno' };
  if ((day?.turnos || []).some(t => t.doctor_id === id))   return { kind: 'turno', reason: 'turno de urgencias' };
  return { kind: 'free', reason: 'libre' };
}

/**
 * Modal que aparece al hacer click en el chip "Sin Subdirección Médica".
 * Muestra el estado de los 3 titulares ese día y ofrece alternativas:
 *  - Dejar a un titular libre (assign normal).
 *  - Forzar dejar a Fasani/Cordero en turno (combinación turno+SDM + bloque Urgencias).
 *  - Forzar dejar a Alvarado aunque la lógica automática lo descarte (override manual).
 *  - Mantener sin SDM.
 */
export default function SdmCoverageDialog({ open, onOpenChange, day, doctors, onAssign, onKeep }) {
  if (!day) return null;
  const doctorName = id => doctors.find(d => d.id === id)?.display_name || id?.toUpperCase();

  const states = SDM_TITULARES.map(id => ({ id, ...statusForTitular(id, day) }));

  const buildOptions = () => {
    const opts = [];
    states.forEach(s => {
      if (s.kind === 'free') {
        opts.push({
          key: `free-${s.id}`,
          tone: 'emerald',
          title: `Dejar a ${doctorName(s.id)} en SDM`,
          subtitle: `${doctorName(s.id)} está libre ese día — asignación directa, sin bloque Urgencias extra.`,
          action: () => onAssign({ doctor_id: s.id, addUrgenciasCover: false }),
        });
      } else if (s.kind === 'turno' && TURNO_COVERS_SDM.has(s.id)) {
        opts.push({
          key: `turno-${s.id}`,
          tone: 'amber',
          title: `Dejar a ${doctorName(s.id)} en SDM (sigue en turno)`,
          subtitle: `${doctorName(s.id)} está de turno; queda en TURNOS y de 08:00 a 17:00 cubre SDM. Se agrega bloque "Urgencias (cubre a ${doctorName(s.id)} en SDM)" con otro médico.`,
          action: () => onAssign({ doctor_id: s.id, addUrgenciasCover: true }),
        });
      } else if (s.kind === 'turno' && !TURNO_COVERS_SDM.has(s.id)) {
        opts.push({
          key: `force-${s.id}`,
          tone: 'rose',
          title: `Forzar ${doctorName(s.id)} en SDM (override manual)`,
          subtitle: `${doctorName(s.id)} está de turno y por regla NO asume SDM, pero podés forzarlo. Se agrega bloque Urgencias con otro médico. Confirmá que es lo que querés.`,
          action: () => onAssign({ doctor_id: s.id, addUrgenciasCover: true, forced: true }),
        });
      }
    });
    return opts;
  };
  const options = buildOptions();

  const toneClasses = {
    emerald: 'border-emerald-300 bg-emerald-50',
    amber:   'border-amber-300 bg-amber-50',
    rose:    'border-rose-300 bg-rose-50',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Sin Subdirección Médica — {day.label} {day.date}
          </DialogTitle>
        </DialogHeader>

        <div className="text-xs text-slate-600 bg-slate-50 rounded-lg p-3 space-y-1">
          <p className="font-semibold text-slate-800">Estado de los titulares ese día</p>
          {states.map(s => (
            <div key={s.id} className="flex items-center justify-between">
              <span className="text-slate-700">{doctorName(s.id)}</span>
              <span className={`text-[10px] uppercase tracking-wide font-bold ${
                s.kind === 'free' ? 'text-emerald-700' :
                s.kind === 'turno' ? 'text-amber-700' :
                'text-rose-700'
              }`}>{s.reason}</span>
            </div>
          ))}
        </div>

        {options.length === 0 ? (
          <p className="text-sm text-slate-500 italic py-4 text-center">
            Ningún titular está en una situación que permita asumir SDM (todos en posturno/ausencia).
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-700">Alternativas</p>
            {options.map(opt => (
              <div key={opt.key} className={`rounded-lg border p-3 ${toneClasses[opt.tone]}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{opt.title}</p>
                    <p className="text-[11px] text-slate-700 mt-1 leading-relaxed">{opt.subtitle}</p>
                  </div>
                  <Button size="sm" onClick={() => { opt.action(); onOpenChange(false); }} className="gap-1 shrink-0">
                    <UserCheck className="h-3.5 w-3.5" /> Aplicar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter className="flex !justify-between items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => { onKeep(); onOpenChange(false); }} className="gap-1.5 text-slate-600">
            <X className="h-3.5 w-3.5" /> Mantener sin SDM
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
