import { createClient } from '@supabase/supabase-js';

const APPLY = process.argv.includes('--apply');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const WEEK_START = '2026-07-06';
const WEEK_END = '2026-07-10';
const dates = ['2026-07-06', '2026-07-07', '2026-07-08', '2026-07-09', '2026-07-10'];

const allDoctorIds = [
  'alvarado', 'beltran', 'carreno', 'cordero', 'correa', 'enriquez', 'fasani', 'gil',
  'r_aguilera', 'rivas', 'ruf', 'san_martin', 'sandoval', 'santibanez', 'sbarbaro',
  'toledo', 'troncoso', 'v_aguilera',
];

const turnos = {
  '2026-07-06': ['sbarbaro', 'v_aguilera'],
  '2026-07-07': ['r_aguilera', 'rivas'],
  '2026-07-08': ['cordero', 'fasani'],
  '2026-07-09': ['alvarado', 'carreno'],
  '2026-07-10': ['toledo', 'ruf'],
};

const posturno = {
  '2026-07-06': ['enriquez', 'correa'],
  '2026-07-07': ['sbarbaro', 'v_aguilera'],
  '2026-07-08': ['r_aguilera', 'rivas'],
  '2026-07-09': ['cordero', 'fasani'],
  '2026-07-10': ['alvarado', 'carreno'],
};

const reinforcements = {
  '2026-07-06': { am: 'santibanez', pm: 'cordero' },
  '2026-07-07': { am: 'alvarado', pm: 'santibanez' },
  '2026-07-08': { am: 'ruf', pm: 'san_martin' },
  '2026-07-09': { am: 'v_aguilera', pm: 'sbarbaro' },
  '2026-07-10': { am: 'sandoval', pm: 'rivas' },
};

const absencesByDate = {
  '2026-07-06': [],
  '2026-07-07': [],
  '2026-07-08': [{ doctor_id: 'correa', type: 'C' }],
  '2026-07-09': [{ doctor_id: 'correa', type: 'C' }],
  '2026-07-10': [
    { doctor_id: 'san_martin', type: 'A' },
    { doctor_id: 'fasani', type: 'A' },
    { doctor_id: 'enriquez', type: 'C' },
    { doctor_id: 'correa', type: 'A' },
  ],
};

const externalVisitors = {
  '2026-07-06': [],
  '2026-07-07': [],
  '2026-07-08': [
    { name: 'Visita sociales', specialty: '20 min', source: 'agenda_2026_07_06' },
    { name: 'Dra. Rissi', specialty: 'Pediatra', source: 'agenda_2026_07_06' },
    { name: 'Dr. Rubilar', specialty: 'Urgencia', source: 'agenda_2026_07_06' },
  ],
  '2026-07-09': [
    { name: 'Dra. Riquelme', specialty: 'Neurología', source: 'agenda_2026_07_06' },
  ],
  '2026-07-10': [
    { name: 'Dra. Figueroa', specialty: 'Neurología infantil', source: 'agenda_2026_07_06' },
    { name: 'Dr. Rubilar', specialty: 'Urgencia', source: 'agenda_2026_07_06' },
  ],
};

const visit = {
  '2026-07-06': ['san_martin', 'gil', 'toledo', 'carreno', 'troncoso'],
  '2026-07-07': ['enriquez', 'correa', 'gil', 'toledo', 'carreno', 'troncoso'],
  '2026-07-08': ['enriquez', 'gil', 'toledo', 'carreno', 'troncoso', 'rubilar'],
  '2026-07-09': ['san_martin', 'r_aguilera', 'gil', 'toledo', 'rivas', 'troncoso'],
  '2026-07-10': ['r_aguilera', 'gil', 'v_aguilera', 'santibanez', 'troncoso', 'rubilar'],
};

function visitRows(date) {
  return visit[date].map((doctor_id) => ({
    doctor_id,
    capacity: doctor_id === 'rubilar' ? 6 : 5,
    manual: true,
  }));
}

function block(date, seq, from, to, doctorIds, name, opts = {}) {
  const ids = Array.isArray(doctorIds) ? doctorIds.filter(Boolean) : [];
  return {
    block_id: `agenda-2026-07-06-${date.slice(-2)}-${String(seq).padStart(2, '0')}`,
    name,
    from,
    to,
    doctor_ids: ids,
    doctor_id: ids[0] || null,
    category: opts.category || 'manual',
    source: 'agenda_image_2026_07_06',
    unassigned: false,
    ...opts,
  };
}

