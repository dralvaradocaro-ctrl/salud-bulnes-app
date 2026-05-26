import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronLeft, Printer, RotateCcw, Plus, Trash2, ShieldPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const RECOMENDACIONES = [
  'Continuar mismo esquema',
  'Desescalar (ajustar según cultivo)',
  'Cambiar de antibiótico',
  'Suspender (no requiere ATB)',
  'Ajustar dosis (función renal / peso)',
  'Pasar a vía oral (terapia secuencial)',
  'Completar duración programada',
  'Solicitar nuevos cultivos',
  'Solicitar interconsulta Infectología',
  'Otra (especificar abajo)',
];

const ACEPTACION_OPCIONES = ['Aceptada', 'Aceptada parcial', 'Rechazada', 'Pendiente respuesta'];

function formatRut(raw) {
  if (!raw) return '';
  const clean = String(raw).replace(/[^0-9kK]/g, '').toUpperCase();
  if (!clean) return '';
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  if (!body) return dv;
  return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}`;
}

function todayIso() { return new Date().toISOString().slice(0, 10); }
function formatDateLocal(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}-${m}-${y}`;
}

const EMPTY_ATB = { nombre: '', via: 'EV', dosis: '', dia_tto: '', inicio: '' };

const EMPTY = {
  fecha: '',
  servicio: '',
  cama: '',
  paciente: '',
  rut: '',
  edad: '',
  n_ficha: '',
  diagnostico: '',
  foco_infeccioso: '',
  comorbilidades: '',
  alergias: '',
  funcion_renal: '',
  cultivos: '',
  imagenes: '',
  parametros_inflamatorios: '',
  antibioticos: [{ ...EMPTY_ATB }],
  evolucion: '',
  recomendaciones: [],
  recomendaciones_otra: '',
  plan_duracion: '',
  proxima_revision: '',
  aceptacion: '',
  medico_tratante: '',
  equipo_proa: '',
};

function HospitalLogo() {
  const [failed, setFailed] = useState(false);
  if (!failed) {
    return (
      <img
        src="/logo-hospital.png"
        alt="Hospital Comunitario de Salud Familiar de Bulnes"
        style={{ height: '46px', width: 'auto', objectFit: 'contain', display: 'block' }}
        onError={() => setFailed(true)}
      />
    );
  }
  return null;
}

