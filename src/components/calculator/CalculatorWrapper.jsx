import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, Printer, RotateCcw, User } from 'lucide-react';
import PrintableResult from './PrintableResult';
import { SERVICIOS, CAMAS } from '@/lib/hospitalSuggestions';

// Formato RUT chileno: 12345678K → 12.345.678-K.
// Acepta dígitos y "k"/"K". El último carácter es el dígito verificador.
function formatRut(raw) {
  if (!raw) return '';
  const clean = String(raw).replace(/[^0-9kK]/g, '').toUpperCase();
  if (!clean) return '';
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  if (!body) return dv;
  return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}`;
}

export default function CalculatorWrapper({ 
  title, 
  description,
  icon: Icon = Calculator,
  gradientFrom = 'blue',
  gradientTo = 'purple',
  children,
  inputs,
  onCalculate,
  result,
  onReset,
  showPatientInfo = true,
  printOnly = false
}) {
  const [patientInfo, setPatientInfo] = useState({
    name: '',
    rut: '',
    record: '',
    servicio: '',
    cama: '',
  });
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [printTimestamp, setPrintTimestamp] = useState(null);
  const [printError, setPrintError] = useState('');

  const patientValid = patientInfo.name.trim() !== '' && patientInfo.rut.trim() !== '';

  const handlePrint = () => {
    if (!patientValid) {
      setPrintError('Para imprimir es obligatorio anotar nombre y RUT del paciente.');
      return;
    }
    setPrintError('');
    setPrintTimestamp(new Date().toISOString());
    setIsPrintMode(true);
    setTimeout(() => {
      window.print();
      setIsPrintMode(false);
    }, 100);
  };

  const saveToHistory = (calculation) => {
    const history = JSON.parse(localStorage.getItem(`calc_history_${title}`) || '[]');
    history.unshift({
      ...calculation,
      timestamp: new Date().toISOString(),
      patientInfo: showPatientInfo ? patientInfo : null
    });
    localStorage.setItem(`calc_history_${title}`, JSON.stringify(history.slice(0, 10)));
  };

  const handleCalculateWithHistory = () => {
    const calcResult = onCalculate();
    if (calcResult) {
      saveToHistory({ inputs, result: calcResult });
    }
  };

  if (isPrintMode && result) {
    return (
      <PrintableResult
        title={title}
        inputs={inputs}
        result={result}
        patientInfo={patientInfo}
        generatedAt={printTimestamp}
      />
    );
  }

  return (
    <Card className={`p-6 bg-gradient-to-br from-${gradientFrom}-50 to-${gradientTo}-50 border-2 border-${gradientFrom}-200`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-3 bg-${gradientFrom}-600 rounded-xl`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          {description && <p className="text-sm text-slate-600">{description}</p>}
        </div>
      </div>

      {/* Datos del paciente — Nombre y RUT obligatorios para imprimir */}
      {showPatientInfo && (
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-slate-700 mb-2 font-semibold">
            <User className="h-4 w-4" />
            Información del paciente
            <span className="text-[10px] uppercase tracking-wide text-rose-600 font-bold ml-1">Nombre y RUT obligatorios para imprimir</span>
          </div>
          <div className="grid md:grid-cols-3 gap-3 p-4 bg-white rounded-lg border border-slate-200">
            <div>
              <Label className="text-xs">Nombre Paciente <span className="text-rose-600">*</span></Label>
              <Input
                value={patientInfo.name}
                onChange={(e) => setPatientInfo({...patientInfo, name: e.target.value})}
                placeholder="Obligatorio"
                className={`mt-1 ${!patientInfo.name.trim() ? 'border-rose-300 focus:border-rose-500' : ''}`}
              />
            </div>
            <div>
              <Label className="text-xs">RUT <span className="text-rose-600">*</span></Label>
              <Input
                value={patientInfo.rut}
                onChange={(e) => setPatientInfo({...patientInfo, rut: formatRut(e.target.value)})}
                placeholder="12.345.678-9"
                maxLength={12}
                inputMode="text"
                className={`mt-1 ${!patientInfo.rut.trim() ? 'border-rose-300 focus:border-rose-500' : ''}`}
              />
            </div>
            <div>
              <Label className="text-xs">Nº Ficha</Label>
              <Input
                value={patientInfo.record}
                onChange={(e) => setPatientInfo({...patientInfo, record: e.target.value})}
                placeholder="Opcional"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Servicio</Label>
              <input
                value={patientInfo.servicio}
                onChange={(e) => setPatientInfo({...patientInfo, servicio: e.target.value})}
                list="calc-servicio-suggestions"
                placeholder="MQ1, MQ2, Pediatría, Urgencia…"
                className="mt-1 w-full h-9 rounded-md border border-slate-200 px-3 text-sm focus:border-blue-400 focus:outline-none"
              />
              <datalist id="calc-servicio-suggestions">
                {SERVICIOS.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>
            <div>
              <Label className="text-xs">Cama</Label>
              <input
                value={patientInfo.cama}
                onChange={(e) => setPatientInfo({...patientInfo, cama: e.target.value})}
                list="calc-cama-suggestions"
                placeholder="1-1, 2-3, Aisl 5-1..."
                className="mt-1 w-full h-9 rounded-md border border-slate-200 px-3 text-sm focus:border-blue-400 focus:outline-none"
              />
              <datalist id="calc-cama-suggestions">
                {CAMAS.map(s => <option key={s} value={s} />)}
              </datalist>
            </div>
          </div>
          {printError && (
            <div className="mt-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded px-2 py-1.5">
              {printError}
            </div>
          )}
        </div>
      )}

      {/* Calculator Content */}
      {children}

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        {!(printOnly && result) && (
          <Button onClick={handleCalculateWithHistory} className="flex-1">
            <Calculator className="h-4 w-4 mr-2" />
            Calcular
          </Button>
        )}
        {result && (
          <>
            <Button
              variant="outline"
              onClick={handlePrint}
              disabled={!patientValid}
              title={!patientValid ? 'Para imprimir hay que anotar nombre y RUT del paciente' : 'Imprimir resultado'}
              className={`${printOnly ? 'flex-1' : ''} ${!patientValid ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Button variant="outline" onClick={onReset}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
