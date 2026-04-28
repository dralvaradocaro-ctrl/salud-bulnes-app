import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronLeft, Search, Printer, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ── Datos de exámenes ─────────────────────────────────────────────────
const SECTIONS = [
  {
    id: 'hematologia', title: 'Hematología', printCol: 0,
    exams: [
      { code: '1120',  name: 'Recuento globular' },
      { code: '1045',  name: 'Hemograma' },
      { code: '1086',  name: 'VHS' },
      { code: '1041',  name: 'Hemoglobina glicosilada' },
      { code: '1034',  name: 'Grupo ABO-Rh' },
      { code: '1014',  name: 'Test de coombs directo' },
      { code: '1015',  name: 'Test de coombs indirecto' },
    ],
  },
  {
    id: 'coagulacion', title: 'Coagulación', printCol: 0,
    exams: [
      { code: '1059K', name: 'Tiempo de protrombina (TP) (incluye INR)' },
      { code: '1085',  name: 'Tiempo de tromboplastina parcial activada (TTPA)' },
    ],
  },
  {
    id: 'orinas', title: 'Orinas', printCol: 0,
    exams: [
      { code: '9022',  name: 'Orina completa' },
      { code: '9013',  name: 'RAC: Índice Microalbuminuria / Creatinuria' },
      { code: '2024Z', name: 'Clearance de creatinina' },
      { code: '9028D', name: 'Creatininuria aislada' },
      { code: '9010A', name: 'Creatininuria 24 horas' },
      { code: '9013B', name: 'Microalbuminuria aislada' },
      { code: '9013A', name: 'Microalbuminuria 24 horas' },
      { code: '9028C', name: 'Proteinuria aislada' },
      { code: '9028A', name: 'Proteinuria 24 horas' },
      { code: '9014',  name: 'Test de embarazo' },
    ],
  },
  {
    id: 'deposiciones', title: 'Deposiciones', printCol: 0,
    exams: [
      { code: '6070',   name: 'Adenovirus' },
      { code: '306018', name: 'Helicobacter pylori' },
      { code: '8004',   name: 'Hemorragias ocultas' },
      { code: '8005',   name: 'Leucocitos fecales' },
      { code: '6048',   name: 'Parasitológico seriado' },
      { code: '6170',   name: 'Rotavirus' },
      { code: '6051',   name: 'Test de Graham' },
      { code: '9898',   name: 'Test de pH y azúcares reductores' },
    ],
  },
  {
    id: 'hormonas', title: 'Hormonas – Inmunología', printCol: 0,
    exams: [
      { code: '3024',  name: 'TSH' },
      { code: '3026',  name: 'T4 Libre' },
      { code: '3027',  name: 'T4' },
      { code: '3028',  name: 'T3' },
      { code: '5070A', name: 'PSA libre' },
      { code: '5070B', name: 'PSA total' },
      { code: 'S019',  name: 'Factor reumatoideo' },
    ],
  },
  {
    id: 'bioquimica', title: 'Bioquímica', printCol: 1,
    exams: [
      { code: '2005',  name: 'Ácido úrico' },
      { code: '2060A', name: 'Albúmina' },
      { code: '2008',  name: 'Amilasa' },
      { code: '2012B', name: 'Bilirrubina directa' },
      { code: '2012A', name: 'Bilirrubina total' },
      { code: '2015',  name: 'Calcio' },
      { code: '2068',  name: 'Colesterol HDL' },
      { code: '2067',  name: 'Colesterol Total' },
      { code: '2023',  name: 'Creatinina' },
      { code: '2025',  name: 'CK-MB' },
      { code: '2026',  name: 'CK-total' },
      { code: '2032',  name: 'Electrolitos plasmáticos: Na, K, Cl' },
      { code: '2040',  name: 'Fosfatasa alcalina' },
      { code: '2042',  name: 'Fósforo' },
      { code: '2049',  name: 'Gases sanguíneos arteriales' },
      { code: '2049V', name: 'Gases sanguíneos venosos' },
      { code: '2045',  name: 'Glicemia' },
      { code: '2047',  name: 'Glicemia (basal)' },
      { code: '2030',  name: 'Lactato deshidrogenasa (LDH)' },
      { code: '5031',  name: 'Proteína C reactiva' },
      { code: '2060',  name: 'Proteínas totales' },
      { code: '2063',  name: 'Transaminasa GOT/AST' },
      { code: '2063A', name: 'Transaminasa GPT/ALT' },
      { code: '2064',  name: 'Troponina I' },
      { code: '2027',  name: 'Urea / Nitrógeno ureico' },
      { code: '8892C', name: 'Velocidad filtración glomerular' },
      { code: '2048',  name: 'Test tolerancia a la glucosa oral' },
      { code: '2075',  name: 'Perfil bioquímico (Ác. Úrico, albúmina, bilirrubina total, colesterol total, creatinina, fosfatasa alcalina, glicemia, GOT, GPT, proteínas totales, triglicéridos, urea/nit.ureico)' },
      { code: '2076',  name: 'Perfil hepático (bilirrubina directa, total, GOT, GPT, fosfatasa alcalina)' },
      { code: '2034',  name: 'Perfil lipídico (colesterol total, HDL, LDL, VLDL, triglicéridos)' },
    ],
  },
  {
    id: 'derivados-hchm', title: 'Derivados a HCHM', printCol: 2,
    exams: [
      { code: '2004V',   name: 'Ácido Valproico' },
      { code: '2035C',   name: 'Carbamazepina' },
      { code: '1059DI',  name: 'Dímero D' },
      { code: '2032A',   name: 'Electrolitos en orina' },
      { code: '2035F',   name: 'Fenitoína' },
      { code: '2035FEL', name: 'Fenobarbital' },
      { code: '3014',    name: 'Gonadotrofina coriónica humana – sub Beta (BHCG)' },
      { code: '3015',    name: 'Hormona Folículo estimulante (FSH)' },
      { code: '3016',    name: 'Hormona luteinizante (LH)' },
      { code: '6074',    name: 'Hepatitis A' },
      { code: '6080',    name: 'Hepatitis B' },
      { code: '6081',    name: 'Hepatitis C' },
    ],
  },
  {
    id: 'formulario-especial',
    title: 'Formulario especial (SDM + laboratorio)',
    note: 'Requiere autorización de SDM y laboratorio',
    printCol: 2,
    exams: [
      { code: '', name: 'Antígeno carcinoembrionario (CEA)' },
      { code: '', name: 'Anticuerpos antinucleares (ANA)' },
      { code: '', name: 'Anticuerpo anti DNA' },
      { code: '', name: 'Anticuerpos antiperoxidasa (TPO)' },
      { code: '', name: 'Ferremia (hierro)' },
      { code: '', name: 'Ferritina' },
      { code: '', name: 'Insulina' },
      { code: '', name: 'Litio' },
      { code: '', name: 'Reticulocitos' },
      { code: '', name: 'Vitamina B 12' },
    ],
  },
  {
    id: 'formulario-programa',
    title: 'Formulario del programa (c/u)',
    printCol: 2,
    exams: [
      { code: '', name: 'Chagas' },
      { code: '', name: 'Mycobacterium tuberculosis' },
      { code: '', name: 'VIH' },
      { code: '', name: 'VDRL' },
    ],
  },
  {
    id: 'microbiologicos',
    title: 'Microbiológicos',
    note: 'Completar formulario para exámenes microbiológicos o RPR',
    printCol: 2,
    exams: [],
  },
];

