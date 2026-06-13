const { Router } = require('express');
const { pickNextQuestion } = require('../services/adaptiveEngine');
const {
  getOrCreateModuleProgress,
  recordAttempt,
  updateModuleProgressAfterAnswer,
  updateSessionStreak,
} = require('../services/progressService');
const { getQuestion, getQuestions } = require('../content/loader');
const { getEncouragement, xpForAnswer } = require('../services/scoreService');

const router = Router();

// Require session for all quiz routes
router.use((req, res, next) => {
  if (!req.session) return res.status(401).json({ error: 'No session — create one first at POST /api/auth/session' });
  next();
});

// GET /api/quiz/next?moduleId=2
router.get('/next', async (req, res, next) => {
  try {
    const { moduleId } = req.query;
    if (!moduleId) return res.status(400).json({ error: 'moduleId required' });

    const question = await pickNextQuestion(req.session._id, Number(moduleId));
    if (!question) {
      return res.json({ done: true, message: 'All questions answered! Module complete.' });
    }

    const prog = await getOrCreateModuleProgress(req.session._id, Number(moduleId));
    const hintAvailable = prog.quizState.consecutiveWrong >= 2 && prog.quizState.lastQuestionId === question.id;

    // Strip answer from response
    const { correctAnswer, explanation, hint, easierVariantId, harderVariantId, ...safeQ } = question;
    res.json({
      question: safeQ,
      hintAvailable,
      currentDifficulty: prog.quizState.currentDifficulty,
      streakCount: req.session.streakCount || 0,
    });
  } catch (err) { next(err); }
});

// POST /api/quiz/submit
router.post('/submit', async (req, res, next) => {
  try {
    const { questionId, moduleId, userAnswer, timeTakenMs, hintUsed } = req.body;
    if (!questionId || !moduleId) return res.status(400).json({ error: 'questionId and moduleId required' });

    const question = getQuestion(Number(moduleId), questionId);
    if (!question) return res.status(404).json({ error: 'Question not found' });

    const isCorrect = checkAnswer(question, userAnswer);
    const totalQ = getQuestions(Number(moduleId)).length;

    await recordAttempt(req.session._id, moduleId, question, userAnswer, isCorrect, timeTakenMs || 0, hintUsed);
    const newQs = await updateModuleProgressAfterAnswer(req.session._id, moduleId, question, isCorrect, totalQ);
    const { streakCount } = await updateSessionStreak(req.session._id, isCorrect);

    const xp = xpForAnswer(isCorrect, question.difficulty, hintUsed);
    const encouragement = getEncouragement(streakCount, isCorrect, false, false);

    const prog = await getOrCreateModuleProgress(req.session._id, Number(moduleId));
    const hintAvailableNext = newQs.consecutiveWrong >= 2;

    res.json({
      isCorrect,
      explanation: question.explanation,
      correctAnswer: question.correctAnswer,
      sqlEquivalent: question.sqlEquivalent || null,
      hint: (!isCorrect && hintAvailableNext) ? question.hint : null,
      encouragement,
      nextDifficulty: newQs.currentDifficulty,
      streakCount,
      xpEarned: xp,
      completionPercent: prog.completionPercent,
    });
  } catch (err) { next(err); }
});

// GET /api/quiz/hint?questionId=crud-q-01&moduleId=2
router.get('/hint', (req, res) => {
  const { questionId, moduleId } = req.query;
  const question = getQuestion(Number(moduleId), questionId);
  if (!question) return res.status(404).json({ error: 'Question not found' });
  res.json({ hint: question.hint || 'No hint available for this question.' });
});

function checkAnswer(question, userAnswer) {
  if (!userAnswer) return false;
  const ua = String(userAnswer).trim().toLowerCase();
  const ca = String(question.correctAnswer).trim().toLowerCase();

  if (question.type === 'fill-in-blank') {
    // Multiple blanks separated by |
    const parts = ca.split('|');
    const userParts = ua.split('|').map(s => s.trim());
    return parts.every((part, i) => (userParts[i] || '').trim() === part.trim());
  }

  if (question.type === 'mcq' || question.type === 'sql-to-mongo') {
    return ua === ca;
  }

  if (question.type === 'fix-bug') {
    const parts = ca.split('|');
    const userParts = ua.split('|').map(s => s.trim());
    return parts.every((part, i) => (userParts[i] || '').trim() === part.trim());
  }

  if (question.type === 'live-query') {
    const expected = String(question.expectedQuery || question.correctAnswer || '').trim().toLowerCase();
    return ua === expected;
  }

  return ua === ca;
}

module.exports = router;
