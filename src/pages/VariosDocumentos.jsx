const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import MultiTemplateGenerator from '@/components/templates/MultiTemplateGenerator';
import { usePacienteGeneral } from '@/lib/PacienteGeneral';
import { createPageUrl } from '@/utils';

// Tipos de RequestTemplate que no se ofrecen en Documentos.
const HIDDEN_TYPES = ['Estudio Endoscópico'];
const HIDDEN_CATEGORY_TYPES = [...HIDDEN_TYPES, 'Laboratorio Especial'];

// ?category=<id> limita las plantillas de la BD; ?forms=Ruta1,Ruta2 limita los formularios con
// página propia (lo que muestra la categoría); ?docs=id1,id2 deja documentos ya marcados.
export default function VariosDocumentos() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const categoryId = params.get('category');
  const forms = params.get('forms');
  const allowedRoutes = useMemo(() => forms ? forms.split(',') : null, [forms]);
  const [initialSelectedIds] = useState(() => (params.get('docs') || '').split(',').filter(Boolean));
  const general = usePacienteGeneral();
  const [initialData] = useState(() => ({ patient_name: general?.paciente?.nombre || '', patient_rut: general?.paciente?.rut || '' }));

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates', categoryId || 'all'],
    queryFn: () => categoryId ? db.entities.RequestTemplate.filter({ category_id: categoryId }) : db.entities.RequestTemplate.list('type'),
  });
  const visible = useMemo(() => templates.filter(template => !(categoryId ? HIDDEN_CATEGORY_TYPES : HIDDEN_TYPES).includes(template.type)), [templates, categoryId]);
  const goBack = () => (window.history.length > 1 ? navigate(-1) : navigate(createPageUrl('Templates')));

  if (isLoading) return <div className="p-8 text-sm text-slate-500">Cargando documentos…</div>;
  return <MultiTemplateGenerator templates={visible} allowedRoutes={allowedRoutes} initialSelectedIds={initialSelectedIds} initialData={initialData} onClose={goBack} />;
}
