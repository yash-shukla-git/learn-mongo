require('dotenv').config();
const { createApp } = require('./app');
const { getDb } = require('./db');

const PORT = process.env.PORT || 3000;

async function start() {
  await getDb(); // warm up connection
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`MongoDB Learning Platform running at http://localhost:${PORT}`);
    console.log(`  Dashboard:   http://localhost:${PORT}/dashboard.html`);
    console.log(`  Playground:  http://localhost:${PORT}/playground.html`);
  });
}

start().catch(err => { console.error(err); process.exit(1); });
