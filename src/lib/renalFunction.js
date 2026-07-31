export function calculateEgfrCkdEpi2021({ creatinine, age, edad, sex, sexo }) {
  const scr = Number(String(creatinine ?? '').replace(',', '.'));
  const years = Number(age ?? edad);
  const normalizedSex = String(sex || sexo || '').toLowerCase();
  if (!Number.isFinite(scr) || scr <= 0 || !Number.isFinite(years) || years < 18) return null;
  if (!['femenino', 'masculino'].includes(normalizedSex)) return null;

  const female = normalizedSex === 'femenino';
  const kappa = female ? 0.7 : 0.9;
  const alpha = female ? -0.241 : -0.302;
  const ratio = scr / kappa;
  const egfr = 142
    * Math.min(ratio, 1) ** alpha
    * Math.max(ratio, 1) ** -1.2
    * 0.9938 ** years
    * (female ? 1.012 : 1);
  return Math.round(egfr);
}

export function buildRenalFunctionText({ creatinine, age, edad, sex, sexo }) {
  const normalizedCreatinine = String(creatinine ?? '').trim().replace(',', '.');
  if (!normalizedCreatinine) return '';
  const patientAge = age ?? edad;
  const egfr = calculateEgfrCkdEpi2021({ creatinine: normalizedCreatinine, age: patientAge, sex: sex || sexo });
  if (egfr == null) {
    return Number(patientAge) < 18
      ? `Creatinina ${normalizedCreatinine} mg/dL · VFG no calculada (requiere fórmula pediátrica)`
      : `Creatinina ${normalizedCreatinine} mg/dL · VFG pendiente (completar edad y sexo)`;
  }
  return `Creatinina ${normalizedCreatinine} mg/dL · VFG estimada ${egfr} mL/min/1,73 m² (CKD-EPI 2021)`;
}
