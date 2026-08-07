import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, Eye, FileSignature, Printer, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getMultiPrefill } from '@/lib/multiTemplatePrefill';

const today = () => new Date().toISOString().slice(0, 10);
const EMPTY = {
  nombre: '', rut: '', edad: '', telefono: '', domicilio: '', cuidador: '', telefonoCuidador: '',
  antecedentes: '', diagnosticos: '', anamnesis: '', motivo: '', planes: '', indicaciones: '',
  fechaDerivacion: today(), medicoDerivador: '',
  fechaConsentimiento: today(), representante: '', calidad: '',
  diagnosticoConsentimiento: '', acepta: '', autorizaInvestigacion: '',
};

const input = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100';
const textarea = `${input} resize-y`;

function formatDate(value) {
  if (!value) return '__ / __ / _____';
  const [y, m, d] = value.split('-');
  return `${d} / ${m} / ${y}`;
}

function formatRut(value) {
  const clean = String(value || '').replace(/[^0-9kK]/g, '').toUpperCase();
  if (!clean) return '';
  if (clean.length === 1) return clean;
  const body = clean.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${body}-${clean.slice(-1)}`;
}

function Field({ label, children, wide = false }) {
  return <label className={wide ? 'block sm:col-span-2' : 'block'}><span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>{children}</label>;
}

function Rule({ value = '', className = '' }) {
  return <span className={`inline-block min-h-[1.15em] border-b border-black px-1 align-bottom ${className}`}>{value || '\u00a0'}</span>;
}

function RuledText({ value, lines }) {
  const parts = String(value || '').split('\n');
  return <div>{Array.from({ length: lines }, (_, i) => <div key={i} className="hodom-rule">{parts[i] || '\u00a0'}</div>)}</div>;
}

function Logo() {
  return <img src="/logo-hospital.png" alt="Hospital Comunitario de Salud Familiar de Bulnes" className="hodom-logo" />;
}

function DerivacionDocument({ f }) {
  return <div className="hodom-doc derivacion-doc">
    <section className="hodom-sheet letter-sheet derivacion-sheet">
      <Logo />
      <h1>DERIVACIÓN<br />HODOM – HCSF BULNES</h1>
      <div className="patient-lines">
        <p>NOMBRE: <Rule value={f.nombre} className="grow" /></p>
        <p className="three"><span>RUT: <Rule value={f.rut} /></span><span>EDAD: <Rule value={f.edad} /></span><span>TELÉFONO: <Rule value={f.telefono} /></span></p>
        <p>DOMICILIO: <Rule value={f.domicilio} className="grow" /></p>
        <p>CUIDADOR PRINCIPAL: <Rule value={f.cuidador} className="grow" /></p>
        <p>TELÉFONO CUIDADOR PRINCIPAL: <Rule value={f.telefonoCuidador} className="grow" /></p>
      </div>
      <h2>ANTECEDENTES MÓRBIDOS RELEVANTES</h2><RuledText value={f.antecedentes} lines={6} />
      <h2>DIAGNÓSTICOS ACTUALES</h2><RuledText value={f.diagnosticos} lines={6} />
      <h2>ANAMNESIS Y EVOLUCIÓN CLÍNICA HOSPITALARIA</h2><RuledText value={f.anamnesis} lines={12} />
    </section>
    <section className="hodom-sheet letter-sheet derivacion-sheet second">
      <h2>MOTIVO DE DERIVACIÓN A HODOM</h2><RuledText value={f.motivo} lines={6} />
      <h2>PLANES Y OBJETIVOS A CUMPLIR EN HODOM</h2><RuledText value={f.planes} lines={6} />
      <h2>INDICACIONES MÉDICAS</h2><RuledText value={f.indicaciones} lines={12} />
      <div className="signature-lines">
        <p>FECHA: <Rule value={formatDate(f.fechaDerivacion)} /></p>
        <p>MÉDICO DERIVADOR: <Rule value={f.medicoDerivador} className="signature-rule" /></p>
        <p>FIRMA Y TIMBRE: <Rule className="signature-rule" /></p>
      </div>
    </section>
  </div>;
}

function ConsentimientoDocument({ f }) {
  const patient = f.nombre;
  return <div className="hodom-doc consentimiento-doc">
    <section className="hodom-sheet a4-sheet consentimiento-sheet">
      <div className="consent-header"><Logo /><h1>CONSENTIMIENTO INFORMADO HOSPITALIZACIÓN DOMICILIARIA</h1></div>
      <p className="date-line">FECHA: <Rule value={formatDate(f.fechaConsentimiento)} /></p>
      <p><b>NOMBRE DEL PACIENTE:</b> <Rule value={patient} className="long" /></p>
      <p><b>RUT:</b> <Rule value={f.rut} className="medium" /></p>
      <p><b>INFORMACIÓN</b></p>
      <p>YO <Rule value={f.representante} className="representative" />, MAYOR DE EDAD, ACTUANDO EN MI PROPIO NOMBRE O EN MI CALIDAD DE <Rule value={f.calidad} className="quality" /> (PARENTESCO) DEL PACIENTE <Rule value={patient} className="patient-inline" /> POR MEDIO DEL PRESENTE DOCUMENTO, DE MANERA EXPRESA, LIBRE, EN PLENO USO DE MIS FACULTADES MENTALES MANIFIESTO QUE EL MEDICO <Rule value={f.medicoDerivador} className="doctor-inline" /> ME HA EXPLICADO QUE LA CONCLUSION DEL ANALISIS DE ANTECENTES, DATOS DE HISTORIA CLINICA, EXAMEN FISICO, HISTORIA CLINICA Y PRUEBAS DIAGNOSTICAS DEBO (DEBE) SER HOSPITALIZADO EN DOMICILIO.</p>
      <p>ME HA MANIFESTADO QUE TAL DETERMINACIÓN ESTA FUNDAMENTADA EN UN DIAGNÓSTICO DE: <Rule value={f.diagnosticoConsentimiento} className="diagnosis" /></p>
      <p>ENTIENDO QUE LA INFORMACIÓN QUE ENTREGUE INFLUIRÁ EN LA ORIENTACIÓN DEL DIAGNÓSTICO, SEGUIMIENTO Y ÉXITO DEL TRATAMIENTO. TAMBIÉN COMPRENDO QUE DURANTE LA HOSPITALIZACIÓN PUEDEN SER REQUERIDOS DIVERSOS EXÁMENES Y PROCEDIMIENTOS QUE PUEDEN RESULTAR INCÓMODOS Y DOLOROSOS, LOS CUALES ACEPTO EN LA MEDIDA EN QUE SEAN NECESARIOS PARA LA RECUPERACIÓN.</p>
      <p>EL PERSONAL DE SALUD ME HA EXPLICADO:</p>
      <ol><li>LAS POSIBLES CONSECUENCIAS EN CASO DE NEGARSE A REALIZAR EXÁMENES DIAGNÓSTICO, LOS PROCEDIMIENTOS Y TRATAMIENTOS PROPUESTOS, SOLICITANDO ASUMIR LA RESPONSABILIDAD DE ELLAS Y QUE ESO NO SIGNIFICA QUE PIERDA LOS DERECHOS DE UNA ATENCIÓN POSTERIOR</li><li>QUE EL TRATAMIENTO NO GARANTIZA LA MEJORÍA DE LA ENFERMEDAD.</li><li>QUE, EN CASO DE SER NECESARIO, PODRÍA SER TRASLADADO AL HOSPITAL COMUNITARIO DE SALUD FAMILIAR DE BULNES U OTRA INSTITUCIÓN CON LA QUE EXISTA CONVENIO PARA COMPLETAR ESTUDIO Y/O TRATAMIENTO, PARA LO CUAL ME SOLICITARAN LA AUTORIZACIÓN ESCRITA Y QUE ELLO SERÁ INFORMADO EN FORMA INMEDIATA A MI FAMILIAR O CUIDADOR RESPONSABLE.</li></ol>
      <p>DOY CONSTANCIA QUE SE ME HA EXPLICADO EN LENGUAJE SENCILLO, CLARO Y TOTALMENTE ENTENDIBLE PARA MI, LOS ASPECTOS RELACIONADOS CON LA CONDICIÓN ACTUAL, ESTUDIO Y TRATAMIENTO DE LA ENFERMEDAD, Y SE ME HA PERMITIDO HACER TODAS LAS PREGUNTAS NECESARIAS, LAS CUALES HAN SIDO RESPONDIDAS SATISFACTORIAMENTE.</p>
      <div className="authorization"><p>AUTORIZACIÓN (Como resultado de la información recibida)</p><p>ACEPTO <Rule value={f.acepta === 'si' ? 'X' : ''} className="choice" /> <span className="choice-gap">NO ACEPTO <Rule value={f.acepta === 'no' ? 'X' : ''} className="choice" /></span></p><p>La hospitalización, las condiciones y objetivos propuestos para el estudio y tratamiento así como los riesgos que conlleva la hospitalización.</p><p>Yo (si/ no) <Rule value={f.autorizaInvestigacion === 'si' ? 'Sí' : f.autorizaInvestigacion === 'no' ? 'No' : ''} className="choice" /> AUTORIZO que los datos de la historia clínica sean utilizados en investigaciones de carácter científico en las condiciones que me fueron explicadas</p><div className="signatures"><div><Rule className="sign" /><br />Firma Paciente, Familiar<br />o Cuidador</div><div><Rule className="sign" /><br />Firma y timbre Médico</div></div></div>
    </section>
  </div>;
}

export default function FormulariosHODOM() {
  const [active, setActive] = useState('derivacion');
  const [f, setF] = useState(EMPTY);
  const [preview, setPreview] = useState(false);
  const update = useCallback((key, value) => setF(old => ({ ...old, [key]: value })), []);
  useEffect(() => { const p = getMultiPrefill(); if (p) setF(old => ({ ...old, nombre: p.patient_name || '', rut: formatRut(p.patient_rut), telefono: p.patient_telefono || '', domicilio: p.patient_direccion || '', diagnosticoConsentimiento: p.diagnostico || '' })); }, []);
  const reset = () => setF({ ...EMPTY, fechaDerivacion: today(), fechaConsentimiento: today() });
  const longField = (key, label, rows = 5) => <Field label={label} wide><textarea className={textarea} rows={rows} value={f[key]} onChange={e => update(key, e.target.value)} /></Field>;

  return <>
    <style>{`
      @page { size: ${active === 'derivacion' ? 'Letter' : 'A4'}; margin: 0; }
      .hodom-doc{color:#000;background:#e2e8f0;font-family:Arial,sans-serif}.hodom-sheet{position:relative;margin:0 auto 18px;background:#fff;box-sizing:border-box;overflow:hidden}.letter-sheet{width:216mm;height:279mm}.a4-sheet{width:210mm;height:297mm}.hodom-logo{width:26mm;height:24mm;object-fit:contain}.derivacion-sheet{padding:14mm 18mm 12mm;font-family:'Times New Roman',serif;font-size:12pt;line-height:1.2}.derivacion-sheet h1{text-align:center;font-size:14pt;line-height:1.25;margin:-2mm 0 6mm}.derivacion-sheet h2{font-size:12pt;margin:8mm 0 5mm}.derivacion-sheet .patient-lines p{display:flex;align-items:baseline;margin:0 0 5mm;gap:2mm}.derivacion-sheet .three{justify-content:space-between}.derivacion-sheet .three>span{white-space:nowrap}.derivacion-sheet .grow{flex:1}.hodom-rule{height:6.35mm;border-bottom:.45pt solid #111;white-space:nowrap;overflow:hidden;padding:1mm 1.5mm 0}.derivacion-sheet.second{padding-top:15mm}.derivacion-sheet.second h2:first-child{margin-top:0}.signature-lines{margin-top:10mm}.signature-lines p{margin:0 0 4mm}.signature-rule{width:82mm}
      .consentimiento-sheet{padding:17mm 18mm 14mm;font-family:Arial,sans-serif;font-size:9pt;line-height:1.42;text-align:justify}.consent-header{display:flex;align-items:center;gap:2mm;margin-bottom:-1mm}.consent-header h1{font-size:13pt;white-space:nowrap}.consentimiento-sheet p{margin:0 0 2.1mm}.consentimiento-sheet .date-line{text-align:right;font-size:11pt;margin-bottom:1mm}.consentimiento-sheet .long{width:118mm}.consentimiento-sheet .medium{width:75mm}.representative{width:93mm}.quality{width:39mm}.patient-inline{width:82mm}.doctor-inline{width:64mm}.diagnosis{display:block;width:100%;height:5mm}.consentimiento-sheet ol{display:block;list-style-type:decimal;list-style-position:outside;margin:0 0 5mm 10mm;padding-left:4mm}.consentimiento-sheet li{display:list-item;padding-left:3mm}.authorization{border:1pt solid #000;padding:2mm;font-size:9.5pt;text-align:left}.choice{width:15mm;text-align:center}.choice-gap{margin-left:27mm}.signatures{display:flex;justify-content:space-between;text-align:center;margin:12mm 2mm 0}.sign{width:51mm}
      @media screen{.hodom-preview-wrap{overflow:auto;border-radius:12px;background:#cbd5e1;padding:18px}.hodom-doc{width:max-content}.hodom-sheet{box-shadow:0 2px 12px #64748b66}}
      @media print{html,body,#root{background:#fff!important}.hodom-screen{display:none!important}.hodom-print{display:block!important}.hodom-doc{background:#fff}.hodom-sheet{margin:0;box-shadow:none;break-after:page}.hodom-sheet:last-child{break-after:auto}}
      .hodom-print{display:none}
    `}</style>
    <div className="hodom-screen min-h-screen bg-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur"><div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3"><Button variant="ghost" size="icon" onClick={() => window.history.back()}><ChevronLeft className="h-5 w-5" /></Button><div className="min-w-0 flex-1"><h1 className="truncate font-bold text-slate-900">Hospitalización Domiciliaria (HODOM)</h1><p className="text-xs text-slate-500">Formularios oficiales editables · HCSF Bulnes</p></div><Button variant="outline" size="sm" onClick={reset}><RotateCcw className="mr-1 h-4 w-4" />Limpiar</Button><Button size="sm" onClick={() => window.print()}><Printer className="mr-1 h-4 w-4" />Imprimir</Button></div></header>
      <main className="mx-auto max-w-5xl p-4"><div className="mb-4 grid grid-cols-2 rounded-xl border bg-white p-1"><button onClick={() => setActive('derivacion')} className={`rounded-lg px-3 py-2 text-sm font-semibold ${active === 'derivacion' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}>Derivación HODOM</button><button onClick={() => setActive('consentimiento')} className={`rounded-lg px-3 py-2 text-sm font-semibold ${active === 'consentimiento' ? 'bg-blue-600 text-white' : 'text-slate-600'}`}>Consentimiento informado</button></div>
        <div className="mb-4 flex items-center justify-between"><p className="text-sm text-slate-600">{active === 'derivacion' ? 'Original en tamaño Carta, 2 páginas.' : 'Original en tamaño A4, 1 página.'}</p><Button variant="outline" size="sm" onClick={() => setPreview(v => !v)}><Eye className="mr-1 h-4 w-4" />{preview ? 'Ocultar vista previa' : 'Vista previa'}</Button></div>
        {!preview && <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="mb-5 flex items-center gap-2"><FileSignature className="h-5 w-5 text-blue-600" /><h2 className="font-semibold">Campos editables</h2></div><div className="grid gap-4 sm:grid-cols-2">
          {active === 'derivacion' ? <><Field label="Nombre" wide><input className={input} value={f.nombre} onChange={e => update('nombre', e.target.value)} /></Field><Field label="RUT"><input className={input} value={f.rut} onChange={e => update('rut', formatRut(e.target.value))} /></Field><Field label="Edad"><input className={input} value={f.edad} onChange={e => update('edad', e.target.value)} /></Field><Field label="Teléfono"><input className={input} value={f.telefono} onChange={e => update('telefono', e.target.value)} /></Field><Field label="Domicilio"><input className={input} value={f.domicilio} onChange={e => update('domicilio', e.target.value)} /></Field><Field label="Cuidador principal"><input className={input} value={f.cuidador} onChange={e => update('cuidador', e.target.value)} /></Field><Field label="Teléfono cuidador"><input className={input} value={f.telefonoCuidador} onChange={e => update('telefonoCuidador', e.target.value)} /></Field>{longField('antecedentes','Antecedentes mórbidos relevantes')}{longField('diagnosticos','Diagnósticos actuales')}{longField('anamnesis','Anamnesis y evolución clínica hospitalaria',8)}{longField('motivo','Motivo de derivación a HODOM')}{longField('planes','Planes y objetivos a cumplir en HODOM')}{longField('indicaciones','Indicaciones médicas',8)}<Field label="Fecha"><input type="date" className={input} value={f.fechaDerivacion} onChange={e => update('fechaDerivacion', e.target.value)} /></Field><Field label="Médico derivador"><input className={input} value={f.medicoDerivador} onChange={e => update('medicoDerivador', e.target.value)} /></Field></> : <><Field label="Fecha"><input type="date" className={input} value={f.fechaConsentimiento} onChange={e => update('fechaConsentimiento', e.target.value)} /></Field><Field label="Nombre del paciente"><input className={input} value={f.nombre} onChange={e => update('nombre', e.target.value)} /></Field><Field label="RUT"><input className={input} value={f.rut} onChange={e => update('rut', formatRut(e.target.value))} /></Field><Field label="Nombre de quien consiente"><input className={input} value={f.representante} onChange={e => update('representante', e.target.value)} /></Field><Field label="Calidad / parentesco"><input className={input} value={f.calidad} onChange={e => update('calidad', e.target.value)} /></Field><Field label="Médico que informa"><input className={input} value={f.medicoDerivador} onChange={e => update('medicoDerivador', e.target.value)} /></Field><Field label="Diagnóstico" wide><input className={input} value={f.diagnosticoConsentimiento} onChange={e => update('diagnosticoConsentimiento', e.target.value)} /></Field><Field label="Decisión"><select className={input} value={f.acepta} onChange={e => update('acepta', e.target.value)}><option value="">Sin marcar</option><option value="si">Acepto</option><option value="no">No acepto</option></select></Field><Field label="Uso científico de datos"><select className={input} value={f.autorizaInvestigacion} onChange={e => update('autorizaInvestigacion', e.target.value)}><option value="">Sin marcar</option><option value="si">Sí autorizo</option><option value="no">No autorizo</option></select></Field></>}
        </div></div>}
        {preview && <div className="hodom-preview-wrap">{active === 'derivacion' ? <DerivacionDocument f={f} /> : <ConsentimientoDocument f={f} />}</div>}
      </main>
    </div>
    <div className="hodom-print">{active === 'derivacion' ? <DerivacionDocument f={f} /> : <ConsentimientoDocument f={f} />}</div>
  </>;
}
