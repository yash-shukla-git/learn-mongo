const { Router } = require('express');
const { getModule } = require('../content/loader');

const router = Router();

router.get('/:moduleId/:lessonId', (req, res) => {
  const mod = getModule(req.params.moduleId);
  if (!mod) return res.status(404).json({ error: 'Module not found' });

  const lesson = mod.lessons.find(l => l.id === Number(req.params.lessonId));
  if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

  res.json({ moduleId: mod.id, moduleTitle: mod.title, ...lesson });
});

module.exports = router;
