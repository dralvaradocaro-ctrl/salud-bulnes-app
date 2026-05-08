import { useState } from 'react';
import { Clock, HeartPulse, FlaskConical, Calendar, Menu, X } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'schedule-section', icon: Clock, label: 'Horario' },
  { id: 'cv-section', icon: HeartPulse, label: 'Cardiovascular' },
  { id: 'exams-section', icon: FlaskConical, label: 'Exámenes' },
  { id: 'prescriptions-section', icon: Calendar, label: 'Recetas' },
];

export function FloatingNav() {
  const [open, setOpen] = useState(false);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setOpen(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="mb-2 bg-card border rounded-xl shadow-lg p-2 space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors text-left"
            >
              <Icon className="h-4 w-4 text-primary shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className="h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors"
        aria-label="Navegación rápida"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
    </div>
  );
}
