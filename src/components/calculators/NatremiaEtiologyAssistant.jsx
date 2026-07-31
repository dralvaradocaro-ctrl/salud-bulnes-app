import { useMemo, useState } from 'react';
import { AlertTriangle, Beaker, CheckCircle2, Droplets, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const initialValues = {
  sodium: '',
  glucose: '',
  bun: '',
  serumOsm: '',
  urineOsm: '',
  urineSodium: '',
  urineVolume: '',
  volumeStatus: 'no_definida',
  symptoms: 'sin_graves',
  onset: 'desconocida',
  edema: false,
  giLosses: false,
  diuretics: false,
  polydipsia: false,
  lowSolute: false,
  hyperglycemiaOrMannitol: false,
  kidneyDisease: false,
  heartLiverDisease: false,
  adrenalOrThyroidPending: false,
};

const numberOrNull = (value) => {
  if (value === '' || value == null) return null;
  const parsed = Number(String(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
};

const Field = ({ label, children }) => (
  <div className="space-y-1.5">
    <Label className="text-xs font-semibold text-slate-700">{label}</Label>
    {children}
  </div>
);

const Check = ({ checked, onChange, children }) => (
  <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-0.5 h-4 w-4 accent-teal-700" />
    <span>{children}</span>
  </label>
);

function buildOrientation(values) {
  const sodium = numberOrNull(values.sodium);
  const glucose = numberOrNull(values.glucose);
  const bun = numberOrNull(values.bun);
  const serumOsm = numberOrNull(values.serumOsm);
  const urineOsm = numberOrNull(values.urineOsm);
  const urineSodium = numberOrNull(values.urineSodium);
  const urineVolume = numberOrNull(values.urineVolume);
  const correctedSodium = sodium != null && glucose != null && glucose > 100
    ? sodium + 2.4 * ((glucose - 100) / 100)
    : sodium;
  const calculatedOsm = sodium != null && glucose != null && bun != null
    ? (2 * sodium) + (glucose / 18) + (bun / 2.8)
    : null;

  const urgent = [];
  const findings = [];
  const likely = [];
  const alternatives = [];
  const missing = [];
  const cautions = [];

  if (sodium == null) {
    return { classification: 'Ingresa el sodio plasmático', correctedSodium, calculatedOsm, glucoseProvided: glucose != null, urgent, findings, likely, alternatives, missing: ['Sodio plasmático'], cautions };
  }

  const hyponatremia = correctedSodium < 135;
  const hypernatremia = correctedSodium > 145;
  const classification = hyponatremia
    ? `Hiponatremia (${correctedSodium < 125 ? 'profunda' : correctedSodium < 130 ? 'moderada' : 'leve'})`
    : hypernatremia
      ? `Hipernatremia (${correctedSodium > 160 ? 'grave' : correctedSodium > 150 ? 'moderada' : 'leve'})`
      : 'Natremia corregida dentro de rango';

  if (values.symptoms === 'graves' && (hyponatremia || hypernatremia)) {
    urgent.push('Síntomas neurológicos graves: estabilizar y tratar como emergencia mientras se estudia la etiología.');
  }
  if (hyponatremia && correctedSodium < 125) urgent.push('Na <125 mEq/L: requiere evaluación y controles seriados estrechos.');
  if (hypernatremia && correctedSodium > 160) urgent.push('Na >160 mEq/L: hipernatremia grave; monitorización y corrección controlada.');
  if (values.onset === 'desconocida') cautions.push('Duración desconocida: para la velocidad de corrección, manejar como trastorno crónico salvo evidencia contraria.');

  if (!hyponatremia && !hypernatremia) {
    if (sodium < 135 && correctedSodium >= 135) {
      likely.push('Hiponatremia translocacional explicada al menos parcialmente por hiperglicemia.');
    } else {
      findings.push('El sodio corregido no confirma actualmente hipo ni hipernatremia.');
    }
    return { classification, correctedSodium, calculatedOsm, glucoseProvided: glucose != null, urgent, findings, likely, alternatives, missing, cautions };
  }

  if (hyponatremia) {
    if (serumOsm == null) missing.push('Osmolalidad plasmática medida');
    if (serumOsm != null && serumOsm >= 275 && serumOsm <= 295) {
      likely.push('Hiponatremia no hipotónica/isotónica: revisar pseudohiponatremia, proteínas y lípidos; confirmar método de medición.');
    } else if (serumOsm != null && serumOsm > 295) {
      likely.push('Hiponatremia hipertónica/translocacional.');
      alternatives.push('Hiperglicemia, manitol u otro osmolo efectivo.');
    } else if (serumOsm != null || values.hyperglycemiaOrMannitol) {
      findings.push(serumOsm != null ? 'Hiponatremia hipotónica confirmada.' : 'Existe un osmolo efectivo que puede modificar la interpretación.');
    }

    const hypotonic = serumOsm == null || serumOsm < 275;
    if (hypotonic) {
      if (urineOsm == null) missing.push('Osmolalidad urinaria simultánea');
      if (urineOsm != null && urineOsm <= 100) {
        likely.push('Excreción apropiada de agua libre (orina máximamente diluida).');
        alternatives.push('Polidipsia primaria o ingesta excesiva de agua.');
        alternatives.push('Baja ingesta de solutos: potomanía, dieta “té y tostadas” u otra malnutrición.');
      } else if (urineOsm != null) {
        findings.push('Osm urinaria >100 mOsm/kg: actividad de vasopresina presente.');
        if (urineSodium == null) missing.push('Sodio urinario simultáneo');
        if (urineSodium != null && urineSodium <= 30) {
          if (values.volumeStatus === 'hipervolemica' || values.edema || values.heartLiverDisease) {
            likely.push('Bajo volumen arterial efectivo con sobrecarga.');
            alternatives.push('Insuficiencia cardiaca, cirrosis o síndrome nefrótico.');
          } else {
            likely.push('Bajo volumen arterial efectivo / hipovolemia probable.');
            alternatives.push('Pérdidas gastrointestinales, tercer espacio o baja ingesta.');
          }
        } else if (urineSodium != null) {
          if (values.volumeStatus === 'euvolemica') {
            likely.push('Patrón compatible con SIAD/SIADH si se excluyen insuficiencia suprarrenal, hipotiroidismo, diuréticos e insuficiencia renal.');
          } else if (values.volumeStatus === 'hipovolemica') {
            likely.push('Pérdida renal de sodio.');
            alternatives.push('Diuréticos, insuficiencia suprarrenal, nefropatía perdedora de sal o alcalosis con bicarbonaturia.');
          } else if (values.volumeStatus === 'hipervolemica') {
            alternatives.push('Enfermedad renal avanzada o uso de diuréticos pueden elevar el sodio urinario.');
          } else {
            likely.push('Na urinario >30 mEq/L: integrar volemia y fármacos antes de atribuir SIADH.');
          }
        }
      }
    }
    if (values.diuretics) cautions.push('Los diuréticos vuelven menos confiable el sodio urinario; considerar ácido úrico/FE urato y reevaluar tras revisar el fármaco.');
    if (values.adrenalOrThyroidPending) missing.push('TSH/T4L y cortisol matinal según contexto');
  }

  if (hypernatremia) {
    if (urineVolume == null) missing.push('Diuresis de 24 horas');
    if (urineOsm == null) missing.push('Osmolalidad urinaria');
    if (values.volumeStatus === 'hipervolemica' || values.edema) {
      likely.push('Ganancia de sodio o sobrecarga hipertónica.');
      alternatives.push('NaCl hipertónico, bicarbonato, alimentación hipertónica o exceso mineralocorticoide.');
    }
    if (urineOsm != null && urineOsm > 800) {
      findings.push('Respuesta renal concentradora conservada.');
      likely.push(values.volumeStatus === 'hipovolemica'
        ? 'Pérdidas extrarrenales de agua o acceso insuficiente al agua.'
        : 'Déficit de aporte/pérdidas insensibles; buscar pérdidas gastrointestinales, fiebre o taquipnea.');
    } else if (urineOsm != null && urineOsm < 300) {
      findings.push('Orina inapropiadamente diluida para la hipernatremia.');
      if (urineVolume != null && urineVolume >= 3000) {
        likely.push('Diabetes insípida probable.');
        alternatives.push('Central versus nefrogénica: diferenciar con evaluación especializada y respuesta a desmopresina bajo supervisión.');
      } else {
        alternatives.push('Diabetes insípida parcial o diuresis no cuantificada; verificar balance y diuresis horaria.');
      }
    } else if (urineOsm != null) {
      likely.push('Capacidad de concentración parcial.');
      alternatives.push('Diabetes insípida parcial o diuresis osmótica por glucosa, urea, manitol o fase postobstructiva.');
    }
    if (urineSodium != null && urineSodium < 20 && values.volumeStatus !== 'hipervolemica') {
      findings.push('Na urinario bajo: compatible con conservación renal de sodio por depleción de volumen.');
    }
    if (values.giLosses) alternatives.push('Las pérdidas gastrointestinales pueden explicar déficit de agua y volumen.');
    if (values.kidneyDisease) cautions.push('La enfermedad renal reduce la capacidad de concentrar orina y limita la interpretación de los puntos de corte.');
  }

  if (values.polydipsia && hyponatremia) alternatives.push('Antecedente de polidipsia: correlacionar con osm urinaria ≤100 mOsm/kg.');
  if (values.lowSolute && hyponatremia) alternatives.push('Baja carga de solutos: puede limitar la excreción de agua aun con vasopresina suprimida.');
  return {
    classification,
    correctedSodium,
    calculatedOsm,
    glucoseProvided: glucose != null,
    urgent,
    findings: [...new Set(findings)],
    likely: [...new Set(likely)],
    alternatives: [...new Set(alternatives)],
    missing: [...new Set(missing)],
    cautions: [...new Set(cautions)],
  };
}

export default function NatremiaEtiologyAssistant() {
  const [values, setValues] = useState(initialValues);
  const result = useMemo(() => buildOrientation(values), [values]);
  const set = (key, value) => setValues((current) => ({ ...current, [key]: value }));

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-gradient-to-r from-cyan-50 to-blue-50 px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-black text-slate-900">
              <Droplets className="h-5 w-5 text-cyan-700" />
              Orientación etiológica de la natremia
            </h3>
            <p className="mt-1 max-w-3xl text-sm text-slate-600">
              Integra clínica, osmolaridad y estudios urinarios. Entrega patrones compatibles y exámenes faltantes; no establece un diagnóstico definitivo.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setValues(initialValues)} className="gap-2">
            <RotateCcw className="h-4 w-4" /> Limpiar
          </Button>
        </div>
      </div>

      <div className="grid gap-5 p-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)] lg:p-5">
        <div className="space-y-5">
          <section>
            <h4 className="mb-3 flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-700">
              <Beaker className="h-4 w-4 text-cyan-700" /> Laboratorio disponible
            </h4>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <Field label="Sodio plasmático (mEq/L) *"><Input type="number" step="0.1" value={values.sodium} onChange={(e) => set('sodium', e.target.value)} /></Field>
              <Field label="Glicemia (mg/dL)"><Input type="number" step="1" value={values.glucose} onChange={(e) => set('glucose', e.target.value)} /></Field>
              <Field label="BUN (mg/dL)"><Input type="number" step="0.1" value={values.bun} onChange={(e) => set('bun', e.target.value)} /></Field>
              <Field label="Osm plasmática medida (mOsm/kg)"><Input type="number" step="1" value={values.serumOsm} onChange={(e) => set('serumOsm', e.target.value)} /></Field>
              <Field label="Osm urinaria (mOsm/kg)"><Input type="number" step="1" value={values.urineOsm} onChange={(e) => set('urineOsm', e.target.value)} /></Field>
              <Field label="Sodio urinario (mEq/L)"><Input type="number" step="0.1" value={values.urineSodium} onChange={(e) => set('urineSodium', e.target.value)} /></Field>
              <Field label="Diuresis 24 h (mL)"><Input type="number" step="1" value={values.urineVolume} onChange={(e) => set('urineVolume', e.target.value)} /></Field>
            </div>
          </section>

          <section>
            <h4 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-700">Datos clínicos</h4>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Volemia clínica">
                <select value={values.volumeStatus} onChange={(e) => set('volumeStatus', e.target.value)} className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm">
                  <option value="no_definida">No definida</option>
                  <option value="hipovolemica">Hipovolémica</option>
                  <option value="euvolemica">Euvolémica</option>
                  <option value="hipervolemica">Hipervolémica</option>
                </select>
              </Field>
              <Field label="Síntomas neurológicos">
                <select value={values.symptoms} onChange={(e) => set('symptoms', e.target.value)} className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm">
                  <option value="sin_graves">Ausentes o leves</option>
                  <option value="graves">Convulsión, coma o compromiso grave</option>
                </select>
              </Field>
              <Field label="Instalación">
                <select value={values.onset} onChange={(e) => set('onset', e.target.value)} className="h-10 w-full rounded-md border border-input bg-white px-3 text-sm">
                  <option value="desconocida">Desconocida</option>
                  <option value="aguda">Aguda documentada (&lt;48 h)</option>
                  <option value="cronica">Crónica (≥48 h)</option>
                </select>
              </Field>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Check checked={values.edema} onChange={(v) => set('edema', v)}>Edema, ascitis o congestión</Check>
              <Check checked={values.giLosses} onChange={(v) => set('giLosses', v)}>Vómitos, diarrea u otras pérdidas GI</Check>
              <Check checked={values.diuretics} onChange={(v) => set('diuretics', v)}>Uso reciente de diuréticos</Check>
              <Check checked={values.polydipsia} onChange={(v) => set('polydipsia', v)}>Polidipsia o ingesta excesiva de agua</Check>
              <Check checked={values.lowSolute} onChange={(v) => set('lowSolute', v)}>Baja ingesta de proteínas/solutos</Check>
              <Check checked={values.hyperglycemiaOrMannitol} onChange={(v) => set('hyperglycemiaOrMannitol', v)}>Hiperglicemia, manitol u otro osmolo</Check>
              <Check checked={values.kidneyDisease} onChange={(v) => set('kidneyDisease', v)}>Enfermedad renal significativa</Check>
              <Check checked={values.heartLiverDisease} onChange={(v) => set('heartLiverDisease', v)}>Insuficiencia cardiaca o cirrosis</Check>
              <Check checked={values.adrenalOrThyroidPending} onChange={(v) => set('adrenalOrThyroidPending', v)}>Función suprarrenal/tiroidea no evaluada</Check>
            </div>
          </section>
        </div>

        <aside className="space-y-3">
          <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-cyan-800">Interpretación actual</p>
            <p className="mt-1 text-xl font-black text-slate-900">{result.classification}</p>
            {result.correctedSodium != null && (
              <p className="mt-2 text-sm text-slate-700">
                {result.glucoseProvided ? 'Na corregido por glicemia' : 'Na ingresado'}: <strong>{result.correctedSodium.toFixed(1)} mEq/L</strong>
              </p>
            )}
            {result.calculatedOsm != null && (
              <p className="text-sm text-slate-700">Osm calculada: <strong>{result.calculatedOsm.toFixed(0)} mOsm/kg</strong></p>
            )}
            <p className="mt-2 text-[11px] text-slate-500">La osmolalidad medida tiene prioridad sobre la calculada.</p>
          </div>

          {result.urgent.length > 0 && (
            <div className="rounded-xl border border-red-300 bg-red-50 p-4">
              <p className="flex items-center gap-2 text-sm font-black text-red-800"><AlertTriangle className="h-4 w-4" /> Prioridad clínica</p>
              <ul className="mt-2 space-y-1 text-sm text-red-900">{result.urgent.map((item) => <li key={item}>• {item}</li>)}</ul>
            </div>
          )}

          {result.likely.length > 0 && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="flex items-center gap-2 text-sm font-black text-emerald-800"><CheckCircle2 className="h-4 w-4" /> Orientación principal</p>
              <ul className="mt-2 space-y-1 text-sm text-emerald-950">{result.likely.map((item) => <li key={item}>• {item}</li>)}</ul>
            </div>
          )}

          {(result.findings.length > 0 || result.alternatives.length > 0) && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-black text-slate-800">Hallazgos y diferenciales</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                {[...result.findings, ...result.alternatives].map((item) => <li key={item}>• {item}</li>)}
              </ul>
            </div>
          )}

          {result.missing.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-black text-amber-900">Datos útiles que faltan</p>
              <ul className="mt-2 space-y-1 text-sm text-amber-950">{result.missing.map((item) => <li key={item}>• {item}</li>)}</ul>
            </div>
          )}

          {result.cautions.length > 0 && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-4">
              <p className="text-sm font-black text-orange-900">Precauciones de interpretación</p>
              <ul className="mt-2 space-y-1 text-sm text-orange-950">{result.cautions.map((item) => <li key={item}>• {item}</li>)}</ul>
            </div>
          )}
        </aside>
      </div>

      <div className="border-t border-slate-200 bg-slate-50 px-5 py-3 text-xs leading-relaxed text-slate-600">
        Herramienta orientativa basada en osmolalidad plasmática, osmolalidad urinaria y sodio urinario. Interpretar muestras simultáneas y considerar diuréticos, enfermedad renal y tratamiento ya iniciado.
      </div>
    </div>
  );
}