const bloqueosOverrides = {
  '2026-07-06': [
    block('2026-07-06', 1, '08:00', '11:00', ['ruf'], 'Selector de demanda', { block_id: 'selector_demanda' }),
    block('2026-07-06', 2, '08:00', '11:00', ['r_aguilera'], 'Gestión GES', { block_id: 'gestion_ges' }),
    block('2026-07-06', 3, '08:00', '17:00', ['fasani'], 'SDM + Med. Familia', { block_id: 'subdireccion_medica' }),
    block('2026-07-06', 4, '08:00', '12:00', ['alvarado'], 'Gestión PSCV', { block_id: 'gestion_pscv' }),
    block('2026-07-06', 5, '08:00', '12:00', ['sandoval'], 'TELESALUD', { block_id: 'telesalud' }),
    block('2026-07-06', 6, '11:00', '13:00', ['cordero'], 'Gestión Rayos', { block_id: 'imagenologia' }),
    block('2026-07-06', 7, '12:00', '13:30', ['ruf'], 'Poli TACO', { block_id: 'poli_taco' }),
    block('2026-07-06', 8, '11:00', '17:00', ['troncoso'], 'HODOM'),
    block('2026-07-06', 9, '14:00', '17:00', ['beltran'], 'Consultoría psiq. infantil'),
    block('2026-07-06', 10, '14:00', '17:00', ['toledo'], 'Paliativos', { block_id: 'cp_y_ad' }),
    block('2026-07-06', 11, '14:00', '17:00', ['gil'], 'Dependencia severa', { block_id: 'dependencia_severa' }),
    block('2026-07-06', 12, '14:00', '15:30', [], 'Reunión policlínico', { external_label: 'FIGUEROA' }),
    block('2026-07-06', 13, '16:00', '16:40', ['carreno'], 'Visita PROA', { block_id: 'visita_proa' }),
    block('2026-07-06', 14, '16:00', '16:40', ['ruf'], 'Reg. IC', { block_id: 'regulacion_ic' }),
  ],
  '2026-07-07': [
    block('2026-07-07', 1, '08:00', '11:00', ['cordero'], 'Selector de demanda', { block_id: 'selector_demanda' }),
    block('2026-07-07', 2, '08:00', '17:00', ['fasani'], 'SDM', { block_id: 'subdireccion_medica' }),
    block('2026-07-07', 3, '08:00', '11:00', ['sandoval'], 'Gestión telemedicina', { block_id: 'gestion_tm' }),
    block('2026-07-07', 4, '08:00', '11:00', ['san_martin'], 'Gestión MQ', { block_id: 'gestion_mq' }),
    block('2026-07-07', 5, '08:00', '13:30', ['ruf'], 'ECICEP', { block_id: 'ecicep' }),
    block('2026-07-07', 6, '11:00', '17:00', ['troncoso'], 'HODOM'),
    block('2026-07-07', 7, '14:00', '16:00', ['san_martin'], 'CHCC', { block_id: 'chcc' }),
    block('2026-07-07', 8, '14:00', '16:00', ['toledo'], 'Paliativos', { block_id: 'cp_y_ad' }),
    block('2026-07-07', 9, '14:00', '16:00', ['cordero'], 'Reunión SDM'),
    block('2026-07-07', 10, '14:00', '15:00', ['carreno'], 'Gestión PROA + Visita PROA', { block_id: 'visita_proa' }),
    block('2026-07-07', 11, '15:00', '15:40', ['enriquez'], 'Reg. IC', { block_id: 'regulacion_ic' }),
    block('2026-07-07', 12, '16:00', '17:00', allDoctorIds, 'Reunión de salud familiar', { all_doctors: true }),
  ],
  '2026-07-08': [
    block('2026-07-08', 1, '08:00', '11:00', ['alvarado'], 'Selector de demanda', { block_id: 'selector_demanda' }),
    block('2026-07-08', 2, '08:00', '09:30', ['carreno'], 'Reu GYO'),
    block('2026-07-08', 3, '08:00', '11:00', ['sbarbaro'], 'Gestión IAAS', { block_id: 'gestion_iaas' }),
    block('2026-07-08', 4, '08:00', '17:00', ['santibanez'], 'Visita fisiatra'),
    block('2026-07-08', 5, '08:00', '10:00', ['v_aguilera'], 'Reu CHCC'),
    block('2026-07-08', 6, '10:00', '13:30', ['v_aguilera'], 'CHCC', { block_id: 'chcc' }),
    block('2026-07-08', 7, '11:00', '17:00', ['alvarado'], 'SDM + Poli TACO', { block_id: 'subdireccion_medica' }),
    block('2026-07-08', 8, '11:00', '17:00', ['troncoso'], 'HODOM'),
    block('2026-07-08', 9, '13:30', '17:00', ['sbarbaro'], 'Reunión PROA'),
    block('2026-07-08', 10, '14:00', '17:00', ['gil'], 'Paliativos', { block_id: 'cp_y_ad' }),
    block('2026-07-08', 11, '16:00', '16:40', ['carreno'], 'Visita PROA', { block_id: 'visita_proa' }),
    block('2026-07-08', 12, '16:00', '16:40', ['enriquez'], 'Reg. IC', { block_id: 'regulacion_ic' }),
  ],
  '2026-07-09': [
    block('2026-07-09', 1, '08:00', '11:00', ['santibanez'], 'Selector de demanda', { block_id: 'selector_demanda' }),
    block('2026-07-09', 2, '08:00', '11:00', ['sandoval'], 'TELESALUD', { block_id: 'telesalud' }),
    block('2026-07-09', 3, '08:00', '11:00', ['enriquez'], 'Gestión hospital amigo/PROSAM'),
    block('2026-07-09', 4, '11:00', '13:30', ['sandoval'], 'Gestión urgencias', { block_id: 'gestion_urgencias' }),
    block('2026-07-09', 5, '08:00', '13:30', ['alvarado'], 'SDM, luego urgencias', { block_id: 'subdireccion_medica' }),
    block('2026-07-09', 6, '08:30', '13:30', ['ruf'], 'Urgencias'),
    block('2026-07-09', 7, '09:30', '11:30', [], 'Reunión MAIS', { external_label: 'FIGUEROA' }),
    block('2026-07-09', 8, '11:00', '17:00', ['troncoso'], 'HODOM'),
    block('2026-07-09', 9, '12:00', '13:30', ['toledo'], 'Gestión dependencia severa', { block_id: 'gestion_dep_severa' }),
    block('2026-07-09', 10, '14:00', '17:00', ['rivas'], 'Paliativos', { block_id: 'cp_y_ad' }),
    block('2026-07-09', 11, '16:00', '16:40', ['enriquez'], 'Reg. IC', { block_id: 'regulacion_ic' }),
  ],
  '2026-07-10': [
    block('2026-07-10', 1, '08:00', '11:00', ['cordero'], 'Selector de demanda', { block_id: 'selector_demanda' }),
    block('2026-07-10', 2, '11:00', '16:00', ['cordero'], 'SDM + Poli TACO', { block_id: 'subdireccion_medica' }),
    block('2026-07-10', 3, '08:00', '11:00', ['sbarbaro'], 'Gestión + Visita PROA', { block_id: 'visita_proa' }),
    block('2026-07-10', 4, '11:00', '14:00', ['sbarbaro'], 'Reg. IC', { block_id: 'regulacion_ic' }),
    block('2026-07-10', 5, '11:30', '13:00', [], 'Reu promoción y participación social', { external_label: 'FIGUEROA' }),
    block('2026-07-10', 6, '14:00', '16:00', ['v_aguilera'], 'Paliativos', { block_id: 'cp_y_ad' }),
    block('2026-07-10', 7, '14:00', '16:00', ['sbarbaro'], 'Gestión GES', { block_id: 'gestion_ges' }),
  ],
};

