import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PolicinicTable({ data }) {
  const [expandedRows, setExpandedRows] = useState({});

  const toggleRow = (index) => {
    setExpandedRows(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gradient-to-r from-blue-50 to-blue-100">
            <th className="text-left p-4 font-semibold text-slate-700 border border-slate-200 w-12"></th>
            {data.headers.map((header, i) => (
              <th key={i} className="text-left p-4 font-semibold text-slate-700 border border-slate-200">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, index) => (
            <React.Fragment key={index}>
              <tr 
                className="hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => toggleRow(index)}
              >
                <td className="p-4 border border-slate-200 text-center">
                  {expandedRows[index] ? (
                    <ChevronDown className="h-4 w-4 text-blue-600 mx-auto" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-400 mx-auto" />
                  )}
                </td>
                {row.cells.map((cell, i) => (
                  <td key={i} className="p-4 border border-slate-200 font-medium text-slate-700">
                    {cell}
                  </td>
                ))}
              </tr>
              <AnimatePresence>
                {expandedRows[index] && row.details && (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <td colSpan={data.headers.length + 1} className="p-0 border border-slate-200">
                      <div className="bg-blue-50/50 p-4">
                        <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {row.details}
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                )}
              </AnimatePresence>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}