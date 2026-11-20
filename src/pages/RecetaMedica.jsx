import EditorMagistralCapsulas from '@/components/documentos/EditorMagistralCapsulas';
import { usePacienteGeneral, useAplicarPacienteGeneral } from '@/lib/PacienteGeneral';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ChevronDown, ClipboardList, Download, ExternalLink, Eye, FlaskConical, Pill, Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { conPuertaAcceso } from '@/components/PuertaAcceso';
import { formatRut, validateRut } from '@/lib/rut-ges';
import { INSTITUCION_POR_DEFECTO, getInstitucion, fechaLarga } from '@/lib/certificadoPdf';
import { RECETA_CATALOGO, buscarMedicamentos, FRECUENCIAS_RECETA, DURACIONES_RECETA, VIAS_RECETA, opcionesDosis, precargaMedicamento, esMetotrexato, frecuenciasMedicamento, actualizarPresentacion, hoyChile, textoMedicamento } from '@/lib/recetaCatalogo';
import { esBenzodiacepina, calcularComprimidos, cantidadControlada, validarControlados } from '@/lib/recetaControlados';
import { MAGISTRALES, nuevaMagistral, validarMagistrales } from '@/lib/recetaMagistrales';
import { buildDocumentoClinicoPdf, buildRecetaPdf } from '@/lib/recetaPdf';
import { DatosMedico, DatosPaciente } from '@/components/documentos/DatosDocumento';
import DocumentoHeader from '@/components/documentos/DocumentoHeader';
import InstitucionSelector from '@/components/documentos/InstitucionSelector';
import { leerPacienteDocumentos, guardarPacienteDocumentos, limpiarPacienteDocumentos } from '@/lib/pacienteDocumentos';
import { KINESIOTERAPIA, textoOrdenKine, tieneContenidoReceta, borrarContenidoReceta } from '@/lib/indicacionesReceta';
import { leerMedicoDocumento, medicoCompleto, puedeUsarFirma } from '@/lib/medicoDocumento';
import { toast } from 'sonner';

