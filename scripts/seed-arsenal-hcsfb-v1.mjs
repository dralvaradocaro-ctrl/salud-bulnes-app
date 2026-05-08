/**
 * Pobla la tabla `medications` de medispense con el arsenal farmacológico
 * básico HCSF según Resolución Exenta N°5235 (25 oct 2023, Servicio de
 * Salud Ñuble).
 *
 * Schema: name | active_ingredient | presentation | dose_value | dose_unit
 *
 * Uso:  node scripts/seed-arsenal-hcsfb-v1.mjs
 *       node scripts/seed-arsenal-hcsfb-v1.mjs --apply
 */
import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL     || 'https://gcuevpxondfepbowvyqa.supabase.co',
  process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_eCS95aS_Aw3SAJnoZvLO1g_erOAjCkh'
);

// Helper: { name, presentation, dose_value, dose_unit, category? }
const m = (name, presentation, dose_value, dose_unit, category, active_ingredient) => ({
  name,
  active_ingredient: active_ingredient || name,
  presentation,
  dose_value,
  dose_unit,
  category: category || null,
  is_active: true,
});

const MEDICATIONS = [
  // Anticoagulantes
  m('Acenocumarol', 'Comprimido', 4, 'mg', 'Anticoagulante'),
  m('Warfarina', 'Comprimido', 5, 'mg', 'Anticoagulante'),
  m('Heparina sódica', 'Solución inyectable', 5000, 'UI/mL', 'Anticoagulante'),
  m('Enoxaparina', 'Solución inyectable', 40, 'mg', 'Anticoagulante'),
  m('Enoxaparina', 'Solución inyectable', 80, 'mg', 'Anticoagulante'),
  m('Clopidogrel', 'Comprimido', 75, 'mg', 'Antiagregante'),
  m('Ácido acetilsalicílico', 'Comprimido', 100, 'mg', 'Antiagregante'),
  m('Ácido acetilsalicílico', 'Comprimido', 500, 'mg', 'Analgésico'),

  // Diuréticos
  m('Acetazolamida', 'Comprimido', 250, 'mg', 'Diurético'),
  m('Furosemida', 'Comprimido', 40, 'mg', 'Diurético'),
  m('Furosemida', 'Solución inyectable', 20, 'mg/mL', 'Diurético'),
  m('Hidroclorotiazida', 'Comprimido', 50, 'mg', 'Diurético'),
  m('Espironolactona', 'Comprimido', 25, 'mg', 'Diurético'),

  // Antivirales
  m('Aciclovir', 'Comprimido', 200, 'mg', 'Antiviral'),
  m('Aciclovir', 'Comprimido', 400, 'mg', 'Antiviral'),
  m('Oseltamivir', 'Comprimido', 75, 'mg', 'Antiviral'),
  m('Oseltamivir', 'Suspensión oral', 12, 'mg/mL', 'Antiviral'),

  // Antibióticos
  m('Amikacina', 'Solución inyectable', 500, 'mg', 'Antibiótico'),
  m('Amoxicilina', 'Comprimido', 500, 'mg', 'Antibiótico'),
  m('Amoxicilina', 'Suspensión oral', 500, 'mg/5mL', 'Antibiótico'),
  m('Amoxicilina + Ácido clavulánico', 'Comprimido', 625, 'mg', 'Antibiótico'),
  m('Amoxicilina + Ácido clavulánico', 'Comprimido', 1000, 'mg', 'Antibiótico'),
  m('Amoxicilina + Ácido clavulánico', 'Suspensión oral', 457, 'mg/5mL', 'Antibiótico'),
  m('Ampicilina', 'Polvo para solución inyectable', 500, 'mg', 'Antibiótico'),
  m('Ampicilina + Sulbactam', 'Polvo para solución inyectable', 1500, 'mg', 'Antibiótico'),
  m('Azitromicina', 'Comprimido', 500, 'mg', 'Antibiótico'),
  m('Azitromicina', 'Suspensión oral', 200, 'mg/5mL', 'Antibiótico'),
  m('Azitromicina', 'Suspensión oral', 400, 'mg/5mL', 'Antibiótico'),
  m('Bencilpenicilina', 'Polvo para solución inyectable', 1000000, 'UI', 'Antibiótico'),
  m('Bencilpenicilina', 'Polvo para solución inyectable', 2000000, 'UI', 'Antibiótico'),
  m('Cefadroxilo', 'Comprimido', 500, 'mg', 'Antibiótico'),
  m('Cefadroxilo', 'Suspensión oral', 250, 'mg/5mL', 'Antibiótico'),
  m('Cefazolina', 'Polvo para solución inyectable', 1, 'g', 'Antibiótico'),
  m('Ceftazidima', 'Polvo para solución inyectable', 1, 'g', 'Antibiótico'),
  m('Ceftriaxona', 'Polvo para solución inyectable', 1, 'g', 'Antibiótico'),
  m('Ciprofloxacino', 'Comprimido', 500, 'mg', 'Antibiótico'),
  m('Claritromicina', 'Comprimido', 500, 'mg', 'Antibiótico'),
  m('Claritromicina', 'Suspensión oral', 250, 'mg/5mL', 'Antibiótico'),
  m('Clindamicina', 'Comprimido', 300, 'mg', 'Antibiótico'),
  m('Clindamicina', 'Solución inyectable', 600, 'mg', 'Antibiótico'),
  m('Cloxacilina', 'Comprimido', 500, 'mg', 'Antibiótico'),
  m('Cloxacilina', 'Polvo para solución inyectable', 500, 'mg', 'Antibiótico'),
  m('Cotrimoxazol', 'Comprimido', 960, 'mg', 'Antibiótico', 'Sulfametoxazol + Trimetoprim'),
  m('Cotrimoxazol', 'Solución inyectable', 480, 'mg', 'Antibiótico', 'Sulfametoxazol + Trimetoprim'),
  m('Doxiciclina', 'Comprimido', 100, 'mg', 'Antibiótico'),
  m('Estreptomicina', 'Polvo para solución inyectable', 1, 'g', 'Antibiótico'),
  m('Flucloxacilina', 'Jarabe', 250, 'mg/5mL', 'Antibiótico'),
  m('Gentamicina', 'Solución inyectable', 40, 'mg/mL', 'Antibiótico'),
  m('Imipenem + Cilastatina', 'Polvo para solución inyectable', 1000, 'mg', 'Antibiótico'),
  m('Levofloxacino', 'Comprimido', 500, 'mg', 'Antibiótico'),
  m('Meropenem', 'Polvo para solución inyectable', 500, 'mg', 'Antibiótico'),
  m('Metronidazol', 'Comprimido', 500, 'mg', 'Antibiótico'),
  m('Metronidazol', 'Solución inyectable', 500, 'mg', 'Antibiótico'),
  m('Nitrofurantoína', 'Cápsula', 100, 'mg', 'Antibiótico'),
  m('Penicilina G Benzatina', 'Polvo para solución inyectable', 1200000, 'UI', 'Antibiótico'),
  m('Piperacilina + Tazobactam', 'Polvo para solución inyectable', 4500, 'mg', 'Antibiótico'),
  m('Vancomicina', 'Polvo para solución inyectable', 500, 'mg', 'Antibiótico'),

  // Antifúngicos
  m('Fluconazol', 'Comprimido', 150, 'mg', 'Antifúngico'),
  m('Clotrimazol', 'Crema', 1, '%', 'Antifúngico'),
  m('Clotrimazol', 'Óvulo vaginal', 500, 'mg', 'Antifúngico'),
  m('Nistatina', 'Suspensión oral', 100000, 'UI/mL', 'Antifúngico'),
  m('Terbinafina', 'Comprimido', 250, 'mg', 'Antifúngico'),

  // TBC
  m('Isoniazida', 'Comprimido', 100, 'mg', 'Antituberculoso'),
  m('Etambutol', 'Comprimido', 400, 'mg', 'Antituberculoso'),
  m('Pirazinamida', 'Comprimido', 500, 'mg', 'Antituberculoso'),
  m('Rifampicina', 'Comprimido', 150, 'mg', 'Antituberculoso'),
  m('Rifampicina', 'Solución oral', 100, 'mg/5mL', 'Antituberculoso'),
  m('Rifapentina', 'Comprimido', 150, 'mg', 'Antituberculoso'),

  // VIH
  m('Darunavir', 'Comprimido', 800, 'mg', 'Antirretroviral'),
  m('Lamivudina', 'Solución oral', 50, 'mg/5mL', 'Antirretroviral'),
  m('Raltegravir', 'Comprimido', 400, 'mg', 'Antirretroviral'),
  m('Ritonavir', 'Comprimido', 100, 'mg', 'Antirretroviral'),
  m('Tenofovir + Emtricitabina', 'Comprimido', 500, 'mg', 'Antirretroviral'),
  m('Tenofovir + Lamivudina + Dolutegravir', 'Comprimido', 650, 'mg', 'Antirretroviral'),
  m('Zidovudina', 'Solución oral', 50, 'mg/5mL', 'Antirretroviral'),
  m('Zidovudina', 'Comprimido', 300, 'mg', 'Antirretroviral'),

  // Antiparasitarios
  m('Albendazol', 'Comprimido', 200, 'mg', 'Antiparasitario'),
  m('Albendazol', 'Suspensión oral', 200, 'mg/5mL', 'Antiparasitario'),
  m('Permetrina', 'Shampoo', 1, '%', 'Antiparasitario'),
  m('Deltametrina + Piperonil butóxido', 'Loción', 12.5, '%', 'Antiparasitario'),

  // Folato y vitaminas
  m('Ácido fólico', 'Comprimido', 1, 'mg', 'Suplemento'),
  m('Ácido fólico', 'Comprimido', 5, 'mg', 'Suplemento'),
  m('Cianocobalamina', 'Solución inyectable', 0.1, 'mg/mL', 'Suplemento'),
  m('Tiamina (Vitamina B1)', 'Solución inyectable', 30, 'mg/mL', 'Suplemento'),
  m('Piridoxina (Vitamina B6)', 'Comprimido', 50, 'mg', 'Suplemento'),
  m('Piridoxina', 'Solución inyectable', 100, 'mg/mL', 'Suplemento'),
  m('Fitomenadiona (Vitamina K)', 'Solución inyectable', 1, 'mg/mL', 'Suplemento'),
  m('Fitomenadiona', 'Solución inyectable', 10, 'mg/mL', 'Suplemento'),
  m('Calcio carbonato', 'Comprimido', 500, 'mg', 'Suplemento'),
  m('Calcio + Vitamina D Forte', 'Comprimido', 625, 'mg', 'Suplemento'),
  m('Vitaminas A-C-D', 'Solución oral gotas', 1, 'gota', 'Suplemento'),
  m('Zinc', 'Solución oral', 5, 'mg/mL', 'Suplemento'),
  m('Hierro sulfato', 'Comprimido', 200, 'mg', 'Suplemento'),
  m('Hierro bis-glicinato', 'Solución oral gotas', 6, 'mg/mL', 'Suplemento'),
  m('Hierro sacarato', 'Solución inyectable', 100, 'mg/5mL', 'Suplemento'),
  m('Melatonina', 'Comprimido', 3, 'mg', 'Hipnótico'),

  // AINEs y analgésicos
  m('Paracetamol', 'Comprimido', 500, 'mg', 'Analgésico'),
  m('Paracetamol', 'Comprimido', 160, 'mg', 'Analgésico'),
  m('Paracetamol', 'Solución inyectable', 10, 'mg/mL', 'Analgésico'),
  m('Paracetamol', 'Solución oral gotas', 100, 'mg/mL', 'Analgésico'),
  m('Paracetamol', 'Jarabe', 125, 'mg/5mL', 'Analgésico'),
  m('Metamizol (Dipirona)', 'Comprimido', 300, 'mg', 'Analgésico'),
  m('Metamizol', 'Solución inyectable', 500, 'mg/mL', 'Analgésico'),
  m('Metamizol', 'Supositorio', 250, 'mg', 'Analgésico'),
  m('Ácido mefenámico', 'Comprimido', 500, 'mg', 'AINE'),
  m('Diclofenaco', 'Comprimido', 50, 'mg', 'AINE'),
  m('Diclofenaco', 'Solución inyectable', 25, 'mg/mL', 'AINE'),
  m('Diclofenaco', 'Supositorio infantil', 12.5, 'mg', 'AINE'),
  m('Ibuprofeno', 'Comprimido', 400, 'mg', 'AINE'),
  m('Ibuprofeno', 'Suspensión oral', 200, 'mg/5mL', 'AINE'),
  m('Ketoprofeno', 'Comprimido', 50, 'mg', 'AINE'),
  m('Ketorolaco', 'Comprimido', 10, 'mg', 'AINE'),
  m('Ketorolaco', 'Comprimido', 30, 'mg', 'AINE'),
  m('Ketorolaco', 'Solución inyectable', 30, 'mg/mL', 'AINE'),
  m('Naproxeno', 'Comprimido', 550, 'mg', 'AINE'),
  m('Celecoxib', 'Comprimido', 200, 'mg', 'AINE'),
  m('Meloxicam', 'Comprimido', 15, 'mg', 'AINE'),
  m('Indometacina', 'Comprimido', 25, 'mg', 'AINE'),
  m('Clonixinato de lisina', 'Comprimido', 125, 'mg', 'Analgésico'),
  m('Pargeverina', 'Solución inyectable', 5, 'mg/mL', 'Antiespasmódico'),
  m('Papaverina + Atropina', 'Comprimido', 40, 'mg', 'Antiespasmódico'),
  m('Propifenazona + Adifenina', 'Supositorio', 490, 'mg', 'Analgésico'),
  m('Butilbromuro de hioscina (Buscapina)', 'Solución inyectable', 20, 'mg/mL', 'Antiespasmódico', 'N-butilbromuro de hioscina'),

  // Opioides
  m('Tramadol', 'Comprimido', 50, 'mg', 'Opioide'),
  m('Tramadol', 'Solución oral gotas', 100, 'mg/mL', 'Opioide'),
  m('Tramadol', 'Solución inyectable', 100, 'mg/mL', 'Opioide'),
  m('Morfina', 'Solución inyectable', 10, 'mg/mL', 'Opioide'),
  m('Morfina', 'Solución inyectable', 20, 'mg/mL', 'Opioide'),
  m('Morfina', 'Solución oral gotas', 20, 'mg/mL', 'Opioide'),
  m('Oxicodona', 'Comprimido', 10, 'mg', 'Opioide'),
  m('Metadona', 'Comprimido', 10, 'mg', 'Opioide'),
  m('Fentanilo', 'Parche transdérmico', 25, 'µg/h', 'Opioide'),
  m('Fentanilo', 'Parche transdérmico', 50, 'µg/h', 'Opioide'),
  m('Fentanilo', 'Solución inyectable', 0.05, 'mg/mL', 'Opioide'),
  m('Buprenorfina', 'Parche transdérmico', 35, 'µg/h', 'Opioide'),
  m('Naloxona', 'Solución inyectable', 0.4, 'mg/mL', 'Antagonista opioide'),

  // Cardiovasculares
  m('Adenosina', 'Solución inyectable', 3, 'mg/mL', 'Antiarrítmico'),
  m('Amiodarona', 'Comprimido', 200, 'mg', 'Antiarrítmico'),
  m('Amiodarona', 'Solución inyectable', 50, 'mg/mL', 'Antiarrítmico'),
  m('Atenolol', 'Comprimido', 50, 'mg', 'Betabloqueador'),
  m('Bisoprolol', 'Comprimido', 2.5, 'mg', 'Betabloqueador'),
  m('Carvedilol', 'Comprimido', 6.25, 'mg', 'Betabloqueador'),
  m('Carvedilol', 'Comprimido', 12.5, 'mg', 'Betabloqueador'),
  m('Carvedilol', 'Comprimido', 25, 'mg', 'Betabloqueador'),
  m('Propanolol', 'Comprimido', 10, 'mg', 'Betabloqueador'),
  m('Propanolol', 'Comprimido', 40, 'mg', 'Betabloqueador'),
  m('Propanolol', 'Solución inyectable', 1, 'mg/mL', 'Betabloqueador'),
  m('Labetalol', 'Solución inyectable', 5, 'mg/mL', 'Antihipertensivo'),
  m('Amlodipino', 'Comprimido', 5, 'mg', 'Antihipertensivo'),
  m('Amlodipino', 'Comprimido', 10, 'mg', 'Antihipertensivo'),
  m('Captopril', 'Comprimido', 25, 'mg', 'IECA'),
  m('Enalapril', 'Comprimido', 10, 'mg', 'IECA'),
  m('Losartan', 'Comprimido', 50, 'mg', 'ARA-II', 'Losartán potásico'),
  m('Hidralazina', 'Comprimido', 50, 'mg', 'Antihipertensivo'),
  m('Metildopa', 'Comprimido', 250, 'mg', 'Antihipertensivo'),
  m('Nifedipino', 'Comprimido liberación prolongada', 20, 'mg', 'Antihipertensivo'),
  m('Diltiazem', 'Comprimido', 60, 'mg', 'Antihipertensivo'),
  m('Verapamilo', 'Solución inyectable', 5, 'mg/2mL', 'Antiarrítmico'),
  m('Doxazosina', 'Comprimido', 4, 'mg', 'Antihipertensivo'),
  m('Digoxina', 'Comprimido', 0.25, 'mg', 'Cardiotónico'),
  m('Nitroglicerina', 'Solución inyectable', 50, 'mg', 'Vasodilatador'),
  m('Norepinefrina', 'Solución inyectable', 1, 'mg/mL', 'Vasopresor'),
  m('Dopamina', 'Solución inyectable', 200, 'mg/5mL', 'Vasopresor'),
  m('Epinefrina (Adrenalina)', 'Solución inyectable', 1, 'mg/mL', 'Vasopresor'),
  m('Efedrina', 'Solución inyectable', 60, 'mg/mL', 'Vasopresor'),

  // Hipolipemiantes
  m('Atorvastatina', 'Comprimido', 20, 'mg', 'Hipolipemiante'),
  m('Atorvastatina', 'Comprimido', 40, 'mg', 'Hipolipemiante'),
  m('Gemfibrozilo', 'Comprimido', 600, 'mg', 'Hipolipemiante'),

  // Trombolíticos
  m('Tenecteplase', 'Polvo para solución inyectable', 10000, 'UI', 'Trombolítico'),
  m('Ácido tranexámico', 'Comprimido', 500, 'mg', 'Antifibrinolítico'),
  m('Ácido tranexámico', 'Solución inyectable', 1000, 'mg/10mL', 'Antifibrinolítico'),

  // Antidiabéticos
  m('Insulina humana cristalina', 'Solución inyectable', 100, 'UI/mL', 'Antidiabético'),
  m('Insulina humana isófana (NPH)', 'Suspensión inyectable', 100, 'UI/mL', 'Antidiabético'),
  m('Glibenclamida', 'Comprimido', 5, 'mg', 'Antidiabético'),
  m('Metformina', 'Comprimido', 500, 'mg', 'Antidiabético'),
  m('Metformina', 'Comprimido', 850, 'mg', 'Antidiabético'),
  m('Metformina', 'Comprimido liberación prolongada', 1000, 'mg', 'Antidiabético'),
  m('Vildagliptina', 'Comprimido', 50, 'mg', 'Antidiabético'),
  m('Dapagliflozina', 'Comprimido', 10, 'mg', 'Antidiabético'),

  // Tiroides
  m('Levotiroxina', 'Comprimido', 50, 'µg', 'Hormona tiroidea'),
  m('Levotiroxina', 'Comprimido', 100, 'µg', 'Hormona tiroidea'),

  // Antagonistas H2 / IBPs
  m('Omeprazol', 'Cápsula', 20, 'mg', 'IBP'),
  m('Omeprazol', 'Solución inyectable', 40, 'mg', 'IBP'),
  m('Ranitidina', 'Comprimido', 300, 'mg', 'Antiulceroso'),
  m('Ranitidina', 'Solución inyectable', 10, 'mg/mL', 'Antiulceroso'),
  m('Famotidina', 'Comprimido', 40, 'mg', 'Antiulceroso'),
  m('Aluminio hidróxido', 'Comprimido', 500, 'mg', 'Antiácido'),

  // Antieméticos / Procinéticos
  m('Domperidona', 'Comprimido', 10, 'mg', 'Procinético'),
  m('Domperidona', 'Solución oral gotas', 10, 'mg/mL', 'Procinético'),
  m('Domperidona', 'Solución inyectable', 5, 'mg/mL', 'Procinético'),
  m('Domperidona', 'Supositorio', 60, 'mg', 'Procinético'),
  m('Metoclopramida', 'Comprimido', 10, 'mg', 'Antiemético'),
  m('Metoclopramida', 'Solución inyectable', 5, 'mg/mL', 'Antiemético'),
  m('Ondansetrón', 'Comprimido', 4, 'mg', 'Antiemético'),
  m('Ondansetrón', 'Comprimido', 8, 'mg', 'Antiemético'),
  m('Ondansetrón', 'Solución inyectable', 2, 'mg/mL', 'Antiemético'),
  m('Doxilamina + Piridoxina', 'Comprimido', 20, 'mg', 'Antiemético'),

  // Laxantes
  m('Lactulosa', 'Solución oral', 65, '%', 'Laxante'),
  m('Polietilenglicol (PEG)', 'Polvo', 17, 'g/sobre', 'Laxante'),
  m('Picosulfato de sodio', 'Cápsula', 2.5, 'mg', 'Laxante'),
  m('Picosulfato de sodio', 'Solución oral gotas', 7.5, 'mg/mL', 'Laxante'),
  m('Glicerina', 'Supositorio', 2.5, 'g', 'Laxante'),

  // Antidiarreicos
  m('Loperamida', 'Comprimido', 2, 'mg', 'Antidiarreico'),
  m('Carbón activado', 'Polvo', 50, 'g', 'Antídoto'),
  m('Lactobacillus rhamnosus', 'Cápsula', 75, 'mg', 'Probiótico'),

  // Broncodilatadores y corticoides inhalados
  m('Salbutamol', 'Inhalador', 100, 'µg/dosis', 'Broncodilatador'),
  m('Salbutamol', 'Solución para nebulización', 5, 'mg/mL', 'Broncodilatador'),
  m('Ipratropio', 'Inhalador', 0.02, 'mg/dosis', 'Broncodilatador'),
  m('Ipratropio', 'Solución para nebulización', 0.25, 'mg/mL', 'Broncodilatador'),
  m('Budesonida', 'Inhalador', 200, 'µg/dosis', 'Corticoide inhalado'),
  m('Fluticasona + Salmeterol', 'Inhalador', 125, 'µg/dosis', 'Combinación inhalada'),
  m('Fluticasona + Salmeterol', 'Inhalador', 250, 'µg/dosis', 'Combinación inhalada'),
  m('Salmeterol', 'Inhalador', 25, 'µg/dosis', 'Broncodilatador'),
  m('Mometasona furoato', 'Suspensión nasal', 50, 'µg/dosis', 'Corticoide nasal'),

  // Corticoides
  m('Dexametasona', 'Comprimido', 4, 'mg', 'Corticoide'),
  m('Dexametasona', 'Solución inyectable', 4, 'mg/mL', 'Corticoide'),
  m('Betametasona dipropionato', 'Crema', 0.05, '%', 'Corticoide tópico'),
  m('Betametasona fosfato', 'Solución inyectable', 4, 'mg/mL', 'Corticoide'),
  m('Prednisona', 'Comprimido', 5, 'mg', 'Corticoide'),
  m('Prednisona', 'Comprimido', 20, 'mg', 'Corticoide'),
  m('Prednisona', 'Suspensión oral', 20, 'mg/5mL', 'Corticoide'),
  m('Hidrocortisona acetato', 'Crema', 1, '%', 'Corticoide tópico'),
  m('Hidrocortisona succinato', 'Polvo para solución inyectable', 100, 'mg', 'Corticoide'),
  m('Hidrocortisona succinato', 'Polvo para solución inyectable', 500, 'mg', 'Corticoide'),
  m('Clobetasol', 'Crema', 0.05, '%', 'Corticoide tópico'),

  // Antihistamínicos
  m('Cetirizina', 'Comprimido', 10, 'mg', 'Antihistamínico'),
  m('Levocetirizina', 'Jarabe', 5, 'mg/5mL', 'Antihistamínico'),
  m('Loratadina', 'Comprimido', 10, 'mg', 'Antihistamínico'),
  m('Loratadina', 'Jarabe', 5, 'mg/5mL', 'Antihistamínico'),
  m('Desloratadina', 'Comprimido', 5, 'mg', 'Antihistamínico'),
  m('Clorfenamina', 'Comprimido', 4, 'mg', 'Antihistamínico'),
  m('Clorfenamina', 'Solución inyectable', 10, 'mg/mL', 'Antihistamínico'),

  // Salud Mental
  m('Alprazolam', 'Comprimido', 0.5, 'mg', 'Ansiolítico'),
  m('Clonazepam', 'Comprimido', 0.5, 'mg', 'Ansiolítico'),
  m('Clonazepam', 'Comprimido', 2, 'mg', 'Ansiolítico'),
  m('Clotiazepam', 'Comprimido', 10, 'mg', 'Ansiolítico'),
  m('Diazepam', 'Comprimido', 10, 'mg', 'Ansiolítico'),
  m('Diazepam', 'Solución inyectable', 10, 'mg/mL', 'Ansiolítico'),
  m('Lorazepam', 'Comprimido', 2, 'mg', 'Ansiolítico'),
  m('Lorazepam', 'Comprimido sublingual', 2, 'mg', 'Ansiolítico'),
  m('Lorazepam', 'Solución inyectable', 4, 'mg/mL', 'Ansiolítico'),
  m('Midazolam', 'Solución inyectable', 5, 'mg/mL', 'Ansiolítico'),
  m('Eszopiclona', 'Comprimido', 3, 'mg', 'Hipnótico'),
  m('Zolpidem', 'Comprimido', 10, 'mg', 'Hipnótico'),
  m('Trazodona', 'Comprimido', 25, 'mg', 'Antidepresivo'),
  m('Trazodona', 'Comprimido', 100, 'mg', 'Antidepresivo'),
  m('Citalopram', 'Comprimido', 20, 'mg', 'ISRS'),
  m('Escitalopram', 'Comprimido', 10, 'mg', 'ISRS'),
  m('Fluoxetina', 'Comprimido', 20, 'mg', 'ISRS'),
  m('Paroxetina', 'Comprimido', 20, 'mg', 'ISRS'),
  m('Sertralina', 'Comprimido', 50, 'mg', 'ISRS'),
  m('Mirtazapina', 'Comprimido', 15, 'mg', 'Antidepresivo'),
  m('Mirtazapina', 'Comprimido', 30, 'mg', 'Antidepresivo'),
  m('Venlafaxina', 'Comprimido liberación prolongada', 75, 'mg', 'Antidepresivo'),
  m('Duloxetina', 'Comprimido', 30, 'mg', 'Antidepresivo'),
  m('Imipramina', 'Comprimido', 25, 'mg', 'Antidepresivo'),
  m('Amitriptilina', 'Comprimido', 25, 'mg', 'Antidepresivo'),
  m('Clorpromazina', 'Comprimido', 25, 'mg', 'Antipsicótico'),
  m('Clorpromazina', 'Comprimido', 100, 'mg', 'Antipsicótico'),
  m('Clorpromazina', 'Solución inyectable', 12.5, 'mg/mL', 'Antipsicótico'),
  m('Haloperidol', 'Comprimido', 1, 'mg', 'Antipsicótico'),
  m('Haloperidol', 'Comprimido', 5, 'mg', 'Antipsicótico'),
  m('Haloperidol', 'Solución inyectable', 5, 'mg/mL', 'Antipsicótico'),
  m('Flufenazina decanoato', 'Solución inyectable', 25, 'mg/mL', 'Antipsicótico'),
  m('Risperidona', 'Comprimido', 1, 'mg', 'Antipsicótico'),
  m('Risperidona', 'Comprimido', 3, 'mg', 'Antipsicótico'),
  m('Risperidona', 'Solución oral gotas', 1, 'mg/mL', 'Antipsicótico'),
  m('Olanzapina', 'Comprimido', 10, 'mg', 'Antipsicótico'),
  m('Quetiapina', 'Comprimido', 25, 'mg', 'Antipsicótico'),
  m('Quetiapina', 'Comprimido', 100, 'mg', 'Antipsicótico'),
  m('Aripiprazol', 'Comprimido', 10, 'mg', 'Antipsicótico'),
  m('Litio carbonato', 'Comprimido', 300, 'mg', 'Estabilizador del ánimo'),
  m('Disulfiram', 'Comprimido', 500, 'mg', 'Antialcohólico'),
  m('Anfetamina', 'Comprimido', 10, 'mg', 'Estimulante'),
  m('Metilfenidato', 'Comprimido', 10, 'mg', 'Estimulante'),
  m('Metilfenidato', 'Comprimido liberación prolongada', 20, 'mg', 'Estimulante'),

  // Anticonvulsivantes
  m('Ácido valproico', 'Comprimido', 200, 'mg', 'Anticonvulsivante'),
  m('Ácido valproico', 'Comprimido', 250, 'mg', 'Anticonvulsivante'),
  m('Ácido valproico', 'Solución oral gotas', 10, 'mg/gota', 'Anticonvulsivante'),
  m('Divalproato', 'Comprimido liberación prolongada', 500, 'mg', 'Anticonvulsivante'),
  m('Carbamazepina', 'Comprimido', 200, 'mg', 'Anticonvulsivante'),
  m('Carbamazepina', 'Comprimido liberación prolongada', 400, 'mg', 'Anticonvulsivante'),
  m('Fenitoína', 'Comprimido', 100, 'mg', 'Anticonvulsivante'),
  m('Fenitoína', 'Solución inyectable', 50, 'mg/mL', 'Anticonvulsivante'),
  m('Fenobarbital', 'Comprimido', 15, 'mg', 'Anticonvulsivante'),
  m('Fenobarbital', 'Comprimido', 100, 'mg', 'Anticonvulsivante'),
  m('Lamotrigina', 'Comprimido', 50, 'mg', 'Anticonvulsivante'),
  m('Lamotrigina', 'Comprimido', 100, 'mg', 'Anticonvulsivante'),
  m('Levetiracetam', 'Comprimido', 500, 'mg', 'Anticonvulsivante'),
  m('Levetiracetam', 'Comprimido', 1000, 'mg', 'Anticonvulsivante'),
  m('Levetiracetam', 'Jarabe', 100, 'mg/mL', 'Anticonvulsivante'),
  m('Pregabalina', 'Comprimido', 75, 'mg', 'Neuropático'),
  m('Topiramato', 'Comprimido', 25, 'mg', 'Anticonvulsivante'),
  m('Primidona', 'Comprimido', 250, 'mg', 'Anticonvulsivante'),
  m('Clonixinato de lisina', 'Comprimido', 125, 'mg', 'Analgésico'),
  m('Flunarizina', 'Comprimido', 10, 'mg', 'Antimigrañoso'),
  m('Ciclobenzaprina', 'Comprimido', 10, 'mg', 'Relajante muscular'),

  // Demencia / Parkinson
  m('Donepezilo', 'Comprimido', 10, 'mg', 'Anticolinesterásico'),
  m('Levodopa + Benserazida', 'Comprimido', 250, 'mg', 'Antiparkinsoniano'),
  m('Levodopa + Carbidopa', 'Comprimido', 275, 'mg', 'Antiparkinsoniano'),
  m('Pramipexol', 'Comprimido', 0.25, 'mg', 'Antiparkinsoniano'),
  m('Pramipexol', 'Comprimido', 1, 'mg', 'Antiparkinsoniano'),
  m('Trihexifenidilo', 'Comprimido', 2, 'mg', 'Antiparkinsoniano'),

  // Endocrinos / Hormonas femeninas
  m('Estradiol', 'Comprimido', 1, 'mg', 'Estrógeno'),
  m('Estradiol gel', 'Gel transdérmico', 0.1, '%', 'Estrógeno'),
  m('Tibolona', 'Comprimido', 2.5, 'mg', 'Hormonal'),
  m('Progesterona micronizada', 'Cápsula', 100, 'mg', 'Progestágeno'),
  m('Etonogestrel', 'Implante subdérmico', 68, 'mg', 'Anticonceptivo'),
  m('Etonogestrel + Etinilestradiol', 'Anillo vaginal', 14.4, 'mg', 'Anticonceptivo'),
  m('Levonorgestrel', 'Comprimido', 0.03, 'mg', 'Anticonceptivo'),
  m('Levonorgestrel', 'Comprimido', 1.5, 'mg', 'Anticonceptivo emergencia'),
  m('Levonorgestrel', 'Dispositivo intrauterino', 20, 'µg/24h', 'Anticonceptivo'),
  m('Levonorgestrel', 'Implante subdérmico', 75, 'mg', 'Anticonceptivo'),
  m('Levonorgestrel + Etinilestradiol', 'Comprimido', 0.18, 'mg', 'Anticonceptivo'),
  m('Medroxiprogesterona', 'Jeringa prellenada', 104, 'mg/0.65mL', 'Anticonceptivo'),
  m('Medroxiprogesterona', 'Jeringa prellenada', 150, 'mg/mL', 'Anticonceptivo'),
  m('Medroxiprogesterona + Estradiol', 'Solución inyectable', 30, 'mg/0.5mL', 'Anticonceptivo'),
  m('Noretisterona enantato + Estradiol valeriato', 'Comprimido', 55, 'mg', 'Hormonal'),
  m('Carbetocin', 'Solución inyectable', 100, 'µg/mL', 'Oxitócico'),
  m('Oxitocina', 'Solución inyectable', 5, 'UI/mL', 'Oxitócico'),
  m('Misoprostol', 'Comprimido', 200, 'µg', 'Prostaglandina'),
  m('Fenoterol', 'Solución inyectable', 0.05, 'mg/mL', 'Tocolítico'),
  m('Sildenafil', 'Comprimido', 50, 'mg', 'Disfunción eréctil'),
  m('Tamsulosina', 'Comprimido', 0.4, 'mg', 'Hiperplasia prostática'),
  m('Oxibutinina', 'Comprimido', 5, 'mg', 'Vejiga hiperactiva'),
  m('Lubricante íntimo', 'Gel', 1, 'aplicación', 'Lubricante'),

  // Oftalmológicos
  m('Cloranfenicol oftálmico', 'Solución oftálmica', 0.5, '%', 'Antibiótico oftálmico'),
  m('Cloranfenicol oftálmico', 'Ungüento oftálmico', 1, '%', 'Antibiótico oftálmico'),
  m('Gentamicina oftálmica', 'Solución oftálmica', 0.3, '%', 'Antibiótico oftálmico'),
  m('Ciprofloxacino ótico', 'Solución ótica', 0.3, '%', 'Antibiótico ótico'),
  m('Bacitracina + Neomicina', 'Ungüento tópico', 50000, 'UI/g', 'Antibiótico tópico'),
  m('Mupirocina', 'Crema', 2, '%', 'Antibiótico tópico'),
  m('Proparacaína', 'Solución oftálmica', 5, 'mg/mL', 'Anestésico oftálmico'),

  // Reumatológicos / Inmunomoduladores
  m('Alopurinol', 'Comprimido', 100, 'mg', 'Antigotoso'),
  m('Alopurinol', 'Comprimido', 300, 'mg', 'Antigotoso'),
  m('Colchicina', 'Comprimido', 0.5, 'mg', 'Antigotoso'),
  m('Hidroxicloroquina', 'Comprimido', 200, 'mg', 'Inmunomodulador'),
  m('Sulfasalazina', 'Comprimido', 500, 'mg', 'Inmunomodulador'),
  m('Metotrexato', 'Comprimido', 2.5, 'mg', 'Inmunosupresor'),
  m('Azatioprina', 'Comprimido', 50, 'mg', 'Inmunosupresor'),
  m('Leflunomida', 'Comprimido', 20, 'mg', 'Inmunosupresor'),

  // Bisfosfonatos
  m('Ácido zoledrónico', 'Solución inyectable', 4, 'mg/5mL', 'Bisfosfonato'),
  m('Pamidronato', 'Liofilizado para solución inyectable', 30, 'mg', 'Bisfosfonato'),
  m('Pamidronato', 'Liofilizado para solución inyectable', 90, 'mg', 'Bisfosfonato'),

  // Antagonistas
  m('Flumazenil', 'Solución inyectable', 0.1, 'mg/mL', 'Antagonista BZD'),
  m('Atropina', 'Solución inyectable', 1, 'mg/mL', 'Anticolinérgico'),

  // Anestésicos / Sedantes
  m('Lidocaína', 'Solución inyectable', 2, '%', 'Anestésico local'),
  m('Lidocaína', 'Gel tópico', 4, '%', 'Anestésico local'),
  m('Lidocaína', 'Carpule odontológico', 2, '%', 'Anestésico local'),
  m('Etomidato', 'Solución inyectable', 2, 'mg/mL', 'Anestésico'),
  m('Suxametonio (Succinilcolina)', 'Solución inyectable', 20, 'mg/mL', 'Bloqueante neuromuscular'),
  m('Rocuronio', 'Solución inyectable', 10, 'mg/mL', 'Bloqueante neuromuscular'),

  // Soluciones / Electrolitos
  m('Suero fisiológico', 'Solución inyectable', 0.9, '%', 'Solución'),
  m('Suero glucosado', 'Solución inyectable', 5, '%', 'Solución'),
  m('Suero glucosado', 'Solución inyectable', 10, '%', 'Solución'),
  m('Suero glucosado', 'Solución inyectable', 30, '%', 'Solución'),
  m('Glucosa polvo', 'Polvo oral', 75, 'g', 'Solución'),
  m('Suero Ringer Lactato', 'Solución inyectable', 1000, 'mL', 'Solución'),
  m('Cloruro de sodio', 'Solución inyectable', 10, '%', 'Electrolito'),
  m('Cloruro de potasio', 'Comprimido', 600, 'mg', 'Electrolito'),
  m('Cloruro de potasio', 'Solución inyectable', 10, '%', 'Electrolito'),
  m('Bicarbonato de sodio', 'Solución inyectable', 8.4, '%', 'Electrolito'),
  m('Calcio gluconato', 'Solución inyectable', 10, '%', 'Electrolito'),
  m('Magnesio sulfato', 'Solución inyectable', 25, '%', 'Electrolito'),
  m('Sales rehidratantes 60', 'Solución oral', 60, 'mEq Na/L', 'Hidratación'),
  m('Sales rehidratantes 90', 'Solución oral', 90, 'mEq Na/L', 'Hidratación'),
  m('Albúmina sérica humana', 'Solución inyectable', 20, '%', 'Coloide'),
  m('Gammaglobulina humana anti-D', 'Suspensión inyectable', 1, 'dosis', 'Inmunoglobulina'),
  m('Agua bidestilada', 'Solución inyectable', 5, 'mL', 'Solvente'),

  // Antisépticos / Higiene
  m('Alcohol etílico 70°', 'Solución desnaturalizada', 70, '°', 'Antiséptico'),
  m('Clorhexidina colutorio', 'Colutorio dental', 0.12, '%', 'Antiséptico oral'),
  m('Clorhexidina solución', 'Solución', 1, '%', 'Antiséptico'),
  m('Clorhexidina jabón 2%', 'Solución jabonosa', 2, '%', 'Antiséptico'),
  m('Clorhexidina jabón 4%', 'Solución jabonosa', 4, '%', 'Antiséptico'),
  m('Triclosán', 'Jabón líquido', 1, '%', 'Antiséptico'),
  m('Flúor barniz', 'Barniz tópico', 5, '%', 'Odontológico'),
  m('Fluoruro de sodio', 'Colutorio dental', 0.05, '%', 'Odontológico'),

  // Tópicos / Otros
  m('Vaselina sólida', 'Pomada', 1, 'g', 'Emoliente'),
  m('Vaselina líquida', 'Aceite mineral', 250, 'mL', 'Emoliente'),
  m('Vaselina azufrada', 'Ungüento', 6, '%', 'Tópico'),
  m('Pasta Lassar (Óxido de zinc)', 'Pomada', 2, '%', 'Tópico'),
  m('Trimebutino', 'Comprimido', 100, 'mg', 'Espasmolítico'),
  m('Neomicina', 'Comprimido', 500, 'mg', 'Antibiótico'),
  m('Enema evacuante (Fosfato)', 'Enema', 130, 'mL', 'Laxante'),
  m('Solución oral evacuante', 'Solución oral', 1, 'frasco', 'Preparación examen'),

  // Gases medicinales
  m('Oxígeno', 'Gas medicinal', 1, 'unidad', 'Gas'),
  m('Óxido nitroso', 'Gas medicinal', 1, 'unidad', 'Gas'),
];

