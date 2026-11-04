import React, { useEffect, useRef, useState } from 'react';

const OPEN_DELAY = 80;
const CLOSE_DELAY = 180;
const SCROLL_GAP = 12;

// Índice lateral discreto: plegado son marcas finas en el margen izquierdo (una por sección, la visible más larga);
// al pasar el mouse o con el teclado aparecen los títulos junto a las marcas. Solo en pantallas anchas (xl),
// donde la columna de 1024 px deja margen libre. Marca la sección visible al hacer scroll.
export default function SideSectionIndex({ items = [] }) {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState(items[0]?.id || null);
  const timer = useRef(null);
  const ids = items.map(item => item.id).join('|');

  useEffect(() => () => window.clearTimeout(timer.current), []);

  // Sección activa: la que cruza la franja superior de la pantalla.
  useEffect(() => {
    const elements = items.map(item => document.getElementById(item.id)).filter(Boolean);
    if (elements.length === 0 || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-25% 0px -60% 0px' }
    );
    elements.forEach(el => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);

  if (items.length < 2) return null;

  // Desplazamiento suave hasta la sección (instantáneo si el sistema pide reducir movimiento),
  // dejando un margen para el encabezado fijo.
  const goTo = (event, id) => {
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    // Bajo el encabezado y la barra de pestañas fijos (su altura varía según la pantalla).
    const stickyBottom = Math.max(0, ...[...document.querySelectorAll('[data-sticky-header], .sticky')]
      .map(el => el.getBoundingClientRect())
      .filter(rect => rect.top >= 0 && rect.top < 240 && rect.height < 240)
      .map(rect => rect.bottom));
    const top = target.getBoundingClientRect().top + window.scrollY - stickyBottom - SCROLL_GAP;
    window.scrollTo({ top, behavior: reduce ? 'auto' : 'smooth' });
    window.history.replaceState(null, '', `#${id}`);
  };

  const schedule = (next, delay) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(next), delay);
  };

  return (
    <nav
      aria-label="Índice de esta sección"
      className="fixed left-5 top-1/2 z-30 hidden -translate-y-1/2 xl:block"
      onMouseEnter={() => schedule(true, OPEN_DELAY)}
      onMouseLeave={() => schedule(false, CLOSE_DELAY)}
      onFocus={() => schedule(true, 0)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) schedule(false, 0); }}
      onKeyDown={(e) => { if (e.key === 'Escape') { setOpen(false); e.currentTarget.querySelector('a')?.blur(); } }}
    >
      <ul
        className={`rounded-xl border p-1.5 transition-[background-color,border-color,box-shadow] duration-200 ease-out ${
          open ? 'border-slate-200 bg-white/95 shadow-[0_6px_20px_rgba(15,23,42,0.07)] backdrop-blur' : 'border-transparent bg-transparent shadow-none'
        }`}
      >
        {items.map(item => {
          const active = item.id === activeId;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={active ? 'location' : undefined}
                onClick={(e) => { goTo(e, item.id); setActiveId(item.id); schedule(false, 0); }}
                className="group flex h-7 items-center gap-2.5 rounded-md px-1.5 outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <span
                  aria-hidden="true"
                  className={`h-[2px] flex-none rounded-full transition-[width,background-color] duration-200 ease-out ${
                    active ? 'w-5 bg-slate-800' : 'w-3 bg-slate-300 group-hover:bg-slate-500'
                  }`}
                />
                <span
                  className={`overflow-hidden whitespace-nowrap text-[13px] leading-none transition-[max-width,opacity] duration-200 ease-out motion-reduce:transition-opacity ${
                    open ? 'max-w-[220px] opacity-100' : 'max-w-0 opacity-0'
                  } ${active ? 'font-semibold text-slate-900' : 'text-slate-600 group-hover:text-slate-900'}`}
                >
                  <span className="block truncate pr-1">{item.title}</span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
