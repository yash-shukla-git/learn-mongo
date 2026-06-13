const { getDb } = require('../db');
const { COLLECTIONS } = require('../config/constants');
const { getAllModules } = require('../content/loader');
const { computeInterviewScore } = require('./scoreService');

async function getDashboard(session) {
  const db = await getDb();
  const sessionId = session._id;

  const progressDocs = await db.collection(COLLECTIONS.MODULE_PROGRESS)
    .find({ sessionId }).toArray();

  const progressByModule = {};
  for (const p of progressDocs) progressByModule[p.moduleId] = p;

  const allMods = getAllModules();
  const moduleAccuracies = {};
  const weakAreas = [];

  const modules = allMods.map(mod => {
    const prog = progressByModule[mod.id];
    const completion = prog ? prog.completionPercent : 0;
    const topicAcc = prog ? prog.topicAccuracy : {};
    const totalAttempts = Object.values(topicAcc).reduce((s, t) => s + t.attempts, 0);
    const totalCorrect = Object.values(topicAcc).reduce((s, t) => s + t.correct, 0);
    const accuracy = totalAttempts ? totalCorrect / totalAttempts : 0;
    moduleAccuracies[mod.id] = accuracy;

    if (prog && prog.weakAreas) {
      for (const topic of prog.weakAreas) {
        const topicData = topicAcc[topic];
        weakAreas.push({
          moduleId: mod.id,
          moduleName: mod.title,
          topic,
          accuracy: topicData ? topicData.correct / topicData.attempts : 0,
        });
      }
    }

    return {
      id: mod.id,
      title: mod.title,
      icon: mod.icon,
      description: mod.description,
      completion,
      accuracy: Math.round(accuracy * 100),
      status: prog ? prog.status : 'locked',
      weakAreas: prog ? prog.weakAreas : [],
    };
  });

  const overallCompletion = Math.round(
    modules.reduce((s, m) => s + m.completion, 0) / modules.length
  );

  const recentActivity = await db.collection(COLLECTIONS.QUESTION_ATTEMPTS)
    .find({ sessionId })
    .sort({ attemptedAt: -1 })
    .limit(5)
    .toArray();

  const interviewReadinessScore = computeInterviewScore(
    moduleAccuracies,
    session.longestStreak || 0,
    weakAreas
  );

  // Update the score on the session
  await db.collection(COLLECTIONS.SESSIONS).updateOne(
    { _id: sessionId },
    { $set: { interviewReadinessScore } }
  );

  return {
    overallCompletion,
    modules,
    weakAreas: weakAreas.slice(0, 5),
    streakCount: session.streakCount || 0,
    longestStreak: session.longestStreak || 0,
    totalQuestionsAnswered: session.totalQuestionsAnswered || 0,
    totalCorrect: session.totalCorrect || 0,
    interviewReadinessScore,
    recentActivity: recentActivity.map(a => ({
      questionId: a.questionId,
      topic: a.topic,
      moduleId: a.moduleId,
      isCorrect: a.isCorrect,
      difficulty: a.difficulty,
      attemptedAt: a.attemptedAt,
    })),
  };
}

module.exports = { getDashboard };
