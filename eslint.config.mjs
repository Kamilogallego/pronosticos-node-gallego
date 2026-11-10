/**
 * Configuración de ESLint, el analizador estático de JavaScript.
 *
 * Desde ESLint 10 la única forma de configurarlo es este formato ("flat config").
 * El archivo usa extensión .mjs porque el proyecto es CommonJS (require) y
 * este archivo necesita la sintaxis de módulos (import / export).
 */
import js from '@eslint/js';
import globals from 'globals';

export default [
  // Carpetas que crean las herramientas y que no se analizan.
  { ignores: ['node_modules/', 'coverage/'] },

  // Reglas recomendadas por ESLint: detectan errores probables.
  js.configs.recommended,

  {
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: {
      // Exige === y !==: == convierte tipos y "10" == 10 da true.
      eqeqeq: 'error',
      // Complejidad ciclomática máxima por función (decisiones + 1).
      complexity: ['error', 5],
    },
  },

  // En las pruebas existen las funciones globales de Jest (describe, test, expect).
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      globals: { ...globals.jest },
    },
  },
];
