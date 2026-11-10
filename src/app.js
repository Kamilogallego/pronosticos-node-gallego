/**
 * Aplicación HTTP con Express.
 *
 * Se separa de server.js para poder crear la aplicación sin abrir un puerto.
 * Así, más adelante, las pruebas de integración pueden usarla directamente.
 */
const express = require('express');
const { mad } = require('./pronosticos');

const app = express();
app.use(express.json());

// Verificación de vida del servicio: responde si la aplicación está arriba.
app.get('/api/salud', (req, res) => {
  res.json({ estado: 'ok' });
});

// Calcula el MAD de dos series enviadas en el cuerpo de la petición.
app.post('/api/pronosticos/mad', (req, res) => {
  const { real, pronostico } = req.body ?? {};
  if (!Array.isArray(real) || !Array.isArray(pronostico)) {
    return res.status(400).json({ error: 'Se esperan los arreglos "real" y "pronostico"' });
  }

  try {
    return res.json({ mad: mad(real, pronostico) });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

module.exports = app;
