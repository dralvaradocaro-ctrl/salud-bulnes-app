import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronLeft, Printer, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getMultiPrefill } from '@/lib/multiTemplatePrefill';

// ── Formato RUT chileno (idéntico al usado en otros formularios) ───────
function formatRut(raw) {
  if (!raw) return '';
  const clean = String(raw).replace(/[^0-9kK]/g, '').toUpperCase();
  if (!clean) return '';
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  if (!body) return dv;
  const bodyDotted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${bodyDotted}-${dv}`;
}

// Logo ISP — se carga vía http al cliente al imprimir (Wikipedia Commons).
const ISP_LOGO = 'https://upload.wikimedia.org/wikipedia/commons/0/02/Logotipo_del_Instituto_de_Salud_P%C3%BAblica_de_Chile.png';

// Defaults institucionales HCSFB / Bulnes — pre-rellenan el formulario para
// agilizar el llenado. Las casillas de Inmunofluorescencia vienen marcadas
// (excepto "Negativo"), tórula nasofaríngea como tipo de muestra y el
// paciente se asume hospitalizado por defecto.
const HCSFB_DEFAULTS = {
  laboratorio: 'Hospital de Bulnes',
  procRegion:   'Ñuble',
  procProvincia:'Diguillín',
  procComuna:   'Bulnes',
  procDireccion:'Manuel Bulnes 431',
  unidad:       'Medicina',
  // Inmuno Fluorescencia: todas menos negativo
  ifInfluenzaA: true, ifInfluenzaB: true, ifVRS: true, ifAdenovirus: true,
  ifParainfluenza: true, ifMetapneumovirus: true, ifNegativo: false,
  // Tipo de muestra: tórula nasofaríngea
  mTorulasNF: true,
  // Paciente asumido hospitalizado
  hospitalizado: true,
};

const EMPTY = {
  nEpivigila: '',
  // Información del Paciente
  rut: '', nombres: '', apPaterno: '', apMaterno: '',
  sexo: '', // 'F' | 'M'
  fechaNacDia: '', fechaNacMes: '', fechaNacAno: '',
  edadAnos: '', edadMeses: '', edadDias: '',
  direccion: '', region: '', ciudadLocalidad: '', comuna: '',
  telefono: '', prevision: '',
  // Datos de la Procedencia
  profResponsable: '', procRegion: '', procProvincia: '', procComuna: '', procDireccion: '',
  laboratorio: '', unidad: '', correo: '', fono: '', fax: '',
  // Antecedentes de la Muestra
  fechaObtDia: '', fechaObtMes: '', fechaObtAno: '', horaObt: '',
  // Inmuno Fluorescencia
  ifInfluenzaA: false, ifInfluenzaB: false, ifVRS: false, ifAdenovirus: false,
  ifParainfluenza: false, ifMetapneumovirus: false, ifNegativo: false,
  ifEstablecimiento: '',
  // Test Pack
  tpInfluenzaA: false, tpInfluenzaB: false, tpNegativo: false, tpEstablecimiento: '',
  // RT-PCR / Film Array
  pcrInfluenzaAH1N1: false, pcrInfluenzaAH3N2: false, pcrInfluenzaAnoSubt: false,
  pcrInfluenzaB: false, pcrNegativo: false, pcrOtro: '',
  pcrEstablecimiento: '',
  // Tipo de Muestra
  mLavado: false, mEsputo: false, mAspirado: false, mAspiradoNF: false, mTorulasNF: false,
  mBiopsia: false, mTorulaOF: false, mSangre: false,
  // Antecedentes Clínicos / Epidemiológicos
  inicioSintDia: '', inicioSintMes: '', inicioSintAno: '',
  primConsultaDia: '', primConsultaMes: '', primConsultaAno: '',
  trabAvicola: false, trabajador: false, embarazo: false, semanasGest: '',
  viajoExtranjero: false, paisViaje: '', ciudadViaje: '',
  // Síntomas
  sFiebre: false, sDolorGarganta: false, sMialgia: false, sNeumonia: false,
  sEncefalitis: false, sTos: false, sRinorrea: false, sDifResp: false, sHipotension: false,
  sCefalea: false, sTaquipnea: false, sHipoxia: false, sCianosis: false,
  sDeshidratacion: false, sCompromisoHemo: false, sConsultaRepetida: false, sEnfBase: false,
  enfBaseDetalle: '',
  // Vacunación
  vacInfluenza: false, vacFechaDia: '', vacFechaMes: '', vacFechaAno: '',
  // Hospitalización
  hospitalizado: false, hFechaDia: '', hFechaMes: '', hFechaAno: '',
  diagIngreso: '',
  grave: false, vm: false, ecmo: false, ingresoUci: false, vafo: false,
  usoAntiviral: false, antDia: '', antMes: '', antAno: '',
  oseltamivir: false, zanamivir: false,
  // Fallecimiento
  fallece: false, fFechaDia: '', fFechaMes: '', fFechaAno: '',
  diagFallecimiento: '',
};

// Calcula edad en años/meses/días desde una fecha ISO YYYY-MM-DD.
function calcAgeFromIso(iso) {
  if (!iso) return { y: '', m: '', d: '' };
  const today = new Date();
  const birth = new Date(iso);
  if (isNaN(birth.getTime())) return { y: '', m: '', d: '' };
  let y = today.getFullYear() - birth.getFullYear();
  let m = today.getMonth() - birth.getMonth();
  let d = today.getDate() - birth.getDate();
  if (d < 0) {
    m -= 1;
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
    d += prevMonth.getDate();
  }
  if (m < 0) { y -= 1; m += 12; }
  if (y < 0) return { y: '', m: '', d: '' };
  return { y: String(y), m: String(m), d: String(d) };
}

function isoFromDma(dia, mes, ano) {
  if (!dia || !mes || !ano) return '';
  const d = String(dia).padStart(2, '0');
  const m = String(mes).padStart(2, '0');
  const y = String(ano).length === 2 ? '20' + ano : ano;
  return `${y}-${m}-${d}`;
}

function todayDma() {
  const t = new Date();
  return { dia: String(t.getDate()), mes: String(t.getMonth() + 1), ano: String(t.getFullYear()) };
}

function nowHHMM() {
  const t = new Date();
  return `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
}

