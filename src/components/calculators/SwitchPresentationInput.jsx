import React from 'react';
import { Input } from '@/components/ui/input';
import { DRUGS } from './antidepressantSwitchEngine';
import { switchPresentation } from './switchPresentations';

const format = (n) => n.toLocaleString('es-CL');
export default function SwitchPresentationInput({ drugKey, side, value, onChange }) {
  const drug = DRUGS[drugKey];
  const presentation = switchPresentation(drugKey);
  const id = `switch-strength-${side}-${drugKey}`;
  const query = String(value.strength).replace(/\s*mg\s*$/i, '').trim().replace('.', ',');
  const suggestions = presentation.strengths.filter((n) => !query || format(n).includes(query));
  return <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
    <label htmlFor={id} className="font-semibold">{drug.label}: mg por {presentation.unit}</label>
    <Input id={id} type="text" inputMode="decimal" autoComplete="off" list={`${id}-options`}
      placeholder={presentation.strengths.map((n) => `${format(n)} mg`).join(' · ')}
      value={value.strength} onChange={(e) => onChange({ ...value, strength: e.target.value })} className="my-2" />
    <datalist id={`${id}-options`}>{presentation.strengths.map((n) => <option key={n} value={format(n)}>{format(n)} mg</option>)}</datalist>
    <div className="mb-3 flex flex-wrap gap-1.5" aria-label={`Presentaciones habituales de ${drug.label}`}>
      {suggestions.map((n) => <button key={n} type="button" onClick={() => onChange({ ...value, strength: format(n) })}
        className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${query === format(n) ? 'border-fuchsia-600 bg-fuchsia-50 text-fuchsia-800' : 'border-slate-200 text-slate-700 hover:border-fuchsia-300 hover:bg-fuchsia-50'}`}>{format(n)} mg</button>)}
    </div>
    {presentation.canSplit ? <label className="flex items-start gap-2"><input type="checkbox" checked={value.split} onChange={(e) => onChange({ ...value, split: e.target.checked })} />Confirmo que la presentación permite las fracciones indicadas (mitades o cuartos).</label>
      : <p className="text-xs text-slate-600">Puedes ingresar la concentración. El calendario muestra unidades enteras; si la dosis requiere otra concentración, debe confirmarse la presentación.</p>}
  </div>;
}
