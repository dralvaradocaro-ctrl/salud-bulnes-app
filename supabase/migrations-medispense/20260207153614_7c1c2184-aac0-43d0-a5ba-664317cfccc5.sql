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
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();