require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

const sessionMiddleware = require('./middleware/session');
const errorHandler = require('./middleware/errorHandler');
const { load: loadContent } = require('./content/loader');

function createApp() {
  loadContent();

  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, '../public')));

  // Attach session to every request
  app.use(sessionMiddleware);

  // API routes
  app.use('/api/auth',       require('./routes/auth'));
  app.use('/api/modules',    require('./routes/modules'));
  app.use('/api/lessons',    require('./routes/lessons'));
  app.use('/api/quiz',       require('./routes/quiz'));
  app.use('/api/playground', require('./routes/playground'));
  app.use('/api/progress',   require('./routes/progress'));
  app.use('/api/dashboard',  require('./routes/dashboard'));

  // SPA fallback — serve index.html for any unmatched routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });

  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
