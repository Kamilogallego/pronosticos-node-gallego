# Actividad · Pruebas de la Unidad 2 y pipeline de CI/CD (Node.js)

**Modalidad:** individual
**Fecha de entrega:** martes 10 de noviembre de 2026, 11:59 p. m.
**Entrega:** enlace a su repositorio en GitHub, con la actividad completa y el pipeline en verde.

## Objetivo

Partir de este proyecto, que hoy solo tiene pruebas unitarias en su pipeline, y llevarlo a un pipeline completo: desarrollar una función nueva con **TDD**, ampliar las **pruebas unitarias**, escribir escenarios **BDD**, aplicar **análisis estático**, medir la **cobertura** y hacer que el **despliegue (simulado)** solo ocurra cuando todo eso pasa.

El proyecto ya trae un ejemplo funcionando de cada tipo de prueba de la unidad (la tabla final del README dice dónde está cada uno). Al final, en el Paso 8, aplican lo aprendido por su cuenta, a partir de requisitos y sin código de guía.

Antes de empezar, lean el [README.md](README.md): ahí están los conceptos y los comandos que se usan en cada paso.

---

## Paso 0. Tener el proyecto en su propio repositorio

**Por qué:** el pipeline corre en GitHub Actions, y para eso el código tiene que estar en un repositorio suyo.

1. Clonen el proyecto y entren a la carpeta:
   ```bash
   git clone https://github.com/josealfredore2604/pronosticos-node
   cd pronosticos-node
   ```
2. Quiten el remoto del curso, para no intentar subir cambios a él:
   ```bash
   git remote remove origin
   ```
3. En GitHub, creen un repositorio **vacío** (sin README, sin `.gitignore`, sin licencia) con el nombre `pronosticos-node-<su-apellido>`.
4. Conecten su repositorio y suban el código:
   ```bash
   git remote add origin https://github.com/<su-usuario>/pronosticos-node-<su-apellido>.git
   git branch -M main
   git push -u origin main
   ```
5. En GitHub, abran la pestaña **Actions**.

**Qué deben observar:** el workflow **CI/CD** corriendo con tres jobs: *Pruebas unitarias*, *Pruebas BDD* y *Despliegue (simulado)*. Abran el job de despliegue: la última línea dice `Desplegado`.

---

## Paso 1. Conocer el punto de partida

**Por qué:** antes de cambiar algo hay que saber que el punto de partida está en verde. Si después algo se pone en rojo, sabemos que fue por nuestros cambios.

```bash
npm install
npm run test:unit
npm run test:bdd
```

**Qué deben observar:** las 11 pruebas unitarias pasan y las 3 pruebas BDD del ejemplo de promedio móvil también.

Abran `src/pronosticos.js` y `tests/unit/mad.test.js`. Fíjense en tres cosas que deben repetir en sus pruebas: cada prueba verifica un solo comportamiento, los nombres dicen qué se espera, y los decimales se comparan con `toBeCloseTo`.

---

## Paso 2. Desarrollar una función nueva con TDD

Van a construir `suavizacionExponencial(serie, alfa)`, que pronostica el siguiente periodo con suavización exponencial simple:

> F<sub>t+1</sub> = F<sub>t</sub> + α · (D<sub>t</sub> − F<sub>t</sub>), empezando con F<sub>2</sub> = D<sub>1</sub>

Donde F es el pronóstico, D la demanda real y α (alfa) un número entre 0 y 1.

| Serie | Alfa | Resultado esperado |
|---|---|---|
| 120, 132, 128, 141, 138, 150 | 0.3 | 137.5546 |
| 120, 132, 128, 141, 138, 150 | 0 | 120.00 (con alfa 0 el pronóstico nunca cambia) |
| 120, 132, 128, 141, 138, 150 | 1 | 150.00 (con alfa 1 el pronóstico es la última demanda) |
| cualquiera | −0.1 o 1.5 | Error con el mensaje "Alfa debe estar entre 0 y 1" |

