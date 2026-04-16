import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pill, Clock, AlertCircle } from 'lucide-react';

export default function MedicationCard({ medications }) {
  if (!medications || medications.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Pill className="h-5 w-5 text-purple-600" />
        <h3 className="text-lg font-bold text-slate-900">Farmacoterapia</h3>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        {medications.map((med, index) => (
          <Card key={index} className="bg-gradient-to-br from-purple-50 to-white border-purple-200 p-5 hover:shadow-lg transition-all">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-600 rounded-xl flex-shrink-0">
                <Pill className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-slate-900 mb-2">{med.name}</h4>
                
                {med.dose && (
                  <div className="flex items-start gap-2 mb-2">
                    <Clock className="h-4 w-4 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-purple-700 mb-1">Dosis</p>
                      <p className="text-sm text-slate-700 font-semibold">{med.dose}</p>
                    </div>
                  </div>
                )}
                
                {med.indication && (
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-slate-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1">Indicación</p>
                      <p className="text-sm text-slate-600">{med.indication}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}