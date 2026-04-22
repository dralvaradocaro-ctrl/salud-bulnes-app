import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle,
} from 'docx';

const SINGLE = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
const NONE   = { style: BorderStyle.NONE,   size: 0, color: 'FFFFFF' };

const allBorders = { top: SINGLE, bottom: SINGLE, left: SINGLE, right: SINGLE };
const noBorders  = { top: NONE,   bottom: NONE,   left: NONE,   right: NONE   };

const FONT = 'Arial';
const SZ   = 22; // 11 pt (half-points)

// Cell padding — increased for breathing room
const cellPad = { top: 100, bottom: 100, left: 140, right: 140 };

function run(text, bold = false) {
  return new TextRun({ text, bold, size: SZ, font: FONT });
}

function labelCell(text, widthPct, opts = {}) {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    columnSpan: opts.span,
    margins: cellPad,
    borders: opts.borders || allBorders,
    children: [
      new Paragraph({ children: [run(text, true)] }),
    ],
  });
}

function valueCell(text, widthPct, opts = {}) {
  const lines = (text || '').split('\n').filter(l => l.trim());
  const paragraphs = lines.length > 0
    ? lines.map(l => new Paragraph({ children: [run(l)] }))
    : [new Paragraph({ children: [run('')] })];
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    columnSpan: opts.span,
    margins: cellPad,
    borders: opts.borders || allBorders,
    children: paragraphs,
  });
}

function emptyLines(n) {
  return Array.from({ length: n }, () =>
    new Paragraph({ children: [run('')] })
  );
}

const EXAMS = [
  // ── Radiografías ──────────────────────────────────────────────────────
  'Radiografía de tórax AP y lateral',
  'Radiografía de tórax AP',
  'Radiografía de abdomen simple',
  'Radiografía de cráneo AP y lateral',
  'Radiografía de senos paranasales',
  'Radiografía de columna cervical AP y lateral',
  'Radiografía de columna dorsal AP y lateral',
  'Radiografía de columna lumbar AP y lateral',
  'Radiografía de pelvis AP',
  'Radiografía de cadera derecha AP',
  'Radiografía de cadera izquierda AP',
  'Radiografía de hombro derecho AP',
  'Radiografía de hombro izquierdo AP',
  'Radiografía de codo derecho AP y lateral',
  'Radiografía de codo izquierdo AP y lateral',
  'Radiografía de muñeca derecha AP y lateral',
  'Radiografía de muñeca izquierda AP y lateral',
  'Radiografía de mano derecha',
  'Radiografía de mano izquierda',
  'Radiografía de rodilla derecha AP y lateral',
  'Radiografía de rodilla izquierda AP y lateral',
  'Radiografía de tobillo derecho AP y lateral',
  'Radiografía de tobillo izquierdo AP y lateral',
  'Radiografía de pie derecho',
  'Radiografía de pie izquierdo',
  // ── Ecografías ────────────────────────────────────────────────────────
  'Ecografía abdominal',
  'Ecografía abdominal y pelviana',
  'Ecografía pélvica',
  'Ecografía transvaginal',
  'Ecografía obstétrica',
  'Ecografía renal y vías urinarias',
  'Ecografía hepática',
  'Ecografía tiroidea',
  'Ecografía testicular',
  'Ecografía mamaria bilateral',
  'Ecografía partes blandas cuello',
  'Ecografía partes blandas extremidad superior derecha',
  'Ecografía partes blandas extremidad superior izquierda',
  'Ecografía partes blandas extremidad inferior derecha',
  'Ecografía partes blandas extremidad inferior izquierda',
  'Ecografía de hombro derecho',
  'Ecografía de hombro izquierdo',
  'Ecografía de rodilla derecha',
  'Ecografía de rodilla izquierda',
  'Ecografía de tobillo derecho',
  'Ecografía de tobillo izquierdo',
  'Ecografía de muñeca derecha',
  'Ecografía de muñeca izquierda',
  'Ecografía de cadera (pediátrica)',
  'Ecografía Doppler venoso extremidades inferiores',
  'Ecografía Doppler arterial extremidades inferiores',
  'Ecografía Doppler carotídea',
  // ── TAC ───────────────────────────────────────────────────────────────
  'TAC de cerebro sin contraste',
  'TAC de cerebro con contraste',
  'TAC de tórax',
  'TAC de tórax con contraste',
  'TAC de abdomen y pelvis',
  'TAC de abdomen y pelvis con contraste',
  'TAC de cuello',
  'TAC de cuello con contraste',
  'TAC de senos paranasales',
  'TAC de órbitas',
  'TAC de macizo facial',
  'TAC de columna cervical',
  'TAC de columna dorsal',
  'TAC de columna lumbar',
  'TAC de pelvis',
  'TAC de extremidad superior derecha',
  'TAC de extremidad superior izquierda',
  'TAC de extremidad inferior derecha',
  'TAC de extremidad inferior izquierda',
  'AngioTAC cerebral',
  'AngioTAC de aorta',
  'AngioTAC de tórax (protocolo TEP)',
  // ── Resonancia Magnética ──────────────────────────────────────────────
  'RM de cerebro sin contraste',
  'RM de cerebro con contraste',
  'RM de columna cervical',
  'RM de columna dorsal',
  'RM de columna lumbar',
  'RM de hombro derecho',
  'RM de hombro izquierdo',
  'RM de rodilla derecha',
  'RM de rodilla izquierda',
  'RM de cadera derecha',
  'RM de cadera izquierda',
  'RM de muñeca derecha',
  'RM de muñeca izquierda',
  'RM de tobillo derecho',
  'RM de tobillo izquierdo',
  'RM de abdomen',
  'RM de pelvis',
  'RM cardíaca',
];

