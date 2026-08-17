import { useMemo } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Printer, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DEFINITIONS = [
  ['pcr', 'PCR', 'mg/L'], ['pct', 'Procalcitonina', 'ng/mL'], ['blancos', 'Leucocitos', '/mm³'],
  ['crea', 'Creatinina', 'mg/dL'], ['vhs', 'VHS', 'mm/h'], ['temp', 'Temperatura', '°C'],
];
const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
const formatDate = value => {
  const match = String(value || '').slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : String(value || '');
};

function normalizeRows(rows) {
  return (rows || []).map(row => ({ ...row, blancos: row.blancos ?? row.leucocitos ?? '', fecha: String(row.fecha || row.collectedAt || '').slice(0, 10) }))
    .filter(row => row.fecha && DEFINITIONS.some(([key]) => row[key] !== '' && row[key] != null))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

function printableHtml(rows, patient, bed) {
  const exams = DEFINITIONS.filter(([key]) => rows.some(row => row[key] !== '' && row[key] != null));
  const tableRows = rows.map(row => `<tr><td>${escapeHtml(formatDate(row.fecha))}</td>${exams.map(([key]) => `<td>${escapeHtml(row[key] ?? '—')}</td>`).join('')}</tr>`).join('');
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Curva de exámenes</title><style>@page{size:A4 landscape;margin:12mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#0f172a;margin:0;font-size:10px}header{display:flex;align-items:center;gap:14px;border-bottom:2px solid #0f172a;padding-bottom:8px;margin-bottom:14px}header img{width:65px;height:50px;object-fit:contain}h1{font-size:18px;margin:0}p{margin:3px 0}.identity{margin-left:auto;text-align:right}table{width:100%;border-collapse:collapse;table-layout:fixed}th,td{border:1px solid #64748b;padding:6px;text-align:center}th{background:#e2e8f0}.observations{margin-top:18px;border:1px solid #94a3b8;min-height:95px;padding:8px}.footer{position:fixed;bottom:0;left:0;right:0;border-top:1px solid #94a3b8;padding-top:5px;color:#64748b;font-size:8px}</style></head><body><header><img src="${location.origin}/logo-hospital.png"><div><h1>Curva de exámenes</h1><p>Hospital Comunitario de Salud Familiar de Bulnes</p></div><div class="identity"><b>${escapeHtml(patient?.nombre || 'Paciente')}</b><p>${escapeHtml(patient?.rut || '')}</p><p>${escapeHtml(bed?.serviceShort || '')} · Cama ${escapeHtml(bed?.cell || '')}</p></div></header><table><thead><tr><th>Fecha</th>${exams.map(([, name, unit]) => `<th>${escapeHtml(name)}<br><small>${escapeHtml(unit)}</small></th>`).join('')}</tr></thead><tbody>${tableRows}</tbody></table><div class="observations"><b>Observaciones:</b></div><div class="footer">Curva de exámenes · Impreso ${new Date().toLocaleString('es-CL')}</div><script>window.addEventListener('load',()=>setTimeout(()=>window.print(),250));<\/script></body></html>`;
}

export default function HospitalLabCurvePreview({ open, rows, patient, bed, loading, onClose }) {
  const normalized = useMemo(() => normalizeRows(rows), [rows]);
  const available = useMemo(() => DEFINITIONS.filter(([key]) => normalized.some(row => row[key] !== '' && row[key] != null)), [normalized]);
  if (!open) return null;
  const print = () => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.opener = null;
    win.document.write(printableHtml(normalized, patient, bed));
    win.document.close();
  };
  return <div className="fixed inset-0 z-[99] flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Vista previa de curva de exámenes">
    <div className="flex h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4"><div><h2 className="text-lg font-black text-slate-950">Vista previa — Curva de exámenes</h2><p className="text-xs text-slate-500">{patient?.nombre || 'Paciente'} · {bed?.serviceShort} · Cama {bed?.cell}</p></div><Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar"><X className="h-5 w-5" /></Button></header>
      <div className="min-h-0 flex-1 overflow-auto bg-slate-200 p-5">
        <div className="mx-auto min-h-[760px] max-w-[1120px] bg-white p-8 font-[Arial] shadow-xl">
          <div className="mb-5 flex items-center gap-4 border-b-2 border-slate-900 pb-3"><img src="/logo-hospital.png" alt="Logo Hospital de Bulnes" className="h-14 w-20 object-contain" /><div><h1 className="text-xl font-black">Curva de exámenes</h1><p className="text-xs text-slate-600">Hospital Comunitario de Salud Familiar de Bulnes</p></div><div className="ml-auto text-right text-xs"><b>{patient?.nombre || 'Paciente'}</b><p>{patient?.rut}</p><p>{bed?.serviceShort} · Cama {bed?.cell}</p></div></div>
          {loading ? <p className="py-24 text-center text-sm text-slate-500">Cargando resultados del paciente…</p> : normalized.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 p-16 text-center"><p className="font-bold text-slate-700">Sin resultados seriados disponibles</p><p className="mt-1 text-xs text-slate-500">Agrega controles de laboratorio desde la ficha o desde Curva de exámenes.</p></div> : <><div className="overflow-x-auto"><table className="w-full border-collapse text-center text-xs"><thead><tr><th className="border border-slate-400 bg-slate-200 p-2">Fecha</th>{available.map(([key, name, unit]) => <th key={key} className="border border-slate-400 bg-slate-200 p-2">{name}<span className="block text-[9px] font-normal">{unit}</span></th>)}</tr></thead><tbody>{normalized.map((row, index) => <tr key={`${row.fecha}-${index}`}><td className="border border-slate-300 p-2 font-bold">{formatDate(row.fecha)}</td>{available.map(([key]) => <td key={key} className="border border-slate-300 p-2">{row[key] ?? '—'}</td>)}</tr>)}</tbody></table></div><div className="mt-6 grid gap-4 md:grid-cols-2">{available.map(([key, name, unit]) => { const data = normalized.filter(row => row[key] !== '' && row[key] != null && Number.isFinite(Number(String(row[key]).replace(',', '.')))).map(row => ({ fecha: formatDate(row.fecha), valor: Number(String(row[key]).replace(',', '.')) })); return <section key={key} className="rounded-lg border border-slate-200 p-3"><h3 className="text-xs font-black">{name} <span className="font-normal text-slate-500">({unit})</span></h3><div className="h-36">{data.length ? <ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 12, right: 16, left: -18, bottom: 0 }}><XAxis dataKey="fecha" tick={{ fontSize: 9 }} /><YAxis tick={{ fontSize: 9 }} /><Tooltip /><Line type="monotone" dataKey="valor" stroke="#0f766e" strokeWidth={2.5} dot /></LineChart></ResponsiveContainer> : <p className="pt-12 text-center text-xs text-slate-400">Sin valores numéricos</p>}</div></section>; })}</div></>}
        </div>
      </div>
      <footer className="flex justify-end gap-2 border-t border-slate-200 bg-white px-5 py-3"><Button variant="outline" onClick={onClose}>Cerrar</Button><Button onClick={print} disabled={loading || normalized.length === 0} className="gap-2 bg-teal-700 hover:bg-teal-800"><Printer className="h-4 w-4" />Imprimir curva</Button></footer>
    </div>
  </div>;
}