// Tipografía oficial del Gobierno de Chile (gobCL, desarrollada por
// FrescoType en 2010 para la identidad visual del Estado). Los OTF se
// sirven desde /public/fonts (descargados de kitdigital.gob.cl). Fallback
// a Lato / Arial por si los archivos no carguen.
const F = "'gobCL','Lato',Arial,Helvetica,sans-serif";
const FS = '9pt';
const B = '0.4pt solid #000';

const labelStyle = { fontFamily: F, fontSize: FS, color: '#000' };
const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  border: B, padding: '1px 4px',
  fontFamily: F, fontSize: FS,
  background: '#fff', height: '14pt', borderRadius: 0, outline: 'none',
};
const smallInputStyle = { ...inputStyle, width: '28pt', textAlign: 'center', padding: '1px 2px' };
const sectionTitleStyle = {
  fontFamily: F, fontWeight: 700, fontSize: '13pt',
  borderBottom: '1.2pt solid #000', paddingBottom: '3pt',
  marginTop: '10pt', marginBottom: '6pt',
  letterSpacing: '-0.2pt',
};

function Cell({ children, style }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: '4pt', ...style }}>{children}</div>;
}

function Lbl({ children, w }) {
  return <span style={{ ...labelStyle, whiteSpace: 'nowrap', minWidth: w }}>{children}</span>;
}

function Txt({ value, onChange, style, type = 'text', placeholder }) {
  return (
    <input
      type={type}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      style={{ ...inputStyle, ...style }}
      placeholder={placeholder}
    />
  );
}

function Num3({ value, onChange }) {
  return (
    <input
      value={value || ''}
      onChange={e => onChange(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
      style={smallInputStyle}
      inputMode="numeric"
    />
  );
}

function Chk({ label, checked, onChange }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4pt', cursor: 'pointer', ...labelStyle }}>
      <input
        type="checkbox"
        checked={!!checked}
        onChange={e => onChange(e.target.checked)}
        style={{ width: '11pt', height: '11pt', margin: 0, cursor: 'pointer' }}
      />
      <span>{label}</span>
    </label>
  );
}

function Radio({ label, checked, onChange }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4pt', cursor: 'pointer', ...labelStyle }}>
      <input
        type="radio"
        checked={!!checked}
        onChange={e => onChange(e.target.checked)}
        style={{ width: '11pt', height: '11pt', margin: 0, cursor: 'pointer' }}
      />
      <span>{label}</span>
    </label>
  );
}

function DateDMA({ dia, mes, ano, onChange }) {
  return (
    <Cell>
      <Num3 value={dia} onChange={v => onChange({ dia: v })} />
      <span style={{ ...labelStyle, fontSize: '8pt', color: '#666' }}>Día</span>
      <Num3 value={mes} onChange={v => onChange({ mes: v })} />
      <span style={{ ...labelStyle, fontSize: '8pt', color: '#666' }}>Mes</span>
      <Num3 value={ano} onChange={v => onChange({ ano: v })} />
      <span style={{ ...labelStyle, fontSize: '8pt', color: '#666' }}>Año</span>
    </Cell>
  );
}

