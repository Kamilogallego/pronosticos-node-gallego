const { suavizacionExponencial } = require('../../src/pronosticos');

const SERIE = [120, 132, 128, 141, 138, 150];

describe('suavizacionExponencial', () => {
  test('pronostica el siguiente periodo con alfa 0.3', () => {
    const resultado = suavizacionExponencial(SERIE, 0.3);

    expect(resultado).toBeCloseTo(137.5546, 2);
  });

  test('con alfa 0 el pronóstico nunca cambia y queda en la primera demanda', () => {
    expect(suavizacionExponencial(SERIE, 0)).toBeCloseTo(120.0, 2);
  });

  test('con alfa 1 el pronóstico es la última demanda', () => {
    expect(suavizacionExponencial(SERIE, 1)).toBeCloseTo(150.0, 2);
  });
});
