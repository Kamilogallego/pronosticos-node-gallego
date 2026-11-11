/**
 * Configuración de Jest.
 *
 * testMatch: qué archivos son pruebas. Los *.test.js son pruebas unitarias;
 * los *.steps.js conectan los escenarios BDD (.feature) con el código.
 *
 * collectCoverageFrom: qué código se mide al pedir cobertura. app.js y server.js
 * se excluyen porque son la capa HTTP: se prueban con pruebas de integración,
 * no con pruebas unitarias.
 */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js', '**/tests/**/*.steps.js'],
  collectCoverageFrom: ['src/**/*.js', '!src/app.js', '!src/server.js'],
  // Si la cobertura de líneas o de ramas baja de 90 %, Jest termina con error.
  coverageThreshold: {
    global: { lines: 90, branches: 90 },
  },
};
