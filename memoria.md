# Memoria de Correcciones y Directrices — Salud Bulnes App

## DIRECTRIZ PERMANENTE
> **No editar ningún archivo ni base de datos sin autorización explícita del usuario.**

---

## Correcciones pendientes

### RCP Pediátrico (GCL 1.4 B)
- **Estado**: PENDIENTE — el usuario pidió enriquecer este protocolo con contenido completo del PDF pero no se realizó
- **Problema**: el contenido insertado es mínimo (bloques genéricos, sin dosis por peso, sin algoritmo pediátrico específico)
- **Acción requerida**: leer PDF GCL 1.4 B de Google Drive → crear script de actualización → aplicar con --apply
- **ID Supabase**: desconocido (buscar por nombre "RCP Pediátrico" o "Reanimación Cardiopulmonar Pediátrica")

### Fix de renderizado de bloques (solicitado en sesión actual)
- **Estado**: EN PROGRESO
- **Problema**: bloques `flowchart` numeran todo incluyendo títulos de sección; bloques `criteria` renderizan strings vacíos y headers de sección como ítems con punto
- **Acción**: modificar `ResponsiveTopicLayout.jsx` (criteria + flowchart) + limpiar datos en scripts v3

---

## Correcciones realizadas (registro histórico)

### Scripts v3 aplicados (sesión 2026-05-05)
- `update-protocolos-hospitalizados-v3.mjs` — 11 protocolos actualizados con contenido completo de PDFs
- `update-protocolos-policlinico-v3.mjs` — Clotiazepam (HCSFB 153) actualizado
- `update-protocolos-urgencias-v3.mjs` — Código Azul (AOC 1.1) actualizado

### Scripts v2 aplicados (sesiones anteriores)
- `update-protocolos-urgencias-v2.mjs` ✅
- `update-protocolos-hospitalizados-v2.mjs` ✅
- `update-protocolos-policlinico-v2.mjs` ✅
- `update-ges-demencia-v2.mjs` ✅
- `update-ges-hipotiroidismo-v2.mjs` ✅
