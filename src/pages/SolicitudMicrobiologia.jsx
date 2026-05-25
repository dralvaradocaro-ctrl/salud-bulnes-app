import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronLeft, Printer, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getMultiPrefill } from '@/lib/multiTemplatePrefill';

// Exámenes microbiológicos del Hospital Comunitario de Salud Familiar de Bulnes
// (formato oficial — formulario C 162).
const SECTIONS = [
  {
    id: 'bacteriologicos',
    title: 'A. EXÁMENES BACTERIOLÓGICOS',
    exams: [
      { code: '03.06.011', name: 'UROCULTIVO' },
      { code: '03.06.007', name: 'COPROCULTIVO' },
      { code: '03.06.008', name: 'CULTIVO CORRIENTE DE (especificar tipo de secreción y sitio anatómico)', hasNote: true },
      { code: '03.06.099', name: 'BÚSQUEDA DE STREPTOCOCCUS GRUPO B' },
      { code: '03.06.016', name: 'NEISSERIA GONORRHOEAE' },
      { code: '03.06.023', name: 'UREAPLASMA Y MYCOPLASMA' },
      { code: '03.06.034', name: 'CLAMIDIA' },
      { code: '03.08.044', name: 'CULTIVO DE SECRECIÓN URETRAL' },
      { code: '03.08.045', name: 'CULTIVO DE FLUJO VAGINAL (incluye directo al fresco y tinción Gram)' },
    ],
  },
  {
    id: 'microbiologicos',
    title: 'B. EXÁMENES MICROBIOLÓGICOS',
    exams: [
      { code: '03.08.011', name: 'DIRECTO AL FRESCO' },
      { code: '03.06.005', name: 'TINCIÓN DE GRAM' },
      { code: '03.06.004', name: 'ACAROTEST' },
      { code: '03.06.117', name: 'CULTIVO DE HONGOS' },
      { code: '03.06.004b', name: 'MICOLÓGICO DIRECTO' },
    ],
  },
  {
    id: 'virologicos',
    title: 'C. EXÁMENES VIROLÓGICOS',
    exams: [
      { code: '03.06.270', name: 'VIRUS RESPIRATORIO SINCICIAL' },
    ],
  },
];

