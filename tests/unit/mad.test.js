/** Pruebas unitarias del error absoluto medio (MAD). */
const { mad } = require('../../src/pronosticos');

describe('mad', () => {
  test('calcula el error absoluto medio', () => {
    const real = [141, 138, 150];
    const pronostico = [126.67, 133.67, 135.67];

    // (14.33 + 4.33 + 14.33) / 3 = 11.00, calculado de forma independiente.
    // toBeCloseTo compara con tolerancia; toBe exigiría el decimal exacto.
    expect(mad(real, pronostico)).toBeCloseTo(11.0, 2);
  });

  test('es cero cuando el pronóstico es exacto', () => {
    expect(mad([100, 100], [100, 100])).toBe(0);
  });

  test('rechaza series de distinta longitud', () => {
    expect(() => mad([100, 110], [100])).toThrow('mismo número de periodos');
  });

  test('rechaza series vacías', () => {
    expect(() => mad([], [])).toThrow('al menos un periodo');
  });
});
