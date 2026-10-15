# Formulario de coqueluche

Fuente: https://hcv.cl/HCV2/wp-content/uploads/2025/09/Formulario-de-investigación-y-notificación-para-casos-de-coqueluche.pdf

Consultado el 13 de octubre de 2026. `formulario-original.pdf` conserva el documento fuente de dos páginas. `pagina-1.png` y `pagina-2.png` son renderizaciones de sus páginas a escala 2 mediante PDF.js en Chromium, utilizando las fuentes embebidas. El renderizado de PDF.js en Node/canvas no preserva correctamente algunos caracteres acentuados de estas fuentes; usar el navegador para regenerarlas.

La vista editable y la descarga PDF utilizan las mismas imágenes locales y el mismo mapa de campos (`src/lib/coquelucheForm.js`, coordenadas sobre 1190 × 1683 píxeles). La app no depende del sitio de origen para generar documentos. No hay envío automático de notificaciones ni persistencia de datos del paciente.
