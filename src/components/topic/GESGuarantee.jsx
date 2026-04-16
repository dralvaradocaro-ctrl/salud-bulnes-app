import React from 'react';
import { Shield, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GESGuarantee({ topic }) {
  if (!topic.guarantee_days && !topic.guarantee_details) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-6 text-white shadow-xl shadow-blue-200"
    >
      <div className="flex items-start gap-4">
        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
          <Shield className="h-8 w-8" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-1">Garantía GES</h3>
          <p className="text-blue-100 text-sm">Régimen de Garantías Explícitas en Salud</p>
        </div>
      </div>

      {topic.guarantee_days && (
        <div className="mt-6 flex items-center gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
          <Clock className="h-10 w-10 text-blue-200" />
          <div>
            <p className="text-sm text-blue-200">Plazo máximo</p>
            <p className="text-3xl font-bold">{topic.guarantee_days} días</p>
          </div>
        </div>
      )}

      {topic.guarantee_details && (
        <div className="mt-4 p-4 bg-white/10 rounded-2xl backdrop-blur-sm">
          <p className="text-blue-100 leading-relaxed whitespace-pre-line">
            {topic.guarantee_details}
          </p>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-full text-sm">
          <CheckCircle className="h-4 w-4" />
          Acceso garantizado
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 rounded-full text-sm">
          <AlertTriangle className="h-4 w-4" />
          Oportunidad
        </div>
      </div>
    </motion.div>
  );
}