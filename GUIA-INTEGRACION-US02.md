# Guía de Integración - US-02: Gestión Académica

## ✅ Estado de Integración

Todo está completamente integrado y listo para funcionar. Solo necesitas:

1. ✅ Backend corriendo en `http://localhost:8081`
2. ✅ Usuario autenticado como ADMIN
3. ✅ Navegar a `/admin/gestiones` o `/admin/semestres`

## 📌 Checklist de Verificación

### Backend (Spring Boot)

Verifica que estos endpoints respondan:

```bash
# Gestiones
GET http://localhost:8081/api/managements
POST http://localhost:8081/api/managements
PUT http://localhost:8081/api/managements/{id}
DELETE http://localhost:8081/api/managements/{id}

# Semestres
GET http://localhost:8081/api/semesters
GET http://localhost:8081/api/semesters/by-management/{managementId}
POST http://localhost:8081/api/semesters
PUT http://localhost:8081/api/semesters/{id}
DELETE http://localhost:8081/api/semesters/{id}
```

### Frontend (Angular)

1. Abre `http://localhost:4200` (o el puerto configurado)
2. Inicia sesión como ADMIN
3. En el sidebar izquierdo, verás:
   - **Gestiones** (nuevo link)
   - **Semestres** (nuevo link)
4. Haz clic en cualquiera para ir a esa página

## 🎯 Casos de Uso

### Caso 1: Crear Primera Gestión

```
1. Navega a /admin/gestiones
2. Haz clic en "Nueva Gestión"
3. Ingresa año: 2024
4. Haz clic en "Crear Gestión"
5. ✅ Gestión aparece en tabla
```

### Caso 2: Crear Semestre

```
1. Navega a /admin/semestres
2. Haz clic en "Nuevo Semestre"
3. Selecciona Gestión: 2024
4. Selecciona Número: Primer Semestre
5. Selecciona Fecha Inicio: 2024-01-15
6. Selecciona Fecha Fin: 2024-05-31
7. Haz clic en "Crear Semestre"
8. ✅ Semestre aparece en tabla
```

### Caso 3: Filtrar Semestres por Gestión

```
1. En /admin/semestres, ve el selector "Filtrar por Gestión"
2. Selecciona una gestión
3. ✅ Tabla se actualiza automáticamente (sin recargar)
4. Selecciona "Todas las Gestiones" para ver todos
```

### Caso 4: Editar Gestión

```
1. En /admin/gestiones, haz clic en botón editar (lápiz) en una fila
2. Modal se abre con datos precargados
3. Cambia el año
4. Haz clic en "Actualizar Gestión"
5. ✅ Tabla se recarga con cambios
```

### Caso 5: Eliminar Gestión (Éxito)

```
1. En /admin/gestiones, haz clic en botón eliminar (X) en una fila
2. Modal de confirmación aparece
3. Haz clic en "Eliminar"
4. ✅ Gestión desaparece de tabla
```

### Caso 6: Intentar Eliminar Gestión con Semestres

```
1. Crea una gestión y un semestre asociado
2. En /admin/gestiones, intenta eliminar la gestión
3. Haz clic en "Eliminar" en el modal de confirmación
4. ❌ Aparece error: "No se puede eliminar una gestión que tiene semestres asociados"
5. ✅ Gestión sigue en tabla
```

### Caso 7: Intentar Crear Gestión Duplicada

```
1. En /admin/gestiones, crea gestión con año 2024
2. Intenta crear otra gestión con año 2024
3. Haz clic en "Crear Gestión"
4. ❌ Aparece error: "Ya existe una gestión con el año 2024"
5. ✅ Formulario sigue abierto para editar
```

## 🔍 Validaciones Que Funciona

### Management Form

- ✅ Año obligatorio
- ✅ Año >= 2000
- ✅ Año <= 10 años en el futuro
- ✅ No se puede crear año duplicado
- ✅ Error 400: No se puede eliminar si tiene semestres

### Semester Form

- ✅ Gestión obligatoria
- ✅ Número obligatorio (1 o 2)
- ✅ Fecha inicio obligatoria
- ✅ Fecha fin obligatoria
- ✅ Fecha fin > Fecha inicio
- ✅ No se pueden crear 2 semestres con mismo número en misma gestión

## 💡 Tips para Desarrollo

### Agregar Toast/Notificación de Éxito

Si quieres agregar notificaciones de éxito, modifica en los componentes de lista:

```typescript
// Después de loadManagements() o loadSemesters()
// this.toastService.showSuccess('Operación completada');

// O con alert por ahora:
alert('¡Gestión creada exitosamente!');
```

### Cambiar Iconos en Sidebar

En `layout.ts`, los iconos usan Material Symbols. Opciones comunes:

