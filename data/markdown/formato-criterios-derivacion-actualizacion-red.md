# Formato para criterios de derivación / actualización de red

Uso: temas de Policlínico basados en documentos locales de referencia, teleprocesos o criterios clínico-administrativos.

No usar:
- `protocol_code`
- `protocol_authors`
- Banner de protocolo institucional

Metadata sugerida:
- `tipo_contenido`: `['criterios_derivacion', 'actualizacion_red', 'contenido_medico']`
- `has_local_protocol`: `false`
- `clasificacion_ges`: `No GES`, salvo que el documento indique otra cosa
- `layout_mode`: `tabs`

Pestañas estándar:
- `Resumen`: regla general, contexto de red y mínimos indispensables
- `Criterios`: prioridad alta/media/baja o criterios por patología
- `No derivar`: exclusiones, GES directo y situaciones no pertinentes
- `Adjuntar`: exámenes, informes, imágenes, plantilla breve para teleprocesos
- `Errores`: errores frecuentes y correcciones operativas

Estructura visual:
- Iniciar con un `protocol_header` pequeño moradito, usando `ordinario: ACTUALIZACIÓN DE RED` o etiqueta equivalente.
- Luego un `alert` breve de regla general.
- Después un `text` corto de contexto, si aporta valor.
- Usar tablas compactas para criterios y adjuntos.
- Mantener etiquetas/tags arriba del contenido mediante la metadata del tema, no con banners.
- Si hay autores o fuente, guardarlos en `authors`, no en `protocol_authors`.

Nota: si el usuario pide explícitamente protocolo institucional u ordinario, usar el formato de protocolo/ordinario correspondiente.
