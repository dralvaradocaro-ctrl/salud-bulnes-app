/**
 * Calcula la VFG (Velocidad de Filtración Glomerular) usando la fórmula CKD-EPI
 * @param creatinina - Creatinina sérica en mg/dL
 * @param edad - Edad del paciente en años
 * @param sexo - Sexo del paciente ('masculino' o 'femenino')
 * @returns VFG calculada en mL/min/1.73 m²
 */
export function calcularVFG(
  creatinina: number,
  edad: number,
  sexo: 'masculino' | 'femenino' | ''
): number {
  if (creatinina <= 0 || edad <= 0 || !sexo) {
    return 0;
  }

  // Fórmula CKD-EPI 2021 (sin ajuste por raza)
  let kappa: number;
  let alpha: number;
  let sexFactor: number;

  if (sexo === 'femenino') {
    kappa = 0.7;
    alpha = -0.241;
    sexFactor = 1.012;
  } else {
    kappa = 0.9;
    alpha = -0.302;
    sexFactor = 1.0;
  }

  const minRatio = Math.min(creatinina / kappa, 1);
  const maxRatio = Math.max(creatinina / kappa, 1);

  const vfg = 142 * Math.pow(minRatio, alpha) * Math.pow(maxRatio, -1.200) * Math.pow(0.9938, edad) * sexFactor;

  return Math.round(vfg);
}
