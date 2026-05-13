import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, History, UserCircle2 } from 'lucide-react';
import { fetchSdmHistory } from './lib/sdmEditHistory';

function relativeTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const diffMs = Date.now() - d.getTime();
  const m = Math.floor(diffMs / 60000);
  if (m < 1) return 'recién';
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const days = Math.floor(h / 24);
  if (days < 30) return `hace ${days} día${days > 1 ? 's' : ''}`;
  return d.toLocaleDateString('es-CL');
}

function fullStamp(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
}

export default function SdmHistoryDialog({ open, onOpenChange, weekStart }) {
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    if (!open || !weekStart) return;
    let alive = true;
    setLoading(true);
    fetchSdmHistory(weekStart).then(({ data }) => {
      if (!alive) return;
      setEntries(data || []);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [open, weekStart]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-slate-600" />
            Historial de modificaciones — Semana del {weekStart}
          </DialogTitle>
        </DialogHeader>
        {loading && (
          <div className="flex items-center justify-center py-10 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Cargando…
          </div>
        )}
        {!loading && entries.length === 0 && (
          <p className="text-sm text-slate-500 italic py-6 text-center">
            Aún no hay ediciones registradas para esta semana.
          </p>
        )}
        {!loading && entries.length > 0 && (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {entries.map(e => (
              <div key={e.id} className="rounded-lg border border-slate-200 p-3 bg-slate-50">
                <div className="flex items-center gap-2 mb-1">
                  <UserCircle2 className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-semibold text-slate-800">{e.editor_name}</span>
                  <span className="text-xs text-slate-500" title={fullStamp(e.created_at)}>· {relativeTime(e.created_at)}</span>
                </div>
                <p className="text-sm text-slate-700 leading-snug">{e.summary}</p>
                <p className="text-[10px] text-slate-400 mt-1">{fullStamp(e.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
