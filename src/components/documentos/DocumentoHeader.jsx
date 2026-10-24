import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, FileText, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MEDICO } from '@/lib/certificadoPdf';

const DOCUMENTOS = [
  { pagina: 'CertificadoMedico', titulo: 'Certificado médico' },
  { pagina: 'RecetaMedica', titulo: 'Receta médica' },
  { pagina: 'OrdenExamenes', titulo: 'Orden de exámenes' },
];
export default function DocumentoHeader({ pagina, onNuevo }) {
  const navigate = useNavigate();
  return <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
    <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-4">
      <Button variant="ghost" size="icon" aria-label="Volver" onClick={() => navigate(-1)}><ChevronLeft className="h-5 w-5" /></Button>
      <FileText className="h-6 w-6 shrink-0 text-blue-800" />
      <div className="min-w-0 flex-1"><h1 className="text-lg font-semibold text-slate-900">{DOCUMENTOS.find(d => d.pagina === pagina)?.titulo}</h1><p className="text-xs text-slate-500">Documentos clínicos · {MEDICO.nombre}</p></div>
      <nav aria-label="Documentos clínicos" className="flex w-full flex-wrap gap-2 lg:w-auto">
        {DOCUMENTOS.map(d => <Button key={d.pagina} asChild size="sm" variant={pagina === d.pagina ? 'default' : 'outline'}><Link to={`/${d.pagina}`} aria-current={pagina === d.pagina ? 'page' : undefined}>{d.titulo}</Link></Button>)}
        <Button variant="outline" size="sm" onClick={onNuevo}><RotateCcw className="mr-2 h-4 w-4" />Nuevo paciente</Button>
      </nav>
    </div>
  </header>;
}
