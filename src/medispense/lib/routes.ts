const BASE = '/PrescripcionInteligente';

export const routes = {
  base: BASE,
  index: () => BASE,
  auth: () => `${BASE}/auth`,
  dashboard: () => `${BASE}/dashboard`,
  arsenal: () => `${BASE}/arsenal`,
  education: () => `${BASE}/education`,
  educationView: (pageId: string) => `${BASE}/educacion/${pageId}`,
  adminUsers: () => `${BASE}/admin/users`,
  newPatient: () => `${BASE}/patients/new`,
  patient: (code: string) => `${BASE}/patients/${code}`,
  newPrescription: (code: string) => `${BASE}/patients/${code}/prescription/new`,
  editPrescription: (code: string, prescriptionId: string) =>
    `${BASE}/patients/${code}/prescription/new?edit=${prescriptionId}`,
  renewPrescription: (code: string, prescriptionId: string) =>
    `${BASE}/patients/${code}/prescription/new?renew=${prescriptionId}`,
  portal: (code: string) => `${BASE}/portal/${code}`,
};