export default function FormularioIRAGrave() {
  const navigate = useNavigate();
  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate(createPageUrl('Home'));
  };
  const [f, setF] = useState({ ...EMPTY, ...HCSFB_DEFAULTS });
  const [showPreview, setShowPreview] = useState(false);
  const u = useCallback((k, v) => setF(prev => ({ ...prev, [k]: v })), []);
  const setDate = (prefix) => (changes) => {
    setF(prev => {
      const next = {
        ...prev,
        [`${prefix}Dia`]: changes.dia ?? prev[`${prefix}Dia`],
        [`${prefix}Mes`]: changes.mes ?? prev[`${prefix}Mes`],
        [`${prefix}Ano`]: changes.ano ?? prev[`${prefix}Ano`],
      };
      // Cuando cambia fecha de nacimiento, recalcular edad.
      if (prefix === 'fechaNac') {
        const iso = isoFromDma(next.fechaNacDia, next.fechaNacMes, next.fechaNacAno);
        const age = calcAgeFromIso(iso);
        if (age.y !== '') {
          next.edadAnos = age.y;
          next.edadMeses = age.m;
          next.edadDias = age.d;
        }
      }
      return next;
    });
  };

  // Prefill desde el wizard multi-plantilla.
  useEffect(() => {
    const p = getMultiPrefill();
    if (!p) return;
    let apPaterno = '';
    let apMaterno = '';
    let nombres = '';
    if (p.patient_name) {
      const parts = p.patient_name.split(',');
      if (parts.length >= 2) {
        const apellidos = parts[0].trim().split(/\s+/);
        apPaterno = apellidos[0] || '';
        apMaterno = apellidos.slice(1).join(' ');
        nombres = parts.slice(1).join(',').trim();
      } else {
        nombres = p.patient_name.trim();
      }
    }
    let dia = '', mes = '', ano = '';
    if (p.patient_fecha_nac) {
      const [y, m, d] = p.patient_fecha_nac.split('-');
      dia = d || ''; mes = m || ''; ano = y || '';
    }
    setF(prev => {
      const next = {
        ...prev,
        rut:        p.patient_rut ? formatRut(p.patient_rut) : prev.rut,
        nombres:    nombres   || prev.nombres,
        apPaterno:  apPaterno || prev.apPaterno,
        apMaterno:  apMaterno || prev.apMaterno,
        fechaNacDia: dia || prev.fechaNacDia,
        fechaNacMes: mes || prev.fechaNacMes,
        fechaNacAno: ano || prev.fechaNacAno,
        direccion:  p.patient_direccion || prev.direccion,
        comuna:     p.patient_comuna    || prev.comuna,
        telefono:   p.patient_telefono  || prev.telefono,
        prevision:  p.prevision         || prev.prevision,
      };
      if (p.patient_fecha_nac) {
        const age = calcAgeFromIso(p.patient_fecha_nac);
        if (age.y !== '') {
          next.edadAnos = age.y;
          next.edadMeses = age.m;
          next.edadDias = age.d;
        }
      }
      return next;
    });
  }, []);

  const clear = () => setF({ ...EMPTY, ...HCSFB_DEFAULTS });

  // ── Panel "Datos previos" (solo pantalla) ─────────────────────────────
  // Captura los campos críticos en una sola UI compacta. Los cambios fluyen
  // al mismo state que el PDF imprimible — la edad se autocalcula desde la
  // fecha de nacimiento. Fecha de obtención / hora se pueden setear "ahora"
  // con un click.
  const fechaNacIso = isoFromDma(f.fechaNacDia, f.fechaNacMes, f.fechaNacAno);
  const fechaInicioIso = isoFromDma(f.inicioSintDia, f.inicioSintMes, f.inicioSintAno);
  const fechaPrimConsIso = isoFromDma(f.primConsultaDia, f.primConsultaMes, f.primConsultaAno);
  const fechaHospIso = isoFromDma(f.hFechaDia, f.hFechaMes, f.hFechaAno);
  const fechaObtIso = isoFromDma(f.fechaObtDia, f.fechaObtMes, f.fechaObtAno);

  const setIsoDate = (prefix) => (iso) => {
    if (!iso) {
      setDate(prefix)({ dia: '', mes: '', ano: '' });
      return;
    }
    const [y, m, d] = iso.split('-');
    setDate(prefix)({ dia: d, mes: m, ano: y });
  };

  const marcarMuestraAhora = () => {
    const t = todayDma();
    setF(prev => ({
      ...prev,
      fechaObtDia: t.dia, fechaObtMes: t.mes, fechaObtAno: t.ano,
      horaObt: nowHHMM(),
    }));
  };

  const QuickField = ({ label, children, span = 'col-span-1' }) => (
    <div className={span}>
      <label className="block text-[11px] font-medium text-slate-600 mb-1">{label}</label>
      {children}
    </div>
  );
  const QuickInput = (props) => (
    <input
      {...props}
      className={`w-full h-9 rounded-md border border-slate-300 px-2.5 text-sm focus:border-blue-400 focus:outline-none ${props.className || ''}`}
    />
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap');
        @font-face {
          font-family: 'gobCL';
          src: url('/fonts/gobCL_Light.otf') format('opentype');
          font-weight: 300; font-style: normal; font-display: swap;
        }
        @font-face {
          font-family: 'gobCL';
          src: url('/fonts/gobCL_Regular.otf') format('opentype');
          font-weight: 400; font-style: normal; font-display: swap;
        }
        @font-face {
          font-family: 'gobCL';
          src: url('/fonts/gobCL_Bold.otf') format('opentype');
          font-weight: 700; font-style: normal; font-display: swap;
        }
        @font-face {
          font-family: 'gobCL';
          src: url('/fonts/gobCL_Heavy.otf') format('opentype');
          font-weight: 900; font-style: normal; font-display: swap;
        }
        @page { size: A4 portrait; margin: 6mm 8mm; }
        html, body, #root { background: #fff !important; }
        @media print {
          html, body, #root, body > div, body > div > div {
            background: #fff !important;
            background-color: #fff !important;
          }
          body { margin: 0 !important; padding: 0 !important; font-family: 'gobCL','Lato',Arial,Helvetica,sans-serif !important; }
          /* Imprimir SOLO las dos páginas A4. El toolbar, panel de datos y
             cualquier otra UI quedan ocultos. */
          .ira-screen-only, .ira-no-print { display: none !important; }
          .ira-print-page {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            max-width: none !important;
            width: 100% !important;
            page-break-after: always;
            page-break-inside: avoid;
          }
          .ira-print-page:last-child { page-break-after: auto; }
          input { border: 0.4pt solid #000 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          input[type="checkbox"], input[type="radio"] {
            -webkit-print-color-adjust: exact; print-color-adjust: exact;
          }
          .ira-header-band img {
            -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important;
          }
        }
        .ira-header-band {
          display: flex; align-items: center; gap: 14pt;
          border-bottom: 1pt solid #000; padding-bottom: 6pt; margin-bottom: 8pt;
        }
        .ira-header-band img {
          height: 22mm; width: auto; object-fit: contain;
          flex-shrink: 0;
        }
        .ira-header-band .ira-title {
          font-weight: 700;
          font-size: 14pt;
          line-height: 1.15;
          margin: 0;
          letter-spacing: -0.1pt;
        }
        .ira-header-band .ira-code { font-size: 9pt; margin: 3pt 0 0 0; color: #222; }
        .ira-header-band .ira-meta { text-align: right; font-size: 8pt; color: #444; line-height: 1.3; }
        /* Visor estilo PDF: fondo gris, hojas A4 centradas con sombra. */
        .ira-pdf-viewer {
          background: #525659;
          padding: 24px 16px;
          min-height: calc(100vh - 60px);
        }
        .ira-pdf-viewer .ira-print-page {
          width: 210mm;
          min-height: 297mm;
          padding: 8mm 10mm;
          background: #fff;
          box-shadow: 0 8px 28px rgba(0,0,0,0.45);
          margin: 0 auto 18px auto;
        }
        @media print {
          .ira-pdf-viewer {
            background: #fff !important;
            padding: 0 !important;
            min-height: 0 !important;
          }
          .ira-pdf-viewer .ira-print-page {
            box-shadow: none !important;
            margin: 0 !important;
            min-height: 0 !important;
          }
        }
      `}</style>

      {/* ── Toolbar (solo pantalla) ─────────────────────────────────── */}
      <div className="ira-screen-only sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={goBack} title="Volver">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-base font-bold text-slate-900">Formulario IRA grave y 2019-nCoV (ISP)</h1>
            <p className="text-xs text-slate-500">PR-244.00-007 — Notificación inmediata y envío de muestras</p>
          </div>
          <Button variant="outline" size="sm" onClick={clear} className="gap-1.5">
            <RotateCcw className="h-4 w-4" /> Limpiar
          </Button>
          {showPreview && (
            <>
              <Button variant="outline" size="sm" onClick={() => setShowPreview(false)} className="gap-1.5">
                Volver a datos
              </Button>
              <Button size="sm" onClick={() => window.print()} className="gap-1.5 bg-blue-600 hover:bg-blue-700">
                <Printer className="h-4 w-4" /> Imprimir / PDF
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Panel "Datos previos" (solo pantalla, sólo si no se generó) ─ */}
      {!showPreview && (
      <div className="ira-screen-only max-w-4xl mx-auto px-4 mt-4 pb-12">
        <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Datos previos del paciente</h2>
              <p className="text-xs text-slate-600">Llena lo principal acá — los campos del formulario se rellenan automáticamente. La edad se calcula desde la fecha de nacimiento.</p>
            </div>
            <Button size="sm" variant="outline" onClick={marcarMuestraAhora} className="text-xs whitespace-nowrap">
              Muestra tomada ahora
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <QuickField label="Nombres">
              <QuickInput value={f.nombres} onChange={e => u('nombres', e.target.value)} placeholder="Juan Pedro" />
            </QuickField>
            <QuickField label="Apellido paterno">
              <QuickInput value={f.apPaterno} onChange={e => u('apPaterno', e.target.value)} placeholder="Pérez" />
            </QuickField>
            <QuickField label="Apellido materno">
              <QuickInput value={f.apMaterno} onChange={e => u('apMaterno', e.target.value)} placeholder="Soto" />
            </QuickField>
            <QuickField label="RUT">
              <QuickInput value={f.rut} onChange={e => u('rut', formatRut(e.target.value))} placeholder="12.345.678-9" />
            </QuickField>

            <QuickField label="Sexo">
              <select
                value={f.sexo}
                onChange={e => u('sexo', e.target.value)}
                className="w-full h-9 rounded-md border border-slate-300 px-2 text-sm focus:border-blue-400 focus:outline-none bg-white"
              >
                <option value="">—</option>
                <option value="F">Femenino</option>
                <option value="M">Masculino</option>
              </select>
            </QuickField>
            <QuickField label="Fecha nacimiento">
              <QuickInput type="date" value={fechaNacIso} onChange={e => setIsoDate('fechaNac')(e.target.value)} />
            </QuickField>
            <QuickField label="Edad (auto)">
              <QuickInput
                value={f.edadAnos ? `${f.edadAnos} a · ${f.edadMeses || 0} m · ${f.edadDias || 0} d` : ''}
                onChange={() => {}}
                placeholder="Se calcula al ingresar fecha"
                readOnly
                className="bg-slate-50 text-slate-600"
              />
            </QuickField>
            <QuickField label="Previsión">
              <QuickInput value={f.prevision} onChange={e => u('prevision', e.target.value)} placeholder="Fonasa A/B/C/D" />
            </QuickField>

            <QuickField label="Dirección" span="col-span-2">
              <QuickInput value={f.direccion} onChange={e => u('direccion', e.target.value)} />
            </QuickField>
            <QuickField label="Comuna">
              <QuickInput value={f.comuna} onChange={e => u('comuna', e.target.value)} />
            </QuickField>
            <QuickField label="Teléfono">
              <QuickInput value={f.telefono} onChange={e => u('telefono', e.target.value)} placeholder="+56 9 …" />
            </QuickField>

            <QuickField label="Inicio síntomas">
              <QuickInput type="date" value={fechaInicioIso} onChange={e => setIsoDate('inicioSint')(e.target.value)} />
            </QuickField>
            <QuickField label="Primera consulta">
              <QuickInput type="date" value={fechaPrimConsIso} onChange={e => setIsoDate('primConsulta')(e.target.value)} />
            </QuickField>
            <QuickField label="Fecha hospitalización">
              <QuickInput type="date" value={fechaHospIso} onChange={e => setIsoDate('hFecha')(e.target.value)} />
            </QuickField>
            <QuickField label="Fecha obtención muestra">
              <QuickInput type="date" value={fechaObtIso} onChange={e => setIsoDate('fechaObt')(e.target.value)} />
            </QuickField>

            <QuickField label="Diagnóstico de ingreso" span="col-span-2 md:col-span-4">
              <QuickInput value={f.diagIngreso} onChange={e => u('diagIngreso', e.target.value)} placeholder="Ej. Neumonía adquirida en comunidad, sospecha viral" />
            </QuickField>

            <QuickField label="Profesional responsable" span="col-span-2">
              <QuickInput value={f.profResponsable} onChange={e => u('profResponsable', e.target.value)} />
            </QuickField>
            <QuickField label="Correo electrónico (lab)" span="col-span-2">
              <QuickInput value={f.correo} onChange={e => u('correo', e.target.value)} placeholder="lab@hospitalbulnes.cl" />
            </QuickField>
          </div>

          <p className="text-[11px] text-slate-500 italic mt-3 leading-relaxed">
            Defaults aplicados: laboratorio Hospital de Bulnes, dirección Manuel Bulnes 431, unidad Medicina, región Ñuble · provincia Diguillín · comuna Bulnes; inmunofluorescencia A/B/VRS/Adenovirus/Parainfluenza/Metapneumovirus marcadas; tipo muestra Tórula Nasofaríngea; paciente Hospitalizado. Los puedes ajustar al ver el documento generado.
          </p>

          <div className="mt-4 flex items-center justify-end gap-2">
            <Button variant="outline" onClick={clear}>Limpiar datos</Button>
            <Button onClick={() => setShowPreview(true)} className="bg-blue-600 hover:bg-blue-700 gap-2">
              Generar formulario →
            </Button>
          </div>
        </div>
      </div>
      )}

      {/* ── Documento generado: dos páginas A4 (visor estilo PDF) ──── */}
      {showPreview && (<div className="ira-pdf-viewer">
      {/* ── Página 1 ────────────────────────────────────────────────── */}
      <div className="ira-print-page mx-auto bg-white" style={{ maxWidth: '210mm', padding: '8mm 10mm', fontFamily: F, color: '#000' }}>
        <div className="ira-header-band">
          <img src={ISP_LOGO} alt="Instituto de Salud Pública de Chile" crossOrigin="anonymous" />
          <div style={{ flex: 1 }}>
            <p className="ira-title">
              Formulario notificación inmediata y envío de muestras a confirmación IRA grave y 2019-nCoV
            </p>
            <p className="ira-code">PR-244.00-007</p>
          </div>
          <div className="ira-meta">
            <div>Actualizado: 25/08/2020</div>
            <div>Versión: 4</div>
            <div>Página 1 de 2</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '6pt', alignItems: 'center', marginBottom: '6pt' }}>
          <div />
          <Cell>
            <Lbl w="60pt">N° Epivigila:</Lbl>
            <Txt value={f.nEpivigila} onChange={v => u('nEpivigila', v)} style={{ width: '180pt' }} />
          </Cell>
        </div>

        {/* Información del Paciente */}
        <div style={sectionTitleStyle}>Información del Paciente</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8pt 16pt' }}>
          <div>
            <Cell style={{ marginBottom: '3pt' }}>
              <Lbl w="80pt">RUT:</Lbl>
              <Txt value={f.rut} onChange={v => u('rut', formatRut(v))} placeholder="12.345.678-9" />
            </Cell>
            <Cell style={{ marginBottom: '3pt' }}>
              <Lbl w="80pt">Nombres:</Lbl>
              <Txt value={f.nombres} onChange={v => u('nombres', v)} />
            </Cell>
            <Cell style={{ marginBottom: '3pt' }}>
              <Lbl w="80pt">Apellido Paterno:</Lbl>
              <Txt value={f.apPaterno} onChange={v => u('apPaterno', v)} />
            </Cell>
            <Cell style={{ marginBottom: '3pt' }}>
              <Lbl w="80pt">Apellido Materno:</Lbl>
              <Txt value={f.apMaterno} onChange={v => u('apMaterno', v)} />
            </Cell>
            <Cell style={{ marginBottom: '3pt' }}>
              <Lbl w="80pt">Sexo:</Lbl>
              <Radio label="Femenino" checked={f.sexo === 'F'} onChange={() => u('sexo', 'F')} />
              <Radio label="Masculino" checked={f.sexo === 'M'} onChange={() => u('sexo', 'M')} />
            </Cell>
            <Cell style={{ marginBottom: '3pt' }}>
              <Lbl w="80pt">Fecha Nac.:</Lbl>
              <DateDMA dia={f.fechaNacDia} mes={f.fechaNacMes} ano={f.fechaNacAno} onChange={setDate('fechaNac')} />
            </Cell>
            <Cell>
              <Lbl w="80pt">Edad:</Lbl>
              <Num3 value={f.edadAnos} onChange={v => u('edadAnos', v)} />
              <span style={{ ...labelStyle, fontSize: '8pt', color: '#666' }}>Años</span>
              <Num3 value={f.edadMeses} onChange={v => u('edadMeses', v)} />
              <span style={{ ...labelStyle, fontSize: '8pt', color: '#666' }}>Meses</span>
              <Num3 value={f.edadDias} onChange={v => u('edadDias', v)} />
              <span style={{ ...labelStyle, fontSize: '8pt', color: '#666' }}>Días</span>
            </Cell>
          </div>
          <div>
            <Cell style={{ marginBottom: '3pt' }}><Lbl w="80pt">Dirección:</Lbl><Txt value={f.direccion} onChange={v => u('direccion', v)} /></Cell>
            <Cell style={{ marginBottom: '3pt' }}><Lbl w="80pt">Región:</Lbl><Txt value={f.region} onChange={v => u('region', v)} /></Cell>
            <Cell style={{ marginBottom: '3pt' }}><Lbl w="80pt">Ciudad/Localidad:</Lbl><Txt value={f.ciudadLocalidad} onChange={v => u('ciudadLocalidad', v)} /></Cell>
            <Cell style={{ marginBottom: '3pt' }}><Lbl w="80pt">Comuna:</Lbl><Txt value={f.comuna} onChange={v => u('comuna', v)} /></Cell>
            <Cell style={{ marginBottom: '3pt' }}><Lbl w="80pt">Teléfono:</Lbl><Txt value={f.telefono} onChange={v => u('telefono', v)} /></Cell>
            <Cell><Lbl w="80pt">Previsión:</Lbl><Txt value={f.prevision} onChange={v => u('prevision', v)} /></Cell>
          </div>
        </div>

        {/* Datos de la Procedencia */}
        <div style={sectionTitleStyle}>Datos de la Procedencia</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8pt 16pt' }}>
          <div>
            <Cell style={{ marginBottom: '3pt' }}><Lbl w="110pt">Profesional Responsable:</Lbl><Txt value={f.profResponsable} onChange={v => u('profResponsable', v)} /></Cell>
            <Cell style={{ marginBottom: '3pt' }}><Lbl w="110pt">Región:</Lbl><Txt value={f.procRegion} onChange={v => u('procRegion', v)} /></Cell>
            <Cell style={{ marginBottom: '3pt' }}><Lbl w="110pt">Provincia:</Lbl><Txt value={f.procProvincia} onChange={v => u('procProvincia', v)} /></Cell>
            <Cell style={{ marginBottom: '3pt' }}><Lbl w="110pt">Comuna:</Lbl><Txt value={f.procComuna} onChange={v => u('procComuna', v)} /></Cell>
            <Cell><Lbl w="110pt">Dirección:</Lbl><Txt value={f.procDireccion} onChange={v => u('procDireccion', v)} /></Cell>
          </div>
          <div>
            <Cell style={{ marginBottom: '3pt' }}><Lbl w="110pt">Laboratorio/Hospital:</Lbl><Txt value={f.laboratorio} onChange={v => u('laboratorio', v)} /></Cell>
            <Cell style={{ marginBottom: '3pt' }}><Lbl w="110pt">Unidad:</Lbl><Txt value={f.unidad} onChange={v => u('unidad', v)} /></Cell>
            <Cell style={{ marginBottom: '3pt' }}><Lbl w="110pt">Correo Electrónico:</Lbl><Txt value={f.correo} onChange={v => u('correo', v)} /></Cell>
            <Cell style={{ marginBottom: '3pt' }}><Lbl w="110pt">Fono:</Lbl><Txt value={f.fono} onChange={v => u('fono', v)} /></Cell>
            <Cell><Lbl w="110pt">Fax:</Lbl><Txt value={f.fax} onChange={v => u('fax', v)} /></Cell>
          </div>
        </div>

        {/* Antecedentes de la Muestra */}
        <div style={sectionTitleStyle}>Antecedentes de la Muestra</div>
        <Cell style={{ marginBottom: '5pt' }}>
          <Lbl w="110pt">Fecha de obtención:</Lbl>
          <DateDMA dia={f.fechaObtDia} mes={f.fechaObtMes} ano={f.fechaObtAno} onChange={setDate('fechaObt')} />
          <Lbl w="100pt" >Hora obtención:</Lbl>
          <Txt value={f.horaObt} onChange={v => u('horaObt', v)} style={{ width: '90pt' }} placeholder="HH:MM" />
        </Cell>

        <p style={{ ...labelStyle, fontWeight: 'bold', textAlign: 'center', margin: '6pt 0 3pt' }}>Virus detectado localmente</p>

        <div style={{ display: 'grid', gridTemplateColumns: '110pt 1fr 1fr 1fr', gap: '4pt 8pt', alignItems: 'start', marginBottom: '5pt' }}>
          <strong style={labelStyle}>Inmuno Fluorescencia:</strong>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2pt' }}>
            <Chk label="Influenza A" checked={f.ifInfluenzaA} onChange={v => u('ifInfluenzaA', v)} />
            <Chk label="Influenza B" checked={f.ifInfluenzaB} onChange={v => u('ifInfluenzaB', v)} />
            <Chk label="VRS" checked={f.ifVRS} onChange={v => u('ifVRS', v)} />
            <Chk label="Adenovirus" checked={f.ifAdenovirus} onChange={v => u('ifAdenovirus', v)} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2pt' }}>
            <Chk label="Parainfluenza" checked={f.ifParainfluenza} onChange={v => u('ifParainfluenza', v)} />
            <Chk label="Metapneumovirus" checked={f.ifMetapneumovirus} onChange={v => u('ifMetapneumovirus', v)} />
            <Chk label="Negativo" checked={f.ifNegativo} onChange={v => u('ifNegativo', v)} />
          </div>
          <Cell><Lbl>Establecimiento:</Lbl><Txt value={f.ifEstablecimiento} onChange={v => u('ifEstablecimiento', v)} /></Cell>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '110pt auto auto auto 1fr', gap: '4pt 8pt', alignItems: 'center', marginBottom: '5pt' }}>
          <strong style={labelStyle}>Test Pack:</strong>
          <Chk label="Influenza A" checked={f.tpInfluenzaA} onChange={v => u('tpInfluenzaA', v)} />
          <Chk label="Influenza B" checked={f.tpInfluenzaB} onChange={v => u('tpInfluenzaB', v)} />
          <Chk label="Negativo" checked={f.tpNegativo} onChange={v => u('tpNegativo', v)} />
          <Cell><Lbl>Establecimiento:</Lbl><Txt value={f.tpEstablecimiento} onChange={v => u('tpEstablecimiento', v)} /></Cell>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '110pt 1fr 1fr 1fr', gap: '4pt 8pt', alignItems: 'start', marginBottom: '5pt' }}>
          <div>
            <p style={{ ...labelStyle, fontWeight: 'bold', margin: 0 }}>RT-PCR:</p>
            <p style={{ ...labelStyle, fontWeight: 'bold', margin: 0 }}>Film Array:</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2pt' }}>
            <Chk label="Influenza A (H1N1) pdm" checked={f.pcrInfluenzaAH1N1} onChange={v => u('pcrInfluenzaAH1N1', v)} />
            <Chk label="Influenza A (H3N2)" checked={f.pcrInfluenzaAH3N2} onChange={v => u('pcrInfluenzaAH3N2', v)} />
            <Chk label="Influenza A no subtipificable" checked={f.pcrInfluenzaAnoSubt} onChange={v => u('pcrInfluenzaAnoSubt', v)} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2pt' }}>
            <Chk label="Influenza B" checked={f.pcrInfluenzaB} onChange={v => u('pcrInfluenzaB', v)} />
            <Chk label="Negativo" checked={f.pcrNegativo} onChange={v => u('pcrNegativo', v)} />
            <Cell><Lbl>Otro:</Lbl><Txt value={f.pcrOtro} onChange={v => u('pcrOtro', v)} style={{ width: '90pt' }} /></Cell>
          </div>
          <Cell><Lbl>Establecimiento:</Lbl><Txt value={f.pcrEstablecimiento} onChange={v => u('pcrEstablecimiento', v)} /></Cell>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '110pt 1fr 1fr', gap: '4pt 8pt', alignItems: 'start' }}>
          <strong style={labelStyle}>Tipo de Muestra:</strong>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2pt' }}>
            <Chk label="Lavado Broncoalveolar" checked={f.mLavado} onChange={v => u('mLavado', v)} />
            <Chk label="Esputo" checked={f.mEsputo} onChange={v => u('mEsputo', v)} />
            <Chk label="Aspirado Traqueal" checked={f.mAspirado} onChange={v => u('mAspirado', v)} />
            <Chk label="Aspirado Nasofaríngeo" checked={f.mAspiradoNF} onChange={v => u('mAspiradoNF', v)} />
            <Chk label="Tórulas Nasofaríngeas" checked={f.mTorulasNF} onChange={v => u('mTorulasNF', v)} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2pt' }}>
            <Chk label="Biopsia o Tejido Pulmonar" checked={f.mBiopsia} onChange={v => u('mBiopsia', v)} />
            <Chk label="Tórula Orofaríngea" checked={f.mTorulaOF} onChange={v => u('mTorulaOF', v)} />
            <Chk label="Sangre con Anticoagulante EDTA" checked={f.mSangre} onChange={v => u('mSangre', v)} />
          </div>
        </div>

        {/* Antecedentes Clínicos / Epidemiológicos (continúa en página 1) */}
        <div style={sectionTitleStyle}>Antecedentes Clínicos/Epidemiológicos</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6pt 14pt', alignItems: 'center', marginBottom: '4pt' }}>
          <Lbl>Fecha inicio síntomas:</Lbl>
          <DateDMA dia={f.inicioSintDia} mes={f.inicioSintMes} ano={f.inicioSintAno} onChange={setDate('inicioSint')} />
          <Lbl>Fecha primera consulta:</Lbl>
          <DateDMA dia={f.primConsultaDia} mes={f.primConsultaMes} ano={f.primConsultaAno} onChange={setDate('primConsulta')} />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6pt 16pt', alignItems: 'center', marginBottom: '4pt' }}>
          <Radio label="Trabajador avícola o granjas de cerdos" checked={f.trabAvicola} onChange={v => u('trabAvicola', v)} />
          <Radio label="Trabajador" checked={f.trabajador} onChange={v => u('trabajador', v)} />
          <Radio label="Embarazo" checked={f.embarazo} onChange={v => u('embarazo', v)} />
          <Cell><Lbl>Semanas gestación:</Lbl><Num3 value={f.semanasGest} onChange={v => u('semanasGest', v)} /></Cell>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6pt 16pt', alignItems: 'center' }}>
          <Chk label="Viajó al extranjero en los 14 días previo al inicio de los síntomas" checked={f.viajoExtranjero} onChange={v => u('viajoExtranjero', v)} />
          <Cell><Lbl>País:</Lbl><Txt value={f.paisViaje} onChange={v => u('paisViaje', v)} style={{ width: '120pt' }} /></Cell>
          <Cell><Lbl>Ciudad:</Lbl><Txt value={f.ciudadViaje} onChange={v => u('ciudadViaje', v)} style={{ width: '120pt' }} /></Cell>
        </div>
      </div>

      {/* ── Página 2 ────────────────────────────────────────────────── */}
      <div className="ira-print-page mx-auto bg-white mt-6" style={{ maxWidth: '210mm', padding: '8mm 10mm', fontFamily: F, color: '#000' }}>
        <div className="ira-header-band">
          <img src={ISP_LOGO} alt="Instituto de Salud Pública de Chile" crossOrigin="anonymous" />
          <div style={{ flex: 1 }}>
            <p className="ira-title">
              Formulario notificación inmediata y envío de muestras a confirmación IRA grave y 2019-nCoV
            </p>
            <p className="ira-code">PR-244.00-007</p>
          </div>
          <div className="ira-meta">
            <div>Actualizado: 25/08/2020</div>
            <div>Versión: 4</div>
            <div>Página 2 de 2</div>
          </div>
        </div>

        {/* Síntomas */}
        <div style={sectionTitleStyle}>Síntomas</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4pt 16pt' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2pt' }}>
            <Chk label="Fiebre sobre 38°C" checked={f.sFiebre} onChange={v => u('sFiebre', v)} />
            <Chk label="Dolor de garganta" checked={f.sDolorGarganta} onChange={v => u('sDolorGarganta', v)} />
            <Chk label="Mialgia" checked={f.sMialgia} onChange={v => u('sMialgia', v)} />
            <Chk label="Neumonía" checked={f.sNeumonia} onChange={v => u('sNeumonia', v)} />
            <Chk label="Encefalitis" checked={f.sEncefalitis} onChange={v => u('sEncefalitis', v)} />
            <Chk label="Tos" checked={f.sTos} onChange={v => u('sTos', v)} />
            <Chk label="Rinorrea/congestión nasal" checked={f.sRinorrea} onChange={v => u('sRinorrea', v)} />
            <Chk label="Dificultad respiratoria" checked={f.sDifResp} onChange={v => u('sDifResp', v)} />
            <Chk label="Hipotensión" checked={f.sHipotension} onChange={v => u('sHipotension', v)} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2pt' }}>
            <Chk label="Cefalea" checked={f.sCefalea} onChange={v => u('sCefalea', v)} />
            <Chk label="Taquipnea" checked={f.sTaquipnea} onChange={v => u('sTaquipnea', v)} />
            <Chk label="Hipoxia" checked={f.sHipoxia} onChange={v => u('sHipoxia', v)} />
            <Chk label="Cianosis" checked={f.sCianosis} onChange={v => u('sCianosis', v)} />
            <Chk label="Deshidratación o rechazo alimentario (lactantes)" checked={f.sDeshidratacion} onChange={v => u('sDeshidratacion', v)} />
            <Chk label="Compromiso hemodinámico" checked={f.sCompromisoHemo} onChange={v => u('sCompromisoHemo', v)} />
            <Chk label="Consulta repetida por deterioro cuadro respiratorio" checked={f.sConsultaRepetida} onChange={v => u('sConsultaRepetida', v)} />
            <Chk label="Enfermedad de base" checked={f.sEnfBase} onChange={v => u('sEnfBase', v)} />
            <Cell><Lbl>Especifique:</Lbl><Txt value={f.enfBaseDetalle} onChange={v => u('enfBaseDetalle', v)} /></Cell>
          </div>
        </div>

        {/* Antecedentes Vacunación */}
        <div style={sectionTitleStyle}>Antecedentes Vacunación</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6pt 20pt', alignItems: 'center' }}>
          <Chk label="Vacuna contra influenza" checked={f.vacInfluenza} onChange={v => u('vacInfluenza', v)} />
          <Cell><Lbl>Fecha vacunación:</Lbl><DateDMA dia={f.vacFechaDia} mes={f.vacFechaMes} ano={f.vacFechaAno} onChange={setDate('vacFecha')} /></Cell>
        </div>

        {/* Hospitalización */}
        <div style={sectionTitleStyle}>Hospitalización</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6pt 20pt', alignItems: 'center', marginBottom: '4pt' }}>
          <Chk label="Hospitalizado" checked={f.hospitalizado} onChange={v => u('hospitalizado', v)} />
          <Cell><Lbl>Fecha Hospitalización:</Lbl><DateDMA dia={f.hFechaDia} mes={f.hFechaMes} ano={f.hFechaAno} onChange={setDate('hFecha')} /></Cell>
        </div>
        <Cell style={{ marginBottom: '4pt' }}><Lbl w="110pt">Diagnóstico de ingreso:</Lbl><Txt value={f.diagIngreso} onChange={v => u('diagIngreso', v)} /></Cell>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6pt 16pt', alignItems: 'center', marginBottom: '4pt' }}>
          <Chk label="Grave" checked={f.grave} onChange={v => u('grave', v)} />
          <Chk label="VM" checked={f.vm} onChange={v => u('vm', v)} />
          <Chk label="ECMO" checked={f.ecmo} onChange={v => u('ecmo', v)} />
          <Chk label="Ingreso UCI" checked={f.ingresoUci} onChange={v => u('ingresoUci', v)} />
          <Chk label="VAFO" checked={f.vafo} onChange={v => u('vafo', v)} />
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6pt 16pt', alignItems: 'center' }}>
          <Chk label="Uso Antiviral" checked={f.usoAntiviral} onChange={v => u('usoAntiviral', v)} />
          <Cell><Lbl>Fecha inicio tratamiento:</Lbl><DateDMA dia={f.antDia} mes={f.antMes} ano={f.antAno} onChange={setDate('ant')} /></Cell>
          <Lbl>Antiviral:</Lbl>
          <Chk label="Oseltamivir" checked={f.oseltamivir} onChange={v => u('oseltamivir', v)} />
          <Chk label="Zanamivir" checked={f.zanamivir} onChange={v => u('zanamivir', v)} />
        </div>

        {/* Fallecimiento */}
        <div style={sectionTitleStyle}>Fallecimiento</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6pt 20pt', alignItems: 'center', marginBottom: '4pt' }}>
          <Chk label="Fallece" checked={f.fallece} onChange={v => u('fallece', v)} />
          <Cell><Lbl>Fecha Fallecimiento:</Lbl><DateDMA dia={f.fFechaDia} mes={f.fFechaMes} ano={f.fFechaAno} onChange={setDate('fFecha')} /></Cell>
        </div>
        <Cell><Lbl w="120pt">Diagnóstico fallecimiento:</Lbl><Txt value={f.diagFallecimiento} onChange={v => u('diagFallecimiento', v)} /></Cell>

        {/* Instrucciones */}
        <div style={sectionTitleStyle}>Instrucciones</div>
        <ol style={{ ...labelStyle, paddingLeft: '14pt', lineHeight: '1.4', margin: 0 }}>
          <li>Recepción de muestras: Lunes a Domingo 24 horas.</li>
          <li>El transporte debe realizarse según <strong>Normativa de transporte de muestras ISP</strong>.</li>
          <li>En caso de dudas consultar a <strong>Unidad de Recepción de Muestras (02) 5755187</strong>.</li>
        </ol>
      </div>
      </div>)}
    </>
  );
}
