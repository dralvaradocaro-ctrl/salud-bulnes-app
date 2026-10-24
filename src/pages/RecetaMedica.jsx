import { useEffect, useMemo, useState } from 'react';
import { Download, Eye, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { conPuertaAcceso } from '@/components/PuertaAcceso';
import { formatRut, validateRut } from '@/lib/rut-ges';
import { MEDICO, INSTITUCION_POR_DEFECTO, getInstitucion, fechaLarga } from '@/lib/certificadoPdf';
import { RECETA_CATALOGO, buscarMedicamentos, FRECUENCIAS_RECETA, DURACIONES_RECETA, VIAS_RECETA, opcionesDosis, precargaPresentacion, actualizarPresentacion, hoyChile, textoMedicamento } from '@/lib/recetaCatalogo';
import { buildRecetaPdf } from '@/lib/recetaPdf';
import DocumentoHeader from '@/components/documentos/DocumentoHeader';
import InstitucionSelector from '@/components/documentos/InstitucionSelector';
import { leerPacienteDocumentos, guardarPacienteDocumentos, limpiarPacienteDocumentos } from '@/lib/pacienteDocumentos';
import { toast } from 'sonner';

const nuevoItem = (nombre = '', presentacion = '') => ({ id: crypto.randomUUID(), nombre, presentacion, ...precargaPresentacion(presentacion), frecuencia: '', duracion: '', cantidad: '', indicaciones: '' });
const nuevaReceta = () => ({ paciente: '', rut: '', edad: '', direccion: '', fecha: hoyChile(), diagnostico: '', observaciones: '', institucion: INSTITUCION_POR_DEFECTO, firma: true, medicamentos: [] });
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
function RecetaMedica() {
  const [receta, setReceta] = useState(() => ({ ...nuevaReceta(), ...leerPacienteDocumentos() }));
  const [busqueda, setBusqueda] = useState('');
  const [generando, setGenerando] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  useEffect(() => {
    guardarPacienteDocumentos({ paciente: receta.paciente, rut: receta.rut, edad: receta.edad, direccion: receta.direccion, diagnostico: receta.diagnostico, institucion: receta.institucion });
  }, [receta.paciente, receta.rut, receta.edad, receta.direccion, receta.diagnostico, receta.institucion]);
  useEffect(() => () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); }, [pdfUrl]);
  const cambiar = (key, value) => { setPdfUrl(''); setReceta(r => ({ ...r, [key]: value })); };
  const agregar = (nombre = '', presentacion = '') => {
    cambiar('medicamentos', [...receta.medicamentos, nuevoItem(nombre, presentacion)]);
    setBusqueda('');
  };
  const editarItem = (id, key, value) => {
    setPdfUrl('');
    setReceta(r => ({ ...r, medicamentos: r.medicamentos.map(item => {
      if (item.id !== id) return item;
      if (key === 'presentacion') return actualizarPresentacion(item, value);
      if (key === 'nombre') return { ...actualizarPresentacion(item, ''), nombre: value };
      return { ...item, [key]: value };
    }) }));
  };
  const centro = getInstitucion(receta.institucion);
  const resultados = useMemo(() => busqueda.trim() ? buscarMedicamentos(busqueda) : [], [busqueda]);
  const rutValido = validateRut(receta.rut);
  const faltantes = [
    !receta.paciente.trim() && 'nombre del paciente', !rutValido && 'RUT válido',
    (receta.edad === '' || Number(receta.edad) < 0 || Number(receta.edad) > 130) && 'edad entre 0 y 130 años',
    !receta.direccion.trim() && 'dirección', !/^\d{4}-\d{2}-\d{2}$/.test(receta.fecha) && 'fecha',
    !receta.medicamentos.length && 'al menos un medicamento',
    receta.medicamentos.some(item => !item.nombre.trim() || !item.dosis.trim() || !item.via.trim() || !item.frecuencia.trim() || !item.duracion.trim()) && 'nombre, dosis, vía, frecuencia y duración de cada medicamento',
  ].filter(Boolean);
  const generar = async (preview) => {
    if (faltantes.length || generando) return;
    setGenerando(true);
    try {
      const doc = await buildRecetaPdf(receta);
      if (preview) setPdfUrl(URL.createObjectURL(doc.output('blob')));
      else doc.save(`Receta_${receta.rut}_${receta.fecha}.pdf`);
    } catch (error) { toast.error(error.message || 'No se pudo generar la receta. Intenta nuevamente.'); }
    finally { setGenerando(false); }
  };
  return <div className="min-h-screen bg-slate-50 pb-16 text-slate-900">
    <DocumentoHeader pagina="RecetaMedica" onNuevo={() => { if (window.confirm('¿Limpiar los datos y comenzar con un nuevo paciente?')) { limpiarPacienteDocumentos(); setReceta(nuevaReceta()); setPdfUrl(''); setBusqueda(''); } }} />
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[1.1fr_1fr]">
      <div className="space-y-5">
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Datos de la receta</h2>
          <InstitucionSelector value={receta.institucion} onChange={v => cambiar('institucion', v)} />
          <Campo label="Nombre del paciente *" value={receta.paciente} onChange={v => cambiar('paciente', v)} autoComplete="off" />
          <div className="grid grid-cols-2 gap-3"><Campo label="RUT del paciente *" value={receta.rut} onChange={v => cambiar('rut', formatRut(v))} placeholder="12.345.678-9" /><Campo label="Edad (años) *" value={receta.edad} type="number" min="0" max="130" onChange={v => cambiar('edad', v)} /></div>
          {receta.rut && !rutValido && <p className="text-xs text-red-600" role="alert">Revisa el RUT y su dígito verificador.</p>}
          <Campo label="Dirección del paciente *" value={receta.direccion} onChange={v => cambiar('direccion', v)} />
          <Campo label="Fecha *" type="date" value={receta.fecha} onChange={v => cambiar('fecha', v)} />
          <Campo label="Dg. · Diagnóstico (opcional)" value={receta.diagnostico} onChange={v => cambiar('diagnostico', v)} />
        </section>
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Rp. · Medicamentos</h2>
          <Campo label="Buscar y agregar" type="search" placeholder="Ej.: losartán 50, metformina, loratadina…" value={busqueda} onChange={setBusqueda} />
          {busqueda.trim() ? <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200" aria-label="Presentaciones de medicamentos">
            {resultados.map(item => <div key={item.nombre} className="border-b border-slate-100 p-3 last:border-0">
              <p className="mb-2 text-sm font-semibold">{item.nombre}</p>
              <div className="flex flex-wrap gap-2">{item.presentaciones.map(presentacion => <button type="button" key={presentacion} onClick={() => agregar(item.nombre, presentacion)} aria-label={`Agregar ${item.nombre} ${presentacion}`} className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-left text-sm text-blue-900 hover:border-blue-500 hover:bg-blue-100 focus-visible:ring-2 focus-visible:ring-blue-500">{presentacion}</button>)}
                <button type="button" onClick={() => agregar(item.nombre)} className="rounded-lg px-2 py-2 text-sm text-slate-600 underline">{item.presentaciones.length ? 'Otra presentación' : 'Escribir presentación'}</button>
              </div>
            </div>)}
            {!resultados.length && <p className="p-3 text-sm text-slate-500">Sin coincidencias. Agrégalo manualmente.</p>}
          </div> : <div className="flex flex-wrap items-center gap-2"><span className="text-xs text-slate-500">Acceso rápido:</span>{['Losartán', 'Metformina', 'Atorvastatina', 'Paracetamol'].map(nombre => <button type="button" key={nombre} onClick={() => setBusqueda(nombre)} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs hover:bg-blue-50">{nombre}</button>)}</div>}
          <Button variant="outline" size="sm" onClick={() => agregar(busqueda.trim())}><Plus className="mr-2 h-4 w-4" />Agregar manualmente</Button>
          <div className="space-y-3">{receta.medicamentos.map((item, i) => {
            const opciones = RECETA_CATALOGO.find(m => m.nombre === item.nombre)?.presentaciones || [];
            return <article key={item.id} className="space-y-3 rounded-xl border border-blue-100 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-2"><h3 className="text-sm font-semibold">{i + 1}. {item.nombre || 'Nuevo medicamento'}</h3><Button size="icon" variant="ghost" aria-label={`Eliminar medicamento ${i + 1}`} onClick={() => cambiar('medicamentos', receta.medicamentos.filter(m => m.id !== item.id))}><Trash2 className="h-4 w-4" /></Button></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Campo label="Medicamento" value={item.nombre} onChange={v => editarItem(item.id, 'nombre', v)} />
                <Campo label="Presentación" placeholder="Concentración y forma" list={`presentaciones-${item.id}`} value={item.presentacion} onChange={v => editarItem(item.id, 'presentacion', v)} />
                <datalist id={`presentaciones-${item.id}`}>{opciones.map(p => <option key={p} value={p} />)}</datalist>
                <CampoOpciones label="Dosis *" autoFocus value={item.dosis} opciones={opcionesDosis(item.presentacion)} onChange={v => editarItem(item.id, 'dosis', v)} placeholder="Selecciona o escribe" id={`dosis-${item.id}`} />
                <CampoOpciones label="Vía *" value={item.via} opciones={VIAS_RECETA} onChange={v => editarItem(item.id, 'via', v)} placeholder="Ej.: oral" id={`via-${item.id}`} />
                <CampoOpciones label="Frecuencia *" value={item.frecuencia} opciones={[...FRECUENCIAS_RECETA, 'Una vez por semana', 'Dosis única']} onChange={v => editarItem(item.id, 'frecuencia', v)} placeholder="Ej.: cada 24 horas" id={`frecuencia-${item.id}`} onBlur={() => { if (/^\d+$/.test(item.frecuencia.trim())) editarItem(item.id, 'frecuencia', `Cada ${item.frecuencia.trim()} horas`); }} />
                <CampoOpciones label="Duración *" value={item.duracion} opciones={DURACIONES_RECETA} onChange={v => editarItem(item.id, 'duracion', v)} placeholder="Ej.: 30 días" id={`duracion-${item.id}`} onBlur={() => { if (/^\d+$/.test(item.duracion.trim())) editarItem(item.id, 'duracion', `${item.duracion.trim()} días`); }} />
              </div>
              <div className="flex flex-wrap gap-1.5" aria-label={`Frecuencias rápidas para ${item.nombre}`}>{FRECUENCIAS_RECETA.map(f => <button type="button" key={f} onClick={() => editarItem(item.id, 'frecuencia', f)} aria-pressed={item.frecuencia === f} className={`rounded-full border px-2.5 py-1.5 text-xs ${item.frecuencia === f ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-400'}`}>{f}</button>)}</div>
              <details className="text-sm"><summary className="cursor-pointer text-slate-600">Cantidad e instrucciones adicionales</summary><div className="mt-3 space-y-3"><Campo label="Cantidad total" placeholder="Ej.: 30 comprimidos" value={item.cantidad} onChange={v => editarItem(item.id, 'cantidad', v)} /><Campo label="Instrucciones adicionales" value={item.indicaciones} onChange={v => editarItem(item.id, 'indicaciones', v)} multiline rows={2} /></div></details>
            </article>;
          })}</div>
          <details className="text-xs text-slate-500"><summary className="cursor-pointer">Acerca del catálogo</summary><p className="mt-2 leading-relaxed">Presentaciones de referencia del arsenal local y <a className="underline" href="https://ascendlabs.cl/wp-content/uploads/2025/04/vademecum-2-1_compressed.pdf" target="_blank" rel="noreferrer">vademécum Ascend Chile</a>. No es un listado exhaustivo ni confirma stock. Puedes editar cualquier presentación. Consulta el <a className="underline" href="https://registrosanitario.ispch.gob.cl/" target="_blank" rel="noreferrer">registro ISP</a>. Las opciones de posología son atajos de escritura; la pauta la eliges tú.</p></details>
          <Campo label="Indicaciones generales" multiline rows={3} value={receta.observaciones} onChange={v => cambiar('observaciones', v)} />
        </section>
      </div>
      <aside className="min-w-0 space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="font-semibold">{MEDICO.nombre}</p><p className="text-sm text-slate-500">{MEDICO.titulo} · RUT {MEDICO.rut}</p>
          <label className="mt-4 flex items-center gap-3 rounded-lg border p-3 text-sm font-medium"><input type="checkbox" className="h-4 w-4 accent-blue-600" checked={receta.firma} onChange={e => cambiar('firma', e.target.checked)} />Incluir firma electrónica</label>
          <p className="mt-2 text-xs text-slate-500">{receta.firma ? 'Incluye leyenda de firma simple y la imagen de firma de la institución, si está disponible. No constituye firma electrónica avanzada.' : 'Se deja espacio en blanco para firma y timbre manuales.'}</p>
        </div>
        <section aria-label="Vista previa de la receta" className="break-words rounded-sm border border-slate-200 bg-white p-6 shadow-md sm:p-8">
          <div className="flex items-center gap-3 border-b-2 border-blue-900 pb-4"><img src={centro.logo} alt="" className="h-12 w-12 object-contain" /><div><p className="text-xs font-bold">{centro.nombre}</p><p className="text-[11px] text-slate-500">{centro.direccion}<br />Fono {centro.fono}</p></div></div>
          <h2 className="my-6 text-center text-lg font-bold tracking-widest">RECETA MÉDICA</h2>
          <div className="space-y-2 border-b pb-4 text-sm"><p><strong>Nombre:</strong> {receta.paciente || '________________________'}</p><p><strong>RUT:</strong> {receta.rut || '_______________'} <strong className="ml-3">Edad:</strong> {receta.edad || '___'} años</p><p><strong>Dirección:</strong> {receta.direccion || '________________________'}</p><p><strong>Fecha:</strong> {receta.fecha ? fechaLarga(receta.fecha) : '________________'}</p>{receta.diagnostico && <p><strong>Dg.:</strong> {receta.diagnostico}</p>}</div>
          <p className="mb-4 mt-6 font-serif text-3xl italic">Rp.</p>
          <ol className="min-h-36 list-decimal space-y-5 pl-5 text-sm leading-relaxed">{receta.medicamentos.map(item => <li key={item.id} className="whitespace-pre-wrap">{textoMedicamento(item) || 'Medicamento por completar'}</li>)}</ol>
          {receta.observaciones && <p className="mt-5 whitespace-pre-wrap text-sm"><strong>Indicaciones generales:</strong><br />{receta.observaciones}</p>}
          <div className="mx-auto mt-10 max-w-xs text-center">{receta.firma && centro.firma ? <img src={centro.firma} alt="Firma y timbre del profesional" className="mx-auto h-24 object-contain" /> : <div className="h-20" />}<p className="border-t border-slate-400 pt-2 text-sm font-bold">{MEDICO.nombre}</p><p className="text-xs">{MEDICO.titulo} · RUT {MEDICO.rut}</p><p className="mt-2 text-[10px] text-slate-500">{receta.firma ? 'Firma electrónica simple · No constituye firma electrónica avanzada' : 'Firma y timbre'}</p></div>
        </section>
        <div className="rounded-2xl border bg-white p-5"><div className="flex flex-wrap gap-2"><Button disabled={!!faltantes.length || generando} onClick={() => generar(false)}><Download className="mr-2 h-4 w-4" />{generando ? 'Generando…' : 'Descargar PDF'}</Button><Button variant="outline" disabled={!!faltantes.length || generando} onClick={() => generar(true)}><Eye className="mr-2 h-4 w-4" />Ver PDF / imprimir</Button></div>{faltantes.length > 0 && <p className="mt-3 text-xs text-slate-500">Completa: {faltantes.join('; ')}.</p>}</div>
        {pdfUrl && <section className="space-y-2"><a href={pdfUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-700 underline">Abrir PDF para imprimir</a><iframe title="Receta en PDF" src={pdfUrl} className="h-[650px] w-full rounded-lg border bg-white" /></section>}
      </aside>
    </main>
  </div>;
}
export default conPuertaAcceso(RecetaMedica, { storageKey: 'acceso_medico', descripcion: 'Ingresa el código de acceso para usar el generador de recetas.' });
