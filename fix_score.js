const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://localhost:27017/lumio');
  const Ritual = mongoose.model('Ritual', new mongoose.Schema({}, { strict: false }));
  const UserPerformance = mongoose.model('UserPerformance', new mongoose.Schema({}, { strict: false }));
  
  const ritual = await Ritual.findOne().sort({ createdAt: -1 });
  if (!ritual) process.exit(0);

  const performance = await UserPerformance.findOne({ userId: ritual.user });
  const sessionScoreImprovement = performance ? performance.overallScore : 0;

  const daysCompletedRatio = (ritual.daysCompleted / ritual.totalDays) * 100;
  const streakBonus = Math.min(ritual.streak * 5, 10);

  const newScore = Math.round(
    (sessionScoreImprovement * 0.70) +
    (daysCompletedRatio * 0.20) +
    (streakBonus * 1.0)
  );

  console.log(`Old Score: ${ritual.currentReadinessScore}, New Score: ${newScore}`);
  await Ritual.updateOne({ _id: ritual._id }, { $set: { currentReadinessScore: Math.max(ritual.currentReadinessScore || 0, Math.min(newScore, 100)) } });
  console.log('Fixed score.');
  process.exit(0);
}
run().catch(console.error);
