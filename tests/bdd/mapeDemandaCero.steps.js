/**
 * Pasos BDD del error porcentual (MAPE) cuando un periodo tiene demanda 0.
 *
 * Conecta cada frase de features/mapeDemandaCero.feature con la función mape.
 */
const { loadFeature, defineFeature } = require('jest-cucumber');
const { mape } = require('../../src/pronosticos');

const feature = loadFeature('./tests/bdd/features/mapeDemandaCero.feature');

// Convierte "80, 0 y 95" en [80, 0, 95].
const aNumeros = (texto) => texto.split(/,| y /).map((parte) => Number(parte.trim()));

defineFeature(feature, (test) => {
  let real;
  let pronostico;
  let errorPorcentual;
  let error;

  beforeEach(() => {
    real = undefined;
    pronostico = undefined;
    errorPorcentual = undefined;
    error = undefined;
  });

  const dadaLaDemanda = (given) => {
    given(/^la demanda real de (.+) unidades$/, (texto) => {
      real = aNumeros(texto);
    });
  };

  const yElPronostico = (and) => {
    and(/^el pronóstico de (.+) unidades para esos mismos periodos$/, (texto) => {
      pronostico = aNumeros(texto);
    });
  };

  const cuandoCalculo = (when) => {
    when('calculo el error porcentual del pronóstico', () => {
      try {
        errorPorcentual = mape(real, pronostico);
      } catch (excepcion) {
        error = excepcion;
      }
    });
  };

  test('Un periodo sin demanda se excluye del error porcentual', ({ given, and, when, then }) => {
    dadaLaDemanda(given);
    yElPronostico(and);
    cuandoCalculo(when);
    then(/^el error porcentual es (\d+(?:\.\d+)?) %$/, (esperado) => {
      expect(error).toBeUndefined();
      expect(errorPorcentual).toBeCloseTo(Number(esperado), 2);
    });
  });

  test('Sin ningún periodo con demanda no se puede medir el error porcentual', ({ given, and, when, then }) => {
    dadaLaDemanda(given);
    yElPronostico(and);
    cuandoCalculo(when);
    then('se informa que el error porcentual no se puede calcular', () => {
      expect(errorPorcentual).toBeUndefined();
      expect(error.message).toBe('El MAPE no está definido: todos los periodos tienen demanda 0');
    });
  });
});
