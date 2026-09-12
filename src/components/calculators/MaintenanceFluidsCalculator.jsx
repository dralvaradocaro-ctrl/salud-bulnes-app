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

// Concentraciones del arsenal y tamaño de ampolla.
const NACL_MEQ_ML = 1.7;
const KCL_MEQ_ML = 1.34;
const AMPOLLA_ML = 10;
const MATRACES = [250, 500, 1000];

const redondear = (valor, decimales = 0) => {
  const factor = 10 ** decimales;
  return Math.round(valor * factor) / factor;
};

// Las ampollas se cargan con jeringa, así que el volumen se redondea al entero.
function enAmpollas(ml) {
  const ampollas = ml / AMPOLLA_ML;
  if (ampollas < 0.45) return 'menos de media ampolla';
  const redondeado = Math.round(ampollas * 2) / 2;
  return `${String(redondeado).replace('.5', '½').replace('0½', '½')} ampolla${redondeado > 1 ? 's' : ''}`;
}

/**
 * Receta lista para indicar: matraz, electrolitos escalados a ese matraz por
 * regla de tres, y duración a la velocidad calculada.
 */
export function construirReceta({ solucion, matraz, volumenDiario, mlHora, naMlDia, kMlDia }) {
  const proporcion = matraz / volumenDiario;
  const naMl = solucion === 'glucosalina' ? 0 : redondear(naMlDia * proporcion);
  const kMl = redondear(kMlDia * proporcion);
  const partes = [
    `${solucion === 'glucosalina' ? 'S. glucosalina' : 'SG 5%'} ${matraz} ml`,
    naMl > 0 ? `NaCl 10% ${naMl} ml` : null,
    kMl > 0 ? `KCl 10% ${kMl} ml` : null,
  ].filter(Boolean);

  return {
    linea: `${partes.join(' + ')} a pasar a ${redondear(mlHora)} ml/h`,
    naMl,
    kMl,
    duracionHoras: redondear(matraz / mlHora, 1),
  };
}

const PORCENTAJES = [50, 75, 100];

