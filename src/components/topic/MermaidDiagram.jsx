import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

let initialized = false;

function normalizeMermaidChart(chart) {
  return String(chart || '')
    .replace(/<br\s*\/?>/gi, '<br>')
    .trim();
}

export default function MermaidDiagram({ chart }) {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');
  const id = useRef(`mmd-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    let cancelled = false;
    const normalizedChart = normalizeMermaidChart(chart);

    if (!initialized) {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'neutral',
        flowchart: { curve: 'basis', useMaxWidth: true, htmlLabels: true, nodeSpacing: 40, rankSpacing: 36, padding: 10 },
        fontSize: 13,
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      });
      initialized = true;
    }

    setSvg('');
    setError('');

    if (!normalizedChart) {
      setError('Diagrama no disponible');
      return () => { cancelled = true; };
    }

    Promise.resolve()
      .then(() => mermaid.render(`${id.current}-${Date.now()}`, normalizedChart))
      .then(({ svg }) => {
        if (cancelled) return;
        setSvg(svg);
        setError('');
      })
      .catch((renderError) => {
        if (cancelled) return;
        console.error('Mermaid render error:', renderError);
        setSvg('');
        setError('No se pudo mostrar este algoritmo. Revisa el contenido clínico en las otras pestañas.');
      });

    return () => { cancelled = true; };
  }, [chart]);

  if (error) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-800">
        {error}
      </div>
    );
  }
  if (!svg) return <div className="h-24 animate-pulse rounded bg-slate-100" />;

  return (
    <div
      className="w-full overflow-x-auto [&_svg]:max-w-full [&_svg]:h-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
