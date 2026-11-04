import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { conPuertaAcceso } from '@/components/PuertaAcceso';
import { nuevoInformeComplementario, fechaInforme } from '@/lib/informeComplementario';
import styles from '@/components/documentos/informe-complementario.css?raw';

const frameHtml = `<!doctype html><html lang="es"><head><meta charset="UTF-8"><title>Informe complementario de médico tratante</title><style>${styles}</style></head><body><div id="report"></div></body></html>`;

function Field({ name, label, values, update, type = 'text', className = '', longDate = false }) {
  return <span className={`field ${className}`}>
    <input className="editable" type={type} aria-label={label} value={values[name]} onChange={event => update(name, event.target.value)} />
    <span className="print-value">{type === 'date' ? fechaInforme(values[name], longDate) : values[name]}</span>
  </span>;
}

function Narrative({ name, label, values, update, lines }) {
  const ref = useRef(null);
  const height = `${lines * 4.7}mm`;
  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.height = 'auto';
    ref.current.style.height = `${ref.current.scrollHeight}px`;
  }, [values[name]]);
  return <>
    <textarea ref={ref} className="narrative" style={{ minHeight: height }} aria-label={label} value={values[name]}
      onChange={event => update(name, event.target.value)} />
    <div className="print-value narrative-print" style={{ minHeight: height }}>{values[name] || '\u00a0'}</div>
  </>;
}

