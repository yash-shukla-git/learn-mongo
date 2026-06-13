require('dotenv').config();
const { MongoClient } = require('mongodb');

let client = null;
let db = null;

async function connect() {
  if (client) return;
  client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
  await client.connect();
  db = client.db(process.env.DB_NAME || 'lms');
  console.log(`Connected to MongoDB: ${process.env.MONGODB_URI || 'mongodb://localhost:27017'}`);
}

async function getDb() {
  if (!db) await connect();
  return db;
}

async function getClient() {
  if (!client) await connect();
  return client;
}

async function close() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

module.exports = { getDb, getClient, close };
