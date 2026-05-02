const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const Patient = require('../models/Patient');
const Session = require('../models/Session');
const PatientSession = require('../models/PatientSession');

router.use(auth(['patient']));

// GET /api/patient/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.userId);
    const pSessions = await PatientSession.find({ patientId: req.user.userId });
    
    // Le total global (pour donner une idée)
    const totalGlobal = await Session.countDocuments();
    const completedSessions = pSessions.filter(s => s.status === 'completed').length;

    res.json({
      score_global: patient.score_global,
      level: patient.level,
      lastSessionDate: patient.lastSessionDate,
      totalSessions: totalGlobal,
      completedSessions,
      message: "Vos statistiques sont à jour !"
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// GET toutes les séances disponibles
router.get('/sessions', async (req, res) => {
  try {
    const allSessions = await Session.find().populate('therapistId', 'nom');
    const pSessions = await PatientSession.find({ patientId: req.user.userId });
    
    const mapped = allSessions.map(s => {
      const ps = pSessions.find(p => p.sessionId.toString() === s._id.toString());
      return {
        ...s.toObject(),
        status: ps ? ps.status : 'pending',
        patientSessionId: ps ? ps._id : null
      };
    });
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// GET le détail d'une séance (crée l'instance PatientSession si 1ère fois)
router.get('/sessions/:id', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ message: 'Séance non trouvée' });
    
    let ps = await PatientSession.findOne({ sessionId: req.params.id, patientId: req.user.userId });
    if (!ps) {
      ps = new PatientSession({
        patientId: req.user.userId,
        sessionId: req.params.id,
        status: 'in_progress',
        exercisesProgress: session.exercises.map(ex => ({ exerciseId: ex._id, validationStatus: 'pending' }))
      });
      await ps.save();
    }
    
    // On merge les données de base de la séance avec l'état de progression
    const mergedObj = session.toObject();
    mergedObj.status = ps.status;
    mergedObj.patientSessionId = ps._id;
    mergedObj.exercises = mergedObj.exercises.map(ex => {
      const prog = ps.exercisesProgress.find(p => p.exerciseId.toString() === ex._id.toString());
      return { ...ex, validationStatus: prog ? prog.validationStatus : 'pending' };
    });
    
    res.json(mergedObj);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// PUT valider l'exercice
router.put('/sessions/:id/exercise/:exId', async (req, res) => {
  try {
    const { status } = req.body;
    const ps = await PatientSession.findOne({ sessionId: req.params.id, patientId: req.user.userId });
    if(!ps) return res.status(404).json({message: "PatientSession non trouvée"});
    
    const prog = ps.exercisesProgress.find(p => p.exerciseId.toString() === req.params.exId);
    if(prog) prog.validationStatus = status;
    ps.status = 'in_progress';
    await ps.save();
    
    // On renvoie la session mise à jour
    const session = await Session.findById(req.params.id);
    const mergedObj = session.toObject();
    mergedObj.status = ps.status;
    mergedObj.patientSessionId = ps._id;
    mergedObj.exercises = mergedObj.exercises.map(ex => {
      const p = ps.exercisesProgress.find(pr => pr.exerciseId.toString() === ex._id.toString());
      return { ...ex, validationStatus: p ? p.validationStatus : 'pending' };
    });
    res.json(mergedObj);
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// PUT terminer la séance
router.put('/sessions/:id/complete', async (req, res) => {
  try {
    const ps = await PatientSession.findOne({ sessionId: req.params.id, patientId: req.user.userId });
    if(!ps) return res.status(404).json({ message: 'Séance non trouvée' });

    if (ps.status === 'completed') {
       return res.status(400).json({ message: 'Déjà terminée' });
    }

    // Calcul score de la séance: faits/total * 100
    const totalEx = ps.exercisesProgress.length;
    const faits = ps.exercisesProgress.filter(e => e.validationStatus === 'fait').length;
    let newScore = 0;
    if (totalEx > 0) {
      newScore = Math.round((faits / totalEx) * 100);
    }
    
    ps.score = newScore;
    ps.status = 'completed';
    await ps.save();

    // Recalcul du score_global du patient
    const allCompleted = await PatientSession.find({ patientId: req.user.userId, status: 'completed' });
    let globalSum = 0;
    allCompleted.forEach(s => globalSum += (s.score || 0));
    
    const globalScore = allCompleted.length > 0 ? Math.round(globalSum / allCompleted.length) : 0;
    
    // Définition du niveau
    let newLevel = 'faible';
    if (globalScore > 40 && globalScore <= 70) newLevel = 'moyen';
    if (globalScore > 70) newLevel = 'excellent';

    const patient = await Patient.findById(req.user.userId);
    patient.score_global = globalScore;
    patient.level = newLevel;
    patient.lastSessionDate = new Date();
    await patient.save();

    res.json({ message: 'Séance terminée avec succès', newScore: globalScore, newLevel });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

module.exports = router;