console.log(`\n═══════════════════════════════════════════════════════`);
console.log(`  ARSENAL HCSF v1 — ${APPLY ? '⚡ APPLY MODE' : '🔍 DRY-RUN'}`);
console.log(`═══════════════════════════════════════════════════════\n`);

console.log(`Total medicamentos a insertar: ${MEDICATIONS.length}`);
console.log(`Categorías únicas: ${[...new Set(MEDICATIONS.map(m => m.category))].length}`);
console.log(`\nMuestra (primeros 5):`);
MEDICATIONS.slice(0, 5).forEach(med =>
  console.log(`  - ${med.name} ${med.dose_value}${med.dose_unit} (${med.presentation}) [${med.category}]`)
);

if (!APPLY) {
  console.log('\n⚠️  Modo dry-run. Agrega --apply para escribir en la BD.');
  process.exit(0);
}

// Verificar si hay medicamentos existentes (idempotencia)
const { count: existingCount } = await supabase
  .from('medications').select('*', { count: 'exact', head: true });

if (existingCount && existingCount > 0) {
  console.log(`\n⚠️  Ya hay ${existingCount} medicamentos en la BD.`);
  console.log('   Si quieres reemplazar todos, primero ejecuta TRUNCATE en Supabase Dashboard.');
  console.log('   Continuando en modo INSERT (puede haber duplicados)...\n');
}

// Insertar en batches de 100
const BATCH_SIZE = 100;
let inserted = 0;
for (let i = 0; i < MEDICATIONS.length; i += BATCH_SIZE) {
  const batch = MEDICATIONS.slice(i, i + BATCH_SIZE);
  const { data, error } = await supabase.from('medications').insert(batch).select('id');
  if (error) {
    console.error(`❌ Error en batch ${i}-${i + batch.length}: ${error.message}`);
    process.exit(1);
  }
  inserted += data.length;
  console.log(`  Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${data.length} medicamentos insertados`);
}

console.log(`\n✅ Total insertados: ${inserted}/${MEDICATIONS.length}`);
