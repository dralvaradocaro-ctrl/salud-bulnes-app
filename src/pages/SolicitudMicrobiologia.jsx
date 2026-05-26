import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronLeft, Printer, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getMultiPrefill } from '@/lib/multiTemplatePrefill';
import { SERVICIOS, SALAS, PREVISIONES } from '@/lib/hospitalSuggestions';

// Formulario oficial C 162 — Hospital Comunitario de Salud Familiar de Bulnes.
// Estructura por secciones en DOS COLUMNAS preservando el layout del original
// y dejando "líneas en blanco" libres para anotar exámenes especiales que no
// están en la lista codificada.
const SECTION_A = {
  title: 'A. EXÁMENES BACTERIOLÓGICOS',
  left: [
    { code: '03.06.011', name: 'UROCULTIVO' },
    { code: '03.06.007', name: 'COPROCULTIVO' },
    { code: '03.06.008', name: 'CULTIVO CORRIENTE DE (especificar tipo de secreción y sitio anatómico):', hasNote: true },
  ],
  right: [
    { code: '03.06.099', name: 'BÚSQUEDA DE STREPTOCOCCUS GRUPO B' },
    { code: '03.06.016', name: 'NEISSERIA GONORRHOEAE' },
    { code: '03.06.023', name: 'UREAPLASMA Y MYCOPLASMA' },
    { code: '03.06.034', name: 'CLAMIDIA' },
    { code: '03.08.044', name: 'CULTIVO DE SECRECIÓN URETRAL' },
    { code: '03.08.045', name: 'CULTIVO DE FLUJO VAGINAL (incluye directo al fresco y tinción Gram)' },
  ],
};

const SECTION_B = {
  title: 'B. EXÁMENES MICROBIOLÓGICOS',
  left: [
    { code: '03.08.011', name: 'DIRECTO AL FRESCO' },
    { code: '03.06.005', name: 'TINCIÓN DE GRAM' },
    { code: '03.06.004', name: 'ACAROTEST' },
  ],
  right: [
    { code: '03.06.117', name: 'CULTIVO DE HONGOS' },
    { code: '03.06.004b', name: 'MICOLÓGICO DIRECTO' },
  ],
};

const SECTION_C = {
  title: 'C. EXÁMENES VIROLÓGICOS',
  left: [
    { code: '03.06.270', name: 'VIRUS RESPIRATORIO SINCICIAL' },
  ],
  right: [],
};

