/**
 * Pasos BDD de las alertas de desviación del pronóstico.
 *
 * Conecta cada frase de features/alertas.feature con la regla debeGenerarAlerta.
 */
const { loadFeature, defineFeature } = require('jest-cucumber');
const { debeGenerarAlerta } = require('../../src/pronosticos');

// La ruta es relativa a la carpeta desde donde se ejecuta Jest (la raíz del proyecto).
const feature = loadFeature('./tests/bdd/features/alertas.feature');

defineFeature(feature, (test) => {
  let umbral;
  let alerta;

  beforeEach(() => {
    umbral = undefined;
    alerta = undefined;
  });

  // Pasos que se repiten en todos los escenarios. La expresión regular
  // captura el número de la frase: así un mismo paso sirve para 10 %, 12 % o 7 %.
  const dadoUnUmbral = (given) => {
    given(/^un umbral de alerta de (\d+) %$/, (valor) => {
      umbral = Number(valor);
    });
  };

  const cuandoElError = (when) => {
    when(/^el error del pronóstico es (\d+) %$/, (valor) => {
      alerta = debeGenerarAlerta(Number(valor), umbral);
    });
  };

  // El título debe coincidir exactamente con el del escenario en el .feature.
  test('El error supera el umbral', ({ given, when, then }) => {
    dadoUnUmbral(given);
    cuandoElError(when);
    then('se genera una alerta', () => {
      expect(alerta).toBe(true);
    });
  });

  test('El error es igual al umbral', ({ given, when, then }) => {
    dadoUnUmbral(given);
    cuandoElError(when);
    then('se genera una alerta', () => {
      expect(alerta).toBe(true);
    });
  });

  test('El error está por debajo del umbral', ({ given, when, then }) => {
    dadoUnUmbral(given);
    cuandoElError(when);
    then('no se genera ninguna alerta', () => {
      expect(alerta).toBe(false);
    });
  });
});
