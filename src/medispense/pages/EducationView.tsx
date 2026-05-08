import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/medispense/components/ui/card';
import { BookOpen, AlertCircle } from 'lucide-react';
import { supabase } from '@/medispense/integrations/supabase/client';
import { parseVideoUrl } from '@/medispense/lib/video-utils';

interface EducationPage {
  id: string;
  title: string;
  content: string | null;
  video_url: string | null;
}

export default function EducationView() {
  const { pageId } = useParams<{ pageId: string }>();
  const [page, setPage] = useState<EducationPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (pageId) fetchPage();
  }, [pageId]);

  const fetchPage = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('education_pages')
      .select('id, title, content, video_url')
      .eq('id', pageId!)
      .maybeSingle();

    if (error || !data) {
      setNotFound(true);
    } else {
      setPage(data as EducationPage);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse-soft flex flex-col items-center gap-4">
          <BookOpen className="h-10 w-10 text-primary" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Página no encontrada</h2>
            <p className="text-muted-foreground">Este contenido educativo no está disponible.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const videoEmbed = page.video_url ? parseVideoUrl(page.video_url) : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">{page.title}</h1>
              <p className="text-sm text-muted-foreground">Información para pacientes</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-3xl">
        {videoEmbed && (
          <Card>
            <CardContent className="pt-4">
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                {videoEmbed.type === 'mp4' ? (
                  <video
                    className="absolute inset-0 w-full h-full rounded-lg"
                    src={videoEmbed.embedUrl}
                    controls
                    playsInline
                  />
                ) : (
                  <iframe
                    className="absolute inset-0 w-full h-full rounded-lg"
                    src={videoEmbed.embedUrl}
                    title={page.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {page.content && (
          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground">
                {page.content}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center py-6 text-sm text-muted-foreground">
          <p>Si tienes dudas, consulta a tu médico tratante</p>
        </div>
      </main>
    </div>
  );
}
