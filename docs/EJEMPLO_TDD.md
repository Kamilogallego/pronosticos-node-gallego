# Ejemplo de TDD: así se habría construido `mad`

La función `mad` (error absoluto medio) ya existe en `src/pronosticos.js`. Este documento reconstruye, paso a paso, cómo se habría escrito con TDD: primero la prueba, después el código mínimo para que pase y al final la mejora del diseño. Es el mismo ciclo que van a seguir en la actividad, aplicado a una función que ya conocen.

**De dónde salen las salidas.** Cada salida de consola de este documento se obtuvo de verdad, en una copia del proyecto (`/tmp/pronosticos-copia/pronosticos-node`) de la que se quitaron `mad` y sus pruebas. Se copiaron tal cual; en su equipo solo cambian los tiempos. El código del proyecto no se modificó para escribir este documento.

## El requisito

Antes de escribir una sola línea hay que saber qué se espera. Producción lo describió así:

| Regla | Ejemplo |
|---|---|
| El MAD es el promedio de las diferencias absolutas entre la demanda real y el pronóstico, en unidades | real `[141, 138, 150]`, pronóstico `[126.67, 133.67, 135.67]` → (14.33 + 4.33 + 14.33) / 3 = 11.00 |
| Si el pronóstico es exacto, el MAD es 0 | real `[100, 100]`, pronóstico `[100, 100]` → 0 |
| Las dos series deben tener el mismo número de periodos | `[100, 110]` y `[100]` → error "Las series deben tener el mismo número de periodos" |
| Se necesita al menos un periodo | `[]` y `[]` → error "Se necesita al menos un periodo" |

Cada fila de la tabla se convierte en un ciclo rojo-verde-refactor.

---

## Ciclo 1. El cálculo con el ejemplo de Producción

### Rojo

La prueba describe el primer comportamiento con el ejemplo calculado a mano. Se crea `tests/unit/mad.test.js`:

```javascript
/** Pruebas unitarias del error absoluto medio (MAD). */
const { mad } = require('../../src/pronosticos');

describe('mad', () => {
  test('calcula el error absoluto medio', () => {
    const real = [141, 138, 150];
    const pronostico = [126.67, 133.67, 135.67];

    // (14.33 + 4.33 + 14.33) / 3 = 11.00, calculado de forma independiente.
    expect(mad(real, pronostico)).toBeCloseTo(11.0, 2);
  });
});
```

```bash
npx jest tests/unit/mad
```

```
FAIL tests/unit/mad.test.js
  mad
    ✕ calcula el error absoluto medio

  ● mad › calcula el error absoluto medio

    TypeError: mad is not a function

       8 |
       9 |     // (14.33 + 4.33 + 14.33) / 3 = 11.00, calculado de forma independiente.
    > 10 |     expect(mad(real, pronostico)).toBeCloseTo(11.0, 2);
         |            ^
      11 |   });
      12 | });
      13 |

      at Object.mad (tests/unit/mad.test.js:10:12)

Test Suites: 1 failed, 1 total
Tests:       1 failed, 1 total
Snapshots:   0 total
Time:        0.109 s
Ran all test suites matching tests/unit/mad.
```

`require` no falla cuando pide algo que el módulo no exporta: entrega `undefined`. Por eso el error aparece al llamar la función: `mad is not a function`. Es un rojo legítimo, porque la función todavía no existe.

### Verde

El código **mínimo** para que esa prueba pase es devolver el valor esperado. Se agrega en `src/pronosticos.js` y se exporta:

```javascript
function mad() {
  return 11.0;
}

module.exports = { promedioMovil, mad, mape, debeGenerarAlerta };
```

```
PASS tests/unit/mad.test.js
  mad
    ✓ calcula el error absoluto medio

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   0 total
Time:        0.1 s, estimated 1 s
Ran all test suites matching tests/unit/mad.
```

### Refactor

Todavía no hay nada que mejorar: el código es una sola línea y no repite nada.

### Qué se aprende

