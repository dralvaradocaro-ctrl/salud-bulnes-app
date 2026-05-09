import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, FileText, Settings2, Users, CalendarDays, Clock, Mic, Gavel, MoreHorizontal } from 'lucide-react';
import AgendaSemanal from '@/components/sdm/AgendaSemanal';
import ProgramAssignments from '@/components/sdm/ProgramAssignments';

function Placeholder({ icon: Icon, title, description }) {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-slate-600">
          <Icon className="h-5 w-5" /> {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="text-sm text-slate-500">
        Sección en construcción. Disponible en próxima iteración.
      </CardContent>
    </Card>
  );
}

export default function SubdireccionMedica() {
  const navigate = useNavigate();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('admin_logged_in')) {
      navigate(createPageUrl('AdminLogin'));
    } else {
      setAuthChecked(true);
    }
  }, [navigate]);

  if (!authChecked) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Subdirección Médica</h1>
            <p className="text-sm text-slate-500">Consola de gestión, documentos y pacientes</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { localStorage.removeItem('admin_logged_in'); navigate(createPageUrl('AdminLogin')); }}
            className="gap-1.5"
          >
            <LogOut className="h-4 w-4" /> Salir
          </Button>
        </div>

        <Tabs defaultValue="consola" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 max-w-2xl">
            <TabsTrigger value="documentos" className="gap-1.5"><FileText className="h-4 w-4" />Documentos</TabsTrigger>
            <TabsTrigger value="consola" className="gap-1.5"><Settings2 className="h-4 w-4" />Consola Gestión</TabsTrigger>
            <TabsTrigger value="pacientes" className="gap-1.5"><Users className="h-4 w-4" />Pacientes</TabsTrigger>
          </TabsList>

          <TabsContent value="documentos">
            <Placeholder icon={FileText} title="Documentos relevantes"
              description="Acceso a documentos administrativos y de gestión." />
          </TabsContent>

          <TabsContent value="consola">
            <Tabs defaultValue="agenda_semanal" className="space-y-4">
              <TabsList className="flex flex-wrap h-auto">
                <TabsTrigger value="agenda_semanal" className="gap-1.5"><CalendarDays className="h-4 w-4" />Agenda Semanal</TabsTrigger>
                <TabsTrigger value="agenda_diaria" className="gap-1.5"><Clock className="h-4 w-4" />Agenda Diaria</TabsTrigger>
                <TabsTrigger value="bloqueos_reuniones" className="gap-1.5">Bloqueos: Reuniones</TabsTrigger>
                <TabsTrigger value="bloqueos_radio" className="gap-1.5"><Mic className="h-4 w-4" />Radio</TabsTrigger>
                <TabsTrigger value="bloqueos_judiciales" className="gap-1.5"><Gavel className="h-4 w-4" />Judiciales</TabsTrigger>
                <TabsTrigger value="asignaciones" className="gap-1.5"><Users className="h-4 w-4" />Asignaciones</TabsTrigger>
                <TabsTrigger value="otros" className="gap-1.5"><MoreHorizontal className="h-4 w-4" />Otros</TabsTrigger>
              </TabsList>
              <TabsContent value="agenda_semanal">
                <AgendaSemanal />
              </TabsContent>
              <TabsContent value="agenda_diaria"><Placeholder icon={Clock} title="Agenda Diaria" /></TabsContent>
              <TabsContent value="bloqueos_reuniones"><Placeholder icon={CalendarDays} title="Bloqueos por reuniones" /></TabsContent>
              <TabsContent value="bloqueos_radio"><Placeholder icon={Mic} title="Bloqueos por visitas a la radio" /></TabsContent>
              <TabsContent value="bloqueos_judiciales"><Placeholder icon={Gavel} title="Bloqueos por situaciones judiciales" /></TabsContent>
              <TabsContent value="asignaciones"><ProgramAssignments /></TabsContent>
              <TabsContent value="otros"><Placeholder icon={MoreHorizontal} title="Otros bloqueos" /></TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="pacientes">
            <Placeholder icon={Users} title="Gestión de pacientes de Subdirección Médica" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
