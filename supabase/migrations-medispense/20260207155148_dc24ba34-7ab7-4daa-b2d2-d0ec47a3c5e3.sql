-- Add age and diagnoses columns to patients table
ALTER TABLE public.patients 
ADD COLUMN age INTEGER,
ADD COLUMN diagnoses TEXT[];

-- Make date_of_birth, email, phone truly optional (already nullable)
-- Remove NOT NULL constraint if needed for simplicity