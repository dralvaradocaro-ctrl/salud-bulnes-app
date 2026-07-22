/**
 * Motor de cambio (switch) de antidepresivos.
 *
 * Reglas modeladas desde la tabla de switch de PsychiatryNet
 * (wiki.psychiatrienet.nl, consideraciones generales + páginas por par,
 * basadas en farmacocinética y afinidad de receptores, Stahl 4ª ed.),
 * contrastadas con Keks et al., Australian Prescriber 2016;39:76-83 y las
 * guías Maudsley/NHS SPS. Sólo incluye antidepresivos comercializados en
 * Chile. Los esquemas son ORIENTATIVOS: edad, comorbilidad, dosis altas o
 * metabolizadores atípicos requieren ajuste individual.
 *
 * Arquetipos (de menor a mayor precaución):
 *  - direct        : suspender y partir al día siguiente (enantiómeros).
 *  - taper-switch  : saliente 50% día 1 → stop día 8; entrante 50% del
 *                    objetivo día 1 → 100% día 8 (patrón por defecto).
 *  - fluox-origin  : fluoxetina se suspende sin taper (se "autoderiva" por
 *                    su vida media) y el entrante parte diferido (~día 5-7).
 *  - cross-tca     : cuando entra o sale un tricíclico: 25% cada 3 días.
 *  - taper-washout : cuando el destino es serotoninérgico y el origen exige
 *                    lavado (clomipramina cruzada, moclobemida, fluoxetina→
 *                    clomipramina/moclobemida).
 */

export const GROUP_LABELS = {
  isrs: 'ISRS',
  irsn: 'IRSN (dual)',
  triciclico: 'Tricíclico',
  atipico: 'Atípico',
  rima: 'IMAO reversible (RIMA)',
};

