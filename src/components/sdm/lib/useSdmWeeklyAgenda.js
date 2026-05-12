import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { sdmSupabase as supabase, explainSdmWriteError } from './sdmSupabase';
import { fmtDate, generateAgenda, weekDates } from './generateAgenda';

export function buildBlockSuggestions(blockTemplates) {
  const aliases = [
    { key: 'alias-cardiovascular', value: 'Cardiovascular', matchValue: 'cardiovascular', name: 'Gestión PSCV', category: 'gestion' },
    { key: 'alias-pscv', value: 'PSCV', matchValue: 'pscv', name: 'Gestión PSCV', category: 'gestion' },
  ];
  const fromTemplates = blockTemplates
    .filter(t => t?.name)
    .flatMap(t => {
      const main = { key: `tpl-${t.id}`, value: t.name, matchValue: t.name.trim().toLowerCase(), name: t.name, category: t.category || 'otro' };
      const compact = t.name.replace(/^Gestión\s+/i, '').trim();
      return compact && compact !== t.name
        ? [main, { ...main, key: `tpl-${t.id}-compact`, value: compact, matchValue: compact.toLowerCase() }]
        : [main];
    });
  const seen = new Set();
  return [...aliases, ...fromTemplates].filter(s => {
    if (seen.has(s.matchValue)) return false;
    seen.add(s.matchValue);
    return true;
  });
}

