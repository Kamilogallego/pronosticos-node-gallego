/**
 * Pasos BDD del pronóstico con promedio móvil.
 *
 * Este archivo conecta cada frase de features/promedioMovil.feature con código.
 * El escenario describe el comportamiento con las palabras de Producción; aquí solo
 * se traduce cada frase a una llamada a la función y a una verificación.
 */
const { loadFeature, defineFeature } = require('jest-cucumber');
const { promedioMovil } = require('../../src/pronosticos');

// La ruta es relativa a la carpeta desde donde se ejecuta Jest (la raíz del proyecto).
const feature = loadFeature('./tests/bdd/features/promedioMovil.feature');

defineFeature(feature, (test) => {
  // Estado compartido entre los pasos de un mismo escenario. Se reinicia antes de
  // cada escenario para que ninguno dependa del resultado de otro.
  let serie;
  let pronostico;
  let error;

  beforeEach(() => {
    serie = undefined;
    pronostico = undefined;
    error = undefined;
  });

  // Los pasos que se repiten en varios escenarios se definen una sola vez.
  // La expresión regular captura la serie como texto y el paso la convierte en números.
  const dadaLaSerie = (given) => {
    given(/^la serie de demanda (.+)$/, (texto) => {
      serie = texto.split(',').map(Number);
    });
  };

  // El paso "Cuando" solo ejecuta la acción y guarda lo que pasó: el resultado o
  // el error. Decidir si eso es correcto le corresponde al paso "Entonces".
  const cuandoCalculo = (when) => {
    when(/^calculo el promedio móvil con una ventana de (\d+) periodos$/, (ventana) => {
      try {
        pronostico = promedioMovil(serie, Number(ventana));
      } catch (e) {
        error = e;
      }
    });
  };

  // El título debe coincidir exactamente con el del escenario en el .feature.
  test('Pronóstico del periodo 7 con una ventana de 3 periodos', ({ given, when, then }) => {
    dadaLaSerie(given);
    cuandoCalculo(when);
    then(/^el pronóstico del siguiente periodo es (\d+(?:\.\d+)?) unidades$/, (esperado) => {
      expect(error).toBeUndefined();
      expect(pronostico).toBeCloseTo(Number(esperado), 2);
    });
  });

  // Un esquema se define una sola vez, con su título. jest-cucumber lo ejecuta una vez
  // por cada fila de Ejemplos, con <ventana> y <mensaje> ya reemplazados en cada paso;
  // por eso las mismas expresiones regulares sirven para todas las filas.
  test('No se pronostica con una ventana que la serie no admite', ({ given, when, then }) => {
    dadaLaSerie(given);
    cuandoCalculo(when);
    then(/^se informa el error "(.+)"$/, (mensaje) => {
      expect(pronostico).toBeUndefined();
      expect(error.message).toBe(mensaje);
    });
  });
});
