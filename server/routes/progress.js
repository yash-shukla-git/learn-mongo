const { Router } = require('express');
const { getOrCreateModuleProgress } = require('../services/progressService');

const router = Router();

router.use((req, res, next) => {
  if (!req.session) return res.status(401).json({ error: 'No session' });
  next();
});

router.get('/:moduleId', async (req, res, next) => {
  try {
    const prog = await getOrCreateModuleProgress(req.session._id, req.params.moduleId);
    res.json(prog);
  } catch (err) { next(err); }
});

module.exports = router;