export default function MaintenanceFluidsCalculator() {
  const [peso, setPeso] = useState('');
  const [meses, setMeses] = useState('');
  const [porcentaje, setPorcentaje] = useState(100);
  const [metodo, setMetodo] = useState('auto');
  const [mlM2, setMlM2] = useState(1500);
  const [naKg, setNaKg] = useState(3);
  const [kKg, setKKg] = useState(2);
  const [solucionElegida, setSolucionElegida] = useState(null);
  const [matrazElegido, setMatrazElegido] = useState(null);

  const pesoNum = Number(peso);
  const mesesNum = Number(meses);
  const listo = Number.isFinite(pesoNum) && pesoNum > 0 && pesoNum <= 150;
  const conEdad = meses !== '' && Number.isFinite(mesesNum) && mesesNum >= 0;

  // El manual recomienda Holliday bajo 20 kg y superficie corporal sobre 20 kg.
  const metodoEfectivo = metodo === 'auto' ? (listo && pesoNum > 20 ? 'sc' : 'holliday') : metodo;
  const sc = listo ? superficieCorporal(pesoNum) : null;

  const volumenBase = !listo
    ? null
    : metodoEfectivo === 'sc' ? sc * mlM2 : volumenHollidaySegar(pesoNum);
  const volumen = volumenBase === null ? null : volumenBase * (porcentaje / 100);
  const mlHora = volumen === null ? null : volumen / 24;

  // Menor de 1 año va con suero glucosado al 5%; desde ahí, glucosalina.
  const solucionSugerida = conEdad ? (mesesNum < 12 ? 'sg5' : 'glucosalina') : null;
  const solucion = solucionElegida || solucionSugerida || 'sg5';
  const solucionSobrescrita = Boolean(solucionElegida && solucionSugerida && solucionElegida !== solucionSugerida);

  const naMeqDia = listo ? pesoNum * naKg : null;
  const kMeqDia = listo ? pesoNum * kKg : null;
  const naMlDia = naMeqDia === null ? null : naMeqDia / NACL_MEQ_ML;
  const kMlDia = kMeqDia === null ? null : kMeqDia / KCL_MEQ_ML;

  // Por defecto, el matraz más grande que no dure más de 24 horas.
  const matrazSugerido = volumen === null
    ? 500
    : [...MATRACES].reverse().find(item => item <= volumen) || MATRACES[0];
  const matraz = matrazElegido || matrazSugerido;

  const receta = listo && volumen
    ? construirReceta({ solucion, matraz, volumenDiario: volumen, mlHora, naMlDia, kMlDia })
    : null;

  const result = listo
    ? {
      nivel: metodoEfectivo === 'sc' ? 'Cálculo por superficie corporal' : 'Cálculo por Holliday-Segar',
      bg: 'bg-teal-50 border-teal-200', badge: 'bg-teal-100 text-teal-800', text: 'text-teal-900',
      valor: `${redondear(mlHora)} ml/h`,
      detalle: `${redondear(volumen)} ml en 24 horas${porcentaje !== 100 ? ` (${porcentaje}% de los requerimientos)` : ''}${metodoEfectivo === 'sc' ? ` · superficie corporal ${redondear(sc, 2)} m² a ${mlM2} ml/m²/día` : ''}.`,
      recs: [
        `Regla 4-2-1 (equivalente horario): ${redondear(velocidad421(pesoNum))} ml/h al 100%.`,
        `Requerimiento diario: sodio ${redondear(naMeqDia)} mEq (${redondear(naMlDia, 1)} ml de NaCl 10%) y potasio ${redondear(kMeqDia)} mEq (${redondear(kMlDia, 1)} ml de KCl 10%).`,
        `Velocidad máxima de potasio: ${redondear(pesoNum * 0.2, 1)} mEq/h por vía periférica y ${redondear(pesoNum * 0.5, 1)} mEq/h por vía central.`,
        solucion === 'sg5'
          ? 'El suero glucosado al 5% cubre cerca del 20% de los requerimientos calóricos, lo que previene hipoglicemia y cetosis.'
          : 'La solución glucosalina ya aporta 77 mEq de sodio por litro, por eso la receta no lleva NaCl.',
      ],
    }
    : null;

  return (
    <ScoreShell
      title="Fluidos de mantención — Holliday-Segar y 4-2-1"
      subtitle="Volumen, velocidad, electrolitos y la receta lista para indicar."
      gradient="from-teal-700 to-emerald-700"
      badge={listo ? `${redondear(mlHora)}` : '—'}
      result={result}
      pending={!listo ? 'Ingresa el peso del paciente.' : null}
      onReset={() => {
        setPeso(''); setMeses(''); setPorcentaje(100); setMetodo('auto');
        setMlM2(1500); setNaKg(3); setKKg(2); setSolucionElegida(null); setMatrazElegido(null);
      }}
      highlight={receta && (
        <div className="border-y-2 border-teal-300 bg-teal-50 px-6 py-4">
          <p className="text-xs font-bold uppercase tracking-wide text-teal-700">Receta para indicar</p>
          <p className="mt-1 text-lg font-black leading-snug text-teal-950">{receta.linea}</p>
          <p className="mt-1.5 text-sm text-teal-900">
            El matraz dura aproximadamente {receta.duracionHoras} horas a esa velocidad.
            {receta.naMl > 0 && ` NaCl: ${enAmpollas(receta.naMl)}.`}
            {receta.kMl > 0 && ` KCl: ${enAmpollas(receta.kMl)}.`}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs font-bold uppercase tracking-wide text-teal-700">Matraz</span>
            {MATRACES.map(item => (
              <button
                key={item}
                type="button"
                onClick={() => setMatrazElegido(item)}
                aria-pressed={matraz === item}
                className={`rounded-lg border px-3 py-1.5 text-sm font-bold transition-colors ${
                  matraz === item ? 'border-teal-600 bg-teal-700 text-white' : 'border-teal-300 bg-white text-teal-800 hover:border-teal-500'
                }`}
              >
                {item} ml
              </button>
            ))}
          </div>
        </div>
      )}
      references={[
        { label: 'Holliday MA, Segar WE. Pediatrics 1957', url: 'https://doi.org/10.1542/peds.19.5.823' },
        { label: 'Manual de supervivencia — Residencia Pediátrica HLCM', url: '' },
      ]}
      footnote="Los electrolitos de la receta se escalan al matraz por regla de tres; la velocidad no cambia al cambiar de matraz. Ajustar en cardiópatas, nefrópatas, SIADH y en riesgo de sobrecarga."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField label="Peso" unit="kg" min="0.5" max="150" step="0.1" value={peso} onChange={setPeso} />
        <NumberField label="Edad (define la solución)" unit="meses" min="0" max="216" step="1" value={meses} onChange={setMeses} />
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-700">Solución</p>
          {solucionSobrescrita && (
            <button type="button" onClick={() => setSolucionElegida(null)} className="text-xs font-semibold text-teal-700 underline underline-offset-2 hover:text-teal-900">
              Volver a la que corresponde por edad
            </button>
          )}
        </div>
        <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
          {[['sg5', 'Suero glucosado 5%', 'Menor de 1 año'], ['glucosalina', 'Solución glucosalina', 'Preescolar y escolar']].map(([value, label, detalle]) => (
            <button
              key={value}
              type="button"
              onClick={() => setSolucionElegida(value)}
              aria-pressed={solucion === value}
              className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                solucion === value ? 'border-teal-500 bg-teal-50' : 'border-slate-300 bg-white hover:border-teal-400'
              }`}
            >
              <span className="block text-sm font-semibold text-slate-900">{label}</span>
              <span className="block text-xs text-slate-500">{detalle}</span>
            </button>
          ))}
        </div>
        {solucionSugerida && !solucionSobrescrita && conEdad && (
          <p className="mt-1.5 text-xs text-teal-700">Seleccionada automáticamente por la edad.</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm font-semibold text-slate-700">Sodio <span className="font-normal text-slate-400">(mEq/kg/día)</span></p>
          <div className="mt-1.5 flex gap-1.5">
            {[3, 4].map(item => (
              <button key={item} type="button" onClick={() => setNaKg(item)} aria-pressed={naKg === item}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-bold transition-colors ${naKg === item ? 'border-teal-500 bg-teal-600 text-white' : 'border-slate-300 bg-white text-slate-600 hover:border-teal-400'}`}>
                {item}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700">Potasio <span className="font-normal text-slate-400">(mEq/kg/día)</span></p>
          <div className="mt-1.5 flex gap-1.5">
            {[2, 3].map(item => (
              <button key={item} type="button" onClick={() => setKKg(item)} aria-pressed={kKg === item}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-bold transition-colors ${kKg === item ? 'border-teal-500 bg-teal-600 text-white' : 'border-slate-300 bg-white text-slate-600 hover:border-teal-400'}`}>
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm font-semibold text-slate-700">Porcentaje de requerimientos</p>
          <div className="mt-1.5 flex gap-1.5">
            {PORCENTAJES.map(item => (
              <button key={item} type="button" onClick={() => setPorcentaje(item)} aria-pressed={porcentaje === item}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-bold transition-colors ${porcentaje === item ? 'border-teal-500 bg-teal-600 text-white' : 'border-slate-300 bg-white text-slate-600 hover:border-teal-400'}`}>
                {item}%
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700">Método de cálculo</p>
          <div className="mt-1.5 flex gap-1.5">
            {[['auto', 'Auto'], ['holliday', 'Holliday'], ['sc', 'Superficie']].map(([value, label]) => (
              <button key={value} type="button" onClick={() => setMetodo(value)} aria-pressed={metodo === value}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${metodo === value ? 'border-teal-500 bg-teal-50 text-slate-900' : 'border-slate-300 bg-white text-slate-600 hover:border-teal-400'}`}>
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
      </div>

      {metodoEfectivo === 'sc' && (
        <div>
          <p className="text-sm font-semibold text-slate-700">Aporte por superficie</p>
          <div className="mt-1.5 flex gap-1.5">
            {[1500, 1800].map(item => (
              <button key={item} type="button" onClick={() => setMlM2(item)} aria-pressed={mlM2 === item}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-bold transition-colors ${mlM2 === item ? 'border-teal-500 bg-teal-600 text-white' : 'border-slate-300 bg-white text-slate-600 hover:border-teal-400'}`}>
                {item} ml/m²/día
              </button>
            ))}
          </div>
        </div>
      )}
    </ScoreShell>
  );
}
