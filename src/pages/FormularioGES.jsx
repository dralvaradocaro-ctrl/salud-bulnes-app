import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GesFormulario from '@/components/ges/GesFormulario';

export default function FormularioGES() {
  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200 print:hidden">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link to={createPageUrl('Category?id=696ea6ff245ef362de4f431c')}>
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-base font-bold text-slate-900">Formulario de Constancia GES</h1>
            <p className="text-xs text-slate-500">Artículo 24°, Ley 19.966 · Patologías GES</p>
          </div>
        </div>
      </div>

      <GesFormulario />
    </div>
  );
}
