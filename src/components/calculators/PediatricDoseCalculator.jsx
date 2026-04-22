import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pencil, Check, X, Search, FlaskConical } from 'lucide-react';

// ── Presentación del hospital ──────────────────────────────────────────────
// type: 'liquid' → calcular mL; 'solid' → calcular comprimidos/unidades
// concMg: mg por mL (líquidos) | mgPerUnit: mg por unidad (sólidos)
// ──────────────────────────────────────────────────────────────────────────

const DEFAULT_MEDS = [
  // ── Analgésicos / Antipiréticos ─────────────────────────────────────
  {
    id: 'paracetamol',
    name: 'Paracetamol',
    category: 'Analgésico / Antipirético',
    doseMin: 10, doseMax: 15,
    unit: 'mg/kg/dosis',
    frequency: 'c/6 h',
    maxSingleDose: 1000,
    maxDailyDosePerKg: 75,
    maxDailyDoseMg: 4000,
    minAge: null,
    route: 'VO / EV / Rectal',
    notes: 'Dosis máxima única 1 g. Precaución en insuficiencia hepática.',
    inArsenal: true,
    hospitalPresentations: [
      { label: 'Jarabe 125 mg/5 mL', type: 'liquid', concMg: 25,  via: 'VO',    unitLabel: 'mL' },
      { label: 'Gotas 100 mg/mL',    type: 'liquid', concMg: 100, via: 'VO',    unitLabel: 'mL' },
      { label: 'EV 10 mg/mL',        type: 'liquid', concMg: 10,  via: 'EV',    unitLabel: 'mL' },
      { label: 'Comp 500 mg',        type: 'solid',  mgPerUnit: 500, via: 'VO', unitLabel: 'comp' },
      { label: 'Comp 160 mg',        type: 'solid',  mgPerUnit: 160, via: 'VO', unitLabel: 'comp' },
    ],
  },
  {
    id: 'ibuprofeno',
    name: 'Ibuprofeno',
    category: 'AINE / Antipirético',
    doseMin: 5, doseMax: 10,
    unit: 'mg/kg/dosis',
    frequency: 'c/6–8 h',
    maxSingleDose: 400,
    maxDailyDosePerKg: 40,
    maxDailyDoseMg: 2400,
    minAge: '> 3 meses',
    route: 'VO',
    notes: 'Evitar en < 3 meses, asma, IR o deshidratación. No usar en varicela.',
    inArsenal: true,
    hospitalPresentations: [
      { label: 'Suspensión 200 mg/5 mL', type: 'liquid', concMg: 40, via: 'VO', unitLabel: 'mL' },
      { label: 'Comp 400 mg',            type: 'solid', mgPerUnit: 400, via: 'VO', unitLabel: 'comp' },
    ],
  },
  {
    id: 'metamizol',
    name: 'Metamizol (Dipirona)',
    category: 'Analgésico / Antipirético',
    doseMin: 10, doseMax: 20,
    unit: 'mg/kg/dosis',
    frequency: 'c/6–8 h',
    maxSingleDose: 1000,
    maxDailyDosePerKg: 60,
    maxDailyDoseMg: 4000,
    minAge: '> 3 meses',
    route: 'VO / EV / Rectal',
    notes: 'Riesgo de agranulocitosis (raro). Sup disponible 250 mg.',
    inArsenal: true,
    hospitalPresentations: [
      { label: 'Sol iny 500 mg/mL (diluir)', type: 'liquid', concMg: 500, via: 'EV/IM', unitLabel: 'mL' },
      { label: 'Comp 300 mg',               type: 'solid',  mgPerUnit: 300, via: 'VO',  unitLabel: 'comp' },
      { label: 'Supositorio 250 mg',        type: 'solid',  mgPerUnit: 250, via: 'Rectal', unitLabel: 'sup' },
    ],
  },
  {
    id: 'diclofenaco',
    name: 'Diclofenaco',
    category: 'AINE',
    doseMin: 1, doseMax: 2,
    unit: 'mg/kg/día',
    frequency: 'c/8 h (dividir)',
    maxSingleDose: 50,
    maxDailyDosePerKg: 3,
    maxDailyDoseMg: 150,
    minAge: '> 1 año',
    route: 'VO / Rectal',
    notes: 'Sup infantil 12,5 mg disponible en arsenal. Uso puntual, evitar en IR.',
    inArsenal: true,
    hospitalPresentations: [
      { label: 'Supositorio infantil 12,5 mg', type: 'solid', mgPerUnit: 12.5, via: 'Rectal', unitLabel: 'sup' },
      { label: 'Comp 50 mg',                  type: 'solid', mgPerUnit: 50,   via: 'VO',    unitLabel: 'comp' },
    ],
  },
  // ── Antieméticos ─────────────────────────────────────────────────────
  {
    id: 'ondansetron',
    name: 'Ondansetrón',
    category: 'Antiemético',
    doseMin: 0.1, doseMax: 0.15,
    unit: 'mg/kg/dosis',
    frequency: 'c/8 h',
    maxSingleDose: 4,
    maxDailyDosePerKg: null,
    maxDailyDoseMg: 12,
    minAge: '> 6 meses',
    route: 'VO / EV',
    notes: 'Dosis máxima única 4 mg en < 40 kg. Prolongación QT a dosis altas.',
    inArsenal: true,
    hospitalPresentations: [
      { label: 'Sol iny 4 mg/2 mL (= 2 mg/mL)', type: 'liquid', concMg: 2, via: 'EV', unitLabel: 'mL' },
      { label: 'Comp 4 mg',                      type: 'solid',  mgPerUnit: 4, via: 'VO', unitLabel: 'comp' },
      { label: 'Comp 8 mg',                      type: 'solid',  mgPerUnit: 8, via: 'VO', unitLabel: 'comp' },
    ],
  },
  {
    id: 'dimenhidrinato',
    name: 'Dimenhidrinato (Viadil)',
    category: 'Antiemético / Antihistamínico',
    doseMin: 1, doseMax: 1.5,
    unit: 'mg/kg/dosis',
    frequency: 'c/6–8 h',
    maxSingleDose: 25,
    maxDailyDosePerKg: 5,
    maxDailyDoseMg: 150,
    minAge: '> 2 años',
    route: 'VO / EV / IM',
    notes: 'Sedación frecuente. Evitar en < 2 años. No listado en arsenal HCSF — confirmar stock.',
    inArsenal: false,
    hospitalPresentations: [],
  },
  // ── Antihistamínicos ──────────────────────────────────────────────────
  {
    id: 'cetirizina',
    name: 'Cetirizina',
    category: 'Antihistamínico',
    doseMin: 0.25, doseMax: 0.25,
    unit: 'mg/kg/dosis',
    frequency: 'c/24 h',
    maxSingleDose: 10,
    maxDailyDosePerKg: 0.25,
    maxDailyDoseMg: 10,
    minAge: '> 2 años',
    route: 'VO',
    notes: '6–12 años: 5 mg/día; > 12 años: 10 mg/día. Poca sedación.',
    inArsenal: true,
    hospitalPresentations: [
      { label: 'Comp 10 mg', type: 'solid', mgPerUnit: 10, via: 'VO', unitLabel: 'comp' },
    ],
  },
  {
    id: 'levocetirizina',
    name: 'Levocetirizina',
    category: 'Antihistamínico',
    doseMin: 0.125, doseMax: 0.125,
    unit: 'mg/kg/dosis',
    frequency: 'c/24 h',
    maxSingleDose: 5,
    maxDailyDosePerKg: 0.125,
    maxDailyDoseMg: 5,
    minAge: '> 2 años',
    route: 'VO',
    notes: '2–6 años: 1,25 mg/día; > 6 años: 2,5–5 mg/día.',
    inArsenal: true,
    hospitalPresentations: [
      { label: 'Jarabe 5 mg/5 mL (= 1 mg/mL)', type: 'liquid', concMg: 1, via: 'VO', unitLabel: 'mL' },
    ],
  },
  {
    id: 'clorfeniramina',
    name: 'Clorfenamina (Clorfeniramina)',
    category: 'Antihistamínico',
    doseMin: 0.35, doseMax: 0.35,
    unit: 'mg/kg/día',
    frequency: 'c/6 h (dividir dosis diaria)',
    maxSingleDose: 4,
    maxDailyDosePerKg: 0.35,
    maxDailyDoseMg: 12,
    minAge: '> 2 años',
    route: 'VO',
    notes: 'Dosis diaria dividida en 4 tomas. Sedante.',
    inArsenal: true,
    hospitalPresentations: [
      { label: 'Comp 4 mg',              type: 'solid',  mgPerUnit: 4,  via: 'VO', unitLabel: 'comp' },
      { label: 'Sol iny 10 mg/mL',       type: 'liquid', concMg: 10,   via: 'EV/IM', unitLabel: 'mL' },
    ],
  },
  {
    id: 'loratadina',
    name: 'Loratadina',
    category: 'Antihistamínico',
    doseMin: 0.2, doseMax: 0.2,
    unit: 'mg/kg/dosis',
    frequency: 'c/24 h',
    maxSingleDose: 10,
    maxDailyDosePerKg: 0.2,
    maxDailyDoseMg: 10,
    minAge: '> 2 años',
    route: 'VO',
    notes: '< 30 kg: 5 mg/día; ≥ 30 kg: 10 mg/día.',
    inArsenal: true,
    hospitalPresentations: [
      { label: 'Jarabe 5 mg/5 mL (= 1 mg/mL)', type: 'liquid', concMg: 1,  via: 'VO', unitLabel: 'mL' },
      { label: 'Comp 10 mg',                    type: 'solid',  mgPerUnit: 10, via: 'VO', unitLabel: 'comp' },
    ],
  },
  // ── Psicotrópicos ─────────────────────────────────────────────────────
  {
    id: 'amitriptilina',
    name: 'Amitriptilina',
    category: 'Antidepresivo / Dolor neuropático',
    doseMin: 0.1, doseMax: 0.5,
    unit: 'mg/kg/dosis',
    frequency: 'c/24 h (nocturna)',
    maxSingleDose: 25,
    maxDailyDosePerKg: 0.5,
    maxDailyDoseMg: 25,
    minAge: '> 6 años (uso especialista)',
    route: 'VO',
    notes: '⚠ Solo bajo supervisión de especialista. Monitoreo cardíaco.',
    inArsenal: true,
    hospitalPresentations: [
      { label: 'Comp 25 mg', type: 'solid', mgPerUnit: 25, via: 'VO', unitLabel: 'comp' },
    ],
  },
  {
    id: 'sertralina',
    name: 'Sertralina',
    category: 'ISRS',
    doseMin: 25, doseMax: 25,
    unit: 'mg/día (dosis fija inicial)',
    frequency: 'c/24 h',
    maxSingleDose: 200,
    maxDailyDosePerKg: null,
    maxDailyDoseMg: 200,
    minAge: '> 6 años (uso especialista)',
    route: 'VO',
    notes: '⚠ Solo bajo supervisión psiquiátrica. Titular lentamente.',
    fixedDose: true,
    inArsenal: true,
    hospitalPresentations: [
      { label: 'Comp 50 mg', type: 'solid', mgPerUnit: 50, via: 'VO', unitLabel: 'comp' },
    ],
  },
  // ── Benzodiacepinas ───────────────────────────────────────────────────
  {
    id: 'diazepam',
    name: 'Diazepam',
    category: 'Benzodiacepina',
    doseMin: 0.1, doseMax: 0.3,
    unit: 'mg/kg/dosis',
    frequency: 'según indicación',
    maxSingleDose: 10,
    maxDailyDosePerKg: null,
    maxDailyDoseMg: 30,
    minAge: null,
    route: 'VO / EV / Rectal',
    notes: '⚠ Monitoreo respiratorio EV obligatorio.',
    inArsenal: true,
    hospitalPresentations: [
      { label: 'Sol iny 10 mg/mL', type: 'liquid', concMg: 10, via: 'EV', unitLabel: 'mL' },
      { label: 'Comp 10 mg',       type: 'solid',  mgPerUnit: 10, via: 'VO', unitLabel: 'comp' },
    ],
  },
  {
    id: 'lorazepam',
    name: 'Lorazepam',
    category: 'Benzodiacepina',
    doseMin: 0.05, doseMax: 0.1,
    unit: 'mg/kg/dosis',
    frequency: 'según indicación',
    maxSingleDose: 4,
    maxDailyDosePerKg: null,
    maxDailyDoseMg: 8,
    minAge: null,
    route: 'VO / EV / SL',
    notes: '⚠ Primera línea estatus epiléptico EV. Monitoreo respiratorio.',
    inArsenal: true,
    hospitalPresentations: [
      { label: 'Sol iny 4 mg/mL',   type: 'liquid', concMg: 4, via: 'EV', unitLabel: 'mL' },
      { label: 'Comp 2 mg',         type: 'solid',  mgPerUnit: 2, via: 'VO', unitLabel: 'comp' },
      { label: 'Comp SL 2 mg',      type: 'solid',  mgPerUnit: 2, via: 'SL', unitLabel: 'comp' },
    ],
  },
  {
    id: 'midazolam',
    name: 'Midazolam',
    category: 'Benzodiacepina',
    doseMin: 0.1, doseMax: 0.3,
    unit: 'mg/kg/dosis',
    frequency: 'según indicación',
    maxSingleDose: 10,
    maxDailyDosePerKg: null,
    maxDailyDoseMg: null,
    minAge: null,
    route: 'EV / IM / IN / Bucal',
    notes: '⚠ Vía intranasal: 0,2 mg/kg (máx 10 mg). Monitoreo estricto.',
    inArsenal: true,
    hospitalPresentations: [
      { label: 'Sol iny 5 mg/mL', type: 'liquid', concMg: 5, via: 'EV/IM/IN', unitLabel: 'mL' },
    ],
  },
  // ── Antibióticos ──────────────────────────────────────────────────────
  {
    id: 'amoxicilina',
    name: 'Amoxicilina',
    category: 'Antibiótico — Penicilina',
    doseMin: 40, doseMax: 90,
    unit: 'mg/kg/día',
    frequency: 'c/8 h (dividir dosis diaria)',
    maxSingleDose: 500,
    maxDailyDosePerKg: 90,
    maxDailyDoseMg: 3000,
    minAge: null,
    route: 'VO',
    notes: '40 mg/kg/día leve-moderado; 80–90 mg/kg/día para SBO/otitis de alta resistencia.',
    inArsenal: true,
    hospitalPresentations: [
      { label: 'Suspensión 500 mg/5 mL (= 100 mg/mL)', type: 'liquid', concMg: 100, via: 'VO', unitLabel: 'mL', perDose: true },
      { label: 'Comp 500 mg',                          type: 'solid',  mgPerUnit: 500, via: 'VO', unitLabel: 'comp', perDose: true },
    ],
  },
  {
    id: 'amoxiclav',
    name: 'Amoxicilina/Ác. Clavulánico',
    category: 'Antibiótico — Penicilina + inhibidor',
    doseMin: 40, doseMax: 90,
    unit: 'mg/kg/día (de amoxicilina)',
    frequency: 'c/8–12 h',
    maxSingleDose: 500,
    maxDailyDosePerKg: 90,
    maxDailyDoseMg: 3000,
    minAge: null,
    route: 'VO',
    notes: 'Dosis expresada en amoxicilina. Tomar con alimentos.',
    inArsenal: true,
    hospitalPresentations: [
      { label: 'Suspensión 400/57 mg/5 mL (= 80 mg/mL amox)', type: 'liquid', concMg: 80, via: 'VO', unitLabel: 'mL', perDose: true },
      { label: 'Comp 500/125 mg',                              type: 'solid', mgPerUnit: 500, via: 'VO', unitLabel: 'comp', perDose: true },
      { label: 'Comp 875/125 mg',                              type: 'solid', mgPerUnit: 875, via: 'VO', unitLabel: 'comp', perDose: true },
    ],
  },
  {
    id: 'azitromicina',
    name: 'Azitromicina',
    category: 'Antibiótico — Macrólido',
    doseMin: 10, doseMax: 10,
    unit: 'mg/kg/día',
    frequency: 'c/24 h × 3–5 días',
    maxSingleDose: 500,
    maxDailyDosePerKg: 10,
    maxDailyDoseMg: 500,
    minAge: null,
    route: 'VO',
    notes: 'Prolongación QT — evitar con otros fármacos QT.',
    inArsenal: true,
    hospitalPresentations: [
      { label: 'Suspensión 200 mg/5 mL (= 40 mg/mL)', type: 'liquid', concMg: 40, via: 'VO', unitLabel: 'mL' },
      { label: 'Suspensión 400 mg/5 mL (= 80 mg/mL)', type: 'liquid', concMg: 80, via: 'VO', unitLabel: 'mL' },
      { label: 'Comp 500 mg',                          type: 'solid', mgPerUnit: 500, via: 'VO', unitLabel: 'comp' },
    ],
  },
  {
    id: 'claritromicina',
    name: 'Claritromicina',
    category: 'Antibiótico — Macrólido',
    doseMin: 15, doseMax: 15,
    unit: 'mg/kg/día',
    frequency: 'c/12 h (dividir)',
    maxSingleDose: 500,
    maxDailyDosePerKg: 15,
    maxDailyDoseMg: 1000,
    minAge: null,
    route: 'VO',
    notes: 'Múltiples interacciones (CYP3A4). Tomar con alimentos.',
    inArsenal: true,
    hospitalPresentations: [
      { label: 'Suspensión 250 mg/5 mL (= 50 mg/mL)', type: 'liquid', concMg: 50,  via: 'VO', unitLabel: 'mL', perDose: true },
      { label: 'Comp 500 mg',                          type: 'solid', mgPerUnit: 500, via: 'VO', unitLabel: 'comp', perDose: true },
    ],
  },
  {
    id: 'clindamicina',
    name: 'Clindamicina',
    category: 'Antibiótico — Lincosamida',
    doseMin: 25, doseMax: 40,
    unit: 'mg/kg/día',
    frequency: 'c/6–8 h (dividir)',
    maxSingleDose: 450,
    maxDailyDosePerKg: 40,
    maxDailyDoseMg: 1800,
    minAge: null,
    route: 'VO / EV',
    notes: 'Excelente cobertura piel y tejidos blandos. Riesgo C. difficile.',
    inArsenal: true,
    hospitalPresentations: [
      { label: 'Sol iny 600 mg/4 mL (= 150 mg/mL)', type: 'liquid', concMg: 150, via: 'EV', unitLabel: 'mL', perDose: true },
      { label: 'Comp 300 mg',                        type: 'solid',  mgPerUnit: 300, via: 'VO', unitLabel: 'comp', perDose: true },
    ],
  },
  {
    id: 'cefadroxilo',
    name: 'Cefadroxilo',
    category: 'Antibiótico — Cefalosporina 1ª',
    doseMin: 30, doseMax: 50,
    unit: 'mg/kg/día',
    frequency: 'c/12 h (dividir)',
    maxSingleDose: 1000,
    maxDailyDosePerKg: 50,
    maxDailyDoseMg: 2000,
    minAge: null,
    route: 'VO',
    notes: 'Buena opción piel y faringoamigdalitis. Posología cómoda c/12h.',
    inArsenal: true,
    hospitalPresentations: [
      { label: 'Suspensión 250 mg/5 mL (= 50 mg/mL)', type: 'liquid', concMg: 50,  via: 'VO', unitLabel: 'mL', perDose: true },
      { label: 'Suspensión 500 mg/5 mL (= 100 mg/mL)',type: 'liquid', concMg: 100, via: 'VO', unitLabel: 'mL', perDose: true },
      { label: 'Comp 500 mg',                          type: 'solid', mgPerUnit: 500, via: 'VO', unitLabel: 'comp', perDose: true },
    ],
  },
  {
    id: 'nitrofurantoina',
    name: 'Nitrofurantoína',
    category: 'Antibiótico — ITU',
    doseMin: 5, doseMax: 7,
    unit: 'mg/kg/día',
    frequency: 'c/6 h (4 tomas)',
    maxSingleDose: 100,
    maxDailyDosePerKg: 7,
    maxDailyDoseMg: 400,
    minAge: '> 1 mes',
    route: 'VO',
    notes: 'Solo ITU baja. Contraindicado en < 1 mes y ClCr < 30.',
    inArsenal: true,
    hospitalPresentations: [
      { label: 'Cáps macrocristales 100 mg', type: 'solid', mgPerUnit: 100, via: 'VO', unitLabel: 'cáps', perDose: true },
    ],
  },
  {
    id: 'cotrimoxazol',
    name: 'Cotrimoxazol (TMP-SMX)',
    category: 'Antibiótico — Sulfonamida',
    doseMin: 8, doseMax: 12,
    unit: 'mg/kg/día (de TMP)',
    frequency: 'c/12 h (dividir)',
    maxSingleDose: null,
    maxDailyDosePerKg: 12,
    maxDailyDoseMg: 320,
    minAge: '> 2 meses',
    route: 'VO',
    notes: 'Dosis en TMP. Arsenal: Forte (SMT 800mg + TMP 160mg). Solo comp Forte disponible.',
    inArsenal: true,
    hospitalPresentations: [
      { label: 'Comp Forte (TMP 160 mg + SMT 800 mg)', type: 'solid', mgPerUnit: 160, via: 'VO', unitLabel: 'comp', perDose: true },
    ],
  },
];

