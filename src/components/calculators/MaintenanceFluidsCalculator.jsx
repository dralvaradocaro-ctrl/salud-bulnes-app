import { useState } from 'react';
import ScoreShell, { NumberField } from './ScoreShell';

// Holliday-Segar: 100 ml/kg/día hasta 10 kg, +50 ml/kg entre 10 y 20, +20 ml/kg
// sobre 20. La regla 4-2-1 es la misma expresada por hora.
export function volumenHollidaySegar(peso) {
  if (peso <= 10) return peso * 100;
  if (peso <= 20) return 1000 + (peso - 10) * 50;
  return 1500 + (peso - 20) * 20;
}

export function velocidad421(peso) {
  if (peso <= 10) return peso * 4;
  if (peso <= 20) return 40 + (peso - 10) * 2;
  return 60 + (peso - 20);
}

// Superficie corporal por la fórmula del manual: (peso x 4 + 7) / (90 + peso).
export const superficieCorporal = peso => (peso * 4 + 7) / (90 + peso);

const redondear = (valor, decimales = 0) => {
  const factor = 10 ** decimales;
  return Math.round(valor * factor) / factor;
};

const PORCENTAJES = [50, 75, 100];

export default function MaintenanceFluidsCalculator() {
  const [peso, setPeso] = useState('');
  const [porcentaje, setPorcentaje] = useState(100);
  const [metodo, setMetodo] = useState('auto');
  const [mlM2, setMlM2] = useState(1500);

  const pesoNum = Number(peso);
  const listo = Number.isFinite(pesoNum) && pesoNum > 0 && pesoNum <= 150;

  // El manual recomienda Holliday bajo 20 kg y superficie corporal sobre 20 kg.
  const metodoEfectivo = metodo === 'auto' ? (listo && pesoNum > 20 ? 'sc' : 'holliday') : metodo;
  const sc = listo ? superficieCorporal(pesoNum) : null;

  const volumenBase = !listo
    ? null
    : metodoEfectivo === 'sc' ? sc * mlM2 : volumenHollidaySegar(pesoNum);
  const volumen = volumenBase === null ? null : volumenBase * (porcentaje / 100);
  const mlHora = volumen === null ? null : volumen / 24;

  const sodio = listo ? { min: pesoNum * 3, max: pesoNum * 4 } : null;
  const potasio = listo ? { min: pesoNum * 2, max: pesoNum * 3 } : null;

  const result = listo
    ? {
      nivel: metodoEfectivo === 'sc' ? 'Cálculo por superficie corporal' : 'Cálculo por Holliday-Segar',
      bg: 'bg-teal-50 border-teal-200', badge: 'bg-teal-100 text-teal-800', text: 'text-teal-900',
      valor: `${redondear(mlHora)} ml/h`,
      detalle: `${redondear(volumen)} ml en 24 horas${porcentaje !== 100 ? ` (${porcentaje}% de los requerimientos)` : ''}${metodoEfectivo === 'sc' ? ` · superficie corporal ${redondear(sc, 2)} m² a ${mlM2} ml/m²/día` : ''}.`,
      conducta: `Velocidad a indicar: ${redondear(mlHora)} ml/h.`,
      recs: [
        `Regla 4-2-1 (equivalente horario): ${redondear(velocidad421(pesoNum))} ml/h al 100%.`,
        `Sodio ${redondear(sodio.min)}–${redondear(sodio.max)} mEq/día → NaCl 10% ${redondear(sodio.min / 1.7, 1)}–${redondear(sodio.max / 1.7, 1)} ml/día.`,
        `Potasio ${redondear(potasio.min)}–${redondear(potasio.max)} mEq/día → KCl 10% ${redondear(potasio.min / 1.34, 1)}–${redondear(potasio.max / 1.34, 1)} ml/día.`,
        pesoNum < 12
          ? 'Menor de 1 año: usar suero glucosado al 5% para cubrir el 20% de los requerimientos calóricos y prevenir hipoglicemia y cetosis.'
          : 'Preescolar o escolar: se puede usar solución glucosalina.',
        'Velocidad máxima de potasio: 0,2 mEq/kg/h por vía periférica y 0,5 mEq/kg/h por vía central.',
      ],
    }
    : null;

  return (
    <ScoreShell
      title="Fluidos de mantención — Holliday-Segar y 4-2-1"
      subtitle="Volumen diario, velocidad y aporte de electrolitos."
      gradient="from-teal-700 to-emerald-700"
      badge={listo ? `${redondear(mlHora)}` : '—'}
      result={result}
      pending={!listo ? 'Ingresa el peso del paciente.' : null}
      onReset={() => { setPeso(''); setPorcentaje(100); setMetodo('auto'); setMlM2(1500); }}
      references={[
        { label: 'Holliday MA, Segar WE. The maintenance need for water in parenteral fluid therapy. Pediatrics 1957', url: 'https://doi.org/10.1542/peds.19.5.823' },
        { label: 'Manual de supervivencia — Residencia Pediátrica HLCM', url: '' },
      ]}
      footnote="El manual recomienda Holliday bajo 20 kg y superficie corporal sobre 20 kg, porque el agua corporal total baja y la superficie sube con la edad. Ajustar en cardiópatas, nefrópatas, SIADH y en riesgo de sobrecarga."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField label="Peso" unit="kg" min="0.5" max="150" step="0.1" value={peso} onChange={setPeso} />
        <div>
          <p className="text-sm font-semibold text-slate-700">Porcentaje de requerimientos</p>
          <div className="mt-1.5 flex gap-1.5">
            {PORCENTAJES.map(item => (
              <button
                key={item}
                type="button"
                onClick={() => setPorcentaje(item)}
                aria-pressed={porcentaje === item}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-bold transition-colors ${
                  porcentaje === item ? 'border-teal-500 bg-teal-600 text-white' : 'border-slate-300 bg-white text-slate-600 hover:border-teal-400'
                }`}
              >
                {item}%
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-700">Método de cálculo</p>
        <div className="mt-1.5 grid gap-1.5 sm:grid-cols-3">
          {[['auto', 'Automático por peso'], ['holliday', 'Holliday-Segar'], ['sc', 'Superficie corporal']].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setMetodo(value)}
              aria-pressed={metodo === value}
              className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                metodo === value ? 'border-teal-500 bg-teal-50 text-slate-900' : 'border-slate-300 bg-white text-slate-600 hover:border-teal-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {metodo === 'auto' && listo && (
          <p className="mt-1.5 text-xs text-slate-500">
            Con {redondear(pesoNum, 1)} kg se usa {metodoEfectivo === 'sc' ? 'superficie corporal' : 'Holliday-Segar'}.
          </p>
        )}
      </div>

      {metodoEfectivo === 'sc' && (
        <div>
          <p className="text-sm font-semibold text-slate-700">Aporte por superficie</p>
          <div className="mt-1.5 flex gap-1.5">
            {[1500, 1800].map(item => (
              <button
                key={item}
                type="button"
                onClick={() => setMlM2(item)}
                aria-pressed={mlM2 === item}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-bold transition-colors ${
                  mlM2 === item ? 'border-teal-500 bg-teal-600 text-white' : 'border-slate-300 bg-white text-slate-600 hover:border-teal-400'
                }`}
              >
                {item} ml/m²/día
              </button>
            ))}
          </div>
        </div>
      )}
    </ScoreShell>
  );
}
