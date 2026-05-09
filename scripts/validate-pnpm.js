#!/usr/bin/env node

/**
 * Validador de pnpm
 * Este script asegura que solo se usa pnpm como gestor de paquetes
 * Se ejecuta automáticamente en el preinstall hook
 */

const fs = require('fs');
const path = require('path');

const userAgent = process.env.npm_config_user_agent || '';
const packageManager = userAgent.split('/')[0];

// Validaciones
const errors = [];

// 1. Verificar que se use pnpm
if (!userAgent.includes('pnpm')) {
  errors.push('❌ PROHIBIDO: Debes usar pnpm, no npm o yarn');
  errors.push('   Ejecuta: pnpm install');
}

// 2. Verificar que no exista package-lock.json
const packageLockPath = path.join(__dirname, '../package-lock.json');
if (fs.existsSync(packageLockPath)) {
  errors.push('❌ ERROR: Se encontró package-lock.json (genera conflicto con pnpm)');
  errors.push('   Ejecuta: rm package-lock.json');
}

// 3. Verificar que exista pnpm-lock.yaml
const pnpmLockPath = path.join(__dirname, '../pnpm-lock.yaml');
if (!fs.existsSync(pnpmLockPath)) {
  errors.push('⚠️  WARNING: pnpm-lock.yaml no encontrado (se creará automáticamente)');
}

// 4. Verificar versión de pnpm
const requiredVersion = '10.33.2';
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8')
);
const versionMatch = packageJson.packageManager.match(/pnpm@([\d.]+)/);
if (versionMatch && userAgent.includes('pnpm')) {
  const detectedVersion = userAgent.match(/pnpm\/([\d.]+)/)?.[1];
  if (detectedVersion && detectedVersion < requiredVersion) {
    errors.push(`⚠️  WARNING: Se requiere pnpm ${requiredVersion}+, tienes ${detectedVersion}`);
  }
}

// Mostrar resultados
if (errors.length > 0) {
  console.error('\n' + '='.repeat(60));
  console.error('🚨 VALIDACIÓN DE PNPM FALLIDA\n');
  errors.forEach(err => console.error(err));
  console.error('\n' + '='.repeat(60));
  console.error('\n📚 Lee PNPM-GUIDE.md para más información\n');
  
  // Solo fallar si es un error crítico (uso de npm/yarn)
  if (userAgent && !userAgent.includes('pnpm')) {
    process.exit(1);
  }
} else {
  console.log('✅ Validación de pnpm completada correctamente');
}
