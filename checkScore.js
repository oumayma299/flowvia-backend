const mongoose = require('mongoose');
const User = require('./models/User');
const Session = require('./models/Session');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const alice = await User.findOne({ email: 'alice@test.com' });
  if (alice) {
    console.log('Alice Score:', alice.score_global);
    console.log('Alice Level:', alice.level);
    const sessions = await Session.find({ patientId: alice._id });
    console.log('Sessions count:', sessions.length);
    if(sessions.length > 0) {
      console.log('Session status:', sessions[0].status);
    }
  } else {
    console.log('Alice not found');
  }
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
