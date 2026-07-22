import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  ArrowRightLeft,
  Clock,
  ExternalLink,
  Pill,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

import CalculatorWrapper from '@/components/calculator/CalculatorWrapper';
import CalculatorReferences from '@/components/calculator/CalculatorReferences';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  buildSwitchPlan,
  DRUGS,
  DRUG_KEYS,
  GROUP_LABELS,
  wikiPairUrl,
} from './antidepressantSwitchEngine';

const references = [
  {
    label: 'PsychiatryNet. Switching antidepressants (tabla interactiva por pares).',
    url: 'https://wiki.psychiatrienet.nl/wiki/SwitchAntidepressants',
  },
  {
    label: 'Keks N, Hope J, Keogh S. Switching and stopping antidepressants. Aust Prescr 2016;39:76-83.',
    url: 'https://australianprescriber.tg.org.au/articles/switching-and-stopping-antidepressants.html',
  },
  {
    label: 'NHS Specialist Pharmacy Service. Switching between antidepressants.',
    url: 'https://www.sps.nhs.uk/home/guidance/switching-between-antidepressants/',
  },
];

const RIESGO_UI = {
  bajo: {
    card: 'border-emerald-200 bg-emerald-50/60 hover:border-emerald-400',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    label: 'Riesgo bajo',
  },
  moderado: {
    card: 'border-amber-200 bg-amber-50/60 hover:border-amber-400',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    label: 'Precaución',
  },
  alto: {
    card: 'border-red-200 bg-red-50/60 hover:border-red-400',
    badge: 'bg-red-100 text-red-800 border-red-200',
    label: 'Alto riesgo',
  },
};

const ESTRATEGIA_LABEL = {
  direct: 'Cambio directo',
  'taper-switch': 'Traslape 1 semana',
  'fluox-origin': 'Inicio diferido',
  'cross-tca': 'Cross-taper lento',
  'taper-washout': 'Requiere lavado',
};

const GRUPOS_ORDEN = ['isrs', 'irsn', 'atipico', 'triciclico', 'rima'];

