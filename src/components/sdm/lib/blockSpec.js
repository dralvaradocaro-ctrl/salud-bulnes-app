/**
 * Spec canónico de bloqueos semanales (fuente: PDF "PLANTILLA BLOQUEOS AGENDA MÉDICA").
 *
 * Se usa en:
 *   - validateAgenda: para emitir warnings cuando actual < expected.
 *   - RevisarBloqueosSemanales: tabla de auditoría expected vs actual.
 *   - Auto-reubicación de bloqueos semanales que caen en feriado.
 *
 * NO se usa para generar bloqueos (eso lo hace el seed/DB en sdm_block_templates).
 * Si el seed difiere de este spec, la tab de revisión lo marcará en rojo.
 */
export const BLOCK_SPECS = {
  selector_demanda:   { weekly_hours: '3 hrs',           expected_schedule: '08:00–11:00 x 5',        expected_count: 5,   monthly: false },
  poli_taco:          { weekly_hours: '6 hrs (1.5 L-Mi-J-V)', expected_schedule: '12:00–13:30 x 4',   expected_count: 4,   monthly: false },
  regulacion_ic:      { weekly_hours: '3 hrs 20 min',    expected_schedule: '16:00–16:40 x 5',        expected_count: 5,   monthly: false },
  cp_y_ad:            { weekly_hours: '14 hrs',          expected_schedule: '14:00–17:00 x 5',        expected_count: 5,   monthly: false, notes: 'Primer día hábil del mes no hay paliativo por CENSO' },
  ecicep:             { weekly_hours: '3 hrs',           expected_schedule: '14:00–17:00 x 2',        expected_count: 2,   monthly: false },
  gestion_ges:        { weekly_hours: '6 hrs',           expected_schedule: '14:00–17:00 x 2',        expected_count: 2,   monthly: false },
  gestion_pscv:       { weekly_hours: '3 hrs (miércoles)', expected_schedule: '14:00–17:00 x 1',      expected_count: 1,   monthly: false },
  gestion_acv:        { weekly_hours: '1.5 hrs sem x medio', expected_schedule: '12:00–13:30 x 0.5',  expected_count: 0.5, monthly: false, notes: 'Semana por medio' },
  gestion_mq:         { weekly_hours: '2 hrs',           expected_schedule: '14:00–16:00 x 2',        expected_count: 2,   monthly: false },
  gestion_urgencias:  { weekly_hours: '2 hrs',           expected_schedule: '14:00–16:00 x 1',        expected_count: 1,   monthly: false },
  gestion_iaas:       { weekly_hours: '1.5 hrs',         expected_schedule: '12:00–13:30 x 2',        expected_count: 2,   monthly: false },
  gestion_proa:       { weekly_hours: '1.5 hrs sem x medio', expected_schedule: '12:00–13:30 x 0.5',  expected_count: 0.5, monthly: false, notes: 'Semana por medio' },
  visita_proa:        { weekly_hours: '3 hrs 20 min',    expected_schedule: '16:00–16:40 x 5',        expected_count: 5,   monthly: false },
  dependencia_severa: { weekly_hours: '3 hrs',           expected_schedule: '14:00–17:00 x 1',        expected_count: 1,   monthly: false },
  gestion_dep_severa: { weekly_hours: '1.5 hrs',         expected_schedule: '12:00–13:30 x 1',        expected_count: 1,   monthly: false },
  chcc:               { weekly_hours: '3 hrs',           expected_schedule: '14:00–17:00 x 1',        expected_count: 1,   monthly: false },
  telesalud:          { weekly_hours: '2.5 hrs',         expected_schedule: '11:00–13:30 x 3',        expected_count: 3,   monthly: false },
  gestion_tm:         { weekly_hours: '2 a 3 hrs',       expected_schedule: '14:00–17:00 x 1',        expected_count: 1,   monthly: false },

  // Mensuales — solo warning si caen en feriado, nunca se auto-reubican.
  gestion_policlinico: { weekly_hours: '2 hrs mensuales', expected_schedule: 'Primer lunes del mes',  monthly: true },
  reunion_maternidad:  { weekly_hours: '2 hrs mensuales', expected_schedule: 'Primer jueves del mes', monthly: true },
  reunion_medica:      { weekly_hours: '3 hrs',           expected_schedule: 'Tercer jueves del mes', monthly: true },
  reunion_sala_era:    { weekly_hours: '1.5 hrs',         expected_schedule: 'Tercer jueves del mes', monthly: true },
  reunion_equipo_mq:   { weekly_hours: '2 hrs mensuales', expected_schedule: '11:30–13:30 primera semana del mes', monthly: true },

  // Sin spec semanal definida — gestionados desde Excel externos o ad hoc.
  citacion_tribunales:  { weekly_hours: 'Revisar Excel SDM',   expected_schedule: '—', monthly: false, manual: true },
  reuniones_agendadas:  { weekly_hours: 'Revisar Agenda SDM',  expected_schedule: '—', monthly: false, manual: true },
  citaciones_radio:     { weekly_hours: 'Revisar Excel radio', expected_schedule: '—', monthly: false, manual: true },
  comite_iaas:          { weekly_hours: '4/año (2.5 hrs)',     expected_schedule: '11:00–13:30',       monthly: false, manual: true },
};

/** Orden de presentación canónico para la tabla de revisión (mismo orden del PDF). */
export const BLOCK_SPEC_ORDER = [
  'selector_demanda', 'poli_taco', 'regulacion_ic', 'cp_y_ad', 'ecicep',
  'gestion_ges', 'gestion_pscv', 'gestion_acv', 'gestion_mq', 'gestion_urgencias',
  'gestion_iaas', 'gestion_proa', 'visita_proa', 'dependencia_severa', 'gestion_dep_severa',
  'chcc', 'telesalud', 'gestion_tm',
  'citacion_tribunales', 'reuniones_agendadas', 'citaciones_radio',
  'gestion_policlinico', 'reunion_maternidad', 'reunion_medica', 'reunion_sala_era',
  'reunion_equipo_mq', 'comite_iaas',
];