export function useSdmWeeklyAgenda(monday) {
  const [doctors, setDoctors] = useState([]);
  const [rotation, setRotation] = useState([]);
  const [shiftCalendar, setShiftCalendar] = useState([]);
  const [blockTemplates, setBlockTemplates] = useState([]);
  const [programAssignments, setProgramAssignments] = useState([]);
  const [absences, setAbsences] = useState([]);
  const [oneoffBlocks, setOneoffBlocks] = useState([]);
  const [reinforcements, setReinforcements] = useState({});
  const [bloqueosOverrides, setBloqueosOverrides] = useState({});
  const [poli8amOverrides, setPoli8amOverrides] = useState({});
  const [visitaOverrides, setVisitaOverrides] = useState({});
  const [externalVisitorOverrides, setExternalVisitorOverrides] = useState({});
  const [dismissedErrors, setDismissedErrors] = useState([]);
  const [savedAgendaId, setSavedAgendaId] = useState(null);
  const [savedData, setSavedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const initialLoadDone = useRef(false);

  const weekStart = fmtDate(monday);
  const weekDays = useMemo(() => weekDates(monday), [monday]);
  const weekEnd = weekDays[4].date;

  const loadWeek = useCallback(async () => {
    initialLoadDone.current = false;
    setLoading(true);
    const [d1, d2, d3, d4, d5] = await Promise.all([
      supabase.from('sdm_doctors').select('*').order('display_name'),
      supabase.from('sdm_shift_rotation').select('*'),
      supabase.from('sdm_block_templates').select('*'),
      supabase.from('sdm_program_assignments').select('*'),
      supabase.from('sdm_shift_calendar').select('*').gte('date', fmtDate(new Date(monday.getTime() - 7 * 86400000))).lte('date', weekEnd),
    ]);
    setDoctors(d1.data || []);
    setRotation(d2.data || []);
    setBlockTemplates(d3.data || []);
    setProgramAssignments(d4.data || []);
    setShiftCalendar(d5.data || []);

    const [a, o, ag] = await Promise.all([
      supabase.from('sdm_absences').select('*').gte('date', weekStart).lte('date', weekEnd),
      supabase.from('sdm_oneoff_blocks').select('*').eq('week_start', weekStart),
      supabase.from('sdm_weekly_agendas').select('*').eq('week_start', weekStart).maybeSingle(),
    ]);
    setAbsences(a.data || []);
    setOneoffBlocks(o.data || []);
    if (ag.data?.data) {
      setSavedData(ag.data.data);
      setReinforcements(ag.data.data.reinforcements || {});
      setBloqueosOverrides(ag.data.data.bloqueosOverrides || {});
      setPoli8amOverrides(ag.data.data.poli8amOverrides || {});
      setVisitaOverrides(ag.data.data.visitaOverrides || {});
      setExternalVisitorOverrides(ag.data.data.externalVisitorOverrides || {});
      setDismissedErrors(Array.isArray(ag.data.data.dismissedErrors) ? ag.data.data.dismissedErrors : []);
    } else {
      setSavedData(null);
      setReinforcements({});
      setBloqueosOverrides({});
      setPoli8amOverrides({});
      setVisitaOverrides({});
      setExternalVisitorOverrides({});
      setDismissedErrors([]);
    }
    setSavedAgendaId(ag.data?.id || null);
    setLoading(false);
    setTimeout(() => { initialLoadDone.current = true; setIsDirty(false); }, 50);
  }, [monday, weekEnd, weekStart]);

  useEffect(() => {
    let alive = true;
    loadWeek().catch(error => {
      if (!alive) return;
      setLoading(false);
      toast.error('Error al cargar agenda SDM: ' + (explainSdmWriteError(error) || error.message));
    });
    return () => { alive = false; initialLoadDone.current = false; };
  }, [loadWeek]);

  useEffect(() => {
    if (initialLoadDone.current) setIsDirty(true);
  }, [bloqueosOverrides, reinforcements, poli8amOverrides, visitaOverrides, externalVisitorOverrides, dismissedErrors]);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const agenda = useMemo(() => {
    if (loading) return [];
    return generateAgenda({
      weekStart: monday,
      doctors,
      rotation,
      shiftCalendar,
      blockTemplates,
      programAssignments,
      absences,
      oneoffBlocks,
      manualReinforcements: reinforcements,
      manualPoli8am: poli8amOverrides,
      visitaOverrides,
      externalVisitorOverrides,
      bloqueosOverrides,
    });
  }, [loading, monday, doctors, rotation, shiftCalendar, blockTemplates, programAssignments, absences, oneoffBlocks, reinforcements, poli8amOverrides, visitaOverrides, externalVisitorOverrides, bloqueosOverrides]);

  const blockSuggestions = useMemo(() => buildBlockSuggestions(blockTemplates), [blockTemplates]);

  const reloadOneoff = useCallback(async () => {
    const { data } = await supabase.from('sdm_oneoff_blocks').select('*').eq('week_start', weekStart);
    setOneoffBlocks(data || []);
  }, [weekStart]);

  const saveAgenda = useCallback(async ({ hasErrors = false } = {}) => {
    const payload = {
      week_start: weekStart,
      data: {
        agenda,
        reinforcements,
        bloqueosOverrides,
        poli8amOverrides,
        visitaOverrides,
        externalVisitorOverrides,
        dismissedErrors,
        has_errors: hasErrors,
        generated_at: new Date().toISOString(),
      },
      status: 'editada',
      updated_at: new Date().toISOString(),
    };
    if (savedAgendaId) {
      const { error } = await supabase.from('sdm_weekly_agendas').update(payload).eq('id', savedAgendaId);
      if (error) {
        toast.error('Error al guardar: ' + (explainSdmWriteError(error) || error.message));
        return false;
      }
      setIsDirty(false);
      setSavedData(payload.data);
      toast.success('Agenda actualizada');
      return true;
    }
    const { data, error } = await supabase.from('sdm_weekly_agendas').insert(payload).select('id').single();
    if (error) {
      toast.error('Error al guardar: ' + (explainSdmWriteError(error) || error.message));
      return false;
    }
    setSavedAgendaId(data.id);
    setSavedData(payload.data);
    setIsDirty(false);
    toast.success('Agenda guardada');
    return true;
  }, [agenda, bloqueosOverrides, dismissedErrors, externalVisitorOverrides, poli8amOverrides, reinforcements, savedAgendaId, visitaOverrides, weekStart]);

  return {
    monday,
    weekStart,
    weekEnd,
    weekDays,
    doctors,
    setDoctors,
    rotation,
    setRotation,
    shiftCalendar,
    setShiftCalendar,
    blockTemplates,
    setBlockTemplates,
    programAssignments,
    setProgramAssignments,
    absences,
    setAbsences,
    oneoffBlocks,
    setOneoffBlocks,
    reinforcements,
    setReinforcements,
    bloqueosOverrides,
    setBloqueosOverrides,
    poli8amOverrides,
    setPoli8amOverrides,
    visitaOverrides,
    setVisitaOverrides,
    externalVisitorOverrides,
    setExternalVisitorOverrides,
    dismissedErrors,
    setDismissedErrors,
    savedAgendaId,
    setSavedAgendaId,
    savedData,
    setSavedData,
    loading,
    isDirty,
    setIsDirty,
    agenda,
    blockSuggestions,
    reloadOneoff,
    reloadWeek: loadWeek,
    saveAgenda,
  };
}
