import React, { useState } from 'react';
import { ExternalLink, Sparkles, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// URL pública donde está deployada la app medispense-scribe.
// Configurable via variable de entorno VITE_MEDISPENSE_URL.
// Por defecto apunta al deploy de Lovable de medispense-scribe.
const MEDISPENSE_URL =
  import.meta.env.VITE_MEDISPENSE_URL || 'https://medispense-scribe.lovable.app';

export default function PrescripcionInteligente() {
  const [iframeError, setIframeError] = useState(false);

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-blue-200 bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">Prescripción Inteligente</h1>
            <p className="text-xs text-blue-100">Sistema de prescripción asistida por IA</p>
          </div>
        </div>
        <Button
          asChild
          size="sm"
          variant="secondary"
          className="gap-1.5 bg-white text-blue-700 hover:bg-blue-50"
        >
          <a href={MEDISPENSE_URL} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
            Abrir en nueva pestaña
          </a>
        </Button>
      </header>

      {/* Iframe con la app */}
      <div className="relative flex-1 overflow-hidden">
        {iframeError ? (
          <div className="flex h-full items-center justify-center p-8">
            <div className="max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
              <AlertCircle className="mx-auto mb-3 h-10 w-10 text-amber-600" />
              <h2 className="mb-2 text-lg font-bold text-slate-900">
                No se pudo cargar la app embebida
              </h2>
              <p className="mb-4 text-sm text-slate-600">
                Es posible que la app de Prescripción Inteligente bloquee su carga en
                un iframe (X-Frame-Options) o que la URL configurada no esté
                disponible.
              </p>
              <Button asChild className="gap-1.5 bg-blue-600 hover:bg-blue-700">
                <a href={MEDISPENSE_URL} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Abrir en nueva pestaña
                </a>
              </Button>
              <p className="mt-4 text-xs text-slate-500">
                URL actual: <code className="rounded bg-white px-1 py-0.5">{MEDISPENSE_URL}</code>
              </p>
            </div>
          </div>
        ) : (
          <iframe
            src={MEDISPENSE_URL}
            title="Prescripción Inteligente — medispense-scribe"
            className="h-full w-full border-0"
            allow="clipboard-write; clipboard-read; microphone; camera"
            onError={() => setIframeError(true)}
          />
        )}
      </div>
    </div>
  );
}