const nuevoItem = (nombre = '', presentacion = '') => ({ id: crypto.randomUUID(), nombre, presentacion, ...precargaMedicamento(nombre, presentacion), frecuencia: '', duracion: '', cantidad: '', indicaciones: '' });
const nuevaReceta = () => ({ medico: leerMedicoDocumento(), paciente: '', rut: '', edad: '', direccion: '', fecha: hoyChile(), diagnostico: '', textoLibre: '', observaciones: '', institucion: INSTITUCION_POR_DEFECTO, firma: true, medicamentos: [] });
const inputClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
function Campo({ label, value, onChange, multiline, ...props }) {
  const Tag = multiline ? 'textarea' : 'input';
  return <label className="block text-sm font-medium text-slate-700"><span className="mb-1 block">{label}</span><Tag {...props} className={inputClass} value={value} onChange={e => onChange(e.target.value)} /></label>;
}
function CampoOpciones({ id, label, value, onChange, opciones, ...props }) {
  return <div>
    <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
    <div className="flex rounded-lg border border-slate-300 bg-white focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
      <input {...props} id={id} list={opciones.length ? `${id}-sugerencias` : undefined} autoComplete="off" value={value} onChange={e => onChange(e.target.value)} className="min-w-0 flex-1 rounded-l-lg bg-transparent px-3 py-2 text-sm outline-none" />
      <datalist id={`${id}-sugerencias`}>{opciones.map(opcion => <option key={opcion} value={opcion} />)}</datalist>
      {opciones.length > 0 && <select aria-label={`Opciones de ${label.replace(' *', '').toLowerCase()}`} title="Elegir opción" value="" onChange={e => { if (e.target.value) onChange(e.target.value); }} className="w-9 cursor-pointer rounded-r-lg border-l border-slate-200 bg-slate-50 text-sm text-slate-700"><option value="" disabled>▾</option>{opciones.map(opcion => <option key={opcion} value={opcion}>{opcion}</option>)}</select>}
    </div>
  </div>;
}
export function RecetaMedica({ derivacion = false }) {
  const general = usePacienteGeneral();
  const [receta, setReceta] = useState(() => ({ ...nuevaReceta(), ...(general?.paciente ? { paciente: general.paciente.nombre, rut: general.paciente.rut } : leerPacienteDocumentos()) }));
  const [plantillaKine, setPlantillaKine] = useState('');
  const [sesionesKine, setSesionesKine] = useState('');
  const [detalleKine, setDetalleKine] = useState('');
  const [profesional, setProfesional] = useState('Kinesiólogo/a');
  const [patologia, setPatologia] = useState('');
  const [modo, setModo] = useState('catalogo');
  const [busqueda, setBusqueda] = useState('');
  const buscadorRef = useRef(null);
  const [buscadorAbierto, setBuscadorAbierto] = useState(false);
  useEffect(() => {
    const cerrarFuera = event => {
      if (buscadorRef.current && !buscadorRef.current.contains(event.target)) setBuscadorAbierto(false);
    };
    document.addEventListener('pointerdown', cerrarFuera);
    document.addEventListener('focusin', cerrarFuera);
    return () => { document.removeEventListener('pointerdown', cerrarFuera); document.removeEventListener('focusin', cerrarFuera); };
  }, []);
  const mostrarResultados = buscadorAbierto && Boolean(busqueda.trim());
  const [generando, setGenerando] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  useEffect(() => {
    if (general?.paciente) return;
    guardarPacienteDocumentos({ paciente: receta.paciente, rut: receta.rut, edad: receta.edad, direccion: receta.direccion, diagnostico: receta.diagnostico, institucion: receta.institucion });
  }, [receta.paciente, receta.rut, receta.edad, receta.direccion, receta.diagnostico, receta.institucion]);
  useEffect(() => () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); }, [pdfUrl]);
  useAplicarPacienteGeneral(p => { setReceta(actual => ({ ...actual, paciente: p.nombre, rut: p.rut, ...(p.edad && { edad: p.edad }), ...(p.diagnostico && { diagnostico: p.diagnostico }) })); setPdfUrl(''); });
  const cambiar = (key, value) => { setPdfUrl(''); setReceta(r => ({ ...r, [key]: value })); };
  const agregar = (nombre = '', presentacion = '') => {
    setPdfUrl('');
    const item = nuevoItem(nombre, presentacion);
    setReceta(actual => ({ ...actual, medicamentos: [...actual.medicamentos, item] }));
    setBusqueda('');
    setBuscadorAbierto(false);
  };
  const agregarMagistral = (plantilla) => {
    const item = nuevaMagistral(plantilla);
    cambiar('medicamentos', [...receta.medicamentos, item]);
    toast.success(`${item.nombre} agregada a la receta`);
  };
  const editarItem = (id, key, value) => {
    setPdfUrl('');
    setReceta(r => ({ ...r, medicamentos: r.medicamentos.map(item => {
      if (item.id !== id) return item;
      if (key === 'presentacion') return { ...actualizarPresentacion(item, value), cantidadManual: '' };
      if (key === 'nombre') return { ...(item.tipo === 'magistral' ? item : actualizarPresentacion(item, '')), nombre: value, cantidadManual: '' };
      return { ...item, ...(['dosis', 'frecuencia', 'duracion', 'indicaciones'].includes(key) ? { cantidadManual: '' } : {}), [key]: value };
    }) }));
  };
  const centro = getInstitucion(receta.institucion);
  const resultados = useMemo(() => buscarMedicamentos(busqueda), [busqueda]);
  const rutValido = validateRut(receta.rut);
  const medico = receta.medico;
  const medicoListo = medicoCompleto(medico);
  const firmaDisponible = puedeUsarFirma(medico);
  const datosListos = Boolean(receta.paciente.trim() && rutValido && receta.edad !== '' && Number.isFinite(Number(receta.edad)) && Number(receta.edad) >= 0 && Number(receta.edad) <= 130 && receta.direccion.trim() && /^\d{4}-\d{2}-\d{2}$/.test(receta.fecha));
  const faltantes = [
    !medicoListo && 'nombre, RUT válido y título del médico',
    !receta.paciente.trim() && 'nombre del paciente', !rutValido && 'RUT válido',
    (receta.edad === '' || Number(receta.edad) < 0 || Number(receta.edad) > 130) && 'edad entre 0 y 130 años',
    !receta.direccion.trim() && 'dirección', !/^\d{4}-\d{2}-\d{2}$/.test(receta.fecha) && 'fecha',
    !(derivacion ? receta.textoLibre.trim() : tieneContenidoReceta(receta)) && (derivacion ? 'motivo e indicaciones de la derivación' : 'al menos un medicamento o una indicación en texto libre'),
    derivacion && !profesional.trim() && 'profesional de destino',
    ...validarControlados(receta), ...validarMagistrales(receta.medicamentos),
    receta.medicamentos.some(item => !item.nombre.trim() || !item.dosis.trim() || !item.via.trim() || !item.frecuencia.trim() || !item.duracion.trim()) && 'nombre, dosis, vía, frecuencia y duración de cada medicamento',
  ].filter(Boolean);
  const generar = async (preview) => {
    if (faltantes.length || generando) return;
    setGenerando(true);
    try {
      const doc = derivacion ? await buildDocumentoClinicoPdf(receta, { titulo: 'DERIVACIÓN A OTROS PROFESIONALES', seccion: `Profesional de destino: ${profesional}` }) : await buildRecetaPdf(receta);
      if (preview) setPdfUrl(URL.createObjectURL(doc.output('blob')));
      else doc.save(`${derivacion ? 'Derivacion' : 'Receta'}_${receta.rut}_${receta.fecha}.pdf`);
    } catch (error) { toast.error(error.message || 'No se pudo generar la receta. Intenta nuevamente.'); }
    finally { setGenerando(false); }
  };
  return <div className="min-h-screen bg-slate-50 pb-16 text-slate-900">
    <DocumentoHeader medico={medico} pagina={derivacion ? 'DerivacionProfesionales' : 'RecetaMedica'} onBorrarContenido={() => { setReceta(borrarContenidoReceta); setPdfUrl(''); setBusqueda(''); setPlantillaKine(''); setSesionesKine(''); setDetalleKine(''); setPatologia(''); setProfesional('Kinesiólogo/a'); setModo('catalogo'); }} onNuevo={() => { if (window.confirm('¿Limpiar los datos y comenzar con un nuevo paciente?')) { limpiarPacienteDocumentos(); general?.actualizar({ nombre: '', rut: '' }); setReceta({ ...nuevaReceta(), medico, firma: receta.firma }); setPdfUrl(''); setBusqueda(''); setPlantillaKine(''); setSesionesKine(''); setDetalleKine(''); setPatologia(''); setProfesional('Kinesiólogo/a'); } }} />
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[1.1fr_1fr]">
      <DatosMedico medico={medico} onChange={v => cambiar('medico', v)} firma={receta.firma} onFirma={v => cambiar('firma', v)} />
      <div className="min-w-0 space-y-5">
      <DatosPaciente completo={datosListos}>
          <div className="md:col-span-2"><InstitucionSelector value={receta.institucion} onChange={v => cambiar('institucion', v)} /></div>
          <Campo label="Nombre del paciente *" value={receta.paciente} onChange={v => cambiar('paciente', v)} autoComplete="off" />
          <div className="grid grid-cols-2 gap-3"><Campo label="RUT del paciente *" value={receta.rut} onChange={v => cambiar('rut', formatRut(v))} placeholder="12.345.678-9" /><Campo label="Edad (años) *" value={receta.edad} type="number" min="0" max="130" onChange={v => cambiar('edad', v)} /></div>
          {receta.rut && !rutValido && <p className="text-xs text-red-600" role="alert">Revisa el RUT y su dígito verificador.</p>}
          <Campo label={receta.medicamentos.some(esBenzodiacepina) ? "Dirección del paciente * · obligatoria para benzodiacepinas" : "Dirección del paciente *"} required value={receta.direccion} onChange={v => cambiar('direccion', v)} />
          <Campo label="Fecha *" type="date" value={receta.fecha} onChange={v => cambiar('fecha', v)} />
          <Campo label="Dg. · Diagnóstico (opcional)" value={receta.diagnostico} onChange={v => cambiar('diagnostico', v)} />
      </DatosPaciente>
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {!derivacion && <>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-serif text-3xl italic leading-none text-slate-800">Rp.</p>
              <p className="mt-1.5 text-xs text-slate-500">{receta.medicamentos.length ? `${receta.medicamentos.length} ${receta.medicamentos.length === 1 ? 'indicación' : 'indicaciones'} en la receta` : 'Agrega medicamentos del catálogo o fórmulas magistrales'}</p>
            </div>
            <div role="tablist" aria-label="Tipo de prescripción" className="inline-flex rounded-xl bg-slate-100 p-1">
              {[['catalogo', 'Medicamentos', Pill, 'text-blue-600'], ['magistral', 'Magistrales', FlaskConical, 'text-violet-600']].map(([id, label, Icono, color]) => <button key={id} type="button" role="tab" aria-selected={modo === id} onClick={() => setModo(id)} className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors duration-150 ${modo === id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}><Icono className={`h-4 w-4 ${modo === id ? color : ''}`} />{label}</button>)}
            </div>
          </div>
          {modo === 'magistral' ? <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5" aria-label="Filtrar por patología">
              {['', ...new Set(MAGISTRALES.map(p => p.patologia))].map(p => <button key={p || 'todas'} type="button" aria-pressed={patologia === p} onClick={() => setPatologia(p)} className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${patologia === p ? 'border-violet-600 bg-violet-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:text-violet-800'}`}>{p || 'Todas'}</button>)}
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {MAGISTRALES.filter(p => !patologia || p.patologia === patologia).map(p => <div key={p.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-3.5 transition hover:border-violet-300 hover:shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">{p.patologia}</span>
                  {p.fuente && <a href={p.fuente} target="_blank" rel="noreferrer" title="Ver referencia" aria-label={`Referencia de ${p.nombre}`} className="rounded p-0.5 text-slate-400 hover:text-violet-700"><ExternalLink className="h-3.5 w-3.5" /></a>}
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-900">{p.nombre}</p>
                <p className="mt-0.5 whitespace-pre-line text-xs leading-relaxed text-slate-600">{p.formula}</p>
                <p className="mt-1 text-xs capitalize text-slate-400">{p.presentacion.split(' · ')[1]}</p>
                <button type="button" onClick={() => agregarMagistral(p)} className="mt-3 inline-flex items-center justify-center gap-1.5 self-start rounded-lg bg-violet-50 px-3 py-1.5 text-sm font-medium text-violet-800 transition-colors hover:bg-violet-100 active:scale-[0.97]"><Plus className="h-4 w-4" />Agregar</button>
              </div>)}
              <button type="button" onClick={() => agregarMagistral()} className="flex min-h-[9rem] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 p-3.5 text-center text-slate-500 transition-colors hover:border-violet-400 hover:bg-violet-50/50 hover:text-violet-800">
                <Plus className="h-5 w-5" /><span className="text-sm font-medium">Fórmula personalizada</span><span className="text-xs">Escribe composición, vehículo y pauta</span>
              </button>
            </div>
          </div> : <>
          <div ref={buscadorRef} className="space-y-2" onKeyDown={e => { if (e.key === 'Escape') { setBuscadorAbierto(false); e.stopPropagation(); } }}>
            <label htmlFor="buscar-medicamento" className="sr-only">Buscar y agregar medicamento</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input id="buscar-medicamento" type="search" autoComplete="off" placeholder="Buscar medicamento, marca o concentración…" value={busqueda} onChange={e => { setBusqueda(e.target.value); setBuscadorAbierto(true); }} onFocus={() => setBuscadorAbierto(true)} aria-expanded={mostrarResultados} aria-controls="resultados-medicamentos" className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition-shadow focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
            </div>
            {mostrarResultados && <div id="resultados-medicamentos" className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg" aria-label="Presentaciones de medicamentos">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-3 py-2"><p className="text-xs text-slate-500" role="status">{resultados.length} coincidencias{resultados.length > 40 ? ' · mostrando las primeras 40' : ''}</p><button type="button" className="text-xs font-medium text-blue-700 hover:underline" onClick={() => setBuscadorAbierto(false)}>Cerrar</button></div>
              <div className="max-h-80 overflow-y-auto">
                {resultados.slice(0, 40).map(item => <div key={item.nombre} className="border-b border-slate-100 px-3 py-2.5 last:border-0">
                  <div className="flex flex-wrap items-baseline gap-x-2"><p className="text-sm font-semibold text-slate-900">{item.nombre}</p><p className="text-xs text-slate-400">{item.categoria}</p></div>
                  {item.comerciales.length > 0 && <p className="text-xs text-slate-500">{item.comerciales.join(' · ')}</p>}
                  <div className="mt-2 flex flex-wrap gap-1.5">{item.presentaciones.map(presentacion => <button type="button" key={presentacion} onClick={() => agregar(item.nombre, presentacion)} aria-label={`Agregar ${item.nombre} ${presentacion}`} className="rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1 text-left text-xs font-medium text-blue-900 transition-colors hover:border-blue-400 hover:bg-blue-100 focus-visible:ring-2 focus-visible:ring-blue-500">{presentacion}</button>)}
                    <button type="button" onClick={() => agregar(item.nombre)} className="rounded-lg px-2 py-1 text-xs text-slate-500 hover:text-slate-800 hover:underline">{item.presentaciones.length ? 'Otra presentación' : 'Escribir presentación'}</button>
                  </div>
                </div>)}
                {!resultados.length && <p className="p-4 text-center text-sm text-slate-500">Sin coincidencias. Puedes agregarlo manualmente.</p>}
              </div>
            </div>}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-slate-500">Elige una presentación para precargar la concentración.</p>
            <Button variant="ghost" size="sm" className="text-slate-600" onClick={() => agregar(busqueda.trim())}><Plus className="mr-1.5 h-4 w-4" />{busqueda.trim() ? `Agregar “${busqueda.trim()}” manualmente` : 'Agregar manualmente'}</Button>
          </div></>}
          {receta.medicamentos.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center">
            <ClipboardList className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-600">La receta aún no tiene medicamentos</p>
            <p className="mt-0.5 text-xs text-slate-500">{modo === 'magistral' ? 'Elige una fórmula de arriba o crea una personalizada.' : 'Busca en el catálogo y elige una presentación.'}</p>
          </div> : <div className="space-y-3">{receta.medicamentos.map((item, i) => {
            const controlado = esBenzodiacepina(item);
            const magistral = item.tipo === 'magistral';
            const capsulasMagistrales = magistral && /cápsulas?/i.test(item.presentacion);
            const opciones = RECETA_CATALOGO.find(m => m.nombre === item.nombre)?.presentaciones || [];
            const resumen = [item.presentacion, item.dosis, item.frecuencia, item.duracion].filter(Boolean).join(' · ');
            return <article key={item.id} className={`overflow-hidden rounded-xl border bg-white shadow-sm ${magistral ? 'border-violet-200' : controlado ? 'border-amber-200' : 'border-slate-200'}`}>
              <header className={`flex items-center gap-3 border-b px-4 py-2.5 ${magistral ? 'border-violet-100 bg-violet-50/70' : controlado ? 'border-amber-100 bg-amber-50/70' : 'border-slate-100 bg-slate-50'}`}>
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${magistral ? 'bg-violet-600 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200'}`}>{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <h3 className="truncate text-sm font-semibold text-slate-900">{item.nombre || 'Nuevo medicamento'}</h3>
                    {magistral && <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-800"><FlaskConical className="h-3 w-3" />Magistral</span>}
                    {controlado && <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-900"><AlertTriangle className="h-3 w-3" />Benzodiacepina</span>}
                  </div>
                  {resumen && <p className="truncate text-xs text-slate-500">{resumen}</p>}
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-slate-400 hover:bg-red-50 hover:text-red-600" aria-label={`Eliminar medicamento ${i + 1}`} onClick={() => cambiar('medicamentos', receta.medicamentos.filter(m => m.id !== item.id))}><Trash2 className="h-4 w-4" /></Button>
              </header>
              <div className="space-y-4 p-4">
              {capsulasMagistrales ? <EditorMagistralCapsulas item={item} onChange={cambios => {
                setPdfUrl('');
                setReceta(r => ({ ...r, medicamentos: r.medicamentos.map(m => m.id === item.id ? { ...m, ...cambios } : m) }));
              }} /> : <>
              {magistral && <div className="grid gap-3 sm:grid-cols-2">
                <Campo label="Composición y concentraciones *" multiline rows={3} value={item.formula} onChange={v => editarItem(item.id, 'formula', v)} placeholder={'Ej.: Urea 10 %\nÁcido salicílico 2 %'} />
                <Campo label="Vehículo / base y c.s.p. *" placeholder="Ej.: Crema base c.s.p. 100 g" value={item.vehiculo} onChange={v => editarItem(item.id, 'vehiculo', v)} />
              </div>}
              <div className="grid gap-3 sm:grid-cols-2">
                <Campo label={magistral ? 'Nombre de la fórmula' : 'Medicamento'} value={item.nombre} onChange={v => editarItem(item.id, 'nombre', v)} />
                <Campo label="Presentación" placeholder="Concentración y forma" list={`presentaciones-${item.id}`} value={item.presentacion} onChange={v => editarItem(item.id, 'presentacion', v)} />
                <datalist id={`presentaciones-${item.id}`}>{opciones.map(p => <option key={p} value={p} />)}</datalist>
              </div>
              <fieldset className="space-y-3 rounded-lg bg-slate-50 p-3">
                <legend className="sr-only">Posología</legend>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Posología</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <CampoOpciones label={/\bgotas?\b/i.test(item.presentacion) ? "Dosis (gotas) *" : "Dosis *"} value={item.dosis} opciones={esMetotrexato(item.nombre) ? [] : opcionesDosis(item.presentacion)} onChange={v => editarItem(item.id, 'dosis', v)} placeholder={item.presentacion.includes('gotas') ? "Cantidad de gotas por toma" : "Selecciona o escribe"} id={`dosis-${item.id}`} />
                  <CampoOpciones label="Vía *" value={item.via} opciones={VIAS_RECETA} onChange={v => editarItem(item.id, 'via', v)} placeholder="Ej.: oral" id={`via-${item.id}`} />
                  <CampoOpciones label="Frecuencia *" value={item.frecuencia} opciones={frecuenciasMedicamento(item.nombre)} onChange={v => editarItem(item.id, 'frecuencia', v)} placeholder="Ej.: cada 24 horas" id={`frecuencia-${item.id}`} onBlur={() => { if (/^\d+$/.test(item.frecuencia.trim())) editarItem(item.id, 'frecuencia', `Cada ${item.frecuencia.trim()} horas`); }} />
                  <CampoOpciones label="Duración *" value={item.duracion} opciones={DURACIONES_RECETA} onChange={v => editarItem(item.id, 'duracion', v)} placeholder="Ej.: 30 días" id={`duracion-${item.id}`} onBlur={() => { if (/^\d+$/.test(item.duracion.trim())) editarItem(item.id, 'duracion', `${item.duracion.trim()} días`); }} />
                </div>
                <div className="flex flex-wrap gap-1.5" aria-label={`Frecuencias rápidas para ${item.nombre}`}>{(esMetotrexato(item.nombre) ? frecuenciasMedicamento(item.nombre) : FRECUENCIAS_RECETA).map(f => <button type="button" key={f} onClick={() => editarItem(item.id, 'frecuencia', f)} aria-pressed={item.frecuencia === f} className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${item.frecuencia === f ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-blue-400 hover:text-slate-900'}`}>{f}</button>)}</div>
              </fieldset>
              {esMetotrexato(item.nombre) && <p className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"><AlertTriangle className="h-4 w-4 shrink-0" /><span>Metotrexato: en indicaciones inflamatorias se administra semanalmente. Indica la dosis total y el día de administración. <a className="underline" href="https://www.ispch.cl/newsfarmacovigilancia/07/images/parte03.pdf" target="_blank" rel="noreferrer">Referencia ISP</a></span></p>}
              {controlado && <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3"><p className="text-sm font-medium text-amber-950">Cantidad total: {cantidadControlada(item) || 'Pendiente'}</p>{calcularComprimidos(item) !== null ? <p className="text-xs text-amber-900">Calculada según comprimidos por toma × tomas del período; redondeada al comprimido entero superior.</p> : <><p className="text-xs text-amber-900">Usa dosis en comprimidos, frecuencia cada N horas y duración en días o semanas. Para pautas variables, SOS o instrucciones adicionales, indica el total manualmente.</p><Campo label="Cantidad manual a dispensar *" type="number" min="1" max="9999" step="1" value={item.cantidadManual || ''} onChange={v => editarItem(item.id, 'cantidadManual', v)} />{!item.presentacion.toLowerCase().includes('comprimido') && <label className="block text-sm">Unidad a dispensar *<select className={inputClass} value={item.unidadCantidad || ''} onChange={e => editarItem(item.id, 'unidadCantidad', e.target.value)}><option value="">Seleccionar unidad</option>{['comprimidos', 'frascos', 'ampollas', 'cápsulas'].map(u => <option key={u}>{u}</option>)}</select></label>}</>}</div>}
              <details open={magistral} className="group text-sm"><summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 [&::-webkit-details-marker]:hidden"><ChevronDown className="h-4 w-4 -rotate-90 transition-transform duration-150 group-open:rotate-0" />Cantidad e instrucciones adicionales</summary><div className="mt-3 grid gap-3 sm:grid-cols-2">{!controlado && <Campo label={magistral ? "Cantidad final a preparar *" : "Cantidad total"} placeholder={magistral ? 'Ej.: 100 g' : 'Ej.: 30 comprimidos'} value={item.cantidad} onChange={v => editarItem(item.id, 'cantidad', v)} />}<div className={controlado ? 'sm:col-span-2' : ''}><Campo label="Instrucciones adicionales" value={item.indicaciones} onChange={v => editarItem(item.id, 'indicaciones', v)} multiline rows={2} /></div></div></details>
              </>}
              </div>
            </article>;
          })}</div>}
          <details className="text-xs text-slate-500"><summary className="cursor-pointer hover:text-slate-700">Acerca del catálogo</summary><p className="mt-2 leading-relaxed">Presentaciones de referencia del arsenal local, publicaciones ISP y <a className="underline" href="https://ascendlabs.cl/wp-content/uploads/2025/04/vademecum-2-1_compressed.pdf" target="_blank" rel="noreferrer">vademécum Ascend Chile</a>. Catálogo local de referencia; no está conectado a MINSAL ni confirma stock o vigencia comercial. Puedes editar cualquier presentación. Consulta el <a className="underline" href="https://registrosanitario.ispch.gob.cl/" target="_blank" rel="noreferrer">registro ISP</a>. Las opciones de posología son atajos de escritura; la pauta la eliges tú.</p></details>
          </>}
          <div className="space-y-3 border-t pt-4">
            <h2 className="font-semibold">{derivacion ? "Derivación a otros profesionales" : "Otras indicaciones / texto libre"}</h2>
            {derivacion && <><CampoOpciones id="profesional-destino" label="Profesional de destino *" value={profesional} onChange={v => { setProfesional(v); setPdfUrl(''); }} opciones={['Kinesiólogo/a', 'Nutricionista', 'Psicólogo/a', 'Terapeuta ocupacional', 'Fonoaudiólogo/a', 'Enfermero/a', 'Matrón/a', 'Trabajador/a social', 'Otro profesional']} /><p className="text-xs text-slate-500">Indica motivo, objetivos y antecedentes relevantes. Puedes editar el texto antes de imprimir.</p></>}
            {derivacion && profesional === 'Kinesiólogo/a' && <>
            <label className="block text-sm font-medium">Plantilla de kinesioterapia<select className={inputClass} value={plantillaKine} onChange={e => setPlantillaKine(e.target.value)}><option value="">Seleccionar plantilla</option>{KINESIOTERAPIA.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></label>
            <Campo label="Número de sesiones" type="number" min="1" step="1" value={sesionesKine} onChange={setSesionesKine} />
            <Campo label="Región, lateralidad, objetivos y restricciones" value={detalleKine} onChange={setDetalleKine} multiline rows={2} />
            <Button variant="outline" disabled={!textoOrdenKine(plantillaKine, sesionesKine, detalleKine)} onClick={() => cambiar('textoLibre', [receta.textoLibre, textoOrdenKine(plantillaKine, sesionesKine, detalleKine)].filter(Boolean).join('\n\n'))}>Agregar orden al texto</Button></>}
            <Campo label={derivacion ? "Motivo e indicaciones de la derivación *" : "Texto libre de la receta"} multiline rows={8} value={receta.textoLibre} onChange={v => cambiar('textoLibre', v)} placeholder={derivacion ? "Motivo, objetivos, antecedentes y restricciones…" : "Escribe aquí otras indicaciones…"} />
          </div>
          <Campo label="Indicaciones generales" multiline rows={3} value={receta.observaciones} onChange={v => cambiar('observaciones', v)} />
        </section>
      </div>
      <aside className="min-w-0 space-y-4">
        <section aria-label={derivacion ? "Vista previa de la derivación" : "Vista previa de la receta"} className="break-words rounded-sm border border-slate-200 bg-white p-6 shadow-md sm:p-8">
          <div className="flex items-center gap-3 border-b-2 border-blue-900 pb-4"><img src={centro.logo} alt="" className="h-12 w-12 object-contain" /><div><p className="text-xs font-bold">{centro.nombre}</p><p className="text-[11px] text-slate-500">{centro.direccion}<br />Fono {centro.fono}</p></div></div>
          <h2 className="my-6 text-center text-lg font-bold tracking-widest">{derivacion ? "DERIVACIÓN A OTROS PROFESIONALES" : "RECETA MÉDICA"}</h2>
          <div className="space-y-2 border-b pb-4 text-sm"><p><strong>Nombre:</strong> {receta.paciente || '________________________'}</p><p><strong>RUT:</strong> {receta.rut || '_______________'} <strong className="ml-3">Edad:</strong> {receta.edad || '___'} años</p><p><strong>Dirección:</strong> {receta.direccion || '________________________'}</p><p><strong>Fecha:</strong> {receta.fecha ? fechaLarga(receta.fecha) : '________________'}</p>{receta.diagnostico && <p><strong>Dg.:</strong> {receta.diagnostico}</p>}</div>
          {derivacion ? <p className="my-5 font-semibold">Profesional de destino: {profesional}</p> : <p className="mb-4 mt-6 font-serif text-3xl italic">Rp.</p>}
          <ol className=" list-decimal space-y-5 pl-5 text-sm leading-relaxed">{receta.medicamentos.map(item => {
            const [nombre, ...detalle] = textoMedicamento(item).split('\n');
            return <li key={item.id} className="whitespace-pre-wrap"><strong>{nombre || 'Medicamento por completar'}</strong>{detalle.length > 0 && `\n${detalle.join('\n')}`}</li>;
          })}</ol>
          {receta.textoLibre && <div className="mt-5 whitespace-pre-wrap text-sm"><strong>Otras indicaciones:</strong><p>{receta.textoLibre}</p></div>}
          {receta.observaciones && <p className="mt-5 whitespace-pre-wrap text-sm"><strong>Indicaciones generales:</strong><br />{receta.observaciones}</p>}
          <div className="mx-auto mt-10 max-w-xs text-center">{receta.firma && firmaDisponible && centro.firma ? <img src={centro.firma} alt="Firma y timbre del profesional" className="mx-auto h-24 object-contain" /> : <div className="h-20" />}<p className="border-t border-slate-400 pt-2 text-sm font-bold">{medico.nombre}</p><p className="text-xs">{medico.titulo} · RUT {medico.rut}</p><p className="mt-2 text-[10px] text-slate-500">{receta.firma && firmaDisponible ? 'Firma electrónica simple · No constituye firma electrónica avanzada' : 'Firma y timbre'}</p></div>
        </section>
        <div className="rounded-2xl border bg-white p-5"><div className="flex flex-wrap gap-2"><Button disabled={!!faltantes.length || generando} onClick={() => generar(false)}><Download className="mr-2 h-4 w-4" />{generando ? 'Generando…' : 'Descargar PDF'}</Button><Button variant="outline" disabled={!!faltantes.length || generando} onClick={() => generar(true)}><Eye className="mr-2 h-4 w-4" />Ver PDF / imprimir</Button></div>{faltantes.length > 0 && <p className="mt-3 text-xs text-slate-500">Completa: {faltantes.join('; ')}.</p>}</div>
        {pdfUrl && <section className="space-y-2"><a href={pdfUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-700 underline">Abrir PDF para imprimir</a><iframe title="Receta en PDF" src={pdfUrl} className="h-[650px] w-full rounded-lg border bg-white" /></section>}
      </aside>
    </main>
  </div>;
}
export default conPuertaAcceso(RecetaMedica, { storageKey: 'acceso_medico', descripcion: 'Ingresa el código de acceso para usar el generador de recetas.' });