function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return '';
  const hoy = new Date();
  const nac = new Date(fechaNacimiento);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad >= 0 ? String(edad) : '';
}

const EMPTY_PATIENT = {
  nombre: '', rut: '', fecha_nacimiento: '', edad: '',
  n_ficha: '', procedencia: '',
  fecha_solicitud: new Date().toISOString().split('T')[0],
  diagnostico: '', sala_cama: '', prevision: '',
  anticoagulante: '',
  muestra_sangre: false, muestra_orina: false,
  muestra_deposicion: false, muestra_otros: '',
};

// ── Logo del hospital ─────────────────────────────────────────────────
// Coloca el archivo de imagen en /public/logo-hospital.png
function HospitalLogo({ printMode = false }) {
  const [failed, setFailed] = useState(false);

  if (!failed) {
    const h = printMode ? '60px' : '64px';
    return (
      <img
        src="/logo-hospital.png"
        alt="Hospital Comunitario de Salud Familiar de Bulnes"
        style={{ height: h, width: 'auto', objectFit: 'contain', display: 'block' }}
        onError={() => setFailed(true)}
      />
    );
  }

  // Fallback estilizado si la imagen no se encuentra
  const s = printMode
    ? { wrapper: { display:'flex', height:'60px', overflow:'hidden', flexShrink:0 }, blue: { width:'72px', background:'#1565c0', display:'flex', alignItems:'center', justifyContent:'center' }, red: { background:'#b94040', padding:'3px 7px', display:'flex', flexDirection:'column', justifyContent:'space-between', minWidth:'140px' } }
    : null;

  if (printMode) return (
    <div style={s.wrapper}>
      <div style={s.blue}>
        <svg viewBox="0 0 50 60" width="42" fill="white" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="25" cy="10" rx="15" ry="8"/>
          <path d="M8 18 Q4 35 8 50 Q17 58 25 60 Q33 58 42 50 Q46 35 42 18Z"/>
          <circle cx="25" cy="38" r="7" fill="#1565c0"/>
          <polygon points="25,30 28,36 22,36" fill="white"/>
        </svg>
      </div>
      <div style={s.red}>
        <div>
          <div style={{color:'white',fontWeight:'bold',fontSize:'9px',lineHeight:'1.2'}}>Hospital Comunitario de</div>
          <div style={{color:'white',fontWeight:'bold',fontSize:'9px',lineHeight:'1.2'}}>Salud Familiar de Bulnes</div>
          <div style={{color:'rgba(255,255,255,0.85)',fontSize:'7.5px'}}>Servicio de Salud Ñuble</div>
        </div>
        <div style={{color:'white',fontWeight:'bold',fontSize:'8.5px'}}>Ministerio de Salud</div>
      </div>
    </div>
  );

  return (
    <div className="flex h-16 overflow-hidden rounded-lg">
      <div className="flex w-20 shrink-0 items-center justify-center bg-[#1565c0]">
        <svg viewBox="0 0 50 60" width="40" fill="white" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="25" cy="10" rx="15" ry="8"/>
          <path d="M8 18 Q4 35 8 50 Q17 58 25 60 Q33 58 42 50 Q46 35 42 18Z"/>
          <circle cx="25" cy="38" r="7" fill="#1565c0"/>
          <polygon points="25,30 28,36 22,36" fill="white"/>
        </svg>
      </div>
      <div className="flex flex-col justify-between bg-[#b94040] px-3 py-1.5">
        <div>
          <p className="text-[11px] font-bold leading-tight text-white">Hospital Comunitario de</p>
          <p className="text-[11px] font-bold leading-tight text-white">Salud Familiar de Bulnes</p>
          <p className="text-[10px] leading-tight text-white/85">Servicio de Salud Ñuble</p>
        </div>
        <p className="text-[11px] font-bold text-white">Ministerio de Salud</p>
      </div>
    </div>
  );
}

