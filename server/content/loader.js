const fs = require('fs');
const path = require('path');

const modulesDir = path.join(__dirname, 'modules');
const questionsDir = path.join(__dirname, 'questions');

const modules = new Map();   // moduleId (int) → module object
const questions = new Map(); // moduleId (int) → question[]

function load() {
  const moduleFiles = fs.readdirSync(modulesDir).filter(f => f.endsWith('.json')).sort();
  for (const file of moduleFiles) {
    const mod = JSON.parse(fs.readFileSync(path.join(modulesDir, file), 'utf8'));
    modules.set(mod.id, mod);
  }

  const questionFiles = fs.readdirSync(questionsDir).filter(f => f.endsWith('.json')).sort();
  for (const file of questionFiles) {
    const qs = JSON.parse(fs.readFileSync(path.join(questionsDir, file), 'utf8'));
    if (!qs.length) continue;
    const moduleId = qs[0].moduleId;
    questions.set(moduleId, qs);
  }

  console.log(`Content loaded: ${modules.size} modules, ${[...questions.values()].reduce((s, q) => s + q.length, 0)} questions total`);
  for (const [id, qs] of questions) {
    const easy = qs.filter(q => q.difficulty === 'easy').length;
    const medium = qs.filter(q => q.difficulty === 'medium').length;
    const hard = qs.filter(q => q.difficulty === 'hard').length;
    console.log(`  Module ${id}: ${qs.length} questions (${easy}e / ${medium}m / ${hard}h)`);
  }
}

function getModule(id) { return modules.get(Number(id)) || null; }
function getAllModules() { return [...modules.values()]; }
function getQuestions(moduleId) { return questions.get(Number(moduleId)) || []; }
function getQuestion(moduleId, questionId) {
  const qs = getQuestions(moduleId);
  return qs.find(q => q.id === questionId) || null;
}

module.exports = { load, getModule, getAllModules, getQuestions, getQuestion };
