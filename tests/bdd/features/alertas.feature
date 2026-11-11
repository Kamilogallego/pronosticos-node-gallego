# language: es
Característica: Alertas de desviación del pronóstico
  Como planeador de producción
  Quiero recibir una alerta cuando el error del pronóstico sea alto
  Para revisar el plan de producción a tiempo

  Escenario: El error supera el umbral
    Dado un umbral de alerta de 10 %
    Cuando el error del pronóstico es 12 %
    Entonces se genera una alerta

  Escenario: El error es igual al umbral
    Dado un umbral de alerta de 10 %
    Cuando el error del pronóstico es 10 %
    Entonces se genera una alerta

  Escenario: El error está por debajo del umbral
    Dado un umbral de alerta de 10 %
    Cuando el error del pronóstico es 7 %
    Entonces no se genera ninguna alerta