const policlinico = {
  '2026-07-06': { doctor_id: 'santibanez', from: '08:00', to: '10:00', label: 'Poli AM', note: 'Directo a urgencias' },
  '2026-07-07': { doctor_id: 'alvarado', from: '08:00', to: '10:00', label: 'Poli AM' },
  '2026-07-08': { doctor_id: 'ruf', from: '08:00', to: '10:00', label: 'Poli AM' },
  '2026-07-09': { doctor_id: 'v_aguilera', from: '08:00', to: '10:00', label: 'Poli AM' },
  '2026-07-10': { doctor_id: 'sandoval', from: '08:00', to: '10:00', label: 'Poli AM' },
};

const poli8am = {
  '2026-07-06': {
    full_day: { doctor_id: 'beltran', from: '08:00', to: '13:30', label: 'Policlínico' },
    ref_pm: null,
    extra: [
      { label: 'CORDERO', note: 'sin poli' },
      { doctor_id: 'rivas', from: '08:00', to: '17:00', label: 'Policlínico' },
    ],
  },
  '2026-07-07': {
    full_day: { doctor_id: 'beltran', from: '08:00', to: '16:00', label: 'Policlínico' },
    ref_pm: { doctor_id: 'santibanez', from: '11:00', to: '13:00', label: 'Ref PM' },
    extra: [],
  },
  '2026-07-08': {
    full_day: { doctor_id: 'beltran', from: '08:00', to: '17:00', label: 'Policlínico' },
    ref_pm: { doctor_id: 'san_martin', from: '11:00', to: '13:00', label: 'Ref PM' },
    extra: [],
  },
  '2026-07-09': {
    full_day: { doctor_id: 'beltran', from: '08:00', to: '17:00', label: 'Policlínico' },
    ref_pm: { doctor_id: 'sbarbaro', from: '11:00', to: '13:00', label: 'Ref PM' },
    extra: [],
  },
  '2026-07-10': {
    full_day: { doctor_id: 'beltran', from: '08:00', to: '16:00', label: 'Policlínico' },
    ref_pm: { doctor_id: 'rivas', from: '12:00', to: '13:30', label: 'Ref PM' },
    extra: [],
  },
};

