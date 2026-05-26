import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronLeft, Printer, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getMultiPrefill } from '@/lib/multiTemplatePrefill';
import { SERVICIOS } from '@/lib/hospitalSuggestions';

// Catálogo de fármacos restringidos con sus presentaciones disponibles.
// Cuando el Arsenal Ñuble / Arsenal local declara una presentación específica,
// se prioriza esa. Si no aplica, se dejan las presentaciones de mercado más comunes (CL).
// La unidad ("ampolla" / "frasco-ampolla" / "vial" / "comp.") se conserva tal como
// se ordena el ítem en bodega para que el total quede expresado en la misma unidad.
const RESTRICTED_DRUGS = [
  // β-lactámicos de amplio espectro / antipseudomonas
  { name: 'Meropenem',                 presentations: ['1 g frasco-ampolla EV', '500 mg frasco-ampolla EV'] },
  { name: 'Imipenem + cilastatina',    presentations: ['500 mg frasco-ampolla EV'] },
  { name: 'Ertapenem',                 presentations: ['1 g frasco-ampolla EV'] },
  { name: 'Piperacilina + tazobactam', presentations: ['4 g / 0,5 g frasco-ampolla EV', '2 g / 0,25 g frasco-ampolla EV'] },
  { name: 'Ceftazidima',               presentations: ['1 g frasco-ampolla EV'] },
  { name: 'Cefepime',                  presentations: ['1 g frasco-ampolla EV', '2 g frasco-ampolla EV'] },
  { name: 'Ceftriaxona',               presentations: ['1 g frasco-ampolla EV/IM'] },
  { name: 'Cefotaxima',                presentations: ['1 g frasco-ampolla EV/IM'] },
  { name: 'Ampicilina + sulbactam',    presentations: ['1,5 g (1 g/0,5 g) frasco-ampolla EV'] },
  // Glicopéptidos / anti-Gram(+)
  { name: 'Vancomicina',               presentations: ['500 mg frasco-ampolla EV', '1 g frasco-ampolla EV'] },
  { name: 'Teicoplanina',              presentations: ['400 mg frasco-ampolla EV', '200 mg frasco-ampolla EV'] },
  { name: 'Linezolid',                 presentations: ['600 mg/300 mL bolsa EV', '600 mg comp. VO'] },
  { name: 'Daptomicina',               presentations: ['500 mg frasco-ampolla EV', '350 mg frasco-ampolla EV'] },
  // Otros
  { name: 'Tigeciclina',               presentations: ['50 mg frasco-ampolla EV'] },
  { name: 'Colistina (colistimetato)', presentations: ['1.000.000 UI frasco-ampolla EV', '2.000.000 UI frasco-ampolla EV'] },
  { name: 'Amikacina',                 presentations: ['500 mg/2 mL ampolla EV/IM', '100 mg/2 mL ampolla EV/IM'] },
  { name: 'Gentamicina',               presentations: ['80 mg/2 mL ampolla EV/IM', '40 mg/2 mL ampolla EV/IM'] },
  { name: 'Clindamicina',              presentations: ['600 mg/4 mL ampolla EV', '300 mg comp. VO'] },
  { name: 'Metronidazol',              presentations: ['500 mg/100 mL frasco EV', '500 mg comp. VO'] },
  { name: 'Ciprofloxacino',            presentations: ['200 mg/100 mL frasco EV', '500 mg comp. VO'] },
  { name: 'Levofloxacino',             presentations: ['500 mg/100 mL frasco EV', '500 mg comp. VO', '750 mg comp. VO'] },
  { name: 'Moxifloxacino',             presentations: ['400 mg/250 mL frasco EV', '400 mg comp. VO'] },
  { name: 'Azitromicina',              presentations: ['500 mg frasco-ampolla EV', '500 mg comp. VO'] },
  { name: 'Cloxacilina',               presentations: ['500 mg frasco-ampolla EV/IM', '1 g frasco-ampolla EV/IM'] },
  { name: 'Penicilina G sódica',       presentations: ['1.000.000 UI frasco-ampolla EV/IM', '5.000.000 UI frasco-ampolla EV/IM'] },
  // Antifúngicos
  { name: 'Fluconazol',                presentations: ['200 mg/100 mL frasco EV', '150 mg cápsula VO'] },
  { name: 'Voriconazol',               presentations: ['200 mg frasco-ampolla EV', '200 mg comp. VO'] },
  { name: 'Anfotericina B desoxicolato',  presentations: ['50 mg frasco-ampolla EV'] },
  { name: 'Anfotericina B liposomal',     presentations: ['50 mg frasco-ampolla EV'] },
  { name: 'Caspofungina',              presentations: ['70 mg frasco-ampolla EV', '50 mg frasco-ampolla EV'] },
  // Antivirales
  { name: 'Aciclovir',                 presentations: ['250 mg frasco-ampolla EV', '500 mg frasco-ampolla EV', '400 mg comp. VO'] },
  { name: 'Ganciclovir',               presentations: ['500 mg frasco-ampolla EV'] },
  { name: 'Oseltamivir',               presentations: ['75 mg cápsula VO', '45 mg cápsula VO', '30 mg cápsula VO'] },
];

