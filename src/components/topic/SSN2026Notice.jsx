import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { isSSN2026UpdatedTopic } from '@/lib/ssn2026-updated-topics';

const AUTO_DISMISS_MS = 6000;
const FADE_MS = 400;

/**
 * Aviso amarillo discreto que se muestra una vez por sesión cuando el usuario
 * abre un protocolo que recibió ajustes derivados del Arsenal Básico SSÑ-2026.
 *
 * - Aparece arriba a la derecha al montar el topic.
 * - Se cierra solo a los 6 s con fade-out.
 * - Botón × cierra inmediatamente.
 * - sessionStorage evita que vuelva a aparecer en la misma sesión por topic.
 */
export default function SSN2026Notice({ topicId }) {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!topicId || !isSSN2026UpdatedTopic(topicId)) return;

    const key = `ssn2026-notice-shown:${topicId}`;
    if (typeof window === 'undefined') return;
    if (sessionStorage.getItem(key) === '1') return;

    sessionStorage.setItem(key, '1');
    setVisible(true);

    const fadeTimer = setTimeout(() => setFading(true), AUTO_DISMISS_MS - FADE_MS);
    const hideTimer = setTimeout(() => setVisible(false), AUTO_DISMISS_MS);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [topicId]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-4 right-4 z-50 max-w-sm rounded-lg border border-amber-300 bg-amber-50 shadow-lg p-3 pr-9 text-amber-900 transition-opacity duration-${FADE_MS} ${fading ? 'opacity-0' : 'opacity-100'}`}
    >
      <button
        type="button"
        onClick={() => setVisible(false)}
        aria-label="Cerrar aviso"
        className="absolute top-1.5 right-1.5 p-1 rounded hover:bg-amber-100 transition-colors"
      >
        <X className="h-3.5 w-3.5 text-amber-700" />
      </button>
      <div className="flex items-start gap-2">
        <span className="text-base leading-none mt-0.5">🆕</span>
        <div className="text-xs leading-snug">
          <p className="font-semibold mb-0.5">Novedad</p>
          <p>
            Este protocolo incorpora medicamentos del{' '}
            <strong>Arsenal Básico 2026 para Hospitales Comunitarios</strong>{' '}
            (Res. Ex. N°5754, Servicio de Salud Ñuble).
          </p>
        </div>
      </div>
    </div>
  );
}
