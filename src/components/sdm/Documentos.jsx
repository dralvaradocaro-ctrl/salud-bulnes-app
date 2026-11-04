import React, { useEffect, useRef, useState } from 'react';
import { FileText, Printer, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import template from './documents/application-template.html?raw';
import { createApplicationValues, renderApplication } from './documents/application';
import { bindApplicationEditor } from './documents/application-editor';

export default function Documentos() {
  const values = useRef(createApplicationValues());
  const [documentHtml, setDocumentHtml] = useState(() => renderApplication(template, values.current, { editable: true }));
  const [revision, setRevision] = useState(0);
  const [ready, setReady] = useState(false);
  const preview = useRef(null);
  const detachEditor = useRef(null);

  function fitPreview() {
    const frame = preview.current;
    if (frame?.contentDocument) {
      frame.contentDocument.documentElement.style.setProperty('--preview-scale', String(Math.max(0.1, Math.min(1, (frame.clientWidth - 24) / 816))));
    }
  }

  useEffect(() => {
    const observer = new ResizeObserver(fitPreview);
    if (preview.current) observer.observe(preview.current);
    return () => observer.disconnect();
  }, [revision]);

  useEffect(() => () => detachEditor.current?.(), []);

  function loadEditor() {
    detachEditor.current?.();
    const doc = preview.current?.contentDocument;
    if (!doc) return;
    detachEditor.current = bindApplicationEditor(doc, values.current, next => { values.current = next; });
    fitPreview();
    setReady(true);
  }

  function print() {
    const frame = preview.current;
    for (const input of frame.contentDocument.querySelectorAll('input, select')) {
      if (!input.reportValidity()) return;
    }
    frame.contentDocument.activeElement?.blur();
    frame.contentWindow.focus();
    frame.contentWindow.print();
  }

  function reset() {
    if (!window.confirm('¿Restablecer la ficha y borrar los datos ingresados?')) return;
    values.current = createApplicationValues();
    setReady(false);
    setDocumentHtml(renderApplication(template, values.current, { editable: true }));
    setRevision(current => current + 1);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg"><FileText className="h-5 w-5" />Documentos</CardTitle>
        <CardDescription>Ficha de postulación a actividades de capacitación y perfeccionamiento</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button disabled={!ready} onClick={print} className="gap-2"><Printer className="h-4 w-4" />Imprimir / Guardar PDF</Button>
          <Button variant="outline" onClick={reset} className="gap-2"><RotateCcw className="h-4 w-4" />Restablecer</Button>
        </div>
        <p className="text-sm text-slate-600">Escribe en los campos resaltados y haz clic en las casillas para marcar o desmarcar opciones. Los resaltados no se imprimen.</p>
        <iframe key={revision} ref={preview} title="Ficha de capacitación editable" srcDoc={documentHtml}
          sandbox="allow-same-origin allow-modals" onLoad={loadEditor}
          className="h-[80vh] min-h-[500px] w-full rounded-md border bg-slate-200" />
      </CardContent>
    </Card>
  );
}
