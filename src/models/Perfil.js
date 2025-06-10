// src/models/Perfil.js
import mongoose from 'mongoose';

const perfilSchema = new mongoose.Schema({
  email: { type: String, required: false },
  nombre: { type: String, required: false },
  documento: { type: String, required: false },
  // …añade aquí el resto de campos del formulario
}, { timestamps: true });

export const Perfil = mongoose.model('Perfil', perfilSchema);