Antes de empezar, lean `docs/EJEMPLO_TDD.md`: muestra el ciclo completo, con salidas reales, aplicado a `mad`.

**Por qué:** en TDD la prueba se escribe primero. Si escriben el código primero, la prueba solo confirma lo que ya hicieron; si la escriben antes, la prueba define qué debe hacer el código.

### 2.1 Rojo

Creen `tests/unit/suavizacionExponencial.test.js` con **solo** esta prueba:

```javascript
const { suavizacionExponencial } = require('../../src/pronosticos');

const SERIE = [120, 132, 128, 141, 138, 150];

describe('suavizacionExponencial', () => {
  test('pronostica el siguiente periodo con alfa 0.3', () => {
    const resultado = suavizacionExponencial(SERIE, 0.3);

    expect(resultado).toBeCloseTo(137.5546, 2);
  });
});
```

```bash
npx jest tests/unit/suavizacionExponencial
```

**Qué deben observar:** la prueba falla con `TypeError: suavizacionExponencial is not a function`. Ese es el rojo: la prueba existe y la función todavía no.

```bash
git add .
git commit -m "test: prueba en rojo para suavizacionExponencial"
```

### 2.2 Verde

Escriban en `src/pronosticos.js` el código **mínimo** para que esa prueba pase y agreguen la función al `module.exports` del final del archivo. Corran de nuevo la prueba hasta que pase.

```bash
git add .
git commit -m "feat: implementa suavizacionExponencial"
```

### 2.3 Más casos y refactor

Agreguen, una por una, pruebas para las filas restantes de la tabla (alfa 0, alfa 1 y alfa fuera de rango; para la última pueden usar `test.each`, como en `promedioMovil.test.js`). Con cada prueba nueva repitan el ciclo: primero la ven fallar, después ajustan el código.

Cuando todas pasen, mejoren el código sin cambiar su comportamiento: nombres claros, un comentario JSDoc que explique la fórmula, la validación de alfa al inicio. Después de cada cambio corran `npm run test:unit`; nunca deben quedar en rojo.

```bash
git add .
git commit -m "refactor: mejora la legibilidad de suavizacionExponencial"
```

---

## Paso 3. Ampliar las pruebas unitarias

**Por qué:** `mape` y `debeGenerarAlerta` ya existen pero no tienen pruebas. Código sin pruebas puede romperse en cualquier cambio sin que nadie lo note.

Creen `tests/unit/mape.test.js` y `tests/unit/alertas.test.js` con al menos estos casos:

| Función | Entrada | Esperado | Qué comprueba |
|---|---|---|---|
| `mape` | real `[141, 138, 150]`, pronóstico `[126.67, 133.67, 135.67]` | 7.62 | El cálculo normal |
| `mape` | real `[80, 0, 95]`, pronóstico `[80, 0, 100]` | 2.63 | El periodo con demanda 0 se excluye |
| `mape` | real `[0, 0]`, pronóstico `[10, 20]` | Error | Sin periodos válidos el MAPE no existe |
| `debeGenerarAlerta` | error 12, umbral 10 | `true` | Supera el umbral |
| `debeGenerarAlerta` | error 10, umbral 10 | `true` | Caso límite: igual al umbral sí alerta |
| `debeGenerarAlerta` | error 7, umbral 10 | `false` | No alcanza el umbral |
| `debeGenerarAlerta` | umbral 150 | Error | Umbral fuera de rango |

Calculen a mano el 2.63 antes de escribir la prueba: ¿por qué el promedio se divide entre 2 y no entre 3?

```bash
npm run test:unit
git add .
git commit -m "test: pruebas unitarias de mape y debeGenerarAlerta"
```

---

## Paso 4. Escribir escenarios BDD

**Por qué:** la regla "el error igual al umbral sí alerta" es una decisión de negocio. En BDD la escribimos de forma que Producción pueda leerla y confirmarla, y esa misma descripción se ejecuta como prueba.

