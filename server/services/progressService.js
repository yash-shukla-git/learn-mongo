const { getDb } = require('../db');
const { COLLECTIONS, DIFFICULTY_ORDER } = require('../config/constants');

async function getOrCreateSession(sessionToken, displayName) {
  const db = await getDb();
  const col = db.collection(COLLECTIONS.SESSIONS);
  let session = await col.findOne({ sessionToken });
  if (!session) {
    const now = new Date();
    const result = await col.insertOne({
      sessionToken,
      displayName: displayName || 'Learner',
      createdAt: now,
      lastActiveAt: now,
      currentModule: 1,
      currentLesson: 1,
      streakCount: 0,
      longestStreak: 0,
      totalQuestionsAnswered: 0,
      totalCorrect: 0,
      interviewReadinessScore: 0,
    });
    session = await col.findOne({ _id: result.insertedId });
  }
  return session;
}

async function getModuleProgress(sessionId, moduleId) {
  const db = await getDb();
  return db.collection(COLLECTIONS.MODULE_PROGRESS).findOne({
    sessionId,
    moduleId: Number(moduleId),
  });
}

async function getOrCreateModuleProgress(sessionId, moduleId) {
  const db = await getDb();
  const col = db.collection(COLLECTIONS.MODULE_PROGRESS);
  let prog = await col.findOne({ sessionId, moduleId: Number(moduleId) });
  if (!prog) {
    await col.insertOne({
      sessionId,
      moduleId: Number(moduleId),
      status: 'in_progress',
      completionPercent: 0,
      lessonsCompleted: [],
      lastAccessedAt: new Date(),
      topicAccuracy: {},
      weakAreas: [],
      quizState: {
        consecutiveCorrect: 0,
        consecutiveWrong: 0,
        currentDifficulty: 'easy',
        hintsUsedThisSession: 0,
        lastQuestionId: null,
      },
    });
    prog = await col.findOne({ sessionId, moduleId: Number(moduleId) });
  }
  return prog;
}

async function recordAttempt(sessionId, moduleId, question, userAnswer, isCorrect, timeTakenMs, hintUsed) {
  const db = await getDb();
  await db.collection(COLLECTIONS.QUESTION_ATTEMPTS).insertOne({
    sessionId,
    moduleId: Number(moduleId),
    questionId: question.id,
    topic: question.topic,
    difficulty: question.difficulty,
    exerciseType: question.type,
    userAnswer,
    isCorrect,
    timeTakenMs,
    hintUsed: !!hintUsed,
    attemptedAt: new Date(),
  });
}

async function updateModuleProgressAfterAnswer(sessionId, moduleId, question, isCorrect, totalQuestionsInModule) {
  const db = await getDb();
  const col = db.collection(COLLECTIONS.MODULE_PROGRESS);
  const prog = await getOrCreateModuleProgress(sessionId, Number(moduleId));

  // Update topicAccuracy
  const topicKey = `topicAccuracy.${question.topic}`;
  const topicData = prog.topicAccuracy[question.topic] || { attempts: 0, correct: 0 };
  topicData.attempts += 1;
  if (isCorrect) topicData.correct += 1;

  // Recompute weakAreas
  const newTopicAccuracy = { ...prog.topicAccuracy, [question.topic]: topicData };
  const weakAreas = Object.entries(newTopicAccuracy)
    .filter(([, d]) => d.attempts >= 3 && d.correct / d.attempts < 0.5)
    .map(([topic]) => topic);

  // Update quizState
  const qs = { ...prog.quizState };
  if (isCorrect) {
    qs.consecutiveCorrect = (qs.consecutiveCorrect || 0) + 1;
    qs.consecutiveWrong = 0;
    if (qs.consecutiveCorrect >= 2) {
      const idx = DIFFICULTY_ORDER.indexOf(qs.currentDifficulty);
      if (idx < DIFFICULTY_ORDER.length - 1) {
        qs.currentDifficulty = DIFFICULTY_ORDER[idx + 1];
        qs.consecutiveCorrect = 0;
      }
    }
  } else {
    qs.consecutiveWrong = (qs.consecutiveWrong || 0) + 1;
    qs.consecutiveCorrect = 0;
    const idx = DIFFICULTY_ORDER.indexOf(qs.currentDifficulty);
    if (idx > 0) qs.currentDifficulty = DIFFICULTY_ORDER[idx - 1];
  }
  qs.lastQuestionId = question.id;

  // Count unique correct answers for completion %
  const correctAttempts = await db.collection(COLLECTIONS.QUESTION_ATTEMPTS)
    .distinct('questionId', { sessionId, moduleId: Number(moduleId), isCorrect: true });
  const completionPercent = totalQuestionsInModule
    ? Math.min(100, Math.round((correctAttempts.length / totalQuestionsInModule) * 100))
    : 0;

  await col.updateOne(
    { sessionId, moduleId: Number(moduleId) },
    {
      $set: {
        [`topicAccuracy.${question.topic}`]: topicData,
        weakAreas,
        quizState: qs,
        completionPercent,
        lastAccessedAt: new Date(),
        status: completionPercent >= 100 ? 'completed' : 'in_progress',
      },
    }
  );

  return qs;
}

async function updateSessionStreak(sessionId, isCorrect) {
  const db = await getDb();
  const session = await db.collection(COLLECTIONS.SESSIONS).findOne({ _id: sessionId });
  if (!session) return { streakCount: 0 };

  const newStreak = isCorrect ? (session.streakCount || 0) + 1 : 0;
  const longestStreak = Math.max(session.longestStreak || 0, newStreak);

  await db.collection(COLLECTIONS.SESSIONS).updateOne(
    { _id: sessionId },
    {
      $set: { streakCount: newStreak, longestStreak },
      $inc: {
        totalQuestionsAnswered: 1,
        ...(isCorrect ? { totalCorrect: 1 } : {}),
      },
    }
  );

  return { streakCount: newStreak, longestStreak };
}

async function getCorrectQuestionIds(sessionId, moduleId) {
  const db = await getDb();
  return db.collection(COLLECTIONS.QUESTION_ATTEMPTS)
    .distinct('questionId', { sessionId, moduleId: Number(moduleId), isCorrect: true });
}

module.exports = {
  getOrCreateSession,
  getModuleProgress,
  getOrCreateModuleProgress,
  recordAttempt,
  updateModuleProgressAfterAnswer,
  updateSessionStreak,
  getCorrectQuestionIds,
};
