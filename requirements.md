# Sistema de Materias y Notas - Universidad NUR

## 1. Visión General del Proyecto
[cite_start]La Universidad NUR tiene como objetivo implementar un sistema web para gestionar materias, notas y asistencia de los estudiantes[cite: 2]. [cite_start]Actualmente, los procesos son manuales y dispersos, lo que dificulta el control, la generación de reportes y la transparencia[cite: 3].

## 2. Necesidades del Sistema
El nuevo sistema debe cubrir los siguientes puntos clave:

* [cite_start]**Gestión académica**: Creación de gestiones (ej. 2025), organización en semestres (1 y 2) y definición de fechas de inicio/fin[cite: 5].
* [cite_start]**Materias y docentes**: Registro de materias dentro de semestres, asignación de docentes responsables y definición de modalidad (presencial/semi-presencial)[cite: 6].
* [cite_start]**Estudiantes y matrículas**: Registro de estudiantes evitando duplicidad, control de cupos y matriculación[cite: 7].
* [cite_start]**Evaluaciones y notas**: Plan de evaluación configurable (ej: Parciales, Examen final, Proyecto, Controles de lectura), siempre sumando 100 puntos[cite: 8, 9, 10, 11, 12, 13, 14, 15]. [cite_start]El docente es el único responsable de registrar y modificar estas notas[cite: 16].
* [cite_start]**Asistencia y faltas**: Registro de asistencias con límites configurables según modalidad (5 faltas presencial, 3 semi-presencial)[cite: 17, 18, 19, 20, 21]. [cite_start]El sistema debe identificar estudiantes en riesgo[cite: 22].
* [cite_start]**Consultas y reportes**: Acceso para docentes (sus estudiantes/notas), estudiantes (sus propias calificaciones) y administradores (reportes consolidados y actas oficiales)[cite: 23, 24, 25, 26].
* [cite_start]**Auditoría y control**: Registro de historial de cambios y cierre de actas con bloqueo posterior[cite: 27, 28, 29].

---

## 3. Lista Detallada de Funcionalidades

### A. Gestión académica
* [cite_start]Crear, editar y eliminar gestiones[cite: 34].
* [cite_start]Crear, editar y eliminar semestres[cite: 35].
* [cite_start]Configurar fechas de inicio y fin[cite: 36].

### B. Catálogo académico
* [cite_start]CRUD (Crear, Leer, Actualizar, Borrar) de materias[cite: 38].
* [cite_start]Asignación de docente responsable[cite: 40].
* [cite_start]Configuración de cupos[cite: 41].

### C. Usuarios y roles
* [cite_start]Roles definidos: Administrador, Docente, Estudiante[cite: 43].
* [cite_start]CRUD de docentes y estudiantes[cite: 44].
* [cite_start]Sistema de autenticación y permisos[cite: 45].

### D. Matrículas
* [cite_start]Inscripción de estudiantes a materias[cite: 47].
* [cite_start]Validación de cupos y duplicidad[cite: 48].
* [cite_start]Listado de inscritos y materias por estudiante[cite: 49].

### E. Plan de evaluación
* [cite_start]Definición de componentes y ponderaciones (sumatoria 100)[cite: 50, 51, 52].
* [cite_start]Registro de fechas y descripciones[cite: 52].

### F. Carga de notas
* [cite_start]Registro manual o masivo por el docente[cite: 53, 54].
* [cite_start]Cálculo automático de nota final[cite: 54].
* [cite_start]Bloqueo de carga tras fecha límite[cite: 56].

### G. Control de asistencia
* [cite_start]Configuración de límites por modalidad[cite: 58, 59, 60, 61].
* [cite_start]Registro de asistencias y faltas[cite: 61].
* [cite_start]Reportes de riesgo académico por inasistencia[cite: 62].

### H. Consultas, reportes y auditoría
* [cite_start]Vistas personalizadas por rol (Docente, Estudiante, Administrador)[cite: 63, 64].
* [cite_start]Exportación de documentos (PDF/Excel)[cite: 65].
* [cite_start]Historial de auditoría de cambios en notas y asistencias[cite: 69, 70].
* [cite_start]Gestión de estados (Borrador, Activa, Cerrada)[cite: 70].

### I. Configuración global
* [cite_start]Parámetros de redondeo, escala de notas y fechas límite[cite: 71, 72].
* [cite_start]Plantillas institucionales[cite: 74].