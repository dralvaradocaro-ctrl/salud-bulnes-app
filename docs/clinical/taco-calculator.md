# Calculadora de decisión TACO

## Procedencia

Se verificó por consulta de solo lectura a Supabase la existencia del tema publicado `b5020c15-94b1-4885-a177-f145682c8ff0`, «Atención en Policlínico TACO (Terapia Anticoagulante Oral)», código GCL 1.13, con 11 bloques y PDF enlazado. Los metadatos de la base indican primera edición, 2023, vigencia 2028. Posteriormente se descargó y revisó visualmente el PDF enlazado mediante Google Drive: es cuarta edición, marzo 2026, vigencia marzo 2031; los metadatos de la base están desactualizados. La página impresa 17 confirma acenocumarol 4 mg biranurado. La página 20 remite al flujograma D, pero este no aparece en el PDF enlazado (31 páginas físicas); las páginas impresas 24–25 contienen los flujogramas A, B y C.

La calculadora implementa la imagen aportada por el usuario en la conversación. El algoritmo de dosificación previamente almacenado contiene umbrales, porcentajes y controles diferentes; no se reescribió ni se presentó como equivalente. La interfaz avisa la diferencia. La nueva pestaña «Decisión clínica» se agrega al renderizar los bloques `taco_protocolo`, sin migración ni escritura en la base remota.

El usuario aclaró expresamente el límite compartido INR 4,5: **suspender 24 h y reducir DTS 10–20%**, con control de la rama correspondiente en 7–14 días. INR 5,5 se incorpora a la rama explícita ≥5,5. Los huecos entre intervalos de un decimal (p. ej. 1,95; 3,05; 3,55) requieren interpretación clínica, sin redondeo automático.

## Alcance

- Mantención ambulatoria con AVK, meta INR 2–3.
- DTS ingresada en mg/semana y convertida en vivo a comprimidos de 4 mg (avisa si no corresponde a cuartos). Salida como intervalo de mg/semana ya redondeado a cuartos de comprimido (p. ej. 10 mg con −20–30% → 7–8 mg = 1 ¾–2 comprimidos) y su equivalente en comprimidos. Se ofrece una opción por cada mg dentro del rango para preparar la receta. No distribuye comprimidos por día.
- INR previo muestra tendencia y permite detectar contradicciones con el número de controles consecutivos; no modifica por sí solo el porcentaje.
- TRT se ingresa desde el registro, no se estima con dos INR.
- TRT >90% permite 60 días; ≥3 controles en rango permite 45 días. Problemas de adherencia, interacciones o TRT <60% impiden extender el plazo basal.
- Sangrado activo o INR ≥8 priorizan urgencias incluso con otros campos incompletos.
- Para INR ≥5,5 y <8 la imagen indica suspensión por 72 h y seguimiento estricto, pero no cuantifica reinicio ni próximo INR. A pedido del usuario (17-09-2026) se eliminaron las cajas de reducción y plazo manuales; la calculadora aplica automáticamente la reducción del tramo adyacente (−25–50%) con control a 3–5 días tras la suspensión, y lo declara como referencia no cuantificada en el flujograma. El resumen antiguo de la base señala control en 1–3 días sin reducción; no se combina ese algoritmo discrepante con la imagen.
- Otra meta, otros anticoagulantes, inicio, embarazo y perioperatorio excluyen el ajuste automático.

Referencia complementaria de seguridad consultada: [NHS SPS — Warfarin monitoring](https://www.sps.nhs.uk/monitorings/warfarin-monitoring/). Sus intervalos no sustituyen los del flujograma aportado.

## Comprobación

`node --test src/utils/taco/decision.test.js` cubre los umbrales, dosis, suspensión, plazos, prioridad de urgencias, TRT, derivación a QF, exclusiones, entradas inválidas y tendencia.

La implementación queda en el código de la aplicación; requiere desplegar esta versión para estar disponible en el sitio publicado.

## Comprimidos y texto para receta

Para acenocumarol se usa la presentación de 4 mg biranurada: ¼ comprimido = 1 mg, por lo que toda DTS práctica es un número entero de mg. Cada extremo del intervalo porcentual se redondea al mg más cercano (`practicalRange`); si el redondeo dejara la dosis igual a la actual cuando corresponde cambiarla, se mueve 1 mg en la dirección indicada, de modo que siempre exista una dosis representable. Cada opción muestra su porcentaje real. Warfarina no usa la conversión de 4 mg y conserva los extremos y punto medio exactos.

El formulario muestra primero los tres datos obligatorios (INR actual, DTS actual, sangrado activo) en un bloque destacado; el resto queda en un desplegable de datos complementarios.

El profesional selecciona la opción y el día de control dentro del intervalo. La fecha se calcula desde la fecha del INR actual, con aritmética de calendario independiente de horario de verano. El texto copiable incluye mg/semana, comprimidos/semana entre paréntesis, suspensión si corresponde y fecha de INR; indica completar la pauta diaria. Cambiar variables clínicas invalida la selección.

Pruebas: `node --test src/utils/taco/*.test.js` incluye conversiones, redondeo dentro de rango, fracciones, fechas y texto de receta.
