/**
 * Punto de entrada: levanta la aplicación en el puerto indicado.
 * Se ejecuta con `npm start`.
 */
const app = require('./app');

const PUERTO = process.env.PORT ?? 3000;

app.listen(PUERTO, () => {
  console.log(`API de pronósticos escuchando en http://localhost:${PUERTO}`);
});