El proyecto ya tiene un ejemplo funcionando: `tests/bdd/features/promedioMovil.feature` y `tests/bdd/promedioMovil.steps.js`. Úsenlo como modelo; tiene la misma estructura que van a construir aquí, incluido un `Esquema del escenario`.

### 4.1 El escenario

Creen `tests/bdd/features/alertas.feature`. La línea `# language: es` tiene que ser la **primera** del archivo:

```gherkin
# language: es
Característica: Alertas de desviación del pronóstico
  Como planeador de producción
  Quiero recibir una alerta cuando el error del pronóstico sea alto
  Para revisar el plan de producción a tiempo

  Escenario: El error supera el umbral
    Dado un umbral de alerta de 10 %
    Cuando el error del pronóstico es 12 %
    Entonces se genera una alerta
```

Agreguen ustedes dos escenarios más: el error **igual** al umbral (10 %) y el error **por debajo** del umbral (7 %).

### 4.2 Los pasos

Creen `tests/bdd/alertas.steps.js`. Este archivo conecta cada frase del escenario con código. Les damos la estructura y el primer escenario; completen los otros dos:

```javascript
const { loadFeature, defineFeature } = require('jest-cucumber');
const { debeGenerarAlerta } = require('../../src/pronosticos');

// La ruta es relativa a la carpeta desde donde se ejecuta Jest (la raíz del proyecto).
const feature = loadFeature('./tests/bdd/features/alertas.feature');

defineFeature(feature, (test) => {
  let umbral;
  let alerta;

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

  // Completen: el escenario del error igual al umbral.
  // Completen: el escenario del error por debajo del umbral.
});
```

```bash
npm run test:bdd
```

**Qué deben observar:** dos archivos de pasos (*test suites*) y seis pruebas que pasan: las tres del ejemplo de promedio móvil y las tres de alertas, cada una con el nombre de su escenario. Si un título no coincide con el del `.feature`, jest-cucumber lo dice en el mensaje de error.

```bash
git add .
git commit -m "test: escenarios BDD de alertas de desviación"
```

---

## Paso 5. Análisis estático con ESLint

**Por qué:** el análisis estático encuentra problemas sin ejecutar el código, incluso en líneas que ninguna prueba recorre.

```bash
npm run lint
```

La guía completa (qué detecta cada regla, cómo se lee un hallazgo, cómo se corrige y cómo se cambia la configuración) está en `docs/ANALISIS_ESTATICO.md`.

Si aparecen hallazgos en su código, corríjanlos. `npx eslint . --fix` corrige automáticamente lo que se puede corregir sin cambiar el comportamiento; el resto lo corrigen ustedes.

Ahora provoquen un hallazgo a propósito para ver cómo se reporta. En cualquier función de `src/pronosticos.js` agreguen la línea `const sinUsar = 1;` y corran `npm run lint`. Lean el mensaje: archivo, línea, descripción y regla (`no-unused-vars`). Después borren la línea.

```bash
git add .
git commit -m "style: código sin hallazgos de ESLint"
```

---

## Paso 6. Cobertura de código

**Por qué:** la cobertura muestra qué partes del código ninguna prueba ejecuta.

```bash
npm run test:cobertura
```

**Qué deben observar:** una tabla con el porcentaje de sentencias, ramas, funciones y líneas por archivo, y en `Uncovered Line #s` las líneas sin ejecutar. Si alguna línea de `pronosticos.js` aparece ahí, escriban la prueba que la recorre (pista: revisen las validaciones que lanzan errores).

Cuando estén por encima del 90 %, fijen el umbral en `jest.config.js`, agregando esta propiedad dentro del objeto:

```javascript
  // Si la cobertura de líneas o de ramas baja de 90 %, Jest termina con error.
  coverageThreshold: {
    global: { lines: 90, branches: 90 },
  },
```

