import React, { useState } from 'react';
import { ChevronDown, ChevronRight, FileText, CheckSquare, AlertCircle, ArrowRight, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const attentionData = [
  {
    category: "Cardiovascular",
    items: [
      {
        title: "Control/Ingreso Cardiovascular",
        actividad: "CONTROL DE SALUD CARDIOVASCULAR (+ INGRESO HEARTS si corresponde)",
        formulario: "SALUD CARDIOVASCULAR INTEGRAL",
        ordenInterna: "Control con nutricionista en 3-4-6 meses",
        color: "red"
      },
      {
        title: "Otras Atenciones Cardiovascular",
        descripcion: "Paciente sin exámenes actualizados, confirmación GES cardiovascular, revisión fondo de ojo, poli descompensados",
        actividad: "CONSULTA CARDIOVASCULAR (+ POLI DE COMPENSACIÓN si es poli descompensado)",
        formulario: "Según necesidad",
        color: "red"
      }
    ]
  },
  {
    category: "Control No Cardiovascular",
    items: [
      {
        title: "Control Otros Problemas de Salud",
        descripcion: "Hipotiroidismo, artrosis, epilepsia, artritis reumatoide, LES, etc.",
        actividad: "CONTROL OTROS PROBLEMAS DE SALUD NO CARDIOVASCULARES",
        formulario: "FORMULARIO DE CONTROL DE OTROS PROGRAMAS DE SALUD",
        nota: "Se rellena solo la patología en seguimiento",
        color: "purple"
      }
    ]
  },
  {
    category: "Sala ERA/IRA",
    items: [
      {
        title: "Control Sala ERA/IRA",
        actividad: "CONTROL SALA ERA/IRA/MIXTA",
        formulario: "FORMULARIO DE CONTROL DE OTROS PROGRAMAS DE SALUD",
        nota: "Se rellena solo la patología en seguimiento",
        color: "cyan"
      },
      {
        title: "Ingreso Sala IRA",
        actividad: "INGRESO SALA IRA",
        formulario: "Formulario de ingreso + PEDS QL por tramo etario",
        alerta: "Agregar PEDS QL según edad",
        color: "cyan"
      }
    ]
  },
  {
    category: "Salud Mental",
    items: [
      {
        title: "Control de Salud Mental",
        actividad: "CONTROLES DE SALUD MENTAL + PLAN DE CUIDADO INTEGRAL",
        formulario: "CONTROL DE SALUD MENTAL",
        alerta: "Si es ingreso o egreso: rellenar Cuestionario de Salud de Goldberg",
        color: "indigo"
      }
    ]
  },
  {
    category: "Pediátrico",
    items: [
      {
        title: "Control Niño Sano 1 Mes",
        actividad: "CONTROL DE SALUD + ENTREGA DE GUÍAS ANTICIPATORIAS",
        formularios: [
          "Control de Crecimiento y Desarrollo (Control Sano) con Chile Crece",
          "Score de riesgo IRA: si alterado → derivar a Kine y Sala de estimulación",
          "Protocolo neurosensorial: si alterado → derivar a Sala de estimulación"
        ],
        ordenInterna: "Control en 1 mes con enfermera",
        nota: "Importante rellenar alimentación y acompañamiento",
        color: "pink"
      },
      {
        title: "Control Niño Sano 3 Meses",
        actividad: "CONTROL DE SALUD + ENTREGA DE GUÍAS ANTICIPATORIAS",
        formularios: [
          "Control de Crecimiento y Desarrollo (Control Sano)",
          "Score de riesgo IRA"
        ],
        alerta: "Abrir GES sospecha displasia de cadera (CIE-10 Q65.8) y solicitar RX pelvis pediátrica por orden procedimiento/imágenes",
        color: "pink"
      }
    ]
  },
  {
    category: "Consultas y Morbilidad",
    items: [
      {
        title: "Consulta Morbilidad",
        actividad: "CONSULTA OTRAS MORBILIDADES",
        formulario: "Sin formulario",
        color: "amber"
      },
      {
        title: "Renovación de Receta (sin paciente)",
        actividad: "ACTIVIDAD ABREVIADA Y CONFECCIÓN DE RECETAS (si corresponde)",
        formulario: "Sin formulario",
        color: "amber"
      },
      {
        title: "Actividades Administrativas",
        descripcion: "Informe biomédico u otras actividades administrativas",
        actividad: "ACTIVIDAD ABREVIADA (SOS ACTIVIDAD ADMINISTRATIVA)",
        formulario: "Sin formulario",
        color: "amber"
      },
      {
        title: "Selector de Demanda",
        actividad: "CONSULTA OTRAS MORBILIDADES",
        formulario: "Sin formulario",
        color: "amber"
      },
      {
        title: "Atención Funcionarios (UST)",
        actividad: "CONSULTA OTRAS MORBILIDADES",
        formulario: "Sin formulario",
        color: "amber"
      }
    ]
  },
  {
    category: "Programas Especiales",
    items: [
      {
        title: "ECICEP",
        actividad: "Poner exactamente lo que sale en papel pegado en cada computador de los box",
        formulario: "Todos los formularios según programa atendido",
        color: "emerald"
      },
      {
        title: "Cuidados Paliativos",
        actividad: "CUIDADOS PALIATIVOS (+ otras actividades según tipo de atención, ej: Visita Domiciliaria Oncológica, actividad del cardio, etc.)",
        formulario: "Para ingreso: Formulario de Otros Programas de Salud (Otros: CP y AD) + los que correspondan",
        color: "emerald"
      },
      {
        title: "Dependencia Severa",
        actividad: "VISITA DOMICILIARIA NO ONCOLÓGICO (+ otras actividades según atención, ej: cardiovascular, morbilidad, etc.)",
        formulario: "Todos los formularios según programa atendido",
        color: "emerald"
      },
      {
        title: "Telesalud",
        actividad: "TELESALUD - Actividad que están realizando → Poner exactamente lo que sale en torpedo pegado bajo teclado",
        formulario: "Sin formulario",
        color: "emerald"
      },
      {
        title: "Poli TACO",
        actividad: "ACTIVIDAD ABREVIADA",
        formulario: "Sin formulario",
        color: "emerald"
      }
    ]
  },
  {
    category: "Salud de la Mujer",
    items: [
      {
        title: "Control Prenatal",
        actividad: "CONTROL PRENATAL + ENTREGA DE RESULTADO CHAGAS",
        formulario: "CONTROL PRENATAL",
        color: "fuchsia"
      },
      {
        title: "Control Climaterio",
        actividad: "CONTROL CLIMATERIO",
        formulario: "MRS",
        color: "fuchsia"
      }
    ]
  },
  {
    category: "Telemedicina",
    items: [
      {
        title: "Telemedicina - Consulta Nueva",
        actividad: "CONSULTAS MÉDICAS DE ESPECIALIDAD AMBULATORIA NUEVAS REALIZADAS POR TELEMEDICINA",
        formulario: "Sin formulario",
        color: "violet"
      },
      {
        title: "Telemedicina - Control",
        actividad: "CONSULTAS MÉDICAS DE ESPECIALIDAD AMBULATORIA CONTROL REALIZADAS POR TELEMEDICINA",
        formulario: "Sin formulario",
        color: "violet"
      }
    ]
  }
];

const colorClasses = {
  red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', accent: 'bg-red-100' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', accent: 'bg-purple-100' },
  cyan: { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', accent: 'bg-cyan-100' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', accent: 'bg-indigo-100' },
  pink: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', accent: 'bg-pink-100' },
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', accent: 'bg-amber-100' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', accent: 'bg-emerald-100' },
  fuchsia: { bg: 'bg-fuchsia-50', border: 'border-fuchsia-200', text: 'text-fuchsia-700', accent: 'bg-fuchsia-100' },
  violet: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', accent: 'bg-violet-100' }
};

