const { getQuestions } = require('../content/loader');
const { getOrCreateModuleProgress, getCorrectQuestionIds } = require('./progressService');
const { DIFFICULTY_ORDER } = require('../config/constants');

async function pickNextQuestion(sessionId, moduleId) {
  const prog = await getOrCreateModuleProgress(sessionId, Number(moduleId));
  const qs = prog.quizState;
  const correctIds = new Set(await getCorrectQuestionIds(sessionId, moduleId));

  let difficulty = qs.currentDifficulty || 'easy';
  let pool = buildPool(moduleId, difficulty, correctIds, qs.lastQuestionId, prog);

  // Bump difficulty if current pool is exhausted
  while (!pool.length) {
    const idx = DIFFICULTY_ORDER.indexOf(difficulty);
    if (idx >= DIFFICULTY_ORDER.length - 1) break;
    difficulty = DIFFICULTY_ORDER[idx + 1];
    pool = buildPool(moduleId, difficulty, correctIds, qs.lastQuestionId, prog);
  }

  // If still empty, fall back to any remaining unanswered question across all difficulties
  if (!pool.length) {
    pool = getQuestions(moduleId).filter(q => !correctIds.has(q.id) && q.id !== qs.lastQuestionId);
    if (!pool.length) return null; // truly module complete
  }

  return weightedRandomPick(pool, prog);
}

function buildPool(moduleId, difficulty, correctIds, lastId, prog) {
  return getQuestions(moduleId).filter(q =>
    q.difficulty === difficulty &&
    q.id !== lastId &&
    !correctIds.has(q.id)
  );
}

function weightedRandomPick(pool, prog) {
  const weakSet = new Set(prog.weakAreas || []);
  const topicAttempts = prog.topicAccuracy || {};

  const weighted = pool.map(q => {
    let weight = 1;
    if (weakSet.has(q.topic)) weight += 3;
    if (!topicAttempts[q.topic]) weight += 2;
    return { q, weight };
  });

  const total = weighted.reduce((s, w) => s + w.weight, 0);
  let rand = Math.random() * total;
  for (const { q, weight } of weighted) {
    rand -= weight;
    if (rand <= 0) return q;
  }
  return weighted[weighted.length - 1].q;
}

module.exports = { pickNextQuestion };