const dailyOverrides = Object.fromEntries(dates.map(date => [
  date,
  {
    turnos: turnos[date].map(doctor_id => ({ doctor_id })),
    posturno: posturno[date].map(doctor_id => ({ doctor_id })),
    ausencias: absencesByDate[date].map(a => ({ ...a })),
    refuerzos: reinforcements[date],
    bloqueos: bloqueosOverrides[date],
    visita: visitRows(date),
    policlinico: policlinico[date],
    poli_8am: poli8am[date],
    external_visitors: externalVisitors[date],
  },
]));

const absenceRows = dates.flatMap(date =>
  absencesByDate[date].map(a => ({
    doctor_id: a.doctor_id,
    date,
    type: a.type === 'C' ? 'CAP' : a.type,
    duration_hours: null,
    notes: a.type === 'C'
      ? 'Planilla original: C. Actualizado desde agenda semanal 06-07-2026'
      : 'Actualizado desde agenda semanal 06-07-2026',
  }))
);

const externalVisitorOverrides = Object.fromEntries(dates.map(date => [date, externalVisitors[date]]));

const poliDisabled = {
  '2026-07-06': { pm: true },
};

async function main() {
  const { data: existing, error: readErr } = await supabase
    .from('sdm_weekly_agendas')
    .select('*')
    .eq('week_start', WEEK_START)
    .maybeSingle();
  if (readErr) throw readErr;

  const previous = existing?.data || {};
  const nextData = {
    ...previous,
    reinforcements,
    bloqueosOverrides,
    externalVisitorOverrides,
    poliDisabled,
    dailyOverrides: {
      ...(previous.dailyOverrides || {}),
      ...dailyOverrides,
    },
    source_note: 'Agenda semanal transcrita desde image002.png enviada el 2026-07-06',
    generated_at: new Date().toISOString(),
  };

  console.log(JSON.stringify({
    mode: APPLY ? 'apply' : 'dry-run',
    week_start: WEEK_START,
    weekly_agenda_id: existing?.id || null,
    absences: absenceRows,
    reinforcements,
    daily_override_dates: Object.keys(dailyOverrides),
  }, null, 2));

  if (!APPLY) return;

  const { error: delAbsErr } = await supabase
    .from('sdm_absences')
    .delete()
    .gte('date', WEEK_START)
    .lte('date', WEEK_END);
  if (delAbsErr) throw delAbsErr;

  if (absenceRows.length > 0) {
    const { error: insAbsErr } = await supabase.from('sdm_absences').insert(absenceRows);
    if (insAbsErr) throw insAbsErr;
  }

  for (const date of dates) {
    const { error } = await supabase
      .from('sdm_shift_calendar')
      .update({ external_visitors: externalVisitors[date] })
      .eq('date', date);
    if (error) throw error;
  }

  const payload = {
    week_start: WEEK_START,
    data: nextData,
    status: 'editada',
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    const { error } = await supabase.from('sdm_weekly_agendas').update(payload).eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('sdm_weekly_agendas').insert(payload);
    if (error) throw error;
  }

  console.log('Agenda semanal 2026-07-06 actualizada.');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
