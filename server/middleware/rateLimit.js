const { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS } = require('../config/constants');

const store = new Map(); // token → { count, resetAt }

module.exports = function rateLimitMiddleware(req, res, next) {
  const key = req.headers['x-session-token'] || req.ip;
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({ error: 'Too many requests — slow down!' });
  }

  entry.count++;
  next();
};
