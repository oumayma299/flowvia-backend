const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    unique: true
  },
  age: {
    type: Number,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  score_global: {
    type: Number,
    default: 0
  },
  level: {
    type: String,
    enum: ['nouveau', 'faible', 'moyen', 'excellent'],
    default: 'nouveau'
  },
  lastSessionDate: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);
