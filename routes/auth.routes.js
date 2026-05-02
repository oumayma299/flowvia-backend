const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Patient = require('../models/Patient');
const Therapist = require('../models/Therapist');

// POST /api/auth/register (Patient seul)
router.post('/register', async (req, res) => {
  try {
    const { nom, age, password, confirmPassword } = req.body;
    const cleanNom = String(nom ?? '').trim();
    const numericAge = Number(age);

    if (!cleanNom) {
      return res.status(400).json({ message: 'Le nom est obligatoire.' });
    }
    if (!Number.isFinite(numericAge) || numericAge < 1 || numericAge > 120) {
      return res.status(400).json({ message: "L'âge doit être un nombre entre 1 et 120." });
    }
    if (!password || password.length < 4) {
      return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 4 caractères.' });
    }
    
    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Les mots de passe ne correspondent pas' });
    }

    let patient = await Patient.findOne({ nom: cleanNom });
    if (patient) return res.status(400).json({ message: 'Ce nom ou identifiant est déjà pris' });

    const therapistWithSameName = await Therapist.findOne({ nom: cleanNom });
    if (therapistWithSameName) {
      return res.status(400).json({ message: 'Ce nom est déjà utilisé par un thérapeute. Choisissez un autre identifiant.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    patient = new Patient({
      nom: cleanNom,
      age: numericAge,
      password: hashedPassword
    });

    await patient.save();

    const payload = { userId: patient._id, role: 'patient' };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });

    res.status(201).json({ user: { id: patient._id, nom: patient.nom, role: 'patient' }, token });
  } catch (err) {
    const errorText = `${err?.message || ''}`.toLowerCase();
    if (errorText.includes('space quota')) {
      return res.status(507).json({
        message: 'Base de donnees saturee. Supprimez des videos/sessions puis reessayez.'
      });
    }
    if (err && err.code === 11000) {
      return res.status(400).json({ message: 'Ce nom ou identifiant est déjà pris' });
    }
    if (err.name === 'ValidationError') {
       return res.status(400).json({ message: 'Veuillez remplir correctement tous les champs requis (nom, âge, password).' });
    }
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    // Dans le UI on demandera Nom et Password.
    const { nom, password } = req.body;
    const cleanNom = String(nom ?? '').trim();

    if (!cleanNom || !password) {
      return res.status(400).json({ message: 'Veuillez renseigner le nom et le mot de passe.' });
    }

    // Check Thérapeutes en priorité
    let user = await Therapist.findOne({ nom: cleanNom });
    let role = 'therapist';

    // Sinon check Patients
    if (!user) {
      user = await Patient.findOne({ nom: cleanNom });
      role = 'patient';
    }

    if (!user) return res.status(400).json({ message: 'Identifiants invalides' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Mot de passe incorrect' });

    const payload = { userId: user._id, role };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });

    res.json({ user: { id: user._id, nom: user.nom, role }, token });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur', error: err.message });
  }
});

module.exports = router;