Corran de nuevo `npm run test:cobertura` y comprueben que pasa. Con el umbral, una cobertura baja ya no es solo un número en la pantalla: hace fallar el comando, y eso es lo que va a usar el pipeline.

```bash
git add .
git commit -m "test: cobertura superior al 90 % con umbral en Jest"
```

---

## Paso 7. Llevar todo al pipeline

**Por qué:** hasta ahora todo depende de que alguien corra los comandos. En el pipeline se ejecutan solos en cada push, y el despliegue solo ocurre si todo pasa.

Abran `.github/workflows/ci-cd.yml`.

### 7.1 Job de análisis estático

Agreguen este job debajo de `jobs:`, al mismo nivel que `pruebas-unitarias`:

```yaml
  analisis-estatico:
    name: Análisis estático
    runs-on: ubuntu-latest
    steps:
      - name: Descargar el código
        uses: actions/checkout@v6

      - name: Instalar Node.js
        uses: actions/setup-node@v6
        with:
          node-version: 24
          cache: npm

      - name: Instalar dependencias
        run: npm ci

      # Revisa errores probables, comparaciones peligrosas y complejidad sin ejecutar el código.
      - name: Revisar el código con ESLint
        run: npm run lint
```

En YAML la indentación es parte de la sintaxis: el job tiene que quedar con dos espacios, igual que `pruebas-unitarias`.

### 7.2 Job de cobertura y job de BDD

Siguiendo el mismo modelo, agreguen el job `cobertura` (nombre: "Cobertura"), que corra `npm run test:cobertura`.

Cada job corre en su propia máquina, así que necesita sus tres primeros pasos: descargar el código, instalar Node.js e instalar dependencias.

El job `pruebas-bdd` ya existe: el proyecto lo trae para ejecutar el ejemplo de promedio móvil, y corre `npm run test:bdd`, que ejecuta todo lo que haya en `tests/bdd`. No lo dupliquen. Lean sus comentarios y, después del push del Paso 7.4, abran su registro en Actions y comprueben que sus tres escenarios de alertas también aparecen ahí.

### 7.3 Que el despliegue dependa de todo

Cambien la línea `needs` del job `despliegue`, que hoy espera a `pruebas-unitarias` y `pruebas-bdd`:

```yaml
    needs: [analisis-estatico, pruebas-unitarias, pruebas-bdd, cobertura]
```

Ahora el despliegue espera a los cuatro jobs y solo corre si los cuatro terminan bien.

### 7.4 Subir y comprobar

```bash
git add .
git commit -m "ci: análisis estático, BDD y cobertura en el pipeline"
git push
```

**Qué deben observar en Actions:** los cuatro jobs de verificación corren en paralelo, el job *Pruebas BDD* muestra los seis escenarios y, cuando todos pasan, corre el despliegue e imprime `Desplegado`. En la vista del workflow se ve el diagrama con las flechas de `needs`.

### 7.5 Comprobar que el pipeline los protege

1. Rompan algo a propósito: en `src/pronosticos.js`, cambien el `>=` de `debeGenerarAlerta` por `>`.
2. Suban el cambio:
   ```bash
   git add .
   git commit -m "prueba: cambio que rompe la regla del umbral"
   git push
   ```
3. En Actions, el pipeline queda en rojo: fallan la prueba unitaria y el escenario BDD que verifican el caso límite (error igual al umbral), y el despliegue **no corre**.
4. Reviertan el cambio y suban de nuevo:
   ```bash
   git revert HEAD --no-edit
   git push
   ```
5. El pipeline vuelve a verde y el despliegue corre.

Tomen captura de las dos ejecuciones (la roja y la verde) para el informe.

---

## Paso 8. Práctica propia

**Por qué:** hasta aquí siguieron instrucciones con el código a la vista. En este paso reciben solo el requisito, como en un proyecto real: ustedes deciden qué probar, cómo nombrarlo y cómo diseñarlo. No hay código de guía.

