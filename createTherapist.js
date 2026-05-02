const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Therapist = require('./models/Therapist');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const exists = await Therapist.findOne({ nom: 'Dr. Dupont' });
  if (exists) {
    console.log('Therapist already exists');
    process.exit(0);
  }
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);
  const newTherapist = new Therapist({
    nom: 'Dr. Dupont',
    password: hashedPassword
  });
  await newTherapist.save();
  console.log('Therapist created successfully');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
