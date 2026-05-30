const normalizeValue = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

export function isHiddenCalculatorId(id) {
  return normalizeValue(id) === 'insulin';
}

export function isHiddenCalculatorName(name) {
  const normalizedName = normalizeValue(name);

  return (
    normalizedName === 'correccion de insulina' ||
    normalizedName === 'correccion insulinica' ||
    (normalizedName.includes('correccion') && normalizedName.includes('insulin'))
  );
}

// El "Formulario de Constancia — Información al Paciente GES" vive como
// formulario (route FormularioGES), no como herramienta. Se oculta del tab
// Herramientas para evitar duplicar el acceso.
export function isHiddenGesConstanciaTool(name) {
  const normalizedName = normalizeValue(name);
  return normalizedName.includes('constancia') && normalizedName.includes('ges');
}

export function isHiddenClinicalTool(tool) {
  return (
    isHiddenCalculatorId(tool?.id) ||
    isHiddenCalculatorName(tool?.name) ||
    isHiddenGesConstanciaTool(tool?.name)
  );
}