// Dosis en mg/día. safeStart = dosis de inicio del fármaco cuando ENTRA;
// safeTarget = dosis objetivo inicial segura (psychiatrienet "safe target dose").
export const DRUGS = {
  fluoxetina: {
    label: 'Fluoxetina', group: 'isrs', safeStart: 10, safeTarget: 20, max: 60,
    presentacion: 'cáps/comp 20 mg', vidaMedia: '4-6 días (norfluoxetina 1-2 semanas)',
    longHalfLife: true, cyp2d6: true, serotonergic: true,
  },
  sertralina: {
    label: 'Sertralina', group: 'isrs', safeStart: 25, safeTarget: 50, max: 200,
    presentacion: 'comp 50 y 100 mg', vidaMedia: '~26 h', serotonergic: true,
  },
  escitalopram: {
    label: 'Escitalopram', group: 'isrs', safeStart: 5, safeTarget: 10, max: 20,
    presentacion: 'comp 10 y 20 mg', vidaMedia: '~30 h', serotonergic: true,
  },
  citalopram: {
    label: 'Citalopram', group: 'isrs', safeStart: 10, safeTarget: 20, max: 40,
    presentacion: 'comp 20 mg', vidaMedia: '~35 h', serotonergic: true,
  },
  paroxetina: {
    label: 'Paroxetina', group: 'isrs', safeStart: 10, safeTarget: 20, max: 60,
    presentacion: 'comp 20 mg', vidaMedia: '~21 h', cyp2d6: true, serotonergic: true,
    discontinuacionDificil: true,
  },
  fluvoxamina: {
    label: 'Fluvoxamina', group: 'isrs', safeStart: 50, safeTarget: 100, max: 300,
    presentacion: 'comp 100 mg', vidaMedia: '~15 h', serotonergic: true,
  },
  venlafaxina: {
    label: 'Venlafaxina', group: 'irsn', safeStart: 37.5, safeTarget: 75, max: 375,
    presentacion: 'cáps LP 37,5 / 75 / 150 mg', vidaMedia: '~5 h (+11 h metabolito)',
    serotonergic: true, discontinuacionDificil: true,
  },
  desvenlafaxina: {
    label: 'Desvenlafaxina', group: 'irsn', safeStart: 50, safeTarget: 50, max: 100,
    presentacion: 'comp LP 50 y 100 mg', vidaMedia: '~11 h', serotonergic: true,
    discontinuacionDificil: true,
    nota: 'Sin página propia en PsychiatryNet: se aplican las reglas de venlafaxina (es su metabolito activo).',
  },
  duloxetina: {
    label: 'Duloxetina', group: 'irsn', safeStart: 30, safeTarget: 60, max: 120,
    presentacion: 'cáps 30 y 60 mg', vidaMedia: '~12 h', serotonergic: true,
  },
  mirtazapina: {
    label: 'Mirtazapina', group: 'atipico', safeStart: 15, safeTarget: 30, max: 45,
    presentacion: 'comp 15 y 30 mg', vidaMedia: '20-40 h', serotonergic: false,
  },
  bupropion: {
    label: 'Bupropión', group: 'atipico', safeStart: 150, safeTarget: 150, max: 300,
    presentacion: 'comp XL 150 y 300 mg', vidaMedia: '~21 h', serotonergic: false,
    nota: 'Baja el umbral convulsivante: precaución al superponer con tricíclicos.',
  },
  trazodona: {
    label: 'Trazodona', group: 'atipico', safeStart: 50, safeTarget: 100, max: 300,
    presentacion: 'comp 50 y 100 mg', vidaMedia: '~7 h', serotonergic: true,
  },
  vortioxetina: {
    label: 'Vortioxetina', group: 'atipico', safeStart: 5, safeTarget: 10, max: 20,
    presentacion: 'comp 10 y 20 mg', vidaMedia: '~66 h', serotonergic: true,
  },
  agomelatina: {
    label: 'Agomelatina', group: 'atipico', safeStart: 25, safeTarget: 25, max: 50,
    presentacion: 'comp 25 mg (noche)', vidaMedia: '1-2 h', serotonergic: false,
    sinTaper: true,
    nota: 'Requiere control de transaminasas basal y periódico.',
  },
  amitriptilina: {
    label: 'Amitriptilina', group: 'triciclico', safeStart: 25, safeTarget: 75, max: 150,
    presentacion: 'comp 25 mg', vidaMedia: '10-28 h', serotonergic: true,
  },
  clomipramina: {
    label: 'Clomipramina', group: 'triciclico', safeStart: 25, safeTarget: 75, max: 250,
    presentacion: 'comp 25 y 75 mg', vidaMedia: '~32 h', serotonergic: true,
    altamenteSerotoninergico: true,
  },
  imipramina: {
    label: 'Imipramina', group: 'triciclico', safeStart: 25, safeTarget: 75, max: 200,
    presentacion: 'comp 25 mg', vidaMedia: '~12 h (+ desipramina)', serotonergic: true,
  },
  nortriptilina: {
    label: 'Nortriptilina', group: 'triciclico', safeStart: 25, safeTarget: 75, max: 150,
    presentacion: 'comp 25 mg', vidaMedia: '~26 h', serotonergic: true,
  },
  moclobemida: {
    label: 'Moclobemida', group: 'rima', safeStart: 150, safeTarget: 300, max: 600,
    presentacion: 'comp 150 y 300 mg', vidaMedia: '~2 h', serotonergic: false,
    esRima: true,
  },
};

export const DRUG_KEYS = Object.keys(DRUGS);

const RISK = { BAJO: 'bajo', MODERADO: 'moderado', ALTO: 'alto' };

const mg = (n) => {
  if (!Number.isFinite(n)) return '';
  const redondeado = n >= 20 ? Math.round(n) : Math.round(n * 2) / 2;
  return `${String(redondeado).replace('.', ',')} mg`;
};

/** Pasos de suspensión estándar "50% día 1 → stop día 8", con mg si hay dosis. */
const stopMitadYSemana = (drug, dosis) => [
  { dia: 'Día 1', accion: `Reducir a 50% de la dosis actual${dosis ? ` (${mg(dosis / 2)}/día)` : ''}` },
  { dia: 'Día 8', accion: 'Suspender' },
];