const CATEGORIES = [...new Set(DEFAULT_MEDS.map(m => m.category))];

function normalize(s) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function r1(n) { return Math.round(n * 10) / 10; }
function r2(n) { return Math.round(n * 100) / 100; }

// ── Cálculo en mL o unidades según presentación ────────────────────────────
function calcPresentation(pres, doseMg) {
  if (pres.type === 'liquid') {
    const vol = doseMg / pres.concMg;
    return { value: r1(vol), label: pres.unitLabel };
  } else {
    const units = doseMg / pres.mgPerUnit;
    return { value: r2(units), label: pres.unitLabel };
  }
}

function HospitalDose({ med, doseMg }) {
  if (!med.inArsenal || !med.hospitalPresentations?.length) return null;

  return (
    <div className="rounded-xl border border-teal-200 bg-teal-50 p-3 space-y-2">
      <div className="flex items-center gap-1.5">
        <FlaskConical className="h-3.5 w-3.5 text-teal-600" />
        <p className="text-[10px] font-bold uppercase tracking-wide text-teal-700">
          Presentaciones en arsenal HCSF Bulnes
        </p>
      </div>
      <div className="space-y-1">
        {med.hospitalPresentations.map((pres, i) => {
          const calc = calcPresentation(pres, doseMg);
          const isFraction = pres.type === 'solid' && calc.value % 1 !== 0;
          return (
            <div key={i} className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-1.5 border border-teal-100">
              <div>
                <span className="text-xs text-slate-700">{pres.label}</span>
                <span className="ml-2 text-[10px] text-slate-400">· {pres.via}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className={`text-sm font-bold ${isFraction ? 'text-amber-700' : 'text-teal-800'}`}>
                  {calc.value}
                </span>
                <span className="text-xs text-slate-500">{calc.label}</span>
                {isFraction && (
                  <span className="text-[10px] text-amber-600 ml-1">(fracción)</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DoseResult({ med, weight }) {
  if (!weight || weight <= 0) return null;
  const w = parseFloat(weight);

  if (med.fixedDose) {
    return (
      <div className="space-y-2">
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-blue-700">Dosis fija — no depende del peso</p>
          <p className="text-lg font-bold text-blue-900">{med.doseMin} mg / día</p>
          <p className="mt-1 text-xs text-slate-600">{med.frequency} · {med.route}</p>
        </div>
        {med.inArsenal && med.hospitalPresentations.length > 0 && (
          <HospitalDose med={med} doseMg={med.doseMin} />
        )}
        {med.notes && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">{med.notes}</p>}
      </div>
    );
  }

  const isDaily = med.unit.includes('/día');
  const rawMin  = r2(med.doseMin * w);
  const rawMax  = r2(med.doseMax * w);
  const cappedMin = med.maxSingleDose ? Math.min(rawMin, med.maxSingleDose) : rawMin;
  const cappedMax = med.maxSingleDose ? Math.min(rawMax, med.maxSingleDose) : rawMax;
  const hitCap = rawMax > (med.maxSingleDose ?? Infinity);

  // Para antibióticos expresados en mg/kg/día, la dosis por toma = dailyDose / nTomas
  const doseMgForPresentation = cappedMax; // usamos dosis máxima para cálculo de presentación

  return (
    <div className="space-y-2">
      {/* Dosis calculada */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-emerald-700">
          {isDaily ? 'Dosis diaria calculada' : 'Dosis por administración'}
        </p>
        <div className="flex items-end gap-2 flex-wrap">
          <p className="text-2xl font-bold text-emerald-900">
            {cappedMin === cappedMax ? cappedMin : `${cappedMin}–${cappedMax}`}
            <span className="ml-1 text-base font-normal text-emerald-600">mg</span>
          </p>
          {hitCap && (
            <span className="mb-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
              Limitado por dosis máxima
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-emerald-700">
          {med.doseMin === med.doseMax ? med.doseMin : `${med.doseMin}–${med.doseMax}`} {med.unit} × {w} kg
        </p>
        <p className="mt-0.5 text-xs text-slate-500">{med.frequency} · {med.route}</p>
      </div>

      {/* Límites */}
      {(med.maxSingleDose || med.maxDailyDoseMg) && (
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 flex flex-wrap gap-x-4">
          {med.maxSingleDose && <span>Dosis máx única: <strong className="text-slate-700">{med.maxSingleDose} mg</strong></span>}
          {med.maxDailyDoseMg && <span>Dosis máx diaria: <strong className="text-slate-700">{med.maxDailyDoseMg} mg</strong></span>}
        </div>
      )}

      {/* Presentaciones del hospital */}
      <HospitalDose med={med} doseMg={doseMgForPresentation} />

      {/* Notas */}
      {med.notes && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
          <p className="text-xs leading-relaxed text-amber-800">{med.notes}</p>
        </div>
      )}

      {/* Sin arsenal */}
      {!med.inArsenal && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-xs text-slate-500">⚠ Medicamento no listado en arsenal HCSF Bulnes 2023 — confirmar disponibilidad en farmacia.</p>
        </div>
      )}
    </div>
  );
}

export default function PediatricDoseCalculator() {
  const [meds, setMeds]           = useState(DEFAULT_MEDS);
  const [weight, setWeight]       = useState('');
  const [query, setQuery]         = useState('');
  const [selected, setSelected]   = useState(null);
  const [showList, setShowList]   = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editVal, setEditVal]     = useState({ min: '', max: '' });
  const [activeCategory, setActiveCategory] = useState('Todos');
  const searchRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowList(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = meds.filter(m => {
    const matchQ = !query || normalize(m.name).includes(normalize(query)) || normalize(m.category).includes(normalize(query));
    const matchC = activeCategory === 'Todos' || m.category === activeCategory;
    return matchQ && matchC;
  }).slice(0, 10);

  const handleSelect = (med) => {
    setSelected(med);
    setQuery(med.name);
    setShowList(false);
  };

  const startEdit = (med) => {
    setEditingId(med.id);
    setEditVal({ min: med.doseMin, max: med.doseMax });
  };

  const saveEdit = () => {
    setMeds(prev => prev.map(m =>
      m.id === editingId
        ? { ...m, doseMin: parseFloat(editVal.min) || m.doseMin, doseMax: parseFloat(editVal.max) || m.doseMax }
        : m
    ));
    if (selected?.id === editingId) {
      setSelected(prev => ({
        ...prev,
        doseMin: parseFloat(editVal.min) || prev.doseMin,
        doseMax: parseFloat(editVal.max) || prev.doseMax,
      }));
    }
    setEditingId(null);
  };

  const currentMed = selected ? meds.find(m => m.id === selected.id) : null;

  return (
    <Card className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-4 text-white">
        <h2 className="text-lg font-bold">Calculadora de Dosis Pediátrica</h2>
        <p className="mt-0.5 text-sm text-teal-100">
          Dosis por peso · Presentaciones arsenal HCSF Bulnes 2023
        </p>
      </div>

      <div className="p-5 space-y-5">

        {/* Peso */}
        <div>
          <Label className="text-sm font-semibold text-slate-700">Peso del paciente (kg)</Label>
          <Input
            type="number" min="0.5" max="120" step="0.1"
            value={weight}
            onChange={e => setWeight(e.target.value)}
            placeholder="Ej: 18.5"
            className="mt-1 text-lg font-semibold"
          />
          {weight && parseFloat(weight) > 0 && (
            <p className="mt-1 text-xs text-slate-500">Peso: <strong>{parseFloat(weight)} kg</strong></p>
          )}
        </div>

        {/* Categorías */}
        <div className="overflow-x-auto pb-1">
          <div className="flex gap-2 min-w-max">
            {['Todos', ...CATEGORIES].map(cat => (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setQuery(''); setSelected(null); }}
                className={`rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap transition-all ${
                  activeCategory === cat
                    ? 'bg-teal-600 text-white shadow'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Búsqueda */}
        <div ref={searchRef} className="relative">
          <Label className="text-sm font-semibold text-slate-700">Medicamento</Label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setShowList(true); setSelected(null); }}
              onFocus={() => setShowList(true)}
              placeholder="Buscar: paracetamol, amoxicilina, cetirizina..."
              className="flex h-10 w-full rounded-xl border border-input bg-white pl-9 pr-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          {showList && filtered.length > 0 && (
            <ul className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
              {filtered.map(med => (
                <li key={med.id}>
                  <button
                    type="button"
                    onMouseDown={e => { e.preventDefault(); handleSelect(med); }}
                    className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-teal-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {med.inArsenal && (
                        <FlaskConical className="h-3 w-3 text-teal-500 shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{med.name}</p>
                        <p className="text-xs text-slate-500">{med.category}</p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      {med.doseMin === med.doseMax ? med.doseMin : `${med.doseMin}–${med.doseMax}`} {med.unit}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Medicamento seleccionado */}
        {currentMed && (
          <div className="rounded-2xl border border-teal-200 bg-teal-50/30 p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-slate-900">{currentMed.name}</p>
                  {currentMed.inArsenal && (
                    <span className="rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-700 border border-teal-200">
                      Arsenal HCSF
                    </span>
                  )}
                </div>
                <p className="text-xs text-teal-700">{currentMed.category}</p>
                {currentMed.minAge && (
                  <p className="text-xs text-amber-700 font-medium">Edad mínima: {currentMed.minAge}</p>
                )}
              </div>
              {/* Editar dosis */}
              {editingId === currentMed.id ? (
                <div className="flex items-center gap-1.5">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 mb-0.5">Min–Max {currentMed.unit}</p>
                    <div className="flex gap-1 items-center">
                      <input type="number" value={editVal.min} onChange={e => setEditVal(v => ({ ...v, min: e.target.value }))} className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-xs text-center" />
                      <span className="text-xs text-slate-400">–</span>
                      <input type="number" value={editVal.max} onChange={e => setEditVal(v => ({ ...v, max: e.target.value }))} className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-xs text-center" />
                    </div>
                  </div>
                  <button onClick={saveEdit} className="p-1 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200"><Check className="h-4 w-4" /></button>
                  <button onClick={() => setEditingId(null)} className="p-1 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200"><X className="h-4 w-4" /></button>
                </div>
              ) : (
                <button
                  onClick={() => startEdit(currentMed)}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-500 hover:border-teal-300 hover:text-teal-700 transition-colors"
                >
                  <Pencil className="h-3 w-3" />
                  Editar dosis
                </button>
              )}
            </div>
            <DoseResult med={currentMed} weight={weight} />
          </div>
        )}

        {!currentMed && !query && (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 py-10 text-center text-slate-400">
            <FlaskConical className="h-8 w-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">Selecciona un medicamento para calcular la dosis</p>
            <p className="text-xs mt-1 text-slate-300">El ícono <span className="text-teal-400">⬡</span> indica disponibilidad en arsenal HCSF</p>
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 px-6 py-3">
        <p className="text-[11px] text-slate-400">
          Arsenal: Res. Exenta N°5235 Oct 2023, Servicio de Salud Ñuble · Dosis: Lexicomp Pediatric, BNFc, Minsal Chile. Verificar siempre contra ficha técnica y ajustar según clínica.
        </p>
      </div>
    </Card>
  );
}
