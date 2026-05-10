/**
 * IDs de los `topics` (protocolos) que recibieron ajustes derivados del
 * Arsenal Básico SSÑ-2026 para Hospitales Comunitarios
 * (Resolución Exenta N°5754, 23-dic-2025, Servicio de Salud Ñuble).
 *
 * El aviso amarillo (SSN2026Notice) se muestra una vez por sesión cuando
 * un usuario abre cualquiera de estos topics.
 *
 * Generado por scripts/update-protocolos-ssn2026-v1.mjs.
 * Para regenerar: re-ejecutar el script y pegar acá la lista de IDs.
 */
export const SSN2026_UPDATED_TOPIC_IDS: ReadonlySet<string> = new Set([
  '699c9dc2dcb6d77b0c587d8d', // Norma de Manejo Cardiovascular HCSFB Bulnes 2023
  'ae688959-8eaf-4efc-b554-472fdf7c1c14', // Vía Subcutánea en Cuidados Paliativos
  '699752d342f5df7fd650edb0', // Códigos CIE-10 Vigentes en Atenciones Cardiovasculares
  '696efee3e40fc675b3e7bc69', // Secuencia Rápida de Intubación (SRI)
  '696efcff77924d3a78533dcb', // Asma bronquial moderada y grave en personas menores de 15 años
  'b05b625c-73d9-4413-98e1-15b246f90381', // Manejo del Traumatismo Craneoencefálico del Adulto en Urgencias
  '390a2aa6-4b7b-4b4f-8247-192dc6f0d202', // Diabetes mellitus tipo 1
  'cda1e4f0-3773-4f1a-ba33-f68bde078471', // Alivio del dolor y cuidados paliativos por cáncer
  '6346cd35-61c7-45e6-807b-daeaa2461b7e', // Urgencias en Cuidados Paliativos
  '497a8ff3-6423-4261-b832-21f370f9cec9', // Asma bronquial en personas de 15 años y más
  'a9f7cc11-b828-4ac9-a235-fe91fc8a1c31', // Infección respiratoria aguda (IRA) ambulatoria en menores de 5 años
  '3a6e79f1-9214-48f7-acdf-5b740de89486', // Epilepsia en personas de 15 años y más
  '4da81a6d-68b3-4223-b78e-0d4eae135371', // Hepatitis crónica por virus hepatitis B
  '105de3f0-3055-4cb4-a124-f4b46bcfb945', // Epilepsia en personas desde 1 año y menores de 15 años
  '42433bad-b9c7-4462-94b9-2bb5280813a3', // Urgencia odontológica ambulatoria
  'bfd0f008-5246-42cd-b612-ffb6417bf483', // Cesación del consumo de tabaco en personas de 25 años y más
  '67174ceb-c58d-40a4-b517-5fe0c224944b', // Hepatitis crónica por virus hepatitis C
  '2dc4e979-9547-4b81-9471-145e4ed3f55d', // Categorización de la Atención en el Servicio de Urgencias
  'd934a55e-3f5c-4ed6-8de5-4f94a52e6caa', // Sedación Paliativa
  '696ea74c245ef362de4f4339', // Diabetes mellitus tipo 2
  'b53e5123-b5ba-445c-aa84-d9a25d45d0ea', // Tratamiento farmacológico tras alta hospitalaria por cirrosis hepática
  'bf0ce027-7bfb-4b91-842e-4dcdbbc3cfb9', // Síndrome de dificultad respiratoria en el recién nacido
  'a0c7a7ce-e81e-4735-ae8e-409229771997', // Prevención de parto prematuro
  '64dfc162-38ac-40c9-8cff-2e898bd40988', // Manejo de Pacientes con Intento Suicida en Urgencias
  '699752d342f5df7fd650edaf', // Manejo de Cuerpo Extraño en Urgencias
]);

export const isSSN2026UpdatedTopic = (topicId: string | null | undefined): boolean =>
  !!topicId && SSN2026_UPDATED_TOPIC_IDS.has(topicId);
