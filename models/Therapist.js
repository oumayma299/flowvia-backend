const mongoose = require('mongoose');

const therapistSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Therapist', therapistSchema);
