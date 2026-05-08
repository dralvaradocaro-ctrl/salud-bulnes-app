-- Create a policy to allow public read access to patients via patient_code
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
USING (true);