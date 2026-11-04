import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { Pill } from 'lucide-react';
import { supabase } from '@/medispense/integrations/supabase/client';
import { filterLocallyAvailableMedications } from '@/lib/localArsenal';
import { buildArsenalIndex, findArsenalTerms } from '@/lib/arsenalTerms';

// Catálogo del arsenal local (mismo caché que ArsenalMatch).
export function useArsenalCatalog() {
  return useQuery({
    queryKey: ['protocol-arsenal'], staleTime: 5 * 60 * 1000, retry: 1,
    queryFn: async () => {
      const { data, error } = await supabase.from('medications').select('id,name,active_ingredient,presentation,dose_value,dose_unit,restrictions,is_active').eq('is_active', true);
      if (error) throw error;
      return filterLocallyAvailableMedications(data);
    },
  });
}

const HIGHLIGHT = 'arsenal-med';
const HIGHLIGHT_HOVER = 'arsenal-med-hover';
const SKIP = 'script,style,textarea,input,select,svg,[contenteditable="true"],[data-no-arsenal]';

const caretAt = (x, y) => {
  if (document.caretPositionFromPoint) {
    const pos = document.caretPositionFromPoint(x, y);
    return pos && { node: pos.offsetNode, offset: pos.offset };
  }
  const range = document.caretRangeFromPoint?.(x, y);
  return range && { node: range.startContainer, offset: range.startOffset };
};
const contains = (rect, x, y) => x >= rect.left - 1 && x <= rect.right + 1 && y >= rect.top - 1 && y <= rect.bottom + 1;

// Destaca suavemente, dentro de `rootRef`, los medicamentos que están en el arsenal local y muestra sus
// presentaciones al pasar el mouse (o al tocar, en el teléfono). Usa la API de resaltado de CSS, así que no
// modifica el DOM que maneja React; en navegadores sin esa API no hace nada.
export default function ArsenalHighlighter({ rootRef }) {
  const { data } = useArsenalCatalog();
  const index = useMemo(() => buildArsenalIndex(data || []), [data]);
  const ranges = useRef([]);
  const hideTimer = useRef(0);
  const [tip, setTip] = useState(null); // { term, rect }
  const supported = typeof CSS !== 'undefined' && 'highlights' in CSS && typeof Highlight !== 'undefined';

  useEffect(() => {
    const root = rootRef.current;
    if (!supported || !root || !index) return undefined;
    let timer = 0;
    const scan = () => {
      const next = [];
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: node => (node.nodeValue.trim().length < 4 || node.parentElement?.closest(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
      });
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        findArsenalTerms(index, node.nodeValue).forEach(({ start, end, term }) => {
          const range = new Range();
          range.setStart(node, start);
          range.setEnd(node, end);
          next.push({ range, term, node });
        });
      }
      ranges.current = next;
      CSS.highlights.set(HIGHLIGHT, new Highlight(...next.map(item => item.range)));
    };
    const schedule = () => { window.clearTimeout(timer); timer = window.setTimeout(scan, 200); };
    scan();
    const observer = new MutationObserver(schedule);
    observer.observe(root, { subtree: true, childList: true, characterData: true });
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
      CSS.highlights.delete(HIGHLIGHT);
      CSS.highlights.delete(HIGHLIGHT_HOVER);
      ranges.current = [];
    };
  }, [rootRef, index, supported]);

  useEffect(() => {
    const root = rootRef.current;
    if (!supported || !root || !index) return undefined;
    let frame = 0;
    const hitTest = (x, y) => {
      const caret = caretAt(x, y);
      if (!caret) return null;
      return ranges.current.find(item => item.node === caret.node && [...item.range.getClientRects()].some(rect => contains(rect, x, y))) || null;
    };
    const show = hit => {
      window.clearTimeout(hideTimer.current);
      CSS.highlights.set(HIGHLIGHT_HOVER, new Highlight(hit.range));
      root.style.cursor = 'help';
      setTip(current => (current?.range === hit.range ? current : { term: hit.term, range: hit.range, rect: hit.range.getBoundingClientRect() }));
    };
    const hide = (delay = 120) => {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = window.setTimeout(() => {
        CSS.highlights.delete(HIGHLIGHT_HOVER);
        root.style.cursor = '';
        setTip(null);
      }, delay);
    };
    const onMove = event => {
      if (event.pointerType === 'touch') return;
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const hit = hitTest(event.clientX, event.clientY);
        if (hit) show(hit); else hide();
      });
    };
    const onTap = event => {
      if (event.pointerType !== 'touch') return;
      const hit = hitTest(event.clientX, event.clientY);
      if (hit) show(hit); else hide(0);
    };
    const onScroll = () => hide(0);
    const onLeave = () => hide();
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerleave', onLeave);
    root.addEventListener('pointerup', onTap);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerleave', onLeave);
      root.removeEventListener('pointerup', onTap);
      window.removeEventListener('scroll', onScroll);
      root.style.cursor = '';
    };
  }, [rootRef, index, supported]);

  if (!tip || !index) return null;
  const group = index.groups.get(tip.term);
  if (!group) return null;
  const below = tip.rect.top < 220;
  const left = Math.min(Math.max(12, tip.rect.left + tip.rect.width / 2 - 140), window.innerWidth - 292);
  return createPortal(
    <div
      role="tooltip"
      style={{ left, top: below ? tip.rect.bottom + 8 : undefined, bottom: below ? undefined : window.innerHeight - tip.rect.top + 8 }}
      className="pointer-events-none fixed z-[90] w-[280px] rounded-xl border border-emerald-100 bg-white/95 p-3 text-left shadow-[0_10px_30px_rgba(15,23,42,0.12)] backdrop-blur animate-in fade-in zoom-in-95 duration-200 ease-out motion-reduce:animate-none print:hidden"
    >
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
        <Pill className="h-3.5 w-3.5" aria-hidden="true" /> Arsenal local
      </p>
      <div className="space-y-2">
        {[...group.items].map(([ingredient, presentations]) => (
          <div key={ingredient}>
            <p className="text-sm font-semibold text-slate-900">{ingredient}</p>
            <ul className="mt-0.5 space-y-0.5">
              {[...presentations].map(item => <li key={item} className="text-xs text-slate-600">{item}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>,
    document.body,
  );
}