function formatRut(raw) {
  if (!raw) return '';
  const clean = String(raw).replace(/[^0-9kK]/g, '').toUpperCase();
  if (!clean) return '';
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  if (!body) return dv;
  return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}`;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

// ── Sugerencias precargadas (autocomplete con datalist) ─────────────────
// El usuario puede escribir cualquier cosa pero ve sugerencias coincidentes.
const SAMPLE_TYPES = [
  'Orina (chorro medio)',
  'Orina (sondeo)',
  'Orina (recolector pediátrico)',
  'Esputo',
  'Esputo inducido',
  'Aspirado bronquial',
  'Aspirado traqueal',
  'Lavado broncoalveolar (BAL)',
  'Hemocultivo periférico',
  'Hemocultivo central (catéter)',
  'Sangre (EDTA)',
  'LCR',
  'Líquido pleural',
  'Líquido peritoneal / ascítico',
  'Líquido sinovial',
  'Pus',
  'Secreción uretral',
  'Secreción vaginal',
  'Secreción endocervical',
  'Tórula faríngea',
  'Tórula nasofaríngea',
  'Tórula orofaríngea',
  'Deposición',
  'Biopsia',
  'Tejido pulmonar',
  'Punta de catéter',
  'Raspado de piel / uña',
  'Otoscopía (oído medio)',
];

const ANTIBIOTICS = [
  // Penicilinas
  'Penicilina G',
  'Penicilina V',
  'Amoxicilina',
  'Amoxicilina + ácido clavulánico',
  'Ampicilina',
  'Ampicilina + sulbactam',
  'Cloxacilina',
  // Cefalosporinas
  'Cefadroxilo',
  'Cefalexina',
  'Cefazolina',
  'Cefuroxima',
  'Cefotaxima',
  'Ceftriaxona',
  'Ceftazidima',
  'Cefepime',
  // Carbapenemes
  'Ertapenem',
  'Meropenem',
  'Imipenem',
  // β-lactámicos amplio espectro
  'Piperacilina + tazobactam',
  // Glucopéptidos / oxazolidinonas
  'Vancomicina',
  'Teicoplanina',
  'Linezolid',
  'Daptomicina',
  // Lincosamidas / nitroimidazoles
  'Clindamicina',
  'Metronidazol',
  // Macrólidos
  'Azitromicina',
  'Claritromicina',
  'Eritromicina',
  // Quinolonas
  'Ciprofloxacino',
  'Levofloxacino',
  'Moxifloxacino',
  // Otros
  'Cotrimoxazol (trimetoprim/sulfametoxazol)',
  'Nitrofurantoína',
  'Fosfomicina',
  'Doxiciclina',
  'Tigeciclina',
  // Aminoglucósidos
  'Gentamicina',
  'Amikacina',
  // Polimixinas
  'Colistina',
  // Antimicóticos
  'Fluconazol',
  'Itraconazol',
  'Voriconazol',
  'Anfotericina B',
  // Antivirales
  'Aciclovir',
  'Oseltamivir',
  // Sin antibiótico
  'Sin tratamiento antibiótico',
];

const ANATOMICAL_SITES = [
  'Tracto urinario',
  'Vejiga',
  'Riñón',
  'Próstata',
  'Uretra',
  'Vagina',
  'Cérvix',
  'Vulva',
  'Pene',
  'Recto',
  'Anal',
  'Faringe',
  'Amígdalas',
  'Laringe',
  'Oído externo',
  'Oído medio',
  'Conjuntiva',
  'Senos paranasales',
  'Cavidad nasal',
  'Cavidad oral',
  'Lengua',
  'Pulmón derecho',
  'Pulmón izquierdo',
  'Bronquios',
  'Tráquea',
  'Piel (cara)',
  'Piel (tronco)',
  'Piel (extremidad superior)',
  'Piel (extremidad inferior)',
  'Tejido subcutáneo',
  'Herida quirúrgica',
  'Herida traumática',
  'Úlcera por presión',
  'Úlcera vascular',
  'Pie diabético',
  'Lecho ungueal',
  'Uña',
  'Sangre periférica',
  'Catéter venoso central',
  'LCR',
  'Articulación',
  'Hueso',
  'Líquido pleural',
  'Líquido peritoneal',
  'Líquido sinovial',
];

const EMPTY = {
  nombre: '', rut: '', fecha_nacimiento: '', prevision: '',
  servicio: '', sala: '', cama: '',
  diagnostico: '', tratamiento_antibiotico: '',
  tipo_muestra: '', sitio_anatomico: '',
  fecha_toma: '', // se setea a hoy al montar
  cultivo_corriente_detalle: '',
  examenes_libres: '', // texto libre para exámenes especiales no listados
  profesional: '',
  selected: {},
};

function HospitalLogo() {
  const [failed, setFailed] = useState(false);
  if (!failed) {
    return (
      <img
        src="/logo-hospital.png"
        alt="Hospital Comunitario de Salud Familiar de Bulnes"
        style={{ height: '54px', width: 'auto', objectFit: 'contain', display: 'block' }}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div style={{ height: '54px', width: '64px', background: '#1565c0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}>
      <span style={{ color: 'white', fontWeight: 'bold', fontSize: '11px' }}>HCSFB</span>
    </div>
  );
}

// ── Render de un examen como item de columna (estilo formulario oficial) ──
function ExamRow({ exam, selected, onToggle, noteValue, onNoteChange }) {
  return (
    <div style={{ marginBottom: '6pt' }}>
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '5pt', cursor: 'pointer', fontSize: '10pt' }}>
        <input
          type="checkbox"
          checked={!!selected}
          onChange={onToggle}
          style={{ marginTop: '2pt', width: '12pt', height: '12pt', cursor: 'pointer', flexShrink: 0 }}
        />
        <span style={{ flex: 1, lineHeight: 1.3 }}>
          <span style={{ fontFamily: 'monospace', fontSize: '9pt', color: '#444', marginRight: '6pt' }}>{exam.code}</span>
          {exam.name}
        </span>
      </label>
      {exam.hasNote && (
        <div style={{ marginLeft: '17pt', marginTop: '3pt' }}>
          <input
            value={noteValue || ''}
            onChange={(e) => onNoteChange?.(e.target.value)}
            placeholder="(escribir secreción y sitio anatómico)"
            style={{
              display: 'block',
              width: '95%',
              border: 'none',
              borderBottom: '1pt solid #000',
              fontSize: '9.5pt',
              padding: '0 2pt',
              background: 'transparent',
              outline: 'none',
              marginBottom: '2pt',
            }}
          />
          <div style={{ width: '95%', borderBottom: '1pt solid #000', height: '12pt' }} />
        </div>
      )}
    </div>
  );
}

export default function SolicitudMicrobiologia() {
  const [f, setF] = useState({ ...EMPTY, fecha_toma: todayIso() });
  const [showPreview, setShowPreview] = useState(false);

  const u = (k, v) => setF(prev => ({ ...prev, [k]: v }));
  const toggleExam = (code) => setF(prev => ({
    ...prev,
    selected: { ...prev.selected, [code]: !prev.selected[code] },
  }));
  const clear = () => setF({ ...EMPTY, fecha_toma: todayIso() });

  // Prefill desde wizard multi-plantilla
  useEffect(() => {
    const p = getMultiPrefill();
    if (!p) return;
    setF(prev => ({
      ...prev,
      nombre:           p.patient_name      || prev.nombre,
      rut:              p.patient_rut       ? formatRut(p.patient_rut) : prev.rut,
      fecha_nacimiento: p.patient_fecha_nac || prev.fecha_nacimiento,
      prevision:        p.prevision         || prev.prevision,
      diagnostico:      p.diagnostico       || prev.diagnostico,
    }));
  }, []);

  return (
    <>
      <style>{`
        @page { size: A4 portrait; margin: 12mm; }
        @media print {
          /* Anular padding global de body que se sumaba al @page y empujaba a 2da página. */
          html, body { padding: 0 !important; margin: 0 !important; }
          html, body, #root, body > div { background: #fff !important; }
          .micro-screen-only { display: none !important; }
          .micro-print-page {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            max-width: none !important;
            width: 100% !important;
            min-height: 0 !important;
          }
        }
        .micro-pdf-viewer {
          background: #525659;
          padding: 24px 16px;
          min-height: calc(100vh - 60px);
        }
        .micro-pdf-viewer .micro-print-page {
          background: #fff;
          box-shadow: 0 8px 28px rgba(0,0,0,0.45);
          width: 210mm;
          margin: 0 auto;
        }
        @media print {
          .micro-pdf-viewer { background: #fff !important; padding: 0 !important; min-height: 0 !important; }
          .micro-pdf-viewer .micro-print-page { box-shadow: none !important; }
        }
      `}</style>

      {/* Toolbar */}
      <div className="micro-screen-only sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to={createPageUrl('Category?id=696ea6ff245ef362de4f431c')}>
            <Button variant="ghost" size="icon" className="rounded-xl"><ChevronLeft className="h-5 w-5" /></Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-base font-bold text-slate-900">Solicitud de Exámenes Microbiológicos</h1>
            <p className="text-xs text-slate-500">Hospital Comunitario de Salud Familiar de Bulnes · Formulario C 162</p>
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

      {/* Panel de datos previos (solo si no se generó el documento) */}
      {!showPreview && (
        <div className="micro-screen-only max-w-4xl mx-auto px-4 mt-4 pb-12">
          <div className="rounded-2xl border border-cyan-200 bg-cyan-50/40 p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Datos del paciente y muestra</h2>
                <p className="text-xs text-slate-600">Llena los datos y marca los exámenes. La fecha de toma de muestra viene seteada al día de hoy por defecto.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <Field label="Nombre paciente" span="col-span-2 md:col-span-4">
                <Input value={f.nombre} onChange={e => u('nombre', e.target.value)} className="h-9" />
              </Field>
              <Field label="RUT">
                <Input value={f.rut} onChange={e => u('rut', formatRut(e.target.value))} className="h-9" placeholder="12.345.678-9" />
              </Field>
              <Field label="Fecha nacimiento">
                <Input type="date" value={f.fecha_nacimiento} onChange={e => u('fecha_nacimiento', e.target.value)} className="h-9" />
              </Field>
              <Field label="Previsión">
                <input
                  value={f.prevision}
                  onChange={e => u('prevision', e.target.value)}
                  list="prev-suggestions"
                  className="w-full h-9 rounded-md border border-slate-200 px-3 text-sm focus:border-blue-400 focus:outline-none"
                  placeholder="Fonasa A/B/C/D"
                />
              </Field>
              <Field label="Servicio">
                <input
                  value={f.servicio}
                  onChange={e => u('servicio', e.target.value)}
                  list="serv-suggestions"
                  className="w-full h-9 rounded-md border border-slate-200 px-3 text-sm focus:border-blue-400 focus:outline-none"
                  placeholder="MQ1, MQ2, Pediatría…"
                />
              </Field>
              <Field label="Sala">
                <input
                  value={f.sala}
                  onChange={e => u('sala', e.target.value)}
                  list="sala-suggestions"
                  className="w-full h-9 rounded-md border border-slate-200 px-3 text-sm focus:border-blue-400 focus:outline-none"
                  placeholder="MQ1 - Sala 3…"
                />
              </Field>
              <Field label="Cama">
                <Input value={f.cama} onChange={e => u('cama', e.target.value)} className="h-9" />
              </Field>
              <Field label="Fecha toma de muestra">
                <Input type="date" value={f.fecha_toma} onChange={e => u('fecha_toma', e.target.value)} className="h-9" />
              </Field>

              <Field label="Diagnóstico probable" span="col-span-2 md:col-span-4">
                <Textarea value={f.diagnostico} onChange={e => u('diagnostico', e.target.value)} className="min-h-[60px]" />
              </Field>
              <Field label="Tratamiento antibiótico" span="col-span-2 md:col-span-4">
                <input
                  value={f.tratamiento_antibiotico}
                  onChange={e => u('tratamiento_antibiotico', e.target.value)}
                  list="abx-suggestions"
                  className="w-full h-9 rounded-md border border-slate-200 px-3 text-sm focus:border-blue-400 focus:outline-none"
                  placeholder="Empieza a escribir, sugerencias aparecen abajo (opcional)"
                />
              </Field>
              <Field label="Tipo de muestra" span="col-span-2">
                <input
                  value={f.tipo_muestra}
                  onChange={e => u('tipo_muestra', e.target.value)}
                  list="muestra-suggestions"
                  className="w-full h-9 rounded-md border border-slate-200 px-3 text-sm focus:border-blue-400 focus:outline-none"
                  placeholder="Orina, esputo, hemocultivo…"
                />
              </Field>
              <Field label="Sitio anatómico" span="col-span-2">
                <input
                  value={f.sitio_anatomico}
                  onChange={e => u('sitio_anatomico', e.target.value)}
                  list="sitio-suggestions"
                  className="w-full h-9 rounded-md border border-slate-200 px-3 text-sm focus:border-blue-400 focus:outline-none"
                  placeholder="Tracto urinario, faringe…"
                />
              </Field>
              <Field label="Profesional solicitante" span="col-span-2 md:col-span-4">
                <Input value={f.profesional} onChange={e => u('profesional', e.target.value)} className="h-9" />
              </Field>
            </div>

            {/* Selector de exámenes */}
            <div className="space-y-3">
              <p className="text-sm font-bold text-slate-900">Exámenes solicitados</p>
              {[SECTION_A, SECTION_B, SECTION_C].map(section => (
                <div key={section.title} className="rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-xs font-bold uppercase text-slate-700 mb-2">{section.title}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                    {[...section.left, ...section.right].map(exam => (
                      <label key={exam.code} className="flex items-start gap-2 px-1 py-1 rounded hover:bg-slate-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!f.selected[exam.code]}
                          onChange={() => toggleExam(exam.code)}
                          className="mt-1"
                        />
                        <span className="text-xs leading-snug">
                          <span className="font-mono text-[10px] text-slate-500 mr-1">{exam.code}</span>
                          {exam.name}
                          {exam.hasNote && f.selected[exam.code] && (
                            <Input
                              value={f.cultivo_corriente_detalle}
                              onChange={e => u('cultivo_corriente_detalle', e.target.value)}
                              placeholder="Especificar secreción y sitio anatómico"
                              className="h-7 text-xs mt-1"
                              onClick={e => e.stopPropagation()}
                            />
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              {/* Exámenes especiales (texto libre) */}
              <Field label="Otros exámenes / texto libre (se imprime al final del formulario)">
                <Textarea
                  value={f.examenes_libres}
                  onChange={e => u('examenes_libres', e.target.value)}
                  className="min-h-[60px]"
                  placeholder="Ej: PCR multiplex respiratoria, panel meníngeo, etc."
                />
              </Field>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <Button variant="outline" onClick={clear}>Limpiar datos</Button>
              <Button onClick={() => setShowPreview(true)} className="bg-cyan-600 hover:bg-cyan-700 gap-2">
                Generar formulario →
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Documento generado — vista previa estilo PDF */}
      {showPreview && (
        <div className="micro-pdf-viewer">
          <div
            className="micro-print-page"
            style={{
              padding: '12mm',
              fontFamily: "Arial, Helvetica, sans-serif",
              fontSize: '10pt',
              color: '#000',
              minHeight: '273mm',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12pt', marginBottom: '8pt' }}>
              <HospitalLogo />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '10pt', fontWeight: 'bold', margin: 0 }}>HOSPITAL COMUNITARIO DE SALUD</p>
                <p style={{ fontSize: '10pt', fontWeight: 'bold', margin: 0 }}>FAMILIAR DE BULNES</p>
                <p style={{ fontSize: '12.5pt', fontWeight: 'bold', textDecoration: 'underline', textAlign: 'right', marginTop: '6pt', marginBottom: 0 }}>
                  FORMULARIO DE EXÁMENES MICROBIOLÓGICOS
                </p>
              </div>
            </div>

            {/* Caja datos paciente */}
            <div style={{ border: '1pt solid #000', padding: '6pt 8pt', marginBottom: '6pt', fontSize: '10pt' }}>
              <p style={{ fontStyle: 'italic', textAlign: 'center', margin: '0 0 6pt 0', fontSize: '9pt' }}>
                (Es de su responsabilidad completar todos los datos con letra legible o causará el rechazo de las muestras)
              </p>
              <FieldLine label="Nombre" value={f.nombre} />
              <div style={{ display: 'flex', gap: '8pt', flexWrap: 'wrap' }}>
                <FieldLine label="Fecha de Nacimiento" value={f.fecha_nacimiento ? formatDateLocal(f.fecha_nacimiento) : ''} w="38%" />
                <FieldLine label="RUT" value={f.rut} w="28%" />
                <FieldLine label="Previsión" value={f.prevision} w="28%" />
              </div>
              <div style={{ display: 'flex', gap: '8pt', flexWrap: 'wrap' }}>
                <FieldLine label="Diagnóstico Probable" value={f.diagnostico} w="38%" />
                <FieldLine label="Servicio" value={f.servicio} w="22%" />
                <FieldLine label="Sala" value={f.sala} w="15%" />
                <FieldLine label="Cama" value={f.cama} w="15%" />
              </div>
              <FieldLine label="Tratamiento Antibiótico" value={f.tratamiento_antibiotico} />
              <div style={{ display: 'flex', gap: '8pt', flexWrap: 'wrap' }}>
                <FieldLine label="Tipo de Muestra" value={f.tipo_muestra} w="48%" />
                <FieldLine label="Sitio Anatómico" value={f.sitio_anatomico} w="48%" />
              </div>
              <FieldLine label="Fecha y hora de toma de muestra" value={f.fecha_toma ? formatDateLocal(f.fecha_toma) : ''} />
            </div>

            {/* Sección A — dos columnas */}
            <TwoColSection section={SECTION_A} f={f} toggleExam={toggleExam} onNoteChange={(v) => u('cultivo_corriente_detalle', v)} />

            {/* Sección B */}
            <TwoColSection section={SECTION_B} f={f} toggleExam={toggleExam} />

            {/* Sección C + cuadro firma a la derecha */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12pt', marginTop: '6pt' }}>
              <div>
                <p style={{ fontWeight: 'bold', textDecoration: 'underline', fontSize: '10.5pt', margin: '4pt 0' }}>{SECTION_C.title}</p>
                <ColumnHeader />
                {SECTION_C.left.map(exam => (
                  <ExamRow key={exam.code} exam={exam} selected={f.selected[exam.code]} onToggle={() => toggleExam(exam.code)} />
                ))}
              </div>
              <div style={{ border: '1pt solid #000', padding: '8pt' }}>
                <p style={{ fontSize: '10pt', fontWeight: 'bold', margin: '0 0 8pt 0' }}>PROFESIONAL SOLICITANTE:</p>
                <div style={{ borderBottom: '1pt solid #000', minHeight: '14pt', marginBottom: '14pt', padding: '0 2pt', fontSize: '10pt' }}>
                  {f.profesional || ''}
                </div>
                <p style={{ fontSize: '10pt', margin: 0 }}>
                  FIRMA Y TIMBRE
                  <span style={{ display: 'inline-block', borderBottom: '1pt solid #000', minWidth: '60%', marginLeft: '6pt', height: '14pt' }} />
                </p>
              </div>
            </div>

            {/* Texto libre — exámenes especiales */}
            {f.examenes_libres && (
              <div style={{ marginTop: '8pt', borderTop: '1pt dashed #999', paddingTop: '6pt' }}>
                <p style={{ fontSize: '10pt', fontWeight: 'bold', margin: '0 0 4pt 0' }}>Otros exámenes solicitados:</p>
                <p style={{ fontSize: '10pt', whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.4 }}>{f.examenes_libres}</p>
              </div>
            )}

            <p style={{ textAlign: 'right', fontSize: '9pt', marginTop: '8pt', fontWeight: 'bold' }}>C 162</p>
          </div>
        </div>
      )}

      {/* Datalists para autocompletado (compartidos entre inputs) */}
      <datalist id="muestra-suggestions">
        {SAMPLE_TYPES.map(s => <option key={s} value={s} />)}
      </datalist>
      <datalist id="abx-suggestions">
        {ANTIBIOTICS.map(s => <option key={s} value={s} />)}
      </datalist>
      <datalist id="sitio-suggestions">
        {ANATOMICAL_SITES.map(s => <option key={s} value={s} />)}
      </datalist>
      <datalist id="serv-suggestions">
        {SERVICIOS.map(s => <option key={s} value={s} />)}
      </datalist>
      <datalist id="sala-suggestions">
        {SALAS.map(s => <option key={s} value={s} />)}
      </datalist>
      <datalist id="prev-suggestions">
        {PREVISIONES.map(s => <option key={s} value={s} />)}
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

function FieldLine({ label, value, w }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '4pt', flex: w ? `0 0 ${w}` : '1 1 auto', marginRight: '6pt', marginBottom: '4pt', minWidth: '40%' }}>
      <span style={{ fontSize: '10pt', whiteSpace: 'nowrap' }}>{label}</span>
      <span style={{ flex: 1, borderBottom: '1pt solid #000', fontSize: '10pt', padding: '0 2pt', minHeight: '14pt' }}>{value}</span>
    </div>
  );
}

function ColumnHeader() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '70pt 1fr', borderBottom: '1pt solid #000', paddingBottom: '2pt', marginBottom: '4pt', fontSize: '9pt', fontWeight: 'bold' }}>
      <span>CÓDIGO</span>
      <span>PRESTACIÓN</span>
    </div>
  );
}

function TwoColSection({ section, f, toggleExam, onNoteChange }) {
  return (
    <div style={{ marginTop: '6pt' }}>
      <p style={{ fontWeight: 'bold', textDecoration: 'underline', fontSize: '10.5pt', margin: '4pt 0' }}>{section.title}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14pt' }}>
        <div>
          <ColumnHeader />
          {section.left.map(exam => (
            <ExamRow
              key={exam.code}
              exam={exam}
              selected={f.selected[exam.code]}
              onToggle={() => toggleExam(exam.code)}
              noteValue={exam.hasNote ? f.cultivo_corriente_detalle : null}
              onNoteChange={onNoteChange}
            />
          ))}
        </div>
        <div>
          <ColumnHeader />
          {section.right.map(exam => (
            <ExamRow
              key={exam.code}
              exam={exam}
              selected={f.selected[exam.code]}
              onToggle={() => toggleExam(exam.code)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function formatDateLocal(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}-${m}-${y}`;
}
