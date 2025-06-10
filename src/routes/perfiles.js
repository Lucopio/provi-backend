// ────────────────────────────────────────────────────────────────────────────────
//  RUTA /api/perfiles
//  1. Lee variables de entorno (.env)
//  2. Valida la carga de la API-Key
//  3. Genera el texto del perfil con GPT-4o
//  4. Guarda (opcional) en MongoDB y devuelve el HTML
// ────────────────────────────────────────────────────────────────────────────────

/* eslint-disable import/first */
import dotenv from 'dotenv';
dotenv.config();                       // ①  ¡cargar .env antes de nada!

import { Router } from 'express';
import OpenAI     from 'openai';
import { Perfil } from '../models/Perfil.js';   // <-- asegúrate de que el modelo existe

// ②  Cliente OpenAI
if (!process.env.OPENAI_API_KEY) {
  throw new Error('❌ Falta OPENAI_API_KEY en el .env');
}
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

// ③  Configuración de la ruta
const router = Router();

// ────────────────────────────────────────────────────────────────────────────────
//  POST /api/perfiles
// ────────────────────────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    // 1) Obtener respuestas del body
    const respuestas = req.body;

    // 2) Extraer sólo los valores (menos tokens)
    const values = Object.values(respuestas);

    // 3) Prompt base
    const prompt = `
Te voy a dar las respuestas de un formulario de perfil inversionista.
Con base en esa información, quiero que construyas un arquetipo personalizado,
en segunda persona, con un tono cercano, interesante y profesional.

Requisitos:
• Escribe el perfil del cliente como un informe profesional, en tono humano, claro y extenso, cubriendo todos los aspectos relevantes: contexto personal, motivaciones, experiencia, situación financiera, expectativas y recomendaciones personalizadas, tal como lo haría un asesor en un informe escrito.
• Al inicio, incluye la línea: 'Tu perfil como inversionista: [nombre del arquetipo o tipo de perfil]' y a continuación una breve descripción de ese arquetipo.
• El resto del perfil debe estar dividido en varios párrafos bien estructurados, para facilitar la lectura y comprensión.
• No uses listas, tablas, emojis, títulos, subtítulos, ni ningún tipo de formato especial aparte de los párrafos separados.
• No incluyas encabezados, pies de página ni advertencias, solo el texto del perfil.
• **Divide el texto en varios párrafos separados por un salto de línea doble. Cada párrafo debe desarrollar una idea distinta.**




  Respuestas del cliente (JSON):
  ${JSON.stringify(values)}
  `;

      // 4) Llamar al modelo
      const start = Date.now();
      const completion = await openai.chat.completions.create({
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: 'Eres un asesor experto en inversiones inmobiliarias.' },
          { role: 'user',   content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 800
      });
      console.log(`✅ OpenAI respondió en ${Date.now() - start} ms`);

      // 5) El modelo devuelve el HTML como texto
      const html = completion.choices[0]?.message?.content?.trim() || '<p>Error generando perfil</p>';

      // 6) Guardar en MongoDB (ignora errores de validación si algún campo falta)
      try {
        await Perfil.create({ ...respuestas, html, modelo: OPENAI_MODEL });
      } catch (mongoErr) {
        console.warn('⚠️  No se pudo guardar en MongoDB:', mongoErr.message);
      }

      // 7) Enviar sólo el HTML
      res.json({ perfil: html });
    } catch (err) {
      console.error('🔥 ERROR en /api/perfiles:', err);
      res.status(500).json({ error: 'No se pudo generar el perfil' });
    }
  });

export default router;
