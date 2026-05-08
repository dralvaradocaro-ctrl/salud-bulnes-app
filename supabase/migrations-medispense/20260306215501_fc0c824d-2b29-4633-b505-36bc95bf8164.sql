
-- Add cardiovascular tracking columns to patients table
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS cardiovascular_risk TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_cv_control_date DATE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_cv_control_professional TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS next_cv_control_date DATE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS next_cv_control_professional TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_cv_control_notes TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS cv_followup_status TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS show_exam_reminder BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS last_ecg_date DATE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_fundoscopy_date DATE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_lab_review_date DATE DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS manual_override_next_control BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS manual_override_reason TEXT DEFAULT NULL;

-- Create cardiovascular controls history table
CREATE TABLE public.cardiovascular_controls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  control_date DATE NOT NULL DEFAULT CURRENT_DATE,
  professional TEXT NOT NULL,
  cardiovascular_risk TEXT NOT NULL,
  next_control_date DATE NOT NULL,
  next_control_professional TEXT NOT NULL,
  notes TEXT DEFAULT NULL,
  event_type TEXT NOT NULL DEFAULT 'cardiovascular_control_recorded',
  manual_override BOOLEAN DEFAULT FALSE,
  manual_override_reason TEXT DEFAULT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on cardiovascular_controls
ALTER TABLE public.cardiovascular_controls ENABLE ROW LEVEL SECURITY;

-- RLS policies for cardiovascular_controls
CREATE POLICY "Public can view cardiovascular controls"
  ON public.cardiovascular_controls FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert cardiovascular controls"
  ON public.cardiovascular_controls FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update cardiovascular controls"
  ON public.cardiovascular_controls FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Authenticated users can delete cardiovascular controls"
  ON public.cardiovascular_controls FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by);
