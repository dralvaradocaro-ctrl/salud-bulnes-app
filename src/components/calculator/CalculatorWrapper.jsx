import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calculator, Printer, RotateCcw, User } from 'lucide-react';
import PrintableResult from './PrintableResult';

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
  showPatientInfo = true
}) {
  const [patientInfo, setPatientInfo] = useState({
    name: '',
    rut: '',
    record: ''
  });
  const [showPatient, setShowPatient] = useState(false);
  const [isPrintMode, setIsPrintMode] = useState(false);

  const handlePrint = () => {
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
      patientInfo: showPatient ? patientInfo : null
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
        patientInfo={showPatient ? patientInfo : null}
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

      {/* Patient Info (Optional) */}
      {showPatientInfo && (
        <div className="mb-6">
          <button
            onClick={() => setShowPatient(!showPatient)}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-2"
          >
            <User className="h-4 w-4" />
            {showPatient ? 'Ocultar' : 'Agregar'} información del paciente (opcional)
          </button>
          
          {showPatient && (
            <div className="grid md:grid-cols-3 gap-3 p-4 bg-white rounded-lg border border-slate-200">
              <div>
                <Label className="text-xs">Nombre Paciente</Label>
                <Input
                  value={patientInfo.name}
                  onChange={(e) => setPatientInfo({...patientInfo, name: e.target.value})}
                  placeholder="Opcional"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">RUT</Label>
                <Input
                  value={patientInfo.rut}
                  onChange={(e) => setPatientInfo({...patientInfo, rut: e.target.value})}
                  placeholder="Opcional"
                  className="mt-1"
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
            </div>
          )}
        </div>
      )}

      {/* Calculator Content */}
      {children}

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <Button onClick={handleCalculateWithHistory} className="flex-1">
          <Calculator className="h-4 w-4 mr-2" />
          Calcular
        </Button>
        {result && (
          <>
            <Button variant="outline" onClick={handlePrint}>
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