function InformeComplementario() {
  const navigate = useNavigate();
  const [values, setValues] = useState(nuevoInformeComplementario);
  const [host, setHost] = useState(null);
  const [logoReady, setLogoReady] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const frame = useRef(null);
  const update = (name, value) => setValues(current => ({ ...current, [name]: value }));
  const field = (name, label, extra = {}) => <Field name={name} label={label} values={values} update={update} {...extra} />;
  const narrative = (name, label, lines) => <Narrative name={name} label={label} values={values} update={update} lines={lines} />;
  function fit() {
    if (frame.current?.contentDocument) frame.current.contentDocument.documentElement.style.setProperty('--preview-scale', String(Math.max(0.1, Math.min(1, (frame.current.clientWidth - 24) / 816))));
  }
  useEffect(() => {
    const observer = new ResizeObserver(fit);
    if (frame.current) observer.observe(frame.current);
    return () => observer.disconnect();
  }, []);
  function reset() {
    if (window.confirm('¿Borrar los datos y comenzar un informe nuevo?')) setValues(nuevoInformeComplementario());
  }
  function print() {
    const doc = frame.current.contentDocument;
    for (const input of doc.querySelectorAll('input')) if (!input.reportValidity()) return;
    doc.activeElement?.blur();
    frame.current.contentWindow.focus();
    frame.current.contentWindow.print();
  }
  return <div className="min-h-screen bg-slate-50 p-4 pb-24">
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="icon" aria-label="Volver" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="flex-1 text-xl font-bold">Informe complementario de médico tratante</h1>
        <Button onClick={print} disabled={!host || !logoReady}><Printer className="mr-2 h-4 w-4" />Imprimir / Guardar PDF</Button>
        <Button variant="outline" onClick={reset}><RotateCcw className="mr-2 h-4 w-4" />Nuevo informe</Button>
      </div>
      <p className="text-sm text-slate-600">Completa el documento directamente. Las fechas superior e inferior están precargadas y puedes modificarlas. Firma y timbre se completan en papel.</p>
      {logoError && <p role="alert" className="text-sm text-red-700">No se pudo cargar el logo del hospital. Recarga la página antes de imprimir.</p>}
      <iframe ref={frame} title="Informe complementario editable" srcDoc={frameHtml} sandbox="allow-same-origin allow-modals"
        onLoad={() => { setHost(frame.current.contentDocument.getElementById('report')); fit(); }}
        className="h-[80vh] min-h-[550px] w-full rounded-lg border bg-slate-200" />
      {host && createPortal(<article className="sheet">
        <header className="letterhead">
          <img className="logo" src="/logo-hospital.png" alt="Hospital Comunitario de Salud Familiar de Bulnes · Servicio de Salud Ñuble"
            onLoad={() => { setLogoReady(true); setLogoError(false); }} onError={() => { setLogoReady(false); setLogoError(true); }} />
          <div className="metadata">
            <div>{field('lugar', 'Lugar de emisión', { className: 'place' })}, {field('fechaSuperior', 'Fecha superior', { type: 'date', className: 'date', longDate: true })}</div>
            <div className="row"><strong>Lic. Méd. N°</strong><span className="grow">{field('licencia', 'Número de licencia médica', { className: 'wide' })}</span></div>
          </div>
        </header>
        <h1>Informe complementario de médico tratante</h1>
        <section className="request">
          <div className="row"><strong>Dr.(a)</strong><span className="grow">{field('destinatario', 'Médico destinatario', { className: 'wide' })}</span></div>
          <p>En virtud de la normativa vigente, respecto de la(s) licencia(s) médica(s) que cursa vuestro(a) paciente y se tramitan en esta Subcomisión de la COMPIN Regional, se requiere de Ud. el Informe Complementario siguiente.</p>
          <p style={{ textAlign: 'center' }}>Atte.</p>
          <div className="compin">COMPIN {field('compin', 'Subcomisión COMPIN')}</div>
        </section>
        <p className="hint">(Sírvase escribir con letra clara y legible)</p>
        <div className="row"><strong>Nombre paciente:</strong><span className="grow">{field('paciente', 'Nombre del paciente', { className: 'wide' })}</span><strong>RUN:</strong>{field('rut', 'RUN del paciente')}</div>
        <section className="section"><h2>DIAGNÓSTICO(S):</h2>{narrative('diagnosticos', 'Diagnósticos', 2)}</section>
        <section className="section"><h2>1. Breve historia, fundamentos clínicos y/o de laboratorio y/o de imagenología en que se basa el diagnóstico, (precisar si la enfermedad o lesión es o no de origen laboral):</h2>
          {narrative('historia', 'Historia y fundamentos clínicos; origen laboral', 7)}
        </section>
        <section className="section"><h2>2. Evolución, tratamientos médicos y/o quirúrgicos efectuados (fecha de operación, si procede), resultados obtenidos:</h2>
          {narrative('evolucion', 'Evolución, tratamientos y resultados', 4)}
        </section>
        <section className="prognosis"><h2>3. Pronóstico: indicar si la patología desde el punto de vista laboral <u>¿es recuperable?</u></h2>
          <div className="choice-row"><label className="choice"><input type="checkbox" checked={values.recuperable === 'si'} onChange={() => update('recuperable', values.recuperable === 'si' ? '' : 'si')} /><span className="print-mark">{values.recuperable === 'si' ? 'X' : '___'}</span>SÍ</label><span>Fecha probable de alta (reintegro laboral):</span>{field('fechaAlta', 'Fecha probable de alta', { type: 'date', className: 'date' })}</div>
          <div className="choice-row"><label className="choice"><input type="checkbox" checked={values.recuperable === 'no'} onChange={() => update('recuperable', values.recuperable === 'no' ? '' : 'no')} /><span className="print-mark">{values.recuperable === 'no' ? 'X' : '___'}</span>NO</label><span>Debe iniciar trámite de invalidez a contar de:</span>{field('fechaInvalidez', 'Fecha de inicio de trámite de invalidez', { type: 'date', className: 'date' })}</div>
        </section>
        <footer className="signature">
          <div className="signature-space" />
          <div>Nombre, especialidad, firma y timbre de médico tratante.</div>
          <div className="row" style={{ marginTop: '2mm' }}><span className="grow">{field('medico', 'Nombre del médico tratante', { className: 'wide' })}</span><span className="grow">{field('especialidad', 'Especialidad del médico', { className: 'wide' })}</span></div>
          <div className="footer-row"><div>Teléfono: {field('telefono', 'Teléfono del médico', { type: 'tel' })}</div><div><strong>Fecha del informe:</strong> {field('fechaInforme', 'Fecha inferior del informe', { type: 'date', className: 'date' })}</div></div>
          <p className="note">NOTA: La entrega oportuna de este informe permitirá resolver mejor sobre la situación que afecta a su paciente. Se agradece su colaboración.</p>
        </footer>
      </article>, host)}
    </div>
  </div>;
}

export default conPuertaAcceso(InformeComplementario, {
  storageKey: 'acceso_medico', descripcion: 'Ingresa el código de acceso para completar el informe complementario.',
});
