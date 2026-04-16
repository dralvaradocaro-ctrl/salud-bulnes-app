import React from 'react';
import { ArrowDown, AlertCircle } from 'lucide-react';

export default function FlowDiagram({ steps }) {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div key={index}>
          <div className={`relative p-6 rounded-2xl border-2 ${
            step.type === 'alert' 
              ? 'bg-red-50 border-red-200' 
              : step.type === 'decision'
              ? 'bg-amber-50 border-amber-200'
              : 'bg-blue-50 border-blue-200'
          }`}>
            {step.type === 'alert' && (
              <AlertCircle className="absolute top-4 right-4 h-5 w-5 text-red-600" />
            )}
            
            <div className="flex items-start gap-4">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                step.type === 'alert' ? 'bg-red-600' : 
                step.type === 'decision' ? 'bg-amber-600' : 'bg-blue-600'
              }`}>
                {index + 1}
              </div>
              
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 mb-2">{step.title}</h4>
                {step.description && (
                  <p className="text-sm text-slate-700 leading-relaxed mb-3">
                    {step.description}
                  </p>
                )}
                
                {step.options && (
                  <div className="space-y-2 mt-3">
                    {step.options.map((option, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className="font-semibold text-slate-700">•</span>
                        <span className="text-slate-700">{option}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {step.actions && (
                  <div className="mt-3 space-y-1">
                    {step.actions.map((action, i) => (
                      <div key={i} className="text-sm bg-white/60 px-3 py-2 rounded-lg">
                        ✓ {action}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {index < steps.length - 1 && (
            <div className="flex justify-center py-2">
              <ArrowDown className="h-6 w-6 text-slate-400" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}