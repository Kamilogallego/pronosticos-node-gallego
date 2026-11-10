# Actividad · Pruebas de la Unidad 2 y pipeline de CI/CD (Node.js)

**Modalidad:** individual
**Fecha de entrega:** [FECHA DE ENTREGA]
**Entrega:** enlace a su repositorio en GitHub, con la actividad completa y el pipeline en verde.

## Objetivo

Partir de este proyecto, que hoy solo tiene pruebas unitarias en su pipeline, y llevarlo a un pipeline completo: desarrollar una función nueva con **TDD**, ampliar las **pruebas unitarias**, escribir escenarios **BDD**, aplicar **análisis estático**, medir la **cobertura** y hacer que el **despliegue (simulado)** solo ocurra cuando todo eso pasa.

Antes de empezar, lean el [README.md](README.md): ahí están los conceptos y los comandos que se usan en cada paso.

---

## Paso 0. Tener el proyecto en su propio repositorio

**Por qué:** el pipeline corre en GitHub Actions, y para eso el código tiene que estar en un repositorio suyo.

1. Clonen el proyecto y entren a la carpeta:
   ```bash
   git clone <url-del-repositorio-del-curso>
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

**Qué deben observar:** el workflow **CI/CD** corriendo con dos jobs: *Pruebas unitarias* y *Despliegue (simulado)*. Abran el job de despliegue: la última línea dice `Desplegado`.

---

## Paso 1. Conocer el punto de partida

**Por qué:** antes de cambiar algo hay que saber que el punto de partida está en verde. Si después algo se pone en rojo, sabemos que fue por nuestros cambios.

```bash
npm install
npm run test:unit
```

**Qué deben observar:** las 11 pruebas pasan.

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

**Qué deben observar:** tres pruebas que pasan, una por escenario, con el nombre del escenario. Si un título no coincide con el del `.feature`, jest-cucumber lo dice en el mensaje de error.

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

### 7.2 Jobs de BDD y de cobertura

Siguiendo el mismo modelo, agreguen ustedes dos jobs más:

- `pruebas-bdd` (nombre: "Pruebas BDD"), que corra `npm run test:bdd`.
- `cobertura` (nombre: "Cobertura"), que corra `npm run test:cobertura`.

Cada job corre en su propia máquina, así que cada uno necesita sus tres primeros pasos: descargar el código, instalar Node.js e instalar dependencias.

### 7.3 Que el despliegue dependa de todo

Cambien la línea `needs` del job `despliegue`:

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

**Qué deben observar en Actions:** los cuatro jobs de verificación corren en paralelo y, cuando todos pasan, corre el despliegue e imprime `Desplegado`. En la vista del workflow se ve el diagrama con las flechas de `needs`.

### 7.5 Comprobar que el pipeline los protege

1. Rompan algo a propósito: en `src/pronosticos.js`, cambien el `>=` de `debeGenerarAlerta` por `>`.
2. Suban el cambio:
   ```bash
   git add .
   git commit -m "prueba: cambio que rompe la regla del umbral"
   git push
   ```
3. En Actions, el pipeline queda en rojo: fallan las pruebas que verifican el caso límite y el despliegue **no corre**.
4. Reviertan el cambio y suban de nuevo:
   ```bash
   git revert HEAD --no-edit
   git push
   ```
5. El pipeline vuelve a verde y el despliegue corre.

Tomen captura de las dos ejecuciones (la roja y la verde) para el informe.

---

## Paso 8. Informe

Creen en la raíz del repositorio el archivo `INFORME_<Nombre>_<Apellido>.md` con:

1. El enlace a su repositorio.
2. Las capturas del pipeline en rojo (Paso 7.5) y en verde.
3. La salida de `npm run test:cobertura`.
4. Respuestas breves, con sus palabras:
   - ¿Qué vieron en el rojo del Paso 2.1 y por qué es importante verlo antes de escribir el código?
   - ¿Por qué el MAPE del caso `[80, 0, 95]` se divide entre 2?
   - ¿Qué diferencia hay entre una prueba unitaria y un escenario BDD en este proyecto?
   - En el Paso 7.5, ¿qué pruebas fallaron y por qué el despliegue no corrió?

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
- [ ] `npm run lint` no reporta nada.
- [ ] `jest.config.js` tiene el umbral de cobertura y la cobertura es de 90 % o más.
- [ ] El workflow tiene los jobs de análisis estático, pruebas unitarias, BDD, cobertura y despliegue, y el despliegue depende de los cuatro.
- [ ] El informe tiene las capturas, la salida de cobertura y las respuestas.

## Rúbrica

| Criterio | Peso |
|---|---|
| TDD: función correcta y commits de rojo, verde y refactor | 20 % |
| Pruebas unitarias: casos completos, nombres claros, tolerancia numérica | 20 % |
| BDD: escenarios correctos en español y pasos que los ejecutan | 15 % |
| Análisis estático y cobertura con umbral | 15 % |
| Pipeline: jobs correctos, `needs` del despliegue y evidencia del rojo y el verde | 20 % |
| Informe: respuestas razonadas con sus palabras | 10 % |

## Documentación oficial

- Jest: https://jestjs.io/docs/getting-started
- Jest, `coverageThreshold`: https://jestjs.io/docs/configuration#coveragethreshold-object
- jest-cucumber: https://github.com/bencompton/jest-cucumber
- ESLint, reglas: https://eslint.org/docs/latest/rules/
- `npm ci`: https://docs.npmjs.com/cli/commands/npm-ci
- Sintaxis de workflows: https://docs.github.com/actions/reference/workflow-syntax-for-github-actions
