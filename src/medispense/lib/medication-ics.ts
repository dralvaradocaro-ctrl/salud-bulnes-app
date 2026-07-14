// Re-export: la implementación vive en supabase/functions/_shared para que la
// Edge Function calendario-medicamentos (Deno) y la app (Vite) compartan el
// mismo generador sin duplicarlo.
export * from '../../../supabase/functions/_shared/medication-ics';
