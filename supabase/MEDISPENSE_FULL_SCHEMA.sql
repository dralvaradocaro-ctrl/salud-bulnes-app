-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  specialty TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Create patients table
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  email TEXT,
  phone TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on patients
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Patients policies (doctors can see all patients they created)
CREATE POLICY "Users can view patients" ON public.patients FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert patients" ON public.patients FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update patients they created" ON public.patients FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete patients they created" ON public.patients FOR DELETE USING (auth.uid() = created_by);

-- Create prescriptions table (recetas)
CREATE TABLE public.prescriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  prescribed_by UUID NOT NULL REFERENCES auth.users(id),
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on prescriptions
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- Prescriptions policies
CREATE POLICY "Users can view prescriptions" ON public.prescriptions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert prescriptions" ON public.prescriptions FOR INSERT WITH CHECK (auth.uid() = prescribed_by);
CREATE POLICY "Users can update their prescriptions" ON public.prescriptions FOR UPDATE USING (auth.uid() = prescribed_by);
CREATE POLICY "Users can delete their prescriptions" ON public.prescriptions FOR DELETE USING (auth.uid() = prescribed_by);

-- Create medications table (arsenal de medicamentos)
CREATE TABLE public.medications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  active_ingredient TEXT NOT NULL,
  presentation TEXT NOT NULL,
  dose_value DECIMAL NOT NULL,
  dose_unit TEXT NOT NULL,
  restrictions TEXT,
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on medications
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

-- Medications policies (all authenticated users can view, only admins can modify)
CREATE POLICY "Anyone can view medications" ON public.medications FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert medications" ON public.medications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update medications" ON public.medications FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete medications" ON public.medications FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create prescription_items table (items de cada receta)
CREATE TABLE public.prescription_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  medication_id UUID REFERENCES public.medications(id),
  medication_name TEXT NOT NULL,
  prescribed_dose DECIMAL NOT NULL,
  prescribed_unit TEXT NOT NULL,
  frequency TEXT NOT NULL,
  schedule JSONB,
  duration_days INTEGER,
  fractionation TEXT,
  ai_description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on prescription_items
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;

-- Prescription items policies
CREATE POLICY "Users can view prescription items" ON public.prescription_items FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert prescription items" ON public.prescription_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update prescription items" ON public.prescription_items FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete prescription items" ON public.prescription_items FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create patient_notifications table
CREATE TABLE public.patient_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  email TEXT,
  push_enabled BOOLEAN DEFAULT false,
  push_subscription JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on patient_notifications
ALTER TABLE public.patient_notifications ENABLE ROW LEVEL SECURITY;

-- Patient notifications policies (public access for patients portal)
CREATE POLICY "Anyone can view notifications by patient" ON public.patient_notifications FOR SELECT USING (true);
CREATE POLICY "Anyone can insert notifications" ON public.patient_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update notifications" ON public.patient_notifications FOR UPDATE USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON public.patients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON public.prescriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_medications_updated_at BEFORE UPDATE ON public.medications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_patient_notifications_updated_at BEFORE UPDATE ON public.patient_notifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();-- Fix function search path for update_updated_at_column
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
  FOR UPDATE USING (true);-- Add age and diagnoses columns to patients table
ALTER TABLE public.patients 
ADD COLUMN age INTEGER,
ADD COLUMN diagnoses TEXT[];

-- Make date_of_birth, email, phone truly optional (already nullable)
-- Remove NOT NULL constraint if needed for simplicity-- Create a policy to allow public read access to patients via patient_code
-- This enables the patient portal to work without authentication
CREATE POLICY "Public can view patient by code" 
ON public.patients 
FOR SELECT 
TO anon
USING (true);

-- Also need to allow public read access to prescriptions for patient portal
CREATE POLICY "Public can view prescriptions by patient" 
ON public.prescriptions 
FOR SELECT 
TO anon
USING (true);

-- And prescription items
CREATE POLICY "Public can view prescription items" 
ON public.prescription_items 
FOR SELECT 
TO anon
USING (true);CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
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

-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'nurse');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS: authenticated users can read their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- RLS: only admins can manage roles
CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

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
ALTER TABLE public.patients 
  ADD COLUMN IF NOT EXISTS has_diabetic_retinopathy boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_exam_dates_to_patient boolean DEFAULT true;ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS is_cardiovascular_program boolean DEFAULT true;ALTER TABLE public.prescription_items ADD COLUMN is_annulled boolean NOT NULL DEFAULT false;ALTER TABLE public.prescription_items ADD COLUMN is_sos boolean NOT NULL DEFAULT false;
ALTER TABLE public.prescription_items ADD COLUMN sos_reason text;
-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_name text NOT NULL,
  patient_id uuid,
  patient_code text,
  entity_type text NOT NULL,
  action_type text NOT NULL,
  field_changed text,
  old_value text,
  new_value text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Authenticated users can view their own audit logs
CREATE POLICY "Users can view own audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Any authenticated user can insert audit logs
CREATE POLICY "Authenticated users can insert audit logs"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow admins to read all profiles (for user management)
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
