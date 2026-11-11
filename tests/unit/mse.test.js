/** Pruebas unitarias del error cuadrático medio (MSE), desarrollado con TDD. */
const { mse } = require('../../src/pronosticos');

describe('mse', () => {
  test('calcula el promedio de los errores al cuadrado', () => {
    const real = [141, 138, 150];
    const pronostico = [126.67, 133.67, 135.67];

    // (14.33² + 4.33² + 14.33²) / 3 = (205.3489 + 18.7489 + 205.3489) / 3 = 143.15
    expect(mse(real, pronostico)).toBeCloseTo(143.15, 2);
  });

  test('rechaza series de distinta longitud', () => {
    expect(() => mse([100, 110], [100])).toThrow('Las series deben tener el mismo número de periodos');
  });

  test('rechaza series vacías', () => {
    expect(() => mse([], [])).toThrow('Se necesita al menos un periodo');
  });

  test('es cero cuando el pronóstico es exacto', () => {
    expect(mse([100, 120], [100, 120])).toBe(0);
  });

  test('un error grande pesa más que varios pequeños con el mismo MAD', () => {
    // Ambos pronósticos tienen MAD 10 (30/3), pero el MSE los distingue:
    // un solo error de 30 → 30² / 3 = 300; tres errores de 10 → (3 · 10²) / 3 = 100.
    const real = [100, 100, 100];

    expect(mse(real, [100, 100, 70])).toBeCloseTo(300, 2);
    expect(mse(real, [90, 90, 90])).toBeCloseTo(100, 2);
  });

  test('da el mismo resultado si el pronóstico se pasa o se queda corto', () => {
    expect(mse([100], [110])).toBeCloseTo(mse([100], [90]), 2);
  });
});
