const mongoose = require('mongoose');

const patientSessionSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed'],
    default: 'in_progress'
  },
  score: {
    type: Number,
    default: 0
  },
  exercisesProgress: [{
    exerciseId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    validationStatus: {
      type: String,
      enum: ['fait', 'non fait', 'pending'],
      default: 'pending'
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('PatientSession', patientSessionSchema);
