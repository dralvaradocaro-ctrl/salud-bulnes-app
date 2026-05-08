import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/medispense/components/ui/card';
import { Input } from '@/medispense/components/ui/input';
import { Button } from '@/medispense/components/ui/button';
import { Label } from '@/medispense/components/ui/label';
import { Textarea } from '@/medispense/components/ui/textarea';
import { Badge } from '@/medispense/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/medispense/components/ui/dialog';
import { ArrowLeft, Plus, BookOpen, QrCode, Printer, Pencil, Trash2, Video, FileText, Wand2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '@/medispense/integrations/supabase/client';
import { useAuth } from '@/medispense/contexts/AuthContext';
import { useToast } from '@/medispense/hooks/use-toast';

interface EducationPage {
  id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  created_at: string;
}

export default function Education() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [pages, setPages] = useState<EducationPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPage, setEditingPage] = useState<EducationPage | null>(null);
  const [showQR, setShowQR] = useState<EducationPage | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '', video_url: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchPages(); }, []);

  const fetchPages = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('education_pages')
      .select('*')
      .order('created_at', { ascending: false });
    setPages((data as EducationPage[]) || []);
    setLoading(false);
  };

  const getPageUrl = (id: string) => `${window.location.origin}/educacion/${id}`;

  const openCreate = () => {
    setEditingPage(null);
    setFormData({ title: '', content: '', video_url: '' });
    setShowForm(true);
  };

  const openEdit = (page: EducationPage) => {
    setEditingPage(page);
    setFormData({ title: page.title, content: page.content || '', video_url: page.video_url || '' });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({ title: 'Error', description: 'El título es requerido', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (editingPage) {
        await supabase.from('education_pages').update({
          title: formData.title,
          content: formData.content || null,
          video_url: formData.video_url || null,
        }).eq('id', editingPage.id);
        toast({ title: 'Página actualizada' });
      } else {
        await supabase.from('education_pages').insert({
          title: formData.title,
          content: formData.content || null,
          video_url: formData.video_url || null,
          created_by: user!.id,
        });
        toast({ title: 'Página creada' });
      }
      setShowForm(false);
      fetchPages();
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo guardar', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta página educativa?')) return;
    await supabase.from('education_pages').delete().eq('id', id);
    toast({ title: 'Página eliminada' });
    fetchPages();
  };

  const printQR = (page: EducationPage) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const url = getPageUrl(page.id);
    printWindow.document.write(`
      <html><head><title>QR - ${page.title}</title></head>
      <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;">
        <h2>${page.title}</h2>
        <p style="color:#666;">Herramienta Educativa</p>
        <div id="qr-container"></div>
        <p style="margin-top:16px;font-size:12px;color:#999;">Escanea con la cámara de tu celular</p>
        <p style="font-size:10px;color:#bbb;word-break:break-all;max-width:300px;text-align:center;">${url}</p>
      </body></html>
    `);
    // We need to render SVG into the print window
    const svgEl = document.querySelector(`#qr-edu-${page.id} svg`);
    if (svgEl) printWindow.document.getElementById('qr-container')!.innerHTML = svgEl.outerHTML;
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/PrescripcionInteligente/dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Herramientas Educativas</h1>
            <p className="text-muted-foreground">Páginas de educación para pacientes</p>
          </div>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Nueva Página
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse-soft text-muted-foreground">Cargando...</div>
        </div>
      ) : pages.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Sin páginas educativas</h3>
            <p className="text-muted-foreground mb-4">Crea tu primera herramienta educativa para pacientes</p>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" /> Crear Página
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pages.map((page) => (
            <Card key={page.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    {page.video_url ? <Video className="h-4 w-4 text-primary shrink-0" /> : <FileText className="h-4 w-4 text-primary shrink-0" />}
                    {page.title}
                  </CardTitle>
                </div>
                <CardDescription className="line-clamp-2">
                  {page.content ? page.content.substring(0, 100) + (page.content.length > 100 ? '...' : '') : 'Sin contenido de texto'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-end gap-3">
                {page.video_url && (
                  <Badge variant="secondary" className="text-xs w-fit">
                    <Video className="h-3 w-3 mr-1" /> Video incluido
                  </Badge>
                )}
                <div className="hidden" id={`qr-edu-${page.id}`}>
                  <QRCodeSVG value={getPageUrl(page.id)} size={200} level="H" includeMargin />
                </div>
                <div className="flex gap-1 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => openEdit(page)}>
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowQR(page)}>
                    <QrCode className="h-3.5 w-3.5 mr-1" /> QR
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => printQR(page)}>
                    <Printer className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(page.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPage ? 'Editar Página' : 'Nueva Página Educativa'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                placeholder="Ej: Manejo de la Diabetes Tipo 2"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Contenido (texto)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const template = `📌 ¿Qué es?
Breve descripción de la condición o tema.

🔍 ¿Por qué es importante?
Explica la relevancia para el paciente.

💊 Tratamiento
- Medicamento 1: indicaciones
- Medicamento 2: indicaciones

⚠️ Señales de alarma
- Síntoma 1
- Síntoma 2

✅ Recomendaciones
- Consejo 1
- Consejo 2

📞 ¿Cuándo consultar?
Indica cuándo debe acudir al médico.`;
                    setFormData({ ...formData, content: formData.content ? formData.content + '\n\n' + template : template });
                  }}
                >
                  <Wand2 className="h-3.5 w-3.5 mr-1" /> Plantilla base
                </Button>
              </div>
              <Textarea
                placeholder="Escribe el contenido educativo aquí..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={10}
              />
            </div>
            <div className="space-y-2">
              <Label>URL de Video</Label>
              <Input
                placeholder="YouTube, Shorts, Vimeo, Google Drive o enlace MP4"
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Soporta YouTube, Shorts, Vimeo, Google Drive y archivos MP4</p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : editingPage ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Dialog */}
      <Dialog open={!!showQR} onOpenChange={(open) => !open && setShowQR(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" /> QR - {showQR?.title}
            </DialogTitle>
          </DialogHeader>
          {showQR && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="p-4 bg-white rounded-lg">
                <QRCodeSVG value={getPageUrl(showQR.id)} size={200} level="H" includeMargin />
              </div>
              <code className="text-xs bg-muted px-2 py-1 rounded break-all text-center">
                {getPageUrl(showQR.id)}
              </code>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigator.clipboard.writeText(getPageUrl(showQR.id))}>
                  Copiar enlace
                </Button>
                <Button onClick={() => printQR(showQR)}>
                  <Printer className="h-4 w-4 mr-2" /> Imprimir QR
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
