const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, FileText, Stethoscope, ArrowRight, Calculator } from 'lucide-react';
import { Input } from '@/components/ui/input';

import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { isHiddenClinicalTool } from '@/components/utils/hiddenContent';
import { calculatorReferences } from '@/components/calculators/catalog';

export default function GlobalSearch({ className = "", autoFocus = false }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchContent = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }
      
      setIsLoading(true);
      try {
        const [topics, tools] = await Promise.all([
          db.entities.Topic.list(),
          db.entities.ClinicalTool.list()
        ]);

        const queryLower = query.toLowerCase();
        
        const filteredTopics = topics.filter(t => 
          t.name?.toLowerCase().includes(queryLower) ||
          t.description?.toLowerCase().includes(queryLower) ||
          t.tags?.some(tag => tag.toLowerCase().includes(queryLower))
        ).map(t => ({ ...t, type: 'topic' }));

        const filteredTools = tools.filter(t =>
          !isHiddenClinicalTool(t) &&
          (
            t.name?.toLowerCase().includes(queryLower) ||
            t.specialty?.toLowerCase().includes(queryLower)
          )
        ).map(t => ({ ...t, type: 'tool' }));

        const filteredCalculators = calculatorReferences
          .filter(calc => calc.name.toLowerCase().includes(queryLower))
          .map(calc => ({ ...calc, type: 'calculator' }));

        setResults([
          ...filteredTopics.slice(0, 5),
          ...filteredTools.slice(0, 3),
          ...filteredCalculators.slice(0, 3)
        ]);
      } catch (error) {
        console.error('Search error:', error);
      }
      setIsLoading(false);
    };

    const debounce = setTimeout(searchContent, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Buscar patologías, protocolos, herramientas..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          autoFocus={autoFocus}
          className="w-full h-14 pl-12 pr-12 text-lg bg-white border-2 border-slate-200 rounded-2xl shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              inputRef.current?.focus();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (query.length >= 2) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50"
          >
            {isLoading ? (
              <div className="p-6 text-center text-slate-500">
                <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                Buscando...
              </div>
            ) : results.length > 0 ? (
              <div className="max-h-96 overflow-y-auto">
                {results.map((item, index) => (
                  <Link
                    key={`${item.type}-${item.id}`}
                    to={createPageUrl(
                      item.type === 'topic'
                        ? `TopicDetail?id=${item.id}`
                        : item.type === 'calculator'
                          ? `AllCalculators?calc=${item.id}`
                          : `ClinicalTools?tool=${item.id}`
                    )}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
                  >
                    <div className={`p-2 rounded-xl ${
                      item.type === 'topic'
                        ? 'bg-blue-100'
                        : item.type === 'calculator'
                          ? 'bg-purple-100'
                          : 'bg-emerald-100'
                    }`}>
                      {item.type === 'topic' ? (
                        <FileText className={`h-5 w-5 ${item.type === 'topic' ? 'text-blue-600' : 'text-emerald-600'}`} />
                      ) : item.type === 'calculator' ? (
                        <Calculator className="h-5 w-5 text-purple-600" />
                      ) : (
                        <Stethoscope className="h-5 w-5 text-emerald-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 truncate">{item.name}</p>
                      <p className="text-sm text-slate-500 truncate">
                        {item.type === 'topic'
                          ? item.subcategory || 'Patología'
                          : item.type === 'calculator'
                            ? 'Calculadora'
                            : item.specialty}
                      </p>
                    </div>
                    {item.has_local_protocol && (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                        Protocolo local
                      </span>
                    )}
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500">
                No se encontraron resultados para "{query}"
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
