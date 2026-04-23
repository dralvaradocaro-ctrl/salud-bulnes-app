import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import {
  Heart,
  Building2,
  Stethoscope,
  Siren,
  ClipboardList,
  ChevronRight,
  Baby,
  HeartHandshake
} from 'lucide-react';

const iconMap = {
  'Heart': Heart,
  'Building2': Building2,
  'Stethoscope': Stethoscope,
  'Siren': Siren,
  'ClipboardList': ClipboardList,
  'Baby': Baby,
  'HeartHandshake': HeartHandshake
};

const colorMap = {
  'blue': 'from-blue-500 to-blue-600 shadow-blue-200',
  'emerald': 'from-emerald-500 to-emerald-600 shadow-emerald-200',
  'violet': 'from-violet-500 to-violet-600 shadow-violet-200',
  'rose': 'from-rose-500 to-rose-600 shadow-rose-200',
  'amber': 'from-amber-500 to-amber-600 shadow-amber-200',
  'pink': 'from-pink-500 to-pink-600 shadow-pink-200'
};

export default function CategoryCard({ category, index }) {
  const Icon = iconMap[category.icon] || Heart;
  const colorClass = colorMap[category.color] || colorMap['blue'];
  const targetUrl = createPageUrl(`Category?id=${category.id}`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link
        to={targetUrl}
        className="group block"
      >
        <div className="relative bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 overflow-hidden">
          {/* Background gradient on hover */}
          <div className={`absolute inset-0 bg-gradient-to-br ${colorClass} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
          
          <div className="relative">
            <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${colorClass} shadow-lg mb-4`}>
              <Icon className="h-7 w-7 text-white" />
            </div>
            
            <h3 className="text-xl font-semibold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
              {category.name}
            </h3>
            
            <p className="text-slate-500 text-sm leading-relaxed mb-4">
              {category.description}
            </p>
            
            <div className="flex items-center text-sm font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
              Ver contenido
              <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
