# Análisis estático con ESLint

Guía de referencia para entender, ejecutar y modificar el análisis estático de este proyecto. Todas las salidas de consola que aparecen aquí se obtuvieron ejecutando los comandos en una copia del proyecto (`/tmp/pronosticos-copia/pronosticos-node`), con ESLint 10.14.0; los archivos de ejemplo (`ejemplos/…`, `cambios/…`, `arreglo/…`) se crearon solo para provocar cada hallazgo y no forman parte del repositorio. En su equipo cambia la ruta de la carpeta.

## 1. Qué es el análisis estático

El análisis estático revisa el código **sin ejecutarlo**. Lee el texto del programa y lo compara con un conjunto de reglas: variables sin definir o sin usar, comparaciones que convierten tipos, código que nunca se ejecuta, funciones demasiado complejas.

Las pruebas (análisis dinámico) ejecutan el código y comparan el resultado con lo esperado. Por eso solo encuentran problemas en las líneas que recorren. El análisis estático encuentra lo que las pruebas no ven:

| Lo encuentra el análisis estático | Por qué las pruebas no lo ven |
|---|---|
| Un error en una rama que ninguna prueba recorre (por ejemplo, un nombre mal escrito dentro de un `catch`) | La línea nunca se ejecuta durante las pruebas |
| Una variable calculada que nadie usa | El resultado es correcto; el problema es que sobra código |
| Una función con demasiadas decisiones | Funciona, pero es difícil de entender, de probar y de cambiar |
| Un `==` que hoy compara bien pero mañana recibe un texto | Las pruebas usan los tipos que el autor esperaba |

El temario ISTQB CTFL v4.0 (sección 3.1.3) lo resume así: el análisis estático encuentra defectos directamente, puede detectar defectos en caminos que se ejecutan rara vez y puede medir características que no dependen de ejecutar el código, como la mantenibilidad. Las dos técnicas se complementan; ninguna reemplaza a la otra.

## 2. La herramienta y su configuración