function formatRut(raw) {
  if (!raw) return '';
  const clean = String(raw).replace(/[^0-9kK]/g, '').toUpperCase();
  if (!clean) return '';
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  if (!body) return dv;
  return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}`;
}

const EMPTY = {
  nombre: '', rut: '', fecha_nacimiento: '', prevision: '',
  servicio: '', sala: '', cama: '',
  diagnostico: '', tratamiento_antibiotico: '',
  tipo_muestra: '', sitio_anatomico: '',
  fecha_hora_toma: '',
  cultivo_corriente_detalle: '',
  profesional: '',
  selected: {}, // { '03.06.011': true, ... }
};

function HospitalLogo({ printMode = false }) {
  const [failed, setFailed] = useState(false);
  const h = printMode ? '60px' : '64px';
  if (!failed) {
    return (
      <img
        src="/logo-hospital.png"
        alt="Hospital Comunitario de Salud Familiar de Bulnes"
        style={{ height: h, width: 'auto', objectFit: 'contain', display: 'block' }}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div style={{ height: h, width: '72px', background: '#1565c0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }}>
      <span style={{ color: 'white', fontWeight: 'bold', fontSize: '11px' }}>HCSFB</span>
    </div>
  );
}

export default function SolicitudMicrobiologia() {
  const [f, setF] = useState(EMPTY);
  const u = (k, v) => setF(prev => ({ ...prev, [k]: v }));
  const toggleExam = (code) => setF(prev => ({
    ...prev,
    selected: { ...prev.selected, [code]: !prev.selected[code] },
  }));
  const clear = () => setF(EMPTY);

  // Prefill desde el wizard multi-plantilla.
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

  const F_LINE = ({ label, value, onChange, w, type = 'text' }) => (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '4pt', flexWrap: 'nowrap' }}>
      <span style={{ fontSize: '10.5pt', whiteSpace: 'nowrap' }}>{label}</span>
      <input
        type={type}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        style={{
          flex: w ? `0 0 ${w}` : '1 1 auto',
          minWidth: '40pt',
          border: 'none',
          borderBottom: '1pt solid #000',
          padding: '0 2pt',
          fontSize: '10.5pt',
          background: 'transparent',
          outline: 'none',
        }}
      />
    </span>
  );

  return (
    <>
      <style>{`
        @page { size: A4 portrait; margin: 12mm; }
        @media print {
          html, body, #root { background: #fff !important; }
          .micro-screen-only { display: none !important; }
          .micro-print-page {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            max-width: none !important;
            width: 100% !important;
          }
        }
      `}</style>

      {/* Toolbar — solo pantalla */}
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
          <Button size="sm" onClick={() => window.print()} className="gap-1.5 bg-blue-600 hover:bg-blue-700">
            <Printer className="h-4 w-4" /> Imprimir / PDF
          </Button>
        </div>
      </div>

      {/* Página A4 imprimible */}
      <div
        className="micro-print-page mx-auto bg-white shadow"
        style={{
          maxWidth: '210mm',
          minHeight: '297mm',
          padding: '12mm',
          fontFamily: "Arial, Helvetica, sans-serif",
          fontSize: '10.5pt',
          color: '#000',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12pt', marginBottom: '8pt' }}>
          <HospitalLogo printMode />
          <div style={{ flex: 1, paddingTop: '4pt' }}>
            <p style={{ fontSize: '11pt', fontWeight: 'bold', margin: 0 }}>
              HOSPITAL COMUNITARIO DE SALUD FAMILIAR DE BULNES
            </p>
            <p style={{ fontSize: '13pt', fontWeight: 'bold', textDecoration: 'underline', textAlign: 'center', marginTop: '6pt', marginBottom: 0 }}>
              FORMULARIO DE EXÁMENES MICROBIOLÓGICOS
            </p>
          </div>
        </div>

        {/* Caja de datos del paciente */}
        <div style={{ border: '1pt solid #000', padding: '6pt 8pt', marginBottom: '8pt' }}>
          <p style={{ fontSize: '9.5pt', fontStyle: 'italic', textAlign: 'center', margin: '0 0 6pt 0' }}>
            (Es de su responsabilidad completar todos los datos con letra legible o causará el rechazo de las muestras)
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6pt 14pt', marginBottom: '6pt' }}>
            <F_LINE label="Nombre" value={f.nombre} onChange={v => u('nombre', v)} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6pt 14pt', marginBottom: '6pt' }}>
            <F_LINE label="Fecha de Nacimiento" value={f.fecha_nacimiento} onChange={v => u('fecha_nacimiento', v)} type="date" w="120pt" />
            <F_LINE label="RUT" value={f.rut} onChange={v => u('rut', formatRut(v))} w="120pt" />
            <F_LINE label="Previsión" value={f.prevision} onChange={v => u('prevision', v)} w="120pt" />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6pt 14pt', marginBottom: '6pt' }}>
            <F_LINE label="Diagnóstico Probable" value={f.diagnostico} onChange={v => u('diagnostico', v)} />
            <F_LINE label="Servicio" value={f.servicio} onChange={v => u('servicio', v)} w="120pt" />
            <F_LINE label="Sala" value={f.sala} onChange={v => u('sala', v)} w="60pt" />
            <F_LINE label="Cama" value={f.cama} onChange={v => u('cama', v)} w="60pt" />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6pt 14pt', marginBottom: '6pt' }}>
            <F_LINE label="Tratamiento Antibiótico" value={f.tratamiento_antibiotico} onChange={v => u('tratamiento_antibiotico', v)} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6pt 14pt', marginBottom: '6pt' }}>
            <F_LINE label="Tipo de Muestra" value={f.tipo_muestra} onChange={v => u('tipo_muestra', v)} />
            <F_LINE label="Sitio Anatómico" value={f.sitio_anatomico} onChange={v => u('sitio_anatomico', v)} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6pt 14pt' }}>
            <F_LINE label="Fecha y hora de toma de muestra" value={f.fecha_hora_toma} onChange={v => u('fecha_hora_toma', v)} type="datetime-local" w="220pt" />
          </div>
        </div>

        {/* Secciones de exámenes */}
        {SECTIONS.map(section => (
          <div key={section.id} style={{ marginBottom: '8pt' }}>
            <p style={{ fontWeight: 'bold', fontSize: '10.5pt', margin: '4pt 0' }}>{section.title}</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10pt' }}>
              <thead>
                <tr style={{ background: '#f5f5f5' }}>
                  <th style={{ border: '1pt solid #ccc', padding: '2pt 4pt', textAlign: 'left', fontWeight: 'bold', width: '14%' }}>CÓDIGO</th>
                  <th style={{ border: '1pt solid #ccc', padding: '2pt 4pt', textAlign: 'left', fontWeight: 'bold' }}>PRESTACIÓN</th>
                  <th style={{ border: '1pt solid #ccc', padding: '2pt 4pt', textAlign: 'center', width: '8%' }}></th>
                </tr>
              </thead>
              <tbody>
                {section.exams.map(exam => {
                  const isSelected = !!f.selected[exam.code];
                  return (
                    <tr key={exam.code} style={isSelected ? { background: '#e0f2fe' } : null}>
                      <td style={{ border: '1pt solid #ccc', padding: '2pt 4pt', fontFamily: 'monospace' }}>{exam.code}</td>
                      <td style={{ border: '1pt solid #ccc', padding: '2pt 4pt' }}>
                        {exam.name}
                        {exam.hasNote && isSelected && (
                          <input
                            value={f.cultivo_corriente_detalle}
                            onChange={e => u('cultivo_corriente_detalle', e.target.value)}
                            placeholder="Especificar…"
                            style={{
                              display: 'block',
                              width: '100%',
                              marginTop: '2pt',
                              border: 'none',
                              borderBottom: '1pt solid #999',
                              fontSize: '9.5pt',
                              padding: '0 2pt',
                              background: 'transparent',
                              outline: 'none',
                            }}
                          />
                        )}
                      </td>
                      <td style={{ border: '1pt solid #ccc', padding: '2pt 4pt', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleExam(exam.code)}
                          style={{ width: '14px', height: '14px', cursor: 'pointer' }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}

        {/* Firma */}
        <div style={{ border: '1pt solid #000', padding: '8pt', marginTop: '10pt' }}>
          <div style={{ marginBottom: '12pt' }}>
            <F_LINE label="PROFESIONAL SOLICITANTE:" value={f.profesional} onChange={v => u('profesional', v)} />
          </div>
          <div>
            <span style={{ fontSize: '10.5pt' }}>FIRMA Y TIMBRE</span>
            <span style={{ display: 'inline-block', borderBottom: '1pt solid #000', width: '70%', marginLeft: '6pt', height: '14pt' }} />
          </div>
        </div>

        <p style={{ textAlign: 'right', fontSize: '9.5pt', marginTop: '6pt', fontWeight: 'bold' }}>C 162</p>
      </div>
    </>
  );
}
