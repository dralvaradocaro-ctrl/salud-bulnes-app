# Mejoras de consulta clínica — septiembre 2026

Implementación aditiva solicitada a partir del informe compartido. Se conservan rutas, categorías, controles de acceso y fuentes originales. Las consultas remotas realizadas fueron de lectura; no se migraron ni borraron registros.

## Informe frente a datos actuales

Se consultaron los 160 temas actuales de Supabase. No se reproduce ciegamente el resultado de la auditoría de mayo: varios temas descritos como vacíos contienen datos en campos antiguos. La vista había dejado de mostrar `clinical_summary`, `diagnostic_orientation`, `complementary_studies` e `initial_treatment`.

Ahora un adaptador de lectura muestra esos campos como bloques de texto cuando no hay `content_blocks` y no existe un renderizador especial. No cambia sus textos ni duplica los bloques nuevos. Los flujos y medicamentos antiguos siguen disponibles.

La marca verde de protocolo local exige tanto `has_local_protocol` como cuerpo clínico: al menos 160 caracteres útiles sumados de los campos y estructuras clínicas admitidas. Se excluyen encabezados, referencias, pautas de cotejo y textos de prueba. Es una comprobación editorial de presencia, no una certificación clínica ni una puntuación de calidad. En la consulta actual detectó la ficha Glibenclamida (`69990b8c1bcf3a7a5102e71c`), cuyo flujo contiene «Hola/Holas». La interfaz señala contenido pendiente y conserva el registro para su corrección. Categoría, buscador y detalle usan el mismo criterio. El contador de portada dice «Fichas locales registradas» y conserva su consulta liviana.

## Cambios implementados

- Breadcrumb clicable hacia categoría.
- Índice de títulos en protocolos con al menos 8 bloques; respeta la pestaña y subpestaña visibles. No sustituye su navegación.
- PDF específico o estado «PDF no disponible aún»; no se redirige a carpeta genérica.
- Dosis con unidad y contexto explícito de administración destacadas visualmente, conservando la línea íntegra. Nuevo bloque `medications` reutiliza la tarjeta de farmacoterapia.
- Lectura del catálogo `medications` para las tarjetas: coincidencia nominal, presentación y restricciones. «Registrado en catálogo» nunca significa stock confirmado. Error o ausencia de coincidencia se muestran como no verificados, no como disponibilidad/ausencia cierta. El formulario de restringidos no se utiliza como prueba de arsenal porque incluye presentaciones de mercado.
- Favoritos y hasta 8 calculadoras recientes por dispositivo, sin datos de pacientes.
- Modo oscuro optativo en portada, consulta de temas, catálogo clínico, directorio y recursos. Se conserva el modo claro predeterminado y los formularios operativos se mantienen claros. La impresión mantiene paleta clara.
- Sección «Trabajo» en navegación y portada con censo, HODOM, IRA grave, solicitudes, PROA y recursos de red. No altera permisos de los módulos.
- Directorio con teléfonos públicos, propósito, fuente y fecha de consulta. Un número de orientación o central no se etiqueta como línea directa de coordinación de traslado. El número del CAE de HCHM tiene fuente histórica de 2016 y advierte que falta validar vigencia operativa.
- Sección de antibiograma enlazada desde ambos módulos PROA, sin porcentajes inventados. `src/data/clinicalResources.js` contiene la configuración del informe pendiente.

## Calculadoras añadidas

Se incorporan al catálogo React existente, al buscador y a las superficies que consumen ese catálogo. Todas requieren completar las variables; no se asume «No» por defecto para datos clínicos faltantes.

