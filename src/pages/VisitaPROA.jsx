import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronLeft, Printer, RotateCcw, Plus, Trash2, ShieldPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

// ── Catálogos ──────────────────────────────────────────────
const ANTIBIOTICOS = [
  'Ampicilina', 'Ampicilina + sulbactam', 'Amoxicilina', 'Amoxicilina + ácido clavulánico',
  'Cloxacilina', 'Penicilina G sódica',
  'Cefazolina', 'Cefuroxima', 'Cefotaxima', 'Ceftriaxona', 'Ceftazidima', 'Cefepime',
  'Ertapenem', 'Meropenem', 'Imipenem + cilastatina',
  'Piperacilina + tazobactam',
  'Vancomicina', 'Teicoplanina', 'Linezolid', 'Daptomicina',
  'Clindamicina', 'Metronidazol',
  'Azitromicina', 'Claritromicina',
  'Ciprofloxacino', 'Levofloxacino', 'Moxifloxacino',
  'Cotrimoxazol (TMP/SMX)', 'Nitrofurantoína', 'Fosfomicina',
  'Doxiciclina', 'Tigeciclina', 'Gentamicina', 'Amikacina', 'Colistina',
  'Fluconazol', 'Voriconazol', 'Anfotericina B', 'Caspofungina',
  'Aciclovir', 'Oseltamivir',
];

// Dosis típicas de adulto (autocomplete según ATB elegido)
const DOSIS_TIPICAS = {
  'Ceftriaxona': ['1 g c/24h', '2 g c/24h'],
  'Cefepime': ['1 g c/8h', '2 g c/8h', '2 g c/12h'],
  'Ceftazidima': ['1 g c/8h', '2 g c/8h'],
  'Cefotaxima': ['1 g c/8h', '2 g c/6h'],
  'Cefazolina': ['1 g c/8h', '2 g c/8h'],
  'Cefuroxima': ['750 mg c/8h', '1,5 g c/8h'],
  'Meropenem': ['1 g c/8h', '2 g c/8h (en infusión prolongada)'],
  'Imipenem + cilastatina': ['500 mg c/6h', '1 g c/8h'],
  'Ertapenem': ['1 g c/24h'],
  'Piperacilina + tazobactam': ['4 g / 0,5 g c/8h', '4 g / 0,5 g c/6h', '4 g / 0,5 g c/8h infusión prolongada'],
  'Ampicilina': ['1 g c/6h', '2 g c/4h'],
  'Ampicilina + sulbactam': ['1,5 g c/6h', '3 g c/6h'],
  'Amoxicilina': ['500 mg c/8h', '875 mg c/12h', '1 g c/8h'],
  'Amoxicilina + ácido clavulánico': ['875/125 mg c/12h', '1 g c/8h'],
  'Cloxacilina': ['1 g c/6h', '2 g c/4h'],
  'Penicilina G sódica': ['2.000.000 UI c/4h', '4.000.000 UI c/4h'],
  'Vancomicina': ['1 g c/12h', '15-20 mg/kg c/8-12h'],
  'Teicoplanina': ['400 mg c/24h (carga 400 mg c/12h x3 dosis)'],
  'Linezolid': ['600 mg c/12h'],
  'Daptomicina': ['6 mg/kg c/24h', '8-10 mg/kg c/24h'],
  'Clindamicina': ['600 mg c/8h', '900 mg c/8h'],
  'Metronidazol': ['500 mg c/8h'],
  'Azitromicina': ['500 mg c/24h'],
  'Claritromicina': ['500 mg c/12h'],
  'Ciprofloxacino': ['400 mg c/12h EV', '500 mg c/12h VO'],
  'Levofloxacino': ['500 mg c/24h', '750 mg c/24h'],
  'Moxifloxacino': ['400 mg c/24h'],
  'Cotrimoxazol (TMP/SMX)': ['160/800 mg c/12h', '15-20 mg/kg/día TMP (dividido c/6-8h)'],
  'Nitrofurantoína': ['100 mg c/6h VO'],
  'Fosfomicina': ['3 g dosis única VO', '4 g c/8h EV'],
  'Doxiciclina': ['100 mg c/12h'],
  'Tigeciclina': ['100 mg carga, luego 50 mg c/12h'],
  'Gentamicina': ['5-7 mg/kg c/24h'],
  'Amikacina': ['15-20 mg/kg c/24h'],
  'Colistina': ['carga 9 MUI, luego 4,5 MUI c/12h'],
  'Fluconazol': ['400 mg carga, luego 200-400 mg c/24h', '800 mg carga, luego 400-800 mg c/24h'],
  'Voriconazol': ['carga 6 mg/kg c/12h x 2, luego 4 mg/kg c/12h'],
  'Anfotericina B': ['Liposomal 3-5 mg/kg c/24h', 'Desoxicolato 0,7-1 mg/kg c/24h'],
  'Caspofungina': ['70 mg carga, luego 50 mg c/24h'],
  'Aciclovir': ['10 mg/kg c/8h EV', '800 mg 5 veces/día VO'],
  'Oseltamivir': ['75 mg c/12h VO x 5 días'],
};

