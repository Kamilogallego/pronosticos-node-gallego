/**
 * Casos unitarios propios para promedioMovil y mad (Paso 8.2).
 *
 * Cada caso cubre un riesgo que no revisan las pruebas existentes ni los ejemplos de docs/.
 * Los valores esperados se calcularon a mano.
 */
const { promedioMovil, mad } = require('../../src/pronosticos');

describe('promedioMovil: casos propios', () => {
  test('ignora los valores que quedan fuera de la ventana', () => {
    // Solo cuentan los últimos 3: (1 + 2 + 3) / 3 = 2. Si se usara el 1000, daría otro valor.
    expect(promedioMovil([1000, 1, 2, 3], 3)).toBeCloseTo(2.0, 2);
  });

  test('conserva los decimales de la demanda', () => {
    // (11.25 + 12.75) / 2 = 12.00; (10.5 + 11.25 + 12.75) / 3 = 11.50
    expect(promedioMovil([10.5, 11.25, 12.75], 2)).toBeCloseTo(12.0, 2);
    expect(promedioMovil([10.5, 11.25, 12.75], 3)).toBeCloseTo(11.5, 2);
  });

  test('pronostica con una serie de un solo periodo y ventana 1', () => {
    expect(promedioMovil([85], 1)).toBeCloseTo(85.0, 2);
  });
});

describe('mad: casos propios', () => {
  test('los errores por exceso y por defecto no se cancelan', () => {
    // |100 − 110| = 10 y |100 − 90| = 10 → (10 + 10) / 2 = 10. Sin valor absoluto daría 0.
    expect(mad([100, 100], [110, 90])).toBeCloseTo(10.0, 2);
  });

  test('calcula el error con un solo periodo', () => {
    // |50 − 45| = 5 → 5 / 1 = 5
    expect(mad([50], [45])).toBeCloseTo(5.0, 2);
  });
});
