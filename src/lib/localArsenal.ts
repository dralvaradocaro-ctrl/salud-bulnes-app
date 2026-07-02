type MedicationLike = {
  name?: string | null;
  active_ingredient?: string | null;
  dose_value?: number | string | null;
  dose_unit?: string | null;
};

const normalize = (value: string | null | undefined): string =>
  (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

export const isLocallyAvailableMedication = (medication: MedicationLike): boolean => {
  const name = normalize(medication.name);
  const activeIngredient = normalize(medication.active_ingredient);
  const doseValue = Number(medication.dose_value);
  const doseUnit = normalize(medication.dose_unit);

  if ((name === 'amlodipino' || activeIngredient === 'amlodipino') && doseValue === 5 && doseUnit === 'mg') {
    return false;
  }

  return true;
};

export const filterLocallyAvailableMedications = <T extends MedicationLike>(medications: T[] | null | undefined): T[] =>
  (medications || []).filter(isLocallyAvailableMedication);