1. Función renal: CKD-EPI 2021 (reutiliza función existente) y Cockcroft–Gault. Distingue TFG indexada y aclaramiento; convierte µmol/L a mg/dL. Requiere confirmar creatinina estable y definir peso clínicamente apropiado.
2. Glasgow–Blatchford: GBS 0–23, distingue urea y BUN, hemoglobina en g/dL, límites y criterios completos. No automatiza alta/traslado por puntaje aislado.
3. Alvarado original: ponderación 0–10 y orientación de evaluación, sin indicar cirugía automáticamente.
4. Centor–McIsaac: puntaje Centor y ajuste de edad (3–14: +1; 15–44: 0; desde 45: −1); orienta estudio, no prescribe antibióticos.
5. Bishop original: 0–13; comunica estado cervical al equipo obstétrico. No presupone que el centro deba atender partos o realizar inducción.

Fuentes comprobadas y enlazadas desde cada calculadora:

- [NIDDK — CKD-EPI 2021](https://www.niddk.nih.gov/research-funding/research-programs/kidney-clinical-research-epidemiology/laboratory/glomerular-filtration-rate-equations/adults).
- [Cockcroft y Gault, ecuación original](https://doi.org/10.1159/000180580).
- [NHS GGC — Glasgow–Blatchford](https://handbook.ggcmedicines.org.uk/guidelines/gastrointestinal-system/glasgow-blatchford-score/).
- [AHRQ — componentes de Alvarado](https://www.ncbi.nlm.nih.gov/books/NBK355447/table/results.t13/).
- [McIsaac, estudio original](https://pubmed.ncbi.nlm.nih.gov/9475915/) y [guía IDSA](https://www.idsociety.org/practice-guideline/streptococcal-pharyngitis2/).
- [NICHD — tabla de Bishop](https://pmc.ncbi.nlm.nih.gov/articles/PMC2728002/) y [NICE NG207](https://www.nice.org.uk/guidance/NG207/chapter/recommendations).

## Estándar de contenido y compatibilidad

`src/components/calculators/catalog.js` es el catálogo de implementaciones ejecutables. `ClinicalTool` conserva contenido de referencia y sus identificadores. Los registros existentes se vinculan por ID a ese catálogo; no se detectan calculadoras por coincidencias del nombre. Los vínculos SRI/NRS en protocolos también utilizan ID estable.

Para nuevo contenido, usar `content_blocks` con `type: flowchart` para secuencias y `type: mermaid` para diagramas con decisiones. Se mantienen `protocol_flowchart` y `flow_steps` como formatos de lectura compatibles. La migración masiva de estas dos fuentes se deja para una revisión por protocolo: debe preservar responsables, ubicaciones, alertas, tiempos, opciones de derivación y notas; no basta convertir títulos/descripciones.

## Documentación pendiente

- Antibiograma original aprobado: PDF/Excel, establecimiento, período, microorganismo, muestra, n de aislamientos, sensibilidad y estándar interpretativo. Idealmente diferenciar hospitalización, ambulatorio y urocultivos.
- Referencia/contrarreferencia vigente por especialidad y anexos clínicos directos. El protocolo general de traslado ya está enlazado desde el directorio.
- PDFs institucionales vigentes para completar fichas con contenido insuficiente. La mera existencia de una ficha GES no la convierte en protocolo local.
- Arsenal aprobado actualizado si difiere del catálogo almacenado; el stock requiere una fuente operacional adicional.

## Validación

- `node --test src/utils/clinical/triage.test.js src/lib/protocolContent.test.js`: fórmulas, límites, unidades, datos faltantes, compatibilidad y conservación de texto.
- ESLint de los archivos modificados y compilación Vite.
- Prueba de renderizado SSR: cinco calculadoras en estado inicial, PDF ausente, ocho destinos del índice, accesos operativos, directorio y antibiograma pendiente.
- La comprobación TypeScript global devuelve errores en módulos previos ajenos a los archivos modificados (por ejemplo insulina/medispense).
- No se pudo instalar Playwright: la revisión automática rechazó la instalación temporal por límite de uso de la cuenta. La prueba visual/interactiva de navegador queda pendiente. No hubo despliegue.
