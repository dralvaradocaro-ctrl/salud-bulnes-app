import { useMemo } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Printer, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HOSPITAL_LAB_FIELDS } from './hospitalLabCatalog';

const DEFINITIONS = HOSPITAL_LAB_FIELDS;
const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
const formatDate = value => {
  const match = String(value || '').slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : String(value || '');
};

function normalizeRows(rows) {
  return (rows || []).map(row => ({
    ...row,
    blancos: row.blancos || row.leucocitos || row.gb || row.GB || row.leu || row.wbc || '',
    fecha: String(row.fecha || row.collectedAt || '').slice(0, 10),
  }))
    .filter(row => row.fecha && DEFINITIONS.some(([key]) => row[key] !== '' && row[key] != null))
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

function printableHtml(rows, patient, bed) {
  const exams = DEFINITIONS.filter(([key]) => rows.some(row => row[key] !== '' && row[key] != null));
  const tableRows = exams.map(([key, name, unit]) => `<tr><th>${escapeHtml(name)}${unit ? `<br><small>${escapeHtml(unit)}</small>` : ''}</th>${rows.map(row => `<td>${escapeHtml(row[key] ?? '—')}</td>`).join('')}</tr>`).join('');
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Curva de exámenes</title><style>@page{size:A4 landscape;margin:12mm}*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#0f172a;margin:0;font-size:10px}header{display:flex;align-items:center;gap:14px;border-bottom:2px solid #0f172a;padding-bottom:8px;margin-bottom:14px}header img{width:65px;height:50px;object-fit:contain}h1{font-size:18px;margin:0}p{margin:3px 0}.identity{margin-left:auto;text-align:right}.table-wrap{width:100%;overflow:hidden}table{width:100%;border-collapse:collapse;table-layout:fixed}th,td{border:1px solid #64748b;padding:6px;text-align:center;overflow-wrap:anywhere}thead th{background:#dbe4ef}thead th:first-child{width:145px}tbody th{background:#f1f5f9;text-align:left;width:145px}.observations{margin-top:18px;border:1px solid #94a3b8;min-height:95px;padding:8px}.footer{position:fixed;bottom:0;left:0;right:0;border-top:1px solid #94a3b8;padding-top:5px;color:#64748b;font-size:8px}</style></head><body><header><img src="${location.origin}/logo-hospital.png"><div><h1>Curva de exámenes</h1><p>Hospital Comunitario de Salud Familiar de Bulnes</p></div><div class="identity"><b>${escapeHtml(patient?.nombre || 'Paciente')}</b><p>${escapeHtml(patient?.rut || '')}</p><p>${escapeHtml(bed?.serviceShort || '')} · Cama ${escapeHtml(bed?.cell || '')}</p></div></header><div class="table-wrap"><table><thead><tr><th>Examen / fecha</th>${rows.map(row => `<th>${escapeHtml(formatDate(row.fecha))}</th>`).join('')}</tr></thead><tbody>${tableRows}</tbody></table></div><div class="observations"><b>Observaciones:</b></div><div class="footer">Curva de exámenes · Impreso ${new Date().toLocaleString('es-CL')}</div><script>window.addEventListener('load',()=>setTimeout(()=>window.print(),250));<\/script></body></html>`;
}

export default function HospitalLabCurvePreview({ open, rows, patient, bed, loading, onClose, onDeleteDate, onDeleteResult, embedded = false }) {
  const normalized = useMemo(() => normalizeRows(rows), [rows]);
  const available = useMemo(() => DEFINITIONS.filter(([key]) => normalized.some(row => row[key] !== '' && row[key] != null)), [normalized]);
  if (!open) return null;
  const print = () => window.print();
  return <div className={embedded ? 'contents' : 'fixed inset-0 z-[99] flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-sm'} role={embedded ? undefined : 'dialog'} aria-modal={embedded ? undefined : 'true'} aria-label="Vista previa de curva de exámenes">
    <div className={embedded ? 'flex min-h-0 flex-1 flex-col overflow-hidden bg-white' : 'flex h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl'}>
      {!embedded && <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4"><div><h2 className="text-lg font-black text-slate-950">Vista previa — Curva de exámenes</h2><p className="text-xs text-slate-500">{patient?.nombre || 'Paciente'} · {bed?.serviceShort} · Cama {bed?.cell}</p></div><Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar"><X className="h-5 w-5" /></Button></header>}
      <div className="min-h-0 flex-1 overflow-auto bg-slate-200 p-5">
        <div className="hospital-lab-print-page mx-auto min-h-[760px] max-w-[1120px] bg-white p-8 font-[Arial] shadow-xl">
          <div className="mb-5 flex items-center gap-4 border-b-2 border-slate-900 pb-3"><img src="/logo-hospital.png" alt="Logo Hospital de Bulnes" className="h-14 w-20 object-contain" /><div><h1 className="text-xl font-black">Curva de exámenes</h1><p className="text-xs text-slate-600">Hospital Comunitario de Salud Familiar de Bulnes</p></div><div className="ml-auto text-right text-xs"><b>{patient?.nombre || 'Paciente'}</b><p>{patient?.rut}</p><p>{bed?.serviceShort} · Cama {bed?.cell}</p></div></div>
          {loading ? <p className="py-24 text-center text-sm text-slate-500">Cargando resultados del paciente…</p> : normalized.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 p-16 text-center"><p className="font-bold text-slate-700">Sin resultados seriados disponibles</p><p className="mt-1 text-xs text-slate-500">Agrega controles de laboratorio desde la ficha o desde Curva de exámenes.</p></div> : <><div className="overflow-x-auto"><table className="w-full min-w-max table-fixed border-collapse text-center text-xs"><thead><tr><th className="sticky left-0 z-10 w-40 border border-slate-400 bg-slate-200 p-2">Examen / fecha</th>{normalized.map((row, index) => <th key={`${row.fecha}-${index}`} className="min-w-28 border border-slate-400 bg-slate-200 p-2"><span>{formatDate(row.fecha)}</span>{onDeleteDate && <button type="button" onClick={() => onDeleteDate(row.fecha)} className="mx-auto mt-1 flex items-center gap-1 rounded px-2 py-1 text-[9px] font-bold text-red-600 hover:bg-red-50" aria-label={`Eliminar exámenes del ${formatDate(row.fecha)}`}><Trash2 className="h-3 w-3" />Eliminar fecha</button>}</th>)}</tr></thead><tbody>{available.map(([key, name, unit]) => <tr key={key}><th className="sticky left-0 z-10 border border-slate-300 bg-slate-100 p-2 text-left">{name}<span className="block text-[9px] font-normal text-slate-500">{unit}</span></th>{normalized.map((row, index) => <td key={`${key}-${row.fecha}-${index}`} className="border border-slate-300 p-2">{row[key] ?? '—'}{onDeleteResult && row[key] !== '' && row[key] != null && <button type="button" onClick={() => onDeleteResult(row.fecha, key)} className="ml-2 inline-flex rounded p-1 text-red-500 hover:bg-red-50" aria-label={`Eliminar ${name} del ${formatDate(row.fecha)}`} title="Eliminar este resultado"><Trash2 className="h-3 w-3" /></button>}</td>)}</tr>)}</tbody></table></div><div className="mt-6 grid gap-4 md:grid-cols-2">{available.map(([key, name, unit]) => { const data = normalized.filter(row => row[key] !== '' && row[key] != null && Number.isFinite(Number(String(row[key]).replace(',', '.')))).map(row => ({ fecha: formatDate(row.fecha), valor: Number(String(row[key]).replace(',', '.')) })); return <section key={key} className="rounded-lg border border-slate-200 p-3"><h3 className="text-xs font-black">{name} <span className="font-normal text-slate-500">({unit})</span></h3><div className="h-36">{data.length ? <ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 12, right: 16, left: -18, bottom: 0 }}><XAxis dataKey="fecha" tick={{ fontSize: 9 }} /><YAxis tick={{ fontSize: 9 }} /><Tooltip /><Line type="monotone" dataKey="valor" stroke="#0f766e" strokeWidth={2.5} dot /></LineChart></ResponsiveContainer> : <p className="pt-12 text-center text-xs text-slate-400">Sin valores numéricos</p>}</div></section>; })}</div></>}
        </div>
      </div>
      <footer className="flex justify-end gap-2 border-t border-slate-200 bg-white px-5 py-3">{!embedded && <Button variant="outline" onClick={onClose}>Cerrar</Button>}<Button onClick={print} disabled={loading || normalized.length === 0} className="gap-2 bg-teal-700 hover:bg-teal-800"><Printer className="h-4 w-4" />Imprimir curva</Button></footer>
      <style>{`@media print{@page{size:A4 landscape;margin:8mm}body *{visibility:hidden!important}.hospital-lab-print-page,.hospital-lab-print-page *{visibility:visible!important}.hospital-lab-print-page{position:absolute!important;left:0!important;top:0!important;width:100%!important;max-width:none!important;min-height:0!important;padding:0!important;box-shadow:none!important}.hospital-lab-print-page button{display:none!important}.hospital-lab-print-page section{break-inside:avoid;page-break-inside:avoid}}`}</style>
    </div>
  </div>;
}
