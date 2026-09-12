import { useState } from 'react';
import ScoreShell, { NumberField } from './ScoreShell';

// Esquema de alimentación del lactante según el Manual de supervivencia HLCM.
const ESQUEMA = [
  { hasta: 0.25, volumen: 150, tomas: 8, etiqueta: 'Recién nacido (8–29 días)', nota: 'En la primera semana se parte con 60–70 ml/kg/día y se sube 20–30 ml/kg/día hasta llegar a 150.' },
  { hasta: 5, volumen: 150, tomas: 6, etiqueta: '1 a 4 meses 29 días', nota: 'Desde el segundo o tercer mes se pasa de 8 a 6 tomas diarias.' },
  { hasta: 6, volumen: 120, tomas: 6, etiqueta: '5º mes', nota: 'Se ajusta el volumen diario a 120 ml/kg/día.' },
  { hasta: 8, volumen: 120, tomas: 4, etiqueta: '6º y 7º mes', nota: 'Se inicia alimentación complementaria: 1 papilla con postre al almuerzo más 4 leches.' },
  { hasta: 12, volumen: 120, tomas: 3, etiqueta: '8º a 11º mes', nota: 'Segunda comida que reemplaza una leche: 3 leches y 2 comidas con postre.' },
  { hasta: 999, volumen: 100, tomas: 2, etiqueta: 'Desde el año', nota: 'Régimen de lactante mayor: 2 leches y 2 comidas.' },
];

// Aporte calórico por kilo y por mes (promedio de ambos sexos, manual HLCM).
const CALORIAS_POR_MES = [110, 104, 95, 90, 82, 81, 79, 79, 79, 80, 80, 80];

const FORMULAS = [
  { id: 'materna', label: 'Leche materna', calorias: 67, nota: 'Aporta entre 66 y 68 cal por 100 ml.' },
  { id: 'inicio135', label: 'Fórmula de inicio 13,5%', calorias: 67, nota: '0 a 6 meses.' },
  { id: 'inicio15', label: 'Fórmula de inicio 15%', calorias: 77, nota: 'Dilución concentrada.' },
  { id: 'continuacion14', label: 'Fórmula de continuación 14%', calorias: 68, nota: '6 a 12 meses. Similac 2 contiene probióticos: no usar en inmunosuprimidos.' },
  { id: 'continuacion16', label: 'Fórmula de continuación 16%', calorias: 78, nota: 'Dilución concentrada.' },
  { id: 'total10', label: 'Leche total 10%', calorias: 50, nota: 'Desde el año.' },
  { id: 'polimerica', label: 'Fórmula polimérica 22%', calorias: 100, nota: 'Aporta 1 cal por ml. Pediasure tiene probióticos; Ensure y Frebini no.' },
];

const redondear = (valor, decimales = 0) => {
  const factor = 10 ** decimales;
  return Math.round(valor * factor) / factor;
};
const aproximarA10 = valor => Math.round(valor / 10) * 10;

const esquemaPorEdad = meses => ESQUEMA.find(item => meses < item.hasta) || ESQUEMA[ESQUEMA.length - 1];
const caloriasPorEdad = meses => CALORIAS_POR_MES[Math.min(Math.floor(meses), CALORIAS_POR_MES.length - 1)] ?? 80;

