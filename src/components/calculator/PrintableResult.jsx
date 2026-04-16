import React from 'react';

export default function PrintableResult({ title, inputs, result, patientInfo }) {
  const printDate = new Date().toLocaleString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-result, #printable-result * {
            visibility: visible;
          }
          #printable-result {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20mm;
          }
          @page {
            margin: 15mm;
            size: A4;
          }
        }
      `}</style>
      
      <div id="printable-result" className="bg-white p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="border-b-4 border-blue-600 pb-4 mb-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">{title}</h1>
          <p className="text-sm text-slate-600">Hospital de Bulnes - Servicio de Salud Ñuble</p>
          <p className="text-xs text-slate-500 mt-1">Resultado de Evaluación Clínica</p>
        </div>

        {/* Patient Info */}
        {patientInfo && (patientInfo.name || patientInfo.rut || patientInfo.record) && (
          <div className="mb-6 p-4 bg-slate-50 rounded-lg">
            <h2 className="text-sm font-bold text-slate-900 mb-3">Información del Paciente</h2>
            <div className="grid grid-cols-3 gap-4 text-sm">
              {patientInfo.name && (
                <div>
                  <span className="text-slate-600">Nombre:</span>
                  <p className="font-semibold">{patientInfo.name}</p>
                </div>
              )}
              {patientInfo.rut && (
                <div>
                  <span className="text-slate-600">RUT:</span>
                  <p className="font-semibold">{patientInfo.rut}</p>
                </div>
              )}
              {patientInfo.record && (
                <div>
                  <span className="text-slate-600">Nº Ficha:</span>
                  <p className="font-semibold">{patientInfo.record}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Inputs Used */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-slate-900 mb-3">Parámetros Evaluados</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {Object.entries(inputs || {}).map(([key, value]) => (
              <div key={key} className="flex justify-between p-3 bg-slate-50 rounded">
                <span className="text-slate-700 text-sm">{key}:</span>
                <span className="font-semibold text-sm">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="mb-6 p-5 bg-blue-50 border-2 border-blue-200 rounded-lg">
          <h2 className="text-lg font-bold text-blue-900 mb-3">Resultado</h2>
          {result.score !== undefined && (
            <div className="text-center mb-4">
              <div className="text-5xl font-bold text-blue-600">{result.score}</div>
              {result.label && <p className="text-sm text-slate-600 mt-1">{result.label}</p>}
            </div>
          )}
          
          {result.interpretation && (
            <div className="mt-4">
              <h3 className="font-semibold text-slate-900 mb-2">Interpretación:</h3>
              <p className="text-sm text-slate-700">{result.interpretation}</p>
            </div>
          )}
          
          {result.recommendations?.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold text-slate-900 mb-2">Recomendaciones:</h3>
              <ul className="space-y-1">
                {result.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                    <span>•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Print Info */}
        <div className="border-t border-slate-300 pt-4 mb-8">
          <p className="text-xs text-slate-600">Fecha y hora de impresión: {printDate}</p>
        </div>

        {/* Signature */}
        <div className="mt-12 space-y-6">
          <div className="border-b border-slate-400 pb-2">
            <p className="text-xs text-slate-600 mb-1">Firma del profesional:</p>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="border-b border-slate-400 pb-2">
              <p className="text-xs text-slate-600 mb-1">Nombre:</p>
            </div>
            <div className="border-b border-slate-400 pb-2">
              <p className="text-xs text-slate-600 mb-1">Cargo / Unidad:</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-4 border-t border-slate-200 text-center">
          <p className="text-xs text-slate-500">
            Este documento es generado automáticamente por el sistema de Guía Clínica Hospital de Bulnes
          </p>
        </div>
      </div>
    </>
  );
}