- Ver el rojo primero demuestra que la prueba es capaz de fallar. Una prueba que nunca se vio fallar puede estar pasando por accidente (por ejemplo, porque no se ejecuta).
- Devolver una constante parece hacer trampa, pero es deliberado: obliga a que **otra prueba** exija el cálculo real. Si con una sola prueba se escribe la fórmula completa, nada garantiza que cada parte de la fórmula esté verificada.

---

## Ciclo 2. Un segundo caso obliga a calcular de verdad

### Rojo

```javascript
  test('es cero cuando el pronóstico es exacto', () => {
    expect(mad([100, 100], [100, 100])).toBe(0);
  });
```

```bash
npx jest tests/unit/mad
```

```
FAIL tests/unit/mad.test.js
  mad
    ✓ calcula el error absoluto medio (1 ms)
    ✕ es cero cuando el pronóstico es exacto (1 ms)

  ● mad › es cero cuando el pronóstico es exacto

    expect(received).toBe(expected) // Object.is equality

    Expected: 0
    Received: 11

      12 |
      13 |   test('es cero cuando el pronóstico es exacto', () => {
    > 14 |     expect(mad([100, 100], [100, 100])).toBe(0);
         |                                         ^
      15 |   });
      16 | });
      17 |

      at Object.toBe (tests/unit/mad.test.js:14:41)

Test Suites: 1 failed, 1 total
Tests:       1 failed, 1 passed, 2 total
Snapshots:   0 total
Time:        0.104 s, estimated 1 s
Ran all test suites matching tests/unit/mad.
```

Ahora sí la prueba se ejecuta y falla: la constante 11 no sirve para este caso.

### Verde

Con dos ejemplos distintos, el único código que pasa los dos es el cálculo real. `sumar` ya existe en el módulo (la usan `promedioMovil` y `mape`):

```javascript
function mad(real, pronostico) {
  const errores = real.map((valorReal, i) => Math.abs(valorReal - pronostico[i]));
  return sumar(errores) / errores.length;
}
```

```
PASS tests/unit/mad.test.js
  mad
    ✓ calcula el error absoluto medio (1 ms)
    ✓ es cero cuando el pronóstico es exacto

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Snapshots:   0 total
Time:        0.068 s, estimated 1 s
Ran all test suites matching tests/unit/mad.
```

### Refactor

El código es corto y claro. Se deja como está hasta tener las validaciones.

### Qué se aprende

- Esta técnica se llama **triangulación**: cada ejemplo nuevo descarta una implementación falsa. Dos ejemplos que no pueden resolverse con la misma constante obligan a escribir la fórmula.
- Jest muestra el valor esperado (`0`) y el recibido (`11`), y señala la línea exacta. Por eso conviene que cada prueba verifique un solo comportamiento: el mensaje dice exactamente qué falló.

---

## Ciclo 3. Series de distinta longitud

### Rojo

```javascript
  test('rechaza series de distinta longitud', () => {
    expect(() => mad([100, 110], [100])).toThrow('mismo número de periodos');
  });
```

```bash
npx jest tests/unit/mad
```

```
FAIL tests/unit/mad.test.js
  mad
    ✓ calcula el error absoluto medio (1 ms)
    ✓ es cero cuando el pronóstico es exacto
    ✕ rechaza series de distinta longitud

  ● mad › rechaza series de distinta longitud

    expect(received).toThrow(expected)

    Expected substring: "mismo número de periodos"

    Received function did not throw

      16 |
      17 |   test('rechaza series de distinta longitud', () => {
    > 18 |     expect(() => mad([100, 110], [100])).toThrow('mismo número de periodos');
         |                                          ^
      19 |   });
      20 | });
      21 |

      at Object.toThrow (tests/unit/mad.test.js:18:42)

Test Suites: 1 failed, 1 total
Tests:       1 failed, 2 passed, 3 total
Snapshots:   0 total
Time:        0.109 s, estimated 1 s
Ran all test suites matching tests/unit/mad.
```

`Received function did not throw` significa que la función terminó sin error. ¿Qué devolvió? Basta con llamarla:

```bash
node -e "const {mad}=require('./src/pronosticos'); console.log(mad([100, 110], [100]))"
```

```
NaN
```

`pronostico[1]` no existe y vale `undefined`; `110 - undefined` es `NaN`, y cualquier suma con `NaN` da `NaN`. La función devolvió un resultado sin sentido sin avisar de nada. Es el peor tipo de defecto, porque no se nota.

### Verde

```javascript
function mad(real, pronostico) {
  if (real.length !== pronostico.length) {
    throw new Error('Las series deben tener el mismo número de periodos');
  }
  const errores = real.map((valorReal, i) => Math.abs(valorReal - pronostico[i]));
  return sumar(errores) / errores.length;
}
```

```
PASS tests/unit/mad.test.js
  mad
    ✓ calcula el error absoluto medio (1 ms)
    ✓ es cero cuando el pronóstico es exacto (1 ms)
    ✓ rechaza series de distinta longitud

Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
Snapshots:   0 total
Time:        0.101 s, estimated 1 s
Ran all test suites matching tests/unit/mad.
```

### Refactor

Aún nada: hay una sola validación.

### Qué se aprende

- Las pruebas de los casos inválidos no son un trámite. Esta encontró un defecto real del código del ciclo anterior: un resultado sin sentido y ningún aviso.
- `toThrow('...')` compara el mensaje del error. Así la prueba distingue este error de cualquier otro.

---

## Ciclo 4. Series vacías

### Rojo

```javascript
  test('rechaza series vacías', () => {
    expect(() => mad([], [])).toThrow('al menos un periodo');
  });
```

```bash
npx jest tests/unit/mad
```

```
FAIL tests/unit/mad.test.js
  mad
    ✓ calcula el error absoluto medio
    ✓ es cero cuando el pronóstico es exacto
    ✓ rechaza series de distinta longitud (1 ms)
    ✕ rechaza series vacías

  ● mad › rechaza series vacías

    expect(received).toThrow(expected)

    Expected substring: "al menos un periodo"

    Received function did not throw

      20 |
      21 |   test('rechaza series vacías', () => {
    > 22 |     expect(() => mad([], [])).toThrow('al menos un periodo');
         |                               ^
      23 |   });
      24 | });
      25 |

      at Object.toThrow (tests/unit/mad.test.js:22:31)

Test Suites: 1 failed, 1 total
Tests:       1 failed, 3 passed, 4 total
Snapshots:   0 total
Time:        0.104 s, estimated 1 s
Ran all test suites matching tests/unit/mad.
```

Otra vez la función no lanzó nada. Con dos series vacías calcula `0 / 0`:

```bash
node -e "const {mad}=require('./src/pronosticos'); console.log(mad([], []))"
```

```
NaN
```

En JavaScript dividir entre cero no es un error: da `NaN` o `Infinity`. Si la regla no se valida de forma explícita, nadie se entera.

### Verde

```javascript
function mad(real, pronostico) {
  if (real.length !== pronostico.length) {
    throw new Error('Las series deben tener el mismo número de periodos');
  }
  if (real.length === 0) {
    throw new Error('Se necesita al menos un periodo');
  }
  const errores = real.map((valorReal, i) => Math.abs(valorReal - pronostico[i]));
  return sumar(errores) / errores.length;
}
```

```
PASS tests/unit/mad.test.js
  mad
    ✓ calcula el error absoluto medio (1 ms)
    ✓ es cero cuando el pronóstico es exacto
    ✓ rechaza series de distinta longitud (1 ms)
    ✓ rechaza series vacías

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
Snapshots:   0 total
Time:        0.102 s, estimated 1 s
Ran all test suites matching tests/unit/mad.
```

### Qué se aprende

- La prueba no solo exige que haya un error: exige **el** error acordado, con su mensaje. Eso es parte del contrato de la función.
- Con este ciclo la tabla del requisito queda cubierta. Ahora se puede mejorar el diseño con la tranquilidad de que cuatro pruebas vigilan el comportamiento.

---

## Refactor final

