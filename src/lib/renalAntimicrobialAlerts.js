const UCSF_SOURCE = 'UCSF IDMP, dosificación antimicrobiana adulta sin diálisis';

const rule = (threshold, advice) => ({ threshold, advice, source: UCSF_SOURCE });

const RENAL_RULES = {
  'Amikacina': rule(59, (vfg) => vfg <= 20
    ? 'Evitar esquema de intervalo extendido; usar dosificación convencional individualizada, niveles plasmáticos y apoyo de Farmacia/PROA.'
    : vfg <= 39 ? 'Referencia orientativa: 15 mg/kg EV cada 48 h; monitorizar niveles.' : 'Referencia orientativa: 15 mg/kg EV cada 36 h; monitorizar niveles.'),
  'Gentamicina': rule(59, (vfg) => vfg <= 20
    ? 'Evitar esquema de intervalo extendido; usar dosificación convencional individualizada y niveles plasmáticos.'
    : vfg <= 39 ? 'Referencia orientativa: 7 mg/kg EV cada 48 h; monitorizar niveles.' : 'Referencia orientativa: 7 mg/kg EV cada 36 h; monitorizar niveles.'),
  'Vancomicina': rule(59, () => 'Individualizar dosis e intervalo con monitorización AUC/niveles; solicitar apoyo de Farmacia/PROA. No usar una pauta fija basada solo en VFG.'),
  'Amoxicilina': rule(30, (vfg) => vfg < 10 ? 'Infección grave: referencia orientativa 500 mg VO cada 12 h.' : 'Infección grave: referencia orientativa 1 g VO cada 12 h.'),
  'Amoxicilina + ácido clavulánico': rule(30, (vfg) => vfg < 10 ? 'Evitar presentación 875/125 mg; referencia orientativa 500/125 mg VO cada 24 h.' : 'Evitar presentación 875/125 mg; referencia orientativa 500/125 mg VO cada 12 h.'),
  'Ampicilina': rule(50, (vfg) => vfg < 15
    ? 'Otras infecciones: 2 g EV cada 12 h; ITU/indicaciones obstétricas: 2 g cada 24 h.'
    : vfg < 30 ? 'Otras infecciones: 2 g EV cada 8 h; ITU/indicaciones obstétricas: 2 g cada 12 h.' : 'Otras infecciones: 2 g EV cada 6 h; ITU/indicaciones obstétricas: 2 g cada 8 h.'),
  'Ampicilina + sulbactam': rule(30, (vfg) => vfg < 15 ? 'Pauta estándar orientativa: 3 g EV cada 24 h.' : 'Pauta estándar orientativa: 3 g EV cada 12 h.'),
  'Cefazolina': rule(30, (vfg) => vfg < 10
    ? 'Referencia orientativa: 1 g EV cada 24 h.'
    : 'Referencia orientativa: 1 g cada 12 h (infección GP no complicada) o 2 g cada 12 h (infección complicada/GN).'),
  'Cefuroxima': rule(30, () => 'Requiere revisar reducción de dosis o prolongación del intervalo según función renal y ficha técnica local.'),
  'Cefotaxima': rule(30, () => 'Requiere revisar reducción de dosis o prolongación del intervalo según función renal, gravedad y sitio de infección.'),
  'Ceftazidima': rule(50, (vfg) => vfg < 15 ? 'Referencia orientativa: 1 g EV cada 24 h.' : vfg <= 30 ? 'Referencia orientativa: 2 g EV cada 24 h.' : 'Referencia orientativa: 2 g EV cada 12 h.'),
  'Cefepime': rule(60, (vfg) => vfg < 10
    ? 'No grave: 500 mg EV cada 24 h; grave/Pseudomonas/meningitis: 1 g cada 24 h.'
    : vfg < 30 ? 'No grave: 1 g EV cada 24 h; grave/Pseudomonas/meningitis: 2 g cada 24 h.' : 'No grave: 2 g EV cada 24 h; grave/Pseudomonas/meningitis: 2 g cada 12 h. Vigilar neurotoxicidad.'),
  'Ertapenem': rule(30, () => 'Referencia orientativa: 500 mg EV cada 24 h.'),
  'Imipenem + cilastatina': rule(70, () => 'Requiere reducción escalonada según VFG/CrCl, dosis basal y peso; confirmar tabla del producto por riesgo de neurotoxicidad/convulsiones.'),
  'Meropenem': rule(50, (vfg) => vfg < 10
    ? 'Estándar: 500 mg EV cada 24 h; meningitis/FQ: 1 g cada 24 h.'
    : vfg <= 25 ? 'Estándar: 500 mg EV cada 12 h; meningitis/FQ: 1 g cada 12 h.' : 'Estándar: 1 g EV cada 12 h; meningitis/FQ: 2 g cada 12 h.'),
  'Piperacilina + tazobactam': rule(40, (vfg) => vfg < 20
    ? 'Infusión corta, no neumonía nosocomial: 2,25 g EV cada 8 h; neumonía nosocomial: 2,25 g cada 6 h.'
    : 'Infusión corta, no neumonía nosocomial: 2,25 g EV cada 6 h; neumonía nosocomial: 3,375 g cada 6 h.'),
  'Ciprofloxacino': rule(29, () => 'Pauta estándar orientativa: 400 mg EV cada 24 h o 500 mg VO cada 24 h.'),
  'Levofloxacino': rule(49, (vfg) => vfg < 20
    ? 'ITU: 500 mg inicial y luego 250 mg cada 48 h; otras indicaciones: 750 mg inicial y luego 500 mg cada 48 h.'
    : 'ITU: 500 mg inicial y luego 250 mg cada 24 h; otras indicaciones: 750 mg cada 48 h.'),
  'Cotrimoxazol (TMP/SMX)': rule(30, () => 'Requiere ajuste por función renal y según indicación/dosis de TMP; confirmar con Farmacia/PROA y vigilar potasio.'),
  'Claritromicina': rule(30, () => 'Reducir aproximadamente 50% la dosis diaria y revisar interacciones/QT.'),
  'Daptomicina': rule(30, () => 'Referencia habitual: mantener dosis por kg y prolongar intervalo a cada 48 h; confirmar según indicación y monitorizar CPK.'),
  'Nitrofurantoína': rule(30, () => 'Evitar con VFG/CrCl <30 mL/min; además, no usar para pielonefritis o infección sistémica.'),
  'Fluconazol': rule(50, (vfg) => vfg < 10 ? 'Tras dosis de carga, usar 25% de la dosis objetivo cada 24 h.' : 'Tras dosis de carga, usar 50% de la dosis objetivo cada 24 h.'),
  'Colistina': rule(80, () => 'La dosis de mantenimiento debe individualizarse por función renal y peso; usar protocolo específico y apoyo de Farmacia/PROA por alto riesgo de nefro/neurotoxicidad.'),
  'Penicilina G sódica': rule(15, () => 'En deterioro renal grave se requiere reducir dosis o prolongar intervalo según indicación; confirmar ficha técnica y carga de sodio.'),
  'Aciclovir': rule(50, () => 'Requiere ajuste de intervalo según función renal; asegurar hidratación y confirmar pauta según indicación y vía.'),
  'Oseltamivir': rule(60, () => 'Requiere ajuste según función renal y objetivo (tratamiento o profilaxis); confirmar pauta específica.'),
};

export function getRenalAntimicrobialAlert(name, estimatedGfr) {
  const vfg = Number(estimatedGfr);
  const renalRule = RENAL_RULES[name];
  if (!renalRule || !Number.isFinite(vfg) || vfg <= 0 || vfg > renalRule.threshold) return null;
  return {
    antimicrobial: name,
    vfg,
    advice: renalRule.advice(vfg),
    source: renalRule.source,
  };
}

export function getRenalAntimicrobialAlerts(antibiotics, estimatedGfr) {
  return (antibiotics || [])
    .filter((item) => item?.nombre && !item?.termino)
    .map((item) => getRenalAntimicrobialAlert(item.nombre, estimatedGfr))
    .filter(Boolean);
}
