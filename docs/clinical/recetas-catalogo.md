# Catálogo de recetas y derivaciones

El catálogo local contiene principios activos, presentaciones y referencias comerciales para búsqueda. No es una sincronización con Prescripción Electrónica MINSAL ni una certificación de stock, equivalencia o registro vigente. Las marcas permiten encontrar el principio activo; no se asignan todas las concentraciones a cada marca.

Fuentes de la ampliación (consultadas el 16-11-2026):

- Presentaciones nuevas: URL individual en `src/data/recetaPresentaciones.json`.
- Ravotril / clonazepam: https://www.ispch.cl/folleto/ravotril-comprimidos-2-mg/
- Neuryl, Zotran, Adax, Glucophage, Glafornil, Glicenex: https://www.ispch.cl/sites/default/files/uso_tratamiento.pdf
- Eutirox: https://www.ispch.cl/wp-content/uploads/2023/08/Guia-Medicamentos-Almidon-declarado_v1.pdf
- Cozaar: https://registrosanitario.ispch.gob.cl/Ficha.aspx?RegistroISP=F-21038%2F24
- Lipitor: https://registrosanitario.ispch.gob.cl/Ficha.aspx?RegistroISP=F-21006%2F24
- Neuroval CD: https://www.ispch.cl/sites/default/files/Productos%20Estupefacientes%20y%20Psicotr%C3%B3picos%20Comercializados%20con%20Receta%20Retenida.pdf
- Rize, Amparax, Grifoketam, Ansietil, Sedavital, Nocton, Tusminal, Pectobronc: https://www.ispch.cl/sites/default/files/Productos_Estupefacientes_y_Psicotropicos_Comercializados_RR_Julio_2015.pdf (referencia histórica).
- Wellbutrin SR: https://www.ispch.gob.cl/folleto/f-22896-16/

Magistrales: diltiazem tópico 2 % para fisura anal, referencia https://www.nice.org.uk/advice/esuom3/chapter/overview-for-healthcare-professionals ; urea tópica para xerosis/ictiosis e hiperqueratosis, referencia https://dermnetnz.org/topics/urea . Son plantillas de composición: requieren vehículo, cantidad final y pauta elegidos por el prescriptor; no se asignan frecuencia ni duración por diagnóstico.

Benzodiacepinas: dirección obligatoria en formulario y generador PDF. Cálculo conservador para pautas uniformes expresadas en comprimidos, cada N horas, durante N días o semanas. Se cuenta la primera toma al inicio; se redondea el total dispensado al comprimido superior. No se calcula desde mg ni para SOS, pautas variables, uso permanente o instrucciones adicionales: requieren cantidad manual. La cantidad manual se borra al modificar la pauta. Otros formatos requieren cantidad y unidad explícitas. El texto en pantalla y PDF usa la misma función: `30 (treinta) comprimidos`.

La página DerivacionProfesionales usa el formulario documental compartido con título y PDF propios, sin medicamentos, e incluye las plantillas de kinesioterapia. Accesos en cabecera, buscador y generador múltiple.

Verificación: `node scripts/check-receta.mjs`, ESLint sobre archivos modificados y `npm run build`.


## Ampliación: metotrexato y medicamentos de especialidad

Se agregan 13 principios activos con presentaciones precargadas: metotrexato, hidroxicloroquina, leflunomida, azatioprina, sulfasalazina, micofenolato mofetilo, micofenolato sódico, tacrolimus, apixabán, rivaroxabán, dabigatrán etexilato, warfarina y acenocumarol. Total: 216 principios activos. Las referencias de cada presentación están en el campo `fuente` del JSON; varias son documentos históricos, sin promesa de vigencia comercial.

Metotrexato: comprimidos de 2,5 mg; solución inyectable de 50 mg/2 mL; jeringas prellenadas de 10 mg/0,2 mL, 15 mg/0,3 mL y 20 mg/0,4 mL. Referencias: registro ISP F-26558/21, folleto Pfizer https://labeling.pfizer.com/ShowLabeling.aspx?id=19580 y listado ISP https://www.ispch.cl/anamed/medicamentos/informacion-al-profesional/folletos-informacion/page/14/ . Las referencias comerciales son alias del principio activo, no asignaciones de marca a todas las presentaciones.

No se precarga dosis para metotrexato ni se ofrecen fracciones/comprimidos como sugerencias de dosis. Las frecuencias sugeridas permiten indicar una administración semanal y el día explícito; el campo sigue editable para otras indicaciones. La selección no asigna automáticamente una pauta. El texto semanal se conserva en vista previa y PDF. Referencia de seguridad: https://www.ispch.cl/newsfarmacovigilancia/07/images/parte03.pdf .
