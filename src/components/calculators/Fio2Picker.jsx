import { DISPOSITIVOS_O2, dispositivoPorId, estimarFio2 } from '@/lib/fio2';

const control = 'mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100';

/**
 * Selector de dispositivo de oxígeno que estima la FiO2. Se comparte entre las
 * calculadoras que la necesitan (PaFi, índice de ROX).
 *
 * @param {{value:{dispositivo:string,flujo:string,fio2:string}, onChange:Function}} props
 */
export default function Fio2Picker({ value, onChange }) {
  const item = dispositivoPorId(value.dispositivo);
  const fio2 = estimarFio2(value);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Oxigenoterapia</p>

      <label className="block text-sm font-semibold text-slate-700">
        Dispositivo
        <select
          value={value.dispositivo}
          onChange={event => onChange({ dispositivo: event.target.value, flujo: '', fio2: '' })}
          className={control}
        >
          <option value="">Seleccionar…</option>
          {DISPOSITIVOS_O2.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
        </select>
      </label>

      {item?.tipo === 'flujo' && (
        <label className="mt-3 block text-sm font-semibold text-slate-700">
          Flujo <span className="font-normal text-slate-400">(L/min, entre {item.flujoMin} y {item.flujoMax})</span>
          <input
            type="number"
            min={item.flujoMin}
            max={item.flujoMax}
            step={item.paso}
            value={value.flujo}
            onChange={event => onChange({ ...value, flujo: event.target.value })}
            className={control}
            placeholder="L/min"
          />
        </label>
      )}

      {item?.tipo === 'opciones' && (
        <div className="mt-3">
          <p className="text-sm font-semibold text-slate-700">FiO₂ del jet</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {item.opciones.map(option => (
              <button
                key={option}
                type="button"
                onClick={() => onChange({ ...value, fio2: String(option) })}
                aria-pressed={Number(value.fio2) === option}
                className={`rounded-lg border px-3 py-1.5 text-sm font-bold transition-colors ${
                  Number(value.fio2) === option
                    ? 'border-teal-500 bg-teal-600 text-white'
                    : 'border-slate-300 bg-white text-slate-600 hover:border-teal-400'
                }`}
              >
                {option}%
              </button>
            ))}
          </div>
        </div>
      )}

      {item?.tipo === 'directo' && (
        <label className="mt-3 block text-sm font-semibold text-slate-700">
          FiO₂ programada <span className="font-normal text-slate-400">(%)</span>
          <input
            type="number"
            min={item.min}
            max={item.max}
            value={value.fio2}
            onChange={event => onChange({ ...value, fio2: event.target.value })}
            className={control}
            placeholder="%"
          />
        </label>
      )}

      {item?.nota && <p className="mt-2 text-xs leading-snug text-slate-500">{item.nota}</p>}

      {fio2 !== null && (
        <p className="mt-2 rounded-lg bg-white px-3 py-2 text-sm">
          <span className="text-slate-500">FiO₂ estimada: </span>
          <strong className="text-slate-900">{fio2}%</strong>
          <span className="text-slate-500"> ({(fio2 / 100).toFixed(2)})</span>
        </p>
      )}
    </div>
  );
}
