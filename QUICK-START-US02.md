# 🚀 Quick Start - US-02 Gestión Académica

## En 2 Minutos

```bash
# 1. Inicia Backend
cd [ruta-backend]
mvn spring-boot:run

# 2. Inicia Frontend (en otra terminal)
cd notasnurv3
npm start

# 3. Abre en navegador
http://localhost:4200

# 4. Login como ADMIN

# 5. Haz clic en sidebar:
# - Gestiones (/admin/gestiones)
# - Semestres (/admin/semestres)

# ✅ ¡Listo!
```

---

## Archivos Cambios

### Nuevos Archivos

```
✨ src/app/core/services/gestion-academica.service.ts
   └─ 7 métodos CRUD

✨ src/app/features/gestion-academica/
   ├─ management/
   │  ├─ management-list.component.*
   │  └─ management-form.component.*
   ├─ semester/
   │  ├─ semester-list.component.*
   │  └─ semester-form.component.*
   └─ README.md

✨ GUIA-INTEGRACION-US02.md
✨ RESUMEN-US02-COMPLETADA.md
```

### Archivos Modificados

```
📝 src/app/app.routes.ts
   └─ Agregadas 2 rutas:
      - /admin/gestiones
      - /admin/semestres

📝 src/app/core/layout/layout.ts
   └─ Agregados 2 links en menú ADMIN:
      - Gestiones (icon: assignment)
      - Semestres (icon: date_range)
```

---

## API Esperada (Backend)

```
GET    /api/managements
POST   /api/managements
PUT    /api/managements/{id}
DELETE /api/managements/{id}

GET    /api/semesters
POST   /api/semesters
PUT    /api/semesters/{id}
DELETE /api/semesters/{id}
GET    /api/semesters/by-management/{managementId}
```

---

## Funcionalidades Implementadas ✅

### Gestiones
- [x] Listar
- [x] Crear (con validación de año único)
- [x] Editar
- [x] Eliminar (con restricción si tiene semestres)

### Semestres
- [x] Listar
- [x] Crear (con validación de fechas)
- [x] Editar
- [x] Eliminar
- [x] Filtrar por gestión

---

## Validaciones

### Management
- Año: obligatorio, 2000-2031, sin duplicados

### Semester
- Gestión: obligatoria
- Número: 1 o 2
- Fechas: fin > inicio, sin duplicados por gestión

---

## Componentes Reutilizables Usados

- ✅ `<app-table>` - Listados
- ✅ `<app-modal>` - Diálogos
- ✅ `<app-button>` - Botones
- ✅ `<app-input>` - Formularios (text, select, date)

---

## Testing Rápido

```typescript
// POST: Crear gestión 2024
curl -X POST http://localhost:8081/api/managements -d '{"year": 2024}'

// GET: Listar gestiones
curl http://localhost:8081/api/managements

// POST: Crear semestre
curl -X POST http://localhost:8081/api/semesters \
  -d '{"managementId":"1", "number":1, "startDate":"2024-01-15", "endDate":"2024-05-31"}'

// GET: Listar semestres
curl http://localhost:8081/api/semesters
```

---

## Stack

- Angular 16+
- TypeScript (strict)
- RxJS (Signals)
- Reactive Forms
- Standalone Components

---

## Documentación

| Doc | Propósito |
|-----|-----------|
| `GUIA-INTEGRACION-US02.md` | Casos de uso, troubleshooting |
| `RESUMEN-US02-COMPLETADA.md` | Resumen ejecutivo detallado |
| `src/app/features/gestion-academica/README.md` | Documentación técnica |

---

## Soporte

Si algo no funciona:

1. **¿Backend responde?** → Revisa `http://localhost:8081/api/managements`
2. **¿Frontend conecta?** → Abre DevTools (F12) > Network > Revisa requests
3. **¿Usuario es ADMIN?** → Verifica en localStorage role = "ADMIN"
4. **¿Datos aparecen?** → Revisa Console para errores

---

## 🎉 ¡Hecho!

Todas las funcionalidades de US-02 están implementadas y listas para usar.

Próximo paso: Navega a `/admin/gestiones` en tu navegador.

**¡Que disfrutes! 🚀**