export default function PolicinicGuide() {
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [expandedItem, setExpandedItem] = useState(null);

  const toggleCategory = (category) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const toggleItem = (categoryIndex, itemIndex) => {
    const key = `${categoryIndex}-${itemIndex}`;
    setExpandedItem(expandedItem === key ? null : key);
  };

  return (
    <div className="space-y-4">
      {/* Warning Banner */}
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-bold text-red-900 mb-2">⚠️ IMPORTANTE</h4>
            <p className="text-sm text-red-800 font-medium">
              NUNCA poner actividades que inicien con AG_ o que al registrar digan "NO CONTABILIZADA EN REM"
            </p>
          </div>
        </div>
      </div>

      {attentionData.map((section, categoryIndex) => (
        <div key={categoryIndex} className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden">
          <button
            onClick={() => toggleCategory(categoryIndex)}
            className="w-full p-5 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <h3 className="text-lg font-bold text-slate-900">{section.category}</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500 font-medium">{section.items.length} atenciones</span>
              {expandedCategory === categoryIndex ? (
                <ChevronDown className="h-5 w-5 text-slate-600" />
              ) : (
                <ChevronRight className="h-5 w-5 text-slate-600" />
              )}
            </div>
          </button>

          <AnimatePresence>
            {expandedCategory === categoryIndex && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-slate-200"
              >
                <div className="p-4 space-y-3">
                  {section.items.map((item, itemIndex) => {
                    const colors = colorClasses[item.color] || colorClasses.purple;
                    const itemKey = `${categoryIndex}-${itemIndex}`;
                    const isExpanded = expandedItem === itemKey;

                    return (
                      <div key={itemIndex} className={`rounded-xl border-2 ${colors.border} overflow-hidden`}>
                        <button
                          onClick={() => toggleItem(categoryIndex, itemIndex)}
                          className={`w-full p-4 ${colors.bg} hover:opacity-90 transition-opacity flex items-center justify-between`}
                        >
                          <div className="text-left flex-1">
                            <h4 className={`font-bold ${colors.text}`}>{item.title}</h4>
                            {item.descripcion && (
                              <p className="text-sm text-slate-600 mt-1">{item.descripcion}</p>
                            )}
                          </div>
                          {isExpanded ? (
                            <ChevronDown className={`h-5 w-5 ${colors.text} flex-shrink-0 ml-3`} />
                          ) : (
                            <ChevronRight className={`h-5 w-5 ${colors.text} flex-shrink-0 ml-3`} />
                          )}
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="bg-white"
                            >
                              <div className="p-4 space-y-4">
                                {/* Actividad */}
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <FileText className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm font-bold text-slate-700">ACTIVIDAD:</span>
                                  </div>
                                  <div className="pl-6 text-sm text-slate-900 font-medium bg-blue-50 p-3 rounded-lg">
                                    {item.actividad}
                                  </div>
                                </div>

                                {/* Formulario(s) */}
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <CheckSquare className="h-4 w-4 text-emerald-600" />
                                    <span className="text-sm font-bold text-slate-700">FORMULARIO:</span>
                                  </div>
                                  <div className="pl-6 space-y-2">
                                    {item.formularios ? (
                                      item.formularios.map((form, idx) => (
                                        <div key={idx} className="text-sm text-slate-900 bg-emerald-50 p-3 rounded-lg flex items-start gap-2">
                                          <ArrowRight className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                                          <span>{form}</span>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="text-sm text-slate-900 bg-emerald-50 p-3 rounded-lg">
                                        {item.formulario}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Orden Interna */}
                                {item.ordenInterna && (
                                  <div>
                                    <div className="flex items-center gap-2 mb-2">
                                      <Clock className="h-4 w-4 text-purple-600" />
                                      <span className="text-sm font-bold text-slate-700">ORDEN INTERNA:</span>
                                    </div>
                                    <div className="pl-6 text-sm text-slate-900 bg-purple-50 p-3 rounded-lg">
                                      {item.ordenInterna}
                                    </div>
                                  </div>
                                )}

                                {/* Nota */}
                                {item.nota && (
                                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                                    <p className="text-sm text-amber-900">
                                      <strong>Nota:</strong> {item.nota}
                                    </p>
                                  </div>
                                )}

                                {/* Alerta */}
                                {item.alerta && (
                                  <div className="bg-red-50 border-2 border-red-200 p-3 rounded-lg">
                                    <div className="flex items-start gap-2">
                                      <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                                      <p className="text-sm text-red-900 font-medium">
                                        {item.alerta}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}