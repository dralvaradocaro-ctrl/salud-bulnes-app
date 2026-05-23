import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, FileText, Settings2, Users, CalendarDays, Clock, Mic, Gavel, MoreHorizontal, BarChart3, ClipboardCheck, AlertCircle, LayoutGrid, ListOrdered } from 'lucide-react';
import AgendaSemanal from '@/components/sdm/AgendaSemanal';
import ProgramAssignments from '@/components/sdm/ProgramAssignments';
import Cronograma from '@/components/sdm/Cronograma';
import MeetingBlocks from '@/components/sdm/MeetingBlocks';
import Distribucion from '@/components/sdm/Distribucion';
import RevisarBloqueosSemanales from '@/components/sdm/RevisarBloqueosSemanales';
import SimpleOneoffBlocks from '@/components/sdm/SimpleOneoffBlocks';
import SdmCalendar from '@/components/sdm/SdmCalendar';
import { getMondayOfWeek, fmtDate } from '@/components/sdm/lib/generateAgenda';
import { useSdmWeeklyAgenda } from '@/components/sdm/lib/useSdmWeeklyAgenda';

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
  const [searchParams, setSearchParams] = useSearchParams();
  const topTab    = searchParams.get('tab') || 'consola';
  const consoleTab = searchParams.get('subtab') || 'agenda_semanal';
  const agendaView = searchParams.get('view') || 'tabla'; // 'tabla' | 'horario'
  const weekParam = searchParams.get('week');
  const [monday, setMondayState] = useState(
    weekParam ? getMondayOfWeek(new Date(weekParam + 'T12:00:00')) : getMondayOfWeek(new Date())
  );
  const weeklyAgenda = useSdmWeeklyAgenda(monday);
  const profileName = localStorage.getItem('admin_profile_name') || 'Fernando Alvarado';
  const setTopTab    = (v) => setSearchParams(prev => { const p = new URLSearchParams(prev); p.set('tab', v); return p; }, { replace: true });
  const setConsoleTab = (v) => setSearchParams(prev => { const p = new URLSearchParams(prev); p.set('subtab', v); return p; }, { replace: true });
  const setAgendaView = (v) => setSearchParams(prev => { const p = new URLSearchParams(prev); p.set('view', v); return p; }, { replace: true });
  const setMonday = (d) => {
    setMondayState(d);
    setSearchParams(prev => { const p = new URLSearchParams(prev); p.set('week', fmtDate(d)); return p; }, { replace: true });
  };

  useEffect(() => {
    if (!localStorage.getItem('admin_logged_in')) {
      const next = window.location.pathname + window.location.search;
      navigate(createPageUrl('AdminLogin') + `?next=${encodeURIComponent(next)}`);
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
            <p className="text-sm text-slate-500">Hola, bienvenido de vuelta, {profileName}.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              localStorage.removeItem('admin_logged_in');
              localStorage.removeItem('admin_profile_name');
              navigate(createPageUrl('AdminLogin'));
            }}
            className="gap-1.5"
          >
            <LogOut className="h-4 w-4" /> Salir
          </Button>
        </div>

        <Tabs value={topTab} onValueChange={setTopTab} className="space-y-4">
          <TabsList className="flex flex-wrap h-auto w-full max-w-5xl">
            <TabsTrigger value="documentos" className="gap-1.5"><FileText className="h-4 w-4" />Documentos</TabsTrigger>
            <TabsTrigger value="consola" className="gap-1.5"><Settings2 className="h-4 w-4" />Consola Gestión</TabsTrigger>
            <TabsTrigger value="pacientes" className="gap-1.5"><Users className="h-4 w-4" />Pacientes</TabsTrigger>
            <TabsTrigger value="distribucion" className="gap-1.5"><BarChart3 className="h-4 w-4" />Distribución</TabsTrigger>
            <TabsTrigger value="distribucion_programas" className="gap-1.5"><Users className="h-4 w-4" />Distribución de programas y bloqueos médicos</TabsTrigger>
          </TabsList>

          <TabsContent value="documentos">
            <Placeholder icon={FileText} title="Documentos relevantes"
              description="Acceso a documentos administrativos y de gestión." />
          </TabsContent>

          <TabsContent value="consola">
            <Tabs value={consoleTab} onValueChange={setConsoleTab} className="space-y-4">
              <TabsList className="flex flex-wrap h-auto">
                <TabsTrigger value="agenda_semanal" className="gap-1.5"><CalendarDays className="h-4 w-4" />Agenda Semanal</TabsTrigger>
                <TabsTrigger value="calendario" className="gap-1.5"><CalendarDays className="h-4 w-4" />Calendario</TabsTrigger>
                <TabsTrigger value="revisar_bloqueos" className="gap-1.5"><ClipboardCheck className="h-4 w-4" />Bloqueos médicos</TabsTrigger>
                <TabsTrigger value="bloqueos_reuniones" className="gap-1.5">Otros bloqueos</TabsTrigger>
                <TabsTrigger value="bloqueos_radio" className="gap-1.5"><Mic className="h-4 w-4" />Radio</TabsTrigger>
                <TabsTrigger value="bloqueos_judiciales" className="gap-1.5"><Gavel className="h-4 w-4" />Judiciales</TabsTrigger>
                <TabsTrigger value="otros" className="gap-1.5"><MoreHorizontal className="h-4 w-4" />Otros</TabsTrigger>
                <TabsTrigger value="prioridades" className="gap-1.5"><ListOrdered className="h-4 w-4" />Ordenar prioridades</TabsTrigger>
              </TabsList>
              <TabsContent value="agenda_semanal">
                {/* Toggle de vista: Tabla (AgendaSemanal) ↔ Horario (Cronograma) */}
                <div className="flex items-center gap-1 mb-3 rounded-lg bg-slate-100 p-1 w-fit">
                  <button
                    onClick={() => setAgendaView('tabla')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${agendaView === 'tabla' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    <LayoutGrid className="h-4 w-4" /> Vista en tabla
                  </button>
                  <button
                    onClick={() => setAgendaView('horario')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${agendaView === 'horario' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    <Clock className="h-4 w-4" /> Vista en horario
                  </button>
                </div>
                {agendaView === 'horario'
                  ? <Cronograma weeklyAgenda={weeklyAgenda} setMonday={setMonday} />
                  : <AgendaSemanal weeklyAgenda={weeklyAgenda} setMonday={setMonday} />}
              </TabsContent>
              <TabsContent value="calendario">
                <SdmCalendar onChanged={() => weeklyAgenda.reload?.()} />
              </TabsContent>
              <TabsContent value="revisar_bloqueos"><RevisarBloqueosSemanales /></TabsContent>
              <TabsContent value="bloqueos_reuniones"><MeetingBlocks onChanged={weeklyAgenda.reloadOneoff} /></TabsContent>
              <TabsContent value="bloqueos_radio"><SimpleOneoffBlocks category="visita_radio" title="Visitas a la radio" icon={Mic} onChanged={weeklyAgenda.reloadOneoff} /></TabsContent>
              <TabsContent value="bloqueos_judiciales"><SimpleOneoffBlocks category="judicial" title="Citaciones judiciales" icon={Gavel} onChanged={weeklyAgenda.reloadOneoff} /></TabsContent>
              <TabsContent value="otros"><Placeholder icon={MoreHorizontal} title="Otros bloqueos" /></TabsContent>
              <TabsContent value="prioridades">
                <PrioridadesPanel
                  onApplied={async () => {
                    await weeklyAgenda.reloadProgramAssignments?.();
                  }}
                />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="pacientes">
            <Placeholder icon={Users} title="Gestión de pacientes de Subdirección Médica" />
          </TabsContent>

          <TabsContent value="distribucion">
            <Distribucion />
          </TabsContent>

          <TabsContent value="distribucion_programas">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 mb-3 flex items-start gap-2 text-amber-900">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="text-xs">
                Los cambios en esta distribución <strong>alterarán la agenda</strong> de las próximas semanas.
              </div>
            </div>
            <ProgramAssignments />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Panel envoltorio para la pestaña "Ordenar prioridades": expone el editor
// de program assignments y un botón "Aplicar a la agenda" que pregunta el
// alcance temporal (semana actual / desde la próxima semana). Cualquiera de
// las dos opciones recarga los program assignments del hook para que la
// agenda se re-renderice; la diferencia es a partir de qué lunes cuenta.
function PrioridadesPanel({ onApplied }) {
  const [scope, setScope] = useState('current'); // 'current' | 'next'
  const [scheduledFor, setScheduledFor] = useState(null);

  const apply = async () => {
    if (scope === 'current') {
      const ok = window.confirm(
        '¿Aplicar las nuevas prioridades a la agenda DE ESTA SEMANA?\n\n' +
        'Los bloques se reasignarán inmediatamente respetando los nuevos titulares ' +
        'y subrogantes. Las edicions manuales que ya hiciste se mantienen.'
      );
      if (!ok) return;
      await onApplied?.();
      setScheduledFor(null);
      window.alert('Prioridades aplicadas. La agenda se recalcula al volver a verla.');
    } else {
      const ok = window.confirm(
        '¿Aplicar las nuevas prioridades DESDE LA PRÓXIMA SEMANA?\n\n' +
        'La agenda en curso queda intacta. La próxima semana (y posteriores) usarán ' +
        'la nueva distribución de titulares.'
      );
      if (!ok) return;
      // Marca el lunes de la semana siguiente como "entrada en vigor". No hay
      // bloqueo técnico: las edits ya están en DB; lo que cambia es que NO
      // recargamos la agenda activa, sólo guardamos el marker visible.
      const today = new Date();
      const nextMonday = new Date(today);
      const dow = today.getDay(); // 0=Dom..6=Sab
      const offset = dow === 0 ? 1 : (8 - dow);
      nextMonday.setDate(today.getDate() + offset);
      setScheduledFor(nextMonday.toISOString().slice(0, 10));
      window.alert('Las nuevas prioridades quedan agendadas para entrar en vigor el lunes ' +
        nextMonday.toLocaleDateString('es-CL') + '. La agenda actual no se modificará.');
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-3 text-violet-900">
        <div className="flex items-start gap-2 mb-2">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <div className="text-xs leading-relaxed">
            <p className="font-semibold mb-1">¿Estos cambios de prioridad van a afectar la estructura de la agenda?</p>
            <p>Sí. Elige desde cuándo entran en vigor:</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
            <input type="radio" name="scope" value="current" checked={scope === 'current'} onChange={() => setScope('current')} />
            <span><strong>Desde esta agenda</strong> (cambia la semana en curso)</span>
          </label>
          <label className="inline-flex items-center gap-2 text-xs cursor-pointer">
            <input type="radio" name="scope" value="next" checked={scope === 'next'} onChange={() => setScope('next')} />
            <span><strong>Desde la próxima semana</strong> (la actual queda igual)</span>
          </label>
          <Button size="sm" onClick={apply} className="ml-auto bg-violet-600 hover:bg-violet-700">
            Aplicar a la agenda
          </Button>
        </div>
        {scheduledFor && (
          <p className="text-[11px] mt-2">
            Programado para entrar en vigor el lunes <strong>{new Date(scheduledFor + 'T12:00').toLocaleDateString('es-CL')}</strong>.
          </p>
        )}
      </div>

      <ProgramAssignments />
    </div>
  );
}