// ── Helpers de formulario (fuera del componente para evitar remounts) ──
const inputCls = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none';

function formatRut(raw) {
  const clean = raw.replace(/[^0-9kK]/g, '');
  if (clean.length === 0) return '';
  const body = clean.slice(0, -1);
  const dv   = clean.slice(-1).toUpperCase();
  if (body.length === 0) return dv;
  const dotted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${dotted}-${dv}`;
}

function Field({ label, children, span }) {
  return (
    <div className={span > 1 ? `sm:col-span-${span}` : ''}>
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      {children}
    </div>
  );
}

function PatInput({ field, patient, pat, ...rest }) {
  return (
    <input
      className={inputCls}
      value={patient[field]}
      onChange={e => pat(field, e.target.value)}
      {...rest}
    />
  );
}

// ── Página principal ──────────────────────────────────────────────────
export default function SolicitudExamenes() {
  const [search, setSearch]   = useState('');
  const [selected, setSelected] = useState(new Set());
  const [patient, setPatient] = useState(EMPTY_PATIENT);

  const pat = (field, value) => {
    if (field === 'fecha_nacimiento') {
      setPatient(p => ({ ...p, fecha_nacimiento: value, edad: calcularEdad(value) }));
    } else if (field === 'rut') {
      setPatient(p => ({ ...p, rut: formatRut(value) }));
    } else {
      setPatient(p => ({ ...p, [field]: value }));
    }
  };

  const toggleExam = key => setSelected(prev => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });

  const clearAll = () => { setSelected(new Set()); setPatient(EMPTY_PATIENT); };

  const q = search.toLowerCase().trim();
  const filteredSections = useMemo(() =>
    !q ? SECTIONS : SECTIONS.map(s => ({
      ...s,
      exams: s.exams.filter(e =>
        e.name.toLowerCase().includes(q) || e.code.toLowerCase().includes(q)
      ),
    })).filter(s => s.exams.length > 0),
  [q]);

  const printCols = [0, 1, 2].map(col => SECTIONS.filter(s => s.printCol === col));
  const selectedCount = selected.size;

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">

      {/* ── Navbar (screen only) ── */}
      <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Link to={createPageUrl('Templates')}>
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-base font-bold text-slate-900">Solicitud de Exámenes</h1>
            <p className="text-xs text-slate-500">Hospital de Bulnes · COD. 32</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={clearAll} className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" /> Limpiar
            </Button>
            <Button size="sm" onClick={() => window.print()} className="gap-1.5 bg-blue-600 hover:bg-blue-700">
              <Printer className="h-3.5 w-3.5" /> Imprimir
              {selectedCount > 0 && (
                <span className="ml-1 rounded-full bg-white/25 px-1.5 text-xs font-bold">{selectedCount}</span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          VISTA PANTALLA
      ══════════════════════════════════════════════════ */}
      <div className="mx-auto max-w-5xl space-y-4 px-4 py-6 print:hidden">

        {/* Datos del paciente */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-500">Datos del paciente</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Nombre completo" span={2}>
              <PatInput field="nombre" patient={patient} pat={pat} placeholder="Apellido(s), Nombre(s)" />
            </Field>
            <Field label="RUT">
              <PatInput field="rut" patient={patient} pat={pat} placeholder="12.345.678-9" />
            </Field>
            <Field label="Fecha de nacimiento">
              <input
                type="date"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                value={patient.fecha_nacimiento}
                onChange={e => pat('fecha_nacimiento', e.target.value)}
              />
            </Field>
            <Field label="Edad (automática)">
              <div className="flex items-center rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                {patient.edad ? <><span className="text-lg font-bold text-slate-800">{patient.edad}</span>&nbsp;años</> : 'Ingresa fecha de nacimiento'}
              </div>
            </Field>
            <Field label="Nº de Ficha">
              <PatInput field="n_ficha" patient={patient} pat={pat} />
            </Field>
            <Field label="Fecha de solicitud">
              <input
                type="date"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                value={patient.fecha_solicitud}
                onChange={e => pat('fecha_solicitud', e.target.value)}
              />
            </Field>
            <Field label="Procedencia">
              <PatInput field="procedencia" patient={patient} pat={pat} />
            </Field>
            <Field label="Sala / Cama">
              <PatInput field="sala_cama" patient={patient} pat={pat} />
            </Field>
            <Field label="Previsión">
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
                value={patient.prevision}
                onChange={e => pat('prevision', e.target.value)}
              >
                <option value="">Seleccionar...</option>
                {['FONASA A','FONASA B','FONASA C','FONASA D','ISAPRE','Particular'].map(v => <option key={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="Diagnóstico" span={3}>
              <PatInput field="diagnostico" patient={patient} pat={pat} />
            </Field>
          </div>

          <div className="mt-4 flex flex-wrap gap-6 border-t border-slate-100 pt-4">
            <div>
              <p className="mb-1.5 text-xs font-medium text-slate-500">Tratamiento anticoagulante</p>
              <div className="flex gap-4">
                {['Sí','No'].map(v => (
                  <label key={v} className="flex cursor-pointer items-center gap-1.5 text-sm">
                    <input type="radio" name="anticoag" value={v} checked={patient.anticoagulante === v} onChange={() => pat('anticoagulante', v)} />
                    {v}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium text-slate-500">Tipo de muestra</p>
              <div className="flex flex-wrap items-center gap-4">
                {[['muestra_sangre','Sangre'],['muestra_orina','Orina'],['muestra_deposicion','Deposición']].map(([k, label]) => (
                  <label key={k} className="flex cursor-pointer items-center gap-1.5 text-sm">
                    <input type="checkbox" checked={patient[k]} onChange={e => pat(k, e.target.checked)} className="accent-blue-600" />
                    {label}
                  </label>
                ))}
                <label className="flex items-center gap-1.5 text-sm text-slate-500">
                  Otros:
                  <input
                    className="w-28 border-b border-slate-300 bg-transparent text-sm text-slate-700 focus:outline-none"
                    value={patient.muestra_otros}
                    onChange={e => pat('muestra_otros', e.target.value)}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Buscador */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-10 text-sm shadow-sm focus:border-blue-400 focus:outline-none"
              placeholder="Buscar examen por nombre o código..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {selectedCount > 0 && (
            <div className="rounded-xl bg-blue-50 px-3 py-2.5 text-sm font-semibold text-blue-700 whitespace-nowrap">
              {selectedCount} seleccionado{selectedCount !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Secciones de exámenes */}
        <div className="space-y-3">
          {filteredSections.map(section =>
            section.exams.length === 0 ? null : (
              <div key={section.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-baseline justify-between border-b border-slate-100 bg-slate-50 px-5 py-3">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">{section.title}</h3>
                  {section.note && <span className="ml-3 text-[10px] italic text-slate-400">{section.note}</span>}
                </div>
                <div className="divide-y divide-slate-50">
                  {section.exams.map(exam => {
                    const key = exam.code || exam.name;
                    const isSel = selected.has(key);
                    return (
                      <label
                        key={key}
                        className={`flex cursor-pointer items-center gap-3 px-5 py-2.5 transition-colors hover:bg-slate-50 ${isSel ? 'bg-blue-50' : ''}`}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 shrink-0 rounded accent-blue-600"
                          checked={isSel}
                          onChange={() => toggleExam(key)}
                        />
                        {exam.code && (
                          <span className="w-16 shrink-0 font-mono text-[11px] text-slate-400">{exam.code}</span>
                        )}
                        <span className={`text-sm leading-snug ${isSel ? 'font-semibold text-blue-900' : 'text-slate-700'}`}>
                          {exam.name}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          VISTA IMPRESIÓN
      ══════════════════════════════════════════════════ */}
      <div className="hidden print:block" style={{ fontFamily: 'Arial, sans-serif', fontSize: '10.5px', padding: '5mm 7mm', maxWidth: '210mm', margin: '0 auto', color: '#000' }}>

        {/* Encabezado */}
        <div style={{ display: 'flex', alignItems: 'stretch', marginBottom: '5px', gap: '8px' }}>
          <HospitalLogo printMode />
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold', fontSize: '20px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Solicitud de Exámenes</div>
              <div style={{ fontWeight: 'bold', fontSize: '16px', letterSpacing: '0.05em' }}>Hospital de Bulnes</div>
            </div>
          </div>
        </div>

        {/* Datos paciente — tabla fiel al formulario original */}
        {(() => {
          const cell = (extra = {}) => ({
            border: '1px solid #666', padding: '2px 5px', verticalAlign: 'middle', fontSize: '10px', ...extra,
          });
          const chk = (val) => (
            <span style={{ display:'inline-block', width:'11px', height:'11px', border:'1px solid #555', textAlign:'center', lineHeight:'11px', fontSize:'9px', fontWeight:'bold', marginRight:'2px', WebkitPrintColorAdjust:'exact', printColorAdjust:'exact', background: val ? '#000' : 'white', color: val ? 'white' : 'transparent' }}>X</span>
          );
          return (
            <table style={{ width:'100%', borderCollapse:'collapse', marginBottom:'5px' }}>
              <tbody>
                {/* Fila 1 — Nombre */}
                <tr>
                  <td colSpan={4} style={cell()}><b>Nombre:</b> {patient.nombre}</td>
                </tr>
                {/* Fila 2 — Rut */}
                <tr>
                  <td colSpan={4} style={cell()}><b>Rut:</b> {patient.rut}</td>
                </tr>
                {/* Fila 3 — Edad | N° Ficha | F. nacimiento | F. solicitud */}
                <tr>
                  <td style={cell({ width:'22%' })}><b>Edad:</b> {patient.edad ? `${patient.edad} años` : ''}</td>
                  <td style={cell({ width:'28%' })}><b>N° de Ficha:</b> {patient.n_ficha}</td>
                  <td style={cell({ width:'25%' })}><b>Fecha de nacimiento:</b> {patient.fecha_nacimiento}</td>
                  <td style={cell({ width:'25%' })}><b>Fecha de solicitud:</b> {patient.fecha_solicitud}</td>
                </tr>
                {/* Fila 4 — Procedencia | Sala/cama */}
                <tr>
                  <td colSpan={2} style={cell()}><b>Procedencia:</b> {patient.procedencia}</td>
                  <td colSpan={2} style={cell()}><b>Sala/cama:</b> {patient.sala_cama}</td>
                </tr>
                {/* Fila 5 — Diagnóstico | Sangre/Orina/Deposición/Otros */}
                <tr>
                  <td colSpan={2} style={cell()}><b>Diagnóstico:</b> {patient.diagnostico}</td>
                  <td colSpan={2} style={cell()}>
                    <b>Sangre</b> {chk(patient.muestra_sangre)}&nbsp;&nbsp;
                    <b>Orina</b> {chk(patient.muestra_orina)}&nbsp;&nbsp;
                    <b>Deposición</b> {chk(patient.muestra_deposicion)}&nbsp;&nbsp;
                    <b>Otros</b> {patient.muestra_otros || '______'}
                  </td>
                </tr>
                {/* Fila 6 — Anticoagulante | Previsión */}
                <tr>
                  <td colSpan={2} style={cell()}>
                    <b>Tratamiento anticoagulante:</b>&nbsp;
                    Si {patient.anticoagulante === 'Sí' ? '✓' : '___'}&nbsp;&nbsp;
                    No {patient.anticoagulante === 'No' ? '✓' : '___'}
                  </td>
                  <td colSpan={2} style={cell()}><b>Previsión:</b> {patient.prevision}</td>
                </tr>
              </tbody>
            </table>
          );
        })()}

        {/* Columnas de exámenes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 7px', alignItems: 'start' }}>
          {printCols.map((colSections, colIdx) => (
            <div key={colIdx}>
              {colSections.map(section => (
                <div key={section.id} style={{ marginBottom: '5px' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '10.5px', borderBottom: '1.5px solid #222', marginBottom: '2px', paddingBottom: '1px' }}>
                    {section.title}
                  </div>
                  {section.note && (
                    <div style={{ fontSize: '8.5px', color: '#333', marginBottom: '3px', fontStyle: 'italic' }}>{section.note}</div>
                  )}
                  {section.exams.length > 0 && (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        {section.exams.map(exam => {
                          const key = exam.code || exam.name;
                          const isSel = selected.has(key);
                          return (
                            <tr key={key}>
                              <td style={{
                                width: '13px', minWidth: '13px', height: '13px',
                                border: '1px solid #444',
                                textAlign: 'center', lineHeight: '13px',
                                fontWeight: 'bold', fontSize: '10px',
                                verticalAlign: 'middle',
                                WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact',
                                background: isSel ? '#000' : '#fff',
                                color: isSel ? '#fff' : '#fff',
                              }}>
                                {isSel ? 'X' : ''}
                              </td>
                              {exam.code ? (
                                <td style={{ width: '40px', paddingLeft: '3px', fontSize: '9px', color: '#444', verticalAlign: 'middle' }}>{exam.code}</td>
                              ) : null}
                              <td style={{ paddingLeft: '3px', fontSize: '9px', lineHeight: '1.25', verticalAlign: 'middle' }}>{exam.name}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Firma */}
        <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ fontSize: '8px', color: '#888' }}>COD. 32</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid #333', width: '220px', paddingTop: '2px', fontSize: '9px', fontWeight: 'bold', letterSpacing: '0.05em' }}>
              NOMBRE / RUT / FIRMA / TIMBRE
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
