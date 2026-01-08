// src/index.js
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import perfilesRouter from './routes/perfiles.js';

const app = express();

/* ──────────────────────────────────────────────────────────
   CORS con allow-list desde ENV
   En Render define CORS_ORIGINS (coma-separado), p.ej:
   https://provi-sigma.vercel.app,https://pbeta-flame.vercel.app,http://localhost:5500
────────────────────────────────────────────────────────── */
function parseOrigins(listStr = '') {
  return listStr.split(',').map(s => s.trim()).filter(Boolean);
}
const ALLOW_ORIGINS = parseOrigins(process.env.CORS_ORIGINS || '');

// “Vary: Origin” para caches
app.use((req, res, next) => { res.setHeader('Vary', 'Origin'); next(); });

const corsOptions = {
  origin(origin, cb) {
    // Permite herramientas sin Origin (curl, healthchecks)
    if (!origin) return cb(null, true);
    if (ALLOW_ORIGINS.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS no permitido para: ${origin}`), false);
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Preflight

/* ──────────────────────────────────────────────────────────
   Body parser
────────────────────────────────────────────────────────── */
app.use(express.json({ limit: '2mb' }));

/* ──────────────────────────────────────────────────────────
   MongoDB
────────────────────────────────────────────────────────── */
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch(err => {
    console.error('❌ Error Mongo:', err.message);
    process.exit(1);
  });

/* ──────────────────────────────────────────────────────────
   Rutas utilitarias
────────────────────────────────────────────────────────── */
// Raíz informativa (evita “Cannot GET /”)
app.get('/', (req, res) => {
  res.type('text').send('Provi backend OK. Revisa /api/health');
});

// Healthcheck para validar CORS/ENV
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    allow: ALLOW_ORIGINS,
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'not-ready',
  });
});

/* ──────────────────────────────────────────────────────────
   API real
────────────────────────────────────────────────────────── */
app.use('/api/perfiles', perfilesRouter);

/* (opcional) estáticos si usas /public */
// app.use(express.static('public'));

/* 404 JSON */
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

/* ──────────────────────────────────────────────────────────
   Arranque
────────────────────────────────────────────────────────── */
const PORT = process.env.PORT || 10000; // Render inyecta PORT
app.listen(PORT, () => {
  console.log(`🚀 Servidor en http://localhost:${PORT}`);
});
