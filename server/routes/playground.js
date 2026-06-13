const { Router } = require('express');
const { executeQuery, resetSandbox } = require('../services/playgroundService');
const rateLimitMiddleware = require('../middleware/rateLimit');
const { getDb } = require('../db');

const router = Router();

router.use((req, res, next) => {
  if (!req.session) return res.status(401).json({ error: 'No session' });
  next();
});

router.post('/execute', rateLimitMiddleware, async (req, res, next) => {
  try {
    const { query } = req.body;
    if (!query || !query.trim()) return res.status(400).json({ error: 'query is required' });

    const db = await getDb();
    const result = await executeQuery(req.session._id, query.trim(), db);
    res.json(result);
  } catch (err) { next(err); }
});

router.post('/reset', async (req, res, next) => {
  try {
    const db = await getDb();
    const result = await resetSandbox(req.session._id, db);
    res.json(result);
  } catch (err) { next(err); }
});

module.exports = router;
