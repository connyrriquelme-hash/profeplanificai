# Mis Clases - flujo docente

## Punto de partida auditado

- La pestaña visible anterior estaba en `src/components/Sidebar.tsx` como `Generador Rapido`, con vista interna `generador`.
- La vista `generador` se resolvía en `src/App.tsx` hacia `DocumentGeneratorFlow`.
- La navegación móvil también apuntaba a `generador` desde `src/components/ui/MobileBottomNav.tsx`.
- El dashboard tenía una acción rápida `Crear clase` que abría `workspace`.

## Reemplazo implementado

- La navegación principal ahora muestra `Mis Clases`.
- La vista nueva usa el identificador interno `mis-clases`.
- La ruta `/mis-clases` se reconoce al cargar la SPA.
- La ruta antigua `/generador-rapido` y la vista interna `generador` se conservan como compatibilidad y apuntan a `Mis Clases`.

## Componentes creados

- `src/components/MisClases.tsx`
  - dashboard docente superior,
  - filtros por año escolar, curso/nivel, asignatura, colegio y estado,
  - calendario semanal lunes a viernes,
  - listado de próximas clases,
  - creación de clases,
  - creación de horario semanal recurrente,
  - detalle de clase por pestañas,
  - autosave con debounce,
  - botones IA con bloqueo si no hay OA.

## Servicios frontend

- `src/services/misClasesService.ts`
  - cliente para clases,
  - calendario,
  - horario semanal,
  - lecciones,
  - autosave,
  - generación de recursos, evaluaciones y presentaciones.

## Tablas D1 usadas

Migraciones:

- `migrations/008_mis_clases.sql`
- `migrations/009_non_teaching_blocks.sql`

Tablas de 008:

- `teacher_classes`
- `teacher_weekly_schedules`
- `teacher_schedule_slots`
- `lesson_instances`
- `lesson_plans`
- `lesson_plan_curriculum`
- `lesson_plan_methodologies`
- `lesson_generated_resources`
- `lesson_generated_evaluations`
- `lesson_attachments`
- `lesson_comments`
- `lesson_autosave_events`

Tabla de 009:

- `non_teaching_blocks`

## Bloques no lectivos

### Qué son

Además de las clases lectivas en aula, Mis Clases permite crear **bloques no lectivos** para tareas importantes del trabajo docente chileno. Estos bloques aparecen en el calendario semanal junto a las clases y se suman al resumen de horas.

### Ejemplos de uso docente chileno

- Planificación de unidades
- Preparación de material didáctico
- Revisión de evaluaciones
- Reunión de departamento
- Consejo de profesores
- Reunión PIE / convivencia / equipo multidisciplinario
- Atención de apoderados
- Entrevistas con estudiantes
- Capacitaciones
- Trabajo colaborativo
- Tareas administrativas
- Reemplazos o coordinaciones especiales
- Otro

### Cómo se crean

1. Desde el encabezado de Mis Clases, hacer clic en **Bloque no lectivo**.
2. Seleccionar tipo de actividad, título, fecha, horario, prioridad.
3. Opcionalmente activar recordatorio (preparado para fase futura).
4. Guardar. El bloque aparece en el calendario con borde ámbar y en la lista de próximos.

### Cómo aparecen en el calendario

- Bloques lectivos: tarjetas con color del curso, clickeables para abrir detalle.
- Bloques no lectivos: tarjetas con borde ámbar, botones de Editar / Eliminar / Marcar realizado.
- Cada bloque puede marcarse como realizado o pendiente.
- Los bloques no lectivos no exigen OA ni asignatura.

### Resumen semanal

Debajo del calendario aparece un resumen con:

- Clases lectivas (cantidad)
- Horas no lectivas (calculadas por diferencia de horarios)
- Total de bloques
- Porcentaje no lectivo

### Reglas

- No exigen OA ni asignatura.
- Pueden asociarse opcionalmente a curso, asignatura o estudiante.
- Deben aparecer en el calendario semanal.
- Deben contar en las horas no lectivas.
- Deben incluirse en el resumen semanal.

## Campos preparados para recordatorios por correo

La tabla `non_teaching_blocks` incluye campos listos para un sistema futuro de recordatorios:

- `reminder_enabled` (boolean): indica si se desea recordatorio.
- `reminder_minutes_before` (número): minutos antes del evento.
- `reminder_email` (texto): correo destinatario.
- `reminder_status` (texto): `pendiente` / `enviado` / `cancelado` / `no_aplica`.
- `reminder_sent_at` (texto): timestamp de envío efectivo.

**No se envían correos todavía.** Los datos quedan guardados para que en una fase futura se pueda crear una tarea automática tipo:

