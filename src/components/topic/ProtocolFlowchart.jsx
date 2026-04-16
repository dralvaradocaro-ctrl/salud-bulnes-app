import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, ChevronDown, ChevronRight, CheckCircle, Siren, Clock,
  Activity, AlertTriangle, Bell, Calendar, CheckCircle2, FileText, 
  GitBranch, Heart, Info, MapPin, Phone, Pill, Shield, Stethoscope, 
  User, Users, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProtocolFlowchart({ flowchart }) {
  const [expandedSteps, setExpandedSteps] = useState({});

  if (!flowchart || flowchart.length === 0) {
    return null;
  }

  const toggleStep = (index) => {
    setExpandedSteps(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Detectar urgencias que requieren derivación
  const isUrgentReferral = (step) => {
    const urgentKeywords = ['derivar urgente', 'derivación inmediata', 'emergencia', 'derivación urgente', 'siempre hhm', 'derivación precoz'];
    const text = `${step.title} ${step.description || ''} ${step.actions?.join(' ') || ''} ${step.alert || ''}`.toLowerCase();
    return urgentKeywords.some(keyword => text.includes(keyword));
  };

  // Detectar tiempos en el paso
  const extractTime = (step) => {
    const timePatterns = [
      /(\d+)\s*(horas?|hrs?|h)/i,
      /(\d+)\s*(minutos?|min)/i,
      /(\d+)\s*(d[ií]as?)/i,
      /(\d+)\s*(semanas?|sem)/i,
      /(inmediato|urgente|dentro de \d+)/i
    ];
    
    const text = `${step.title} ${step.description || ''} ${step.time_limit || ''}`;
    for (const pattern of timePatterns) {
      const match = text.match(pattern);
      if (match) return match[0];
    }
    return null;
  };

  const getColorClasses = (colorName) => {
    const colorMap = {
      blue: { bg: 'bg-blue-50', border: 'border-blue-200', circle: 'bg-blue-600' },
      purple: { bg: 'bg-purple-50', border: 'border-purple-200', circle: 'bg-purple-600' },
      green: { bg: 'bg-green-50', border: 'border-green-200', circle: 'bg-green-600' },
      orange: { bg: 'bg-orange-50', border: 'border-orange-200', circle: 'bg-orange-600' },
      red: { bg: 'bg-red-50', border: 'border-red-200', circle: 'bg-red-600' },
      indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', circle: 'bg-indigo-600' },
      pink: { bg: 'bg-pink-50', border: 'border-pink-200', circle: 'bg-pink-600' },
      teal: { bg: 'bg-teal-50', border: 'border-teal-200', circle: 'bg-teal-600' }
    };
    return colorMap[colorName] || colorMap.blue;
  };

  const getIconComponent = (iconName) => {
    const iconMap = {
      Activity, AlertCircle, AlertTriangle, Bell, Calendar, CheckCircle2,
      Clock, FileText, GitBranch, Heart, Info, MapPin, Phone,
      Pill, Shield, Siren, Stethoscope, User, Users, Zap
    };
    return iconMap[iconName] || FileText;
  };

  return (
    <div className="relative">
      <div className="absolute left-6 top-12 bottom-12 w-1 bg-gradient-to-b from-blue-200 via-purple-200 to-green-200"></div>
      
      <div className="space-y-6">
        {flowchart.map((step, index) => {
          const isExpanded = expandedSteps[index];
          const hasDetails = step.details?.length > 0 || step.actions?.length > 0 || step.description;
          const colorClasses = getColorClasses(step.color);
          const IconComponent = getIconComponent(step.icon);

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative pl-16"
            >
              <div className={`absolute left-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-lg ${colorClasses.circle}`}>
                <IconComponent className="h-6 w-6" />
              </div>

              <div className={`p-6 rounded-2xl border-2 ${colorClasses.bg} ${colorClasses.border}`}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-lg font-bold text-slate-900 flex-1">
                    {step.title}
                  </h3>
                  {hasDetails && (
                    <button
                      onClick={() => toggleStep(index)}
                      className="p-1.5 hover:bg-white/50 rounded-lg transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-slate-600" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-slate-600" />
                      )}
                    </button>
                  )}
                </div>
                
                {step.description && (
                  <p className="text-sm text-slate-700 mb-3">{step.description}</p>
                )}

                <AnimatePresence>
                  {isExpanded && hasDetails && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-2 mt-3"
                    >
                      {(step.details || step.actions || []).map((detail, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm bg-white/70 rounded-lg p-3">
                          <span className="text-blue-600 font-bold min-w-[1.5rem]">{i + 1}.</span>
                          <span className="text-slate-800">{detail}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}