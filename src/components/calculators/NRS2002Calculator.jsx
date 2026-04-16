import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calculator, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import CalculatorWrapper from '../calculator/CalculatorWrapper';

export default function NRS2002Calculator() {
  const [screeningAnswers, setScreeningAnswers] = useState({
    lowIMC: null,
    weightLoss: null,
    reducedIntake: null,
    severeIllness: null
  });
  
  const [fullScore, setFullScore] = useState({
    nutritionalStatus: 0,
    diseaseSeverity: 0,
    age: 0
  });
  
  const [showFullAssessment, setShowFullAssessment] = useState(false);

  const screeningComplete = Object.values(screeningAnswers).every(v => v !== null);
  const needsFullAssessment = Object.values(screeningAnswers).some(v => v === true);

  const calculateTotalScore = () => {
    return fullScore.nutritionalStatus + fullScore.diseaseSeverity + fullScore.age;
  };

  const getInterpretation = (total) => {
    if (total >= 3) {
      return {
        level: 'Alto Riesgo Nutricional',
        color: 'text-red-700 bg-red-50 border-red-200',
        icon: AlertCircle,
        action: 'Derivación a Nutrición prioritaria',
        timing: 'Plazo: 48-72 horas hábiles',
        details: [
          'Evaluación nutricional completa',
          'Definición de intervención o soporte nutricional',
          'Monitoreo estrecho de ingesta'
        ]
      };
    } else if (total > 0) {
      return {
        level: 'Riesgo Nutricional Bajo',
        color: 'text-amber-700 bg-amber-50 border-amber-200',
        icon: Info,
        action: 'Requiere evaluación nutricional precoz',
        timing: 'Plazo: 5-7 días hábiles',
        details: [
          'Mantener vigilancia clínica',
          'Reevaluar ante deterioro o cambios en la ingesta',
          'Evaluación según criterio y demanda del equipo de nutrición'
        ]
      };
    } else {
      return {
        level: 'Sin Riesgo Nutricional',
        color: 'text-green-700 bg-green-50 border-green-200',
        icon: CheckCircle2,
        action: 'No requiere evaluación formal precoz',
        timing: 'Mantener vigilancia',
        details: [
          'Mantener vigilancia clínica',
          'Reevaluar ante deterioro o cambios en la ingesta',
          'Evaluación a criterio del equipo de nutrición'
        ]
      };
    }
  };

  const resetCalculator = () => {
    setScreeningAnswers({
      lowIMC: null,
      weightLoss: null,
      reducedIntake: null,
      severeIllness: null
    });
    setFullScore({
      nutritionalStatus: 0,
      diseaseSeverity: 0,
      age: 0
    });
    setShowFullAssessment(false);
  };

  const totalScore = calculateTotalScore();
  const interpretation = showFullAssessment && (fullScore.nutritionalStatus > 0 || fullScore.diseaseSeverity > 0) 
    ? getInterpretation(totalScore) 
    : null;

  const resultData = interpretation ? {
    score: totalScore,
    label: `Puntaje NRS-2002 (${fullScore.nutritionalStatus} + ${fullScore.diseaseSeverity} + ${fullScore.age})`,
    interpretation: `${interpretation.level} - ${interpretation.action}. ${interpretation.timing}`,
    recommendations: interpretation.details
  } : null;

  const inputsData = showFullAssessment ? {
    'Tamizaje inicial': Object.values(screeningAnswers).some(v => v === true) ? 'Alterado' : 'Normal',
    'Estado nutricional': `${fullScore.nutritionalStatus} puntos`,
    'Severidad enfermedad': `${fullScore.diseaseSeverity} puntos`,
    'Edad': fullScore.age === 1 ? '≥ 70 años' : '< 70 años'
  } : null;

  return (
    <CalculatorWrapper
      title="NRS-2002"
      description="Nutritional Risk Screening - Tamizaje Nutricional"
      icon={Calculator}
      gradientFrom="green"
      gradientTo="emerald"
      inputs={inputsData}
      result={resultData}
      onCalculate={() => resultData}
      onReset={resetCalculator}
    >

      {/* Etapa 1: Screening Inicial */}
      <div className="space-y-6">
        <div className="bg-white rounded-xl p-5 border border-slate-200">
          <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
            Tamizaje Inicial (4 preguntas)
          </h4>
          
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <Label className="text-sm font-semibold mb-2 block">1. ¿IMC &lt; 20,5 kg/m²?</Label>
              <div className="flex gap-2">
                <Button
                  variant={screeningAnswers.lowIMC === true ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setScreeningAnswers({...screeningAnswers, lowIMC: true})}
                >
                  Sí
                </Button>
                <Button
                  variant={screeningAnswers.lowIMC === false ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setScreeningAnswers({...screeningAnswers, lowIMC: false})}
                >
                  No
                </Button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg">
              <Label className="text-sm font-semibold mb-2 block">2. ¿Ha perdido peso en los últimos 3 meses?</Label>
              <div className="flex gap-2">
                <Button
                  variant={screeningAnswers.weightLoss === true ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setScreeningAnswers({...screeningAnswers, weightLoss: true})}
                >
                  Sí
                </Button>
                <Button
                  variant={screeningAnswers.weightLoss === false ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setScreeningAnswers({...screeningAnswers, weightLoss: false})}
                >
                  No
                </Button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg">
              <Label className="text-sm font-semibold mb-2 block">3. ¿Ha disminuido su ingesta alimentaria en la última semana?</Label>
              <div className="flex gap-2">
                <Button
                  variant={screeningAnswers.reducedIntake === true ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setScreeningAnswers({...screeningAnswers, reducedIntake: true})}
                >
                  Sí
                </Button>
                <Button
                  variant={screeningAnswers.reducedIntake === false ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setScreeningAnswers({...screeningAnswers, reducedIntake: false})}
                >
                  No
                </Button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg">
              <Label className="text-sm font-semibold mb-2 block">4. ¿Está el paciente gravemente enfermo?</Label>
              <div className="flex gap-2">
                <Button
                  variant={screeningAnswers.severeIllness === true ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setScreeningAnswers({...screeningAnswers, severeIllness: true})}
                >
                  Sí
                </Button>
                <Button
                  variant={screeningAnswers.severeIllness === false ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setScreeningAnswers({...screeningAnswers, severeIllness: false})}
                >
                  No
                </Button>
              </div>
            </div>
          </div>

          {screeningComplete && !needsFullAssessment && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-900">Sin riesgo nutricional actual</p>
                  <p className="text-sm text-green-700 mt-1">
                    Todas las respuestas son negativas. Mantener vigilancia clínica y reevaluar ante cambios.
                  </p>
                </div>
              </div>
            </div>
          )}

          {screeningComplete && needsFullAssessment && !showFullAssessment && (
            <div className="mt-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-amber-900">Tamizaje Alterado</p>
                    <p className="text-sm text-amber-700 mt-1">
                      Al menos una respuesta es positiva. Debe completarse la Etapa 2 del NRS-2002.
                    </p>
                  </div>
                </div>
              </div>
              <Button onClick={() => setShowFullAssessment(true)} className="w-full">
                Continuar a Evaluación Formal →
              </Button>
            </div>
          )}
        </div>

        {/* Etapa 2: Evaluación Formal */}
        {showFullAssessment && (
          <div className="bg-white rounded-xl p-5 border border-slate-200">
            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
              Evaluación Formal Completa
            </h4>

            <div className="space-y-6">
              {/* Estado Nutricional */}
              <div>
                <Label className="font-semibold mb-3 block">Estado Nutricional</Label>
                <div className="space-y-2">
                  <button
                    onClick={() => setFullScore({...fullScore, nutritionalStatus: 0})}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                      fullScore.nutritionalStatus === 0 ? 'bg-blue-50 border-blue-500' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm"><strong>Normal:</strong> Estado nutricional normal</span>
                      <Badge variant="outline">0 pts</Badge>
                    </div>
                  </button>

                  <button
                    onClick={() => setFullScore({...fullScore, nutritionalStatus: 1})}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                      fullScore.nutritionalStatus === 1 ? 'bg-blue-50 border-blue-500' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold">Desnutrición Leve</span>
                      <Badge variant="outline">1 pt</Badge>
                    </div>
                    <p className="text-xs text-slate-600">Pérdida de peso &gt;5% en 3 meses o ingesta 50-75% en última semana</p>
                  </button>

                  <button
                    onClick={() => setFullScore({...fullScore, nutritionalStatus: 2})}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                      fullScore.nutritionalStatus === 2 ? 'bg-blue-50 border-blue-500' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold">Desnutrición Moderada</span>
                      <Badge variant="outline">2 pts</Badge>
                    </div>
                    <p className="text-xs text-slate-600">Pérdida de peso &gt;5% en 2 meses, IMC 18,5-20,5 o ingesta 25-60% en última semana</p>
                  </button>

                  <button
                    onClick={() => setFullScore({...fullScore, nutritionalStatus: 3})}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                      fullScore.nutritionalStatus === 3 ? 'bg-blue-50 border-blue-500' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold">Desnutrición Grave</span>
                      <Badge variant="outline">3 pts</Badge>
                    </div>
                    <p className="text-xs text-slate-600">Pérdida de peso &gt;5% en 1 mes, IMC &lt;18,5 o ingesta 0-25% en última semana</p>
                  </button>
                </div>
              </div>

              {/* Severidad de Enfermedad */}
              <div>
                <Label className="font-semibold mb-3 block">Severidad de la Enfermedad</Label>
                <div className="space-y-2">
                  <button
                    onClick={() => setFullScore({...fullScore, diseaseSeverity: 0})}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                      fullScore.diseaseSeverity === 0 ? 'bg-purple-50 border-purple-500' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm"><strong>Ausente:</strong> Requerimientos nutricionales normales</span>
                      <Badge variant="outline">0 pts</Badge>
                    </div>
                  </button>

                  <button
                    onClick={() => setFullScore({...fullScore, diseaseSeverity: 1})}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                      fullScore.diseaseSeverity === 1 ? 'bg-purple-50 border-purple-500' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold">Leve</span>
                      <Badge variant="outline">1 pt</Badge>
                    </div>
                    <p className="text-xs text-slate-600">Fractura de cadera, pacientes crónicos con complicaciones, EPOC, hemodiálisis, diabetes</p>
                  </button>

                  <button
                    onClick={() => setFullScore({...fullScore, diseaseSeverity: 2})}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                      fullScore.diseaseSeverity === 2 ? 'bg-purple-50 border-purple-500' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold">Moderada</span>
                      <Badge variant="outline">2 pts</Badge>
                    </div>
                    <p className="text-xs text-slate-600">Cirugía mayor abdominal, AVC, neumonía severa, tumores hematológicos</p>
                  </button>

                  <button
                    onClick={() => setFullScore({...fullScore, diseaseSeverity: 3})}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                      fullScore.diseaseSeverity === 3 ? 'bg-purple-50 border-purple-500' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold">Grave</span>
                      <Badge variant="outline">3 pts</Badge>
                    </div>
                    <p className="text-xs text-slate-600">Traumatismo craneoencefálico, trasplante medular, pacientes en cuidados intensivos (APACHE-10)</p>
                  </button>
                </div>
              </div>

              {/* Edad */}
              <div>
                <Label className="font-semibold mb-3 block">Ajuste por Edad</Label>
                <div className="space-y-2">
                  <button
                    onClick={() => setFullScore({...fullScore, age: 0})}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                      fullScore.age === 0 ? 'bg-green-50 border-green-500' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm">&lt; 70 años</span>
                      <Badge variant="outline">0 pts</Badge>
                    </div>
                  </button>

                  <button
                    onClick={() => setFullScore({...fullScore, age: 1})}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                      fullScore.age === 1 ? 'bg-green-50 border-green-500' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-sm">≥ 70 años</span>
                      <Badge variant="outline">+1 pt</Badge>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Resultado */}
            {(fullScore.nutritionalStatus > 0 || fullScore.diseaseSeverity > 0) && (
              <div className="mt-6">
                <div className="bg-slate-900 text-white rounded-xl p-5 mb-4">
                  <div className="text-center">
                    <p className="text-sm opacity-80 mb-1">Puntaje Total NRS-2002</p>
                    <p className="text-5xl font-bold">{calculateTotalScore()}</p>
                    <p className="text-xs opacity-70 mt-2">
                      ({fullScore.nutritionalStatus} nutricional + {fullScore.diseaseSeverity} severidad + {fullScore.age} edad)
                    </p>
                  </div>
                </div>

                {(() => {
                  const interpretation = getInterpretation(calculateTotalScore());
                  const Icon = interpretation.icon;
                  return (
                    <div className={`border-2 rounded-xl p-5 ${interpretation.color}`}>
                      <div className="flex items-start gap-3 mb-4">
                        <Icon className="h-6 w-6 mt-0.5" />
                        <div className="flex-1">
                          <h5 className="font-bold text-lg mb-1">{interpretation.level}</h5>
                          <p className="font-semibold">{interpretation.action}</p>
                          <p className="text-sm mt-1">{interpretation.timing}</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {interpretation.details.map((detail, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <span className="text-sm">•</span>
                            <span className="text-sm">{detail}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {(screeningComplete || showFullAssessment) && (
          <Button variant="outline" onClick={resetCalculator} className="w-full">
            Reiniciar Evaluación
          </Button>
        )}
      </div>
    </CalculatorWrapper>
  );
}