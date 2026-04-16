import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  MapPin, 
  User, 
  ChevronDown, 
  ChevronUp,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

export default function FlowTimeline({ steps }) {
  const [expandedStep, setExpandedStep] = useState(null);

  if (!steps || steps.length === 0) return null;

  const sortedSteps = [...steps].sort((a, b) => a.step_number - b.step_number);

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-blue-400 to-blue-300"></div>

      <div className="space-y-4">
        {sortedSteps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative pl-16"
          >
            {/* Step number circle */}
            <div className="absolute left-0 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-200 flex items-center justify-center text-white font-bold text-lg">
              {step.step_number}
            </div>

            <div 
              className={`bg-white rounded-2xl border-2 transition-all duration-300 ${
                expandedStep === step.id 
                  ? 'border-blue-300 shadow-lg' 
                  : 'border-slate-100 hover:border-blue-200 hover:shadow-md'
              }`}
            >
              <button
                onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
                className="w-full p-5 text-left"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 text-lg mb-2">
                      {step.title}
                    </h4>
                    <div className="flex flex-wrap gap-3 text-sm">
                      {step.responsible && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-50 text-violet-700 rounded-full">
                          <User className="h-3.5 w-3.5" />
                          {step.responsible}
                        </span>
                      )}
                      {step.time_limit && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-full">
                          <Clock className="h-3.5 w-3.5" />
                          {step.time_limit}
                        </span>
                      )}
                      {step.location && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full">
                          <MapPin className="h-3.5 w-3.5" />
                          {step.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {expandedStep === step.id ? (
                      <ChevronUp className="h-5 w-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {expandedStep === step.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 border-t border-slate-100 pt-4">
                      {step.description && (
                        <p className="text-slate-600 mb-4 leading-relaxed">
                          {step.description}
                        </p>
                      )}

                      {step.derivation_options && step.derivation_options.length > 0 && (
                        <div className="mt-4">
                          <h5 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                            <ArrowRight className="h-4 w-4" />
                            Opciones de derivación
                          </h5>
                          <div className="space-y-2">
                            {step.derivation_options.map((option, idx) => (
                              <div 
                                key={idx}
                                className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl"
                              >
                                <CheckCircle2 className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-medium text-slate-800">
                                    {option.destination}
                                  </p>
                                  <p className="text-sm text-slate-600 mt-1">
                                    {option.condition}
                                  </p>
                                  {option.notes && (
                                    <p className="text-xs text-slate-500 mt-1 italic">
                                      {option.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {step.notes && (
                        <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
                          <p className="text-sm text-amber-800">
                            <strong>Nota:</strong> {step.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}