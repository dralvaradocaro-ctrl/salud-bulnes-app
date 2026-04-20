import React, { useState } from 'react';
import { BookOpenText, ChevronDown, ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function CalculatorReferences({ references = [], note }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!references.length) return null;

  return (
    <div className="mt-4">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(prev => !prev)}
        className="h-7 px-2 text-xs text-slate-500 hover:text-slate-700"
      >
        <BookOpenText className="h-3.5 w-3.5" />
        {note ? 'Referencias / Bibliografía' : 'Referencias'}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="mt-2 rounded-lg border border-slate-200 bg-white/80 p-3">
          <div className="space-y-2">
            {references.map((reference) => (
              <a
                key={reference.url}
                href={reference.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 text-sm text-slate-700 hover:text-slate-900"
              >
                <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                <span>{reference.label}</span>
              </a>
            ))}
          </div>

          {note && (
            <p className="mt-3 text-xs text-slate-500">
              {note}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
