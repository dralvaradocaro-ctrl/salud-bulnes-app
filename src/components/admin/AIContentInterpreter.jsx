const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Sparkles, Upload, FileText, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AIContentInterpreter({ onTemplateSelected }) {
  const [content, setContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadedFile(file);
    toast.success('Archivo cargado');
  };

  const analyzeContent = async () => {
    if (!content && !uploadedFile) {
      toast.error('Agrega contenido o sube un archivo');
      return;
    }

    setIsAnalyzing(true);
    try {
      let fileUrl = null;
      let textToAnalyze = content;

      // Upload file if exists
      if (uploadedFile) {
        const uploadResult = await db.integrations.Core.UploadFile({ file: uploadedFile });
        fileUrl = uploadResult.file_url;
      }

      // Analyze with AI
      const prompt = `Analiza el siguiente contenido médico y determina qué tipo de plantilla o estructura sería más apropiada para organizarlo.

Contenido: ${textToAnalyze}

Devuelve un análisis que incluya:
1. El tipo de contenido identificado (protocolo, flujo clínico, guía de manejo, calculadora, etc.)
2. La plantilla recomendada (texto, flowchart, algorithm, medication, alert)
3. Cómo debería estructurarse el contenido
4. Sugerencias de categoría y subcategoría`;

      const result = await db.integrations.Core.InvokeLLM({
        prompt,
        file_urls: fileUrl ? [fileUrl] : undefined,
        response_json_schema: {
          type: 'object',
          properties: {
            content_type: { type: 'string' },
            recommended_template: { type: 'string' },
            structure_suggestion: { type: 'string' },
            category_suggestion: { type: 'string' },
            subcategory_suggestion: { type: 'string' },
            key_points: { 
              type: 'array',
              items: { type: 'string' }
            }
          }
        }
      });

      setAnalysis(result);
    } catch (error) {
      toast.error('Error al analizar contenido');
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUseTemplate = () => {
    if (analysis && onTemplateSelected) {
      onTemplateSelected({
        template: analysis.recommended_template,
        category: analysis.category_suggestion,
        subcategory: analysis.subcategory_suggestion,
        suggestions: analysis
      });
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-purple-600 rounded-xl">
          <Sparkles className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">Asistente de Contenido IA</h3>
          <p className="text-sm text-slate-600">Sube un documento o pega texto para sugerir la mejor estructura</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* File Upload */}
        <div>
          <Label>Subir Documento (PDF, Word, Imagen)</Label>
          <div className="mt-2">
            <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 rounded-lg hover:border-purple-400 cursor-pointer transition-colors bg-white">
              <Upload className="h-5 w-5 text-slate-500" />
              <span className="text-sm text-slate-600">
                {uploadedFile ? uploadedFile.name : 'Seleccionar archivo'}
              </span>
              <input
                type="file"
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
            </label>
          </div>
        </div>

        {/* Text Input */}
        <div>
          <Label>O pega el contenido aquí</Label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Ej: Protocolo de manejo de hipoglicemia en pacientes hospitalizados..."
            rows={6}
            className="mt-2"
          />
        </div>

        {/* Analyze Button */}
        <Button
          onClick={analyzeContent}
          disabled={isAnalyzing || (!content && !uploadedFile)}
          className="w-full"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analizando contenido...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Analizar con IA
            </>
          )}
        </Button>

        {/* Analysis Results */}
        {analysis && (
          <div className="mt-6 space-y-4">
            <div className="bg-white rounded-xl p-5 border-2 border-green-200">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <h4 className="font-bold text-green-900">Análisis Completado</h4>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-slate-600">Tipo de Contenido</Label>
                  <p className="font-semibold text-slate-900">{analysis.content_type}</p>
                </div>

                <div>
                  <Label className="text-xs text-slate-600">Plantilla Recomendada</Label>
                  <p className="font-semibold text-purple-700">{analysis.recommended_template}</p>
                </div>

                <div>
                  <Label className="text-xs text-slate-600">Categoría Sugerida</Label>
                  <p className="text-slate-900">{analysis.category_suggestion}</p>
                </div>

                {analysis.subcategory_suggestion && (
                  <div>
                    <Label className="text-xs text-slate-600">Subcategoría</Label>
                    <p className="text-slate-900">{analysis.subcategory_suggestion}</p>
                  </div>
                )}

                <div>
                  <Label className="text-xs text-slate-600">Cómo Estructurar</Label>
                  <p className="text-sm text-slate-700">{analysis.structure_suggestion}</p>
                </div>

                {analysis.key_points?.length > 0 && (
                  <div>
                    <Label className="text-xs text-slate-600">Puntos Clave Identificados</Label>
                    <ul className="mt-2 space-y-1">
                      {analysis.key_points.map((point, idx) => (
                        <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                          <span className="text-purple-600">•</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <Button onClick={handleUseTemplate} className="w-full mt-4 bg-purple-600 hover:bg-purple-700">
                <FileText className="h-4 w-4 mr-2" />
                Usar Esta Plantilla
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}