export const HOSPITAL_LAB_GROUPS = [
  { name: 'Inflamación y signos vitales', fields: [
    ['pcr', 'PCR', 'mg/L'], ['pct', 'Procalcitonina', 'ng/mL'], ['vhs', 'VHS', 'mm/h'], ['temp', 'Temperatura', '°C'],
  ] },
  { name: 'Hemograma', fields: [
    ['hb', 'Hemoglobina', 'g/dL'], ['hto', 'Hematocrito', '%'], ['blancos', 'Leucocitos', '/mm³'], ['neutrofilos', 'Neutrófilos', '%'], ['linfocitos', 'Linfocitos', '%'], ['plaq', 'Plaquetas', '/mm³'],
  ] },
  { name: 'Función renal', fields: [
    ['crea', 'Creatinina', 'mg/dL'], ['urea', 'Urea', 'mg/dL'], ['bun', 'BUN', 'mg/dL'], ['vfg', 'VFG estimada', 'mL/min/1,73 m²'],
  ] },
  { name: 'Electrolitos y metabolismo', fields: [
    ['na', 'Sodio', 'mEq/L'], ['k', 'Potasio', 'mEq/L'], ['cl', 'Cloro', 'mEq/L'], ['calcio', 'Calcio', 'mg/dL'], ['magnesio', 'Magnesio', 'mg/dL'], ['fosforo', 'Fósforo', 'mg/dL'], ['glucosa', 'Glucosa', 'mg/dL'],
  ] },
  { name: 'Función hepática', fields: [
    ['ast', 'AST / GOT', 'U/L'], ['alt', 'ALT / GPT', 'U/L'], ['fa', 'Fosfatasa alcalina', 'U/L'], ['ggt', 'GGT', 'U/L'], ['bt', 'Bilirrubina total', 'mg/dL'], ['bd', 'Bilirrubina directa', 'mg/dL'], ['alb', 'Albúmina', 'g/dL'], ['proteinas', 'Proteínas totales', 'g/dL'],
  ] },
  { name: 'Coagulación', fields: [
    ['tp', 'Tiempo de protrombina', 's'], ['inr', 'INR', ''], ['ttpa', 'TTPa', 's'],
  ] },
  { name: 'Perfil lipídico', fields: [
    ['col_total', 'Colesterol total', 'mg/dL'], ['ldl', 'LDL', 'mg/dL'], ['hdl', 'HDL', 'mg/dL'], ['trigliceridos', 'Triglicéridos', 'mg/dL'],
  ] },
];

export const HOSPITAL_LAB_FIELDS = HOSPITAL_LAB_GROUPS.flatMap(group => group.fields);

export const LAB_FIELD_BY_EXAM = {
  leu: 'blancos', leucocitos: 'blancos', blancos: 'blancos', gb: 'blancos', wbc: 'blancos', neut: 'neutrofilos', linf: 'linfocitos',
  egfr: 'vfg', prot_total: 'proteinas', colesterol_total: 'col_total', tg: 'trigliceridos',
  ...Object.fromEntries(HOSPITAL_LAB_FIELDS.map(([key]) => [key, key])),
};

export const emptyHospitalLabRow = (date = new Date().toISOString().slice(0, 10)) => ({
  fecha: date,
  ...Object.fromEntries(HOSPITAL_LAB_FIELDS.map(([key]) => [key, ''])),
});