### 8.1 TDD propio: el error cuadrático medio

Construyan con TDD el función `mse(real, pronostico)`. No existe en el proyecto.

**Requisito.** El error cuadrático medio (MSE, *mean squared error*) es el promedio de los cuadrados de las diferencias entre la demanda real y el pronóstico. Se expresa en unidades al cuadrado. Como cada diferencia se eleva al cuadrado, un error grande pesa mucho más que varios pequeños: Producción lo usa para detectar pronósticos que fallan mucho en pocos periodos.

> MSE = [(D<sub>1</sub> − F<sub>1</sub>)² + (D<sub>2</sub> − F<sub>2</sub>)² + … + (D<sub>n</sub> − F<sub>n</sub>)²] / n

| Real | Pronóstico | Resultado esperado |
|---|---|---|
| 141, 138, 150 | 126.67, 133.67, 135.67 | 143.15 = (14.33² + 4.33² + 14.33²) / 3 = (205.3489 + 18.7489 + 205.3489) / 3 |

**Reglas de validación**, las mismas de `mad`:

- Si las series no tienen el mismo número de periodos: un `Error` con el mensaje "Las series deben tener el mismo número de periodos".
- Si las series están vacías: un `Error` con el mensaje "Se necesita al menos un periodo".

**Ojo con el redondeo.** Si calculan con los pronósticos sin redondear (380/3, 401/3 y 407/3, que es lo que da el promedio móvil exacto), el MSE da 143.22. La tabla usa los pronósticos redondeados a dos decimales, y con ellos da 143.15. Calcúlenlo a mano antes de escribir la prueba.

Qué deben hacer:

1. Decidan ustedes las pruebas: al menos una para el cálculo, una para cada regla de validación y una más que ustedes consideren necesaria. Escríbanlas **de a una**, viendo cada una en rojo antes de escribir el código.
2. Sigan el ciclo de `docs/EJEMPLO_TDD.md`: rojo, verde con el código mínimo, refactor.
3. Escriban el función en `src/pronosticos.js` y agréguenla al `module.exports`, igual que `suavizacionExponencial`.
4. El historial debe mostrar al menos un commit de rojo, uno de verde y uno de refactor, en ese orden. Por ejemplo:
   ```bash
   git commit -m "test: prueba en rojo para mse"
   git commit -m "feat: implementa mse"
   git commit -m "refactor: mejora la legibilidad de mse"
   ```
   Compruébenlo con `git log --oneline`.

### 8.2 Pruebas unitarias diseñadas por ustedes

Propongan **al menos tres casos nuevos** para `promedioMovil` y `mad` (entre las dos) que no estén en las pruebas existentes ni en los ejemplos de `docs/`. Para cada caso, antes de escribirlo, anoten en el informe:

| Función | Entrada | Resultado esperado (calculado a mano) | Qué riesgo cubre |
|---|---|---|---|

"Qué riesgo cubre" significa qué defecto encontraría la prueba si alguien lo introdujera mañana. Algunas preguntas para pensar (no son la respuesta): ¿qué pasa con decimales? ¿Con una serie de un solo periodo? ¿Importan los valores que quedan fuera de la ventana? ¿Y el signo de la diferencia en `mad`?

Si un caso falla, **no cambien la prueba para que pase**: anoten en el informe qué encontraron y qué debería decidir Producción.

```bash
npm run test:unit
git add .
git commit -m "test: casos nuevos para promedioMovil y mad"
```

### 8.3 BDD propio

Lean `src/pronosticos.js` y elijan una regla del negocio que todavía no tenga escenario, por ejemplo cómo se calcula el MAPE cuando un periodo tiene demanda 0. Escriban **al menos un escenario** para esa regla, redactado para que Producción lo pueda leer: sin nombres de funciones ni de variables, con los datos y el resultado en palabras del negocio.

