import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

let initialized = false;

export default function MermaidDiagram({ chart }) {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');
  const id = useRef(`mmd-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    if (!initialized) {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'neutral',
        flowchart: { curve: 'basis', useMaxWidth: true, htmlLabels: true },
        fontSize: 13,
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      });
      initialized = true;
    }
    if (!chart) return;
    mermaid.render(id.current, chart)
      .then(({ svg }) => { setSvg(svg); setError(''); })
      .catch(() => setError('Error al renderizar diagrama'));
  }, [chart]);

  if (error) return <p className="text-xs text-red-500 p-3">{error}</p>;
  if (!svg) return <div className="h-24 animate-pulse rounded bg-slate-100" />;

  return (
    <div
      className="w-full overflow-x-auto [&_svg]:max-w-full [&_svg]:h-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
