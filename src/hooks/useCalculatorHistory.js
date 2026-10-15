import { useEffect, useState } from 'react';
const key = 'salud-bulnes-calculator-history-v1';
const read = () => { try { const data = JSON.parse(localStorage.getItem(key) || '{}'); return { favorites: Array.isArray(data.favorites) ? data.favorites.filter(x => typeof x === 'string') : [], recent: Array.isArray(data.recent) ? data.recent.filter(x => typeof x === 'string').slice(0, 8) : [] }; } catch { return { favorites: [], recent: [] }; } };
export default function useCalculatorHistory(activeId) {
  const [history, setHistory] = useState(read);
  useEffect(() => { if (activeId) setHistory(old => ({ ...old, recent: [activeId, ...old.recent.filter(id => id !== activeId)].slice(0, 8) })); }, [activeId]);
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(history)); } catch { /* Private browsing: keep the session usable. */ } }, [history]);
  const toggle = id => setHistory(old => ({ ...old, favorites: old.favorites.includes(id) ? old.favorites.filter(x => x !== id) : [...old.favorites, id] }));
  return { ...history, toggle };
}