[ESLint](https://eslint.org/) es el analizador estático (*linter*) de JavaScript. Está en `devDependencies` y se ejecuta con `npm run lint` (que corre `eslint .`).

La configuración está en `eslint.config.mjs`. Desde ESLint 10 el único formato es el *flat config*: un arreglo de objetos que se aplican en orden, y cada objeto puede limitarse a ciertos archivos con `files`.

```javascript
export default [
  // Carpetas que crean las herramientas y que no se analizan.
  { ignores: ['node_modules/', 'coverage/'] },

  // Reglas recomendadas por ESLint: detectan errores probables.
  js.configs.recommended,

  {
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: {
      eqeqeq: 'error',
      complexity: ['error', 5],
    },
  },

  // En las pruebas existen las funciones globales de Jest (describe, test, expect).
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      globals: { ...globals.jest },
    },
  },
];
```

| Parte | Qué hace |
|---|---|
| `ignores` | Carpetas que ESLint no revisa |
| `js.configs.recommended` | Activa el conjunto de reglas recomendadas de `@eslint/js`: errores probables, no estilo |
| `languageOptions.sourceType: 'commonjs'` | El proyecto usa `require` y `module.exports` |
| `languageOptions.globals` | Qué variables globales existen: las de Node.js (`process`, `console`) en todo el proyecto y las de Jest solo en `tests/`. Sin esto, `no-undef` reportaría `describe` o `process` como variables sin definir |
| `rules` | Reglas agregadas por el proyecto. Cada regla tiene una severidad: `'off'`, `'warn'` o `'error'` |

Solo los hallazgos de severidad `error` hacen fallar el comando (ver sección 4). Para ver la configuración final que ESLint aplica a un archivo:

```bash
npx eslint --print-config src/pronosticos.js
```

En este proyecto quedan activas 66 reglas, todas con severidad `error` (la tabla completa está en la sección 3.4).

## 3. Las reglas configuradas

Los ejemplos de esta sección se crearon en la carpeta `ejemplos/` y se confirmó que ESLint reporta cada uno con `npx eslint ejemplos/`. Al lado de cada ejemplo está lo que imprimió ESLint para ese archivo; en los de la sección 3.3 se omite la línea con la ruta, que siempre es `…/ejemplos/<nombre-de-la-regla>.js`.

### 3.1 `eqeqeq`: comparaciones estrictas

Exige `===` y `!==`. `==` convierte los tipos antes de comparar: `"3" == 3` da `true`, y también `0 == ""`. Con la opción por defecto (`"always"`) no hay excepciones.

```javascript
function esTrimestral(ventana) {
  return ventana == 3;
}
```

```
/private/tmp/pronosticos-copia/pronosticos-node/ejemplos/eqeqeq.js
  2:18  error  Expected '===' and instead saw '=='  eqeqeq
```

Corrección: `return ventana === 3;`. Si `ventana` llega como texto (por ejemplo, desde un formulario), hay que convertirlo de forma explícita con `Number(ventana)`; así la conversión queda a la vista.

### 3.2 `complexity` con máximo 5: complejidad ciclomática

Cuenta los caminos independientes de una función: 1 más cada decisión (`if`, `for`, `while`, `case`, `catch`, el operador `? :` y también `&&`, `||` y `??`). Con más de 5 caminos una función necesita más pruebas para cubrirse y cuesta más entenderla. El máximo por defecto de ESLint es 20; el proyecto lo bajó a 5.

```javascript
function clasificarError(error, umbral) {
  if (error < 0) {
    return 'inválido';
  }
  if (umbral <= 0) {
    return 'sin umbral';
  }
  if (error >= umbral * 2) {
    return 'crítico';
  }
  if (error >= umbral) {
    return 'alerta';
  }
  if (error >= umbral / 2) {
    return 'vigilar';
  }
  return 'normal';
}
```

```
/private/tmp/pronosticos-copia/pronosticos-node/ejemplos/complexity.js
  1:1  error  Function 'clasificarError' has a complexity of 6. Maximum allowed is 5  complexity
```

Cinco `if` más uno: complejidad 6. Corrección: convertir la cadena de decisiones en datos. El comportamiento no cambia (se comprobó con 27 combinaciones de error y umbral), pero agregar un nivel ya no agrega una rama:

```javascript
// Cada nivel es una fila de datos y no una rama de código: agregar un nivel
// no aumenta la complejidad de la función.
const NIVELES = [
  { proporcion: 2, nivel: 'crítico' },
  { proporcion: 1, nivel: 'alerta' },
  { proporcion: 0.5, nivel: 'vigilar' },
];

function clasificarError(error, umbral) {
  if (error < 0) {
    return 'inválido';
  }
  if (umbral <= 0) {
    return 'sin umbral';
  }
  const encontrado = NIVELES.find(({ proporcion }) => error >= umbral * proporcion);
  return encontrado ? encontrado.nivel : 'normal';
}
```

ESLint no corrige la complejidad solo: reducirla es una decisión de diseño.

### 3.3 `js.configs.recommended`: errores probables

El conjunto recomendado reúne reglas que señalan código que casi seguro es un error. Estos son los casos que más aparecen en un proyecto como este.

**no-unused-vars.** Una variable, función o parámetro que se declara y no se usa. Casi siempre indica que el código no hace lo que se pensó.

```javascript
function promedio(serie) {
  const totalPeriodos = serie.length;
  return serie.reduce((a, b) => a + b, 0) / 3;
}
```

```
  2:9  error  'totalPeriodos' is assigned a value but never used  no-unused-vars
```

Aquí el hallazgo revela un defecto real: la función divide entre 3 en lugar de entre el número de periodos. Corrección: `return serie.reduce((a, b) => a + b, 0) / totalPeriodos;`.

**no-undef.** Una variable que no está declarada en ningún lado, normalmente por un error al escribirla. Si esa línea está en una rama que ninguna prueba recorre, solo el análisis estático lo detecta antes de producción.

```javascript
function promedio(serie) {
  return serie.reduce((a, b) => a + b, 0) / seire.length;
}
```

```
  2:45  error  'seire' is not defined  no-undef
```

Corrección: `serie.length`.

**no-unreachable.** Código después de un `return`, `throw`, `break` o `continue`: nunca se ejecuta.

```javascript
function validarVentana(ventana) {
  if (ventana <= 0) {
    return false;
    console.log('Ventana inválida');
  }
  return true;
}
```

```
  4:5  error  Unreachable code  no-unreachable
```

Corrección: si el mensaje hace falta, va antes del `return`.

**no-dupe-keys.** Un objeto con la misma clave dos veces: el segundo valor reemplaza al primero sin aviso.

```javascript
const configuracion = {
  ventana: 3,
  umbral: 10,
  ventana: 6,
};
```

```
  4:3  error  Duplicate key 'ventana'  no-dupe-keys
```

Corrección: dejar una sola clave `ventana`, con el valor correcto.

**no-constant-condition.** Una condición que siempre da el mismo resultado. Aquí se escribió el nombre de la variable entre comillas: un texto no vacío siempre es verdadero.

```javascript
function mensaje(hayAlerta) {
  if ('hayAlerta') {
    return 'Revisar el plan de producción';
  }
  return hayAlerta;
}
```

```
  2:7  error  Unexpected constant condition  no-constant-condition
```

Corrección: `if (hayAlerta) {`.

**no-cond-assign.** Una asignación (`=`) donde se esperaba una comparación (`===`).

```javascript
function esUmbralMaximo(umbral) {
  if (umbral = 100) {
    return true;
  }
  return false;
}
```

```
  2:7  error  Expected a conditional expression and instead saw an assignment  no-cond-assign
  2:7  error  Unexpected constant condition                                    no-constant-condition
  2:7  error  'umbral' is assigned a value but never used                      no-unused-vars
```

Un mismo error dispara tres reglas: la asignación en la condición, la condición que siempre vale 100 (verdadera) y el parámetro que se sobrescribe sin usarse. Corrección: `return umbral === 100;`.

**use-isnan.** Comparar con `NaN`. `NaN` no es igual a nada, ni a sí mismo: `resultado !== NaN` siempre es `true`.

```javascript
function esValido(resultado) {
  return resultado !== NaN;
}
```

```
  2:10  error  Use the isNaN function to compare with NaN  use-isnan
```

Corrección: `return !Number.isNaN(resultado);`.

**valid-typeof.** Comparar `typeof` con un texto que `typeof` nunca devuelve.

```javascript
function esNumero(valor) {
  return typeof valor === 'numero';
}
```

```
  2:27  error  Invalid typeof comparison value  valid-typeof
```

Corrección: `typeof valor === 'number'`. Los valores válidos están en inglés: `'number'`, `'string'`, `'boolean'`, `'object'`, `'function'`, `'undefined'`, `'bigint'`, `'symbol'`.

**no-empty.** Un bloque vacío. Un `catch` vacío esconde los errores.

```javascript
function leerVentana(texto) {
  let ventana = 3;
  try {
    ventana = JSON.parse(texto);
  } catch (error) {
  }
  return ventana;
}
```

```
  5:12  error  'error' is defined but never used  no-unused-vars
  5:19  error  Empty block statement              no-empty
```

`no-unused-vars` también revisa la variable del `catch`. Corrección: tratar el error de forma explícita.

```javascript
const VENTANA_POR_DEFECTO = 3;

function leerVentana(texto) {
  try {
    return JSON.parse(texto);
  } catch (error) {
    console.warn(`Ventana inválida (${error.message}); se usa ${VENTANA_POR_DEFECTO}`);
    return VENTANA_POR_DEFECTO;
  }
}
```

**no-self-assign.** Asignar una variable a sí misma: no hace nada y suele ser un error al copiar.

```javascript
function normalizar(serie) {
  serie = serie;
  return serie.map(Number);
}
```

```
  2:11  error  'serie' is assigned to itself  no-self-assign
```

Corrección: borrar la línea.

**no-useless-assignment.** Un valor asignado que se reemplaza antes de usarse.

```javascript
function ventanaPorDefecto(serie) {
  let ventana = 3;
  ventana = Math.min(6, serie.length);
  return ventana;
}
```

```
  2:7  error  The value assigned to 'ventana' is not used in subsequent statements  no-useless-assignment
```

Corrección: `return Math.min(6, serie.length);`.

Todas las correcciones de esta sección se guardaron en archivos y `npx eslint` sobre ellos terminó sin hallazgos y con código de salida 0.

### 3.4 Las 66 reglas activas

Esta es la lista que muestra `npx eslint --print-config src/pronosticos.js`. Las 64 primeras vienen de `js.configs.recommended`; las dos últimas las agregó el proyecto. Cada regla tiene su página en `https://eslint.org/docs/latest/rules/<nombre>`. La última columna indica si ESLint puede corregirla con `--fix` (*sí*), si solo ofrece sugerencias que el editor muestra pero `--fix` no aplica (*sugerencia*) o ninguna de las dos (*no*).

| Regla | Qué detecta | Corrección automática |
|---|---|---|
| constructor-super | Constructor de una clase derivada que no llama a `super()` | no |
| for-direction | `for` cuyo contador avanza en la dirección contraria a la condición (ciclo infinito) | no |
| getter-return | Un *getter* que no devuelve nada | no |
| no-async-promise-executor | Función `async` como ejecutor de una `Promise` | no |
| no-case-declarations | `let`, `const` o `function` declarados directamente en un `case` | sugerencia |
| no-class-assign | Reasignar el nombre de una clase | no |
| no-compare-neg-zero | Comparar con `-0` | sugerencia |
| no-cond-assign | Asignación dentro de una condición | no |
| no-const-assign | Reasignar una constante | no |
| no-constant-binary-expression | Expresión cuyo resultado no depende de las variables (por ejemplo `a + b ?? c`) | no |
| no-constant-condition | Condición que siempre da el mismo resultado | no |
| no-control-regex | Caracteres de control en una expresión regular | no |
| no-debugger | Sentencia `debugger` olvidada | no |
| no-delete-var | `delete` sobre una variable | no |
| no-dupe-args | Dos parámetros con el mismo nombre | no |
| no-dupe-class-members | Dos métodos de una clase con el mismo nombre | no |
| no-dupe-else-if | La misma condición repetida en una cadena `if … else if` | no |
| no-dupe-keys | Clave repetida en un objeto | no |
| no-duplicate-case | `case` repetido en un `switch` | no |
| no-empty | Bloque vacío | sugerencia |
| no-empty-character-class | `[]` vacío en una expresión regular | no |
| no-empty-pattern | Desestructuración vacía (`const {} = objeto`) | no |
| no-empty-static-block | Bloque `static {}` vacío en una clase | sugerencia |
| no-ex-assign | Reasignar la excepción dentro de un `catch` | no |
| no-extra-boolean-cast | Conversión a booleano innecesaria (`if (!!x)`) | sí |
| no-fallthrough | Un `case` que continúa al siguiente sin `break` | no |
| no-func-assign | Reasignar una función declarada | no |
| no-global-assign | Reasignar un objeto global (`undefined = 1`, `Math = …`) | no |
| no-import-assign | Reasignar algo importado | no |
| no-invalid-regexp | Expresión regular inválida en `new RegExp(...)` | no |
| no-irregular-whitespace | Espacios invisibles que no son espacios normales | no |
| no-loss-of-precision | Número literal que JavaScript no puede representar con exactitud | no |
| no-misleading-character-class | Caracteres de varios puntos de código dentro de `[...]` en una expresión regular | sugerencia |
| no-new-native-nonconstructor | `new` con funciones que no son constructores (`new Symbol()`) | no |
| no-nonoctal-decimal-escape | Secuencias `\8` y `\9` en textos | sugerencia |
| no-obj-calls | Llamar como función a objetos globales (`Math()`, `JSON()`) | no |
| no-octal | Números octales antiguos (`071`) | no |
| no-prototype-builtins | Llamar métodos de `Object.prototype` directamente en un objeto (`obj.hasOwnProperty`) | sugerencia |
| no-redeclare | Declarar dos veces la misma variable | no |
| no-regex-spaces | Varios espacios seguidos en una expresión regular | sí |
| no-self-assign | Asignar una variable a sí misma | no |
| no-setter-return | Un *setter* que devuelve un valor | no |
| no-shadow-restricted-names | Usar como nombre `undefined`, `NaN`, `Infinity`, `arguments` o `eval` | no |
| no-sparse-arrays | Arreglos con huecos (`[1, , 3]`) | no |
| no-this-before-super | Usar `this` antes de `super()` en un constructor | no |
| no-unassigned-vars | Variable `let` o `var` que se lee pero nunca recibe un valor | no |
| no-undef | Variable no declarada | no |
| no-unexpected-multiline | Saltos de línea que cambian el sentido del código sin punto y coma | no |
| no-unreachable | Código que nunca se ejecuta | no |
| no-unsafe-finally | `return`, `throw`, `break` o `continue` dentro de `finally` | no |
| no-unsafe-negation | Negar el operando izquierdo de `in` o `instanceof` (`!a in b`) | sugerencia |
| no-unsafe-optional-chaining | `?.` donde un `undefined` causaría un error | no |
| no-unused-labels | Etiqueta que no se usa | sí |
| no-unused-private-class-members | Miembro privado (`#campo`) de una clase que no se usa | sugerencia |
| no-unused-vars | Variable, función o parámetro sin usar | sugerencia |
| no-useless-assignment | Valor asignado que nunca se lee | no |
| no-useless-backreference | Referencia hacia atrás inútil en una expresión regular | no |
| no-useless-catch | `catch` que solo vuelve a lanzar el mismo error | no |
| no-useless-escape | `\` innecesario en un texto o expresión regular | sugerencia |
| no-with | Sentencia `with` | no |
| preserve-caught-error | Lanzar un error nuevo dentro de un `catch` sin conservar el original como `cause` | sugerencia |
| require-yield | Función generadora (`function*`) sin `yield` | no |
| use-isnan | Comparar con `NaN` en lugar de usar `isNaN` | sugerencia |
| valid-typeof | Comparar `typeof` con un texto inválido | sugerencia |
| eqeqeq | `==` o `!=` en lugar de `===` o `!==` (regla del proyecto) | sí, solo cuando es seguro |
| complexity | Función con complejidad ciclomática mayor que 5 (regla del proyecto) | no |

## 4. Cómo se ejecuta y cómo se lee un hallazgo

```bash
npm run lint                     # analiza todo el proyecto (eslint .)
npx eslint src/                  # solo una carpeta
npx eslint src/pronosticos.js    # solo un archivo
```

ESLint no imprime nada cuando no encuentra problemas. Cuando encuentra, el formato por defecto (*stylish*) agrupa los hallazgos por archivo:

```
/private/tmp/pronosticos-copia/pronosticos-node/arreglo/reporte.js
  2:9   error  'diferencias' is assigned a value but never used  no-unused-vars
  3:22  error  Expected '===' and instead saw '=='               eqeqeq
  3:45  error  Expected '===' and instead saw '=='               eqeqeq

✖ 3 problems (3 errors, 0 warnings)
  1 error and 0 warnings potentially fixable with the `--fix` option.
```

| Parte | En el ejemplo | Qué significa |
|---|---|---|
| Archivo | `…/arreglo/reporte.js` | Ruta completa del archivo, una sola vez para todos sus hallazgos |
| Ubicación | `2:9` | Línea y columna |
| Severidad | `error` | `error` o `warning`, según cómo esté configurada la regla |
| Mensaje | `'diferencias' is assigned…` | Qué encontró, con el nombre concreto |
| Regla | `no-unused-vars` | Nombre de la regla. Se busca en https://eslint.org/docs/latest/rules/ |
| Resumen | `✖ 3 problems…` | Total de hallazgos y cuántos se pueden corregir con `--fix` |

### El código de salida

El pipeline no lee los mensajes: decide con el **código de salida** del comando.

| Código | Significado |
|---|---|
| 0 | No hay errores. Puede haber advertencias (`warning`), salvo que se use `--max-warnings` y se supere ese número |
| 1 | Hay al menos un error, o más advertencias de las permitidas con `--max-warnings` |
| 2 | ESLint no pudo analizar: problema de configuración o error interno |

En GitHub Actions, un paso cuyo comando termina con un código distinto de 0 falla, el job queda en rojo y los jobs que dependen de él (`needs`) no se ejecutan. Ojo con las advertencias: **no** detienen el pipeline. Si una regla es importante, configúrenla como `'error'`; si quieren que tampoco pase ninguna advertencia, usen `eslint . --max-warnings 0`.

## 5. Cómo corregir

### Lo que ESLint corrige solo

`--fix` aplica las correcciones que no pueden cambiar el comportamiento y modifica los archivos. Con el archivo de la sección 4:

```javascript
function resumen(serie, ventana) {
  const diferencias = serie.map((valor) => Math.abs(valor - 100));
  if (typeof ventana == 'number' && ventana == serie.length) {
    return `Ventana de ${ventana} periodos`;
  }
  return 'Sin datos';
}
```

```bash
npx eslint arreglo/ --fix
```

```
/private/tmp/pronosticos-copia/pronosticos-node/arreglo/reporte.js
  2:9   error  'diferencias' is assigned a value but never used  no-unused-vars
  3:46  error  Expected '===' and instead saw '=='               eqeqeq

✖ 2 problems (2 errors, 0 warnings)
```

ESLint cambió el primer `==` por `===` y la línea quedó así:

```javascript
  if (typeof ventana === 'number' && ventana == serie.length) {
```

El segundo `==` no lo tocó. `typeof` siempre devuelve un texto, así que comparar con `===` contra otro texto da el mismo resultado: es seguro. En `ventana == serie.length`, en cambio, `ventana` podría ser el texto `"3"`, y con `===` el resultado cambiaría. Esa decisión la toma la persona, no la herramienta.

Para ver qué cambiaría sin modificar archivos existe `--fix-dry-run` (se usa con un formato de salida como `--format json`, porque el formato por defecto no muestra el código corregido).

### Lo que hay que corregir a mano

La mayoría de las reglas del proyecto no tienen corrección automática (ver la tabla de la sección 3.4). `no-unused-vars` solo ofrece una **sugerencia**: el editor la muestra, pero `--fix` no la aplica, porque borrar una variable puede esconder el defecto real (en el ejemplo, ¿para qué se calcularon las diferencias?). Esas correcciones se hacen a mano y se verifican corriendo de nuevo las pruebas y el análisis.

## 6. Cómo cambiar la configuración

Todos los cambios de esta sección se probaron en una copia del proyecto y después se revirtieron.

### Agregar una regla

Las reglas se agregan en el objeto `rules`. Por ejemplo, `no-magic-numbers` prohíbe números sin nombre en el código (se permiten 0 y 1, y los índices de arreglos):

```javascript
    rules: {
      eqeqeq: 'error',
      complexity: ['error', 5],
      // Regla agregada: no permite números sin nombre en el código.
      'no-magic-numbers': ['error', { ignore: [0, 1], ignoreArrayIndexes: true }],
    },
```

```bash
npx eslint src
```

```
/private/tmp/pronosticos-copia/pronosticos-node/src/app.js
  22:23  error  No magic number: 400  no-magic-numbers
  28:23  error  No magic number: 400  no-magic-numbers

/private/tmp/pronosticos-copia/pronosticos-node/src/pronosticos.js
  47:104  error  No magic number: 100  no-magic-numbers
  61:30   error  No magic number: 100  no-magic-numbers

/private/tmp/pronosticos-copia/pronosticos-node/src/server.js
  7:36  error  No magic number: 3000  no-magic-numbers

✖ 5 problems (5 errors, 0 warnings)
```

La regla nueva encontró cinco hallazgos en el código que ya existía. Algunos merecen una constante (`const PUERTO_POR_DEFECTO = 3000`); otros son discutibles (el `100` que convierte una proporción en porcentaje). Esto pasa siempre que se agrega una regla: hay que decidir qué hacer con el código existente (corregirlo, ajustar las opciones de la regla o no activarla) **antes** de subir el cambio, o el pipeline quedará en rojo.

### Subir o bajar un umbral

El número de `complexity` es el máximo permitido. Bajarlo de 5 a 2:

```javascript
      complexity: ['error', 2],
```

```bash
npx eslint src
```

```
/private/tmp/pronosticos-copia/pronosticos-node/src/app.js
  19:45  error  Arrow function has a complexity of 5. Maximum allowed is 2  complexity

/private/tmp/pronosticos-copia/pronosticos-node/src/pronosticos.js
  14:1  error  Function 'promedioMovil' has a complexity of 4. Maximum allowed is 2      complexity
  60:1  error  Function 'debeGenerarAlerta' has a complexity of 3. Maximum allowed is 2  complexity
  67:1  error  Function 'validarSeries' has a complexity of 3. Maximum allowed is 2      complexity

✖ 4 problems (4 errors, 0 warnings)
```

`promedioMovil` tiene dos `if` y un `||`: complejidad 4. Un umbral más bajo obliga a funciones más pequeñas; uno más alto (el valor por defecto de ESLint es 20) tolera funciones más complejas. El umbral es una decisión del equipo y conviene anotarla en el README.

### Desactivar una regla en una línea concreta

Cuando un hallazgo no se va a corregir, se desactiva la regla **solo en esa línea** y se deja escrito el porqué. ESLint acepta la justificación en el mismo comentario, separada por dos guiones (`--`):

```javascript
// eslint-disable-next-line complexity -- tabla de niveles acordada con Producción; se revisa en el sprint 4
function clasificarError(error, umbral) {
  if (error < 0) {
    return 'inválido';
  }
  // … los mismos cinco if del ejemplo de la sección 3.2
}
```

Con el archivo completo, `npx eslint cambios/supresion.js` no imprimió nada y terminó con código de salida 0. Hay dos formas:

| Comentario | Alcance |
|---|---|
| `// eslint-disable-next-line regla -- motivo` | La línea siguiente |
| `codigo(); // eslint-disable-line regla -- motivo` | La misma línea |

Reglas para usarlo:

- Siempre con el nombre de la regla. Un `// eslint-disable-next-line` sin regla apaga **todas** las reglas en esa línea.
- Siempre con la justificación después de `--`.
- Evitar `/* eslint-disable */` sin `-next-line`: desactiva la regla desde ahí hasta el final del archivo.

ESLint avisa cuando una supresión ya no hace falta (`reportUnusedDisableDirectives` vale `"warn"` por defecto):

```javascript
// eslint-disable-next-line eqeqeq -- se compara con un texto que llega del formulario
const esTrimestral = (ventana) => ventana === 3;
```

```bash
npx eslint cambios/sobra.js
```

```
/private/tmp/pronosticos-copia/pronosticos-node/cambios/sobra.js
  1:1  warning  Unused eslint-disable directive (no problems were reported from 'eqeqeq')

✖ 1 problem (0 errors, 1 warning)
  0 errors and 1 warning potentially fixable with the `--fix` option.
```

Es una advertencia, así que el código de salida es 0. Con `npx eslint cambios/sobra.js --max-warnings 0` el mismo aviso termina con `ESLint found too many warnings (maximum: 0).` y código de salida 1.

## 7. Integración en el editor y en Git (referencia)

Esta sección es solo de referencia: el proyecto no la necesita para funcionar y la actividad no la exige.

**Editor.** Para Visual Studio Code, la página de integraciones de ESLint enlaza la extensión **ESLint** de Microsoft (identificador `dbaeumer.vscode-eslint`). Lee `eslint.config.mjs` y marca los hallazgos mientras se escribe, con las mismas reglas que el pipeline; también puede aplicar `--fix` al guardar. La misma página lista integraciones para otros editores.

**Hook de Git.** Git puede ejecutar un programa antes de cada commit: el archivo `.git/hooks/pre-commit`. Si el programa termina con un código distinto de 0, el commit se cancela. Un hook mínimo para este proyecto:

```sh
#!/bin/sh
# .git/hooks/pre-commit — se ejecuta antes de cada commit.
npm run lint
```

Hay que darle permiso de ejecución (`chmod +x .git/hooks/pre-commit`). La carpeta `.git/hooks` no se sube al repositorio, así que cada persona instala su hook; por eso los equipos suelen usar herramientas que lo instalan solas (la página de integraciones de ESLint lista varias). El hook da retroalimentación antes de subir el cambio, pero no reemplaza al pipeline: se puede saltar con `git commit --no-verify` y el pipeline no.

## 8. Documentación oficial

- ESLint: https://eslint.org/docs/latest/
- Archivo de configuración (*flat config*): https://eslint.org/docs/latest/use/configure/configuration-files
- Configurar y desactivar reglas: https://eslint.org/docs/latest/use/configure/rules
- Línea de comandos, `--fix` y códigos de salida: https://eslint.org/docs/latest/use/command-line-interface
- Lista de reglas: https://eslint.org/docs/latest/rules/
- Regla `complexity`: https://eslint.org/docs/latest/rules/complexity
- Regla `eqeqeq`: https://eslint.org/docs/latest/rules/eqeqeq
- Integraciones (editores y herramientas): https://eslint.org/docs/latest/use/integrations
- Hooks de Git: https://git-scm.com/docs/githooks
