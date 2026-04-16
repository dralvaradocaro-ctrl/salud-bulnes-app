import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, Check } from 'lucide-react';

export default function SRICalculator() {
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');
  const [hemodynamicInstability, setHemodynamicInstability] = useState(false);
  const [contraindicationsOpen, setContraindicationsOpen] = useState(false);
  const [contraindications, setContraindications] = useState({
    hipertensionIntracraneal: false,
    traumaCraneal: false,
    glaucomaAnguloCerrado: false,
    quemaduraMasiva: false,
    hiperkalemia: false,
    miopatiaNeuromuscular: false,
    alergiaSuccinilcolina: false
  });

  const w = parseFloat(weight) || 0;

  // Cálculo de dosis
  const doses = {
    fentanilo: (w * 1.5).toFixed(0), // 1-2 mcg/kg, promedio 1.5
    midazolam: (w * 0.05).toFixed(1), // 0.05-0.1 mg/kg
    etomidato: (w * 0.3).toFixed(1), // 0.2-0.4 mg/kg
    succinilcolina: (w * 1.5).toFixed(0), // 1-1.5 mg/kg
    rocuronio: (w * 1).toFixed(0) // 1-1.2 mg/kg
  };

  const tubeSize = sex === 'mujer' ? '7.0-7.5' : sex === 'hombre' ? '7.5-8.0' : '7.0-8.0';

  const hasContraindications = Object.values(contraindications).some(v => v);
  const useSuccinilcolina = !contraindications.hiperkalemia && 
                            !contraindications.quemaduraMasiva && 
                            !contraindications.miopatiaNeuromuscular &&
                            !contraindications.alergiaSuccinilcolina;

  const steps = [
    {
      time: 'T-10 min',
      title: 'PREPARACIÓN',
      description: 'Verificar equipo y materiales',
      items: [
        'Aspirador funcionando',
        'Laringoscopio con luz operativa',
        'Tubo endotraqueal (TET) adecuado + 1 tamaño mayor y menor',
        `TET recomendado: ${tubeSize} mm`,
        'Cuff del tubo probado',
        'Guía metálica (mandril)',
        'Máscara bolsa-válvula-reservorio',
        'Medicamentos preparados',
        'Monitor conectado (ECG, SatO2, PA)'
      ],
      color: 'bg-slate-100 border-slate-300'
    },
    {
      time: 'T-5 min',
      title: 'PREOXIGENACIÓN',
      description: 'O2 al 100% durante 3-5 minutos',
      items: [
        'Mascarilla con reservorio ajustada',
        'Flujo de O2: 15 L/min',
        'Objetivo: Saturación 100%',
        'Posición: Cabeza elevada 30° (rampa)',
        'Paciente cooperador: respiración tranquila',
        'Paciente no cooperador: ventilación asistida suave'
      ],
      color: 'bg-blue-100 border-blue-300'
    },
    {
      time: 'T-3 min',
      title: 'PREMEDICACIÓN',
      description: 'Analgesia y protección',
      items: [
        w > 0 ? `💉 Fentanilo: ${doses.fentanilo} mcg (${(doses.fentanilo/50).toFixed(1)} ml de amp 50mcg/ml)` : 'Ingresar peso del paciente',
        'Administrar 3 minutos antes de inducción',
        'Atenúa respuesta simpática a laringoscopia'
      ],
      medications: [
        { name: 'Fentanilo', dose: doses.fentanilo, unit: 'mcg', indication: '1-2 mcg/kg' }
      ],
      color: 'bg-purple-100 border-purple-300'
    },
    {
      time: 'T-0',
      title: 'INDUCCIÓN',
      description: 'Hipnótico',
      items: hemodynamicInstability ? [
        w > 0 ? `💉 ETOMIDATO: ${doses.etomidato} mg (${(doses.etomidato/2).toFixed(1)} ml)` : 'Ingresar peso del paciente',
        '⚠️ Paciente inestable: Preferir etomidato',
        'Menor efecto cardiovascular',
        'Inicio de acción: 30-60 seg'
      ] : [
        w > 0 ? `💉 Midazolam: ${doses.midazolam} mg (${doses.midazolam} ml)` : 'Ingresar peso del paciente',
        'O considerar Propofol 1-2 mg/kg si estable',
        'O Etomidato si compromiso hemodinámico',
        'Administrar en bolo rápido'
      ],
      medications: hemodynamicInstability ? [
        { name: 'Etomidato', dose: doses.etomidato, unit: 'mg', indication: '0.2-0.4 mg/kg' }
      ] : [
        { name: 'Midazolam', dose: doses.midazolam, unit: 'mg', indication: '0.05-0.1 mg/kg' }
      ],
      color: 'bg-amber-100 border-amber-300'
    },
    {
      time: 'T+10 seg',
      title: 'RELAJACIÓN MUSCULAR',
      description: 'Bloqueo neuromuscular',
      items: useSuccinilcolina ? [
        w > 0 ? `💉 SUCCINILCOLINA: ${doses.succinilcolina} mg` : 'Ingresar peso del paciente',
        'Inicio: 45-60 segundos',
        'Duración: 5-10 minutos',
        '⚠️ Contraindicaciones verificadas'
      ] : [
        w > 0 ? `💉 ROCURONIO: ${doses.rocuronio} mg` : 'Ingresar peso del paciente',
        '⚠️ Succinilcolina contraindicada',
        'Inicio: 60-90 segundos',
        'Duración: 30-40 minutos',
        'Considerar sugammadex disponible para reversión'
      ],
      medications: useSuccinilcolina ? [
        { name: 'Succinilcolina', dose: doses.succinilcolina, unit: 'mg', indication: '1-1.5 mg/kg' }
      ] : [
        { name: 'Rocuronio', dose: doses.rocuronio, unit: 'mg', indication: '1-1.2 mg/kg' }
      ],
      color: useSuccinilcolina ? 'bg-green-100 border-green-300' : 'bg-orange-100 border-orange-300',
      alert: !useSuccinilcolina
    },
    {
      time: 'T+60 seg',
      title: 'LARINGOSCOPIA E INTUBACIÓN',
      description: 'Técnica de intubación',
      items: [
        'Esperar apnea y relajación completa',
        'Maniobra de Sellick (presión cricoidea) - opcional',
        'Laringoscopia: visualizar cuerdas vocales',
        `Insertar TET ${tubeSize} mm hasta que cuff pase cuerdas`,
        'Inflar cuff con 5-10 ml de aire',
        'Retirar guía metálica',
        'Conectar a ventilador',
        '✓ VERIFICAR: Auscultación bilateral',
        '✓ VERIFICAR: Capnografía (onda cuadrada)',
        '✓ VERIFICAR: Condensación en tubo',
        'Fijar TET (marca a nivel de comisura labial)'
      ],
      color: 'bg-red-100 border-red-300'
    },
    {
      time: 'Post-IOT',
      title: 'CONFIRMACIÓN Y SEDACIÓN',
      description: 'Mantención y confirmación',
      items: [
        '📊 Capnografía continua (gold standard)',
        '🎯 EtCO2 objetivo: 35-45 mmHg',
        '📸 Radiografía de tórax (punta TET: 2-4 cm sobre carina)',
        '💊 Sedación continua según necesidad',
        '💊 Analgesia continua',
        'Ajustar parámetros ventilatorios',
        'Reevaluar hemodinamia',
        'Asegurar vía aérea (fijación adecuada)'
      ],
      color: 'bg-emerald-100 border-emerald-300'
    }
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
        <h3 className="text-xl font-bold text-red-900 mb-6 flex items-center gap-2">
          <AlertCircle className="h-6 w-6" />
          Calculadora de Secuencia Rápida de Intubación
        </h3>

        {/* Datos del Paciente */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div>
            <Label className="text-sm font-medium mb-2 block">Peso (kg) *</Label>
            <Input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="70"
              className="bg-white"
            />
          </div>
          <div>
            <Label className="text-sm font-medium mb-2 block">Edad (años)</Label>
            <Input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="45"
              className="bg-white"
            />
          </div>
          <div>
            <Label className="text-sm font-medium mb-2 block">Sexo</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={sex === 'hombre' ? 'default' : 'outline'}
                onClick={() => setSex('hombre')}
                className="flex-1"
              >
                Hombre
              </Button>
              <Button
                type="button"
                variant={sex === 'mujer' ? 'default' : 'outline'}
                onClick={() => setSex('mujer')}
                className="flex-1"
              >
                Mujer
              </Button>
            </div>
          </div>
        </div>

        {/* Condiciones especiales */}
        <div className="bg-white rounded-lg p-4 mb-6 space-y-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={hemodynamicInstability}
              onCheckedChange={setHemodynamicInstability}
            />
            <span className="text-sm font-medium">⚠️ Inestabilidad Hemodinámica (usar Etomidato)</span>
          </label>

          <div>
            <button
              onClick={() => setContraindicationsOpen(!contraindicationsOpen)}
              className="text-sm font-medium text-red-600 hover:text-red-700 flex items-center gap-1"
            >
              {contraindicationsOpen ? '▼' : '▶'} Contraindicaciones para Succinilcolina
            </button>
            
            {contraindicationsOpen && (
              <div className="mt-2 ml-4 space-y-2">
                {Object.entries({
                  hiperkalemia: 'Hiperkalemia',
                  quemaduraMasiva: 'Quemadura masiva (>24h)',
                  miopatiaNeuromuscular: 'Miopatía/Enfermedad neuromuscular',
                  alergiaSuccinilcolina: 'Alergia a succinilcolina',
                  traumaCraneal: 'Trauma craneal severo (↑PIC)',
                  hipertensionIntracraneal: 'Hipertensión intracraneal',
                  glaucomaAnguloCerrado: 'Glaucoma de ángulo cerrado'
                }).map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer text-sm">
                    <Checkbox
                      checked={contraindications[key]}
                      onCheckedChange={(checked) => 
                        setContraindications({...contraindications, [key]: checked})
                      }
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {!weight && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-sm text-yellow-800">
            ⚠️ Ingrese el peso del paciente para calcular las dosis de medicamentos
          </div>
        )}
      </Card>

      {/* Línea de Tiempo */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <Card key={index} className={`border-l-4 ${step.color} overflow-hidden`}>
            <div className="p-5">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="bg-white rounded-full px-3 py-1 text-sm font-bold text-slate-700 border-2 border-slate-300 shadow">
                    {step.time}
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900 text-lg mb-1">{step.title}</h4>
                  <p className="text-sm text-slate-600 mb-3">{step.description}</p>
                  
                  {step.alert && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3 flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-orange-800">
                        Succinilcolina contraindicada. Usar Rocuronio.
                      </span>
                    </div>
                  )}

                  <ul className="space-y-2">
                    {step.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className={item.includes('💉') ? 'font-semibold text-slate-900' : 'text-slate-700'}>
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm">
        <h4 className="font-semibold text-red-900 mb-2">⚠️ CONSIDERACIONES IMPORTANTES</h4>
        <ul className="space-y-1 text-red-800">
          <li>• Tener plan B y C listos (mascarilla laríngea, cricotiroidotomía)</li>
          <li>• Aspirador encendido y funcionando</li>
          <li>• Equipo entrenado y roles asignados</li>
          <li>• NUNCA intubar sin monitoreo</li>
          <li>• Documentar hora y parámetros de intubación</li>
        </ul>
      </div>
    </div>
  );
}