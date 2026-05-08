ALTER TABLE public.prescription_items ADD COLUMN is_sos boolean NOT NULL DEFAULT false;
ALTER TABLE public.prescription_items ADD COLUMN sos_reason text;