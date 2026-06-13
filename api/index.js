const { createApp } = require('../server/app');
const { getDb } = require('../server/db');

let app;

module.exports = async (req, res) => {
  if (!app) {
    await getDb();
    app = createApp();
  }
  return app(req, res);
};
