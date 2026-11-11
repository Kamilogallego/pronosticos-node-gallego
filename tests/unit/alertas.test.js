/** Pruebas unitarias de la regla de alertas de desviación (debeGenerarAlerta). */
const { debeGenerarAlerta } = require('../../src/pronosticos');

const UMBRAL = 10;

describe('debeGenerarAlerta', () => {
  test('alerta cuando el error supera el umbral', () => {
    expect(debeGenerarAlerta(12, UMBRAL)).toBe(true);
  });

  test('alerta cuando el error es igual al umbral (caso límite)', () => {
    expect(debeGenerarAlerta(10, UMBRAL)).toBe(true);
  });

  test('no alerta cuando el error no alcanza el umbral', () => {
    expect(debeGenerarAlerta(7, UMBRAL)).toBe(false);
  });

  test.each([150, -1])('rechaza el umbral %p porque está fuera de 0 a 100', (umbral) => {
    expect(() => debeGenerarAlerta(12, umbral)).toThrow('El umbral debe estar entre 0 y 100');
  });

  test.each([0, 100])('acepta el umbral %p porque está en el límite del rango', (umbral) => {
    expect(() => debeGenerarAlerta(50, umbral)).not.toThrow();
  });
});