Con todas las pruebas en verde se mejora el código **sin cambiar lo que hace**:

1. **Quitar la duplicación.** Las dos validaciones son idénticas a las que necesita `mape`, que ya las tiene en `validarSeries`. Se reutiliza esa función en lugar de mantener dos copias de la misma regla.
2. **Nombres que explican.** `errores` pasa a ser `erroresAbsolutos`: el nombre dice qué contiene.
3. **Documentación.** Un comentario JSDoc explica qué es el MAD.

Antes:

```javascript
function mad(real, pronostico) {
  if (real.length !== pronostico.length) {
    throw new Error('Las series deben tener el mismo número de periodos');
  }
  if (real.length === 0) {
    throw new Error('Se necesita al menos un periodo');
  }
  const errores = real.map((valorReal, i) => Math.abs(valorReal - pronostico[i]));
  return sumar(errores) / errores.length;
}
```

Después (es exactamente el código que hoy tiene el proyecto):

```javascript
/** Error absoluto medio (MAD): promedio de las diferencias absolutas, en unidades. */
function mad(real, pronostico) {
  validarSeries(real, pronostico);

  const erroresAbsolutos = real.map((valorReal, i) => Math.abs(valorReal - pronostico[i]));
  return sumar(erroresAbsolutos) / erroresAbsolutos.length;
}
```

Después del refactor se corren **todas** las pruebas unitarias, no solo las de `mad`, porque `validarSeries` también la usa `mape`:

```bash
npm run test:unit
```

```
> pronosticos-node@1.0.0 test:unit
> jest tests/unit

PASS tests/unit/promedioMovil.test.js
PASS tests/unit/mad.test.js

Test Suites: 2 passed, 2 total
Tests:       11 passed, 11 total
Snapshots:   0 total
Time:        0.115 s, estimated 1 s
Ran all test suites matching tests/unit.
```

Y el análisis estático, para confirmar que el refactor no introdujo problemas:

```bash
npm run lint
```

```
> pronosticos-node@1.0.0 lint
> eslint .
```

ESLint no imprime nada cuando no encuentra problemas.

### Qué se aprende

- El refactor es seguro **porque** hay pruebas. Sin ellas, cambiar las validaciones por `validarSeries` sería una apuesta.
- Refactorizar no es agregar funciones nuevas. Si durante el refactor aparece un comportamiento nuevo, se vuelve al rojo con una prueba para ese comportamiento.

---

## El historial que deja el ciclo

En la actividad se pide que el historial de commits muestre las tres fases. Para `mad`, un historial razonable sería:

| Commit | Fase | Estado de las pruebas |
|---|---|---|
| `test: prueba en rojo para mad` | Rojo del ciclo 1 | 1 falla |
| `feat: mad devuelve el resultado del ejemplo` | Verde del ciclo 1 | todas pasan |
| `test: mad es cero con un pronóstico exacto` | Rojo del ciclo 2 | 1 falla |
| `feat: mad calcula el promedio de los errores absolutos` | Verde del ciclo 2 | todas pasan |
| `test: mad rechaza series de distinta longitud` | Rojo del ciclo 3 | 1 falla |
| `feat: mad valida la longitud de las series` | Verde del ciclo 3 | todas pasan |
| `test: mad rechaza series vacías` | Rojo del ciclo 4 | 1 falla |
| `feat: mad exige al menos un periodo` | Verde del ciclo 4 | todas pasan |
| `refactor: mad reutiliza validarSeries` | Refactor | todas pasan |

No es obligatorio un commit por fase de cada ciclo; lo importante es que el historial permita ver que la prueba existió antes que el código.

## Resumen

| Fase | Qué se hace | Cómo se sabe que terminó |
|---|---|---|
| Rojo | Se escribe una prueba para un comportamiento que todavía no existe | La prueba falla, y falla por la razón esperada |
| Verde | Se escribe el código mínimo para que pase | Todas las pruebas pasan |
| Refactor | Se mejora el diseño sin cambiar el comportamiento | Todas las pruebas siguen pasando y el análisis estático no reporta nada |
