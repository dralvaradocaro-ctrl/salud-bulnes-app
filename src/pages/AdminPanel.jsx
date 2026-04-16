import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  FileText,
  Calculator,
  Users,
  Settings,
  ChevronRight,
  Home,
  Folder
} from 'lucide-react';

export default function AdminPanel() {
  const adminSections = [
    {
      title: 'Gestión de Contenido',
      items: [
        {
          title: 'Topics y Protocolos',
          description: 'Crear y editar contenido clínico',
          icon: FileText,
          link: 'AdminDashboard',
          color: 'from-blue-500 to-blue-600'
        },
        {
          title: 'Categorías',
          description: 'Organizar temas por especialidad',
          icon: Folder,
          link: 'AdminDashboard',
          color: 'from-purple-500 to-purple-600'
        }
      ]
    },
    {
      title: 'Herramientas',
      items: [
        {
          title: 'Calculadoras',
          description: 'Crear y gestionar calculadoras médicas',
          icon: Calculator,
          link: 'ToolsManager',
          color: 'from-green-500 to-green-600'
        }
      ]
    },
    {
      title: 'Administración',
      items: [
        {
          title: 'Usuarios',
          description: 'Gestionar accesos y permisos',
          icon: Users,
          link: 'AdminDashboard',
          color: 'from-amber-500 to-amber-600'
        },
        {
          title: 'Configuración',
          description: 'Ajustes de la aplicación',
          icon: Settings,
          link: 'AdminDashboard',
          color: 'from-slate-500 to-slate-600'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Panel de Administración</h1>
              <p className="text-sm text-slate-500 mt-1">Gestión completa del sistema</p>
            </div>
            <Link to={createPageUrl('Home')}>
              <Button variant="outline">
                <Home className="h-4 w-4 mr-2" />
                Ir al sitio
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {adminSections.map((section, idx) => (
            <div key={idx}>
              <h2 className="text-lg font-bold text-slate-900 mb-4">{section.title}</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {section.items.map((item, itemIdx) => (
                  <Link key={itemIdx} to={createPageUrl(item.link)}>
                    <Card className="p-6 hover:shadow-lg transition-all cursor-pointer group">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4`}>
                        <item.icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-sm text-slate-600 mb-4">{item.description}</p>
                      <div className="flex items-center text-sm text-blue-600 font-medium">
                        Acceder
                        <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}