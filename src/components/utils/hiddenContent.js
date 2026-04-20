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

export function isHiddenClinicalTool(tool) {
  return isHiddenCalculatorId(tool?.id) || isHiddenCalculatorName(tool?.name);
}