Creen un archivo `tests/bdd/features/<nombre>.feature` y su archivo de pasos `tests/bdd/<nombre>.steps.js`, con su propio `loadFeature` y `defineFeature`. Cada archivo de pasos define los pasos de sus propios escenarios.

```bash
npm run test:bdd
git add .
git commit -m "test: escenario BDD de una regla propia"
git push
```

Comprueben en Actions que su escenario también corre en el job *Pruebas BDD*.

### 8.4 Análisis estático configurado por ustedes

Sigan la sección 6 de `docs/ANALISIS_ESTATICO.md`:

1. Agreguen o ajusten **al menos una regla** en `eslint.config.mjs`, distinta de los ejemplos del documento (`no-magic-numbers`, el máximo de `complexity` o `eslint-disable-next-line complexity`).
2. Provoquen a propósito un hallazgo de esa regla y guarden la salida.
3. Corríjanlo. Si deciden no corregirlo, suprímanlo solo en esa línea y con su justificación.
4. Revisen qué reporta la regla en el código que ya existía y decidan qué hacer.
5. Dejen `npm run lint` sin hallazgos y el pipeline en verde.

```bash
git add .
git commit -m "chore: ajusta la configuración del análisis estático"
git push
```

### 8.5 Revisión estática con checklist

Elijan un función de `src/pronosticos.js` (`promedioMovil`, `mape`, `debeGenerarAlerta` o `validarSeries`; no `mad`, que ya está analizado en `docs/EJEMPLO_TDD.md`, ni los que escribieron ustedes) y revísenlo con este checklist. Es una revisión informal e individual (ver "Revisiones estáticas" en el README): lean el código sin ejecutarlo.

| # | Pregunta |
|---|---|
| 1 | ¿El nombre dice qué hace, sin tener que leer el cuerpo? |
| 2 | ¿Los nombres de las variables y los parámetros dicen qué contienen? |
| 3 | ¿Tiene una sola responsabilidad (calcula, o valida, o presenta, pero no varias)? |
| 4 | ¿Repite lógica que ya existe en otro lugar? |
| 5 | ¿Hay números escritos directamente que deberían tener nombre? |
| 6 | ¿Los comentarios explican el porqué y no repiten lo que el código ya dice? |
| 7 | ¿Cada dato inválido produce un error explícito, con un mensaje que dice qué está mal? |
| 8 | ¿Se entiende de una lectura? ¿Cuántas decisiones tiene? |
| 9 | ¿Cada comportamiento tiene al menos una prueba? ¿Cuál falta? |

En el informe copien la tabla con su respuesta (sí o no) y la evidencia de cada pregunta (línea del código y explicación). Anoten **al menos dos hallazgos**: qué encontraron, dónde, por qué es un problema y qué propondrían. Si no encuentran ninguno, expliquen con el checklist por qué el función ya cumple. No hace falta cambiar el código; si deciden hacerlo, primero una prueba que lo proteja.

---

## Paso 9. Informe

Creen en la raíz del repositorio el archivo `INFORME_<Nombre>_<Apellido>.md` con:

1. El enlace a su repositorio.
2. Las capturas del pipeline en rojo (Paso 7.5) y en verde.
3. La salida de `npm run test:cobertura`.
4. Respuestas breves, con sus palabras:
   - ¿Qué vieron en el rojo del Paso 2.1 y por qué es importante verlo antes de escribir el código?
   - ¿Por qué el MAPE del caso `[80, 0, 95]` se divide entre 2?
   - ¿Qué diferencia hay entre una prueba unitaria y un escenario BDD en este proyecto?
   - En el Paso 7.5, ¿qué pruebas fallaron y por qué el despliegue no corrió?
   - Paso 8.1: ¿qué prueba escribieron primero y por qué? ¿Por qué el MSE de la tabla es 143.15 y no 143.22, y cuál de los dos debería usar Producción?
   - Paso 8.2: la tabla de sus tres casos nuevos, con el riesgo que cubre cada uno.
   - Paso 8.3: ¿qué regla eligieron, dónde está en el código y por qué su escenario es una prueba funcional y no una unitaria?
   - Paso 8.4: ¿qué regla agregaron o ajustaron, qué hallazgo provocaron, qué encontró en el código existente y qué decidieron?
   - Paso 8.5: el checklist completo y sus hallazgos. ¿Qué encontraron ustedes que una herramienta de análisis estático no habría encontrado?
   - Si este proyecto fuera una historia de usuario en un sprint, ¿qué pondrían en su *Definition of Done* y en qué momento debería participar quien prueba?

