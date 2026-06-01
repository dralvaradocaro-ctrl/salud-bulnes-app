import React, { useMemo, useState } from 'react';
import { AlertTriangle, Candy, Droplets, ShieldCheck } from 'lucide-react';

import CalculatorWrapper from '@/components/calculator/CalculatorWrapper';
import CalculatorReferences from '@/components/calculator/CalculatorReferences';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const references = [
  {
    label: 'Umpierrez GE, Korytkowski M. Diabetic emergencies: ketoacidosis, hyperglycaemic hyperosmolar state and hypoglycaemia. Nat Rev Endocrinol. 2016.',
    url: 'https://pubmed.ncbi.nlm.nih.gov/26893262/',
  },
  {
    label: 'Endocrine Society. Management of Hyperglycemia in Hospitalized Adult Patients in Non-Critical Care Settings. 2022.',
    url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9653018/',
  },
  {
    label: 'ADA Standards of Care: Diabetes Care in the Hospital.',
    url: 'https://diabetesjournals.org/care/issue',
  },
];

const numberOrNull = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export default function HypoglycemiaTreatmentCalculator() {
  const [values, setValues] = useState({
    glucose: '',
    state: 'awake',
    ivAccess: 'yes',
    sulfonylurea: false,
    highRisk: false,
  });
  const [result, setResult] = useState(null);

  const printableInputs = useMemo(() => [
    { label: 'HGT/glicemia', value: values.glucose ? `${values.glucose} mg/dL` : '' },
    { label: 'Estado', value: values.state === 'awake' ? 'Consciente y puede tragar' : 'Compromiso/no puede tragar' },
    { label: 'Vía venosa', value: values.ivAccess === 'yes' ? 'Sí' : 'No' },
    { label: 'Sulfonilurea', value: values.sulfonylurea ? 'Sospechada' : 'No sospechada' },
  ], [values]);

  const setField = (field, value) => setValues(prev => ({ ...prev, [field]: value }));

  const handleCalculate = () => {
    const glucose = numberOrNull(values.glucose);
    if (glucose === null) {
      const invalid = {
        score: 'Incompleto',
        label: 'Ingresa glicemia/HGT',
        interpretation: 'Si el paciente tiene síntomas neuroglucopénicos, tratar de inmediato mientras confirmas con HGT o glicemia venosa.',
        color: 'bg-amber-50 border-amber-300',
        recommendations: ['No retrasar dextrosa EV en compromiso de conciencia.'],
      };
      setResult(invalid);
      return invalid;
    }

    let level = 'Sin hipoglicemia';
    if (glucose < 54) level = 'Hipoglicemia clínicamente significativa';
    else if (glucose < 70) level = 'Hipoglicemia nivel alerta';
    if (values.state === 'altered') level = 'Hipoglicemia severa';

    const recommendations = [];
    const medicationCards = [];
    if (glucose >= 70 && values.state === 'awake') {
      recommendations.push('No requiere rescate inmediato si está asintomático; revisar tendencia y riesgo de nueva baja.');
    } else if (values.state === 'awake') {
      medicationCards.push({
        title: 'Carbohidrato oral de absorción rápida',
        dose: '15-20 g VO',
        badge: 'Paciente despierto',
        details: [
          'Ejemplos: glucosa oral, jugo azucarado o equivalente disponible.',
          'Recontrolar HGT a los 15 min y repetir si sigue <70 mg/dL.',
        ],
      });
      recommendations.push('Dar 15-20 g de carbohidrato de absorción rápida por vía oral.');
      recommendations.push('Controlar HGT a los 15 min; repetir 15-20 g si sigue <70 mg/dL.');
      recommendations.push('Cuando recupere >70 mg/dL, indicar colación o adelantar comida si la próxima ingesta no será inmediata.');
    } else if (values.ivAccess === 'yes') {
      medicationCards.push(
        {
          title: 'Suero glucosado 30%',
          dose: '50 mL EV = 15 g',
          badge: 'Opción local rápida',
          details: [
            'Si ampolla local es 20 mL: 2,5 ampollas.',
            'Si no se fracciona: 3 ampollas = 60 mL = 18 g.',
            'Prescribir en gramos + mL; ampollas solo como ayuda práctica.',
          ],
        },
        {
          title: 'Suero glucosado 10%',
          dose: '150 mL EV = 15 g',
          badge: 'Alternativa menos hipertónica',
          details: [
            'Útil si se quiere evitar carga hipertónica concentrada.',
            'Puede continuar como infusión si persiste riesgo por ayuno o exceso de insulina.',
          ],
        },
      );
      recommendations.push('Compromiso de conciencia o no puede tragar: dextrosa EV inmediata.');
      recommendations.push('Opción local: SG 30% 50 mL EV = 15 g de glucosa. Si la ampolla local es de 20 mL, son 2,5 ampollas; si no se fracciona, 3 ampollas = 60 mL = 18 g.');
      recommendations.push('Alternativa menos hipertónica: SG 10% 150 mL EV = 15 g de glucosa.');
      recommendations.push('Confirmar volumen de ampolla disponible y prescribir en gramos + mL; usar ampollas solo como ayuda práctica.');
      recommendations.push('Repetir control a los 15 min y repetir bolo/infusión si persiste <70 mg/dL.');
    } else {
      medicationCards.push({
        title: 'Glucagón',
        dose: '1 mg IM/SC',
        badge: 'Mientras se obtiene vía',
        details: [
          'Usar solo si está disponible; no reemplaza conseguir acceso EV/IO.',
          'Respuesta menor en ayuno prolongado, alcoholismo o desnutrición.',
        ],
      });
      recommendations.push('Sin vía venosa y no puede tragar: pedir ayuda, asegurar ABC y conseguir vía EV/IO urgente.');
      recommendations.push('Si existe glucagón disponible: 1 mg IM/SC mientras se obtiene vía; su respuesta puede ser pobre en ayuno prolongado, alcoholismo o desnutrición.');
    }

    recommendations.push('Revisar causa: ayuno o suspensión de alimentación, dosis de NPH/cristalina, deterioro renal, sepsis, alcohol, vómitos o error de administración.');
    recommendations.push('Suspender insulina prandial/corrección transitoriamente y reajustar esquema antes de la siguiente dosis.');
    recommendations.push('Monitorizar HGT cada 15 min hasta recuperar y luego al menos cada 1 h por 2-4 h según riesgo.');

    if (values.sulfonylurea) {
      recommendations.push('Sulfonilurea sospechada: alto riesgo de recurrencia prolongada, especialmente con VFG baja. Observar por tiempo extendido y considerar octreótido si hay recurrencias y disponibilidad/derivación.');
    }
    if (values.highRisk) {
      recommendations.push('Adulto mayor, VFG baja, bajo peso o antecedente de hipoglicemia severa: reducir meta glicémica estricta y considerar dosis diaria total de insulina más conservadora.');
    }

    const severe = values.state === 'altered' || glucose < 54;
    const calcResult = {
      score: level,
      label: severe ? 'Tratamiento inmediato y vigilancia de recurrencia' : 'Tratamiento y control en 15 min',
      interpretation: severe
        ? 'La prioridad es revertir neuroglucopenia, prevenir aspiración y evitar recurrencias. No administrar por vía oral si no hay deglución segura.'
        : glucose < 70
          ? 'Cumple umbral de hipoglicemia hospitalaria. Debe tratarse y repetirse control hasta recuperación sostenida.'
          : 'El valor no cumple hipoglicemia, pero puede requerir ajuste preventivo si hay síntomas o tendencia descendente.',
      color: severe ? 'bg-rose-50 border-rose-300' : 'bg-emerald-50 border-emerald-300',
      medicationCards,
      recommendations,
    };
    setResult(calcResult);
    return calcResult;
  };

  const handleReset = () => {
    setValues({ glucose: '', state: 'awake', ivAccess: 'yes', sulfonylurea: false, highRisk: false });
    setResult(null);
  };

  return (
    <CalculatorWrapper
      title="Hipoglicemia en urgencias: tratamiento inicial"
      description="Ordena el rescate según glicemia, conciencia, vía venosa y riesgo de recurrencia."
      icon={Candy}
      gradientFrom="emerald"
      gradientTo="cyan"
      inputs={printableInputs}
      result={result}
      onCalculate={handleCalculate}
      onReset={handleReset}
      showPatientInfo={false}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <Label className="mb-2 block text-sm">HGT/glicemia (mg/dL)</Label>
          <Input type="number" value={values.glucose} onChange={e => setField('glucose', e.target.value)} placeholder="Ej: 48" className="bg-white" />
        </div>
        <div>
          <Label className="mb-2 block text-sm">Estado del paciente</Label>
          <Select value={values.state} onValueChange={value => setField('state', value)}>
            <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="awake">Consciente y puede tragar</SelectItem>
              <SelectItem value="altered">Compromiso/no puede tragar</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="mb-2 block text-sm">Vía venosa disponible</Label>
          <Select value={values.ivAccess} onValueChange={value => setField('ivAccess', value)}>
            <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Sí</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <input type="checkbox" checked={values.sulfonylurea} onChange={e => setField('sulfonylurea', e.target.checked)} className="mt-1" />
          <span>Uso o sospecha de sulfonilurea.</span>
        </label>
        <label className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          <input type="checkbox" checked={values.highRisk} onChange={e => setField('highRisk', e.target.checked)} className="mt-1" />
          <span>Adulto mayor, VFG baja, bajo peso, ayuno o hipoglicemia severa previa.</span>
        </label>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-emerald-200 bg-white/80 p-3">
          <Candy className="mb-2 h-4 w-4 text-emerald-600" />
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">VO seguro</p>
          <p className="mt-1 text-xs text-slate-600">15-20 g carbohidrato, control en 15 min y repetir si sigue bajo.</p>
        </div>
        <div className="rounded-xl border border-cyan-200 bg-white/80 p-3">
          <Droplets className="mb-2 h-4 w-4 text-cyan-600" />
          <p className="text-xs font-bold uppercase tracking-wide text-cyan-700">EV</p>
          <p className="mt-1 text-xs text-slate-600">SG30% 50 mL = 15 g = 2,5 ampollas de 20 mL; 3 ampollas = 18 g. SG10% 150 mL = 15 g.</p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-white/80 p-3">
          <AlertTriangle className="mb-2 h-4 w-4 text-rose-600" />
          <p className="text-xs font-bold uppercase tracking-wide text-rose-700">Recurrente</p>
          <p className="mt-1 text-xs text-slate-600">Buscar sulfonilureas, falla renal, ayuno y exceso de NPH/cristalina.</p>
        </div>
      </div>

      {result && (
        <div className={`mt-6 rounded-xl border-2 p-5 ${result.color}`}>
          <div className="text-center">
            <div className="text-3xl font-bold text-slate-900">{result.score}</div>
            <p className="mt-2 text-sm text-slate-600">{result.label}</p>
          </div>
          <div className="mt-4 rounded-lg border border-white/80 bg-white/80 p-4">
            <h4 className="mb-2 text-sm font-bold text-slate-900">Interpretación</h4>
            <p className="text-sm leading-relaxed text-slate-700">{result.interpretation}</p>
          </div>
          {result.medicationCards?.length > 0 && (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {result.medicationCards.map((card, index) => (
                <div key={index} className="rounded-2xl border-2 border-emerald-300 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">Fármaco / solución</p>
                      <h4 className="mt-1 text-lg font-black text-slate-950">{card.title}</h4>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                      {card.badge}
                    </span>
                  </div>
                  <div className="rounded-xl bg-emerald-50 px-4 py-3 text-center">
                    <p className="text-2xl font-black text-emerald-900">{card.dose}</p>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {card.details.map((detail, detailIndex) => (
                      <div key={detailIndex} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                        <span>{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 space-y-2">
            {result.recommendations.map((item, index) => (
              <div key={index} className="flex items-start gap-2 text-sm text-slate-700">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <CalculatorReferences references={references} note="La calculadora no reemplaza protocolos de enfermería ni evaluación médica ante compromiso de conciencia, arritmia, sepsis o recurrencias." />
    </CalculatorWrapper>
  );
}