const VIAS = ['EV', 'IM', 'VO', 'SC', 'Inhalado'];

const TIPOS_MUESTRA = [
  'Hemocultivo',
  'Urocultivo',
  'Cultivo expectoración / esputo',
  'Lavado broncoalveolar (LBA)',
  'Aspirado endotraqueal',
  'Cultivo líquido pleural',
  'Cultivo líquido peritoneal',
  'Cultivo LCR',
  'Cultivo de herida / absceso',
  'Cultivo punta de catéter',
  'Coprocultivo',
  'PCR multiplex respiratoria',
  'PCR Clostridioides difficile',
  'Antígeno urinario (Neumococo / Legionella)',
  'Otro',
];

const PATOGENOS = [
  'Pendiente',
  'Sin desarrollo',
  'Escherichia coli',
  'Escherichia coli BLEE',
  'Klebsiella pneumoniae',
  'Klebsiella pneumoniae BLEE',
  'Klebsiella pneumoniae KPC',
  'Pseudomonas aeruginosa',
  'Pseudomonas aeruginosa MDR',
  'Acinetobacter baumannii',
  'Enterobacter cloacae',
  'Proteus mirabilis',
  'Serratia marcescens',
  'Staphylococcus aureus (MSSA)',
  'Staphylococcus aureus (MRSA)',
  'Staphylococcus epidermidis',
  'Staphylococcus coagulasa negativo',
  'Enterococcus faecalis',
  'Enterococcus faecium',
  'Enterococcus faecium VRE',
  'Streptococcus pneumoniae',
  'Streptococcus pyogenes',
  'Streptococcus agalactiae',
  'Listeria monocytogenes',
  'Haemophilus influenzae',
  'Moraxella catarrhalis',
  'Clostridioides difficile',
  'Candida albicans',
  'Candida glabrata',
  'Candida tropicalis',
  'Candida auris',
  'Aspergillus spp.',
  'Influenza A',
  'Influenza B',
  'Virus sincicial respiratorio (VRS)',
  'SARS-CoV-2',
];

const SENSIBILIDAD_OPCIONES = ['Pendiente', 'Sensible al esquema actual', 'Resistente al esquema actual', 'Multidrogo-resistente', 'No aplica'];

const RECOMENDACIONES = [
  'Continuar mismo esquema',
  'Desescalar según antibiograma',
  'Cambiar de antibiótico',
  'Suspender (no requiere ATB)',
  'Ajustar dosis por función renal / peso',
  'Pasar a vía oral (terapia secuencial)',
  'Completar duración programada',
  'Solicitar nuevos cultivos',
  'Solicitar interconsulta Infectología',
  'Otra (especificar abajo)',
];

const ACEPTACION_OPCIONES = ['Aceptada', 'Aceptada parcial', 'Rechazada', 'Pendiente respuesta'];

// ── Utilidades ─────────────────────────────────────────────
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
// Día de tratamiento calculado desde la fecha de inicio hasta la fecha de visita.
function calcDiaTto(inicio, fechaVisita) {
  if (!inicio || !fechaVisita) return null;
  const a = new Date(inicio + 'T12:00:00');
  const b = new Date(fechaVisita + 'T12:00:00');
  if (isNaN(a.getTime()) || isNaN(b.getTime())) return null;
  const diff = Math.floor((b - a) / 86400000);
  return diff >= 0 ? diff + 1 : null; // día 1 = mismo día de inicio
}

const EMPTY_ATB    = { nombre: '', via: 'EV', dosis: '', inicio: '' };
const EMPTY_CULT   = { tipo_muestra: '', fecha: '', patogeno: '', sensibilidad: 'Pendiente' };