export default function PediatricNutritionCalculator() {
  const [peso, setPeso] = useState('');
  const [meses, setMeses] = useState('');
  const [formulaId, setFormulaId] = useState('inicio135');
  const [metodo, setMetodo] = useState('volumen');

  const pesoNum = Number(peso);
  const mesesNum = Number(meses);
  const listo = Number.isFinite(pesoNum) && pesoNum > 0 && Number.isFinite(mesesNum) && mesesNum >= 0;

  const formula = FORMULAS.find(item => item.id === formulaId) || FORMULAS[0];
  const esquema = listo ? esquemaPorEdad(mesesNum) : null;
  const calKg = listo ? caloriasPorEdad(mesesNum) : null;

  const volumenDiario = listo
    ? metodo === 'volumen'
      ? pesoNum * esquema.volumen
      : (pesoNum * calKg * 100) / formula.calorias
    : null;
  const porToma = volumenDiario === null ? null : volumenDiario / esquema.tomas;
  const caloriasTotales = volumenDiario === null ? null : (volumenDiario * formula.calorias) / 100;

  const result = listo
    ? {
      nivel: `${esquema.etiqueta} · ${formula.label}`,
      bg: 'bg-sky-50 border-sky-200', badge: 'bg-sky-100 text-sky-800', text: 'text-sky-900',
      valor: `${aproximarA10(porToma)} ml × ${esquema.tomas}`,
      detalle: `${redondear(volumenDiario)} ml al día en ${esquema.tomas} tomas ≈ ${aproximarA10(porToma)} ml por toma cada ${redondear(24 / esquema.tomas)} horas.`,
      conducta: `Indicación: ${formula.label} ${aproximarA10(porToma)} ml cada ${redondear(24 / esquema.tomas)} horas por ${esquema.tomas} veces, vía oral.`,
      recs: [
        metodo === 'volumen'
          ? `Cálculo por volumen: ${esquema.volumen} ml/kg/día × ${redondear(pesoNum, 1)} kg.`
          : `Cálculo por calorías: ${calKg} cal/kg/día × ${redondear(pesoNum, 1)} kg = ${redondear(pesoNum * calKg)} cal/día, convertidas con ${formula.calorias} cal/100 ml.`,
        `Aporte calórico resultante: ${redondear(caloriasTotales)} cal al día (${redondear(caloriasTotales / pesoNum)} cal/kg/día).`,
        esquema.nota,
        formula.nota,
      ],
    }
    : null;

  return (
    <ScoreShell
      title="Alimentación del lactante — Volumen y calorías"
      subtitle="Esquema de leche por edad, con ambos métodos de cálculo."
      gradient="from-sky-600 to-cyan-700"
      badge={listo ? aproximarA10(porToma) : '—'}
      result={result}
      pending={!listo ? 'Ingresa el peso y la edad en meses.' : null}
      onReset={() => { setPeso(''); setMeses(''); setFormulaId('inicio135'); setMetodo('volumen'); }}
      references={[
        { label: 'Manual de supervivencia — Residencia Pediátrica, Hospital Luis Calvo Mackenna', url: '' },
      ]}
      footnote="Suplementos: vitaminas ACD 400 UI/día desde el mes hasta el año; fierro 1 mg/kg/día desde el 4º mes en el niño de término y 2 mg/kg/día desde el 2º mes en el prematuro; zinc 3 mg/día en prematuros con lactancia materna exclusiva. En anemia ferropénica, 3–6 mg/kg/día en dos tomas lejos de las comidas."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField label="Peso" unit="kg" min="0.5" max="40" step="0.1" value={peso} onChange={setPeso} />
        <NumberField label="Edad" unit="meses" min="0" max="36" step="1" value={meses} onChange={setMeses} />
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-700">Leche o fórmula</p>
        <select
          value={formulaId}
          onChange={event => setFormulaId(event.target.value)}
          className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
        >
          {FORMULAS.map(item => <option key={item.id} value={item.id}>{item.label} · {item.calorias} cal/100 ml</option>)}
        </select>
      </div>

      <div>
        <p className="text-sm font-semibold text-slate-700">Método de cálculo</p>
        <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
          {[['volumen', 'Por volumen (ml/kg/día)'], ['calorias', 'Por calorías (cal/kg/día)']].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setMetodo(value)}
              aria-pressed={metodo === value}
              className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                metodo === value ? 'border-sky-500 bg-sky-50 text-slate-900' : 'border-slate-300 bg-white text-slate-600 hover:border-sky-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-slate-500">
          El cálculo por calorías es el más correcto desde el punto de vista nutricional; por volumen es el de uso habitual. La diferencia suele ser mínima.
        </p>
      </div>
    </ScoreShell>
  );
}
