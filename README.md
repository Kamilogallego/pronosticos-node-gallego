# Pronósticos de demanda · Node.js con Express

Proyecto base del curso de Pruebas de Software. Calcula pronósticos de demanda y mide qué tan lejos quedaron de la demanda real, con las mismas reglas del proyecto nuclear "Sistema web para la predicción de la demanda en producción industrial". Incluye una API HTTP mínima con Express.

No usa bases de datos, contenedores ni servicios externos: solo Node.js y npm.

La actividad que deben desarrollar está en [ACTIVIDAD.md](ACTIVIDAD.md).

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
git clone <url-de-este-repositorio>
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

Al iniciar el proyecto hay 11 pruebas unitarias y todas pasan.

Comandos que van a usar en la actividad (todos están definidos en `package.json`):

| Comando | Qué hace |
|---|---|
| `npm run test:unit` | Pruebas unitarias (`tests/unit`) |
| `npm run test:bdd` | Pruebas BDD (`tests/bdd`, las crean ustedes) |
| `npm run lint` | Análisis estático con ESLint |
| `npm run test:cobertura` | Todas las pruebas con reporte de cobertura |

`npm run test:bdd` falla mientras `tests/bdd` no tenga pruebas: Jest no encuentra nada que ejecutar. Es lo esperado hasta el Paso 4 de la actividad.

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
│   └── bdd/                      Pruebas BDD (vacía al iniciar)
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

### BDD (desarrollo guiado por comportamiento)

El comportamiento esperado se describe en lenguaje natural con el formato **Dado / Cuando / Entonces** (Gherkin), antes de programarlo. Una persona del negocio puede leer el escenario y confirmar si es lo que necesita. Cada línea del escenario se conecta con código mediante un "paso" (*step*).

La primera línea del archivo `.feature` debe ser `# language: es` para usar las palabras clave en español. Si esa línea no está de primera, el archivo se lee en inglés y "Característica", "Dado" o "Cuando" no se reconocen.

### Análisis estático

Revisa el código sin ejecutarlo: encuentra variables sin usar, comparaciones peligrosas, código inalcanzable y funciones demasiado complejas. La configuración de este proyecto exige `===` en lugar de `==` (`"10" == 10` da `true` en JavaScript) y limita la **complejidad ciclomática** (número de decisiones más uno) a 5 por función.

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

`.github/workflows/ci-cd.yml` tiene dos jobs:

1. **Pruebas unitarias**: instala Node.js 24 y las dependencias con `npm ci`, y corre `npm run test:unit`.
2. **Despliegue (simulado)**: corre solo si el job anterior pasó y solo en un push a `main`. Imprime `Desplegado`.

En la actividad agregan análisis estático, pruebas BDD y cobertura, y hacen que el despliegue dependa de todo.

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
