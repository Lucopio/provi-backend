import dotenv from 'dotenv';
dotenv.config();  

// DEBUG: comprueba que las variables de entorno estén cargadas
console.log('▶ OPENAI_API_KEY cargada:', Boolean(process.env.OPENAI_API_KEY));
console.log('▶ OPENAI_MODEL:', process.env.OPENAI_MODEL);

import express from 'express';
import mongoose from 'mongoose';
import perfilesRouter from './routes/perfiles.js';

const app = express();
app.use(express.json());

// Conecta MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch(err => {
    console.error('❌ Error Mongo:', err.message);
    process.exit(1);
  });

// Monta el router
app.use('/api/perfiles', perfilesRouter);

// Sirve archivos estáticos
app.use(express.static('public'));

// Arranca servidor
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`🚀 Servidor en http://localhost:${port}`);
});