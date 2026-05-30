// Curva gráfica de PCR (mg/dL) en el tiempo, con marcadores verticales para el
// inicio de cada antibiótico y, si existe, su término/suspensión.
import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, CartesianGrid, Label,
} from 'recharts';

const atbVigente = (a) => !(a.termino_manual && a.termino);

const fmtTick = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const parseValue = (value) => {
  const n = parseFloat(String(value ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

export default function InflammatoryCurve({ parametros = [], antibioticos = [] }) {
  // Series de laboratorio (filtra filas sin fecha o sin valores numéricos).
  const data = parametros
    .map((r) => ({
      fecha: r.fecha,
      pcr: parseValue(r.pcr),
      blancos: parseValue(r.blancos),
    }))
    .filter((r) => r.fecha && (r.pcr != null || r.blancos != null))
    .map((r) => ({
      ts: new Date(r.fecha + 'T12:00:00').getTime(),
      pcr: r.pcr ?? undefined,
      blancos: r.blancos ?? undefined,
    }))
    .sort((a, b) => a.ts - b.ts);

  // Marcadores: inicio de cada ATB y fecha de término si fue registrada.
  const markers = antibioticos
    .filter((a) => a.nombre && a.inicio)
    .flatMap((a) => {
      const vigente = atbVigente(a);
      const start = {
        ts: new Date(a.inicio + 'T12:00:00').getTime(),
        name: a.nombre,
        event: 'inicio',
        stroke: vigente ? '#059669' : '#fca5a5',
        labelFill: vigente ? '#047857' : '#b91c1c',
        strokeDasharray: vigente ? '4 3' : '3 3',
      };
      if (vigente) return [start];
      return [
        start,
        {
          ts: new Date(a.termino + 'T12:00:00').getTime(),
          name: a.nombre,
          event: 'término',
          stroke: '#ef4444',
          labelFill: '#b91c1c',
          strokeDasharray: '2 2',
        },
      ];
    })
    .filter((m) => Number.isFinite(m.ts))
    .sort((a, b) => a.ts - b.ts);

  if (data.length === 0 && markers.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-500">
        Cargá fechas + PCR en la planilla y/o el inicio de algún antibiótico para ver la curva.
      </div>
    );
  }

  // Dominio del eje X: une ambas series para que los marcadores siempre encajen.
  const allTs = [...data.map((d) => d.ts), ...markers.map((m) => m.ts)];
  const minTs = Math.min(...allTs);
  const maxTs = Math.max(...allTs);
  const day = 86400000;
  const span = Math.max(maxTs - minTs, day);
  const pad = Math.max(span * 0.05, day);
  const domain = [minTs - pad, maxTs + pad];

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-semibold text-slate-600">Curva de PCR, glóbulos blancos e inicio/término de antibióticos</p>
        <div className="flex items-center gap-3 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-sky-500" /> PCR</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-violet-500" /> GB</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 bg-emerald-500" /> ATB vigente</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 bg-rose-300" /> Inicio ATB terminado</span>
          <span className="inline-flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 bg-red-500" /> Término ATB</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 72, right: 24, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="ts" type="number" domain={domain} scale="time"
            tickFormatter={fmtTick} stroke="#94a3b8" fontSize={11}
          />
          <YAxis
            yAxisId="left"
            stroke="#94a3b8" fontSize={11} allowDecimals
            label={{ value: 'PCR (mg/dL)', angle: -90, position: 'insideLeft', offset: 12, style: { fontSize: 11, fill: '#64748b' } }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            stroke="#a78bfa" fontSize={11} allowDecimals
            label={{ value: 'GB (×10³)', angle: 90, position: 'insideRight', offset: 10, style: { fontSize: 11, fill: '#7c3aed' } }}
          />
          <Tooltip
            formatter={(v, name) => {
              if (name === 'pcr') return [`${v} mg/dL`, 'PCR'];
              if (name === 'blancos') return [`${v} ×10³`, 'Glóbulos blancos'];
              return [v, name];
            }}
            labelFormatter={(ts) => fmtTick(ts)}
            contentStyle={{ fontSize: 12 }}
          />
          {markers.map((m, i) => (
            <ReferenceLine
              key={`${m.name}-${m.event}-${m.ts}-${i}`}
              x={m.ts}
              yAxisId="left"
              stroke={m.stroke}
              strokeDasharray={m.strokeDasharray}
              strokeWidth={2}
              ifOverflow="extendDomain"
            >
              <Label
                value={`${m.event === 'término' ? 'Fin ' : ''}${m.name} · ${fmtTick(m.ts)}`}
                position="top"
                fill={m.labelFill}
                fontSize={10}
                offset={8 + (i % 3) * 16}
              />
            </ReferenceLine>
          ))}
          {data.length > 0 && (
            <>
              <Line
                yAxisId="left"
                type="monotone" dataKey="pcr" stroke="#0284c7" strokeWidth={2}
                dot={{ r: 4, fill: '#0ea5e9' }} activeDot={{ r: 6 }} isAnimationActive={false}
                connectNulls={false}
              />
              <Line
                yAxisId="right"
                type="monotone" dataKey="blancos" stroke="#7c3aed" strokeWidth={2}
                dot={{ r: 4, fill: '#8b5cf6' }} activeDot={{ r: 6 }} isAnimationActive={false}
                connectNulls={false}
              />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
      {data.length === 0 && (
        <p className="text-[11px] text-slate-400 text-center mt-1">
          Sin valores de PCR ni glóbulos blancos aún — se muestran solo los eventos de antibióticos.
        </p>
      )}
    </div>
  );
}
