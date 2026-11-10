# Pronósticos de demanda · Node.js con Express

Proyecto base del curso de Pruebas de Software. Calcula pronósticos de demanda y mide qué tan lejos quedaron de la demanda real, con las mismas reglas del proyecto nuclear "Sistema web para la predicción de la demanda en producción industrial". Incluye una API HTTP mínima con Express.

No usa bases de datos, contenedores ni servicios externos: solo Node.js y npm.

La actividad que deben desarrollar está en [ACTIVIDAD.md](ACTIVIDAD.md) (en GitHub: https://github.com/josealfredore2604/pronosticos-node/blob/main/ACTIVIDAD.md).

---

## Qué hace

| Función | Qué calcula | Ejemplo con la serie 120, 132, 128, 141, 138, 150 |
|---|---|---|
| `promedioMovil(serie, ventana)` | Pronóstico del siguiente periodo con el promedio de los últimos `ventana` valores | Ventana 3: (141 + 138 + 150) / 3 = 143,00 |
| `mad(real, pronostico)` | Error absoluto medio, en unidades | 11,00 para los periodos 4 a 6 |
| `mape(real, pronostico)` | Error porcentual absoluto medio; excluye los periodos con demanda 0 | 7,62 % para los periodos 4 a 6 |
| `debeGenerarAlerta(error, umbral)` | Si un error debe disparar una alerta; alerta cuando el error es mayor **o igual** al umbral | Error 10 % con umbral 10 %: sí alerta |

Las reglas están en `src/pronosticos.js`. La API está en `src/app.js` y se levanta desde `src/server.js`.

| Método y ruta | Qué hace |
|---|---|
| `GET /api/salud` | Responde `{"estado":"ok"}` si la aplicación está arriba |
| `POST /api/pronosticos/mad` | Recibe `{"real": [...], "pronostico": [...]}` y responde el MAD |

## Requisitos

[Node.js](https://nodejs.org/) 24 LTS (mínimo 22.13, que es lo que exige ESLint 10). npm viene incluido.

```bash
node --version
```

## Cómo levantarlo

```bash
git clone https://github.com/josealfredore2604/pronosticos-node
cd pronosticos-node

npm install
npm start
```

`npm install` descarga las dependencias en `node_modules/` según `package-lock.json`. `npm start` levanta la API en http://localhost:3000.

En otra terminal:

```bash
curl http://localhost:3000/api/salud

curl -X POST http://localhost:3000/api/pronosticos/mad \
  -H "Content-Type: application/json" \
  -d '{"real": [141, 138, 150], "pronostico": [126.67, 133.67, 135.67]}'
```

La segunda petición responde un MAD de aproximadamente 11.00. Para detener la API, `Ctrl + C`.

## Cómo correr las pruebas

```bash
npm run test:unit
```

Al iniciar el proyecto hay 11 pruebas unitarias y 3 pruebas BDD (los escenarios del ejemplo de promedio móvil), y todas pasan.

Comandos que van a usar en la actividad (todos están definidos en `package.json`):

| Comando | Qué hace |
|---|---|
| `npm run test:unit` | Pruebas unitarias (`tests/unit`) |
| `npm run test:bdd` | Pruebas BDD (`tests/bdd`): el ejemplo de promedio móvil y los escenarios que ustedes agreguen |
| `npm run lint` | Análisis estático con ESLint |
| `npm run test:cobertura` | Todas las pruebas con reporte de cobertura |

## Estructura

```
pronosticos-node/
├── .github/workflows/ci-cd.yml   Pipeline de CI/CD de GitHub Actions
├── src/
│   ├── pronosticos.js            Reglas de negocio
│   ├── app.js                    API con Express
│   └── server.js                 Levanta la API en un puerto
├── tests/
│   ├── unit/                     Pruebas unitarias
│   └── bdd/                      Pruebas BDD
│       ├── features/             Escenarios en Gherkin (promedioMovil.feature)
│       └── promedioMovil.steps.js  Pasos del ejemplo de promedio móvil
├── docs/
│   ├── EJEMPLO_TDD.md            Ciclo rojo-verde-refactor de mad, con salidas reales
│   └── ANALISIS_ESTATICO.md      Guía de ESLint: reglas, ejecución y configuración
├── jest.config.js                Configuración de Jest
├── eslint.config.mjs             Configuración de ESLint
├── package.json                  Dependencias y scripts
├── package-lock.json             Versiones exactas de todas las dependencias
├── README.md
└── ACTIVIDAD.md
```

## Herramientas

| Herramienta | Para qué | Dónde se configura |
|---|---|---|
| [Express](https://expressjs.com/) | API HTTP | `src/app.js` |
| [Jest](https://jestjs.io/) | Ejecuta las pruebas y mide la cobertura | `jest.config.js` |
| [jest-cucumber](https://github.com/bencompton/jest-cucumber) | Ejecuta escenarios Gherkin con Jest | Archivos `.feature` y `.steps.js` |
| [ESLint](https://eslint.org/) | Analizador estático | `eslint.config.mjs` |

Jest, jest-cucumber y ESLint son dependencias de desarrollo (`devDependencies`): se usan para construir y verificar el software, no para ejecutarlo.

---

## Conceptos

### Prueba unitaria

Verifica una unidad pequeña de código (una función) de forma aislada, sin base de datos, red ni archivos. Por eso es rápida y su resultado no depende del entorno. Las pruebas de este proyecto siguen el patrón **Arrange-Act-Assert**: preparar los datos, ejecutar la función y verificar el resultado, con un solo comportamiento por prueba.

Una buena prueba unitaria cumple **FIRST**: rápida (*Fast*), independiente de las demás (*Independent*), repetible en cualquier máquina (*Repeatable*), que decide sola si pasa o falla (*Self-validating*) y escrita a tiempo, junto con el código (*Timely*).

### Tolerancia numérica

Los cálculos con decimales no dan resultados exactos: `0.1 + 0.2` es `0.30000000000000004`. Por eso los resultados numéricos se comparan con tolerancia:

```javascript
expect(resultado).toBeCloseTo(11.0, 2);
```

`toBeCloseTo(valor, 2)` acepta diferencias menores a 0,005. `toBe` exigiría el valor exacto y fallaría por redondeo. El valor esperado siempre sale de un cálculo independiente, nunca del mismo código que se está probando.

### TDD (desarrollo guiado por pruebas)

La prueba se escribe antes que el código, en ciclos cortos:

1. **Rojo**: se escribe una prueba para un comportamiento que todavía no existe. Falla.
2. **Verde**: se escribe el código mínimo para que pase.
3. **Refactor**: se mejora el código sin cambiar su comportamiento. Las pruebas siguen en verde.

El ciclo completo, reconstruido paso a paso con `mad` y con las salidas reales de la consola, está en [docs/EJEMPLO_TDD.md](docs/EJEMPLO_TDD.md).

### BDD (desarrollo guiado por comportamiento)

El comportamiento esperado se describe en lenguaje natural con el formato **Dado / Cuando / Entonces** (Gherkin), antes de programarlo. Una persona del negocio puede leer el escenario y confirmar si es lo que necesita. Cada línea del escenario se conecta con código mediante un "paso" (*step*).

La primera línea del archivo `.feature` debe ser `# language: es` para usar las palabras clave en español. Si esa línea no está de primera, el archivo se lee en inglés y "Característica", "Dado" o "Cuando" no se reconocen.

El proyecto trae un ejemplo funcionando: `tests/bdd/features/promedioMovil.feature` describe el pronóstico con promedio móvil y `tests/bdd/promedioMovil.steps.js` conecta cada frase con el código. Tiene tres casos: el cálculo con la serie 120, 132, 128, 141, 138, 150 y ventana 3 (resultado 143), una ventana mayor que la serie y una ventana de 0, estos dos con error. Se ejecuta con `npm run test:bdd`.

Los dos casos de error están escritos como un **Esquema del escenario**: un solo escenario con marcadores (`<ventana>`, `<mensaje>`) y una tabla de **Ejemplos**. Gherkin lo ejecuta una vez por cada fila de la tabla, con los valores de esa fila. Sirve cuando varios casos siguen los mismos pasos y solo cambian los datos. En jest-cucumber el esquema se define una sola vez, con su título, y se ejecuta una vez por fila; por eso `npm run test:bdd` cuenta tres pruebas para dos escenarios.

### Pruebas funcionales

Una prueba funcional verifica **qué** hace el sistema: compara su comportamiento con el requisito, sin mirar cómo está programado. Es una prueba de **caja negra**. Quien la diseña parte del requisito ("con la serie 120, 132, 128, 141, 138, 150 y una ventana de 3 periodos, el pronóstico del periodo 7 es 143"), elige las entradas y los resultados esperados, y no necesita leer el código.

Los escenarios BDD de este proyecto son pruebas funcionales: cada escenario es un requisito de Producción, escrito en Gherkin y ejecutado contra el sistema. El ejemplo está en `tests/bdd/features/promedioMovil.feature`.

| | Prueba unitaria | Prueba funcional (escenario BDD) |
|---|---|---|
| Pregunta que responde | ¿Esta función hace bien su trabajo? | ¿El sistema cumple el requisito? |
| Se diseña a partir de | El código: quien la escribe conoce la función, sus ramas y sus validaciones | El requisito: no hace falta mirar el código |
| Quién la puede leer | El equipo de desarrollo | Desarrollo, pruebas y Producción |
| Lenguaje | JavaScript | Gherkin, en español |
| Si falla, indica | Qué función y qué línea fallaron | Qué regla del negocio dejó de cumplirse |

Las dos pueden verificar la misma regla. En `tests/unit/promedioMovil.test.js`, la prueba que rechaza la ventana `1.5` comprueba un detalle de la implementación (`Number.isInteger`) que Producción nunca pidió por escrito. El escenario de promedio móvil, en cambio, verifica la regla tal como la dijo Producción y seguiría siendo válido aunque `promedioMovil` se reescribiera por completo.

En este proyecto los escenarios llaman directamente a las funciones de cálculo. Verificar la misma regla a través de la API HTTP (`POST /api/pronosticos/mad`) también es una prueba funcional, pero además comprueba que las piezas del sistema funcionan juntas: es una **prueba de integración**, y las pruebas de integración se ven en la Unidad 3. Por eso este proyecto no incluye pruebas de la API HTTP.

### Análisis estático

Revisa el código sin ejecutarlo: encuentra variables sin usar, comparaciones peligrosas, código inalcanzable y funciones demasiado complejas. La configuración de este proyecto exige `===` en lugar de `==` (`"10" == 10` da `true` en JavaScript) y limita la **complejidad ciclomática** (número de decisiones más uno) a 5 por función.

Qué reglas están activas, qué detecta cada una, cómo se lee un hallazgo y cómo se cambia la configuración: [docs/ANALISIS_ESTATICO.md](docs/ANALISIS_ESTATICO.md).

Desde ESLint 10 la única forma de configurarlo es el formato *flat config*. Si encuentran tutoriales con un archivo `.eslintrc`, son de versiones anteriores.

### Cobertura de código

Indica qué porcentaje del código ejecutaron las pruebas. La **cobertura de líneas** cuenta líneas ejecutadas; la **cobertura de ramas** comprueba que cada decisión se recorrió por el lado verdadero y por el falso. Una cobertura alta no garantiza que las pruebas sean buenas, pero una cobertura baja sí señala código que nadie está probando.

`app.js` y `server.js` están excluidos de la medición (`collectCoverageFrom` en `jest.config.js`): son la capa HTTP y se prueban con pruebas de integración, que se ven en la siguiente unidad.

### CI/CD y pipeline

- **Integración continua (CI)**: cada cambio se verifica automáticamente al llegar al repositorio.
- **Despliegue continuo (CD)**: si la verificación pasa, el cambio se publica sin intervención manual. Aquí el despliegue es simulado: imprime `Desplegado` en el runner.
- **Pipeline**: la secuencia de pasos automáticos que recorre un cambio. En GitHub Actions se llama **workflow** y se define en `.github/workflows/`.

| Término | Qué es |
|---|---|
| Workflow | El archivo YAML completo |
| Evento (`on`) | Lo que dispara el workflow: un push, un pull request |
| Job | Un grupo de pasos que corre en su propia máquina virtual |
| Runner | La máquina virtual donde corre un job (`ubuntu-latest`) |
| Step | Un paso dentro de un job: una acción (`uses`) o un comando (`run`) |
| `needs` | Hace que un job espere a que otros terminen bien |

## El pipeline al iniciar

`.github/workflows/ci-cd.yml` tiene tres jobs:

1. **Pruebas unitarias**: instala Node.js 24 y las dependencias con `npm ci`, y corre `npm run test:unit`.
2. **Pruebas BDD**: instala Node.js 24 y las dependencias con `npm ci`, y corre `npm run test:bdd`. Ejecuta el ejemplo de promedio móvil y, cuando los agreguen, sus escenarios de alertas.
3. **Despliegue (simulado)**: corre solo si los dos jobs anteriores pasaron y solo en un push a `main`. Imprime `Desplegado`.

Los dos jobs de pruebas corren en paralelo, cada uno en su propia máquina. En la actividad agregan análisis estático y cobertura, y hacen que el despliegue dependa de los cuatro jobs de verificación.

## Clean Code

*Clean Code* (código limpio) es código que otra persona puede leer, entender y cambiar sin miedo. No es una herramienta: es un conjunto de principios que el análisis estático ayuda a vigilar y que las revisiones estáticas comprueban.

| Principio | Qué significa | Dónde se ve en este proyecto |
|---|---|---|
| Nombres que explican | El nombre dice qué es o qué hace, sin necesidad de un comentario | `erroresAbsolutos` dice qué contiene el arreglo; `debeGenerarAlerta` se lee como una pregunta y devuelve `true` o `false` |
| Una sola responsabilidad | Cada función hace una cosa; si hace dos, se divide | `pronosticos.js` solo calcula; `app.js` solo traduce peticiones HTTP; `server.js` solo abre el puerto. Ninguna función de cálculo conoce Express |
| Sin duplicación | Cada regla está escrita en un solo lugar | `mad` y `mape` necesitan las mismas validaciones y las toman de `validarSeries`; las tres funciones que suman usan `sumar` |
| Sin números mágicos | Un número que significa algo para el negocio lleva nombre | `server.js` no escribe `3000` dentro de `app.listen`: usa la constante `PUERTO`. El `100` de `mape` se deja escrito porque es la definición de porcentaje, no un parámetro del negocio |
| Comentarios que explican el porqué | El código ya dice qué hace; el comentario dice por qué se decidió así | el comentario de `debeGenerarAlerta` no repite que compara con `>=`: explica que es una regla acordada con Producción y que un error igual al umbral sí alerta |
| Manejo explícito de errores | Un dato inválido produce un error con un mensaje claro, no un resultado silencioso ni un error genérico | con series vacías, `mad` lanza `Error('Se necesita al menos un periodo')` en lugar de devolver `NaN` en silencio (ver el ciclo 4 de `docs/EJEMPLO_TDD.md`), y `app.js` convierte ese error en una respuesta 400 con el mensaje |

Un ejemplo tomado del propio código:

```javascript
/** Error absoluto medio (MAD): promedio de las diferencias absolutas, en unidades. */
function mad(real, pronostico) {
  validarSeries(real, pronostico);

  const erroresAbsolutos = real.map((valorReal, i) => Math.abs(valorReal - pronostico[i]));
  return sumar(erroresAbsolutos) / erroresAbsolutos.length;
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
```

En estas dos funciones se ven cinco de los seis principios: nombres que explican (`erroresAbsolutos`, `debeGenerarAlerta`), una sola responsabilidad (calcular, sin saber nada de HTTP), ninguna duplicación (`validarSeries` y `sumar`), un comentario que explica el porqué (la regla acordada) y errores explícitos con un mensaje que dice qué está mal.

## Revisiones estáticas

Una **revisión** es el examen de un producto de trabajo (código, requisitos, escenarios, un plan de pruebas) hecho **por personas**, sin ejecutarlo. Es estática, como el análisis estático, pero no la hace una herramienta:

| | Análisis estático automatizado | Revisión estática |
|---|---|---|
| Quién revisa | Una herramienta (ESLint, en este proyecto) | Personas |
| Qué revisa | Solo código, contra reglas fijas | Cualquier producto de trabajo: código, requisitos, escenarios, documentos |
| Qué encuentra | Defectos que se pueden describir con una regla: variables sin usar, complejidad, nombres | Además, lo que una regla no ve: un requisito ambiguo, un caso que falta, un nombre que confunde, un diseño difícil de cambiar |
| Cuándo | En cada cambio, en segundos (en el pipeline) | Cuando el equipo lo planifica; cuesta tiempo de personas |

Las dos se complementan: la herramienta revisa lo mecánico en cada cambio y deja a las personas lo que requiere criterio.

**Tipos de revisión** (adaptación del temario ISTQB CTFL v4.0, sección 3.2.4). Van de la menos a la más formal:

| Tipo | Cómo es | Objetivo principal | Ejemplo en este proyecto |
|---|---|---|---|
| Revisión informal | No sigue un proceso definido ni exige dejar registro | Detectar anomalías | Pedirle a un compañero que lea la función nueva antes del commit |
| *Walkthrough* (recorrido) | La dirige el autor, que recorre el producto con los revisores; la revisión individual previa es opcional | Evaluar la calidad, generar confianza, enseñar, llegar a acuerdos, generar ideas y detectar anomalías | El autor recorre con Producción, línea por línea, el `.feature` de alertas para confirmar que dice lo que se acordó |
| Revisión técnica | La hacen revisores con conocimiento técnico y la dirige un moderador | Llegar a un acuerdo y tomar decisiones sobre un problema técnico; también detectar anomalías | El equipo decide si la complejidad máxima debe seguir en 5 |
| Inspección | La más formal: sigue el proceso completo, con roles definidos y métricas; el autor no puede ser líder ni secretario de la revisión | Encontrar el mayor número posible de anomalías | Inspeccionar el cálculo del MAPE con un checklist antes de entregarlo a Producción |

El temario describe un proceso genérico (sección 3.2.2): **planificación** (alcance, criterios de salida), **inicio** (que cada participante tenga el material y sepa su rol), **revisión individual** (cada revisor anota anomalías, por ejemplo con un checklist), **comunicación y análisis** (se discute cada anomalía y se decide qué hacer) y **corrección e informe**. Los roles principales (sección 3.2.3) son gerente, autor, moderador, secretario (quien registra), revisor y líder de la revisión. Cuanto más formal es la revisión, más de ese proceso se cumple.

En la actividad (Paso 8.5) hacen una revisión con el checklist de Clean Code.

## Testing en metodologías ágiles

En un equipo ágil las pruebas no son una fase al final: ocurren durante todo el sprint y son responsabilidad de todo el equipo (el temario ISTQB lo llama *whole team approach*, sección 1.5.2). Así encaja este proyecto en un sprint:

| Momento del sprint | Qué pasa | Qué parte del proyecto lo representa |
|---|---|---|
| Refinamiento de la historia | Producción, desarrollo y quien prueba escriben juntos la historia ("Como planeador de producción quiero una alerta…") y sus criterios de aceptación. Quien prueba pregunta por los casos límite: ¿un error igual al umbral alerta? | Los escenarios de `tests/bdd/features/` |
| Desarrollo | Cada función se construye con TDD; los escenarios se automatizan | `docs/EJEMPLO_TDD.md`, `tests/unit/`, los pasos BDD |
| Integración continua | Cada push ejecuta el pipeline | `.github/workflows/ci-cd.yml` |
| Revisión del sprint | Se muestra lo terminado; los escenarios en verde son la evidencia de que se cumplieron los criterios | El job *Pruebas BDD* del pipeline |
| Retrospectiva | El equipo revisa qué mejorar: por ejemplo, ajustar una regla del análisis estático | `docs/ANALISIS_ESTATICO.md` |

Tres ideas que conviene recordar:

- **Quien prueba participa desde la definición de la historia.** Encontrar la ambigüedad de "¿igual al umbral alerta o no?" cuando se escribe la historia cuesta una conversación; encontrarla en producción cuesta un defecto. Es el principio de probar temprano (*shift left*, sección 2.1.5 del temario).
- **Los escenarios BDD son criterios de aceptación ejecutables.** El temario (sección 4.5.2) describe el formato Dado/Cuando/Entonces como una de las dos formas habituales de escribir criterios de aceptación. Aquí, además, se ejecutan: si el código deja de cumplir el criterio, el pipeline lo dice.
- **El pipeline en verde es parte de la *Definition of Done*.** Una historia está terminada cuando, además de funcionar, cumple lo que el equipo acordó. Para este proyecto, una *Definition of Done* razonable sería: pruebas unitarias y escenarios BDD en verde, análisis estático sin hallazgos, cobertura de 90 % o más, código revisado por otra persona y el pipeline en verde en `main`. Si una de esas condiciones falla, la historia no está terminada, aunque "funcione en mi equipo".

Este es también el sentido de las **pruebas continuas en DevOps** (sección 2.1.4 del temario): el pipeline da retroalimentación rápida en cada cambio y reduce el riesgo de regresión, pero no elimina las pruebas manuales ni las revisiones desde el punto de vista de quien usa el sistema.

## Tipos de prueba de la Unidad 2 en este proyecto

| Tema de la unidad | Dónde está en el proyecto | Cómo se practica |
|---|---|---|
| TDD | `docs/EJEMPLO_TDD.md` (ciclo completo de `mad`) | ACTIVIDAD, Paso 2 (suavización exponencial) y Paso 8.1 (`mse`) |
| BDD | `tests/bdd/features/promedioMovil.feature` y `tests/bdd/promedioMovil.steps.js` | `npm run test:bdd`; ACTIVIDAD, Pasos 4 y 8.3 |
| Pruebas unitarias | `tests/unit/` | `npm run test:unit`; ACTIVIDAD, Pasos 3 y 8.2 |
| Pruebas funcionales | Los escenarios BDD (sección "Pruebas funcionales" de este README) | `npm run test:bdd`; ACTIVIDAD, Pasos 4 y 8.3 |
| Análisis estático | `eslint.config.mjs`; guía en `docs/ANALISIS_ESTATICO.md` | `npm run lint`; ACTIVIDAD, Pasos 5 y 8.4 |
| Revisiones estáticas | Sección "Revisiones estáticas" de este README y checklist de la ACTIVIDAD | ACTIVIDAD, Paso 8.5 |
| Clean Code | Sección "Clean Code" de este README y el código de las reglas de negocio | ACTIVIDAD, refactor del Paso 2.3 y Paso 8.5 |
| Pruebas continuas en DevOps | `.github/workflows/ci-cd.yml` | ACTIVIDAD, Paso 7 |
| Testing en ágil | Sección "Testing en metodologías ágiles" de este README | ACTIVIDAD, Paso 7.5 y preguntas del informe (Paso 9) |

## Documentación oficial

- Node.js: https://nodejs.org/docs/latest/api/
- npm (`npm ci`): https://docs.npmjs.com/cli/commands/npm-ci
- Express: https://expressjs.com/
- Jest: https://jestjs.io/docs/getting-started
- Jest, configuración de cobertura: https://jestjs.io/docs/configuration#coveragethreshold-object
- jest-cucumber: https://github.com/bencompton/jest-cucumber
- ESLint: https://eslint.org/docs/latest/
- Gherkin: https://cucumber.io/docs/gherkin/reference/
- GitHub Actions: https://docs.github.com/actions
- Acción setup-node: https://github.com/actions/setup-node
