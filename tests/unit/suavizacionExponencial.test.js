const { suavizacionExponencial } = require('../../src/pronosticos');

const SERIE = [120, 132, 128, 141, 138, 150];

describe('suavizacionExponencial', () => {
  test('pronostica el siguiente periodo con alfa 0.3', () => {
    const resultado = suavizacionExponencial(SERIE, 0.3);

    expect(resultado).toBeCloseTo(137.5546, 2);
  });
});
