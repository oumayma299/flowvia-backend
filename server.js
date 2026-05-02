const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
console.log("🚀 Démarrage du serveur...");

// middlewares
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(require('path').join(__dirname, 'uploads')));

// connexion DB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connecté");

    // Lancer serveur SEULEMENT après connexion DB
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log("🔥 Server running on port " + PORT);
    });
  })
  .catch(err => {
    console.log("❌ Erreur MongoDB :", err);
  });

// Import des routes
const authRoutes = require('./routes/auth.routes');
const patientRoutes = require('./routes/patient.routes');
const therapistRoutes = require('./routes/therapist.routes');

// Utilisation des routes
app.use('/api/auth', authRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/therapist', therapistRoutes);

// route test
app.get("/", (req, res) => {
  res.send("API Flowvia OK");
});