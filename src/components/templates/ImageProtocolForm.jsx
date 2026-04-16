import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Download, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';

export default function ImageProtocolForm({ onClose }) {
  const [formData, setFormData] = useState({
    doctorName: '',
    doctorRut: '',
    patientName: '',
    patientRut: '',
    patientBirthDate: '',
    patientAge: '',
    isolation: 'NO',
    diagnosis: '',
    requestedExam: '',
    medicalJustification: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);

  // Calculate age from birth date
  const calculateAge = (birthDate) => {
    if (!birthDate) return '';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age.toString();
  };

  const handleBirthDateChange = (e) => {
    const birthDate = e.target.value;
    setFormData({
      ...formData,
      patientBirthDate: birthDate,
      patientAge: calculateAge(birthDate)
    });
  };

  const generateDocument = async () => {
    setIsGenerating(true);
    
    try {
      const currentDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es });
      
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            // Title
            new Paragraph({
              text: 'ANEXO N°1 INTERCONSULTA',
              heading: 'Heading1',
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 }
            }),
            new Paragraph({
              text: 'INTERCONSULTA A UNIDAD DE IMAGENOLOGIA DEL HOSPITAL CLINICO HERMINDA MARTIN',
              alignment: AlignmentType.CENTER,
              spacing: { after: 400 }
            }),
            
            // Doctor Info Table
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1 },
                bottom: { style: BorderStyle.SINGLE, size: 1 },
                left: { style: BorderStyle.SINGLE, size: 1 },
                right: { style: BorderStyle.SINGLE, size: 1 },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
                insideVertical: { style: BorderStyle.SINGLE, size: 1 }
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ text: 'NOMBRE MÉDICO SOLICITANTE', bold: true })],
                      width: { size: 40, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                      children: [new Paragraph(formData.doctorName.toUpperCase() || '________________________')],
                      width: { size: 60, type: WidthType.PERCENTAGE }
                    })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: 'RUT', bold: true })] }),
                    new TableCell({ children: [new Paragraph(formData.doctorRut || '________________')] })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: 'PROCEDENCIA', bold: true })] }),
                    new TableCell({ children: [new Paragraph('HCSF BULNES')] })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: 'FECHA', bold: true })] }),
                    new TableCell({ children: [new Paragraph(currentDate)] })
                  ]
                })
              ]
            }),
            
            new Paragraph({ text: '', spacing: { after: 400 } }),
            
            // Patient Info Table
            new Paragraph({
              text: 'DATOS DEL PACIENTE',
              heading: 'Heading2',
              spacing: { after: 200 }
            }),
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1 },
                bottom: { style: BorderStyle.SINGLE, size: 1 },
                left: { style: BorderStyle.SINGLE, size: 1 },
                right: { style: BorderStyle.SINGLE, size: 1 },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
                insideVertical: { style: BorderStyle.SINGLE, size: 1 }
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: 'Nombre', bold: true })], width: { size: 30, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph(formData.patientName.toUpperCase() || '__________________________')] })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: 'RUT', bold: true })] }),
                    new TableCell({ children: [new Paragraph(formData.patientRut || '________________')] })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: 'Fecha de Nacimiento', bold: true })] }),
                    new TableCell({ children: [new Paragraph(formData.patientBirthDate ? format(new Date(formData.patientBirthDate), 'dd/MM/yyyy') : '__________')] })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: 'Edad', bold: true })] }),
                    new TableCell({ children: [new Paragraph(`${formData.patientAge || '___'} años`)] })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: 'Aislamiento', bold: true })] }),
                    new TableCell({ children: [new Paragraph(formData.isolation)] })
                  ]
                })
              ]
            }),
            
            new Paragraph({ text: '', spacing: { after: 400 } }),
            
            // Clinical Info Table
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1 },
                bottom: { style: BorderStyle.SINGLE, size: 1 },
                left: { style: BorderStyle.SINGLE, size: 1 },
                right: { style: BorderStyle.SINGLE, size: 1 },
                insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
                insideVertical: { style: BorderStyle.SINGLE, size: 1 }
              },
              rows: [
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: 'HIPÓTESIS DIAGNÓSTICA', bold: true })], width: { size: 30, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph(formData.diagnosis || '_______________________________________________')] })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: 'EXAMEN SOLICITADO', bold: true })] }),
                    new TableCell({ children: [new Paragraph(formData.requestedExam || '_______________________________________________')] })
                  ]
                }),
                new TableRow({
                  children: [
                    new TableCell({ children: [new Paragraph({ text: 'JUSTIFICACIÓN MÉDICA', bold: true })] }),
                    new TableCell({ children: [new Paragraph(formData.medicalJustification || '________________________________________________________________________________________________________________________________________________________________________________________________________')] })
                  ]
                })
              ]
            }),
            
            new Paragraph({ text: '', spacing: { after: 600 } }),
            
            // Signature
            new Paragraph({
              text: '_____________________________',
              alignment: AlignmentType.LEFT
            }),
            new Paragraph({
              text: 'Firma y Timbre Médico Solicitante',
              alignment: AlignmentType.LEFT
            })
          ]
        }]
      });

      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Protocolo_Imagenes_${formData.patientRut || 'paciente'}_${format(new Date(), 'yyyy-MM-dd')}.docx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating document:', error);
      alert('Error al generar el documento');
    } finally {
      setIsGenerating(false);
    }
  };

  const isFormValid = formData.doctorName && formData.doctorRut && formData.patientName && 
                      formData.patientRut && formData.diagnosis && formData.requestedExam;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900 flex items-center justify-between">
            Protocolo de Solicitud de Imágenes
            <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
              <X className="h-5 w-5" />
            </button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Doctor Info */}
          <div className="bg-blue-50 rounded-xl p-4 space-y-4">
            <h3 className="font-semibold text-blue-900">Datos del Médico Solicitante</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Nombre Completo *</Label>
                <Input
                  value={formData.doctorName}
                  onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
                  placeholder="Dr. Juan Pérez García"
                  className="bg-white"
                />
              </div>
              <div>
                <Label>RUT *</Label>
                <Input
                  value={formData.doctorRut}
                  onChange={(e) => setFormData({ ...formData, doctorRut: e.target.value })}
                  placeholder="12.345.678-9"
                  className="bg-white"
                />
              </div>
            </div>
            <div className="text-sm text-blue-700 bg-white/50 rounded-lg p-3">
              <strong>Procedencia:</strong> Hospital de Bulnes (se completará automáticamente)
            </div>
          </div>

          {/* Patient Info */}
          <div className="bg-green-50 rounded-xl p-4 space-y-4">
            <h3 className="font-semibold text-green-900">Datos del Paciente</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Nombre Completo *</Label>
                <Input
                  value={formData.patientName}
                  onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                  placeholder="María González López"
                  className="bg-white"
                />
              </div>
              <div>
                <Label>RUT *</Label>
                <Input
                  value={formData.patientRut}
                  onChange={(e) => setFormData({ ...formData, patientRut: e.target.value })}
                  placeholder="12.345.678-9"
                  className="bg-white"
                />
              </div>
              <div>
                <Label>Fecha de Nacimiento *</Label>
                <Input
                  type="date"
                  value={formData.patientBirthDate}
                  onChange={handleBirthDateChange}
                  className="bg-white"
                />
              </div>
              <div>
                <Label>Edad (calculada automáticamente)</Label>
                <Input
                  value={formData.patientAge ? `${formData.patientAge} años` : ''}
                  disabled
                  className="bg-slate-100"
                />
              </div>
            </div>

            <div>
              <Label>Aislamiento</Label>
              <div className="flex gap-4 mt-2">
                <button
                  onClick={() => setFormData({ ...formData, isolation: 'NO' })}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                    formData.isolation === 'NO'
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  NO
                </button>
                <button
                  onClick={() => setFormData({ ...formData, isolation: 'SÍ' })}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                    formData.isolation === 'SÍ'
                      ? 'bg-red-600 text-white shadow-md'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  SÍ
                </button>
              </div>
            </div>
          </div>

          {/* Clinical Info */}
          <div className="space-y-4">
            <div>
              <Label>Hipótesis Diagnóstica *</Label>
              <Textarea
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                placeholder="Ej: Sospecha de neumonía bilateral..."
                rows={3}
                className="bg-white"
              />
            </div>

            <div>
              <Label>Examen Solicitado *</Label>
              <Input
                value={formData.requestedExam}
                onChange={(e) => setFormData({ ...formData, requestedExam: e.target.value })}
                placeholder="Ej: Radiografía de tórax AP y lateral"
                className="bg-white"
              />
            </div>

            <div>
              <Label>Justificación Médica *</Label>
              <Textarea
                value={formData.medicalJustification}
                onChange={(e) => setFormData({ ...formData, medicalJustification: e.target.value })}
                placeholder="Describa la justificación médica para la solicitud del examen..."
                rows={6}
                className="bg-white"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={generateDocument}
              disabled={!isFormValid || isGenerating}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generar y Descargar Word
                </>
              )}
            </Button>
          </div>

          {!isFormValid && (
            <p className="text-sm text-amber-600 bg-amber-50 rounded-lg p-3">
              * Complete todos los campos obligatorios para generar el documento
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}