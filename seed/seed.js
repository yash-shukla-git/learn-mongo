require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { MongoClient } = require('mongodb');
const { authors } = require('./bookstore/authors');
const { books, bookIds } = require('./bookstore/books');
const { orders } = require('./bookstore/orders');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const LMS_DB = process.env.DB_NAME || 'lms';
const BOOKSTORE_DB = 'bookstore';

async function seed() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    console.log('Connected to MongoDB\n');

    // ─── Bookstore database ───────────────────────────────────────────────────
    const bsDb = client.db(BOOKSTORE_DB);
    await bsDb.dropDatabase();
    console.log(`Dropped database: ${BOOKSTORE_DB}`);

    await bsDb.collection('authors').insertMany(authors);
    console.log(`  Inserted ${authors.length} authors`);

    await bsDb.collection('books').insertMany(books);
    console.log(`  Inserted ${books.length} books`);

    await bsDb.collection('orders').insertMany(orders);
    console.log(`  Inserted ${orders.length} orders`);

    // Indexes for bookstore
    await bsDb.collection('books').createIndex({ authorId: 1 });
    await bsDb.collection('books').createIndex({ publishedYear: 1 });
    await bsDb.collection('books').createIndex({ genres: 1 });
    await bsDb.collection('books').createIndex({ price: 1 });
    await bsDb.collection('books').createIndex({ rating: -1 });
    await bsDb.collection('orders').createIndex({ 'customer.email': 1 });
    await bsDb.collection('orders').createIndex({ status: 1 });
    await bsDb.collection('orders').createIndex({ orderedAt: -1 });
    console.log('  Created bookstore indexes');

    // ─── LMS database ─────────────────────────────────────────────────────────
    const lmsDb = client.db(LMS_DB);
    await lmsDb.dropDatabase();
    console.log(`\nDropped database: ${LMS_DB}`);

    // Create collections with indexes
    const sessions = lmsDb.collection('sessions');
    await sessions.createIndex({ sessionToken: 1 }, { unique: true });

    const moduleProgress = lmsDb.collection('module_progress');
    await moduleProgress.createIndex({ sessionId: 1, moduleId: 1 }, { unique: true });

    const questionAttempts = lmsDb.collection('question_attempts');
    await questionAttempts.createIndex({ sessionId: 1, moduleId: 1, topic: 1 });
    await questionAttempts.createIndex({ sessionId: 1, attemptedAt: -1 });

    const playgroundSessions = lmsDb.collection('playground_sessions');
    await playgroundSessions.createIndex({ sessionId: 1 }, { unique: true });

    console.log('  Created LMS collections and indexes');

    // ─── Playground template DB ───────────────────────────────────────────────
    const playgroundTemplate = client.db('playground_template');
    await playgroundTemplate.dropDatabase();
    await playgroundTemplate.collection('authors').insertMany(authors);
    await playgroundTemplate.collection('books').insertMany(books);
    await playgroundTemplate.collection('orders').insertMany(orders);
    console.log('\n  Created playground_template database (used to reset user sandboxes)');

    console.log('\nSeed complete!');
    console.log(`  Bookstore: ${authors.length} authors, ${books.length} books, ${orders.length} orders`);
    console.log(`  LMS: collections + indexes ready`);
    console.log(`  Playground template: ready`);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

seed();
