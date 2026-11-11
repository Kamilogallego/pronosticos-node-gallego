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
});
