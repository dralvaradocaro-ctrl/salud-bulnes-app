# Policlínico → Gestiones → Programa de Salud Cardiovascular

## Implementación

Página independiente `GestionCardiovascular`, a todo el ancho disponible, abierta desde una tarjeta en Policlínico → Gestiones, al igual que PROA. Incluye ventana de accesos rápidos y vistas simultáneas de consulta clínica y trabajo operativo. El enlace de regreso conserva la categoría de origen y su pestaña Gestiones. Se conservan las gestiones de Hospitalizados.

- Visor de bloques originales de retinopatía, HTA / HEARTS, DM2 y ERC mediante IDs estables. Reutiliza el renderizador clínico; no copia recomendaciones ni modifica protocolos. La ficha completa sigue accesible.
- Espacios para vía clínica local de diabetes, indicaciones locales de iSGLT2/iDPP4 y heridas. Admiten incorporar enlaces HTTPS con título y detalles de versión. Los contenidos no encontrados se marcan pendientes.
- Checklist compartido con fecha objetivo, detalles/responsable, completado, edición y archivo reversible.
- Nóminas por grupo: enlaces institucionales con permisos de origen. No almacena filas de pacientes.
- Agenda anual con doce resúmenes mensuales, calendario lunes–domingo, ventanas de edición, fecha/hora, detalle y archivo/restauración.
- Selección compartida de medicamentos PSCV a partir del catálogo institucional. No se asume que todo medicamento del catálogo pertenezca al programa ni se confirma stock.
- Actualización remota cada 15 segundos y al recuperar foco. Escrituras con versión para detectar ediciones simultáneas; no sobrescribe silenciosamente una versión distinta. No hay persistencia local alternativa.

## Activación de la base compartida: pendiente

El código de la interfaz está implementado. **El almacenamiento compartido no está habilitado hasta aplicar la migración y configurar el equipo.** Esta sesión solo dispone de credenciales públicas de la aplicación, sin conexión SQL administrativa. No se ha aplicado la migración ni probado la integración contra tablas desplegadas.

1. Aplicar `supabase/migrations/20260922150000_pscv_workspace.sql` con una conexión administrativa del proyecto de la aplicación. La migración añade únicamente `pscv_members`, `pscv_workspace_items`, sus políticas RLS y el trigger de auditoría.
2. Crear/invitar las cuentas institucionales del equipo en Supabase Auth. La interfaz de PSCV usa la sesión del cliente principal, separada de Medispense; no permite autorregistro.
3. Registrar únicamente los miembros autorizados, desde SQL administrativo. Ejemplo, reemplazando el correo:

   ```sql
   insert into public.pscv_members (user_id)
   select id from auth.users where lower(email) = lower('correo-institucional@example.org')
   on conflict do nothing;
   ```

4. Configurar el dominio y la URL de retorno de GestionCardiovascular en la lista permitida de Supabase Auth, y el envío de enlaces de acceso por correo.
5. Verificar con dos integrantes: crear una gestión y una actividad, observarlas desde otra sesión y probar el conflicto al editar una versión antigua. Confirmar que una cuenta ajena y un visitante anónimo no puedan leer ni escribir registros de PSCV.

Las políticas solo admiten miembros explícitos; no hay acceso público a agenda, pendientes, enlaces de nóminas ni selección de medicamentos. El archivado conserva historial básico de creación/última modificación; no constituye un registro clínico ni un historial completo de auditoría. Los protocolos públicos existentes se siguen consultando sin sesión.

## Materiales pendientes

- Documentos de manejo avanzado de heridas.
- Vía clínica local de diabetes e indicaciones locales de iSGLT2/iDPP4, con versión vigente.
- Enlaces institucionales de nóminas y correos del equipo autorizado.
- Selección del arsenal específico PSCV por el equipo responsable.

## Validación

Compilación Vite y ESLint de archivos afectados; prueba de renderizado SSR con datos simulados para los paneles y destinos internos; pruebas de calendario (incluido año bisiesto, lunes y domingo) y validación de enlaces. Las pruebas de permisos y persistencia real requieren activar primero la migración. No se ha realizado despliegue de la aplicación.
