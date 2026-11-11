/**
 * Pronósticos de demanda y medidas de error.
 *
 * Este módulo reúne las reglas de negocio del sistema de predicción de demanda:
 * cómo se calcula un pronóstico y cómo se mide qué tan lejos quedó de la demanda real.
 * No depende de bases de datos ni de servicios externos, por eso se puede probar
 * con pruebas unitarias rápidas y aisladas.
 */

/**
 * Pronostica el siguiente periodo con el promedio de los últimos `ventana` valores.
 * Ejemplo: serie [120, 132, 128, 141, 138, 150] y ventana 3 → (141 + 138 + 150) / 3 = 143.
 */
function promedioMovil(serie, ventana) {
  if (!Number.isInteger(ventana) || ventana <= 0) {
    throw new Error('La ventana debe ser un entero positivo');
  }
  if (serie.length < ventana) {
    throw new Error('La serie tiene menos periodos que la ventana configurada');
  }

  const ultimos = serie.slice(-ventana);
  return sumar(ultimos) / ventana;
}

/** Error absoluto medio (MAD): promedio de las diferencias absolutas, en unidades. */
function mad(real, pronostico) {
  validarSeries(real, pronostico);

  const erroresAbsolutos = real.map((valorReal, i) => Math.abs(valorReal - pronostico[i]));
  return sumar(erroresAbsolutos) / erroresAbsolutos.length;
}

/**
 * Error porcentual absoluto medio (MAPE), expresado en porcentaje.
 *
 * Un periodo con demanda real igual a 0 no se puede expresar en porcentaje
 * (dividiría entre cero), así que se excluye del cálculo. Si todos los periodos
 * tienen demanda 0, el MAPE no está definido y se informa con un error.
 */
function mape(real, pronostico) {
  validarSeries(real, pronostico);

  const erroresPorcentuales = real
    .map((valorReal, i) => ({ valorReal, valorPronosticado: pronostico[i] }))
    .filter(({ valorReal }) => valorReal !== 0)
    .map(({ valorReal, valorPronosticado }) => (Math.abs(valorReal - valorPronosticado) / valorReal) * 100);

  if (erroresPorcentuales.length === 0) {
    throw new Error('El MAPE no está definido: todos los periodos tienen demanda 0');
  }
  return sumar(erroresPorcentuales) / erroresPorcentuales.length;
}

/**
 * Indica si un error de pronóstico debe disparar una alerta.
 * Regla acordada con Producción: alerta cuando el error es mayor o igual al umbral.
 * Un error exactamente igual al umbral sí alerta.
 */
function debeGenerarAlerta(errorPorcentual, umbral) {
  if (umbral < 0 || umbral > 100) {
    throw new Error('El umbral debe estar entre 0 y 100');
  }
  return errorPorcentual >= umbral;
}

function suavizacionExponencial(serie, alfa) {
  let f = serie[0];
  for (let i = 1; i < serie.length; i++) {
    f = f + alfa * (serie[i] - f);
  }
  return f;
}

function validarSeries(real, pronostico) {
  if (real.length !== pronostico.length) {
    throw new Error('Las series deben tener el mismo número de periodos');
  }
  if (real.length === 0) {
    throw new Error('Se necesita al menos un periodo');
  }
}

function sumar(valores) {
  return valores.reduce((acumulado, valor) => acumulado + valor, 0);
}

module.exports = { promedioMovil, mad, mape, debeGenerarAlerta, suavizacionExponencial };
