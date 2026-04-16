import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import GlobalSearch from '@/components/search/GlobalSearch';
import { ChevronLeft, Calculator, Heart, Brain, Activity, Stethoscope, Baby } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import NIHSSCalculator from '@/components/calculators/NIHSSCalculator';
import HEARTScoreCalculator from '@/components/calculators/HEARTScoreCalculator';
import InsulinCorrectionCalculator from '@/components/calculators/InsulinCorrectionCalculator';
import MOCACalculator from '@/components/calculators/MOCACalculator';
import SRICalculator from '@/components/calculators/SRICalculator';
import NRS2002Calculator from '@/components/calculators/NRS2002Calculator';

const calculatorsByCategory = {
  'Urgencias': [
    { id: 'sri', name: 'SRI - Intubación Rápida', component: SRICalculator, icon: Activity }
  ],
  'Cardiología': [
    { id: 'heart', name: 'HEART Score', component: HEARTScoreCalculator, icon: Heart }
  ],
  'Neurología': [
    { id: 'nihss', name: 'NIHSS - Escala ACV', component: NIHSSCalculator, icon: Brain },
    { id: 'moca', name: 'MoCA - Cognición', component: MOCACalculator, icon: Brain }
  ],
  'Endocrinología': [
    { id: 'insulin', name: 'Corrección de Insulina', component: InsulinCorrectionCalculator, icon: Activity }
  ],
  'Nutrición': [
    { id: 'nrs2002', name: 'NRS-2002 - Riesgo Nutricional', component: NRS2002Calculator, icon: Stethoscope }
  ]
};

const categoryIcons = {
  'Urgencias': Activity,
  'Cardiología': Heart,
  'Neurología': Brain,
  'Endocrinología': Activity,
  'Nutrición': Stethoscope
};

const categoryColors = {
  'Urgencias': 'from-red-500 to-red-600',
  'Cardiología': 'from-rose-500 to-rose-600',
  'Neurología': 'from-violet-500 to-violet-600',
  'Endocrinología': 'from-amber-500 to-amber-600',
  'Nutrición': 'from-green-500 to-green-600'
};

export default function AllCalculators() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialCalc = urlParams.get('calc');
  
  const [activeCalculator, setActiveCalculator] = useState(initialCalc);

  const ActiveComponent = activeCalculator ? 
    Object.values(calculatorsByCategory)
      .flat()
      .find(c => c.id === activeCalculator)?.component 
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link to={createPageUrl('Home')}>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Calculadoras y Scores</h1>
              <p className="text-sm text-slate-500">Herramientas clínicas interactivas</p>
            </div>
          </div>
          <GlobalSearch />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {activeCalculator ? (
          <div>
            <Button 
              variant="ghost" 
              onClick={() => setActiveCalculator(null)}
              className="mb-4"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Ver todas las calculadoras
            </Button>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {ActiveComponent && <ActiveComponent />}
            </motion.div>

            {/* Other calculators */}
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Otras calculadoras</h3>
              <div className="grid md:grid-cols-3 gap-3">
                {Object.values(calculatorsByCategory).flat()
                  .filter(c => c.id !== activeCalculator)
                  .map((calc) => (
                    <button
                      key={calc.id}
                      onClick={() => setActiveCalculator(calc.id)}
                      className="p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all text-left"
                    >
                      <calc.icon className="h-5 w-5 text-blue-600 mb-2" />
                      <h4 className="font-medium text-slate-900 text-sm">{calc.name}</h4>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(calculatorsByCategory).map(([category, calcs]) => {
              const Icon = categoryIcons[category];
              const colorClass = categoryColors[category];

              return (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-xl bg-gradient-to-br ${colorClass}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900">{category}</h2>
                    <span className="text-sm text-slate-500">({calcs.length})</span>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {calcs.map((calc) => (
                      <button
                        key={calc.id}
                        onClick={() => setActiveCalculator(calc.id)}
                        className="group p-6 bg-white rounded-2xl border border-slate-100 hover:border-blue-300 hover:shadow-xl transition-all text-left"
                      >
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClass} w-fit mb-3`}>
                          <calc.icon className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {calc.name}
                        </h3>
                      </button>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}