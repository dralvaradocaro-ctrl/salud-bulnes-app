import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Aísla un documento imprimible del resto de la aplicación.
 *
 * El patrón anterior (`body * { visibility: hidden }` y volver visible sólo la
 * hoja) ocultaba la app pero le conservaba el espacio, así que la impresión
 * salía con las páginas de más. Aquí la hoja se cuelga directamente del `body`
 * y la regla descuelga (`display: none`) todo lo que no sea ella, de modo que
 * no puede ocultarse a sí misma por estar anidada en la app.
 */
export function usePrintHost() {
  const [host] = useState(() => {
    if (typeof document === 'undefined') return null;
    const element = document.createElement('div');
    element.setAttribute('data-print-root', '');
    return element;
  });

  useEffect(() => {
    if (!host) return undefined;
    document.body.appendChild(host);
    return () => { document.body.removeChild(host); };
  }, [host]);

  return host;
}

/** Regla común: fuera de impresión la hoja no existe; al imprimir, es lo único. */
export const PRINT_ISOLATION_CSS = `
  [data-print-root]{display:none}
  @media print{
    body > *:not([data-print-root]){display:none!important}
    [data-print-root]{display:block!important}
    html,body{background:#fff!important}
  }
`;

/**
 * Aislamiento para hojas que se imprimen donde están (una vista previa que es a
 * la vez el documento) y no se pueden colgar del body sin duplicarlas.
 *
 * `:not(:has(sel))` descuelga todo lo que no contiene la hoja, sin importar a
 * qué profundidad esté; los ancestros sí la contienen, así que sobreviven. Se
 * conservan las reglas de `visibility` como respaldo para navegadores sin
 * `:has()`, donde la regla anterior se descarta entera.
 */
export const inPlacePrintCss = selector => `
  @media print{
    body *{visibility:hidden!important}
    ${selector},${selector} *{visibility:visible!important}
    :not(:has(${selector})):not(${selector}):not(${selector} *){display:none!important}
    html,body{background:#fff!important}
  }
`;

/**
 * @param {object} props
 * @param {string} [props.css] Estilos propios de la hoja, ya dentro de @media print.
 */
export default function PrintSheet({ className = '', css = '', children }) {
  const host = usePrintHost();
  if (!host) return null;

  return createPortal(
    <>
      <style>{`${PRINT_ISOLATION_CSS}${css}`}</style>
      <div className={className}>{children}</div>
    </>,
    host,
  );
}
