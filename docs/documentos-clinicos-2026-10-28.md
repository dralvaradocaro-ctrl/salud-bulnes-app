# Documentos clínicos: formato y contenido

- Orden de exámenes: tabla de número, examen y detalle/contraste; encabezados repetidos al continuar en otra página. Las filas extensas pueden continuar sin perder texto.
- Receta: nombre, presentación, dosis, vía, frecuencia, duración e instrucciones en líneas separadas; texto libre imprimible incluso sin medicamentos.
- Borrar contenido conserva identificación, diagnóstico, institución, fecha y configuración de firma. En orden de exámenes conserva el resultado y fecha de creatinina, pero desactiva su inclusión manual. En laboratorio conserva los datos del paciente y en microbiología también los antecedentes de antibióticos.
- Plantillas de kinesioterapia: ocho atajos de redacción, editables; sesiones elegidas explícitamente por el profesional. No establecen pautas universales ni asignan tratamientos automáticamente. Región, lateralidad y restricciones se pueden incorporar antes de agregar la orden.
- Firma: limpieza determinista autorizada; `scripts/clean-signature.mjs` produce `public/firma-alvarado-limpia.png` conservando el original, dimensiones y posición de los trazos. Se elimina el fondo blanco y la tinta gris muy tenue del escaneo; no se usa la variante generada con IA.

Referencias consultadas para la redacción general de las plantillas (no para fijar cantidad de sesiones):
- ATS, rehabilitación pulmonar: https://www.thoracic.org/statements/guideline-implementation-tools/matrix-guidelines-and-derivatives-pulmonary-rehab-in-adults-08-23-23.php
- American College of Rheumatology, fibromialgia y ejercicio progresivo: https://rheumatology.org/patients/fibromyalgia

Verificación: `node --test tests/document-content.test.mjs`, `node scripts/check-receta.mjs`, `node scripts/check-orden-examenes.mjs`, ESLint de componentes modificados y `npm run build`.
