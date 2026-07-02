import React, { useMemo, useState } from 'react';
import { Activity, ShieldCheck } from 'lucide-react';

import CalculatorWrapper from '@/components/calculator/CalculatorWrapper';
import CalculatorReferences from '@/components/calculator/CalculatorReferences';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const n = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const round = (value, digits = 1) => {
  if (!Number.isFinite(value)) return '';
  return Number(value.toFixed(digits)).toString();
};

const mcg = (value) => Math.round(value).toString();
const mg = (value) => round(value, value < 10 ? 1 : 0);

const references = [
  {
    label: 'ACEP Clinical Policy: Procedural Sedation and Analgesia in the Emergency Department. Ann Emerg Med. 2014.',
    url: 'https://doi.org/10.1016/j.annemergmed.2013.10.015',
  },
  {
    label: 'ASA Practice Guidelines for Moderate Procedural Sedation and Analgesia 2018.',
    url: 'https://doi.org/10.1097/ALN.0000000000002043',
  },
  {
    label: 'Bellolio MF, et al. Adverse events in adults undergoing ED procedural sedation: systematic review/meta-analysis. Acad Emerg Med. 2016.',
    url: 'https://doi.org/10.1111/acem.12875',
  },
  {
    label: 'Ketamine-propofol vs propofol alone for ED procedural sedation: systematic review/meta-analysis. Acad Emerg Med. 2015.',
    url: 'https://doi.org/10.1111/acem.12737',
  },
];

const profiles = {
  cardioversion: {
    label: 'Cardioversión eléctrica',
    analgesia: 'fentanyl_low',
    sedative: 'etomidate',
    target: 'sedación profunda breve',
  },
  reduction: {
    label: 'Reducción ortopédica / luxación',
    analgesia: 'fentanyl',
    sedative: 'etomidate',
    target: 'analgésico + hipnótico corto; ketamina reservada como segunda línea',
  },
  painful_short: {
    label: 'Procedimiento doloroso breve',
    analgesia: 'fentanyl',
    sedative: 'midazolam',
    target: 'analgesia + ansiolisis/sedación titulada',
  },
  fragile: {
    label: 'Paciente añoso/frágil',
    analgesia: 'fentanyl_half',
    sedative: 'etomidate_half',
    target: 'titulación lenta con dosis reducida',
  },
};

const analgesics = {
  none: { label: 'Sin analgésico inicial', summary: 'Útil si el procedimiento es solo cardioversión muy breve y se decide hipnótico solo.' },
  fentanyl_low: { label: 'Fentanilo bajo', dose: 0.5, unit: 'mcg/kg', conc: '50 mcg/mL', summary: 'Analgesia corta; menor carga respiratoria que dosis mayores.' },
  fentanyl: { label: 'Fentanilo', dose: 1, unit: 'mcg/kg', conc: '50 mcg/mL', summary: 'Preferido local para analgesia EV breve; titular con monitorización.' },
  fentanyl_half: { label: 'Fentanilo reducido', dose: 0.25, unit: 'mcg/kg', conc: '50 mcg/mL', summary: 'Inicio prudente en fragilidad, EPOC, apnea del sueño o asociación con benzodiacepina.' },
  morphine: { label: 'Morfina EV', dose: 0.05, unit: 'mg/kg', conc: '10 mg/mL', summary: 'Alternativa si no hay fentanilo; más lenta y puede prolongar recuperación.' },
};

const sedatives = {
  etomidate: { label: 'Etomidato', dose: 0.1, unit: 'mg/kg', conc: '2 mg/mL', summary: 'Hipnótico corto, útil si hipotensión o cardioversión; no aporta analgesia.' },
  etomidate_half: { label: 'Etomidato reducido', dose: 0.05, unit: 'mg/kg', conc: '2 mg/mL', summary: 'Titulación prudente en adulto mayor/frágil.' },
  ketamine: { label: 'Ketamina', dose: 0.75, unit: 'mg/kg EV', conc: '50 mg/mL', summary: 'Segunda línea por stock limitado; útil si analgesia/sedación insuficiente, broncoespasmo o hipotensión relativa.' },
  midazolam: { label: 'Midazolam', dose: 0.03, unit: 'mg/kg', conc: '5 mg/mL', summary: 'Ansiolítico/amnésico; no analgésico. Mayor riesgo de sedación prolongada al combinar con opioides.' },
  midazolam_half: { label: 'Midazolam reducido', dose: 0.015, unit: 'mg/kg', conc: '5 mg/mL', summary: 'Usar muy titulado en adulto mayor, EPOC, obesidad o fragilidad.' },
};

