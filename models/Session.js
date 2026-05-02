const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  videoPath: { type: String }, // Remplacera videoUrl pour accepter chemin ou URL
  description: { type: String },
  duration: { type: Number, required: true }, // in seconds or minutes
  repetitions: { type: Number, required: true }
});

const sessionSchema = new mongoose.Schema({
  therapistId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Therapist',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  exercises: [exerciseSchema]
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);
