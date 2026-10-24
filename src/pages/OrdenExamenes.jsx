import { useEffect, useMemo, useState } from 'react';
import { Download, Eye, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { conPuertaAcceso } from '@/components/PuertaAcceso';
import { formatRut, validateRut } from '@/lib/rut-ges';
import { MEDICO, INSTITUCION_POR_DEFECTO, getInstitucion, fechaLarga } from '@/lib/certificadoPdf';
import { hoyChile } from '@/lib/recetaCatalogo';
import { buscarExamenes, EXAMENES_CATALOGO, EXAMENES_CATEGORIAS, CONTRASTES, nuevoExamen, textoExamen, mostrarCreatinina, textoCreatinina, validarEstudios } from '@/lib/ordenExamenesCatalogo';
import { buildOrdenExamenesPdf } from '@/lib/ordenExamenesPdf';
import DocumentoHeader from '@/components/documentos/DocumentoHeader';
import InstitucionSelector from '@/components/documentos/InstitucionSelector';
import { leerPacienteDocumentos, guardarPacienteDocumentos, limpiarPacienteDocumentos } from '@/lib/pacienteDocumentos';
import { toast } from 'sonner';

const nuevaOrden = () => ({ paciente: '', rut: '', edad: '', direccion: '', fecha: hoyChile(), diagnostico: '', observaciones: '', institucion: INSTITUCION_POR_DEFECTO, firma: true, examenes: [], incluirCreatinina: false, creatinina: '', unidadCreatinina: 'mg/dL', fechaCreatinina: '' });
const inputClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';
function Campo({ label, value, onChange, multiline, ...props }) {
  const Tag = multiline ? 'textarea' : 'input';
  return <label className="block text-sm font-medium text-slate-700"><span className="mb-1 block">{label}</span><Tag {...props} className={inputClass} value={value} onChange={e => onChange(e.target.value)} /></label>;
}
function OrdenExamenes() {
  const [orden, setOrden] = useState(() => ({ ...nuevaOrden(), ...leerPacienteDocumentos() }));
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('');
  const [generando, setGenerando] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  useEffect(() => {
    guardarPacienteDocumentos({ paciente: orden.paciente, rut: orden.rut, edad: orden.edad, direccion: orden.direccion, diagnostico: orden.diagnostico, institucion: orden.institucion });
  }, [orden.paciente, orden.rut, orden.edad, orden.direccion, orden.diagnostico, orden.institucion]);
  useEffect(() => () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); }, [pdfUrl]);
  const cambiar = (key, value) => { setPdfUrl(''); setOrden(r => ({ ...r, [key]: value })); };
  const agregar = (item = {}) => {
    setPdfUrl('');
    setOrden(r => ({ ...r, examenes: [...r.examenes, nuevoExamen(item)] }));
    setBusqueda('');
  };
  const editarExamen = (id, cambios) => {
    setPdfUrl('');
    setOrden(r => ({ ...r, examenes: r.examenes.map(item => item.id === id ? { ...item, ...cambios } : item) }));
  };
  const centro = getInstitucion(orden.institucion);
  const resultados = useMemo(() => buscarExamenes(busqueda, categoria), [busqueda, categoria]);
  const tieneCreatinina = mostrarCreatinina(orden);
  const rutValido = validateRut(orden.rut);
  const faltantes = [
    !orden.paciente.trim() && 'nombre del paciente', !rutValido && 'RUT válido',
    (orden.edad === '' || Number(orden.edad) < 0 || Number(orden.edad) > 130) && 'edad entre 0 y 130 años',
    !orden.direccion.trim() && 'dirección', !/^\d{4}-\d{2}-\d{2}$/.test(orden.fecha) && 'fecha',
    ...validarEstudios(orden),
  ].filter(Boolean);
  const generar = async (preview) => {
    if (faltantes.length || generando) return;
    setGenerando(true);
    try {
      const doc = await buildOrdenExamenesPdf(orden);
      if (preview) setPdfUrl(URL.createObjectURL(doc.output('blob')));
      else doc.save(`Orden_Examenes_${orden.rut}_${orden.fecha}.pdf`);
    } catch (error) { toast.error(error.message || 'No se pudo generar la orden. Intenta nuevamente.'); }
    finally { setGenerando(false); }
  };
  return <div className="min-h-screen bg-slate-50 pb-16 text-slate-900">
    <DocumentoHeader pagina="OrdenExamenes" onNuevo={() => { if (window.confirm('¿Limpiar los datos y comenzar con un nuevo paciente?')) { limpiarPacienteDocumentos(); setOrden(nuevaOrden()); setPdfUrl(''); setBusqueda(''); setCategoria(''); } }} />
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[1.1fr_1fr]">
      <div className="space-y-5">
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Datos de la orden</h2>
          <InstitucionSelector value={orden.institucion} onChange={v => cambiar('institucion', v)} />
          <Campo label="Nombre del paciente *" value={orden.paciente} onChange={v => cambiar('paciente', v)} autoComplete="off" />
          <div className="grid grid-cols-2 gap-3"><Campo label="RUT del paciente *" value={orden.rut} onChange={v => cambiar('rut', formatRut(v))} placeholder="12.345.678-9" /><Campo label="Edad (años) *" value={orden.edad} type="number" min="0" max="130" onChange={v => cambiar('edad', v)} /></div>
          {orden.rut && !rutValido && <p className="text-xs text-red-600" role="alert">Revisa el RUT y su dígito verificador.</p>}
          <Campo label="Dirección del paciente *" value={orden.direccion} onChange={v => cambiar('direccion', v)} />
          <Campo label="Fecha *" type="date" value={orden.fecha} onChange={v => cambiar('fecha', v)} />
          <Campo label="Dg. · Diagnóstico / motivo del estudio" value={orden.diagnostico} onChange={v => cambiar('diagnostico', v)} />
        </section>
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Exámenes solicitados</h2>
          <Campo label="Buscar y agregar" type="search" placeholder="Ej.: hemograma, TAC abdomen, RM, creatinina…" value={busqueda} onChange={setBusqueda} />
          <div className="flex flex-wrap gap-2" aria-label="Categorías de exámenes">{['', ...EXAMENES_CATEGORIAS].map(c => <button key={c} type="button" aria-pressed={categoria === c} onClick={() => setCategoria(c)} className={`rounded-full border px-3 py-1.5 text-xs ${categoria === c ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white hover:bg-blue-50'}`}>{c || 'Todos'}</button>)}</div>
          <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200" aria-label="Catálogo de exámenes">
            {resultados.map(item => {
              const agregado = orden.examenes.some(e => e.nombre === item.nombre);
              return <button type="button" key={item.nombre} disabled={agregado} onClick={() => agregar(item)} className="flex w-full items-center gap-3 border-b border-slate-100 px-3 py-2.5 text-left last:border-0 hover:bg-blue-50 disabled:bg-slate-50 disabled:text-slate-400"><span className="min-w-0 flex-1"><span className="block text-sm font-medium">{item.nombre}</span><span className="text-xs text-slate-500">{item.categoria}</span></span>{agregado ? <span className="text-xs">Agregado</span> : <Plus className="h-4 w-4 shrink-0 text-blue-700" />}</button>;
            })}
            {!resultados.length && <p className="p-3 text-sm text-slate-500">Sin coincidencias. Puedes escribir el estudio manualmente.</p>}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2"><Button variant="outline" size="sm" onClick={() => agregar({ nombre: busqueda.trim() })}><Plus className="mr-2 h-4 w-4" />Agregar manualmente</Button><span className="text-xs text-slate-500">{EXAMENES_CATALOGO.length} estudios precargados</span></div>
          <div className="space-y-3">{orden.examenes.map((item, i) => <article key={item.id} className="space-y-3 rounded-xl border border-blue-100 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-semibold">Estudio {i + 1}</h3><Button size="icon" variant="ghost" aria-label={`Eliminar estudio ${i + 1}`} onClick={() => cambiar('examenes', orden.examenes.filter(e => e.id !== item.id))}><Trash2 className="h-4 w-4" /></Button></div>
            <Campo label="Examen *" value={item.nombre} onChange={nombre => editarExamen(item.id, { nombre })} />
            <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={item.permiteContraste} onChange={e => editarExamen(item.id, { permiteContraste: e.target.checked, contraste: '' })} className="h-4 w-4 accent-blue-600" />Especificar contraste</label>
            {item.permiteContraste && <fieldset><legend className="mb-2 text-sm font-medium">Contraste *</legend><div className="flex flex-wrap gap-2">{CONTRASTES.map(c => <label key={c} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${item.contraste === c ? 'border-blue-500 bg-blue-50 text-blue-900' : 'border-slate-200 bg-white'}`}><input type="radio" name={`contraste-${item.id}`} value={c} checked={item.contraste === c} onChange={() => editarExamen(item.id, { contraste: c })} className="accent-blue-600" />{c}</label>)}</div></fieldset>}
            <Campo label="Detalle / lateralidad (opcional)" placeholder="Ej.: rodilla derecha; proyecciones; protocolo solicitado…" value={item.detalle} onChange={detalle => editarExamen(item.id, { detalle })} />
          </article>)}</div>
          <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={orden.incluirCreatinina} onChange={e => cambiar('incluirCreatinina', e.target.checked)} className="h-4 w-4 accent-blue-600" />Anotar última creatinina también en estudios sin contraste</label>
          {tieneCreatinina && <div className="space-y-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
            <h3 className="text-sm font-semibold">Última creatinina</h3>
            <div className="grid gap-3 sm:grid-cols-2"><Campo label="Resultado (si disponible)" inputMode="decimal" placeholder="Ej.: 0,9" value={orden.creatinina} onChange={v => cambiar('creatinina', v)} /><label className="block text-sm font-medium text-slate-700"><span className="mb-1 block">Unidad</span><select className={inputClass} value={orden.unidadCreatinina} onChange={e => cambiar('unidadCreatinina', e.target.value)}><option>mg/dL</option><option>µmol/L</option></select></label></div>
            <Campo label="Fecha de la muestra" type="date" max={orden.fecha} value={orden.fechaCreatinina} onChange={v => cambiar('fechaCreatinina', v)} />
            {!orden.creatinina.trim() && <p className="text-xs text-slate-500">Si no tienes el resultado, la orden indicará «Última creatinina: no informada».</p>}
          </div>}
          <Campo label="Indicaciones generales" multiline rows={3} value={orden.observaciones} onChange={v => cambiar('observaciones', v)} />
        </section>
      </div>
      <aside className="min-w-0 space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="font-semibold">{MEDICO.nombre}</p><p className="text-sm text-slate-500">{MEDICO.titulo} · RUT {MEDICO.rut}</p>
          <label className="mt-4 flex items-center gap-3 rounded-lg border p-3 text-sm font-medium"><input type="checkbox" className="h-4 w-4 accent-blue-600" checked={orden.firma} onChange={e => cambiar('firma', e.target.checked)} />Incluir firma electrónica</label>
          <p className="mt-2 text-xs text-slate-500">{orden.firma ? 'Incluye leyenda de firma simple y la imagen de firma de la institución, si está disponible. No constituye firma electrónica avanzada.' : 'Se deja espacio en blanco para firma y timbre manuales.'}</p>
        </div>
        <section aria-label="Vista previa de la orden" className="break-words rounded-sm border border-slate-200 bg-white p-6 shadow-md sm:p-8">
          <div className="flex items-center gap-3 border-b-2 border-blue-900 pb-4"><img src={centro.logo} alt="" className="h-12 w-12 object-contain" /><div><p className="text-xs font-bold">{centro.nombre}</p><p className="text-[11px] text-slate-500">{centro.direccion}<br />Fono {centro.fono}</p></div></div>
          <h2 className="my-6 text-center text-lg font-bold tracking-widest">ORDEN DE EXÁMENES</h2>
          <div className="space-y-2 border-b pb-4 text-sm"><p><strong>Nombre:</strong> {orden.paciente || '________________________'}</p><p><strong>RUT:</strong> {orden.rut || '_______________'} <strong className="ml-3">Edad:</strong> {orden.edad || '___'} años</p><p><strong>Dirección:</strong> {orden.direccion || '________________________'}</p><p><strong>Fecha:</strong> {orden.fecha ? fechaLarga(orden.fecha) : '________________'}</p>{orden.diagnostico && <p><strong>Dg.:</strong> {orden.diagnostico}</p>}</div>
          {tieneCreatinina && <p className="mt-4 text-sm">{textoCreatinina(orden)}</p>}
          <p className="mb-4 mt-6 text-sm font-semibold">Solicito los siguientes estudios:</p>
          <ol className="min-h-36 list-decimal space-y-5 pl-5 text-sm leading-relaxed">{orden.examenes.map(item => <li key={item.id} className="whitespace-pre-wrap">{textoExamen(item) || 'Examen por completar'}</li>)}</ol>
          {orden.observaciones && <p className="mt-5 whitespace-pre-wrap text-sm"><strong>Indicaciones generales:</strong><br />{orden.observaciones}</p>}
          <div className="mx-auto mt-10 max-w-xs text-center">{orden.firma && centro.firma ? <img src={centro.firma} alt="Firma y timbre del profesional" className="mx-auto h-24 object-contain" /> : <div className="h-20" />}<p className="border-t border-slate-400 pt-2 text-sm font-bold">{MEDICO.nombre}</p><p className="text-xs">{MEDICO.titulo} · RUT {MEDICO.rut}</p><p className="mt-2 text-[10px] text-slate-500">{orden.firma ? 'Firma electrónica simple · No constituye firma electrónica avanzada' : 'Firma y timbre'}</p></div>
        </section>
        <div className="rounded-2xl border bg-white p-5"><div className="flex flex-wrap gap-2"><Button disabled={!!faltantes.length || generando} onClick={() => generar(false)}><Download className="mr-2 h-4 w-4" />{generando ? 'Generando…' : 'Descargar PDF'}</Button><Button variant="outline" disabled={!!faltantes.length || generando} onClick={() => generar(true)}><Eye className="mr-2 h-4 w-4" />Ver PDF / imprimir</Button></div>{faltantes.length > 0 && <p className="mt-3 text-xs text-slate-500">Completa: {faltantes.join('; ')}.</p>}</div>
        {pdfUrl && <section className="space-y-2"><a href={pdfUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-700 underline">Abrir PDF para imprimir</a><iframe title="Orden de exámenes en PDF" src={pdfUrl} className="h-[650px] w-full rounded-lg border bg-white" /></section>}
      </aside>
    </main>
  </div>;
}
export default conPuertaAcceso(OrdenExamenes, { storageKey: 'acceso_medico', descripcion: 'Ingresa el código de acceso para usar el generador de órdenes de exámenes.' });
