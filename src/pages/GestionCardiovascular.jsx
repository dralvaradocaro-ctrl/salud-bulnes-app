import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import CardiovascularWorkspace from '@/components/cardiovascular/CardiovascularWorkspace';
import { createPageUrl } from '@/utils';

export default function GestionCardiovascular() {
  const [params] = useSearchParams();
  const categoryId = params.get('categoryId');
  const returnUrl = categoryId
    ? createPageUrl(`Category?id=${encodeURIComponent(categoryId)}&tab=gestiones`)
    : createPageUrl('Home');

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-white to-teal-50 px-3 py-4 sm:px-6 lg:px-8">
      <Link to={returnUrl} className="mb-4 inline-flex items-center gap-1 rounded-lg py-2 text-sm font-semibold text-teal-800 hover:underline">
        <ChevronLeft className="h-4 w-4" />
        {categoryId ? 'Volver a Policlínico · Gestiones' : 'Volver al inicio'}
      </Link>
      <CardiovascularWorkspace />
    </div>
  );
}
