
-- Education pages table
CREATE TABLE public.education_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  video_url TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.education_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view education pages" ON public.education_pages FOR SELECT USING (true);
CREATE POLICY "Users can insert education pages" ON public.education_pages FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their education pages" ON public.education_pages FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their education pages" ON public.education_pages FOR DELETE USING (auth.uid() = created_by);

CREATE TRIGGER update_education_pages_updated_at
  BEFORE UPDATE ON public.education_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add education_tools column to patients (array of education page IDs)
ALTER TABLE public.patients ADD COLUMN education_tools UUID[] DEFAULT '{}';