export default function VisitaPROA() {
  const [f, setF] = useState({ ...EMPTY, fecha: todayIso() });
  const [showPreview, setShowPreview] = useState(false);
  const u = (k, v) => setF(prev => ({ ...prev, [k]: v }));
  const clear = () => setF({ ...EMPTY, fecha: todayIso() });

  const toggleRec = (rec) => {
    setF(prev => ({
      ...prev,
      recomendaciones: prev.recomendaciones.includes(rec)
        ? prev.recomendaciones.filter(r => r !== rec)
        : [...prev.recomendaciones, rec],
    }));
  };

  const updateAtb = (idx, key, value) => {
    setF(prev => ({
      ...prev,
      antibioticos: prev.antibioticos.map((a, i) => i === idx ? { ...a, [key]: value } : a),
    }));
  };
  const addAtb = () => setF(prev => ({ ...prev, antibioticos: [...prev.antibioticos, { ...EMPTY_ATB }] }));
  const removeAtb = (idx) => setF(prev => ({
    ...prev,
    antibioticos: prev.antibioticos.length > 1 ? prev.antibioticos.filter((_, i) => i !== idx) : prev.antibioticos,
  }));

  return (
    <>
      <style>{`
        @page { size: A4 portrait; margin: 10mm 12mm; }
        @media print {
          html, body { padding: 0 !important; margin: 0 !important; background: #fff !important; }
          html, body, #root, body > div { background: #fff !important; }
          .proa-screen-only { display: none !important; }
          .proa-pdf-viewer { background: #fff !important; padding: 0 !important; min-height: 0 !important; }
          .proa-print-page {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            max-width: none !important;
            width: 100% !important;
            min-height: 0 !important;
          }
        }
        .proa-pdf-viewer {
          background: #525659;
          padding: 24px 16px;
          min-height: calc(100vh - 60px);
        }
        .proa-pdf-viewer .proa-print-page {
          background: #fff;
          box-shadow: 0 8px 28px rgba(0,0,0,0.45);
          width: 210mm;
          margin: 0 auto;
        }
      `}</style>

      <div className="proa-screen-only sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to={createPageUrl('Category?id=696ea6ff245ef362de4f431c')}>
            <Button variant="ghost" size="icon" className="rounded-xl"><ChevronLeft className="h-5 w-5" /></Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldPlus className="h-4 w-4 text-teal-600" />
              Visita PROA — Evolución
            </h1>
            <p className="text-xs text-slate-500">Programa de Optimización del Uso de Antimicrobianos · HCSFB</p>
          </div>
          <Button variant="outline" size="sm" onClick={clear} className="gap-1.5">
            <RotateCcw className="h-4 w-4" /> Limpiar
          </Button>
          {showPreview && (
            <>
              <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>Volver a datos</Button>
              <Button size="sm" onClick={() => window.print()} className="gap-1.5 bg-teal-600 hover:bg-teal-700">
                <Printer className="h-4 w-4" /> Imprimir / PDF
              </Button>
            </>
          )}
        </div>
      </div>

      {!showPreview && (
        <div className="proa-screen-only max-w-4xl mx-auto px-4 mt-4 pb-12">
          <div className="rounded-2xl border border-teal-200 bg-teal-50/40 p-4 space-y-4">

            {/* Identificación */}
            <Section title="Identificación">
              <Grid>
                <Field label="Fecha de visita">
                  <Input type="date" value={f.fecha} onChange={e => u('fecha', e.target.value)} className="h-9" />
                </Field>
                <Field label="Servicio">
                  <Input value={f.servicio} onChange={e => u('servicio', e.target.value)} placeholder="MQ1, MQ2, Pediatría, Urgencia…" className="h-9" />
                </Field>
                <Field label="Cama">
                  <Input value={f.cama} onChange={e => u('cama', e.target.value)} className="h-9" placeholder="Ej: 12" />
                </Field>
                <Field label="N° Ficha">
                  <Input value={f.n_ficha} onChange={e => u('n_ficha', e.target.value)} className="h-9" />
                </Field>
                <Field label="Paciente" span="md:col-span-3">
                  <Input value={f.paciente} onChange={e => u('paciente', e.target.value)} className="h-9" />
                </Field>
                <Field label="Edad">
                  <Input value={f.edad} onChange={e => u('edad', e.target.value)} className="h-9" placeholder="años" />
                </Field>
                <Field label="RUT" span="md:col-span-2">
                  <Input value={f.rut} onChange={e => u('rut', formatRut(e.target.value))} className="h-9" placeholder="12.345.678-9" />
                </Field>
                <Field label="Alergias" span="md:col-span-2">
                  <Input value={f.alergias} onChange={e => u('alergias', e.target.value)} className="h-9" placeholder="Ninguna conocida" />
                </Field>
              </Grid>
            </Section>

            {/* Contexto clínico */}
            <Section title="Contexto clínico">
              <Grid>
                <Field label="Diagnóstico principal" span="md:col-span-2">
                  <Input value={f.diagnostico} onChange={e => u('diagnostico', e.target.value)} className="h-9" />
                </Field>
                <Field label="Foco infeccioso" span="md:col-span-2">
                  <Input value={f.foco_infeccioso} onChange={e => u('foco_infeccioso', e.target.value)} placeholder="Pulmonar, urinario, abdominal…" className="h-9" />
                </Field>
                <Field label="Comorbilidades" span="md:col-span-2">
                  <Input value={f.comorbilidades} onChange={e => u('comorbilidades', e.target.value)} className="h-9" />
                </Field>
                <Field label="Función renal" span="md:col-span-2">
                  <Input value={f.funcion_renal} onChange={e => u('funcion_renal', e.target.value)} placeholder="ClCr / Creatinina" className="h-9" />
                </Field>
                <Field label="Parámetros inflamatorios" span="md:col-span-4">
                  <Input value={f.parametros_inflamatorios} onChange={e => u('parametros_inflamatorios', e.target.value)} placeholder="PCR, Leucos, PCT, fiebre 24-48h…" className="h-9" />
                </Field>
                <Field label="Cultivos" span="md:col-span-2">
                  <Textarea value={f.cultivos} onChange={e => u('cultivos', e.target.value)} className="min-h-[60px]" placeholder="Tipo de muestra, microorganismo, sensibilidad" />
                </Field>
                <Field label="Imágenes / hallazgos" span="md:col-span-2">
                  <Textarea value={f.imagenes} onChange={e => u('imagenes', e.target.value)} className="min-h-[60px]" />
                </Field>
              </Grid>
            </Section>

            {/* Antibióticos actuales */}
            <Section title="Antibióticos en curso" right={
              <Button size="sm" variant="outline" onClick={addAtb} className="gap-1 text-xs h-7"><Plus className="h-3 w-3" /> Agregar</Button>
            }>
              <div className="space-y-2">
                {f.antibioticos.map((a, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-12 md:col-span-4">
                      <label className="block text-[11px] text-slate-600 mb-0.5">Antibiótico</label>
                      <Input value={a.nombre} onChange={e => updateAtb(i, 'nombre', e.target.value)} className="h-9" placeholder="Ej: Ceftriaxona" />
                    </div>
                    <div className="col-span-4 md:col-span-1">
                      <label className="block text-[11px] text-slate-600 mb-0.5">Vía</label>
                      <select value={a.via} onChange={e => updateAtb(i, 'via', e.target.value)} className="w-full h-9 rounded-md border border-slate-200 px-2 text-sm bg-white">
                        {['EV', 'IM', 'VO', 'SC'].map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div className="col-span-8 md:col-span-3">
                      <label className="block text-[11px] text-slate-600 mb-0.5">Dosis / frecuencia</label>
                      <Input value={a.dosis} onChange={e => updateAtb(i, 'dosis', e.target.value)} className="h-9" placeholder="1 g c/24h" />
                    </div>
                    <div className="col-span-5 md:col-span-2">
                      <label className="block text-[11px] text-slate-600 mb-0.5">Día de tto</label>
                      <Input value={a.dia_tto} onChange={e => updateAtb(i, 'dia_tto', e.target.value)} className="h-9" placeholder="3 de 7" />
                    </div>
                    <div className="col-span-5 md:col-span-2">
                      <label className="block text-[11px] text-slate-600 mb-0.5">Inicio</label>
                      <Input type="date" value={a.inicio} onChange={e => updateAtb(i, 'inicio', e.target.value)} className="h-9" />
                    </div>
                    <div className="col-span-2 md:col-span-12 md:flex md:justify-end">
                      <Button variant="ghost" size="icon" onClick={() => removeAtb(i)} className="h-8 w-8 text-rose-600 hover:bg-rose-50" title="Quitar">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Evolución */}
            <Section title="Evolución clínica">
              <Textarea value={f.evolucion} onChange={e => u('evolucion', e.target.value)} className="min-h-[80px]" placeholder="Tendencia, respuesta al tratamiento, eventos relevantes…" />
            </Section>

            {/* Recomendaciones PROA */}
            <Section title="Recomendaciones del equipo PROA">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                {RECOMENDACIONES.map(rec => (
                  <label key={rec} className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer hover:bg-teal-50/60 rounded px-1 py-0.5">
                    <input
                      type="checkbox"
                      checked={f.recomendaciones.includes(rec)}
                      onChange={() => toggleRec(rec)}
                      className="mt-1 accent-teal-600"
                    />
                    <span>{rec}</span>
                  </label>
                ))}
              </div>
              {f.recomendaciones.includes('Otra (especificar abajo)') && (
                <Input
                  value={f.recomendaciones_otra}
                  onChange={e => u('recomendaciones_otra', e.target.value)}
                  placeholder="Especificar otra recomendación…"
                  className="h-9 mt-2"
                />
              )}
              <Grid className="mt-3">
                <Field label="Plan / duración total propuesta" span="md:col-span-2">
                  <Input value={f.plan_duracion} onChange={e => u('plan_duracion', e.target.value)} className="h-9" placeholder="Ej: completar 7 días totales (hasta 12-06)" />
                </Field>
                <Field label="Próxima revisión" span="md:col-span-2">
                  <Input type="date" value={f.proxima_revision} onChange={e => u('proxima_revision', e.target.value)} className="h-9" />
                </Field>
              </Grid>
            </Section>

            {/* Respuesta del tratante + firmas */}
            <Section title="Aceptación / firmas">
              <Grid>
                <Field label="Aceptación del tratante" span="md:col-span-2">
                  <select
                    value={f.aceptacion}
                    onChange={e => u('aceptacion', e.target.value)}
                    className="w-full h-9 rounded-md border border-slate-200 px-2 text-sm bg-white"
                  >
                    <option value="">— Seleccionar —</option>
                    {ACEPTACION_OPCIONES.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </Field>
                <Field label="Médico tratante" span="md:col-span-2">
                  <Input value={f.medico_tratante} onChange={e => u('medico_tratante', e.target.value)} className="h-9" />
                </Field>
                <Field label="Equipo PROA" span="md:col-span-4">
                  <Input value={f.equipo_proa} onChange={e => u('equipo_proa', e.target.value)} className="h-9" placeholder="Nombres del equipo que realiza la visita" />
                </Field>
              </Grid>
            </Section>

            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={clear}>Limpiar</Button>
              <Button onClick={() => setShowPreview(true)} className="bg-teal-600 hover:bg-teal-700 gap-2">
                Generar formulario →
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Vista impresa */}
      {showPreview && (
        <div className="proa-pdf-viewer">
          <div
            className="proa-print-page"
            style={{ padding: '12mm', fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '10pt', color: '#000' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12pt', marginBottom: '8pt' }}>
              <HospitalLogo />
              <div style={{ flex: 1, fontSize: '9pt', lineHeight: 1.3 }}>
                <p style={{ margin: 0 }}>Hospital Comunitario de Salud Familiar de Bulnes</p>
                <p style={{ margin: 0 }}>Servicio Salud Ñuble</p>
                <p style={{ margin: 0, fontWeight: 'bold', marginTop: '2pt' }}>Programa de Optimización del Uso de Antimicrobianos (PROA)</p>
              </div>
              <div style={{ textAlign: 'right', fontSize: '9pt' }}>
                <p style={{ margin: 0, fontWeight: 'bold' }}>Fecha: {formatDateLocal(f.fecha)}</p>
              </div>
            </div>

            <h1 style={{ textAlign: 'center', fontSize: '13pt', fontWeight: 'bold', textDecoration: 'underline', margin: '8pt 0' }}>
              EVOLUCIÓN DE VISITA PROA
            </h1>

            {/* Identificación */}
            <PrintBlock title="Identificación">
              <PrintGrid>
                <PrintField label="Paciente" value={f.paciente} flex={3} />
                <PrintField label="RUT" value={f.rut} flex={1} />
                <PrintField label="Edad" value={f.edad ? `${f.edad} años` : ''} flex={1} />
              </PrintGrid>
              <PrintGrid>
                <PrintField label="Servicio" value={f.servicio} flex={1} />
                <PrintField label="Cama" value={f.cama} flex={1} />
                <PrintField label="N° Ficha" value={f.n_ficha} flex={1} />
                <PrintField label="Alergias" value={f.alergias || 'Ninguna conocida'} flex={2} />
              </PrintGrid>
            </PrintBlock>

            {/* Contexto clínico */}
            <PrintBlock title="Contexto clínico">
              <PrintGrid>
                <PrintField label="Diagnóstico" value={f.diagnostico} flex={2} />
                <PrintField label="Foco infeccioso" value={f.foco_infeccioso} flex={2} />
              </PrintGrid>
              <PrintGrid>
                <PrintField label="Comorbilidades" value={f.comorbilidades} flex={2} />
                <PrintField label="Función renal" value={f.funcion_renal} flex={2} />
              </PrintGrid>
              <PrintField label="Parámetros inflamatorios" value={f.parametros_inflamatorios} flex={1} />
              {(f.cultivos || f.imagenes) && (
                <div style={{ display: 'flex', gap: '12pt', marginTop: '4pt' }}>
                  {f.cultivos && (
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 2pt 0', fontWeight: 'bold', fontSize: '9pt' }}>CULTIVOS</p>
                      <div style={{ border: '0.75pt solid #000', padding: '4pt', minHeight: '30pt', whiteSpace: 'pre-wrap' }}>{f.cultivos}</div>
                    </div>
                  )}
                  {f.imagenes && (
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 2pt 0', fontWeight: 'bold', fontSize: '9pt' }}>IMÁGENES / HALLAZGOS</p>
                      <div style={{ border: '0.75pt solid #000', padding: '4pt', minHeight: '30pt', whiteSpace: 'pre-wrap' }}>{f.imagenes}</div>
                    </div>
                  )}
                </div>
              )}
            </PrintBlock>

            {/* Antibióticos */}
            <PrintBlock title="Antibióticos en curso">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5pt' }}>
                <thead>
                  <tr style={{ background: '#e6f4f1' }}>
                    <th style={cellHead}>Antibiótico</th>
                    <th style={cellHead}>Vía</th>
                    <th style={cellHead}>Dosis / frecuencia</th>
                    <th style={cellHead}>Día de tto</th>
                    <th style={cellHead}>Inicio</th>
                  </tr>
                </thead>
                <tbody>
                  {f.antibioticos.filter(a => a.nombre).map((a, i) => (
                    <tr key={i}>
                      <td style={cell}>{a.nombre}</td>
                      <td style={cell}>{a.via}</td>
                      <td style={cell}>{a.dosis}</td>
                      <td style={cell}>{a.dia_tto}</td>
                      <td style={cell}>{formatDateLocal(a.inicio)}</td>
                    </tr>
                  ))}
                  {f.antibioticos.filter(a => a.nombre).length === 0 && (
                    <tr><td colSpan={5} style={{ ...cell, fontStyle: 'italic', color: '#666' }}>— sin antibióticos registrados —</td></tr>
                  )}
                </tbody>
              </table>
            </PrintBlock>

            {/* Evolución */}
            {f.evolucion && (
              <PrintBlock title="Evolución clínica">
                <div style={{ border: '0.75pt solid #000', padding: '4pt 6pt', minHeight: '40pt', whiteSpace: 'pre-wrap' }}>{f.evolucion}</div>
              </PrintBlock>
            )}

            {/* Recomendaciones */}
            <PrintBlock title="Recomendaciones del equipo PROA">
              <ul style={{ margin: 0, paddingLeft: '14pt' }}>
                {f.recomendaciones.filter(r => r !== 'Otra (especificar abajo)').map(r => (
                  <li key={r} style={{ marginBottom: '2pt' }}>{r}</li>
                ))}
                {f.recomendaciones.includes('Otra (especificar abajo)') && f.recomendaciones_otra && (
                  <li>{f.recomendaciones_otra}</li>
                )}
                {f.recomendaciones.length === 0 && <li style={{ fontStyle: 'italic', color: '#666' }}>— sin recomendaciones —</li>}
              </ul>
              <PrintGrid>
                <PrintField label="Plan / duración total" value={f.plan_duracion} flex={3} />
                <PrintField label="Próxima revisión" value={formatDateLocal(f.proxima_revision)} flex={2} />
              </PrintGrid>
            </PrintBlock>

            {/* Aceptación + firmas */}
            <PrintBlock title="Aceptación y firmas">
              <PrintField label="Aceptación del tratante" value={f.aceptacion} flex={1} />
              <div style={{ marginTop: '16pt', display: 'flex', gap: '12pt' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ borderTop: '0.75pt solid #000', paddingTop: '2pt', textAlign: 'center', fontSize: '9pt' }}>
                    {f.medico_tratante || '—'}
                  </div>
                  <p style={{ margin: 0, fontSize: '8.5pt', textAlign: 'center', color: '#555' }}>Médico tratante</p>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ borderTop: '0.75pt solid #000', paddingTop: '2pt', textAlign: 'center', fontSize: '9pt' }}>
                    {f.equipo_proa || '—'}
                  </div>
                  <p style={{ margin: 0, fontSize: '8.5pt', textAlign: 'center', color: '#555' }}>Equipo PROA</p>
                </div>
              </div>
            </PrintBlock>
          </div>
        </div>
      )}
    </>
  );
}

// ── Helpers UI ─────────────────────────────────────────────
function Section({ title, children, right }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">{title}</h2>
        {right}
      </div>
      {children}
    </div>
  );
}

function Grid({ children, className = '' }) {
  return <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${className}`}>{children}</div>;
}

function Field({ label, children, span = '' }) {
  return (
    <div className={span}>
      <label className="block text-[11px] font-medium text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

// ── Helpers impresión ─────────────────────────────────────
function PrintBlock({ title, children }) {
  return (
    <div style={{ marginBottom: '8pt' }}>
      <p style={{ margin: '0 0 3pt 0', fontSize: '9.5pt', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.4pt', borderBottom: '0.75pt solid #000', paddingBottom: '1pt' }}>
        {title}
      </p>
      <div style={{ fontSize: '10pt' }}>{children}</div>
    </div>
  );
}

function PrintGrid({ children }) {
  return <div style={{ display: 'flex', gap: '10pt', marginBottom: '4pt', alignItems: 'baseline' }}>{children}</div>;
}

function PrintField({ label, value, flex = 1 }) {
  return (
    <div style={{ flex, display: 'flex', alignItems: 'baseline', minWidth: 0 }}>
      <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap', marginRight: '4pt', fontSize: '9.5pt' }}>{label}:</span>
      <span style={{ flex: 1, borderBottom: '0.5pt solid #000', minHeight: '12pt', padding: '0 3pt', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</span>
    </div>
  );
}

const cellHead = { border: '0.5pt solid #555', padding: '3pt 5pt', textAlign: 'left', fontSize: '9pt' };
const cell = { border: '0.5pt solid #555', padding: '3pt 5pt', fontSize: '9.5pt' };
