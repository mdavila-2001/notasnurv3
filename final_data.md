🚀 SPRINT FINAL: "La Última Milla" (Cierre 27 de Mayo)
📌 US-10.1: Alertas de Aprobación y Riesgo en Grid de Notas (Prioridad: Máxima)
Asignado a: Joaquín (o lo hacemos nosotros hoy).

Objetivo: El docente debe ver inmediatamente si un alumno aprobó o reprobó por notas o por faltas en el GradeGridComponent.

Criterios de Aceptación (DoD):

El componente debe consumir las inasistencias del alumno (cruzando datos con el endpoint de asistencia).

Implementar una señal computada academicStatus:

Si finalGrade >= 51 y faltas <= límite ➔ <app-badge color="success">Aprobado</app-badge>

Si faltas > límite (5 presencial, 3 semi) ➔ <app-badge color="danger">Reprobado por Faltas</app-badge>

Si finalGrade < 51 ➔ <app-badge color="danger">Reprobado</app-badge>

📌 US-12: Portal de Autogestión del Estudiante (Prioridad: Alta)
Asignado a: Fernando.

Objetivo: Pantalla de detalle donde el rol STUDENT ve su progreso.

Criterios de Aceptación (DoD):

Crear la ruta /student/subject/:id.

Reutilizar el SubjectOperationalService para cargar el plan de evaluación.

Renderizar una versión de solo lectura del <app-table> mostrando sus propias notas parciales, la nota final calculada y un contador de inasistencias.

📌 US-13: Configuración Global del Sistema (Prioridad: Media)
Asignado a: Rodrigo.

Objetivo: Pantalla para que el rol ADMIN configure las reglas de negocio.

Criterios de Aceptación (DoD):

Crear la vista /admin/settings.

Consumir el SystemSettingController de Spring Boot (GET y PUT a /api/settings).

Formulario con <app-input type="number"> para definir: Límite de faltas Presencial, Límite de faltas Semipresencial y Nota mínima de aprobación (51).

📌 US-14: Dashboard y Reportes Gerenciales (Prioridad: Baja/Final)
Asignado a: Rodrigo.

Objetivo: Darle vida al inicio del panel de administrador.

Criterios de Aceptación (DoD):

Modificar admin-dashboard.ts.

Consumir el DashboardController del backend (que ya vi que existe en tu repositorio Java).

Mostrar tarjetas de resumen: Total de estudiantes, materias activas, e índice general de aprobados/reprobados.

Como tu Product Owner y Arquitecto, tengo listos los Criterios de Aceptación (Definition of Done - DoD) exactos para estas últimas 4 historias.

Si copias y pegas esto en Jira, Trello o GitHub Issues, Fernando, Joaquín y Rodrigo no tendrán margen de error. Sabrán exactamente qué código escribir y qué reglas de negocio cumplir.

🛡️ Definition of Done (DoD) GLOBAL - Aplica para todo el Sprint Final
Antes de que cualquier PR sea aprobado en este sprint, debe cumplir obligatoriamente esto:

Reactividad Pura: Cero variables mutables con let para el estado de la vista. Uso exclusivo de signal y computed en Angular 21.

Reutilización de Átomos: Prohibido maquetar tablas nativas o inputs nativos. Se debe usar <app-table>, <app-input>, <app-button> y <app-loader>.

Clean Code: Los componentes deben inyectar servicios como private readonly. Solo se exponen al HTML las señales públicas necesarias.

📌 US-10.1: Alertas de Aprobación y Riesgo por Faltas (Módulo Docente)
Objetivo: El docente debe visualizar instantáneamente el estado académico de cada alumno en el Grid de Notas, cruzando su promedio con su historial de asistencia.

Criterios de Aceptación (DoD):

Cruce de Datos: El GradeGridComponent debe consumir paralelamente el endpoint de asistencias del alumno para saber cuántas faltas tiene.

Regla de Aprobación (Computed): Debe existir un selector derivado que evalúe fila por fila:

Si Nota Final >= 51 y Faltas <= Límite ➔ Estado: Aprobado.

Si Nota Final < 51 ➔ Estado: Reprobado.

Regla de Riesgo por Faltas (Prioridad Absoluta): Si las faltas del alumno superan el límite según la modalidad de la materia (Presencial: 5 faltas, Semi-presencial: 3 faltas), el estado debe ser "Reprobado por Faltas", incluso si su nota final es 100.

UI/UX: Mostrar este estado en una nueva columna al final del Grid de notas utilizando un identificador visual (Ej: Un texto verde para aprobado, rojo para reprobado).

📌 US-12: Portal de Autogestión del Estudiante
Objetivo: Permitir al usuario con rol STUDENT ingresar al detalle de su materia y ver su progreso académico (notas y faltas) de forma clara y de solo lectura.

Criterios de Aceptación (DoD):

Enrutamiento Protegido: La ruta /student/subject/:id debe estar activa y protegida para que solo el alumno matriculado pueda verla.

Tablero Resumen (Header): En la parte superior, el alumno debe ver:

Su Promedio Ponderado Actual.

Su cantidad de Faltas acumuladas frente al límite permitido.

Su Estado Académico Actual (Aprobado, Reprobado, Riesgo por faltas).

Tabla de Notas (Desglose): Un <app-table> de solo lectura que liste todos los componentes del Plan de Evaluación (Ej: Primer Parcial, Proyecto), indicando el "Peso del Hito" y la "Nota Obtenida".

Cero Inputs: Asegurar que ningún componente visual en esta pantalla tenga elementos editables, botones de guardado o acciones de escritura.

📌 US-13: Panel de Configuración Global (Admin)
Objetivo: Proveer una interfaz al Administrador para modificar los parámetros maestros de la universidad, evitando variables "quemadas" (hardcoded) en el código.

Criterios de Aceptación (DoD):

Pantalla de Ajustes: Crear la ruta /admin/settings accesible solo para el rol ADMIN.

Integración con API: Consumir el SystemSettingController existente en el backend (GET /api/settings para cargar, PUT /api/settings para guardar).

Formulario Reactivo: La pantalla debe contener tres <app-input type="number"> obligatorios:

Límite de inasistencias modalidad Presencial (Por defecto: 5).

Límite de inasistencias modalidad Semi-presencial (Por defecto: 3).

Nota mínima de aprobación (Por defecto: 51).

Manejo de Errores y UX: Mostrar un <app-toast> de éxito al guardar. Deshabilitar el botón de guardado y mostrar "Guardando..." (<app-loader>) mientras se procesa la petición HTTP.

📌 US-14: Dashboard Gerencial del Administrador
Objetivo: Darle utilidad a la pantalla inicial del Admin (admin-dashboard), mostrando estadísticas clave de la gestión actual.

Criterios de Aceptación (DoD):

Consumo de Estadísticas: Consumir los DTOs del DashboardController del backend de Spring Boot.

Tarjetas de KPI (Key Performance Indicators): Mostrar en la parte superior al menos 3 tarjetas métricas:

Total de Materias Activas.

Total de Estudiantes Matriculados.

Promedio General de Aprobados vs Reprobados (si la API lo expone).

Tabla de Materias Críticas: Mostrar un <app-table> con las últimas 5 materias que fueron cerradas o aquellas con más alto índice de reprobación.

Carga Segura: Mostrar un estado de "Cargando métricas..." (<app-loader>) al iniciar la pantalla para evitar saltos en la UI.


