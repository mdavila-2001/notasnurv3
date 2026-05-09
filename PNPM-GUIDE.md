# 📦 Guía de pnpm para el Proyecto

Este proyecto usa **pnpm** como gestor de paquetes oficial. Por favor, asegúrate de cumplir con estas instrucciones.

## ✅ Requisitos

- **pnpm 10.33.2+** (se valida automáticamente en `package.json`)
- Node.js 18+

## 🚀 Instalación Inicial

```bash
# Instalar pnpm globalmente (si no lo tienes)
npm install -g pnpm

# Instalar dependencias del proyecto
pnpm install
```

## 📋 Comandos Principales

```bash
# Iniciar servidor de desarrollo
pnpm start

# Compilar para producción
pnpm build

# Ejecutar tests
pnpm test

# Watch mode (compilación continua)
pnpm watch

# Ver versión de pnpm
pnpm --version
```

## ⚠️ Importante

### ❌ NO USAR
- `npm install` ❌
- `yarn install` ❌
- `npm run ...` ❌

### ✅ USAR SIEMPRE
- `pnpm install` ✅
- `pnpm add <package>` ✅
- `pnpm run <script>` ✅ (o simplemente `pnpm <script>`)
- `pnpm remove <package>` ✅

## 📝 Agregar Dependencias

```bash
# Dependencia de producción
pnpm add @angular/animations

# Dependencia de desarrollo
pnpm add -D @types/node

# Versión específica
pnpm add lodash@^4.17.21
```

## 🔍 Verificar Configuración

```bash
# Listar todas las dependencias
pnpm ls

# Listar solo dependencias de producción
pnpm ls --prod

# Ver información del proyecto
pnpm info

# Verificar que pnpm es el gestor requerido
pnpm pkg get packageManager
```

## 🛑 Archivos a Ignorar

- ❌ `package-lock.json` - Generado por npm (PROHIBIDO)
- ❌ `yarn.lock` - Generado por yarn (PROHIBIDO)
- ✅ `pnpm-lock.yaml` - Generado por pnpm (OBLIGATORIO)

## 🔧 Configuración pnpm

Este proyecto tiene las siguientes configuraciones:

### `.npmrc`
```ini
shamefully-hoist=true          # Levanta paquetes al root (compatible con Angular)
strict-peer-dependencies=false  # Permite que falten peerDependencies
auto-install-peers=true        # Instala peerDependencies automáticamente
engine-strict=true             # Valida la versión de Node.js
```

### `.pnpmfile.cjs`
Script personalizado para validar que solo se usa pnpm.

## 💡 Pro Tips

1. **Workspace limpio:**
   ```bash
   pnpm install --frozen-lockfile  # CI/CD: no modifica pnpm-lock.yaml
   ```

2. **Limpiar caché:**
   ```bash
   pnpm store prune  # Elimina paquetes no utilizados del caché
   ```

3. **Actualizar paquetes:**
   ```bash
   pnpm update              # Actualiza a versiones compatibles
   pnpm update --latest     # Actualiza a las últimas versiones (be careful!)
   ```

## 🚨 Troubleshooting

**Error: "pnpm: command not found"**
```bash
npm install -g pnpm
```

**Error: "Incompatible versions of packages"**
```bash
# Reinstalar dependencias
pnpm install --force
```

**Error: "Cannot find module"**
```bash
# Limpiar node_modules y reinstalar
pnpm install
```

**Error: ".pnpmfile.cjs not found"**
```bash
# Verificar que el archivo existe en la raíz del proyecto
ls -la .pnpmfile.cjs
```

## 📚 Recursos

- [Documentación oficial de pnpm](https://pnpm.io/)
- [Comparativa npm vs pnpm](https://pnpm.io/motivation)
- [Configuración de .npmrc](https://pnpm.io/npmrc)

---

**Última actualización:** 2026-05-09  
**Versión pnpm requerida:** 10.33.2+  
**Responsable:** Frontend Team