| Icono | Código |
|-------|--------|
| 📋 Libreta | `assignment` |
| 📅 Calendario | `date_range` |
| 📊 Gráficos | `analytics` |
| 👥 Personas | `manage_accounts` |
| ⚙️ Engranaje | `settings` |
| 🏠 Casa | `home` |

[Ver más iconos](https://fonts.google.com/icons)

### Agregar Búsqueda en Tabla

Para agregar búsqueda en gestiones/semestres, agrega un input y filtra:

```typescript
// En el componente
searchQuery = signal('');

filteredManagements = computed(() => {
  const query = this.searchQuery().toLowerCase();
  return this.managements().filter(m =>
    m.year.toString().includes(query)
  );
});
```

### Exportar Datos a CSV

Para exportar tabla a CSV, agrega un servicio:

```typescript
exportToCSV(data: any[], filename: string) {
  const csv = data.map(row => Object.values(row).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
}
```

## 🚨 Errores Comunes y Soluciones

### Error: "Cannot find module 'gestion-academica.service'"

**Causa**: Ruta incorrecta en import
**Solución**: Verifica la ruta relativa desde el archivo

```typescript
// ✅ Correcto (desde management-list.component.ts)
import { GestionAcademicaService } from '../../core/services/gestion-academica.service';

// ❌ Incorrecto
import { GestionAcademicaService } from '../../services/gestion-academica.service';
```

### Error: "Modal no se abre"

**Causa**: `isFormModalOpen` está en false
**Solución**: Asegúrate de que el botón llama a `openCreateModal()`

```typescript
// ✅ En HTML
<app-button (clicked)="openCreateModal()">Nueva Gestión</app-button>

// ✅ El método existe
openCreateModal() {
  this.selectedManagement.set(null);
  this.isFormModalOpen.set(true);
}
```

### Error: "Tabla vacía pero hay datos"

**Causa**: `displayedManagements()` o `filteredSemesters()` no recalcula
**Solución**: Verifica que sea un `computed()` y que las fuentes cambien

```typescript
// ✅ Usa computed
displayedManagements = computed(() => {
  return this.managements().map(...);
});

// ✅ Actualiza source signal
this.managements.set(newData);
```

### Error: "Backend devuelve 401 (No autorizado)"

**Causa**: Token expirado o no enviado
**Solución**: Verifica que:

1. El usuario está logueado
2. El token está en localStorage
3. El interceptor está configurado en el backend
4. El token no ha expirado

## 📱 Testing Manual

### Prueba de Smoke Test (5 minutos)

```
1. Navega a /admin/gestiones
2. Crea una gestión (2024)
3. ✅ Aparece en tabla
4. Navega a /admin/semestres
5. Crea un semestre en la gestión 2024
6. ✅ Aparece en tabla
7. Filtra por gestión 2024
8. ✅ Solo muestra semestres de 2024
9. Edita el semestre
10. ✅ Los cambios se guardan
11. Elimina el semestre
12. ✅ Desaparece de tabla
```

### Prueba de Validaciones (5 minutos)

```
1. Intenta crear gestión sin año
   ✅ Error: "El año es obligatorio"
   
2. Intenta crear gestión año 1999
   ✅ Error: "El año debe ser mayor o igual a 2000"
   
3. Crea gestión 2024
4. Intenta crear otra 2024
   ✅ Error: "Ya existe una gestión con el año 2024"
   
5. Intenta crear semestre sin seleccionar gestión
   ✅ Error: "La gestión es obligatoria"
   
6. Selecciona fechas (inicio posterior a fin)
   ✅ Error: "La fecha de fin debe ser posterior a la de inicio"
```

## 📞 Preguntas Frecuentes

**¿Los datos se guardan en base de datos?**
Sí, el backend los persiste. Se cargan al recargar la página.

**¿Puedo tener múltiples semestres?**
Sí, puedes tener gestiones de múltiples años con semestres cada una.

**¿Qué pasa si el backend cae?**
La interfaz muestra error y el usuario puede reintentar.

**¿Puedo eliminar un semestre?**
Sí, sin restricciones (a diferencia de gestiones).

**¿Cómo cambio la URL base de la API?**
Se gestiona con `environment.apiBaseUrl` y el archivo `proxy.conf.json`.
En desarrollo, usa `apiBaseUrl: '/api'` y el proxy apunta a `http://localhost:8081`.

## 🎓 Próximos Pasos

1. **Agregar reportes**: Listar estudiantes/docentes por semestre
2. **Agregar asignaciones**: Cursos por semestre
3. **Agregar actas**: Calificaciones por semestre
4. **Agregar notificaciones Toast**
5. **Agregar paginación a tablas grandes**
6. **Agregar filtros avanzados**

---

**Versión**: 1.0
**Última actualización**: 14 de abril de 2026
**Desarrollador**: Joaquín (joaco-frontend)
