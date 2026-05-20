// .pnpmfile.cjs - Configuración de pnpm
// Este archivo asegura que pnpm sea el único gestor de paquetes

const path = require('path');
const fs = require('fs');

module.exports = {
  hooks: {
    readPackage(pkg, context) {
      // Validar que no haya package-lock.json
      const packageLockPath = path.join(context.projectDir, 'package-lock.json');
      if (fs.existsSync(packageLockPath)) {
        context.log('❌ ERROR: package-lock.json detectado. Este archivo debe ser eliminado.');
        context.log('    Ejecuta: rm package-lock.json');
      }

      // Advertencia si hay archivos de yarn
      const yarnLockPath = path.join(context.projectDir, 'yarn.lock');
      if (fs.existsSync(yarnLockPath)) {
        context.log('⚠️  WARNING: yarn.lock detectado. Se recomienda eliminar este archivo.');
      }

      return pkg;
    }
  }
};
