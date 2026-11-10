/**
 * Pruebas unitarias de promedioMovil.
 *
 * Cada prueba sigue el patrón Arrange-Act-Assert (preparar, ejecutar, verificar)
 * y revisa un solo comportamiento. Los valores esperados salen de un cálculo
 * independiente hecho a mano, nunca del propio código que se está probando.
 */
const { promedioMovil } = require('../../src/pronosticos');

const SERIE = [120, 132, 128, 141, 138, 150];

describe('promedioMovil', () => {
  test('pronostica con el promedio de los últimos periodos', () => {
    const resultado = promedioMovil(SERIE, 3);

    // (141 + 138 + 150) / 3 = 143
    expect(resultado).toBeCloseTo(143.0, 2);
  });

  test('con ventana igual a la serie usa todos los periodos', () => {
    expect(promedioMovil([100, 110, 120], 3)).toBeCloseTo(110.0, 2);
  });

  test('con ventana de un periodo repite el último valor', () => {
    expect(promedioMovil(SERIE, 1)).toBeCloseTo(150.0, 2);
  });

  test('rechaza una ventana mayor que la serie', () => {
    expect(() => promedioMovil([100, 110], 3)).toThrow('menos periodos que la ventana');
  });

  test.each([0, -1, 1.5])('rechaza la ventana %p porque no es un entero positivo', (ventana) => {
    expect(() => promedioMovil(SERIE, ventana)).toThrow('entero positivo');
  });
});
