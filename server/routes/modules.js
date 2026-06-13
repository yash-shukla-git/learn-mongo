const { Router } = require('express');
const { getAllModules, getModule, getQuestions } = require('../content/loader');
const { getModuleProgress } = require('../services/progressService');

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const mods = getAllModules();
    const sessionId = req.session ? req.session._id : null;

    const result = await Promise.all(mods.map(async mod => {
      const prog = sessionId ? await getModuleProgress(sessionId, mod.id) : null;
      const qs = getQuestions(mod.id);
      return {
        id: mod.id,
        title: mod.title,
        description: mod.description,
        icon: mod.icon,
        lessonCount: mod.lessons.length,
        questionCount: qs.length,
        completionPercent: prog ? prog.completionPercent : 0,
        status: prog ? prog.status : (mod.id === 1 ? 'in_progress' : 'locked'),
        weakAreas: prog ? prog.weakAreas : [],
      };
    }));

    res.json(result);
  } catch (err) { next(err); }
});

router.get('/:moduleId', async (req, res, next) => {
  try {
    const mod = getModule(req.params.moduleId);
    if (!mod) return res.status(404).json({ error: 'Module not found' });

    const sessionId = req.session ? req.session._id : null;
    const prog = sessionId ? await getModuleProgress(sessionId, mod.id) : null;
    const qs = getQuestions(mod.id);

    res.json({
      ...mod,
      questionCount: qs.length,
      completionPercent: prog ? prog.completionPercent : 0,
      status: prog ? prog.status : 'locked',
      currentDifficulty: prog ? prog.quizState.currentDifficulty : 'easy',
      weakAreas: prog ? prog.weakAreas : [],
    });
  } catch (err) { next(err); }
});

module.exports = router;
