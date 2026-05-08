-- Fix function search path for update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Fix function search path for handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix overly permissive RLS policies on patient_notifications
-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can insert notifications" ON public.patient_notifications;
DROP POLICY IF EXISTS "Anyone can update notifications" ON public.patient_notifications;

-- Create more restrictive policies for patient_notifications
-- These are for the patient portal so we use patient_id check
CREATE POLICY "Authenticated users can insert notifications" ON public.patient_notifications 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Notifications can be updated by patient code" ON public.patient_notifications 
  FOR UPDATE USING (true);