> "Enviar recordatorio al profesor X minutos antes del bloque no lectivo importante."

### Qué queda pendiente para activar el envío real de emails

1. Verificar que el servicio de envío de correos (SMTP o API) está disponible y seguro.
2. Crear un worker o scheduled task que consulte `non_teaching_blocks` con `reminder_enabled = 1` y `reminder_status = 'pendiente'`.
3. Calcular la diferencia entre `block_date + start_time` y `now`.
4. Cuando la diferencia sea igual o menor a `reminder_minutes_before`, enviar el correo y actualizar `reminder_status = 'enviado'` y `reminder_sent_at`.
5. Agregar campo `block_type` para distinguir `lectivo` / `no_lectivo` / `reemplazo` si se necesita filtrar.

## Endpoints creados

- `GET /api/my-classes`
- `POST /api/my-classes`
- `PATCH /api/my-classes/:id`
- `DELETE /api/my-classes/:id`
- `GET /api/my-classes/calendar`
- `POST /api/my-classes/schedule`
- `PATCH /api/my-classes/schedule/:id`
- `DELETE /api/my-classes/schedule/:id`
- `POST /api/lessons`
- `GET /api/lessons/:id`
- `PATCH /api/lessons/:id`
- `DELETE /api/lessons/:id`
- `POST /api/lessons/:id/autosave`
- `POST /api/lessons/:id/generate-resource`
- `POST /api/lessons/:id/generate-evaluation`
- `POST /api/lessons/:id/generate-presentation`
- `POST /api/lessons/:id/generate-guide`
- `GET /api/non-teaching-blocks`
- `POST /api/non-teaching-blocks`
- `PATCH /api/non-teaching-blocks/:id`
- `DELETE /api/non-teaching-blocks/:id`

Todos usan `context.env.DB` y guardan fechas `created_at`/`updated_at` donde corresponde.

## Calendario semanal y recurrencia

La vista principal muestra lunes a viernes. Los horarios recurrentes se guardan como slots semanales en `teacher_schedule_slots` y se materializan virtualmente para la semana consultada desde `GET /api/my-classes/calendar`.

Cuando el profesor abre una clase virtual, se crea una instancia real en `lesson_instances`; así puede editar una clase puntual sin modificar toda la serie.

## Detalle de clase

Pestañas:

1. OA
2. Indicadores
3. Metodología
4. Pregunta desafío
5. ABP / Proyecto
6. Inicio
7. Desarrollo
8. Cierre
9. Recursos
10. Evaluación
11. Adjuntos
12. Comentarios

El OA se carga desde D1 usando los servicios curriculares existentes. Al seleccionar OA se cargan indicadores, habilidades y actitudes disponibles y se guarda la relación en `lesson_plan_curriculum`.

## Autosave

- Debounce: 1000 ms.
- Indicadores: `Guardando…`, `Guardado automáticamente`, error claro.
- No guarda si la firma del contenido no cambió.
- Registra cambios en `lesson_autosave_events`.

## IA integrada

Los botones disponibles en el detalle:

- Generar inicio
- Generar desarrollo
- Generar cierre
- Crear guía
- Crear evaluación
- Crear rúbrica
- Crear ticket de salida
- Crear presentación PPT
- Crear recurso DUA
- Mejorar esta clase
- Adaptar para estudiantes descendidos
- Adaptar para alta exigencia
- Crear actividad colaborativa

Reglas:

- Se bloquea la generación si no hay OA seleccionado.
- El backend recupera contexto curricular D1 antes de generar.
- Cada resultado guarda `source_context_json`.
- Recursos se guardan en `lesson_generated_resources`.
- Evaluaciones se guardan en `lesson_generated_evaluations`.
- Presentaciones guardan metadatos editables como recurso tipo `presentation`.

## Cómo probar localmente

1. Aplicar migraciones locales:

   ```powershell
   npm.cmd run local:setup
   ```

2. Validar schema:

   ```powershell
   npm.cmd run validate:schema:local
   ```

3. Ejecutar tests:

   ```powershell
   npm.cmd run test
   ```

4. Compilar:

   ```powershell
   npm.cmd run build
   ```

5. Levantar local:

   ```powershell
   npm.cmd run local:dev
   ```

6. Abrir `/mis-clases`, crear una clase, crear horario semanal, abrir un bloque, seleccionar OA y probar autosave/generación.

## Pendientes

- Exportación PPT física con `pptxgenjs` desde el recurso guardado.
- Adjuntos con R2 o almacenamiento configurado.
- Edición visual completa de una serie recurrente desde frontend.
- Comentarios colaborativos multiusuario.
- Pulido visual con el PDF de referencia cuando vuelva a estar disponible.