/** Pasos de retiro tricíclico/IMAO: −25% de la dosis original cada 3 días. */
const stopCuartos = (drug, dosis) => [
  { dia: 'Día 1', accion: `Reducir a 75%${dosis ? ` (${mg(dosis * 0.75)}/día)` : ' de la dosis original'}` },
  { dia: 'Día 4', accion: `Reducir a 50%${dosis ? ` (${mg(dosis * 0.5)}/día)` : ''}` },
  { dia: 'Día 7', accion: `Reducir a 25%${dosis ? ` (${mg(dosis * 0.25)}/día)` : ''}` },
  { dia: 'Día 10', accion: 'Suspender' },
];

/** Pasos de inicio estándar "50% del objetivo día 1 → 100% día 8". */
const startMitadYSemana = (drug, offset = 0) => {
  const d = (n) => `Día ${n + offset}`;
  return [
    { dia: d(1), accion: `Iniciar ${drug.label} ${mg(drug.safeStart)}/día (≈50% de la dosis objetivo)` },
    { dia: d(8), accion: `Subir a ${mg(drug.safeTarget)}/día (dosis objetivo segura)` },
    { dia: `${d(15)}+`, accion: 'Ajustar gradualmente según respuesta clínica' },
  ];
};

/** Pasos de inicio tricíclico: escalones de 25 mg (comprimidos reales) cada 3-4 días. */
const startCuartos = (drug, offset = 0) => {
  const t = drug.safeTarget;
  const d = (n) => `Día ${n + offset}`;
  const pasos = [{ dia: d(1), accion: `Iniciar ${drug.label} 25 mg/noche` }];
  let dosis = 25;
  let dia = 1;
  while (dosis + 25 <= t) {
    dosis += 25;
    dia += 3;
    pasos.push({ dia: d(dia), accion: `Subir a ${mg(dosis)}/noche` });
  }
  pasos.push({
    dia: `${d(dia + 4)}+`,
    accion: 'Ajustar según respuesta y tolerancia; considerar niveles plasmáticos',
  });
  return pasos;
};

const W = {
  serotoninergico:
    'Vigilar síndrome serotoninérgico durante el traslape: agitación, temblor, mioclonías, hiperreflexia, sudoración, taquicardia, hipertermia. Ante sospecha, suspender ambos fármacos.',
  discontinuacion:
    'Vigilar síntomas de discontinuación del fármaco saliente (mareo, parestesias, síntomas gripales, insomnio, irritabilidad, "descargas eléctricas"). Si aparecen, enlentecer el descenso.',
  tcaMonitoreo:
    'Tricíclicos: ventana terapéutica estrecha y cardiotoxicidad en sobredosis. Considerar ECG basal y niveles plasmáticos si hay dosis altas, mala respuesta o sospecha de toxicidad.',
  tcaAnticolinergico:
    'El retiro brusco de un tricíclico produce rebote colinérgico (náuseas, cefalea, insomnio, diarrea): respetar el descenso gradual.',
};

/**
 * Construye el plan de cambio.
 * @param {string} fromKey clave DRUGS del fármaco actual
 * @param {string} toKey clave DRUGS del fármaco nuevo
 * @param {number|null} dosisActual mg/día actuales (opcional, concreta los pasos)
 * @returns {object|null} plan { estrategia, titulo, riesgo, stopSteps, startSteps,
 *   washoutDias, warnings, notas, fuenteUrl } — null si from === to
 */
