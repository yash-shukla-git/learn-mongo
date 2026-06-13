const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const { getOrCreateSession } = require('../services/progressService');

const router = Router();

router.post('/session', async (req, res, next) => {
  try {
    const sessionToken = uuidv4();
    const session = await getOrCreateSession(sessionToken, req.body.displayName);
    res.json({ sessionId: session._id, sessionToken: session.sessionToken, displayName: session.displayName });
  } catch (err) { next(err); }
});

router.get('/session', async (req, res, next) => {
  try {
    if (!req.session) return res.status(404).json({ error: 'Session not found' });
    res.json(req.session);
  } catch (err) { next(err); }
});

module.exports = router;
