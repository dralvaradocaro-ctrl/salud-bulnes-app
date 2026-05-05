import { useState, useCallback } from 'react';
import { ChevronLeft, Printer, RotateCcw, AlertCircle } from 'lucide-react';
import { Button as ButtonBase } from '@/components/ui/button';
/** @type {any} */
const Button = ButtonBase;

// ── Fecha ─────────────────────────────────────────────────────────────
function getTodayISO() {
  return new Date().toISOString().split('T')[0];
}
function formatDateDisplay(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

// ── Estado inicial ────────────────────────────────────────────────────
const EMPTY = {
  apellidos: '', nombre: '', rut: '', fechaNac: '',
  causaFisica: false, causaSensorialVisual: false,
  causaSensorialAuditiva: false, causaMentalPsiquica: false, causaMentalIntelectual: false,
  dx1: '', dx2: '', dx3: '', dx4: '',
  otroDx1: '', otroDx2: '', otroDx3: '', otroDx4: '',
  historia: '', medicamentos: '', estadoFuncional: '', atenciones: '',
  requiereAyudaTecnica: '', cualesRequiere: '',
  usaAyudaTecnica: '', cualesUsa: '',
  profNombre: '', profRut: '', profCorreo: '', profTelefono: '',
  fechaInforme: getTodayISO(),
};

// ── Constantes de impresión ───────────────────────────────────────────
const F = "'Calibri','Candara','Segoe UI',Arial,sans-serif";
const SYMBOL_F = "'Noto Sans Symbols','Segoe UI Symbol','Apple Symbols',sans-serif";
const B = '0.5pt solid #000';
const FS = '9.5pt';
const SHADE = '#f2f2f2';

/** @param {import('react').CSSProperties} [x] @returns {import('react').CSSProperties} */
const cell = (x = {}) => ({
  border: B, padding: '1pt 3pt', verticalAlign: 'top',
  fontFamily: F, fontSize: FS, lineHeight: '1.15', fontWeight: 'normal',
  backgroundColor: '#fff', boxSizing: 'border-box', overflow: 'hidden', ...x,
});
/** @param {import('react').CSSProperties} [x] @returns {import('react').CSSProperties} */
const hcell = (x = {}) => cell({ backgroundColor: SHADE, ...x });

/** @type {import('react').CSSProperties} */
const tbl = {
  width: 'calc(100% - 8.25mm)',
  maxWidth: '100%',
  marginLeft: '8.25mm',
  borderCollapse: 'collapse',
  marginBottom: '2pt',
  tableLayout: 'fixed',
  boxSizing: 'border-box',
};

// ── Radio para impresión ──────────────────────────────────────────────
/** @param {{ checked: boolean }} props */
function PRadio({ checked }) {
  return (
    <span style={{ fontFamily: SYMBOL_F, fontSize: '9.5pt', marginRight: '4pt', verticalAlign: 'baseline' }}>
      {checked ? '■' : '🔿'}
    </span>
  );
}

// ── Línea punteada para campos vacíos ─────────────────────────────────
const DOTLINE = '…………………………………………………………………………………………………………………………………………………………………………………';
/** @param {{ value: string, lines?: number }} props */
function DotLines({ value, lines = 2 }) {
  if (value && value.trim()) {
    return <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.28', paddingTop: '1pt' }}>{value}</div>;
  }
  return (
    <div style={{ lineHeight: '1.28', color: '#000', paddingTop: '1pt' }}>
      {Array.from({ length: lines }).map((_, i) => <div key={i} style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>{DOTLINE}</div>)}
    </div>
  );
}

// ── Caja con encabezado + líneas ──────────────────────────────────────
/** @param {{ label: import('react').ReactNode, value: string, lines?: number, extra?: import('react').CSSProperties }} props */
function TextBox({ label, value, lines = 2, extra = {} }) {
  return (
    <table style={{ ...tbl, ...extra }}>
      <tbody>
        <tr style={{ height: '14pt' }}>
          <td style={hcell()}>{label}</td>
        </tr>
        <tr style={{ height: `${lines * 14.5}pt` }}>
          <td style={cell()}>
            <DotLines value={value} lines={lines} />
          </td>
        </tr>
      </tbody>
    </table>
  );
}

// ── Vista de impresión ────────────────────────────────────────────────
/** @param {{ f: typeof EMPTY }} props */
function PrintView({ f }) {
  const today = formatDateDisplay(f.fechaInforme || getTodayISO());
  const logoSrc = `${import.meta.env.BASE_URL || '/'}gobierno-chile.svg`;
  const logoStyle = {
    display: 'block',
    width: '23mm',
    height: '21mm',
    objectFit: 'fill',
    marginBottom: '3mm',
  };

  /** @type {import('react').CSSProperties} */
  const secStyle = {
    fontFamily: F, fontWeight: 'bold', fontSize: '10pt',
    marginBottom: '4pt', marginTop: '6pt', textAlign: 'justify',
  };

  const dotCell = (/** @type {string} */ val) => (
    <td style={cell()}>
      {'- '}{val
        ? val
        : <span style={{ color: '#333' }}>{'…………………………………………………………………………'}</span>
      }
    </td>
  );

  return (
    <div className="ib-print-page" style={{
      fontFamily: F,
      fontSize: FS,
      color: '#000',
      lineHeight: '1.15',
      background: '#fff',
      width: '210mm',
      maxWidth: '210mm',
      minHeight: '297mm',
      padding: '28mm 30mm 25mm',
      boxSizing: 'border-box',
      overflow: 'visible',
    }}>
      <img
        className="ib-print-header-logo"
        src={logoSrc}
        alt=""
        style={logoStyle}
      />

      {/* ── Encabezado ── */}
      <div style={{ textAlign: 'center', marginBottom: '7pt' }}>
        <div style={{ fontWeight: 'bold', fontSize: '11pt', fontFamily: F, marginBottom: '3pt' }}>
          Informe Biomédico Funcional
        </div>
        <div style={{ fontStyle: 'italic', fontSize: '9.5pt', fontFamily: F, lineHeight: '1.15' }}>
          *Este informe debe ser elaborado y firmado por un profesional de salud o educación, según corresponda. Todos los campos son de llenado obligatorio*
        </div>
      </div>

      {/* ── I. Datos de Identificación ── */}
      <div style={secStyle}>I.&nbsp;&nbsp;&nbsp;Datos de Identificación del usuario(a):</div>
      <table style={tbl}>
        <tbody>
          <tr style={{ height: '14pt' }}>
            <td style={hcell({ width: '19.35mm' })}>Apellidos</td>
            <td style={cell()}>{f.apellidos || <span style={{ color: '#999' }}>&nbsp;</span>}</td>
          </tr>
        </tbody>
      </table>
      <table style={tbl}>
        <tbody>
          <tr>
            <td style={hcell({ width: '19.35mm' })}>Nombre</td>
            <td style={cell()}>{f.nombre || <span style={{ color: '#999' }}>&nbsp;</span>}</td>
          </tr>
        </tbody>
      </table>
      <table style={tbl}>
        <tbody>
          <tr>
            <td style={hcell({ width: '18.4mm' })}>Rut</td>
            <td style={cell({ width: '41mm' })}>{f.rut || <span style={{ color: '#999' }}>&nbsp;</span>}</td>
            <td style={cell({ width: '5mm' })}>&nbsp;</td>
            <td style={hcell({ width: '25.3mm' })}>Fecha Nac.</td>
            <td style={cell()}>{formatDateDisplay(f.fechaNac) || <span style={{ color: '#999' }}>&nbsp;</span>}</td>
          </tr>
        </tbody>
      </table>

      {/* ── II. Antecedentes ── */}
      <div style={secStyle}>II.&nbsp;&nbsp;Antecedentes biomédicos y funcionales del usuario(a):</div>

      <table style={tbl}>
        <tbody>
          <tr>
            <td style={hcell({ width: '34mm', verticalAlign: 'middle' })}>Causa Discapacidad</td>
            <td style={cell()}>
              <div style={{ display: 'flex', gap: '16pt', flexWrap: 'wrap', marginBottom: '3pt' }}>
                {[
                  [f.causaFisica, 'Física'],
                  [f.causaSensorialVisual, 'Sensorial Visual'],
                  [f.causaSensorialAuditiva, 'Sensorial Auditiva'],
                ].map(([checked, label]) => (
                  <span key={String(label)} style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <PRadio checked={!!checked} />{label}
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '16pt', flexWrap: 'wrap' }}>
                {[
                  [f.causaMentalPsiquica, 'Mental / psíquica'],
                  [f.causaMentalIntelectual, 'Mental / Intelectual'],
                ].map(([checked, label]) => (
                  <span key={String(label)} style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <PRadio checked={!!checked} />{label}
                  </span>
                ))}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div style={{ fontFamily: F, fontSize: '8pt', marginBottom: '3pt', paddingLeft: '8.25mm' }}>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(Puede marcar una o más de una causa)
      </div>

      {/* Diagnósticos */}
      <table style={tbl}>
        <tbody>
          <tr>
            <td colSpan={2} style={hcell()}>Diagnósticos asociados a la causa de discapacidad:</td>
          </tr>
          <tr>
            {dotCell(f.dx1)}
            {dotCell(f.dx3)}
          </tr>
          <tr>
            {dotCell(f.dx2)}
            {dotCell(f.dx4)}
          </tr>
          <tr>
            <td colSpan={2} style={hcell()}>Otros diagnósticos:</td>
          </tr>
          <tr>
            {dotCell(f.otroDx1)}
            {dotCell(f.otroDx3)}
          </tr>
          <tr>
            {dotCell(f.otroDx2)}
            {dotCell(f.otroDx4)}
          </tr>
        </tbody>
      </table>
      <div style={{ fontFamily: F, fontSize: '8pt', marginBottom: '3pt', paddingLeft: '8.25mm' }}>
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Fuente: ficha clínica o médico tratante
      </div>

      <TextBox
        label="Breve historia de la condición de salud del usuario(a) (data de la condición de salud, evolución, tratamiento, rehabilitación, etc.):"
        value={f.historia} lines={2}
      />
      <TextBox label="Medicamentos indicados al usuario(a)" value={f.medicamentos} lines={3} />
      <TextBox label="Descripción del estado funcional del usuario(a)" value={f.estadoFuncional} lines={3} />

      {/* ── Salto de página antes de "Atenciones" ── */}
      <div style={{ pageBreakBefore: 'always', breakBefore: 'page' }} />
      <img
        className="ib-print-header-logo"
        src={logoSrc}
        alt=""
        style={logoStyle}
      />

      <TextBox
        label="Atenciones o intervenciones recibidas en el sistema de salud y/o educativo (tratamiento, programa de salud, rehabilitación, otro)"
        value={f.atenciones} lines={3}
      />

      {/* Ayuda técnica — Requiere */}
      <table style={{ ...tbl, marginBottom: '4pt' }}>
        <tbody>
          <tr style={{ height: '14pt' }}>
            <td style={hcell({ width: '40%' })}>
              Usuario(a) requiere ayuda técnica<sup>1</sup>
            </td>
            <td style={cell()} />
            <td style={cell({ width: '30%', whiteSpace: 'nowrap' })}>
              <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: '14pt' }}>
                <PRadio checked={f.requiereAyudaTecnica === 'si'} />Si
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                <PRadio checked={f.requiereAyudaTecnica === 'no'} />No
              </span>
            </td>
          </tr>
          <tr>
            <td colSpan={3} style={cell()}>
              Cuál o cuáles:&nbsp;
              <DotLines value={f.cualesRequiere} lines={1} />
            </td>
          </tr>
        </tbody>
      </table>

      {/* Ayuda técnica — Usa */}
      <table style={tbl}>
        <tbody>
          <tr style={{ height: '14pt' }}>
            <td style={hcell({ width: '40%' })}>
              Usuario(a) usa ayuda técnica
            </td>
            <td style={cell()} />
            <td style={cell({ width: '30%', whiteSpace: 'nowrap' })}>
              <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: '14pt' }}>
                <PRadio checked={f.usaAyudaTecnica === 'si'} />Si
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                <PRadio checked={f.usaAyudaTecnica === 'no'} />No
              </span>
            </td>
          </tr>
          <tr>
            <td colSpan={3} style={cell()}>
              Cuál o cuáles:&nbsp;
              <DotLines value={f.cualesUsa} lines={1} />
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── III. Profesionales tratantes ── */}
      <div style={secStyle}>III.&nbsp;Contacto profesionales tratantes en la red de salud</div>
      <table style={{ ...tbl, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
        <thead>
          <tr>
            {['Nombre y apellido', 'Profesión', 'Rut', 'Teléfono'].map(h => (
              <th key={h} style={hcell({ textAlign: 'left' })}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={cell({ minHeight: '16pt' })}>{f.profNombre || '…………………………………………………'}</td>
            <td style={cell()}>Médico Cirujano</td>
            <td style={cell()}>{f.profRut || '………………………'}</td>
            <td style={cell()}>{f.profTelefono || '………………………'}</td>
          </tr>
          <tr>
            <td style={cell({ height: '16pt' })}>{'…………………………………………………'}</td>
            <td style={cell()}>{'……………………………'}</td>
            <td style={cell()}>{'………………………'}</td>
            <td style={cell()}>{'………………………'}</td>
          </tr>
        </tbody>
      </table>

      {/* ── IV. Profesional informante ── */}
      <div style={secStyle}>IV.&nbsp;Datos de identificación del profesional informante:</div>
      <table style={{ ...tbl, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
        <tbody>
          <tr>
            <td style={hcell({ width: '34.4mm' })}>Nombre completo</td>
            <td style={cell()}>{f.profNombre}</td>
          </tr>
        </tbody>
      </table>
      <table style={{ ...tbl, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
        <tbody>
          <tr>
            <td style={hcell({ width: '34.7mm' })}>Profesión</td>
            <td style={cell({ width: '47.3mm' })}>Médico Cirujano</td>
            <td style={cell({ width: '6.3mm' })}>&nbsp;</td>
            <td style={hcell({ width: '28.4mm' })}>Rut</td>
            <td style={cell()}>{f.profRut}</td>
          </tr>
        </tbody>
      </table>
      <table style={{ ...tbl, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
        <tbody>
          <tr>
            <td style={hcell({ width: '34.4mm' })}>Institución</td>
            <td style={cell()}>Hospital Comunitario de Salud Familiar Bulnes</td>
          </tr>
        </tbody>
      </table>
      <table style={{ ...tbl, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
        <tbody>
          <tr>
            <td style={hcell({ width: '34.4mm' })}>Correo electrónico</td>
            <td style={cell()}>{f.profCorreo}</td>
          </tr>
        </tbody>
      </table>
      <table style={{ ...tbl, pageBreakInside: 'avoid', breakInside: 'avoid' }}>
        <tbody>
          <tr>
            <td style={hcell({ width: '34.5mm' })}>Teléfono</td>
            <td style={cell()}>{f.profTelefono}</td>
            <td style={cell({ width: '5.7mm' })}>&nbsp;</td>
            <td style={hcell({ width: '29.7mm' })}>Fecha informe</td>
            <td style={cell()}>{today}</td>
          </tr>
        </tbody>
      </table>

      {/* ── Firma y timbre ── */}
      <div style={{ textAlign: 'right', marginTop: '22pt', fontFamily: F }}>
        <div style={{ display: 'inline-block', textAlign: 'center', minWidth: '140pt' }}>
          <div style={{ borderBottom: '1pt solid #000', height: '40pt', marginBottom: '4pt' }} />
          <div style={{ fontWeight: 'bold', fontSize: '9pt', letterSpacing: '0.5pt' }}>FIRMA Y TIMBRE</div>
        </div>
      </div>

      {/* ── Nota al pie ── */}
      <div style={{
        fontFamily: F, fontSize: '7pt', marginTop: '12pt',
        paddingTop: '0', lineHeight: '1.15', textAlign: 'justify',
      }}>
        <sup>1</sup>&nbsp;Se entiende como cualquier producto externo (dispositivos, equipos, instrumentos o programas informáticos) fabricado especialmente o
        ampliamente disponible, cuya principal finalidad es mantener o mejorar la independencia y el funcionamiento de las personas y, por tanto, promover
        su bienestar. Estos productos se emplean también para prevenir déficits en el funcionamiento y afecciones secundarias. Existen ayudas técnicas para
        audición y comunicación (audífonos, amplificadores, tablas de comunicación, otros), visuales (lentes, lupa, bastones de orientación, otros), para
        movilidad (bastones, silla ruedas, andadores, otros), posicionamiento (sitting, cojines, otros), higiene (barras de apoyo, lavapelo, elevador de WC,
        otros), vestuario (calzador, abotonador, otros), alimentación (plato con reborde, sondas, otros), órtesis (estabilizadoras, dinámicas, cervicales, SEC,
        otras), prótesis, respiradores (CPAP, BIPAP, equipo O2) Orientaciones 2017 Ayudas Técnicas: Definición, Clasificación y Especificaciones. Minsal, 2017.
      </div>
    </div>
  );
}

// ── Formulario pantalla ───────────────────────────────────────────────
const inputCls = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none';
const textareaCls = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none resize-none';

/** @param {{ label: string, children: import('react').ReactNode }} props */
function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      {children}
    </div>
  );
}

/** @param {{ label: string }} props */
function SectionHead({ label }) {
  return <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 pt-2">{label}</h2>;
}

// ── Página principal ──────────────────────────────────────────────────
export default function InformeBiomedico() {
  const [f, setF] = useState(EMPTY);
  const u = useCallback((/** @type {string} */ key, /** @type {unknown} */ val) =>
    setF(prev => ({ ...prev, [key]: val })), []);
  const clear = () => setF({ ...EMPTY, fechaInforme: getTodayISO() });

  return (
    <>
      {/* CSS de impresión — usando clases explícitas, NO Tailwind print: variants */}
      <style>{`
        @page { size: A4; margin: 0; }
        html, body, #root {
          background: #fff !important;
        }
        .ib-print {
          background: #fff !important;
          color: #000;
          box-sizing: border-box;
          overflow: visible;
        }
        .ib-print * {
          box-sizing: border-box;
        }
        .ib-print-page {
          width: 210mm;
          max-width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          padding: 25mm 30mm;
          background: #fff !important;
        }
        @media print {
          .ib-screen { display: none !important; }
          .ib-print  {
            display: block !important;
            width: 210mm !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          .ib-print-page {
            width: 210mm !important;
            max-width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
          padding: 28mm 30mm 25mm !important;
          }
          .ib-print-header-logo {
            display: block !important;
            position: static !important;
            width: 23mm !important;
            height: 21mm !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          table { break-inside: auto; page-break-inside: auto; }
          tr, td, th { break-inside: avoid; page-break-inside: avoid; }
        }
        .ib-print { display: none; }
      `}</style>

      {/* ── Vista pantalla ── */}
      <div className="ib-screen min-h-screen bg-slate-100">

        {/* Navbar */}
        <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
            <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => window.history.back()}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-base font-bold text-slate-900">Informe Biomédico Funcional</h1>
              <p className="text-xs text-slate-500">Hospital Comunitario de Salud Familiar Bulnes</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={clear} className="gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" /> Limpiar
              </Button>
              <Button size="sm" onClick={() => window.print()} className="gap-1.5 bg-blue-600 hover:bg-blue-700">
                <Printer className="h-3.5 w-3.5" /> Imprimir
              </Button>
            </div>
          </div>
        </div>

        {/* Aviso de impresión */}
        <div className="mx-auto max-w-3xl px-4 pt-4">
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              <strong>Antes de imprimir:</strong> en el cuadro de diálogo del navegador, desactiva
              <em> "Encabezados y pies de página"</em> para evitar que aparezcan la URL, fecha y número de página.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-3xl space-y-4 px-4 py-4">

          {/* I. Datos del usuario */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHead label="I. Datos de Identificación del usuario(a)" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Apellidos">
                <input className={inputCls} value={f.apellidos} onChange={e => u('apellidos', e.target.value)} placeholder="Apellido Paterno Materno" />
              </Field>
              <Field label="Nombre">
                <input className={inputCls} value={f.nombre} onChange={e => u('nombre', e.target.value)} placeholder="Nombre(s)" />
              </Field>
              <Field label="RUT">
                <input className={inputCls} value={f.rut} onChange={e => u('rut', e.target.value)} placeholder="12.345.678-9" />
              </Field>
              <Field label="Fecha de nacimiento">
                <input type="date" className={inputCls} value={f.fechaNac} onChange={e => u('fechaNac', e.target.value)} />
              </Field>
            </div>
          </div>

          {/* II. Antecedentes */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHead label="II. Antecedentes biomédicos y funcionales" />

            <div className="mb-4">
              <label className="mb-2 block text-xs font-medium text-slate-500">Causa Discapacidad (puede marcar una o más)</label>
              <div className="flex flex-wrap gap-4">
                {/** @type {Array<[keyof typeof EMPTY, string]>} */([
                  ['causaFisica', 'Física'],
                  ['causaSensorialVisual', 'Sensorial Visual'],
                  ['causaSensorialAuditiva', 'Sensorial Auditiva'],
                  ['causaMentalPsiquica', 'Mental / psíquica'],
                  ['causaMentalIntelectual', 'Mental / Intelectual'],
                ]).map(([key, label]) => (
                  <label key={key} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input type="checkbox" className="accent-blue-600 h-4 w-4" checked={!!f[key]} onChange={e => u(key, e.target.checked)} />
                    {label}
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-xs font-medium text-slate-500">Diagnósticos asociados a la causa de discapacidad</label>
              <div className="grid gap-2 sm:grid-cols-2">
                {/** @type {Array<keyof typeof EMPTY>} */(['dx1','dx2','dx3','dx4']).map((k, i) => (
                  <input key={k} className={inputCls} value={String(f[k])} onChange={e => u(k, e.target.value)} placeholder={`Diagnóstico ${i+1}`} />
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-xs font-medium text-slate-500">Otros diagnósticos</label>
              <div className="grid gap-2 sm:grid-cols-2">
                {/** @type {Array<keyof typeof EMPTY>} */(['otroDx1','otroDx2','otroDx3','otroDx4']).map((k, i) => (
                  <input key={k} className={inputCls} value={String(f[k])} onChange={e => u(k, e.target.value)} placeholder={`Otro diagnóstico ${i+1}`} />
                ))}
              </div>
            </div>

            <Field label="Breve historia de la condición de salud (data, evolución, tratamiento, rehabilitación, etc.)">
              <textarea className={textareaCls} rows={3} value={f.historia} onChange={e => u('historia', e.target.value)} />
            </Field>
            <div className="mt-3">
              <Field label="Medicamentos indicados al usuario(a)">
                <textarea className={textareaCls} rows={3} value={f.medicamentos} onChange={e => u('medicamentos', e.target.value)} />
              </Field>
            </div>
            <div className="mt-3">
              <Field label="Descripción del estado funcional del usuario(a)">
                <textarea className={textareaCls} rows={3} value={f.estadoFuncional} onChange={e => u('estadoFuncional', e.target.value)} />
              </Field>
            </div>
            <div className="mt-3">
              <Field label="Atenciones o intervenciones recibidas en el sistema de salud y/o educativo">
                <textarea className={textareaCls} rows={3} value={f.atenciones} onChange={e => u('atenciones', e.target.value)} />
              </Field>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-500">¿Requiere ayuda técnica?</label>
                <div className="flex gap-4 mb-2">
                  {[['si','Sí'],['no','No']].map(([v, lbl]) => (
                    <label key={v} className="flex cursor-pointer items-center gap-1.5 text-sm">
                      <input type="radio" name="requiere" value={v} checked={f.requiereAyudaTecnica === v} onChange={() => u('requiereAyudaTecnica', v)} />
                      {lbl}
                    </label>
                  ))}
                </div>
                <input className={inputCls} value={f.cualesRequiere} onChange={e => u('cualesRequiere', e.target.value)} placeholder="Cuál o cuáles..." />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-slate-500">¿Usa ayuda técnica?</label>
                <div className="flex gap-4 mb-2">
                  {[['si','Sí'],['no','No']].map(([v, lbl]) => (
                    <label key={v} className="flex cursor-pointer items-center gap-1.5 text-sm">
                      <input type="radio" name="usa" value={v} checked={f.usaAyudaTecnica === v} onChange={() => u('usaAyudaTecnica', v)} />
                      {lbl}
                    </label>
                  ))}
                </div>
                <input className={inputCls} value={f.cualesUsa} onChange={e => u('cualesUsa', e.target.value)} placeholder="Cuál o cuáles..." />
              </div>
            </div>
          </div>

          {/* III y IV. Profesional */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 shadow-sm">
            <SectionHead label="III y IV. Profesional informante / Tratante en la red" />
            <p className="text-xs text-blue-700 mb-4 -mt-2">
              Estos datos se usan automáticamente en la Sección III (contacto en la red) y en la Sección IV (profesional informante).
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nombre completo">
                <input className={inputCls} value={f.profNombre} onChange={e => u('profNombre', e.target.value)} placeholder="Nombre completo del médico" />
              </Field>
              <Field label="RUT del profesional">
                <input className={inputCls} value={f.profRut} onChange={e => u('profRut', e.target.value)} placeholder="12.345.678-9" />
              </Field>
              <Field label="Correo electrónico">
                <input type="email" className={inputCls} value={f.profCorreo} onChange={e => u('profCorreo', e.target.value)} placeholder="medico@redsalud.gob.cl" />
              </Field>
              <Field label="Teléfono">
                <input className={inputCls} value={f.profTelefono} onChange={e => u('profTelefono', e.target.value)} placeholder="+56 9 1234 5678" />
              </Field>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Profesión</label>
                <div className="flex items-center rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm text-slate-500">Médico Cirujano</div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500">Institución</label>
                <div className="flex items-center rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm text-slate-500">Hospital Comunitario de Salud Familiar Bulnes</div>
              </div>
              <Field label="Fecha del informe">
                <input type="date" className={inputCls} value={f.fechaInforme} onChange={e => u('fechaInforme', e.target.value)} />
              </Field>
            </div>
          </div>

        </div>
      </div>

      {/* ── Vista de impresión ── */}
      <div className="ib-print">
        <PrintView f={f} />
      </div>
    </>
  );
}