```bash
git add .
git commit -m "docs: informe de la actividad"
git push
```

---

## Checklist de entrega

- [ ] El repositorio es suyo y el último pipeline está en verde.
- [ ] `suavizacionExponencial` existe y el historial muestra los commits de rojo, verde y refactor.
- [ ] Hay pruebas unitarias de `suavizacionExponencial`, `mape` y `debeGenerarAlerta`, con los casos de las tablas.
- [ ] `tests/bdd/features/alertas.feature` tiene `# language: es` en la primera línea y tres escenarios.
- [ ] Los escenarios de alertas corren en el job *Pruebas BDD* que ya trae el pipeline.
- [ ] `mse` existe, cumple el requisito del Paso 8.1 y el historial muestra los commits de rojo, verde y refactor.
- [ ] Hay al menos tres casos unitarios nuevos para promedio móvil y `mad`, justificados en el informe.
- [ ] Hay al menos un `.feature` propio con un escenario nuevo, y corre en el job *Pruebas BDD*.
- [ ] La configuración del análisis estático tiene al menos una regla agregada o ajustada, explicada en el informe.
- [ ] El informe tiene el checklist de la revisión estática con al menos dos hallazgos o la justificación de por qué no hay.
- [ ] `npm run lint` no reporta nada.
- [ ] `jest.config.js` tiene el umbral de cobertura y la cobertura es de 90 % o más.
- [ ] El workflow tiene los jobs de análisis estático, pruebas unitarias, BDD, cobertura y despliegue, y el despliegue depende de los cuatro.
- [ ] El informe tiene las capturas, la salida de cobertura y las respuestas.

## Rúbrica

| Criterio | Peso |
|---|---|
| TDD: función correcta y commits de rojo, verde y refactor | 15 % |
| Pruebas unitarias: casos completos, nombres claros, tolerancia numérica | 10 % |
| BDD: escenarios de alertas correctos en español y pasos que los ejecutan | 10 % |
| Análisis estático y cobertura con umbral | 10 % |
| Pipeline: job de cobertura, escenarios de alertas en el job de BDD, `needs` del despliegue y evidencia del rojo y el verde | 15 % |
| TDD propio: `mse` correcto, pruebas decididas por ustedes y commits de rojo, verde y refactor | 10 % |
| Pruebas unitarias diseñadas por ustedes: casos nuevos y riesgo justificado | 5 % |
| BDD propio: escenario legible para Producción y pasos que lo ejecutan | 5 % |
| Análisis estático configurado por ustedes: regla, hallazgo y decisión explicada | 5 % |
| Revisión estática: checklist completo y hallazgos razonados | 5 % |
| Informe: respuestas razonadas con sus palabras | 10 % |
| **Total** | **100 %** |

## Documentación oficial

- Jest: https://jestjs.io/docs/getting-started
- Jest, `coverageThreshold`: https://jestjs.io/docs/configuration#coveragethreshold-object
- jest-cucumber: https://github.com/bencompton/jest-cucumber
- ESLint, reglas: https://eslint.org/docs/latest/rules/
- `npm ci`: https://docs.npmjs.com/cli/commands/npm-ci
- Sintaxis de workflows: https://docs.github.com/actions/reference/workflow-syntax-for-github-actions
