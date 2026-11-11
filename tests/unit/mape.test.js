/** Pruebas unitarias del error porcentual absoluto medio (MAPE). */
const { mape } = require('../../src/pronosticos');

describe('mape', () => {
  test('calcula el error porcentual absoluto medio', () => {
    const real = [141, 138, 150];
    const pronostico = [126.67, 133.67, 135.67];

    // (14.33/141 + 4.33/138 + 14.33/150) / 3 · 100 = (10.163 + 3.138 + 9.553) / 3 = 7.62
    expect(mape(real, pronostico)).toBeCloseTo(7.62, 2);
  });

  test('excluye el periodo con demanda 0 y promedia solo los periodos válidos', () => {
    // Periodo 1: 0 %. Periodo 2: demanda 0, se excluye. Periodo 3: 5/95 = 5.263 %.
    // (0 + 5.263) / 2 = 2.63: se divide entre 2 porque solo hay dos periodos válidos.
    expect(mape([80, 0, 95], [80, 0, 100])).toBeCloseTo(2.63, 2);
  });

  test('rechaza el cálculo cuando todos los periodos tienen demanda 0', () => {
    expect(() => mape([0, 0], [10, 20])).toThrow('El MAPE no está definido');
  });

  test('rechaza series de distinta longitud', () => {
    expect(() => mape([100, 110], [100])).toThrow('mismo número de periodos');
  });

  test('rechaza series vacías', () => {
    expect(() => mape([], [])).toThrow('al menos un periodo');
  });
});