const EMPTY = {
  fecha: '',
  servicio: '',
  cama: '',
  paciente: '',
  rut: '',
  edad: '',
  n_ficha: '',
  alergias: '',
  comorbilidades: '',
  funcion_renal: '',
  parametros_inflamatorios: '',
  diagnostico_actual: '',
  diagnostico_microbiologico: '',
  estudios_micro: [{ ...EMPTY_CULT }],
  estudios_imagen: '',
  antibioticos: [{ ...EMPTY_ATB }],
  resumen_caso: '',
  evolucion: '',
  recomendaciones: [],
  recomendaciones_otra: '',
  plan_duracion: '',
  proxima_revision: '',
  aceptacion: '',
  medico_firma: '',
  equipo_proa: '',
};

function HospitalLogo({ height = 46 }) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <img
      src="/logo-hospital.png"
      alt="Hospital Comunitario de Salud Familiar de Bulnes"
      style={{ height: `${height}px`, width: 'auto', objectFit: 'contain', display: 'block' }}
      onError={() => setFailed(true)}
    />
  );
}

export default function VisitaPROA() {
  const navigate = useNavigate();
  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate(createPageUrl('Home'));
  };
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

  // ATB
  const updateAtb = (idx, key, value) => {
    setF(prev => ({
      ...prev,
      antibioticos: prev.antibioticos.map((a, i) => {
        if (i !== idx) return a;
        const next = { ...a, [key]: value };
        // Si se elige un ATB conocido y la dosis está vacía, sugerimos la primera dosis típica.
        if (key === 'nombre' && DOSIS_TIPICAS[value] && !a.dosis) {
          next.dosis = DOSIS_TIPICAS[value][0];
        }
        return next;
      }),
    }));
  };
  const addAtb = () => setF(prev => ({ ...prev, antibioticos: [...prev.antibioticos, { ...EMPTY_ATB }] }));
  const removeAtb = (idx) => setF(prev => ({
    ...prev,
    antibioticos: prev.antibioticos.length > 1 ? prev.antibioticos.filter((_, i) => i !== idx) : prev.antibioticos,
  }));

  // Estudios microbiológicos
  const updateCult = (idx, key, value) => {
    setF(prev => ({
      ...prev,
      estudios_micro: prev.estudios_micro.map((c, i) => i === idx ? { ...c, [key]: value } : c),
    }));
  };
  const addCult = () => setF(prev => ({ ...prev, estudios_micro: [...prev.estudios_micro, { ...EMPTY_CULT }] }));
  const removeCult = (idx) => setF(prev => ({
    ...prev,
    estudios_micro: prev.estudios_micro.length > 1 ? prev.estudios_micro.filter((_, i) => i !== idx) : prev.estudios_micro,
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

      {/* Header en pantalla con logo del hospital arriba a la izquierda */}
      <div className="proa-screen-only sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-2 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-xl shrink-0" onClick={goBack} title="Volver">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="shrink-0"><HospitalLogo height={40} /></div>
          <div className="flex-1 min-w-0">
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
        <div className="proa-screen-only max-w-5xl mx-auto px-4 mt-4 pb-12">
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
                <Field label="Comorbilidades" span="md:col-span-2">
                  <Input value={f.comorbilidades} onChange={e => u('comorbilidades', e.target.value)} className="h-9" />
                </Field>
                <Field label="Función renal" span="md:col-span-2">
                  <Input value={f.funcion_renal} onChange={e => u('funcion_renal', e.target.value)} placeholder="ClCr / Crea" className="h-9" />
                </Field>
              </Grid>
            </Section>

            {/* Diagnósticos */}
            <Section title="Diagnósticos">
              <Grid>
                <Field label="Diagnóstico actual" span="md:col-span-2">
                  <Input value={f.diagnostico_actual} onChange={e => u('diagnostico_actual', e.target.value)} className="h-9" placeholder="Ej: Neumonía nosocomial" />
                </Field>
                <Field label="Diagnóstico microbiológico" span="md:col-span-2">
                  <Input value={f.diagnostico_microbiologico} onChange={e => u('diagnostico_microbiologico', e.target.value)} className="h-9" placeholder="Ej: Bacteriemia por S. aureus MRSA" />
                </Field>
                <Field label="Parámetros inflamatorios" span="md:col-span-4">
                  <Input value={f.parametros_inflamatorios} onChange={e => u('parametros_inflamatorios', e.target.value)} placeholder="PCR, Leucos, PCT, fiebre 24-48h…" className="h-9" />
                </Field>
              </Grid>
            </Section>

            {/* Estudios microbiológicos */}
            <Section title="Estudios microbiológicos" right={
              <Button size="sm" variant="outline" onClick={addCult} className="gap-1 text-xs h-7"><Plus className="h-3 w-3" /> Agregar</Button>
            }>
              <div className="space-y-2">
                {f.estudios_micro.map((c, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-12 md:col-span-3">
                      <label className="block text-[11px] text-slate-600 mb-0.5">Vía de cultivo / muestra</label>
                      <input
                        value={c.tipo_muestra}
                        onChange={e => updateCult(i, 'tipo_muestra', e.target.value)}
                        list="proa-muestra-suggestions"
                        className="w-full h-9 rounded-md border border-slate-200 px-2 text-sm focus:border-teal-400 focus:outline-none"
                        placeholder="Hemocultivo, urocultivo…"
                      />
                    </div>
                    <div className="col-span-6 md:col-span-2">
                      <label className="block text-[11px] text-slate-600 mb-0.5">Fecha</label>
                      <Input type="date" value={c.fecha} onChange={e => updateCult(i, 'fecha', e.target.value)} className="h-9" />
                    </div>
                    <div className="col-span-12 md:col-span-4">
                      <label className="block text-[11px] text-slate-600 mb-0.5">Patógeno</label>
                      <input
                        value={c.patogeno}
                        onChange={e => updateCult(i, 'patogeno', e.target.value)}
                        list="proa-patogenos-suggestions"
                        className="w-full h-9 rounded-md border border-slate-200 px-2 text-sm focus:border-teal-400 focus:outline-none"
                        placeholder="Buscá: S. aureus, E. coli…"
                      />
                    </div>
                    <div className="col-span-10 md:col-span-2">
                      <label className="block text-[11px] text-slate-600 mb-0.5">Sensibilidad</label>
                      <select
                        value={c.sensibilidad}
                        onChange={e => updateCult(i, 'sensibilidad', e.target.value)}
                        className="w-full h-9 rounded-md border border-slate-200 px-2 text-sm focus:border-teal-400 focus:outline-none bg-white"
                      >
                        {SENSIBILIDAD_OPCIONES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="col-span-2 md:col-span-1 md:flex md:justify-end">
                      <Button variant="ghost" size="icon" onClick={() => removeCult(i)} className="h-8 w-8 text-rose-600 hover:bg-rose-50" title="Quitar">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Antibioterapia actual */}
            <Section title="Antibioterapia actual" right={
              <Button size="sm" variant="outline" onClick={addAtb} className="gap-1 text-xs h-7"><Plus className="h-3 w-3" /> Agregar</Button>
            }>
              <div className="space-y-2">
                {f.antibioticos.map((a, i) => {
                  const dia = calcDiaTto(a.inicio, f.fecha);
                  return (
                    <div key={i} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-12 md:col-span-3">
                        <label className="block text-[11px] text-slate-600 mb-0.5">Antibiótico</label>
                        <input
                          value={a.nombre}
                          onChange={e => updateAtb(i, 'nombre', e.target.value)}
                          list="proa-atb-suggestions"
                          className="w-full h-9 rounded-md border border-slate-200 px-2 text-sm focus:border-teal-400 focus:outline-none"
                          placeholder="Ej: Ceftriaxona"
                        />
                      </div>
                      <div className="col-span-4 md:col-span-1">
                        <label className="block text-[11px] text-slate-600 mb-0.5">Vía</label>
                        <select value={a.via} onChange={e => updateAtb(i, 'via', e.target.value)} className="w-full h-9 rounded-md border border-slate-200 px-2 text-sm bg-white">
                          {VIAS.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                      </div>
                      <div className="col-span-8 md:col-span-3">
                        <label className="block text-[11px] text-slate-600 mb-0.5">Dosis / frecuencia</label>
                        <input
                          value={a.dosis}
                          onChange={e => updateAtb(i, 'dosis', e.target.value)}
                          list={`proa-dosis-${i}`}
                          className="w-full h-9 rounded-md border border-slate-200 px-2 text-sm focus:border-teal-400 focus:outline-none"
                          placeholder="1 g c/24h"
                        />
                        <datalist id={`proa-dosis-${i}`}>
                          {(DOSIS_TIPICAS[a.nombre] || []).map(d => <option key={d} value={d} />)}
                        </datalist>
                      </div>
                      <div className="col-span-6 md:col-span-2">
                        <label className="block text-[11px] text-slate-600 mb-0.5">Inicio</label>
                        <Input type="date" value={a.inicio} onChange={e => updateAtb(i, 'inicio', e.target.value)} className="h-9" />
                      </div>
                      <div className="col-span-4 md:col-span-2">
                        <label className="block text-[11px] text-slate-600 mb-0.5">Día de tto</label>
                        <div className={`h-9 rounded-md border px-2 text-sm flex items-center justify-center font-semibold ${
                          dia == null ? 'border-slate-200 bg-slate-50 text-slate-400' : 'border-teal-300 bg-teal-50 text-teal-800'
                        }`}>
                          {dia != null ? `Día ${dia}` : '—'}
                        </div>
                      </div>
                      <div className="col-span-2 md:col-span-1 md:flex md:justify-end">
                        <Button variant="ghost" size="icon" onClick={() => removeAtb(i)} className="h-8 w-8 text-rose-600 hover:bg-rose-50" title="Quitar">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>

            {/* Estudios imagenológicos */}
            <Section title="Estudios imagenológicos">
              <Textarea value={f.estudios_imagen} onChange={e => u('estudios_imagen', e.target.value)} className="min-h-[60px]" placeholder="TAC, Rx, ecografía — fecha y hallazgos relevantes" />
            </Section>

            {/* Resumen + Evolución */}
            <Section title="Resumen de caso">
              <Textarea value={f.resumen_caso} onChange={e => u('resumen_caso', e.target.value)} className="min-h-[80px]" placeholder="Resumen breve: ingreso, hospitalización, eventos clave, intervenciones." />
            </Section>
            <Section title="Evolución clínica">
              <Textarea value={f.evolucion} onChange={e => u('evolucion', e.target.value)} className="min-h-[80px]" placeholder="Tendencia, respuesta al tratamiento, eventos de las últimas 24-48 h." />
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
                <Field label="Plan / duración total" span="md:col-span-2">
                  <Input value={f.plan_duracion} onChange={e => u('plan_duracion', e.target.value)} className="h-9" placeholder="Ej: completar 7 días totales (hasta 12-06)" />
                </Field>
                <Field label="Próxima revisión" span="md:col-span-2">
                  <Input type="date" value={f.proxima_revision} onChange={e => u('proxima_revision', e.target.value)} className="h-9" />
                </Field>
              </Grid>
            </Section>

            {/* Firmas */}
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
                <Field label="Médico que firma" span="md:col-span-2">
                  <Input value={f.medico_firma} onChange={e => u('medico_firma', e.target.value)} className="h-9" placeholder="Nombre y apellido" />
                </Field>
                <Field label="Equipo PROA" span="md:col-span-4">
                  <Input value={f.equipo_proa} onChange={e => u('equipo_proa', e.target.value)} className="h-9" placeholder="Integrantes del equipo presentes en la visita" />
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

          {/* Datalists globales */}
          <datalist id="proa-atb-suggestions">
            {ANTIBIOTICOS.map(s => <option key={s} value={s} />)}
          </datalist>
          <datalist id="proa-muestra-suggestions">
            {TIPOS_MUESTRA.map(s => <option key={s} value={s} />)}
          </datalist>
          <datalist id="proa-patogenos-suggestions">
            {PATOGENOS.map(s => <option key={s} value={s} />)}
          </datalist>
        </div>
      )}

      {/* Vista impresa */}
      {showPreview && (
        <div className="proa-pdf-viewer">
          <div
            className="proa-print-page"
            style={{ padding: '12mm', fontFamily: 'Arial, Helvetica, sans-serif', fontSize: '10pt', color: '#000' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12pt', marginBottom: '6pt' }}>
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

            <h1 style={{ textAlign: 'center', fontSize: '13pt', fontWeight: 'bold', textDecoration: 'underline', margin: '6pt 0 8pt' }}>
              EVOLUCIÓN DE VISITA PROA
            </h1>

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
              <PrintGrid>
                <PrintField label="Comorbilidades" value={f.comorbilidades} flex={2} />
                <PrintField label="Función renal" value={f.funcion_renal} flex={2} />
              </PrintGrid>
            </PrintBlock>

            <PrintBlock title="Diagnósticos">
              <PrintGrid>
                <PrintField label="Diagnóstico actual" value={f.diagnostico_actual} flex={2} />
                <PrintField label="Diagnóstico microbiológico" value={f.diagnostico_microbiologico} flex={2} />
              </PrintGrid>
              <PrintField label="Parámetros inflamatorios" value={f.parametros_inflamatorios} flex={1} />
            </PrintBlock>

            <PrintBlock title="Estudios microbiológicos">
              <table style={tbl}>
                <thead>
                  <tr style={{ background: '#e6f4f1' }}>
                    <th style={cellHead}>Vía / muestra</th>
                    <th style={cellHead}>Fecha</th>
                    <th style={cellHead}>Patógeno</th>
                    <th style={cellHead}>Sensibilidad</th>
                  </tr>
                </thead>
                <tbody>
                  {f.estudios_micro.filter(c => c.tipo_muestra || c.patogeno).map((c, i) => (
                    <tr key={i}>
                      <td style={cell}>{c.tipo_muestra}</td>
                      <td style={cell}>{formatDateLocal(c.fecha)}</td>
                      <td style={cell}>{c.patogeno}</td>
                      <td style={cell}>{c.sensibilidad}</td>
                    </tr>
                  ))}
                  {f.estudios_micro.filter(c => c.tipo_muestra || c.patogeno).length === 0 && (
                    <tr><td colSpan={4} style={{ ...cell, fontStyle: 'italic', color: '#666' }}>— sin estudios registrados —</td></tr>
                  )}
                </tbody>
              </table>
            </PrintBlock>

            <PrintBlock title="Antibioterapia actual">
              <table style={tbl}>
                <thead>
                  <tr style={{ background: '#e6f4f1' }}>
                    <th style={cellHead}>Antibiótico</th>
                    <th style={cellHead}>Vía</th>
                    <th style={cellHead}>Dosis / frecuencia</th>
                    <th style={cellHead}>Inicio</th>
                    <th style={cellHead}>Día de tto</th>
                  </tr>
                </thead>
                <tbody>
                  {f.antibioticos.filter(a => a.nombre).map((a, i) => (
                    <tr key={i}>
                      <td style={cell}>{a.nombre}</td>
                      <td style={cell}>{a.via}</td>
                      <td style={cell}>{a.dosis}</td>
                      <td style={cell}>{formatDateLocal(a.inicio)}</td>
                      <td style={{ ...cell, fontWeight: 'bold', textAlign: 'center' }}>{calcDiaTto(a.inicio, f.fecha) ?? '—'}</td>
                    </tr>
                  ))}
                  {f.antibioticos.filter(a => a.nombre).length === 0 && (
                    <tr><td colSpan={5} style={{ ...cell, fontStyle: 'italic', color: '#666' }}>— sin antibióticos registrados —</td></tr>
                  )}
                </tbody>
              </table>
            </PrintBlock>

            {f.estudios_imagen && (
              <PrintBlock title="Estudios imagenológicos">
                <div style={box}>{f.estudios_imagen}</div>
              </PrintBlock>
            )}

            {f.resumen_caso && (
              <PrintBlock title="Resumen de caso">
                <div style={box}>{f.resumen_caso}</div>
              </PrintBlock>
            )}

            {f.evolucion && (
              <PrintBlock title="Evolución clínica">
                <div style={box}>{f.evolucion}</div>
              </PrintBlock>
            )}

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

            <PrintBlock title="Aceptación y firmas">
              <PrintField label="Aceptación del tratante" value={f.aceptacion} flex={1} />
              <div style={{ marginTop: '16pt', display: 'flex', gap: '12pt' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ borderTop: '0.75pt solid #000', paddingTop: '2pt', textAlign: 'center', fontSize: '9pt' }}>
                    {f.medico_firma || '—'}
                  </div>
                  <p style={{ margin: 0, fontSize: '8.5pt', textAlign: 'center', color: '#555' }}>Médico que firma</p>
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

const tbl       = { width: '100%', borderCollapse: 'collapse', fontSize: '9.5pt' };
const cellHead  = { border: '0.5pt solid #555', padding: '3pt 5pt', textAlign: 'left', fontSize: '9pt' };
const cell      = { border: '0.5pt solid #555', padding: '3pt 5pt', fontSize: '9.5pt' };
const box       = { border: '0.75pt solid #000', padding: '4pt 6pt', minHeight: '40pt', whiteSpace: 'pre-wrap' };
