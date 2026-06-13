const vm = require('node:vm');
const { ObjectId } = require('mongodb');
const { getClient } = require('../db');
const { COLLECTIONS, PLAYGROUND_PREFIX, ALLOWED_PLAYGROUND_OPS, BLOCKED_PATTERNS, MAX_PLAYGROUND_RESULTS, PLAYGROUND_QUERY_TIMEOUT_MS } = require('../config/constants');

function securityCheck(query) {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(query)) {
      return `Blocked: ${pattern.toString()} is not allowed in the playground.`;
    }
  }
  return null;
}

function parsedOp(query) {
  const m = query.match(/db\s*\.\s*(\w+)\s*\.\s*(\w+)/);
  return m ? m[2] : null;
}

async function getOrCreateSandbox(sessionId, db) {
  const tokenStr = sessionId.toString().slice(0, 8);
  const sandboxDbName = `${PLAYGROUND_PREFIX}${tokenStr}`;

  const existing = await db.collection(COLLECTIONS.PLAYGROUND_SESSIONS).findOne({ sessionId });
  if (!existing) {
    await db.collection(COLLECTIONS.PLAYGROUND_SESSIONS).insertOne({
      sessionId,
      sandboxDbName,
      lastResetAt: new Date(),
      queriesExecuted: 0,
    });
    await cloneTemplate(sandboxDbName);
  }

  await db.collection(COLLECTIONS.PLAYGROUND_SESSIONS).updateOne(
    { sessionId },
    { $inc: { queriesExecuted: 1 }, $set: { lastQueryAt: new Date() } }
  );

  return sandboxDbName;
}

async function cloneTemplate(targetDbName) {
  const client = await getClient();
  const templateDb = client.db('playground_template');
  const targetDb = client.db(targetDbName);

  const collections = ['authors', 'books', 'orders'];
  for (const colName of collections) {
    const docs = await templateDb.collection(colName).find().toArray();
    if (docs.length) {
      const targetCol = targetDb.collection(colName);
      await targetCol.deleteMany({});
      await targetCol.insertMany(docs);
    }
  }
}

async function executeQuery(sessionId, rawQuery, lmsDb) {
  const blocked = securityCheck(rawQuery);
  if (blocked) return { error: blocked };

  const op = parsedOp(rawQuery);
  if (op && !ALLOWED_PLAYGROUND_OPS.has(op)) {
    return { error: `Operation '${op}' is not permitted in the playground.` };
  }

  const sandboxDbName = await getOrCreateSandbox(sessionId, lmsDb);
  const client = await getClient();
  const sandboxDb = client.db(sandboxDbName);

  // Proxy so db.books, db.authors etc. work like mongosh (returns db.collection(name))
  const dbProxy = new Proxy(sandboxDb, {
    get(target, prop) {
      if (prop in target || typeof prop === 'symbol') return target[prop];
      return target.collection(prop);
    },
  });

  const startTime = process.hrtime.bigint();
  try {
    const script = new vm.Script(`(async () => { return ${rawQuery} })()`);
    const context = vm.createContext({
      db: dbProxy,
      ObjectId,
      ISODate: (s) => new Date(s),
      NumberInt: (n) => parseInt(n),
      print: () => {},
    });

    let rawResult = await script.runInContext(context, { timeout: PLAYGROUND_QUERY_TIMEOUT_MS });

    const execTimeMs = Number(process.hrtime.bigint() - startTime) / 1_000_000;

    // Handle cursor (find returns a FindCursor)
    if (rawResult && typeof rawResult.toArray === 'function') {
      rawResult = await rawResult.limit(MAX_PLAYGROUND_RESULTS).toArray();
    }

    // Serialize to plain JSON
    const results = JSON.parse(JSON.stringify(rawResult ?? []));
    const resultArray = Array.isArray(results) ? results : [results];

    return {
      results: resultArray.slice(0, MAX_PLAYGROUND_RESULTS),
      count: resultArray.length,
      executionStats: { executionTimeMs: Math.round(execTimeMs) },
    };
  } catch (err) {
    return { error: err.message };
  }
}

async function resetSandbox(sessionId, lmsDb) {
  const ps = await lmsDb.collection(COLLECTIONS.PLAYGROUND_SESSIONS).findOne({ sessionId });
  if (!ps) return { ok: true, message: 'No sandbox found — will be created on next query.' };

  const client = await getClient();
  await client.db(ps.sandboxDbName).dropDatabase();
  await cloneTemplate(ps.sandboxDbName);

  await lmsDb.collection(COLLECTIONS.PLAYGROUND_SESSIONS).updateOne(
    { sessionId },
    { $set: { lastResetAt: new Date(), queriesExecuted: 0 } }
  );

  return { ok: true, message: 'Playground reset to clean bookstore data.' };
}

module.exports = { executeQuery, resetSandbox };
