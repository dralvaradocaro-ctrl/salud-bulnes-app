import InflammatoryCurve from '@/components/visita-proa/InflammatoryCurve';

const DAY_MS = 86400000;
const text = value => String(value ?? '').trim();
const date = value => {
  const match = text(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : text(value) || '—';
};
const days = (start, end) => {
  if (!start) return null;
  const from = new Date(`${String(start).slice(0, 10)}T00:00:00`);
  const until = end ? new Date(`${String(end).slice(0, 10)}T00:00:00`) : new Date(new Date().setHours(0, 0, 0, 0));
  if (Number.isNaN(from.getTime()) || Number.isNaN(until.getTime()) || until < from) return null;
  return Math.floor((until - from) / DAY_MS) + 1;
};
const isSuspended = item => /suspend|finaliz|terminad/i.test(`${item?.estado || ''} ${item?.status || ''}`) || Boolean(item?.termino && item?.termino_manual !== false);
const dose = item => {
  const amount = item.dosis_final_cantidad || item.dosis_cantidad || item.dosis || '';
  const unit = item.dosis_final_unidad || item.dosis_unidad || '';
  const frequency = item.intervalo_horas ? `c/${item.intervalo_horas} h` : '';
  return [amount && `${amount} ${unit}`.trim(), frequency, item.via].filter(Boolean).join(' · ') || '—';
};
const microbiology = form => (form.estudios_micro || form.cultivos || []).filter(item => item.tipo_muestra || item.patogeno).map(item => ({
  fecha: item.fecha,
  muestra: item.tipo_muestra,
  resultado: item.estado_resultado === 'negativo' ? 'Negativo / sin desarrollo' : item.estado_resultado === 'pendiente' ? 'Pendiente' : item.patogeno || item.sensibilidad || '—',
  resistencia: Array.isArray(item.resistente) && item.resistente.length ? item.resistente.join(', ') : text(item.antibiograma),
}));
const labs = form => (form.parametros_inflamatorios || form.examenes_sangre || []).filter(item => item.fecha || Object.values(item).some(Boolean)).map(item => ({
  ...item,
  leucocitos: item.leucocitos || item.blancos || item.gb || '',
  crea: item.crea || item.creatinina || '',
}));
const studies = form => [form.estudios_imagen, ...(form.examenes_complementarios || []).map(item => [date(item.fecha), item.nombre, item.resultado].filter(value => value && value !== '—').join(' · '))].filter(Boolean).join('\n');

function Block({ title, children }) {
  return <section className="proa-document-block"><h2>{title}</h2>{children}</section>;
}

export default function ProaEvolutionDocument({ form = {}, bed, professional }) {
  const antibiotics = (form.antibioticos || []).filter(item => text(item.nombre));
  const current = antibiotics.filter(item => !isSuspended(item));
  const previous = antibiotics.filter(isSuspended);
  const labRows = labs(form);
  const cultures = microbiology(form);
  const diagnosis = form.diagnostico_actual || form.diagnostico || form.diagnosticoPrincipal;
  const patient = form.paciente || form.nombre;
  const room = form.cama || bed?.cell;
  const service = form.servicio || bed?.serviceShort;
  const plan = form.plan_duracion || form.planesPendientes;
  return <article className="proa-evolution-document">
    <style>{`
      .proa-evolution-document{box-sizing:border-box;width:100%;min-height:277mm;background:#fff;color:#111;padding:12mm;font-family:Arial,Helvetica,sans-serif;font-size:10pt;line-height:1.35}
      .proa-document-header{display:grid;grid-template-columns:auto 1fr auto;gap:12pt;align-items:start;border-bottom:1.5pt solid #111;padding-bottom:6pt;margin-bottom:8pt}.proa-document-header p{margin:0}.proa-document-title{text-align:center;font-size:15pt;font-weight:800;margin:8pt 0 10pt}.proa-document-meta{display:grid;grid-template-columns:2fr 1fr 1fr;gap:5pt 12pt;margin-bottom:8pt}.proa-document-meta p{margin:0}.proa-document-block{break-inside:avoid;margin:0 0 9pt}.proa-document-block h2{font-size:10pt;text-transform:uppercase;letter-spacing:.35pt;border-bottom:.75pt solid #222;margin:0 0 4pt;padding-bottom:2pt}.proa-document-text{white-space:pre-wrap;margin:0;min-height:12pt}.proa-document-table{width:100%;border-collapse:collapse;font-size:9pt}.proa-document-table th,.proa-document-table td{border:.6pt solid #94a3b8;padding:4pt;text-align:left;vertical-align:top}.proa-document-table th{background:#e6f4f1;font-weight:700}.proa-status{display:inline-block;border-radius:999px;padding:1pt 5pt;font-size:8pt;font-weight:800}.proa-current{background:#d1fae5;color:#065f46}.proa-stopped{background:#fee2e2;color:#991b1b}.proa-signature{width:68mm;margin:22mm 0 0 auto;text-align:center;border-top:.75pt solid #111;padding-top:3pt}.proa-signature p{margin:0}.proa-chart{break-inside:avoid;page-break-inside:avoid}.proa-empty{color:#64748b;font-style:italic}@page{size:A4 portrait;margin:10mm}@media print{.proa-evolution-document{min-height:0;padding:0}.proa-document-block,.proa-chart{break-inside:avoid;page-break-inside:avoid}}
    `}</style>
    <header className="proa-document-header"><img src="/logo-hospital.png" alt="Hospital Comunitario de Salud Familiar de Bulnes" style={{ height: 42, width: 'auto' }} /><div><p>Hospital Comunitario de Salud Familiar de Bulnes</p><p>Servicio de Salud Ñuble</p><p><strong>Programa de Optimización del Uso de Antimicrobianos (PROA)</strong></p></div><p><strong>{date(form.fecha || form.savedAt || new Date().toISOString())}</strong>{form.hora ? <><br />{form.hora}</> : null}</p></header>
    <h1 className="proa-document-title">EVOLUCIÓN CLÍNICA PROA</h1>
    <div className="proa-document-meta"><p><strong>Paciente:</strong> {patient || '—'}</p><p><strong>RUT:</strong> {form.rut || '—'}</p><p><strong>Edad:</strong> {form.edad ? `${form.edad} años` : '—'}</p><p><strong>Servicio / cama:</strong> {[service, room].filter(Boolean).join(' · ') || '—'}</p><p><strong>Ingreso:</strong> {date(form.fecha_ingreso)}</p><p><strong>Aislamiento:</strong> {form.aislamiento || '—'}</p></div>
    <Block title="Diagnósticos"><p className="proa-document-text">{diagnosis || '—'}</p></Block>
    <Block title="Resumen clínico"><p className="proa-document-text">{form.resumen_caso || '—'}</p></Block>
    <Block title="Evolución actual"><p className="proa-document-text">{form.evolucion || form.ultimaEvolucion || '—'}</p></Block>
    <Block title="Exámenes de sangre"><table className="proa-document-table"><thead><tr><th>Fecha</th><th>PCR</th><th>PCT</th><th>Leucocitos</th><th>Creatinina</th></tr></thead><tbody>{labRows.length ? labRows.map((item, index) => <tr key={index}><td>{date(item.fecha)}</td><td>{item.pcr || '—'}</td><td>{item.pct || '—'}</td><td>{item.leucocitos || '—'}</td><td>{item.crea || '—'}</td></tr>) : <tr><td colSpan="5" className="proa-empty">Sin exámenes registrados</td></tr>}</tbody></table></Block>
    {labRows.length > 0 && <Block title="Curva de exámenes"><div className="proa-chart"><InflammatoryCurve parametros={labRows} antibioticos={antibiotics} /></div></Block>}
    <Block title="Estudios complementarios"><p className="proa-document-text">{studies(form) || '—'}</p></Block>
    <Block title="Microbiología"><table className="proa-document-table"><thead><tr><th>Fecha</th><th>Muestra</th><th>Resultado</th><th>Resistencia</th></tr></thead><tbody>{cultures.length ? cultures.map((item, index) => <tr key={index}><td>{date(item.fecha)}</td><td>{item.muestra || '—'}</td><td>{item.resultado}</td><td>{item.resistencia || '—'}</td></tr>) : <tr><td colSpan="4" className="proa-empty">Sin estudios microbiológicos registrados</td></tr>}</tbody></table></Block>
    <Block title="Antibioterapia vigente"><table className="proa-document-table"><thead><tr><th>Antimicrobiano</th><th>Dosis / frecuencia / vía</th><th>Inicio</th><th>Estado / día</th></tr></thead><tbody>{current.length ? current.map((item, index) => { const duration = days(item.inicio); return <tr key={index}><td><strong>{item.nombre}</strong></td><td>{dose(item)}</td><td>{date(item.inicio)}</td><td><span className="proa-status proa-current">VIGENTE{duration ? ` · DÍA ${duration}` : ''}</span></td></tr>; }) : <tr><td colSpan="4" className="proa-empty">Sin antibioterapia vigente</td></tr>}</tbody></table></Block>
    {previous.length > 0 && <Block title="Antibioterapias previas / suspendidas"><table className="proa-document-table"><thead><tr><th>Antimicrobiano</th><th>Dosis / frecuencia / vía</th><th>Inicio</th><th>Término</th><th>Duración total</th></tr></thead><tbody>{previous.map((item, index) => { const duration = days(item.inicio, item.termino); return <tr key={index}><td><strong>{item.nombre}</strong><br /><span className="proa-status proa-stopped">SUSPENDIDO</span></td><td>{dose(item)}</td><td>{date(item.inicio)}</td><td>{date(item.termino)}</td><td>{duration ? `${duration} ${duration === 1 ? 'día' : 'días'}` : '—'}</td></tr>; })}</tbody></table></Block>}
    <Block title="Plan sugerido"><p className="proa-document-text">{plan || '—'}</p></Block>
    <div className="proa-signature"><p><strong>{professional || form.medico_firma || 'Firma y timbre del profesional'}</strong></p><p>Equipo PROA · Hospital de Bulnes</p></div>
  </article>;
}
