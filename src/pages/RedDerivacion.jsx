import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, ExternalLink, ArrowLeft } from 'lucide-react';
import { networkContacts } from '@/data/clinicalResources';
const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export default function RedDerivacion() {
  const [search, setSearch] = useState('');
  const contacts = networkContacts.filter(item => normalize(`${item.name} ${item.purpose}`).includes(normalize(search)));
  return <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
    <Link to="/OperacionClinica" className="inline-flex items-center gap-2 text-blue-700"><ArrowLeft className="h-4 w-4" />Herramientas de trabajo</Link>
    <header><h1 className="text-2xl font-bold text-slate-900">Red de Ñuble · contactos y derivación</h1><p className="mt-2 text-slate-600">Teléfonos públicos con fuente. Consulta web: 22/09/2026; los anexos internos y la disponibilidad de recepción requieren confirmación con la red.</p></header>
    <section className="rounded-xl border border-blue-200 bg-blue-50 p-5"><h2 className="font-bold text-blue-900">Cuándo y cómo derivar</h2><p className="mt-2 text-sm text-blue-900">Para necesidad de mayor complejidad, consulta el procedimiento local, los roles del equipo, el móvil según gravedad y los documentos que deben acompañar al paciente.</p><Link className="mt-3 inline-block font-semibold text-blue-700 underline" to="/TopicDetail?id=5285fd58-39ea-4faa-9139-e38f2c1faab3">Abrir protocolo de derivación HCSFB</Link><ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700"><li>Adulto, pediatría y gineco-obstetricia: coordinación con el equipo receptor correspondiente según el protocolo local.</li><li>Riesgo vital o inestabilidad: coordinación con regulación SAMU según procedimiento de traslado.</li><li>Derivaciones programadas por especialidad: criterios y anexos directos pendientes del documento vigente de referencia/contrarreferencia.</li></ul></section>
    <label className="block text-sm font-semibold text-slate-700">Buscar establecimiento o servicio<input className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3" value={search} onChange={e => setSearch(e.target.value)} /></label>
    <div className="grid gap-4 md:grid-cols-2">{contacts.map(item => <article key={item.id} className="space-y-3 rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-bold text-slate-900">{item.name}</h2><p className="text-sm font-semibold text-slate-600">{item.purpose}</p><a className="inline-flex items-center gap-2 text-lg font-bold text-blue-700" href={`tel:${item.dial}`}><Phone className="h-4 w-4" />{item.phone}</a><p className="text-sm text-slate-600">{item.note}</p><a href={item.source} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-700 underline">Fuente oficial · consultada {item.checked}<ExternalLink className="h-3 w-3" /></a></article>)}</div>
    {!contacts.length && <p className="text-slate-600">Sin contactos para esa búsqueda.</p>}
  </div>;
}