const DRUG_NAMES = RESTRICTED_DRUGS.map(d => d.name);

const VIAS = ['Oral', 'IM', 'EV', 'SC', 'Inhalador', 'Rectal', 'Tópica', 'Otra'];

// Extrae la unidad ("ampolla" | "frasco-ampolla" | "vial" | "frasco" | "comp." | "cápsula")
// desde el string de presentación; default a "unidad".
function unidadDesdePresentacion(pres) {
  if (!pres) return 'unidades';
  const p = pres.toLowerCase();
  if (p.includes('frasco-ampolla')) return 'frascos-ampolla';
  if (p.includes('ampolla')) return 'ampollas';
  if (p.includes('vial')) return 'viales';
  if (p.includes('bolsa')) return 'bolsas';
  if (p.includes('frasco')) return 'frascos';
  if (p.includes('cápsula')) return 'cápsulas';
  if (p.includes('comp')) return 'comprimidos';
  return 'unidades';
}

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

function calcAge(iso) {
  if (!iso) return '';
  const t = new Date();
  const b = new Date(iso);
  if (isNaN(b.getTime())) return '';
  let a = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) a--;
  return a >= 0 ? String(a) : '';
}

function formatDateLocal(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}-${m}-${y}`;
}

const EMPTY = {
  paciente: '', edad: '', rut: '',
  prevision: '', // 'A'|'B'|'C'|'D'|'ISAPRE'|'PARTICULAR'|'ACC_TRANSITO'|'ACC_ESC'|'ACC_MUT'
  comuna: '', servicio: '',
  n_ficha: '', diagnostico: '',
  farmaco: '', presentacion: '', via: 'Oral',
  ampollas_dia: '', dias_tto: '', dosis_total: '',
  justificacion: '',
  medico: '', fecha: '',
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

const PREVISION_OPTIONS = [
  { key: 'A', label: 'A' }, { key: 'B', label: 'B' }, { key: 'C', label: 'C' }, { key: 'D', label: 'D' },
  { key: 'ISAPRE', label: 'ISAPRE' },
  { key: 'PARTICULAR', label: 'PARTICULAR' },
  { key: 'ACC_TRANSITO', label: 'ACC. TRÁNSITO' },
  { key: 'ACC_ESC', label: 'ACC. ESC.' },
  { key: 'ACC_MUT', label: 'ACC. MUT.' },
];

export default function SolicitudFarmacoRestringido() {
  const [f, setF] = useState({ ...EMPTY, fecha: todayIso() });
  const [showPreview, setShowPreview] = useState(false);
  const u = (k, v) => setF(prev => ({ ...prev, [k]: v }));
  const clear = () => setF({ ...EMPTY, fecha: todayIso() });

  // Presentaciones sugeridas según fármaco elegido (match case-insensitive por prefijo).
  const drugEntry = RESTRICTED_DRUGS.find(d =>
    f.farmaco && d.name.toLowerCase() === f.farmaco.trim().toLowerCase()
  );
  const presentaciones = drugEntry ? drugEntry.presentations : [];
  const unidad = unidadDesdePresentacion(f.presentacion);

  // Cuando cambia el fármaco a uno conocido, auto-selecciona su primera presentación
  // si el usuario aún no escogió ninguna válida.
  useEffect(() => {
    if (drugEntry && !drugEntry.presentations.includes(f.presentacion)) {
      setF(prev => ({ ...prev, presentacion: drugEntry.presentations[0] }));
    }
  }, [f.farmaco]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-calcula la dosis total = ampollas/día × días.
  useEffect(() => {
    const n = parseFloat(String(f.ampollas_dia).replace(',', '.'));
    const d = parseInt(String(f.dias_tto).replace(/[^\d]/g, ''), 10);
    if (!isNaN(n) && !isNaN(d) && n > 0 && d > 0) {
      const total = Math.ceil(n * d);
      const txt = `${total} ${unidad}`;
      setF(prev => prev.dosis_total === txt ? prev : { ...prev, dosis_total: txt });
    }
  }, [f.ampollas_dia, f.dias_tto, unidad]);

  useEffect(() => {
    const p = getMultiPrefill();
    if (!p) return;
    setF(prev => ({
      ...prev,
      paciente:  p.patient_name      || prev.paciente,
      rut:       p.patient_rut       ? formatRut(p.patient_rut) : prev.rut,
      edad:      p.patient_fecha_nac ? calcAge(p.patient_fecha_nac) : prev.edad,
      prevision: p.prevision         || prev.prevision,
      comuna:    p.patient_comuna    || prev.comuna,
      n_ficha:   p.n_ficha           || prev.n_ficha,
      diagnostico: p.diagnostico     || prev.diagnostico,
    }));
  }, []);

  return (
    <>
      <style>{`
        @page { size: A4 portrait; margin: 12mm; }
        @media print {
          html, body, #root, body > div { background: #fff !important; }
          .farm-screen-only { display: none !important; }
          .farm-print-page {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            max-width: none !important;
            width: 100% !important;
          }
        }
        .farm-pdf-viewer {
          background: #525659;
          padding: 24px 16px;
          min-height: calc(100vh - 60px);
        }
        .farm-pdf-viewer .farm-print-page {
          background: #fff;
          box-shadow: 0 8px 28px rgba(0,0,0,0.45);
          width: 210mm;
          margin: 0 auto;
        }
        @media print {
          .farm-pdf-viewer { background: #fff !important; padding: 0 !important; min-height: 0 !important; }
          .farm-pdf-viewer .farm-print-page { box-shadow: none !important; }
        }
      `}</style>

      {/* Toolbar */}
      <div className="farm-screen-only sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to={createPageUrl('Category?id=696ea6ff245ef362de4f431c')}>
            <Button variant="ghost" size="icon" className="rounded-xl"><ChevronLeft className="h-5 w-5" /></Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-base font-bold text-slate-900">Solicitud de Fármaco de Uso Restringido y Ocasional</h1>
            <p className="text-xs text-slate-500">Hospital Comunitario de Salud Familiar de Bulnes · Comité de Farmacia / MPJC</p>
          </div>
          <Button variant="outline" size="sm" onClick={clear} className="gap-1.5">
            <RotateCcw className="h-4 w-4" /> Limpiar
          </Button>
          {showPreview && (
            <>
              <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>Volver a datos</Button>
              <Button size="sm" onClick={() => window.print()} className="gap-1.5 bg-blue-600 hover:bg-blue-700">
                <Printer className="h-4 w-4" /> Imprimir / PDF
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Panel de datos previos */}
      {!showPreview && (
        <div className="farm-screen-only max-w-4xl mx-auto px-4 mt-4 pb-12">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4">
            <div className="mb-3">
              <h2 className="text-sm font-bold text-slate-900">Datos del paciente y solicitud</h2>
              <p className="text-xs text-slate-600">Llena los datos y la justificación. La fecha viene seteada al día de hoy.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <Field label="Paciente" span="col-span-2 md:col-span-3">
                <Input value={f.paciente} onChange={e => u('paciente', e.target.value)} className="h-9" />
              </Field>
              <Field label="Edad">
                <Input value={f.edad} onChange={e => u('edad', e.target.value)} className="h-9" placeholder="años" />
              </Field>

              <Field label="Previsión" span="col-span-2 md:col-span-4">
                <div className="flex flex-wrap gap-1.5">
                  {PREVISION_OPTIONS.map(opt => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => u('prevision', opt.key)}
                      className={`px-2 py-1 rounded text-[11px] border transition-colors ${
                        f.prevision === opt.key
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-white text-slate-700 border-slate-300 hover:border-amber-400'
                      }`}
                    >{opt.label}</button>
                  ))}
                </div>
              </Field>

              {/* N° Ficha + Diagnóstico en la misma fila */}
              <Field label="N° Ficha">
                <Input value={f.n_ficha} onChange={e => u('n_ficha', e.target.value)} className="h-9" />
              </Field>
              <Field label="Diagnóstico" span="col-span-2 md:col-span-3">
                <Input value={f.diagnostico} onChange={e => u('diagnostico', e.target.value)} className="h-9" />
              </Field>

              {/* Comuna + Servicio clínico en la misma fila */}
              <Field label="Comuna de origen" span="col-span-1 md:col-span-2">
                <Input value={f.comuna} onChange={e => u('comuna', e.target.value)} className="h-9" placeholder="Bulnes, Quillón…" />
              </Field>
              <Field label="Servicio clínico" span="col-span-1 md:col-span-2">
                <input
                  value={f.servicio}
                  onChange={e => u('servicio', e.target.value)}
                  list="farm-serv-suggestions"
                  className="w-full h-9 rounded-md border border-slate-200 px-3 text-sm focus:border-blue-400 focus:outline-none"
                  placeholder="MQ1, MQ2, Urgencias…"
                />
              </Field>

              {/* Nombre del fármaco + Vía en la misma fila */}
              <Field label="Nombre del fármaco" span="col-span-2 md:col-span-3">
                <input
                  value={f.farmaco}
                  onChange={e => u('farmaco', e.target.value)}
                  list="farm-abx-suggestions"
                  className="w-full h-9 rounded-md border border-slate-200 px-3 text-sm focus:border-blue-400 focus:outline-none"
                  placeholder="Empieza a escribir, las sugerencias aparecen abajo"
                />
              </Field>
              <Field label="Vía">
                <select
                  value={f.via}
                  onChange={e => u('via', e.target.value)}
                  className="w-full h-9 rounded-md border border-slate-200 px-2 text-sm focus:border-blue-400 focus:outline-none bg-white"
                >
                  {VIAS.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </Field>

              {/* Presentación a fila completa */}
              <Field label="Presentación" span="col-span-2 md:col-span-4">
                {presentaciones.length > 0 ? (
                  <select
                    value={f.presentacion}
                    onChange={e => u('presentacion', e.target.value)}
                    className="w-full h-9 rounded-md border border-slate-200 px-2 text-sm focus:border-blue-400 focus:outline-none bg-white"
                  >
                    {presentaciones.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                ) : (
                  <Input
                    value={f.presentacion}
                    onChange={e => u('presentacion', e.target.value)}
                    className="h-9"
                    placeholder="Ej: 1 g frasco-ampolla EV"
                  />
                )}
              </Field>

              <Field label="Dosis diaria">
                <Input
                  value={f.ampollas_dia}
                  onChange={e => u('ampollas_dia', e.target.value)}
                  className="h-9"
                  placeholder="Ej: 3"
                  inputMode="decimal"
                />
              </Field>
              <Field label="Duración del tto">
                <Input
                  value={f.dias_tto}
                  onChange={e => u('dias_tto', e.target.value)}
                  className="h-9"
                  placeholder="Ej: 7 días"
                />
              </Field>
              <Field label="Dosis total solicitada" span="col-span-2">
                <Input
                  value={f.dosis_total}
                  onChange={e => u('dosis_total', e.target.value)}
                  className="h-9 bg-amber-50/60"
                  placeholder="Se calcula automáticamente"
                />
              </Field>

              <Field label="Justificación del tratamiento" span="col-span-2 md:col-span-4">
                <Textarea
                  value={f.justificacion}
                  onChange={e => u('justificacion', e.target.value)}
                  className="min-h-[140px]"
                  placeholder="Para solicitudes de antibióticos en infecciones sin documentación microbiológica o si existe agente patógeno identificado y es sensible a antibióticos más simples, explicar las razones de su elección."
                />
              </Field>

              <Field label="Nombre médico solicitante" span="col-span-2 md:col-span-3">
                <Input value={f.medico} onChange={e => u('medico', e.target.value)} className="h-9" />
              </Field>
              <Field label="Fecha">
                <Input type="date" value={f.fecha} onChange={e => u('fecha', e.target.value)} className="h-9" />
              </Field>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={clear}>Limpiar datos</Button>
              <Button onClick={() => setShowPreview(true)} className="bg-amber-600 hover:bg-amber-700 gap-2">
                Generar formulario →
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Documento generado */}
      {showPreview && (
        <div className="farm-pdf-viewer">
          <div
            className="farm-print-page"
            style={{
              padding: '14mm',
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: '10.5pt',
              color: '#000',
              minHeight: '273mm',
            }}
          >
            {/* Header institucional */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12pt', marginBottom: '8pt' }}>
              <HospitalLogo />
              <div style={{ flex: 1, fontSize: '9.5pt', lineHeight: 1.3 }}>
                <p style={{ margin: 0 }}>Ministerio de Salud</p>
                <p style={{ margin: 0 }}>Servicio Salud Ñuble</p>
                <p style={{ margin: 0 }}>Hospital Comunitario de Salud Familiar de Bulnes</p>
                <p style={{ margin: 0 }}>Comité de Farmacia /MPJC.</p>
              </div>
            </div>

            <h1 style={{ textAlign: 'center', fontSize: '14pt', fontWeight: 'bold', textDecoration: 'underline', margin: '14pt 0 14pt 0' }}>
              SOLICITUD DE FÁRMACO DE USO RESTRINGIDO Y OCASIONAL.
            </h1>

            {/* Datos paciente — formato línea por línea estilo formulario original */}
            <PrintRow>
              <PrintField label="PACIENTE" value={f.paciente} flex={4} />
              <PrintField label="EDAD"     value={f.edad}     flex={1} />
            </PrintRow>

            {/* Previsión — opciones encerrando la elegida en círculo */}
            <div style={{ marginBottom: '10pt', fontSize: '10.5pt', whiteSpace: 'nowrap', overflow: 'hidden' }}>
              <strong>PREVISIÓN:</strong>
              <span style={{ marginLeft: '6pt' }}>
                {PREVISION_OPTIONS.map(opt => (
                  <span
                    key={opt.key}
                    style={{
                      display: 'inline-block',
                      marginRight: '8pt',
                      padding: f.prevision === opt.key ? '0 4pt' : '0 2pt',
                      border: f.prevision === opt.key ? '1.5pt solid #000' : 'none',
                      borderRadius: f.prevision === opt.key ? '12pt' : '0',
                      fontWeight: f.prevision === opt.key ? 'bold' : 'normal',
                    }}
                  >{opt.label}</span>
                ))}
              </span>
            </div>

            <PrintRow>
              <PrintField label="COMUNA DE ORIGEN" value={f.comuna} flex={3} />
              <PrintField label="SERVICIO CLÍNICO" value={f.servicio} flex={2} />
            </PrintRow>
            <PrintRow>
              <PrintField label="N° FICHA"    value={f.n_ficha}     flex={1} />
              <PrintField label="DIAGNÓSTICO" value={f.diagnostico} flex={4} />
            </PrintRow>
            <PrintRow>
              <PrintField label="NOMBRE DEL FÁRMACO" value={f.farmaco} flex={3} />
              <div style={{ flex: 2, display: 'flex', alignItems: 'baseline', minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden' }}>
                <span style={{ fontWeight: 'bold', marginRight: '4pt' }}>VÍA:</span>
                {VIAS.map(v => (
                  <span
                    key={v}
                    style={{
                      display: 'inline-block',
                      marginRight: '4pt',
                      padding: f.via === v ? '0 3pt' : '0 1pt',
                      border: f.via === v ? '1.5pt solid #000' : 'none',
                      borderRadius: f.via === v ? '10pt' : '0',
                      fontWeight: f.via === v ? 'bold' : 'normal',
                      fontSize: '9.5pt',
                    }}
                  >{v}</span>
                ))}
              </div>
            </PrintRow>
            <PrintRow>
              <PrintField label="PRESENTACIÓN" value={f.presentacion} flex={1} />
            </PrintRow>
            <PrintRow>
              <PrintField label="DOSIS DIARIA"   value={f.ampollas_dia} flex={1} />
              <PrintField label="DURACIÓN TTO"   value={f.dias_tto}     flex={1} />
              <PrintField label="DOSIS TOTAL SOLICITADA" value={f.dosis_total} flex={2} />
            </PrintRow>

            {/* Justificación */}
            <div style={{ marginTop: '12pt', marginBottom: '14pt' }}>
              <p style={{ fontWeight: 'bold', textDecoration: 'underline', margin: '0 0 4pt 0' }}>
                JUSTIFICACIÓN DEL TRATAMIENTO
                <span style={{ fontWeight: 'normal', textDecoration: 'none', fontSize: '9.5pt' }}>
                  {' '}(para solicitudes de antibióticos en infecciones sin documentación microbiológica o si existe un agente patógeno identificado y es sensible a antibióticos más simples, explicar las razones de su elección)
                </span>
              </p>
              <div style={{ minHeight: '120pt', border: '1pt solid #000', padding: '6pt 8pt', fontSize: '10.5pt', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                {f.justificacion}
              </div>
            </div>

            {/* Firma médico — cada campo en su propia fila */}
            <PrintRow>
              <PrintField label="NOMBRE Y FIRMA MÉDICO SOLICITANTE" value={f.medico} flex={1} />
            </PrintRow>
            <PrintRow>
              <PrintField label="FECHA" value={formatDateLocal(f.fecha)} flex={1} />
            </PrintRow>

            {/* Línea divisoria */}
            <hr style={{ border: 'none', borderTop: '1pt solid #000', margin: '14pt 0 8pt 0' }} />

            {/* USO EXCLUSIVO DE FARMACIA */}
            <p style={{ fontWeight: 'bold', margin: '0 0 6pt 0', textDecoration: 'underline' }}>USO EXCLUSIVO DE FARMACIA</p>
            <PrintRow>
              <PrintField label="FECHA RECEPCIÓN SOLICITUD" value="" flex={1} />
            </PrintRow>
            <PrintRow>
              <PrintField label="VALOR DOSIS DIARIA: $" value="" flex={1} />
              <PrintField label="VALOR DOSIS TOTAL SOLICITADA: $" value="" flex={2} />
            </PrintRow>
            <div style={{ marginTop: '20pt' }}>
              <PrintRow>
                <PrintField label="V°B° SUB-DIRECTOR MÉDICO" value="" flex={2} />
                <PrintField label="FECHA V°B° SUB-DIRECTOR MÉDICO" value="" flex={2} />
              </PrintRow>
            </div>
          </div>
        </div>
      )}

      {/* Datalists para autocompletado */}
      <datalist id="farm-abx-suggestions">
        {DRUG_NAMES.map(s => <option key={s} value={s} />)}
      </datalist>
      <datalist id="farm-serv-suggestions">
        {SERVICIOS.map(s => <option key={s} value={s} />)}
      </datalist>
    </>
  );
}

// ── Componentes auxiliares ─────────────────────────────────────────────
function Field({ label, children, span = 'col-span-1' }) {
  return (
    <div className={span}>
      <label className="block text-[11px] font-medium text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

function LineValue({ value, w }) {
  return (
    <span style={{
      display: 'inline-block',
      borderBottom: '1pt solid #000',
      minWidth: w || '120pt',
      padding: '0 4pt',
      marginLeft: '4pt',
      minHeight: '14pt',
      fontSize: '10.5pt',
    }}>{value}</span>
  );
}

// PrintRow / PrintField — layout fiel al formulario impreso original:
// fila horizontal con anchos relativos (flex) y cada campo formado por su
// label en negrita + línea continua. Sin wrap: cada fila es UNA línea.
function PrintRow({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '14pt', marginBottom: '8pt', fontSize: '10.5pt' }}>
      {children}
    </div>
  );
}

function PrintField({ label, value, flex = 1 }) {
  return (
    <div style={{ flex, display: 'flex', alignItems: 'baseline', minWidth: 0 }}>
      <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap', marginRight: '4pt' }}>{label}:</span>
      <span
        style={{
          flex: 1,
          borderBottom: '1pt solid #000',
          minHeight: '14pt',
          padding: '0 4pt',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >{value}</span>
    </div>
  );
}

function FieldLine({ label, value, w, extra, inline = false }) {
  if (inline) {
    return (
      <div style={{ flex: w ? `0 0 ${w}` : '1 1 auto', marginBottom: '6pt', fontSize: '10.5pt' }}>
        <span style={{ fontWeight: 'bold' }}>{label}:</span>
        <LineValue value={value} w="65%" />
      </div>
    );
  }
  return (
    <div style={{ marginBottom: '8pt', fontSize: '10.5pt' }}>
      <span style={{ fontWeight: 'bold' }}>{label}:</span>
      <LineValue value={value} w={w || '50%'} />
      {extra}
    </div>
  );
}
