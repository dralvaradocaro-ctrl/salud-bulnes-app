import { Link } from 'react-router-dom';
import { useArsenalCatalog } from './ArsenalHighlighter';
const normalize = value => (value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
export default function ArsenalMatch({ text = '' }) {
  const { data, isPending, isError } = useArsenalCatalog();
  const content = ` ${normalize(text)} `;
  const matches = (data || []).filter(med => [med.name, med.active_ingredient].some(name => normalize(name).length >= 4 && content.includes(` ${normalize(name)} `)));
  return <span className="mt-2 block text-xs font-normal text-slate-600">
    {isPending ? 'Consultando catálogo de arsenal…' : isError ? 'Arsenal: no se pudo verificar el catálogo.' : matches.length ? <>
      <strong>Registrado en catálogo:</strong> {matches.map(med => [med.name, med.presentation, med.dose_value && `${med.dose_value} ${med.dose_unit}`, med.restrictions].filter(Boolean).join(' · ')).join('; ')}. Stock no verificado.
    </> : 'Sin coincidencia exacta en el catálogo consultado; confirmar con Farmacia.'}
    {' '}<Link className="underline" to="/PrescripcionInteligente/arsenal">Consultar arsenal</Link>
  </span>;
}