export function buildSwitchPlan(fromKey, toKey, dosisActual = null) {
  if (!fromKey || !toKey || fromKey === toKey) return null;
  const from = DRUGS[fromKey];
  const to = DRUGS[toKey];
  if (!from || !to) return null;

  const warnings = [];
  const notas = [];
  const plan = {
    from: fromKey,
    to: toKey,
    washoutDias: 0,
    fuenteUrl: 'https://wiki.psychiatrienet.nl/wiki/SwitchAntidepressants',
  };

  if (to.nota) notas.push(to.nota);
  if (from.nota && fromKey === 'desvenlafaxina') notas.push(from.nota);
  if (from.discontinuacionDificil) {
    warnings.push(
      `${from.label} produce síntomas de discontinuación con frecuencia: si aparecen al bajar, hacer el descenso más lento (2-4 semanas).`,
    );
  }

  // ── 1. Enantiómeros: citalopram ↔ escitalopram — switch directo ────────
  const parEnantiomero =
    (fromKey === 'citalopram' && toKey === 'escitalopram') ||
    (fromKey === 'escitalopram' && toKey === 'citalopram');
  if (parEnantiomero) {
    const dosisEq = fromKey === 'citalopram'
      ? (dosisActual ? dosisActual / 2 : to.safeTarget)
      : (dosisActual ? dosisActual * 2 : to.safeTarget);
    return {
      ...plan,
      estrategia: 'direct',
      titulo: 'Cambio directo (son enantiómeros del mismo fármaco)',
      riesgo: RISK.BAJO,
      stopSteps: [{ dia: 'Día 1', accion: `Suspender ${from.label} (sin descenso)` }],
      startSteps: [{
        dia: 'Día 2',
        accion: `Iniciar ${to.label} a dosis equivalente (${mg(Math.min(dosisEq, to.max))}/día)`,
      }],
      warnings: [
        'Citalopram y escitalopram son enantiómeros con efecto casi idéntico: este cambio rara vez aporta beneficio clínico; reevaluar la indicación.',
      ],
      notas,
    };
  }

  // ── 2. Moclobemida como ORIGEN: vida media 2 h, sin lavado largo ──────
  if (from.esRima) {
    const startSteps = to.group === 'triciclico' ? startCuartos(to, 8) : startMitadYSemana(to, 8);
    return {
      ...plan,
      estrategia: 'taper-switch',
      titulo: 'Retiro en 1 semana; el nuevo fármaco parte al día siguiente',
      riesgo: RISK.MODERADO,
      stopSteps: [
        { dia: 'Antes', accion: 'Si usa >300 mg/día, reducir primero a 300 mg/día' },
        { dia: 'Día 1', accion: 'Reducir a 150 mg/día' },
        { dia: 'Día 8', accion: 'Suspender' },
      ],
      startSteps,
      warnings: [
        'La vida media de moclobemida es ~2 h: 24 horas tras la última dosis ya puede iniciarse el nuevo antidepresivo.',
        W.serotoninergico,
      ],
      notas,
    };
  }

  // ── 3. Moclobemida como DESTINO: lavado del serotoninérgico saliente ──
  if (to.esRima) {
    const washout = from.longHalfLife ? 35 : fromKey === 'vortioxetina' ? 21 : 7;
    const stopSteps = from.longHalfLife
      ? [{ dia: 'Día 1', accion: `Suspender ${from.label} (su vida media larga hace de descenso)` }]
      : stopCuartos(from, dosisActual);
    return {
      ...plan,
      estrategia: 'taper-washout',
      titulo: `Retiro + lavado de ${washout === 35 ? '5 semanas' : `${washout} días`} antes de iniciar`,
      riesgo: RISK.ALTO,
      washoutDias: washout,
      stopSteps,
      startSteps: [
        {
          dia: 'Tras el lavado',
          accion: `Iniciar moclobemida 150 mg/día; subir a 300 mg/día según tolerancia tras 1 semana`,
        },
      ],
      warnings: [
        `LAVADO OBLIGATORIO de ${washout === 35 ? '5 semanas (norfluoxetina persiste ~2 semanas)' : `${washout} días`} entre la última dosis de ${from.label} y la primera de moclobemida: hay síndrome serotoninérgico reportado sin este lavado.`,
        W.serotoninergico,
        W.discontinuacion,
      ],
      notas,
    };
  }

  // ── 4. Clomipramina cruzada con serotoninérgico potente: sin traslape ──
  const clomiCruzada =
    (from.altamenteSerotoninergico && to.serotonergic && to.group !== 'triciclico') ||
    (to.altamenteSerotoninergico && from.serotonergic && from.group !== 'triciclico');
  if (clomiCruzada) {
    const stopSteps = from.longHalfLife
      ? [{ dia: 'Día 1', accion: `Suspender ${from.label} (sin descenso)` }]
      : stopCuartos(from, dosisActual);
    const washout = from.longHalfLife ? 14 : 3;
    const startSteps = to.group === 'triciclico'
      ? startCuartos(to, 0).map((s) => ({ ...s, dia: s.dia.replace('Día ', 'Lavado + día ') }))
      : startMitadYSemana(to, 0).map((s) => ({ ...s, dia: s.dia.replace('Día ', 'Lavado + día ') }));
    return {
      ...plan,
      estrategia: 'taper-washout',
      titulo: 'Retiro completo y lavado antes de iniciar (SIN traslape)',
      riesgo: RISK.ALTO,
      washoutDias: washout,
      stopSteps,
      startSteps,
      warnings: [
        `NO superponer clomipramina con ${from.altamenteSerotoninergico ? to.label : from.label}: clomipramina es el tricíclico más serotoninérgico y el traslape aumenta el riesgo de síndrome serotoninérgico.`,
        `Dejar ${washout === 14 ? '2 semanas' : `${washout} días`} entre la suspensión completa y el inicio.`,
        W.serotoninergico,
        W.tcaMonitoreo,
      ],
      notas,
    };
  }

  // ── 5. Fluoxetina como ORIGEN: sin taper, inicio diferido ─────────────
  if (from.longHalfLife) {
    const esTcaDestino = to.group === 'triciclico';
    const startSteps = esTcaDestino
      ? [
          { dia: 'Día 7', accion: `Iniciar ${to.label} ${mg(to.safeTarget * 0.25)}/día` },
          { dia: 'Día 10-14', accion: `Subir de a 25% del objetivo cada 3-4 días hasta ${mg(to.safeTarget)}/día` },
        ]
      : [
          { dia: 'Día 5', accion: `Iniciar ${to.label} ${mg(to.safeStart)}/día (50% del objetivo)` },
          { dia: 'Día 10', accion: `Subir a ${mg(to.safeTarget)}/día` },
          { dia: 'Día 15+', accion: 'Ajustar gradualmente según respuesta' },
        ];
    const warningsFluox = [
      'Fluoxetina no requiere descenso: su vida media larga (norfluoxetina ~1-2 semanas) actúa como retiro gradual. Por lo mismo, el fármaco persiste ~2 semanas tras suspender.',
      W.serotoninergico,
    ];
    if (to.group === 'irsn' || esTcaDestino) {
      warningsFluox.push(
        `Fluoxetina inhibe CYP2D6 por varias semanas: mantener ${to.label} en dosis bajas ese período${esTcaDestino ? ' y considerar niveles plasmáticos' : ''}.`,
      );
    }
    if (esTcaDestino) warningsFluox.push(W.tcaMonitoreo);
    return {
      ...plan,
      estrategia: 'fluox-origin',
      titulo: 'Suspender fluoxetina sin descenso e iniciar diferido',
      riesgo: esTcaDestino ? RISK.MODERADO : RISK.BAJO,
      stopSteps: [{ dia: 'Día 1', accion: 'Suspender fluoxetina (sin descenso gradual)' }],
      startSteps,
      warnings: warningsFluox,
      notas,
    };
  }

  // ── 6. Agomelatina involucrada: sin interacción serotoninérgica ───────
  if (fromKey === 'agomelatina') {
    const startSteps = to.group === 'triciclico' ? startCuartos(to, 1) : startMitadYSemana(to, 1);
    return {
      ...plan,
      estrategia: 'direct',
      titulo: 'Agomelatina se suspende sin descenso; el nuevo parte al día siguiente',
      riesgo: RISK.BAJO,
      stopSteps: [{ dia: 'Día 1', accion: 'Suspender agomelatina (no produce discontinuación)' }],
      startSteps,
      warnings: to.group === 'triciclico' ? [W.tcaMonitoreo] : [],
      notas,
    };
  }
  if (toKey === 'agomelatina') {
    const stopSteps = from.group === 'triciclico' ? stopCuartos(from, dosisActual) : stopMitadYSemana(from, dosisActual);
    return {
      ...plan,
      estrategia: 'taper-switch',
      titulo: 'Iniciar agomelatina de inmediato mientras se retira el actual',
      riesgo: RISK.BAJO,
      stopSteps,
      startSteps: [
        { dia: 'Día 1', accion: 'Iniciar agomelatina 25 mg/noche (puede partir junto con el descenso: no interactúa)' },
        { dia: 'Semana 2-4', accion: 'Si respuesta insuficiente, subir a 50 mg/noche' },
      ],
      warnings: [W.discontinuacion],
      notas,
    };
  }

  // ── 7. Tricíclico involucrado: cross-taper 25% cada 3 días ────────────
  // PsychiatryNet retira en cuartos AMBOS fármacos cuando interviene un TCA
  // (p. ej. Sertraline-amitriptyline), no sólo el tricíclico.
  if (from.group === 'triciclico' || to.group === 'triciclico') {
    const stopSteps = stopCuartos(from, dosisActual);
    const startSteps = to.group === 'triciclico' ? startCuartos(to, 0) : startMitadYSemana(to, 0);
    const tcaWarnings = [W.tcaMonitoreo, W.serotoninergico];
    if (from.group === 'triciclico') tcaWarnings.push(W.tcaAnticolinergico);
    if (from.cyp2d6 && to.group === 'triciclico') {
      tcaWarnings.push(`${from.label} inhibe CYP2D6 y eleva los niveles del tricíclico: mantener dosis bajas durante el traslape.`);
    }
    if (toKey === 'bupropion' || fromKey === 'bupropion') {
      tcaWarnings.push('Bupropión + tricíclico: ambos bajan el umbral convulsivante y bupropión eleva los niveles del tricíclico. Traslape con dosis mínimas.');
    }
    return {
      ...plan,
      estrategia: 'cross-tca',
      titulo: 'Cross-taper lento: 25% cada 3 días en ambos sentidos',
      riesgo: RISK.MODERADO,
      stopSteps,
      startSteps,
      warnings: tcaWarnings,
      notas,
    };
  }

  // ── 8. Patrón por defecto: taper & switch solapado de a semana ────────
  const defaultWarnings = [W.serotoninergico, W.discontinuacion];
  if (from.cyp2d6 && (toKey === 'venlafaxina' || toKey === 'desvenlafaxina')) {
    defaultWarnings.push(`${from.label} inhibe CYP2D6 y frena el metabolismo de ${to.label}: mantener dosis inicial baja durante el traslape.`);
  }
  if (!from.serotonergic && !to.serotonergic) {
    // p. ej. bupropión → mirtazapina: el riesgo serotoninérgico no aplica
    defaultWarnings.shift();
  }
  return {
    ...plan,
    estrategia: 'taper-switch',
    titulo: 'Taper & switch solapado (patrón estándar)',
    riesgo: RISK.BAJO,
    stopSteps: stopMitadYSemana(from, dosisActual),
    startSteps: startMitadYSemana(to, 0),
    warnings: defaultWarnings,
    notas,
  };
}

/** URL del par en PsychiatryNet (para citar la fuente específica). */
const WIKI_NAMES = {
  fluoxetina: 'Fluoxetine', sertralina: 'Sertraline', escitalopram: 'Escitalopram',
  citalopram: 'Citalopram', paroxetina: 'Paroxetine', fluvoxamina: 'Fluvoxamine',
  venlafaxina: 'Venlafaxine', duloxetina: 'Duloxetine', mirtazapina: 'Mirtazapine',
  bupropion: 'Bupropion', trazodona: 'Trazodone', vortioxetina: 'Vortioxetine',
  agomelatina: 'Agomelatine', amitriptilina: 'Amitriptyline', clomipramina: 'Clomipramine',
  imipramina: 'Imipramine', nortriptilina: 'Nortriptyline', moclobemida: 'Moclobemide',
};

export function wikiPairUrl(fromKey, toKey) {
  const a = WIKI_NAMES[fromKey];
  const b = WIKI_NAMES[toKey];
  if (!a || !b) return 'https://wiki.psychiatrienet.nl/wiki/SwitchAntidepressants';
  return `https://wiki.psychiatrienet.nl/wiki/${a}-${b.toLowerCase()}`;
}
