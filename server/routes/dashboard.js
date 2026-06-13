const { Router } = require('express');
const { getDashboard } = require('../services/dashboardService');

const router = Router();

router.use((req, res, next) => {
  if (!req.session) return res.status(401).json({ error: 'No session' });
  next();
});

router.get('/', async (req, res, next) => {
  try {
    const data = await getDashboard(req.session);
    res.json(data);
  } catch (err) { next(err); }
});

module.exports = router;
