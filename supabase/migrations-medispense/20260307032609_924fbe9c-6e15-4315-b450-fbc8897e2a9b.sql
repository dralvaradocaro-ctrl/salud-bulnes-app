ALTER TABLE public.patients 
  ADD COLUMN IF NOT EXISTS has_diabetic_retinopathy boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_exam_dates_to_patient boolean DEFAULT true;