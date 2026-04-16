const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const AI_ACTIONS = [
  { id: 'interpret_document', label: '📄 Interpretar documento o texto libre', needsInput: true },
  { id: 'apply_protocol', label: 'Aplicar plantilla de protocolo clínico' },
  { id: 'restructure', label: 'Reestructurar a formato clínico estándar' },
  { id: 'optimize_summary', label: 'Crear/optimizar resumen clínico visual' },
  { id: 'text_to_blocks', label: 'Convertir texto plano a bloques estructurados' },
  { id: 'normalize_sections', label: 'Normalizar títulos y secciones' },
  { id: 'generate_toc', label: 'Generar índice de contenidos' },
  { id: 'improve_readability', label: 'Mejorar legibilidad y consistencia' }
];

/** Extrae texto de un PDF usando pdf.js */
async function extractPdfText(file) {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
  GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map(item => item.str).join(' ') + '\n';
  }
  return fullText.trim();
}

export default function AIContentActions({ currentContent, onApplyChanges, onClose }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [showDocumentInput, setShowDocumentInput] = useState(false);
  const [documentText, setDocumentText] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  const [extractingPdf, setExtractingPdf] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type === 'application/pdf') {
      setExtractingPdf(true);
      try {
        const text = await extractPdfText(file);
        setDocumentText(text);
        setUploadedFile(file);
        toast.success(`PDF leído: ${file.name} (${text.length} caracteres)`);
      } catch (err) {
        toast.error('No se pudo leer el PDF. Pega el texto manualmente.');
        console.error(err);
      } finally {
        setExtractingPdf(false);
      }
    } else {
      setUploadedFile(file);
      toast.success(`Archivo listo: ${file.name}`);
    }
  };

  const executeAction = async (actionId) => {
    if (actionId === 'interpret_document') {
      if (!documentText && !uploadedFile) {
        setShowDocumentInput(true);
        return;
      }
    }

    setIsProcessing(true);
    setResult(null);
    const toastId = toast.loading('Procesando con IA... (puede tardar 10-30 seg)');

    try {
      const actionPrompts = {
        interpret_document: `Eres un experto en convertir documentos médicos/clínicos en contenido estructurado para una plataforma educativa hospitalaria.

DOCUMENTO A INTERPRETAR:
${documentText || '(sin texto proporcionado)'}

INSTRUCCIONES:
1. Identifica si es un protocolo, guía clínica, algoritmo o documento educativo
2. Extrae TODO el contenido relevante sin omitir información
3. Estructura el contenido en bloques organizados y completos

BLOQUES A GENERAR:

Para PROTOCOLOS CLÍNICOS, genera:
- Bloque tipo "text" con título "Objetivo" y todo el objetivo/propósito
- Bloque tipo "text" con título "Definiciones" con todas las definiciones clave
- Bloques tipo "flowchart" para cada PASO del protocolo con:
  * title: nombre del paso
  * description: descripción breve
  * details: array con TODOS los puntos/acciones específicas del paso (mínimo 3-5 detalles por paso)
  * color: "blue" para pasos iniciales, "green" para acciones, "orange" para decisiones, "red" para alertas
- Bloque tipo "alert" para criterios de derivación o alertas importantes
- Bloque tipo "text" con "Referencias" si hay bibliografía

Para GUÍAS CLÍNICAS, genera:
- Bloque "text" con resumen ejecutivo
- Bloques "text" para cada sección (Diagnóstico, Tratamiento, etc.)
- Bloques "flowchart" para algoritmos de decisión
- Bloques "alert" para contraindicaciones o precauciones

IMPORTANTE:
- Cada bloque debe tener layout_position: "main"
- Los bloques flowchart deben tener detalles COMPLETOS en el array "details" (no resumir)
- Incluye TODA la información del documento, no omitas contenido
- Si hay dosis, medicamentos, criterios: ponlos en details como lista
- Genera entre 5-15 bloques dependiendo del contenido

Responde con este JSON exacto:
{
  "blocks": [array de bloques con type, title, content/description, details, color, layout_position],
  "structure": {
    "name": "Título descriptivo del protocolo/guía",
    "description": "Descripción breve y clara del contenido (1-2 líneas)"
  },
  "summary": "Resumen de lo que se generó"
}`,

        apply_protocol: `Analiza el siguiente contenido médico y aplica una plantilla de protocolo clínico estándar.

Contenido actual: ${JSON.stringify(currentContent)}

Crea una estructura con:
1. Resumen clínico objetivo
2. Criterios diagnósticos
3. Manejo paso a paso (flowchart)
4. Criterios de derivación

Responde con JSON: {"blocks": [...], "structure": {"name": "...", "description": "..."}, "summary": "..."}`,

        restructure: `Reestructura el siguiente contenido clínico en un formato profesional y estándar.

Contenido: ${JSON.stringify(currentContent)}

Organiza en secciones claras: Introducción, Diagnóstico, Manejo, Referencias.

Responde con JSON: {"blocks": [...], "structure": {"name": "...", "description": "..."}, "summary": "..."}`,

        text_to_blocks: `Convierte el siguiente texto en bloques estructurados (texto, flowchart, alertas).

Contenido: ${JSON.stringify(currentContent)}

Identifica pasos secuenciales, alertas importantes y texto descriptivo.

Responde con JSON: {"blocks": [...], "structure": {"name": "...", "description": "..."}, "summary": "..."}`,

        optimize_summary: `Crea un resumen clínico optimizado y visual del siguiente contenido.

Contenido: ${JSON.stringify(currentContent)}

Genera un resumen ejecutivo con puntos clave destacados.

Responde con JSON: {"blocks": [...], "structure": {"name": "...", "description": "..."}, "summary": "..."}`,

        normalize_sections: `Normaliza los títulos y secciones del siguiente contenido para que sigan un estándar consistente.

Contenido: ${JSON.stringify(currentContent)}

Usa nomenclatura médica estándar y jerarquía clara.

Responde con JSON: {"blocks": [...], "structure": {"name": "...", "description": "..."}, "summary": "..."}`,

        generate_toc: `Genera un índice de contenidos para el siguiente documento clínico.

Contenido: ${JSON.stringify(currentContent)}

Crea una tabla de contenidos navegable con enlaces a secciones.

Responde con JSON: {"blocks": [...], "structure": {"name": "...", "description": "..."}, "summary": "..."}`,

        improve_readability: `Mejora la legibilidad del siguiente contenido clínico manteniendo precisión médica.

Contenido: ${JSON.stringify(currentContent)}

Simplifica lenguaje complejo, estructura mejor los párrafos, añade listas donde aplique.

Responde con JSON: {"blocks": [...], "structure": {"name": "...", "description": "..."}, "summary": "..."}`
      };

      const response = await db.integrations.Core.InvokeLLM({
        prompt: actionPrompts[actionId],
        response_json_schema: { type: 'object' },
      });

      setResult(response);
      setShowDocumentInput(false);
      setDocumentText('');
      setUploadedFile(null);
    } catch (error) {
      toast.dismiss(toastId);
      toast.error(`Error IA: ${error?.message || 'Error desconocido'}`);
      console.error('[AIContentActions]', error);
    } finally {
      toast.dismiss(toastId);
      setIsProcessing(false);
    }
  };

  const handleApply = () => {
    if (result) {
      onApplyChanges(result);
    }
  };

  return (
    <Card className="p-5 bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-600 rounded-lg">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">Acciones de IA</h3>
            <p className="text-xs text-slate-600">La IA aplicará cambios reales al contenido</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
      </div>

      {showDocumentInput ? (
        <div className="space-y-4 bg-white rounded-lg p-4 border border-slate-200">
          <h4 className="font-semibold text-slate-900">Proporciona contenido para interpretar</h4>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Opción 1: Subir PDF (se extrae el texto automáticamente)
            </label>
            <input
              type="file"
              onChange={handleFileUpload}
              accept=".pdf,.txt"
              disabled={extractingPdf}
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
            />
            {extractingPdf && (
              <p className="text-xs text-purple-600 mt-1 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Leyendo PDF...
              </p>
            )}
            {uploadedFile && !extractingPdf && (
              <p className="text-xs text-green-600 mt-1">✓ {uploadedFile.name}</p>
            )}
          </div>

          <div className="text-center text-slate-500 text-sm font-medium">O</div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Opción 2: Pegar texto libre
            </label>
            <textarea
              value={documentText}
              onChange={(e) => setDocumentText(e.target.value)}
              placeholder="Pega aquí el texto de un protocolo, guía clínica, o cualquier contenido médico que desees estructurar..."
              className="w-full h-48 p-3 border border-slate-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => executeAction('interpret_document')}
              disabled={isProcessing || extractingPdf || !documentText}
              className="flex-1"
            >
              {isProcessing ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Procesando con IA...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" />Interpretar y Desarrollar</>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowDocumentInput(false);
                setDocumentText('');
                setUploadedFile(null);
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : !result ? (
        <div className="grid md:grid-cols-2 gap-2">
          {AI_ACTIONS.map(action => (
            <Button
              key={action.id}
              variant="outline"
              size="sm"
              onClick={() => executeAction(action.id)}
              disabled={isProcessing}
              className="justify-start text-left h-auto py-3"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              <span className="text-sm">{action.label}</span>
            </Button>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <h4 className="font-bold text-green-900">Cambios Generados</h4>
            </div>

            {result.summary && (
              <p className="text-sm text-slate-700 mb-3">{result.summary}</p>
            )}

            {result.blocks && (
              <div className="text-sm text-slate-600">
                <p>✓ {result.blocks.length} bloques nuevos creados</p>
              </div>
            )}

            {result.structure && (
              <div className="text-sm text-slate-600 mt-2">
                <p>✓ Estructura actualizada: {result.structure.name}</p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={handleApply} className="flex-1">
              Aplicar Cambios
            </Button>
            <Button variant="outline" onClick={() => setResult(null)}>
              Descartar
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
