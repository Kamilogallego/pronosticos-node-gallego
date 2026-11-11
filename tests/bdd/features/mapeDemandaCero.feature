# language: es
Característica: Error porcentual cuando un periodo no tuvo demanda
  Como planeador de producción
  Quiero que los periodos sin demanda no cuenten en el error porcentual del pronóstico
  Para que un mes sin pedidos no deforme la medida de qué tan bien pronosticamos

  Escenario: Un periodo sin demanda se excluye del error porcentual
    Dada la demanda real de 80, 0 y 95 unidades
    Y el pronóstico de 80, 0 y 100 unidades para esos mismos periodos
    Cuando calculo el error porcentual del pronóstico
    # Se promedian solo los 2 periodos con demanda: (0 % + 5.26 %) / 2 = 2.63 %
    Entonces el error porcentual es 2.63 %

  Escenario: Sin ningún periodo con demanda no se puede medir el error porcentual
    Dada la demanda real de 0 y 0 unidades
    Y el pronóstico de 10 y 20 unidades para esos mismos periodos
    Cuando calculo el error porcentual del pronóstico
    Entonces se informa que el error porcentual no se puede calcular
