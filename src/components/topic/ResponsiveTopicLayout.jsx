import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { LinkIcon, Calculator, ExternalLink } from 'lucide-react';

const FLOW_COLORS = {
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', circle: 'bg-blue-600' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', circle: 'bg-purple-600' },
  green: { bg: 'bg-green-50', border: 'border-green-200', circle: 'bg-green-600' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', circle: 'bg-orange-600' },
  red: { bg: 'bg-red-50', border: 'border-red-200', circle: 'bg-red-600' }
};

export default function ResponsiveTopicLayout({ blocks = [], layoutMode = 'auto', relatedTopics = [], relatedTools = [] }) {
  const renderBlock = (block) => {
    const colorConfig = FLOW_COLORS[block.color] || FLOW_COLORS.blue;

    switch (block.type) {
      case 'text':
        return (
          <div key={block.id} className="bg-white rounded-2xl p-6 border border-slate-200">
            {block.title && (
              <h3 className="text-xl font-bold text-slate-900 mb-4">{block.title}</h3>
            )}
            <ReactMarkdown className="prose prose-slate max-w-none">
              {block.content}
            </ReactMarkdown>
          </div>
        );

      case 'flowchart':
      case 'algorithm':
        return (
          <div key={block.id} className="relative">
            <div className={`p-6 rounded-2xl border-2 ${colorConfig.bg} ${colorConfig.border}`}>
              {block.title && (
                <h3 className="text-lg font-bold text-slate-900 mb-3">{block.title}</h3>
              )}
              {block.description && (
                <p className="text-sm text-slate-700 mb-4">{block.description}</p>
              )}
              {block.details?.length > 0 && (
                <div className="space-y-2">
                  {block.details.map((detail, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm bg-white/70 rounded-lg p-3">
                      <span className="text-blue-600 font-bold min-w-[1.5rem]">{idx + 1}.</span>
                      <span className="text-slate-800">{detail}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'reference':
        if (!block.reference_id || !block.reference_label) return null;
        
        const isCalculator = block.reference_type === 'calculator';
        const linkUrl = isCalculator 
          ? createPageUrl(`AllCalculators?calc=${block.reference_id}`)
          : createPageUrl(`TopicDetail?id=${block.reference_id}`);

        return (
          <Link key={block.id} to={linkUrl}>
            <div className={`p-5 rounded-2xl border-2 transition-all hover:shadow-lg ${
              isCalculator 
                ? 'bg-purple-50 border-purple-200 hover:border-purple-300'
                : 'bg-blue-50 border-blue-200 hover:border-blue-300'
            }`}>
              <div className="flex items-center gap-3 mb-2">
                {isCalculator ? (
                  <Calculator className="h-5 w-5 text-purple-600" />
                ) : (
                  <LinkIcon className="h-5 w-5 text-blue-600" />
                )}
                <h4 className="font-bold text-slate-900">{block.title || 'Referencia'}</h4>
              </div>
              <p className="text-sm text-slate-700 mb-3">{block.reference_label}</p>
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink className="h-3 w-3" />
                {isCalculator ? 'Abrir calculadora' : 'Ver protocolo'}
              </Button>
            </div>
          </Link>
        );

      case 'alert':
        return (
          <div key={block.id} className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-200">
            {block.title && (
              <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                <span className="text-lg">⚠️</span>
                {block.title}
              </h4>
            )}
            {block.content && (
              <p className="text-sm text-amber-800">{block.content}</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Divide bloques por layout_position
  const mainBlocks = blocks.filter(b => !b.layout_position || b.layout_position === 'main' || b.layout_position === 'full');
  const sidebarBlocks = blocks.filter(b => b.layout_position === 'sidebar');

  // Layout Mode Logic
  const getLayoutClass = () => {
    if (layoutMode === 'single' || layoutMode === 'full-width') {
      return 'grid grid-cols-1 gap-6';
    }
    if (layoutMode === 'two-panel-6040' && sidebarBlocks.length > 0) {
      return 'grid lg:grid-cols-[60%_40%] gap-6';
    }
    if (layoutMode === 'two-panel-5050' && sidebarBlocks.length > 0) {
      return 'grid lg:grid-cols-2 gap-6';
    }
    if (layoutMode === 'two-panel-4060' && sidebarBlocks.length > 0) {
      return 'grid lg:grid-cols-[40%_60%] gap-6';
    }
    // Auto (responsive)
    return sidebarBlocks.length > 0 
      ? 'grid lg:grid-cols-[2fr_1fr] gap-6' 
      : 'grid grid-cols-1 gap-6';
  };

  return (
    <div className="space-y-8">
      <div className={getLayoutClass()}>
        {/* Main Column */}
        <div className="space-y-6 min-w-0">
          {mainBlocks.map(renderBlock)}
        </div>

        {/* Sidebar Column */}
        {sidebarBlocks.length > 0 && (
          <div className="space-y-6 min-w-0">
            {sidebarBlocks.map(renderBlock)}
          </div>
        )}
      </div>

      {/* Related Content */}
      {(relatedTopics?.length > 0 || relatedTools?.length > 0) && (
        <div className="mt-12 p-6 bg-slate-50 rounded-2xl border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Contenido Relacionado</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {relatedTopics?.map((ref, idx) => (
              <Link key={idx} to={createPageUrl(`TopicDetail?id=${ref.topic_id}`)}>
                <div className="p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <LinkIcon className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold text-slate-900">Protocol relacionado</span>
                  </div>
                  <p className="text-sm text-slate-600">{ref.label}</p>
                </div>
              </Link>
            ))}
            {relatedTools?.map((ref, idx) => (
              <Link key={idx} to={createPageUrl(`AllCalculators?calc=${ref.tool_id}`)}>
                <div className="p-4 bg-white rounded-xl border border-slate-200 hover:border-purple-300 transition-all">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="h-4 w-4 text-purple-600" />
                    <span className="font-semibold text-slate-900">Calculadora</span>
                  </div>
                  <p className="text-sm text-slate-600">{ref.label}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}