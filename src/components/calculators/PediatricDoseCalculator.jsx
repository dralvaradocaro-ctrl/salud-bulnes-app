import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pencil, Check, X, Search } from 'lucide-react';

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
    forms: 'Jarabe 120 mg/5 mL · Supositorios 125 mg · Comp 500 mg · EV 10 mg/mL',
    notes: 'Dosis máxima única 1 g. Precaución en insuficiencia hepática.',
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
    forms: 'Suspensión 200 mg/5 mL · Comp 200/400 mg',
    notes: 'Evitar en < 3 meses, asma, IR o deshidratación. No usar en varicela.',
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
    route: 'VO / EV / IM',
    forms: 'Gotas 500 mg/mL · Amp 1 g/2 mL',
    notes: 'Riesgo de agranulocitosis (raro). Uso IM solo en urgencia.',
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
    forms: 'Comp ODT 4/8 mg · Amp 2 mg/mL',
    notes: 'Dosis máxima única 4 mg en < 40 kg. Prolongación QT a dosis altas.',
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
    forms: 'Comp 50 mg · Amp 50 mg/mL · Supositorios 40 mg',
    notes: 'Sedación frecuente. Evitar en < 2 años. Máx 25 mg/dosis en menores.',
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
    forms: 'Jarabe 1 mg/mL · Comp 10 mg',
    notes: '6–12 años: 5 mg/día; > 12 años: 10 mg/día. Poca sedación.',
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
    forms: 'Jarabe 2 mg/5 mL · Comp 4 mg',
    notes: 'Dosis diaria dividida en 4 tomas. Sedante, uso cauteloso.',
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
    forms: 'Jarabe 1 mg/mL · Comp 10 mg',
    notes: '2–12 años < 30 kg: 5 mg/día; > 30 kg o > 12 años: 10 mg/día.',
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
    forms: 'Comp 10/25 mg',
    notes: '⚠ Solo bajo supervisión de especialista (neurología/psiquiatría pediátrica). Monitoreo cardíaco.',
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
    forms: 'Comp 50/100 mg · Sol oral 20 mg/mL',
    notes: '⚠ Solo bajo supervisión psiquiátrica. Inicio 25 mg/día, titular lentamente. No dosificación por kg en práctica clínica.',
    fixedDose: true,
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
    forms: 'Comp 5/10 mg · Amp 5 mg/mL · Solución rectal 5/10 mg',
    notes: '⚠ Uso puntual (convulsiones, procedimientos). Monitoreo respiratorio EV.',
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
    forms: 'Comp 1/2 mg · Amp 2 mg/mL',
    notes: '⚠ Primera línea en estatus epiléptico EV. Monitoreo respiratorio.',
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
    route: 'VO / EV / IM / IN / Bucal',
    forms: 'Amp 1 mg/mL / 5 mg/mL · Jarabe 2 mg/mL',
    notes: '⚠ Sedación/convulsiones. Vía intranasal: 0.2 mg/kg (máx 10 mg). Monitoreo estricto.',
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
    forms: 'Suspensión 250 mg/5 mL · Comp 500 mg',
    notes: '40 mg/kg/día para infecciones leves-moderadas; 80-90 mg/kg/día para SBO/OTITIS alta resistencia.',
  },
  {
    id: 'amoxiclav',
    name: 'Amoxicilina/Ácido Clavulánico',
    category: 'Antibiótico — Penicilina + inhibidor',
    doseMin: 40, doseMax: 90,
    unit: 'mg/kg/día (de amoxicilina)',
    frequency: 'c/8 h o c/12 h',
    maxSingleDose: 500,
    maxDailyDosePerKg: 90,
    maxDailyDoseMg: 3000,
    minAge: null,
    route: 'VO',
    forms: 'Suspensión 250/62,5 mg/5 mL · Comp 500/125 mg',
    notes: 'Dosis expresada en componente amoxicilina. Formulación 7:1 para dosis altas. Tomar con alimentos.',
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
    forms: 'Suspensión 200 mg/5 mL · Comp 500 mg',
    notes: 'Faringoamigdalitis: 5 días; Atípicas: 3-5 días. Prolongación QT — evitar con otros QT.',
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
    forms: 'Suspensión 125/250 mg/5 mL · Comp 250/500 mg',
    notes: 'Múltiples interacciones medicamentosas (CYP3A4). Tomar con alimentos.',
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
    forms: 'Cáps 150/300 mg · Amp 150 mg/mL',
    notes: 'Excelente cobertura piel y tejidos blandos. Riesgo de colitis por C. difficile.',
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
    forms: 'Suspensión 250 mg/5 mL · Comp 500 mg',
    notes: 'Buena opción en infecciones de piel y faringoamigdalitis. Posología cómoda c/12h.',
  },
  {
    id: 'cefalexina',
    name: 'Cefalexina',
    category: 'Antibiótico — Cefalosporina 1ª',
    doseMin: 25, doseMax: 50,
    unit: 'mg/kg/día',
    frequency: 'c/6 h (dividir)',
    maxSingleDose: 500,
    maxDailyDosePerKg: 50,
    maxDailyDoseMg: 2000,
    minAge: null,
    route: 'VO',
    forms: 'Suspensión 250 mg/5 mL · Comp 500 mg',
    notes: 'Primera línea infecciones piel/tejidos blandos. Alternativa a amoxicilina.',
  },
  {
    id: 'nitrofurantoina',
    name: 'Nitrofurantoína',
    category: 'Antibiótico — ITU',
    doseMin: 5, doseMax: 7,
    unit: 'mg/kg/día',
    frequency: 'c/6 h (dividir en 4 tomas)',
    maxSingleDose: 100,
    maxDailyDosePerKg: 7,
    maxDailyDoseMg: 400,
    minAge: '> 1 mes',
    route: 'VO',
    forms: 'Cáps 100 mg · Suspensión magistral',
    notes: 'Solo ITU baja (no pielonefritis). Contraindicado en < 1 mes y con ClCr < 30.',
  },
  {
    id: 'trimetoprim-smc',
    name: 'Trimetoprim/Sulfametoxazol (TMP-SMX)',
    category: 'Antibiótico — Sulfonamida',
    doseMin: 8, doseMax: 12,
    unit: 'mg/kg/día (de TMP)',
    frequency: 'c/12 h (dividir)',
    maxSingleDose: null,
    maxDailyDosePerKg: 12,
    maxDailyDoseMg: 320,
    minAge: '> 2 meses',
    route: 'VO',
    forms: 'Suspensión 40/200 mg/5 mL · Comp 80/400 mg',
    notes: 'Dosis expresada en TMP. Contraindicado < 2 meses. Buena opción ITU y otitis.',
  },
];