const calcDose = (drug, weight) => {
  if (!drug || !weight) return null;
  const amount = drug.dose * weight;
  if (drug.unit.includes('mcg')) {
    return { amount, label: `${mcg(amount)} mcg`, volume: `${round(amount / 50, 1)} mL` };
  }
  const conc = drug.conc.includes('10 mg/mL') ? 10 : drug.conc.includes('5 mg/mL') ? 5 : drug.conc.includes('2 mg/mL') ? 2 : 50;
  return { amount, label: `${mg(amount)} mg`, volume: `${round(amount / conc, 2)} mL` };
};

export default function ProceduralSedoanalgesiaCalculator() {
  const [values, setValues] = useState({
    weight: '',
    profile: 'cardioversion',
    analgesic: 'auto',
    sedative: 'auto',
    ageRisk: false,
    shock: false,
    respiratoryRisk: false,
    difficultAirway: false,
    uncontrolledHtn: false,
    noRescueSetup: false,
  });
  const [result, setResult] = useState(null);

  const printableInputs = useMemo(() => [
    { label: 'Peso', value: values.weight ? `${values.weight} kg` : '' },
    { label: 'Procedimiento', value: profiles[values.profile]?.label || '' },
    { label: 'Riesgo respiratorio', value: values.respiratoryRisk ? 'Sí' : 'No' },
    { label: 'Vía aérea difícil', value: values.difficultAirway ? 'Sí' : 'No' },
  ], [values]);

  const setField = (field, value) => setValues(prev => ({ ...prev, [field]: value }));

  const handleCalculate = () => {
    const weight = n(values.weight);
    if (!weight) {
      const invalid = {
        score: 'Incompleto',
        label: 'Ingresa peso',
        color: 'bg-amber-50 border-amber-300',
        interpretation: 'La sedoanalgesia debe titularse con monitorización y equipo de rescate listo.',
        finalIndication: 'Ingresa peso para calcular dosis inicial.',
        safetyChecks: ['No iniciar sin monitor, oxígeno, aspiración, BVM y plan de vía aérea.'],
      };
      setResult(invalid);
      return invalid;
    }

    const profile = profiles[values.profile];
    const analgesicKey = values.analgesic === 'auto' ? profile.analgesia : values.analgesic;
    let sedativeKey = values.sedative === 'auto' ? profile.sedative : values.sedative;
    const ketamineAvoidance = values.uncontrolledHtn && sedativeKey === 'ketamine';

    if (values.ageRisk && sedativeKey === 'midazolam') sedativeKey = 'midazolam_half';
    if (values.ageRisk && sedativeKey === 'etomidate') sedativeKey = 'etomidate_half';
    if (ketamineAvoidance) sedativeKey = 'etomidate';

    const analgesic = analgesics[analgesicKey];
    const sedative = sedatives[sedativeKey];
    const analgesicDose = calcDose(analgesic, weight);
    const sedativeDose = calcDose(sedative, weight);
    const highRisk = values.difficultAirway || values.noRescueSetup || values.respiratoryRisk || values.ageRisk;

    const contraindications = [
      values.noRescueSetup ? 'No hay condiciones mínimas de rescate: no realizar sedación hasta tener monitor, oxígeno, aspiración, BVM, acceso EV y operador de vía aérea.' : null,
      values.difficultAirway ? 'Vía aérea difícil/alto riesgo: considerar anestesia/traslado o estrategia con menor profundidad; tener plan de vía aérea avanzado.' : null,
      values.respiratoryRisk ? 'EPOC, SAHOS, obesidad o hipoventilación: reducir dosis y evitar bolos rápidos de opioide + benzodiacepina.' : null,
      ketamineAvoidance ? 'Se cambió ketamina por etomidato: evitar ketamina si HTA severa, disección aórtica o isquemia coronaria activa no controlada.' : null,
    ].filter(Boolean);

    const finalIndication = [
      analgesicKey !== 'none' && analgesicDose ? `${analgesic.label}: ${analgesicDose.label} EV (${analgesicDose.volume}; ${analgesic.conc}).` : null,
      sedativeDose ? `${sedative.label}: ${sedativeDose.label} EV lento/titulado (${sedativeDose.volume}; ${sedative.conc}).` : null,
      'Reevaluar cada 1-2 min y titular bolos pequeños hasta lograr objetivo.',
    ].filter(Boolean).join(' ');

    const medicationCards = [
      analgesicKey !== 'none' && analgesicDose ? {
        title: analgesic.label,
        dose: `${analgesicDose.label} (${analgesicDose.volume})`,
        badge: analgesic.conc,
        details: [
          analgesic.summary,
          analgesicKey.startsWith('fentanyl') ? 'Naloxona disponible: 0,04 mg EV titulado si depresión respiratoria por opioide.' : 'Morfina tiene inicio más lento: esperar efecto antes de repetir.',
        ],
      } : null,
      sedativeDose ? {
        title: sedative.label,
        dose: `${sedativeDose.label} (${sedativeDose.volume})`,
        badge: sedative.conc,
        details: [
          sedative.summary,
          sedativeKey.startsWith('midazolam') ? 'Flumazenil disponible, pero usar con cautela si uso crónico de BZD o riesgo convulsivo.' : 'No tiene reversor específico: titular y preparar soporte ventilatorio.',
        ],
      } : null,
    ].filter(Boolean);

    const safetyChecks = [
      'Antes: consentimiento si procede, ayuno no debe retrasar urgencias, ASA/vía aérea, monitor ECG-PA-SpO2, ideal capnografía.',
      'Durante: médico responsable no debe ser el único operador del procedimiento; una persona monitoriza sedación/vía aérea.',
      'Rescate listo: oxígeno, aspiración, BVM, cánulas, laringoscopio/TET, naloxona y flumazenil.',
      highRisk ? 'Paciente de riesgo: iniciar con 25-50% menos dosis, bolos lentos y umbral bajo para ayuda/anestesia/traslado.' : 'Riesgo estándar: titular de a bolos, evitando profundizar más de lo necesario.',
      ...contraindications,
    ];

    const calcResult = {
      score: profile.label,
      label: profile.target,
      color: highRisk ? 'bg-amber-50 border-amber-300' : 'bg-emerald-50 border-emerald-300',
      interpretation: 'Estrategia de apoyo para sedación procedural en urgencias. La dosis final se titula a efecto y seguridad.',
      finalIndication,
      medicationCards,
      safetyChecks,
    };
    setResult(calcResult);
    return calcResult;
  };

  const handleReset = () => {
    setValues({
      weight: '',
      profile: 'cardioversion',
      analgesic: 'auto',
      sedative: 'auto',
      ageRisk: false,
      shock: false,
      respiratoryRisk: false,
      difficultAirway: false,
      uncontrolledHtn: false,
      noRescueSetup: false,
    });
    setResult(null);
  };

  return (
    <CalculatorWrapper
      title="Sedoanalgesia procedural — combinación local"
      description="Combina analgésico + inductor/sedante para cardioversión, reducciones y procedimientos breves."
      icon={Activity}
      gradientFrom="rose"
      gradientTo="orange"
      inputs={printableInputs}
      result={result}
      onCalculate={handleCalculate}
      onReset={handleReset}
      showPatientInfo={false}
    >
      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <Label className="mb-2 block text-sm">Peso (kg)</Label>
          <Input type="number" step="0.1" value={values.weight} onChange={e => setField('weight', e.target.value)} placeholder="Ej: 70" className="bg-white" />
        </div>
        <div>
          <Label className="mb-2 block text-sm">Procedimiento</Label>
          <Select value={values.profile} onValueChange={value => setField('profile', value)}>
            <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cardioversion">Cardioversión eléctrica</SelectItem>
              <SelectItem value="reduction">Reducción ortopédica</SelectItem>
              <SelectItem value="painful_short">Procedimiento doloroso breve</SelectItem>
              <SelectItem value="fragile">Adulto mayor/frágil</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-2 block text-sm">Analgésico</Label>
          <Select value={values.analgesic} onValueChange={value => setField('analgesic', value)}>
            <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Automático</SelectItem>
              <SelectItem value="none">Sin analgésico inicial</SelectItem>
              <SelectItem value="fentanyl_low">Fentanilo bajo</SelectItem>
              <SelectItem value="fentanyl">Fentanilo</SelectItem>
              <SelectItem value="fentanyl_half">Fentanilo reducido</SelectItem>
              <SelectItem value="morphine">Morfina EV</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-2 block text-sm">Inductor/sedante</Label>
          <Select value={values.sedative} onValueChange={value => setField('sedative', value)}>
            <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Automático</SelectItem>
              <SelectItem value="etomidate">Etomidato</SelectItem>
              <SelectItem value="ketamine">Ketamina (2ª línea)</SelectItem>
              <SelectItem value="midazolam">Midazolam</SelectItem>
              <SelectItem value="midazolam_half">Midazolam reducido</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {[
          ['ageRisk', 'Adulto mayor, fragilidad, hepatopatía o ERC: partir con dosis reducida.'],
          ['shock', 'Hipotensión/shock: evitar sedantes hipotensores; preferir etomidato; reservar ketamina si broncoespasmo o necesidad analgésica dominante.'],
          ['respiratoryRisk', 'EPOC, SAHOS, obesidad, hipoventilación o alto riesgo de apnea.'],
          ['difficultAirway', 'Vía aérea difícil o alto riesgo de aspiración.'],
          ['uncontrolledHtn', 'HTA severa, disección, isquemia coronaria activa o taquiarritmia catecolaminérgica.'],
          ['noRescueSetup', 'No está listo el set de rescate/monitorización.'],
        ].map(([field, label]) => (
          <label key={field} className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-950">
            <input type="checkbox" checked={values[field]} onChange={e => setField(field, e.target.checked)} className="mt-1" />
            <span>{label}</span>
          </label>
        ))}
      </div>

      {result && (
        <div className={`mt-6 rounded-xl border-2 p-5 ${result.color}`}>
          <div className="text-center">
            <div className="text-2xl font-bold text-slate-900">{result.score}</div>
            <p className="mt-2 text-sm text-slate-600">{result.label}</p>
          </div>
          <div className="mt-4 rounded-2xl border-2 border-rose-500 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wide text-rose-700">Indicación final sugerida</p>
            <p className="mt-2 text-xl font-black leading-snug text-rose-950">{result.finalIndication}</p>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {result.medicationCards.map((card, index) => (
              <div key={index} className="rounded-2xl border-2 border-rose-300 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-rose-700">Arsenal local</p>
                    <h4 className="mt-1 text-lg font-black text-slate-950">{card.title}</h4>
                  </div>
                  <span className="rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-bold text-rose-800">{card.badge}</span>
                </div>
                <div className="rounded-xl bg-rose-50 px-4 py-3 text-center">
                  <p className="text-2xl font-black text-rose-900">{card.dose}</p>
                </div>
                <div className="mt-3 space-y-1.5">
                  {card.details.map((detail, detailIndex) => (
                    <div key={detailIndex} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-white/80 bg-white/80 p-4">
            <p className="text-sm font-bold text-slate-900">Excepciones y seguridad</p>
            <p className="mt-1 text-sm text-slate-600">{result.interpretation}</p>
            <div className="mt-3 space-y-2">
              {result.safetyChecks.map((item, index) => (
                <div key={index} className="flex items-start gap-2 text-sm text-slate-700">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <CalculatorReferences references={references} note="Apoyo clínico. Sedación procedural exige monitorización, rescate de vía aérea y titulación a efecto; no sustituye protocolo institucional ni criterio del médico responsable." />
    </CalculatorWrapper>
  );
}
