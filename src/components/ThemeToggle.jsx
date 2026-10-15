import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
export default function ThemeToggle({ enabled = true }) {
  const [dark, setDark] = useState(() => { try { return localStorage.getItem('salud-bulnes-theme') === 'dark'; } catch { return false; } });
  useEffect(() => { document.documentElement.classList.toggle('dark', enabled && dark); try { localStorage.setItem('salud-bulnes-theme', dark ? 'dark' : 'light'); } catch { /* Use session preference. */ } }, [dark, enabled]);
  if (!enabled) return null;
  return <button type="button" className="rounded-full border border-slate-200 bg-white p-2 text-slate-700 shadow-sm" onClick={() => setDark(value => !value)} aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'} aria-pressed={dark} title={dark ? 'Modo claro' : 'Modo oscuro'}>{dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</button>;
}