const CATEGORIES = [...new Set(DEFAULT_MEDS.map(m => m.category))];

function normalize(s) {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function round2(n) { return Math.round(n * 100) / 100; }

function DoseResult({ med, weight }) {
  if (!weight || weight <= 0) return null;
  const w = parseFloat(weight);

  if (med.fixedDose) {
    return (
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-blue-700">Dosis fija — no depende del peso</p>
        <p className="text-lg font-bold text-blue-900">{med.doseMin} mg / día</p>
        <p className="mt-1 text-xs text-blue-700">{med.frequency} · {med.route}</p>
        <p className="mt-2 text-xs text-slate-600">{med.forms}</p>
        {med.notes && <p className="mt-2 text-xs text-amber-700">{med.notes}</p>}
      </div>
    );
  }

  const isDaily = med.unit.includes('/día');
  const rawMin = round2(med.doseMin * w);
  const rawMax = round2(med.doseMax * w);
  const cappedMin = med.maxSingleDose ? Math.min(rawMin, med.maxSingleDose) : rawMin;
  const cappedMax = med.maxSingleDose ? Math.min(rawMax, med.maxSingleDose) : rawMax;
  const cappedDaily = med.maxDailyDoseMg;
  const dailyMin = isDaily ? cappedMin : null;
  const dailyMax = isDaily ? cappedMax : null;

  const hitCap = rawMax > (med.maxSingleDose ?? Infinity);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-emerald-700">
          {isDaily ? 'Dosis diaria calculada' : 'Dosis por administración'}
        </p>
        <div className="flex items-end gap-2">
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
        <p className="mt-1 text-xs text-slate-600">{med.frequency} · {med.route}</p>
      </div>

      {/* Dosis diaria si la unidad es por dosis */}
      {!isDaily && cappedMax && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold text-slate-500">
            Dosis diaria estimada:{' '}
            <span className="font-bold text-slate-700">
              {cappedMin === cappedMax ? cappedMin * 4 : `${cappedMin * 3}–${cappedMax * 4}`} mg/día
            </span>
            {cappedDaily && (
              <span className="ml-2 text-slate-400">
                (máx {cappedDaily} mg/día)
              </span>
            )}
          </p>
        </div>
      )}

      {med.maxSingleDose && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs text-slate-500">
          Dosis máxima única: <span className="font-bold text-slate-700">{med.maxSingleDose} mg</span>
          {med.maxDailyDoseMg && (
            <> · Dosis máxima diaria: <span className="font-bold text-slate-700">{med.maxDailyDoseMg} mg</span></>
          )}
        </div>
      )}

      <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">Presentaciones</p>
        <p className="text-xs text-slate-600">{med.forms}</p>
      </div>

      {med.notes && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs leading-relaxed text-amber-800">{med.notes}</p>
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
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 px-6 py-4 text-white">
        <h2 className="text-lg font-bold">Calculadora de Dosis Pediátrica</h2>
        <p className="mt-0.5 text-sm text-teal-100">
          Dosis por peso · Pool editable de medicamentos
        </p>
      </div>

      <div className="p-5 space-y-5">

        {/* Weight */}
        <div>
          <Label className="text-sm font-semibold text-slate-700">Peso del paciente (kg)</Label>
          <Input
            type="number"
            min="0.5"
            max="120"
            step="0.1"
            value={weight}
            onChange={e => setWeight(e.target.value)}
            placeholder="Ej: 18.5"
            className="mt-1 text-lg font-semibold"
          />
          {weight && parseFloat(weight) > 0 && (
            <p className="mt-1 text-xs text-slate-500">
              Peso registrado: <strong>{parseFloat(weight)} kg</strong>
            </p>
          )}
        </div>

        {/* Category chips */}
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

        {/* Search */}
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
          {showList && (filtered.length > 0) && (
            <ul className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
              {filtered.map(med => (
                <li key={med.id}>
                  <button
                    type="button"
                    onMouseDown={e => { e.preventDefault(); handleSelect(med); }}
                    className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-teal-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{med.name}</p>
                      <p className="text-xs text-slate-500">{med.category}</p>
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

        {/* Selected medication card */}
        {currentMed && (
          <div className="rounded-2xl border border-teal-200 bg-teal-50/40 p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-slate-900">{currentMed.name}</p>
                <p className="text-xs text-teal-700">{currentMed.category}</p>
                {currentMed.minAge && (
                  <p className="text-xs text-amber-700 font-medium">Edad mínima: {currentMed.minAge}</p>
                )}
              </div>
              {/* Editable dose */}
              {editingId === currentMed.id ? (
                <div className="flex items-center gap-1.5">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 mb-0.5">Min–Max {currentMed.unit}</p>
                    <div className="flex gap-1 items-center">
                      <input
                        type="number"
                        value={editVal.min}
                        onChange={e => setEditVal(v => ({ ...v, min: e.target.value }))}
                        className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-xs text-center"
                      />
                      <span className="text-xs text-slate-400">–</span>
                      <input
                        type="number"
                        value={editVal.max}
                        onChange={e => setEditVal(v => ({ ...v, max: e.target.value }))}
                        className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-xs text-center"
                      />
                    </div>
                  </div>
                  <button onClick={saveEdit} className="p-1 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
                    <Check className="h-4 w-4" />
                  </button>
                  <button onClick={() => setEditingId(null)} className="p-1 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200">
                    <X className="h-4 w-4" />
                  </button>
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
            <p className="text-sm">Selecciona un medicamento para calcular la dosis</p>
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 px-6 py-3">
        <p className="text-[11px] text-slate-400">
          Ref: Taketomo CK et al. Pediatric & Neonatal Dosage Handbook (Lexicomp) · BNF for Children · Minsal Chile. Siempre verificar contra ficha técnica local y ajustar según clínica.
        </p>
      </div>
    </Card>
  );
}