function TimelineCol({ icon: Icon, titulo, colorClass, steps }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className={`mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide ${colorClass}`}>
        <Icon className="h-3.5 w-3.5" /> {titulo}
      </div>
      <ol className="space-y-2">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-2 text-sm">
            <span className="mt-0.5 shrink-0 rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600 whitespace-nowrap">
              {s.dia}
            </span>
            <span className="text-slate-800 leading-snug">{s.accion}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function PlanDetalle({ plan }) {
  if (!plan) return null;
  const from = DRUGS[plan.from];
  const to = DRUGS[plan.to];
  const ui = RIESGO_UI[plan.riesgo];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${ui.badge}`}>{ui.label}</span>
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
          {ESTRATEGIA_LABEL[plan.estrategia]}
        </span>
      </div>

      <p className="text-sm font-semibold text-slate-900">{plan.titulo}</p>

      {plan.washoutDias > 0 && (
        <div className="flex items-start gap-2 rounded-xl border-2 border-red-300 bg-red-50 p-3">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div className="text-sm text-red-900">
            <p className="font-bold">
              Lavado obligatorio: {plan.washoutDias >= 28 ? `${Math.round(plan.washoutDias / 7)} semanas` : `${plan.washoutDias} días`} sin ningún antidepresivo
            </p>
            <p className="text-xs mt-0.5">Entre la última dosis de {from.label} y la primera de {to.label}.</p>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <TimelineCol icon={TrendingDown} titulo={`Suspender ${from.label}`} colorClass="text-rose-700" steps={plan.stopSteps} />
        <TimelineCol icon={TrendingUp} titulo={`Iniciar ${to.label}`} colorClass="text-emerald-700" steps={plan.startSteps} />
      </div>

      {plan.warnings.length > 0 && (
        <div className="space-y-1.5">
          {plan.warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {plan.notas.length > 0 && (
        <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
          {plan.notas.map((n, i) => <li key={i}>{n}</li>)}
        </ul>
      )}

      <a
        href={wikiPairUrl(plan.from, plan.to)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline"
      >
        Ver este par en PsychiatryNet <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}

export default function AntidepressantSwitchCalculator() {
  const [fromKey, setFromKey] = useState(null);
  const [dosis, setDosis] = useState('');
  const [previewKey, setPreviewKey] = useState(null); // destino abierto en la emergente
  const [result, setResult] = useState(null);

  const dosisNum = parseFloat(String(dosis).replace(',', '.')) || null;

  const previewPlan = useMemo(
    () => (fromKey && previewKey ? buildSwitchPlan(fromKey, previewKey, dosisNum) : null),
    [fromKey, previewKey, dosisNum],
  );

  const elegirOrigen = (key) => {
    setFromKey(key === fromKey ? null : key);
    setResult(null);
  };

  const confirmarPlan = () => {
    if (!previewPlan) return;
    const from = DRUGS[previewPlan.from];
    const to = DRUGS[previewPlan.to];
    setResult({
      plan: previewPlan,
      // Forma que espera PrintableResult
      score: `${from.label} → ${to.label}`,
      label: ESTRATEGIA_LABEL[previewPlan.estrategia],
      interpretation:
        `${previewPlan.titulo}. Riesgo ${previewPlan.riesgo}` +
        (previewPlan.washoutDias > 0 ? `. LAVADO OBLIGATORIO de ${previewPlan.washoutDias} días sin antidepresivo` : '') +
        '.',
      recommendations: [
        ...previewPlan.stopSteps.map((s) => `SUSPENDER ${from.label} — ${s.dia}: ${s.accion}`),
        ...previewPlan.startSteps.map((s) => `INICIAR ${to.label} — ${s.dia}: ${s.accion}`),
        ...previewPlan.warnings.map((w) => `⚠ ${w}`),
      ],
    });
    setPreviewKey(null);
  };

  const reset = () => {
    setFromKey(null);
    setDosis('');
    setPreviewKey(null);
    setResult(null);
  };

  const from = fromKey ? DRUGS[fromKey] : null;

  return (
    <CalculatorWrapper
      title="Cambio de antidepresivo (switch)"
      description="Esquema de traslape, descenso y lavado entre antidepresivos disponibles en Chile"
      icon={ArrowRightLeft}
      gradientFrom="fuchsia"
      gradientTo="purple"
      inputs={{
        'Antidepresivo actual': from ? `${from.label}${dosisNum ? ` ${dosis} mg/día` : ''}` : '—',
        'Cambiar a': result ? DRUGS[result.plan.to].label : '—',
      }}
      onCalculate={() => result}
      result={result}
      onReset={reset}
      printOnly
    >
      <div className="space-y-5">
        {/* Paso 1: fármaco actual */}
        <div>
          <Label className="text-sm font-bold text-slate-800">1. Antidepresivo actual</Label>
          <div className="mt-2 space-y-2.5">
            {GRUPOS_ORDEN.map((g) => (
              <div key={g}>
                <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">{GROUP_LABELS[g]}</p>
                <div className="flex flex-wrap gap-1.5">
                  {DRUG_KEYS.filter((k) => DRUGS[k].group === g).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => elegirOrigen(k)}
                      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                        fromKey === k
                          ? 'border-fuchsia-600 bg-fuchsia-600 text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-fuchsia-300 hover:bg-fuchsia-50'
                      }`}
                    >
                      {DRUGS[k].label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {from && (
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <div>
                <Label className="text-xs text-slate-600">Dosis actual (mg/día, opcional)</Label>
                <Input
                  value={dosis}
                  onChange={(e) => setDosis(e.target.value)}
                  inputMode="decimal"
                  placeholder={`ej. ${from.safeTarget}`}
                  className="mt-1 w-36 bg-white"
                />
              </div>
              <p className="pb-2 text-xs text-slate-500">
                {from.presentacion} · vida media {from.vidaMedia}
              </p>
            </div>
          )}
        </div>

        {/* Paso 2: destinos posibles */}
        {from && (
          <div>
            <Label className="text-sm font-bold text-slate-800">
              2. Cambiar {from.label} por… <span className="font-normal text-slate-500">(toca una opción para ver el esquema)</span>
            </Label>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {DRUG_KEYS.filter((k) => k !== fromKey).map((k) => {
                const p = buildSwitchPlan(fromKey, k, dosisNum);
                const ui = RIESGO_UI[p.riesgo];
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setPreviewKey(k)}
                    className={`rounded-xl border-2 bg-white p-3 text-left transition ${ui.card}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 font-semibold text-slate-900">
                        <Pill className="h-3.5 w-3.5 text-slate-400" />
                        {DRUGS[k].label}
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${ui.badge}`}>{ui.label}</span>
                      <span className="text-[11px] text-slate-500">{ESTRATEGIA_LABEL[p.estrategia]}</span>
                      {p.washoutDias > 0 && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
                          <Clock className="h-2.5 w-2.5" /> lavado
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Resultado confirmado (imprimible con el botón del wrapper) */}
        {result && (
          <div className="rounded-2xl border-2 border-fuchsia-200 bg-white p-4">
            <p className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
              <ShieldAlert className="h-4 w-4 text-fuchsia-600" />
              Esquema seleccionado: {DRUGS[result.plan.from].label} → {DRUGS[result.plan.to].label}
            </p>
            <PlanDetalle plan={result.plan} />
          </div>
        )}

        <p className="text-[11px] leading-relaxed text-slate-500">
          Esquemas orientativos basados en farmacocinética y opinión de expertos (PsychiatryNet, Keks 2016, Maudsley/NHS
          SPS). Adultos con función hepática y renal conservadas: adultos mayores, embarazo, comorbilidad o dosis altas
          requieren ajuste individual. No reemplaza el juicio clínico.
        </p>

        <CalculatorReferences references={references} />
      </div>

      {/* Emergente con el esquema del par elegido */}
      <Dialog open={!!previewKey} onOpenChange={(open) => !open && setPreviewKey(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <ArrowRightLeft className="h-5 w-5 text-fuchsia-600" />
              {from?.label}
              {dosisNum ? <span className="text-sm font-normal text-slate-500">{dosis} mg/día</span> : null}
              <ArrowRight className="h-4 w-4 text-slate-400" />
              {previewKey ? DRUGS[previewKey].label : ''}
            </DialogTitle>
          </DialogHeader>
          <PlanDetalle plan={previewPlan} />
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setPreviewKey(null)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={confirmarPlan}
              className="rounded-lg bg-fuchsia-600 px-4 py-2 text-sm font-semibold text-white hover:bg-fuchsia-700"
            >
              Usar este esquema
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </CalculatorWrapper>
  );
}
