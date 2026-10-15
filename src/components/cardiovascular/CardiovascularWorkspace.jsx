import { useState, lazy, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { HeartPulse, Plus, ExternalLink, Pencil, CalendarDays, ListChecks, Users, Pill, BookOpen, ArrowRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { legacyClinicalBlocks } from '@/lib/protocolContent';
import { filterLocallyAvailableMedications } from '@/lib/localArsenal';
import { resources, rosterGroups, safeResourceUrl, calendarDays, normalize } from './resources';
import useWorkspace from './useWorkspace';

const ProtocolView = lazy(() => import('@/components/topic/ResponsiveTopicLayout'));
const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const field = 'w-full rounded-lg border border-slate-300 bg-white p-2 text-sm';
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const blank = (kind, extra = {}) => ({ kind, title: '', details: '', item_date: '', item_time: '', category: '', url: '', reference_id: '', done: false, archived: false, ...extra });

function Panel({ id, title, icon: Icon, children, action, className = '' }) {
  return <section id={`pscv-${id}`} className={`min-w-0 scroll-mt-28 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
    <div className="mb-4 flex items-center justify-between gap-3"><h3 className="flex items-center gap-2 font-bold text-slate-900"><Icon className="h-5 w-5 text-teal-700" />{title}</h3>{action}</div>{children}
  </section>;
}
function OutLink({ url, children }) {
  const safe = safeResourceUrl(url);
  return safe ? <a href={safe} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-teal-800 underline">{children}<ExternalLink className="h-3 w-3" /></a> : <span className="text-sm text-slate-500">Enlace no válido</span>;
}
function ProtocolPreview({ resource, linked, onAttach, canEdit }) {
  const query = useQuery({
    queryKey: ['pscv-protocol', resource.id], enabled: !!resource.id,
    queryFn: async () => {
      const { data, error } = await supabase.from('topics').select('*').eq('id', resource.id).single();
      if (error) throw error;
      return data;
    },
  });
  const topic = query.data;
  const blocks = topic?.content_blocks?.length ? topic.content_blocks : legacyClinicalBlocks(topic || {});
  return <div>
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h4 className="font-semibold">{resource.label}</h4>{resource.id && <Link to={`/TopicDetail?id=${resource.id}`} className="text-sm text-teal-700 underline">Abrir ficha completa</Link>}</div>
    {resource.id ? query.isPending ? <p>Cargando contenido de la base…</p> : query.isError ? <p role="alert">No se pudo cargar el protocolo. <button className="underline" onClick={() => query.refetch()}>Reintentar</button></p> : blocks.length ? <div className="max-h-[34rem] overflow-auto rounded-xl border p-3"><Suspense fallback={<p>Cargando vista…</p>}><ProtocolView key={resource.key} blocks={blocks} /></Suspense></div> : <p className="text-sm text-slate-500">La ficha no contiene bloques para esta vista. Consulta la ficha completa.</p> : <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">{linked.length ? 'Documentos incorporados por el equipo; revisar versión y vigencia en la fuente.' : 'Documento local pendiente de incorporación.'}<div className="mt-3 space-y-2">{linked.map(item => <div key={item.id}><OutLink url={item.url}>{item.title}</OutLink><p>{item.details}</p></div>)}</div><Button className="mt-3" variant="outline" disabled={!canEdit} onClick={() => onAttach(resource.key)}>Incorporar documento</Button></div>}
  </div>;
}

export default function CardiovascularWorkspace() {
  const workspace = useWorkspace();
  const [selected, setSelected] = useState('retina');
  const [quickOpen, setQuickOpen] = useState(false);
  const [editor, setEditor] = useState(null);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [loginMessage, setLoginMessage] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [taskFilter, setTaskFilter] = useState('pending');
  const [rosterFilter, setRosterFilter] = useState('Todos');
  const [drugSearch, setDrugSearch] = useState('');
  const [drugMode, setDrugMode] = useState('program');
  const [showArchived, setShowArchived] = useState(false);
  const canEdit = !!workspace.member.data && !workspace.isError && !workspace.isPending;
  const records = workspace.items.filter(item => item.archived === showArchived);
  const tasks = records.filter(item => item.kind === 'task');
  const events = records.filter(item => item.kind === 'event').sort((a, b) => `${a.item_date}${a.item_time || ''}`.localeCompare(`${b.item_date}${b.item_time || ''}`));
  const rosters = records.filter(item => item.kind === 'roster');
  const pending = tasks.filter(item => !item.done);
  const active = resources.find(item => item.key === selected) || resources[0];
  const medications = useQuery({
    queryKey: ['pscv-arsenal'], queryFn: async () => {
      const { data, error } = await supabase.from('medications').select('id,name,active_ingredient,presentation,category,restrictions,is_active').eq('is_active', true).order('name');
      if (error) throw error;
      return filterLocallyAvailableMedications(data);
    },
  });
  const selectedDrugs = workspace.items.filter(item => item.kind === 'medication' && !item.archived);
  const drugs = (medications.data || []).filter(med => (drugMode === 'catalog' || selectedDrugs.some(item => item.reference_id === med.id)) && normalize(`${med.name} ${med.active_ingredient} ${med.category}`).includes(normalize(drugSearch)));
  const openEditor = item => { setError(''); setEditor(item); };
  const add = (kind, extra = {}) => openEditor(blank(kind, extra));
  const update = async (item, patch) => {
    setError('');
    try { await workspace.save({ id: item.id, version: item.version, ...patch }); } catch (err) { setError(err.message); }
  };
  const saveEditor = async event => {
    event.preventDefault(); setError('');
    if (['roster', 'resource'].includes(editor.kind) && !safeResourceUrl(editor.url)) { setError('Introduce un enlace HTTPS válido.'); return; }
    const payload = Object.fromEntries(['id', 'version', 'kind', 'title', 'details', 'item_date', 'item_time', 'category', 'url', 'reference_id', 'done', 'archived'].filter(key => editor[key] !== undefined).map(key => [key, ['item_date', 'item_time'].includes(key) ? editor[key] || null : typeof editor[key] === 'string' ? editor[key].trim() : editor[key]]));
    if (!payload.title) { setError('El título es obligatorio.'); return; }
    try { await workspace.save(payload); setEditor(null); } catch (err) { setError(err.message); }
  };
  const login = async event => {
    event.preventDefault(); setLoginBusy(true); setLoginMessage('');
    const { error: authError } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo: window.location.href } });
    setLoginMessage(authError ? 'No se pudo enviar el acceso. Confirma tu cuenta con administración.' : 'Revisa tu correo para acceder. Debes pertenecer al equipo PSCV.'); setLoginBusy(false);
  };
  const editButton = item => <button type="button" disabled={!canEdit || workspace.saving} onClick={() => openEditor(item)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-40" aria-label={`Editar ${item.title}`}><Pencil className="h-4 w-4" /></button>;
  const addButton = (kind, extra) => <Button size="sm" variant="outline" disabled={!canEdit || showArchived} onClick={() => add(kind, extra)}><Plus className="mr-1 h-4 w-4" />Añadir</Button>;
  return <div className="space-y-5">
    <header className="rounded-2xl bg-teal-900 p-6 text-white">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-widest text-teal-200">Policlínico / Gestiones</p><h1 className="mt-2 flex items-center gap-2 text-2xl font-bold"><HeartPulse className="shrink-0" />Programa de Salud Cardiovascular</h1><p className="mt-2 text-sm text-teal-100">Planificación del equipo, seguimiento de gestiones y consulta clínica en un mismo espacio.</p></div><Button variant="secondary" onClick={() => setQuickOpen(true)}>Accesos rápidos <ArrowRight className="ml-2 h-4 w-4" /></Button></div>
      <div className="mt-5 grid grid-cols-3 gap-3">{[[pending.length, 'Gestiones pendientes'], [events.filter(e => e.item_date?.startsWith(String(year))).length, `Actividades ${year}`], [rosters.length, 'Nóminas enlazadas']].map(([count, label]) => <div key={label} className="rounded-xl bg-white/10 p-3"><strong className="text-2xl">{canEdit ? count : '—'}</strong><p className="text-xs text-teal-100">{label}</p></div>)}</div>
    </header>

    <div className="rounded-xl border bg-white p-4 text-sm">
      {!workspace.authReady ? <p>Comprobando acceso del equipo…</p> : !workspace.session ? <form onSubmit={login} className="flex flex-wrap items-center gap-3"><span>Accede para ver y editar el trabajo compartido.</span><Input className="w-64" type="email" required aria-label="Correo del equipo" placeholder="Correo del equipo" value={email} onChange={e => setEmail(e.target.value)} /><Button disabled={loginBusy}>Enviar acceso por correo</Button><p role="status">{loginMessage}</p></form> : workspace.member.isError || workspace.isError ? <p role="alert">No se pudo conectar el espacio compartido. Comprueba la configuración y los permisos de PSCV. Los cambios no se guardan localmente.</p> : workspace.member.isPending ? <p>Comprobando permisos…</p> : !workspace.member.data ? <p>Tu cuenta no tiene acceso al equipo PSCV. Solicita su incorporación a administración.</p> : workspace.isPending ? <p>Cargando agenda y gestiones compartidas…</p> : <div className="flex flex-wrap items-center gap-3"><span className="font-medium text-teal-700">Espacio compartido · actualización cada 15 segundos</span><Button size="sm" variant="ghost" onClick={workspace.refresh}><RefreshCw className="mr-1 h-4 w-4" />Actualizar</Button><label className="ml-auto flex items-center gap-2"><input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} />Ver archivados</label></div>}
      {workspace.session && <div className="mt-2 flex items-center gap-3 text-xs text-slate-500"><span>{workspace.session.user.email}</span><button className="underline" onClick={async () => { const { error: logoutError } = await supabase.auth.signOut({ scope: 'local' }); if (logoutError) setError('No se pudo cerrar la sesión. Intenta nuevamente.'); }}>Cerrar sesión PSCV</button></div>}
    </div>
    {error && !editor && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <Panel id="clinical" title="Flujos y protocolos integrados" icon={BookOpen}>
        <div className="mb-4 flex flex-wrap gap-2">{resources.map(resource => <button key={resource.key} onClick={() => setSelected(resource.key)} aria-pressed={selected === resource.key} className={`rounded-lg border px-3 py-2 text-xs font-medium ${selected === resource.key ? 'border-teal-700 bg-teal-700 text-white' : 'bg-slate-50 text-slate-700'}`}>{resource.label}</button>)}</div>
        <ProtocolPreview resource={active} linked={records.filter(item => item.kind === 'resource' && item.category === active.key)} onAttach={category => add('resource', { category })} canEdit={canEdit && !showArchived} />
        {records.filter(item => item.kind === 'resource' && item.category === active.key).map(item => <div key={item.id} className="mt-2 flex justify-between rounded-lg border p-2"><OutLink url={item.url}>{item.title}</OutLink>{editButton(item)}</div>)}
      </Panel>
      <div className="space-y-5">
        <Panel id="tasks" title="Gestiones pendientes" icon={ListChecks} action={addButton('task')}>
          <select aria-label="Filtrar gestiones" className={`${field} mb-3`} value={taskFilter} onChange={e => setTaskFilter(e.target.value)}><option value="pending">Pendientes</option><option value="done">Completadas</option><option value="all">Todas</option></select>
          <div className="max-h-80 space-y-2 overflow-auto">{tasks.filter(item => taskFilter === 'all' || item.done === (taskFilter === 'done')).map(item => <div key={item.id} className="flex items-start gap-3 rounded-xl border p-3"><input type="checkbox" className="mt-1" checked={item.done} disabled={!canEdit || workspace.saving || showArchived} aria-label={`Completar ${item.title}`} onChange={e => update(item, { done: e.target.checked })} /><div className="min-w-0 flex-1"><p className={item.done ? 'text-slate-500 line-through' : 'font-medium'}>{item.title}</p><p className="whitespace-pre-wrap text-xs text-slate-500">{item.details}</p>{item.item_date && <p className={`mt-1 text-xs ${!item.done && item.item_date < today() ? 'font-bold text-red-700' : 'text-slate-500'}`}>{item.item_date}{!item.done && item.item_date < today() ? ' · Vencida' : ''}</p>}</div>{editButton(item)}</div>)}</div>
          {!tasks.length && <p className="text-sm text-slate-500">{canEdit ? 'Añade una gestión del programa, su responsable y fecha objetivo.' : 'Las gestiones se mostrarán al acceder al espacio compartido.'}</p>}
        </Panel>
        <Panel id="rosters" title="Nóminas de usuarios" icon={Users} action={addButton('roster', { category: 'DM2' })}>
          <p className="mb-3 text-xs text-slate-500">Accesos a nóminas institucionales. Los datos de pacientes permanecen en su sistema de origen y conservan sus permisos.</p><select aria-label="Filtrar nóminas" className={`${field} mb-3`} value={rosterFilter} onChange={e => setRosterFilter(e.target.value)}>{['Todos', ...rosterGroups].map(group => <option key={group}>{group}</option>)}</select>
          <div className="max-h-64 space-y-2 overflow-auto">{rosters.filter(item => rosterFilter === 'Todos' || item.category === rosterFilter).map(item => <div key={item.id} className="flex items-center justify-between rounded-xl border p-3"><div><p className="text-xs text-slate-500">{item.category}</p><OutLink url={item.url}>{item.title}</OutLink><p className="text-xs text-slate-500">{item.details}</p></div>{editButton(item)}</div>)}</div>{!rosters.length && <p className="text-sm text-slate-500">Añade enlaces por programa, examen pendiente o grupo de seguimiento.</p>}
        </Panel>
      </div>
    </div>

    <Panel id="calendar" title="Agenda anual del programa" icon={CalendarDays} action={addButton('event', { item_date: `${year}-${String(month + 1).padStart(2, '0')}-01` })}>
      <div className="mb-4 flex items-center gap-3"><Button variant="outline" aria-label="Año anterior" onClick={() => setYear(y => Math.max(1900, y - 1))}>‹</Button><strong>{year}</strong><Button variant="outline" aria-label="Año siguiente" onClick={() => setYear(y => Math.min(2200, y + 1))}>›</Button><Button variant="ghost" onClick={() => { setYear(new Date().getFullYear()); setMonth(new Date().getMonth()); }}>Hoy</Button></div>
      <div className="mb-5 grid grid-cols-3 gap-2 sm:grid-cols-6 xl:grid-cols-12">{months.map((name, index) => { const count = events.filter(e => e.item_date?.startsWith(`${year}-${String(index + 1).padStart(2, '0')}`)).length; return <button key={name} onClick={() => setMonth(index)} aria-pressed={month === index} className={`rounded-xl border p-2 text-left text-xs ${month === index ? 'border-teal-700 bg-teal-50 font-bold text-teal-900' : 'text-slate-600'}`}>{name}<span className="mt-1 block text-lg">{count}</span></button>; })}</div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"><div><h4 className="mb-3 font-semibold">{months[month]} {year}</h4><div className="grid grid-cols-7 gap-1">{['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => <div key={day} className="p-1 text-center text-xs text-slate-500">{day}</div>)}{calendarDays(year, month).map((date, index) => <div key={date || `empty-${index}`} className={`min-h-20 rounded-lg ${date ? 'border p-1 sm:p-2' : ''} ${date === today() ? 'border-teal-600 bg-teal-50' : ''}`}>{date && <><button disabled={!canEdit || showArchived} aria-label={`Añadir actividad el ${date}`} className="w-full text-left text-xs font-bold text-slate-700" onClick={() => add('event', { item_date: date })}>{Number(date.slice(-2))}<span className="float-right text-teal-700">+</span></button>{events.filter(e => e.item_date === date).map(item => <button key={item.id} onClick={() => openEditor(item)} className="mt-1 block w-full truncate rounded bg-teal-100 p-1 text-left text-[10px] text-teal-900" title={item.title}>{item.item_time?.slice(0, 5)} {item.title}</button>)}</>}</div>)}</div></div>
      <div className="max-h-96 space-y-2 overflow-auto"><h4 className="font-semibold">Actividades del mes</h4>{events.filter(e => e.item_date?.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)).map(item => <button key={item.id} onClick={() => openEditor(item)} className="block w-full rounded-xl border p-3 text-left"><p className="text-xs text-teal-700">{item.item_date} {item.item_time?.slice(0, 5)}</p><p className="font-medium">{item.title}</p><p className="whitespace-pre-wrap text-sm text-slate-500">{item.details}</p></button>)}{!events.some(e => e.item_date?.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)) && <p className="text-sm text-slate-500">Sin actividades cargadas para este mes.</p>}</div></div>
    </Panel>

    <Panel id="arsenal" title="Arsenal farmacológico del programa" icon={Pill}>
      <p className="mb-3 text-sm text-slate-500">El equipo selecciona los medicamentos del programa desde el catálogo institucional. La inclusión no confirma stock ni reemplaza las restricciones de uso.</p>
      <div className="mb-4 flex flex-wrap gap-2"><Button variant={drugMode === 'program' ? 'default' : 'outline'} onClick={() => setDrugMode('program')}>Selección PSCV</Button><Button variant={drugMode === 'catalog' ? 'default' : 'outline'} onClick={() => setDrugMode('catalog')}>Explorar catálogo</Button><Input className="max-w-sm" placeholder="Buscar medicamento o principio activo" aria-label="Buscar en arsenal" value={drugSearch} onChange={e => setDrugSearch(e.target.value)} /><Link to="/PrescripcionInteligente/arsenal" className="self-center text-sm text-teal-700 underline">Arsenal completo</Link></div>
      {medications.isPending ? <p>Cargando catálogo…</p> : medications.isError ? <p role="alert">No se pudo consultar el arsenal. <button className="underline" onClick={() => medications.refetch()}>Reintentar</button></p> : <div className="grid max-h-96 gap-3 overflow-auto md:grid-cols-2 xl:grid-cols-3">{drugs.map(med => { const chosen = selectedDrugs.find(item => item.reference_id === med.id); return <article key={med.id} className="rounded-xl border p-3"><h4 className="font-semibold">{med.name}</h4><p className="text-sm text-slate-600">{med.active_ingredient} · {med.presentation}</p><p className="mt-1 text-xs text-slate-500">{med.restrictions}</p><Button className="mt-3" size="sm" variant="outline" disabled={!canEdit || workspace.saving} onClick={() => chosen ? update(chosen, { archived: true }) : (async () => { try { await workspace.save(blank('medication', { title: med.name, reference_id: med.id, item_date: null, item_time: null })); } catch (err) { setError(err.message); } })()}>{chosen ? 'Quitar de selección PSCV' : 'Añadir a selección PSCV'}</Button></article>; })}</div>}
      {!medications.isPending && !medications.isError && !drugs.length && <p className="text-sm text-slate-500">{drugMode === 'program' ? 'No hay medicamentos seleccionados que coincidan. Explora el catálogo para incorporarlos al programa.' : 'Sin coincidencias con la búsqueda.'}</p>}
    </Panel>

    <Dialog open={quickOpen} onOpenChange={setQuickOpen}><DialogContent><DialogTitle>Accesos rápidos PSCV</DialogTitle><DialogDescription>Abre una vista integrada o salta a una herramienta del panel.</DialogDescription><div className="grid grid-cols-2 gap-2">{resources.map(resource => <Button key={resource.key} variant="outline" className="h-auto whitespace-normal text-left" onClick={() => { setSelected(resource.key); setQuickOpen(false); setTimeout(() => document.getElementById('pscv-clinical')?.scrollIntoView({ behavior: 'smooth' }), 100); }}>{resource.label}</Button>)}{[['tasks', 'Gestiones'], ['rosters', 'Nóminas'], ['calendar', 'Agenda anual'], ['arsenal', 'Arsenal']].map(([id, label]) => <Button key={id} variant="secondary" onClick={() => { setQuickOpen(false); setTimeout(() => document.getElementById(`pscv-${id}`)?.scrollIntoView({ behavior: 'smooth' }), 100); }}>{label}</Button>)}</div></DialogContent></Dialog>
    <Dialog open={!!editor} onOpenChange={open => { if (!open && !workspace.saving) setEditor(null); }}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogTitle>{editor?.id ? 'Editar' : 'Añadir'} {({ task: 'gestión', event: 'actividad', roster: 'nómina', resource: 'documento' })[editor?.kind]}</DialogTitle><DialogDescription>Información de coordinación del programa. No ingreses nombres, RUT ni datos clínicos de pacientes.</DialogDescription>{editor && <form onSubmit={saveEditor} className="space-y-3"><label className="block text-sm">Título<Input required maxLength={200} value={editor.title} onChange={e => setEditor({ ...editor, title: e.target.value })} /></label><label className="block text-sm">Detalles / responsable<textarea className={field} rows={3} maxLength={2000} value={editor.details} onChange={e => setEditor({ ...editor, details: e.target.value })} /></label>{['task', 'event'].includes(editor.kind) && <div className="flex gap-3"><label className="flex-1 text-sm">{editor.kind === 'task' ? 'Fecha objetivo' : 'Fecha'}<Input type="date" required={editor.kind === 'event'} value={editor.item_date || ''} onChange={e => setEditor({ ...editor, item_date: e.target.value })} /></label>{editor.kind === 'event' && <label className="text-sm">Hora (opcional)<Input type="time" value={editor.item_time || ''} onChange={e => setEditor({ ...editor, item_time: e.target.value })} /></label>}</div>}{editor.kind === 'roster' && <label className="block text-sm">Grupo<select className={field} value={editor.category} onChange={e => setEditor({ ...editor, category: e.target.value })}>{rosterGroups.map(group => <option key={group}>{group}</option>)}</select></label>}{['roster', 'resource'].includes(editor.kind) && <label className="block text-sm">Enlace institucional HTTPS<Input required type="url" value={editor.url} onChange={e => setEditor({ ...editor, url: e.target.value })} placeholder="https://…" /></label>}{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<div className="flex flex-wrap gap-2"><Button disabled={!canEdit || workspace.saving}>{workspace.saving ? 'Guardando…' : 'Guardar para el equipo'}</Button>{editor.id && <Button type="button" variant="outline" disabled={!canEdit || workspace.saving} onClick={async () => { setError(''); try { await workspace.save({ id: editor.id, version: editor.version, archived: !editor.archived }); setEditor(null); } catch (err) { setError(err.message); } }}>{editor.archived ? 'Restaurar' : 'Archivar'}</Button>}<Button type="button" variant="ghost" disabled={workspace.saving} onClick={() => setEditor(null)}>Cancelar</Button></div></form>}</DialogContent></Dialog>
  </div>;
}
