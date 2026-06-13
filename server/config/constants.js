module.exports = {
  DB_NAME: process.env.DB_NAME || 'lms',
  COLLECTIONS: {
    SESSIONS: 'sessions',
    MODULE_PROGRESS: 'module_progress',
    QUESTION_ATTEMPTS: 'question_attempts',
    PLAYGROUND_SESSIONS: 'playground_sessions',
  },
  BOOKSTORE_DB: 'bookstore',
  PLAYGROUND_PREFIX: process.env.PLAYGROUND_PREFIX || 'playground_',

  DIFFICULTY: { EASY: 'easy', MEDIUM: 'medium', HARD: 'hard' },
  DIFFICULTY_ORDER: ['easy', 'medium', 'hard'],

  EXERCISE_TYPES: {
    MCQ: 'mcq',
    FILL_IN_BLANK: 'fill-in-blank',
    LIVE_QUERY: 'live-query',
    FIX_BUG: 'fix-bug',
    SQL_TO_MONGO: 'sql-to-mongo',
  },

  MODULE_WEIGHTS: {
    1: 0.05,  // Setup
    2: 0.20,  // CRUD
    3: 0.20,  // Querying
    4: 0.15,  // Indexes
    5: 0.20,  // Aggregation
    6: 0.10,  // Data Modeling
    7: 0.10,  // Mongoose
  },

  CONSECUTIVE_CORRECT_TO_PROMOTE: 2,
  WRONG_FOR_HINT: 2,
  MAX_PLAYGROUND_RESULTS: 20,
  PLAYGROUND_QUERY_TIMEOUT_MS: 3000,
  RATE_LIMIT_WINDOW_MS: 60_000,
  RATE_LIMIT_MAX_REQUESTS: 30,

  ALLOWED_PLAYGROUND_OPS: new Set([
    'find', 'findOne', 'aggregate', 'countDocuments', 'distinct',
    'insertOne', 'insertMany', 'updateOne', 'updateMany', 'replaceOne',
    'deleteOne', 'deleteMany', 'createIndex', 'getIndexes', 'explain',
    'drop',
  ]),

  BLOCKED_PATTERNS: [
    /dropDatabase/i,
    /\$where/i,
    /eval\s*\(/i,
    /runCommand/i,
    /system\./i,
    /admin\./i,
  ],
};