function ExamAutocomplete({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const containerRef = useRef(null);

  // Sync si el padre cambia el valor externamente
  useEffect(() => { setQuery(value); }, [value]);

  // Cierra al hacer click fuera
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const normalize = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const suggestions = query.length >= 2
    ? EXAMS.filter(e => normalize(e).includes(normalize(query))).slice(0, 8)
    : [];

  const handleInput = (e) => {
    setQuery(e.target.value);
    onChange(e.target.value);
    setOpen(true);
  };

  const handleSelect = (exam) => {
    setQuery(exam);
    onChange(exam);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative mt-1">
      <input
        type="text"
        value={query}
        onChange={handleInput}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder="Ej: Ecografía partes blandas extremidad superior izquierda"
        className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          {suggestions.map((exam, i) => {
            const norm = normalize(query);
            const idx  = normalize(exam).indexOf(norm);
            const pre  = exam.slice(0, idx);
            const mid  = exam.slice(idx, idx + query.length);
            const post = exam.slice(idx + query.length);
            return (
              <li key={i}>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(exam); }}
                  className="w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-800 transition-colors"
                >
                  {pre}<strong className="text-blue-700">{mid}</strong>{post}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function formatRut(raw) {
  const clean = raw.replace(/[^0-9kK]/g, '').toUpperCase();
  if (clean.length < 2) return clean;
  const dv   = clean.slice(-1);
  const body = clean.slice(0, -1);
  const bodyFormatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${bodyFormatted}-${dv}`;
}

function calcAge(birthDate) {
  if (!birthDate) return '';
  const today = new Date();
  const birth = new Date(birthDate + 'T00:00:00');
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 ? age.toString() : '';
}

export default function ImageProtocolForm({ onClose }) {
  const [formData, setFormData] = useState({
    patientName: '',
    patientRut: '',
    patientBirthDate: '',
    patientAge: '',
    isolation: 'NO',
    diagnosis: '',
    requestedExam: '',
    clinicalText: '',
    doctorName: '',
    doctorRut: '',
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleRut = (field) => (e) => {
    setFormData(prev => ({ ...prev, [field]: formatRut(e.target.value) }));
  };

  const handleBirthDate = (e) => {
    const birthDate = e.target.value;
    setFormData(prev => ({ ...prev, patientBirthDate: birthDate, patientAge: calcAge(birthDate) }));
  };

  const set = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));

  const generateDocument = async () => {
    setIsGenerating(true);
    try {
      const dateStr   = format(new Date(), 'dd/MM/yyyy');
      const birthStr  = formData.patientBirthDate
        ? format(new Date(formData.patientBirthDate + 'T00:00:00'), 'dd-MM-yyyy')
        : '';
      const ageStr    = formData.patientAge ? `${formData.patientAge} años` : '';
      const doctorUC  = formData.doctorName.toUpperCase();

      // ── Header table (title left, AISLAMIENTO/FECHA right) ──────────────
      const headerTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: noBorders,
        rows: [
          new TableRow({
            children: [
              // Left: titles
              new TableCell({
                width: { size: 70, type: WidthType.PERCENTAGE },
                borders: noBorders,
                children: [
                  new Paragraph({
                    children: [run('ANEXO N°1 INTERCONSULTA.', true)],
                    spacing: { after: 80 },
                  }),
                  new Paragraph({
                    children: [run('INTERCONSULTA A UNIDAD DE IMAGENOLOGIA DEL HOSPITAL CLINICO HERMINDA MARTIN', true)],
                  }),
                ],
              }),
              // Right: AISLAMIENTO / FECHA box
              new TableCell({
                width: { size: 30, type: WidthType.PERCENTAGE },
                borders: noBorders,
                children: [
                  new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: allBorders,
                    rows: [
                      new TableRow({
                        children: [
                          labelCell('AISLAMIENTO', 50),
                          valueCell(formData.isolation, 50),
                        ],
                      }),
                      new TableRow({
                        children: [
                          labelCell('FECHA', 50),
                          valueCell(dateStr, 50),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      });

      // ── Main patient + exam table (4 logical columns: 20 | 45 | 18 | 17) ──
      // Most rows: col1 label + col2-4 value (span=3)
      // EDAD row: 4 separate cells

      const mainTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: allBorders,
        rows: [
          // NOMBRE
          new TableRow({ children: [
            labelCell('NOMBRE', 20),
            valueCell(formData.patientName.toUpperCase(), 80, { span: 3 }),
          ]}),
          // RUT
          new TableRow({ children: [
            labelCell('RUT', 20),
            valueCell(formData.patientRut, 80, { span: 3 }),
          ]}),
          // EDAD | value | FECHA DE NACIMIENTO | value
          new TableRow({ children: [
            labelCell('EDAD', 20),
            valueCell(ageStr, 27),
            labelCell('FECHA DE\nNACIMIENTO:', 18),
            valueCell(birthStr, 35),
          ]}),
          // PROCEDENCIA
          new TableRow({ children: [
            labelCell('PROCEDENCIA', 20),
            valueCell('HOSPITAL DE BULNES', 80, { span: 3 }),
          ]}),
          // HIPOTESIS DIAGNÓSTICA
          new TableRow({ children: [
            labelCell('HIPOTESIS\nDIAGNÓSTICA', 20),
            valueCell(formData.diagnosis, 80, { span: 3 }),
          ]}),
          // EXAMEN SOLICITADO: label + exam name in same cell (full width)
          new TableRow({ children: [
            new TableCell({
              columnSpan: 4,
              margins: cellPad,
              borders: allBorders,
              children: [
                new Paragraph({
                  children: [
                    run('EXAMEN SOLICITADO: ', true),
                    run(formData.requestedExam.toUpperCase()),
                  ],
                }),
              ],
            }),
          ]}),
          // Clinical justification text — tall cell
          new TableRow({ children: [
            new TableCell({
              columnSpan: 4,
              margins: cellPad,
              borders: allBorders,
              children: [
                ...formData.clinicalText
                  .split('\n')
                  .filter(l => l.trim())
                  .map(l => new Paragraph({ children: [run(l)] })),
                // Ensure minimum height with blank lines
                ...emptyLines(Math.max(0, 6 - formData.clinicalText.split('\n').filter(l => l.trim()).length)),
              ],
            }),
          ]}),
        ],
      });

      // ── Doctor signature (centered, below table) ──────────────────────────
      const signatureBlock = [
        new Paragraph({ text: '', spacing: { before: 400 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [run('NOMBRE MEDICO SOLICITANTE', true)],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [run(`DR. ${doctorUC}${formData.doctorRut ? ` RUT ${formData.doctorRut}` : ''}`)],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [run('HCSF BULNES')],
        }),
      ];

      const doc = new Document({
        sections: [{
          properties: {
            page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } },
          },
          children: [
            headerTable,
            new Paragraph({ text: '', spacing: { after: 160 } }),
            mainTable,
            ...signatureBlock,
          ],
        }],
      });

      const blob = await Packer.toBlob(doc);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `Interconsulta_Imagenologia_${formData.patientRut || 'paciente'}_${format(new Date(), 'yyyy-MM-dd')}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generando documento:', err);
      alert('Error al generar el documento. Revise la consola.');
    } finally {
      setIsGenerating(false);
    }
  };

  const isFormValid =
    formData.patientName &&
    formData.patientRut &&
    formData.diagnosis &&
    formData.requestedExam &&
    formData.doctorName;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900 flex items-center justify-between">
            Interconsulta a Imagenología — HCHM
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
              <X className="h-5 w-5" />
            </button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">

          {/* Patient */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-4">
            <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Datos del Paciente</h3>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <Label className="text-xs text-slate-600">Nombre completo *</Label>
                <Input value={formData.patientName} onChange={set('patientName')} placeholder="Manuel Bahamondes Henríquez" className="bg-white mt-1" />
              </div>
              <div>
                <Label className="text-xs text-slate-600">RUT *</Label>
                <Input value={formData.patientRut} onChange={handleRut('patientRut')} placeholder="5.822.927-K" className="bg-white mt-1" />
              </div>
              <div>
                <Label className="text-xs text-slate-600">Fecha de nacimiento</Label>
                <Input type="date" value={formData.patientBirthDate} onChange={handleBirthDate} className="bg-white mt-1" />
              </div>
              {formData.patientAge && (
                <div className="md:col-span-2">
                  <p className="text-xs text-slate-500">Edad calculada: <strong>{formData.patientAge} años</strong></p>
                </div>
              )}
            </div>

            <div>
              <Label className="text-xs text-slate-600">Aislamiento</Label>
              <div className="flex gap-3 mt-1">
                {['NO', 'SÍ'].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setFormData(prev => ({ ...prev, isolation: opt }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                      formData.isolation === opt
                        ? opt === 'NO' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Clinical */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Información Clínica</h3>
            <div>
              <Label className="text-xs text-slate-600">Hipótesis diagnóstica *</Label>
              <Textarea
                value={formData.diagnosis}
                onChange={set('diagnosis')}
                placeholder={"- Celulitis extremidad superior derecha\n- Obs absceso subcutáneo"}
                rows={3}
                className="bg-white mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-600">Examen solicitado *</Label>
              <ExamAutocomplete
                value={formData.requestedExam}
                onChange={(val) => setFormData(prev => ({ ...prev, requestedExam: val }))}
              />
            </div>
            <div>
              <Label className="text-xs text-slate-600">Descripción clínica / justificación</Label>
              <Textarea
                value={formData.clinicalText}
                onChange={set('clinicalText')}
                placeholder="Paciente hospitalizado en contexto de celulitis..."
                rows={5}
                className="bg-white mt-1"
              />
            </div>
          </div>

          {/* Doctor */}
          <div className="bg-blue-50 rounded-xl p-4 space-y-3">
            <h3 className="font-semibold text-blue-800 text-sm uppercase tracking-wide">Médico Solicitante</h3>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-blue-700">Nombre completo *</Label>
                <Input
                  value={formData.doctorName}
                  onChange={set('doctorName')}
                  placeholder="Fernando Alvarado Caro"
                  className="bg-white mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-blue-700">RUT</Label>
                <Input
                  value={formData.doctorRut}
                  onChange={handleRut('doctorRut')}
                  placeholder="20.238.504-4"
                  className="bg-white mt-1"
                />
              </div>
            </div>
            <p className="text-xs text-blue-600">Procedencia: <strong>HCSF Bulnes</strong> · Fecha: <strong>{format(new Date(), 'dd/MM/yyyy')}</strong> (automáticas)</p>
          </div>

          {!isFormValid && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
              Complete los campos obligatorios (*) para generar el documento.
            </p>
          )}

          <div className="flex gap-3 pt-2 border-t">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button
              onClick={generateDocument}
              disabled={!isFormValid || isGenerating}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isGenerating
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generando...</>
                : <><Download className="h-4 w-4 mr-2" />Descargar Word</>
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
