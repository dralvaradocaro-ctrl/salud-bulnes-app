import { Link } from 'react-router-dom';
import { Briefcase, FileText, Lock } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { FORM_TONES, WORK_SECTIONS } from '@/lib/workspaceCatalog';

// Los módulos con `login` pasan por el ingreso de administrador y vuelven al módulo (igual que en Inicio).
const moduleUrl = module => (module.login
  ? `${createPageUrl('AdminLogin')}?next=${encodeURIComponent(createPageUrl(module.route))}`
  : createPageUrl(module.route));

export default function OperacionClinica() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pb-28">
      <h1 className="flex items-center gap-3 text-2xl font-bold text-slate-900"><Briefcase />Trabajo</h1>
      <p className="mb-8 mt-2 text-slate-600">
        Módulos con seguimiento durante el turno. Cada uno conserva sus requisitos de ingreso y permisos.
      </p>

      <div className="space-y-8">
        {WORK_SECTIONS.map(section => (
          <section key={section.id}>
            <h2 className="text-lg font-semibold text-slate-900">{section.title}</h2>
            <p className="mb-3 text-xs text-slate-500">{section.subtitle}</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {section.modules.map(module => {
                const tone = FORM_TONES[module.tone] || FORM_TONES.slate;
                return (
                  <Link key={module.route} to={moduleUrl(module)}
                    className={`group rounded-2xl border p-5 transition hover:shadow-md ${tone.card}`}>
                    <span className={`mb-3 inline-flex rounded-xl p-2.5 ${tone.icon}`}>
                      <module.Icon className="h-5 w-5 text-white" />
                    </span>
                    <h3 className="font-bold text-slate-900">{module.title}</h3>
                    <p className="mt-1.5 text-sm text-slate-600">{module.description}</p>
                    {module.login && (
                      <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-amber-700"><Lock className="h-3 w-3" />Requiere ingreso</p>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <Link to={createPageUrl('Templates')}
        className="mt-10 flex items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600 hover:border-violet-300 hover:text-violet-700">
        <FileText className="h-5 w-5 shrink-0" />
        <span>¿Buscas una receta, certificado, solicitud o notificación? Están en <strong className="font-semibold">Documentos</strong>.</span>
      </Link>
    </div>
  );
}
