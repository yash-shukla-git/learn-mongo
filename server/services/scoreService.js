const { MODULE_WEIGHTS } = require('../config/constants');

function getEncouragement(streakCount, wasCorrect, prevWasWrong, moduleComplete) {
  if (moduleComplete) return null; // handled separately in route
  if (!wasCorrect && prevWasWrong) return null;
  if (!wasCorrect) return "Not quite — review the explanation and try again!";
  if (prevWasWrong) return "Bounce back! That's the spirit.";
  if (streakCount >= 10) return "Unstoppable! MongoDB master incoming 🔥";
  if (streakCount >= 5) return "You're on fire! Keep going!";
  if (streakCount >= 3) return "Nice streak! Keep it up.";
  return "Good job! Keep going.";
}

function computeInterviewScore(moduleAccuracies, longestStreak, weakAreas) {
  let base = 0;
  for (const [id, weight] of Object.entries(MODULE_WEIGHTS)) {
    const accuracy = moduleAccuracies[id] || 0;
    base += accuracy * weight;
  }

  let bonus = 0;
  if ((moduleAccuracies[8] || 0) >= 0.8) bonus += 10;
  if (longestStreak >= 10) bonus += 5;
  bonus -= (weakAreas || []).filter(a => a.accuracy < 0.3).length * 5;

  return Math.min(100, Math.max(0, Math.round(base * 100 + bonus)));
}

function xpForAnswer(isCorrect, difficulty, hintUsed) {
  if (!isCorrect) return 0;
  const base = { easy: 10, medium: 20, hard: 35 }[difficulty] || 10;
  return hintUsed ? Math.floor(base * 0.5) : base;
}

module.exports = { getEncouragement, computeInterviewScore, xpForAnswer };
