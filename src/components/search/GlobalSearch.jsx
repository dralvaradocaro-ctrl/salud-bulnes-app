const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Stethoscope, ArrowRight, Calculator, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';

import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { isHiddenClinicalTool } from '@/components/utils/hiddenContent';
import { calculatorReferences } from '@/components/calculators/catalog';
import { getTopicVisual } from '@/lib/topicVisuals';
import { invokeLLM } from '@/lib/gemini';

// ── AI search ──────────────────────────────────────────────────────────────
async function fetchAISuggestions(query, topics, calculators) {
  const topicList = topics.map(t => `${t.name}${t.subcategory ? ' (' + t.subcategory + ')' : ''}`).join('\n');
  const calcList = calculators.map(c => c.name).join('\n');

  const prompt = `Eres un asistente clínico hospitalario. El usuario buscó: "${query}"

Temas clínicos disponibles:
${topicList}

Calculadoras disponibles:
${calcList}

Devuelve un JSON array con hasta 4 elementos que sean semánticamente relevantes para la consulta del usuario, considerando sinónimos, síntomas, nombres coloquiales o términos alternativos. Solo incluye ítems que existan exactamente en las listas anteriores.

Formato: [{ "name": "nombre exacto del ítem", "reason": "por qué es relevante en 6-10 palabras" }]

Si no hay nada relevante, devuelve [].`;

  const result = await invokeLLM({
    prompt,
    response_json_schema: { type: 'array' },
  });

  return Array.isArray(result) ? result : [];
}

export default function GlobalSearch({ className = "", autoFocus = false }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [aiResults, setAiResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Shared data cache to avoid double-fetching
  const dataCache = useRef(null);
  // Keep a ref to latest regular results for AI deduplication
  const resultsRef = useRef([]);

  async function loadData() {
    if (dataCache.current) return dataCache.current;
    const [topics, tools] = await Promise.all([
      db.entities.Topic.list(),
      db.entities.ClinicalTool.list()
    ]);
    dataCache.current = { topics, tools };
    return dataCache.current;
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Regular search (300ms debounce) ─────────────────────────────────────
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setAiResults([]);
      resultsRef.current = [];
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const { topics, tools } = await loadData();
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

        const newResults = [
          ...filteredTopics.slice(0, 5),
          ...filteredTools.slice(0, 3),
          ...filteredCalculators.slice(0, 3)
        ];
        resultsRef.current = newResults;
        setResults(newResults);
      } catch (err) {
        console.error('Search error:', err);
      }
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // ── AI search (800ms debounce) ───────────────────────────────────────────
  useEffect(() => {
    if (query.length < 3) {
      setAiResults([]);
      return;
    }

    setIsAiLoading(true);
    const timer = setTimeout(async () => {
      try {
        const { topics } = await loadData();
        const suggestions = await fetchAISuggestions(query, topics, calculatorReferences);

        // Match suggestions to real objects; exclude already-shown exact results
        const exactNames = new Set(resultsRef.current.map(r => r.name?.toLowerCase()));

        const matched = suggestions
          .filter(s => s.name && !exactNames.has(s.name.toLowerCase()))
          .map(s => {
            const topic = topics.find(t => t.name?.toLowerCase() === s.name.toLowerCase());
            const calc = calculatorReferences.find(c => c.name?.toLowerCase() === s.name.toLowerCase());
            if (topic) return { ...topic, type: 'topic', aiReason: s.reason };
            if (calc) return { ...calc, type: 'calculator', aiReason: s.reason };
            return null;
          })
          .filter(Boolean)
          .slice(0, 4);

        setAiResults(matched);
      } catch (err) {
        // AI failure → silent fallback
        setAiResults([]);
      }
      setIsAiLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [query]);

  const hasAnyResults = results.length > 0 || aiResults.length > 0;
  const showAiSection = !isAiLoading && aiResults.length > 0;
  const showDropdown = isOpen && query.length >= 2;

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
              setAiResults([]);
              inputRef.current?.focus();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50"
          >
            <div className="max-h-[32rem] overflow-y-auto">

              {/* ── Regular results ─────────────────────────────────── */}
              {isLoading ? (
                <div className="p-6 text-center text-slate-500">
                  <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  Buscando...
                </div>
              ) : results.length > 0 ? (
                results.map((item) => (
                  <ResultRow key={`${item.type}-${item.id}`} item={item} onClose={() => setIsOpen(false)} />
                ))
              ) : !isAiLoading && !showAiSection ? (
                <div className="p-6 text-center text-slate-500">
                  No se encontraron resultados para "{query}"
                </div>
              ) : null}

              {/* ── AI section ──────────────────────────────────────── */}
              {(isAiLoading || showAiSection) && (
                <div className={results.length > 0 ? 'border-t border-slate-100' : ''}>
                  {/* Header */}
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-50 to-purple-50">
                    <div className="p-1 bg-violet-100 rounded-lg">
                      <Sparkles className="h-3.5 w-3.5 text-violet-600" />
                    </div>
                    <span className="text-xs font-semibold text-violet-700 uppercase tracking-wider">
                      Resultados relacionados · IA
                    </span>
                    {isAiLoading && (
                      <div className="ml-auto animate-spin h-3.5 w-3.5 border-2 border-violet-400 border-t-transparent rounded-full" />
                    )}
                  </div>

                  {/* AI rows */}
                  {showAiSection && aiResults.map((item) => (
                    <ResultRow
                      key={`ai-${item.type}-${item.id}`}
                      item={item}
                      aiReason={item.aiReason}
                      onClose={() => setIsOpen(false)}
                    />
                  ))}
                </div>
              )}

              {/* Empty state when AI also has nothing */}
              {!isLoading && !isAiLoading && !hasAnyResults && (
                <div className="p-6 text-center text-slate-500">
                  No se encontraron resultados para "{query}"
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ResultRow({ item, aiReason, onClose }) {
  const topicVisual = item.type === 'topic' ? getTopicVisual(item) : null;
  const TopicIcon = topicVisual?.icon;

  return (
    <Link
      to={createPageUrl(
        item.type === 'topic'
          ? `TopicDetail?id=${item.id}`
          : item.type === 'calculator'
            ? `AllCalculators?calc=${item.id}`
            : `ClinicalTools?tool=${item.id}`
      )}
      onClick={onClose}
      className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
    >
      <div className={`p-2 rounded-xl flex-shrink-0 ${
        item.type === 'topic'
          ? `${topicVisual.bg} ring-1 ${topicVisual.ring}`
          : item.type === 'calculator'
            ? 'bg-purple-100'
            : 'bg-emerald-100'
      }`}>
        {item.type === 'topic' ? (
          <TopicIcon className={`h-5 w-5 ${topicVisual.text}`} />
        ) : item.type === 'calculator' ? (
          <Calculator className="h-5 w-5 text-purple-600" />
        ) : (
          <Stethoscope className="h-5 w-5 text-emerald-600" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-slate-900 truncate">{item.name}</p>
        <p className="text-sm text-slate-500 truncate">
          {aiReason
            ? aiReason
            : item.type === 'topic'
              ? item.subcategory || 'Patología'
              : item.type === 'calculator'
                ? 'Calculadora'
                : item.specialty}
        </p>
      </div>
      {item.has_local_protocol && (
        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full flex-shrink-0">
          Protocolo local
        </span>
      )}
      <ArrowRight className="h-4 w-4 text-slate-400 flex-shrink-0" />
    </Link>
  );
}
