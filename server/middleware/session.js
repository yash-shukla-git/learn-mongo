const { getDb } = require('../db');
const { COLLECTIONS } = require('../config/constants');

module.exports = async function sessionMiddleware(req, res, next) {
  const token = req.headers['x-session-token'];
  if (!token) return next();

  try {
    const db = await getDb();
    const session = await db.collection(COLLECTIONS.SESSIONS).findOne({ sessionToken: token });
    if (session) {
      req.session = session;
      // Update lastActiveAt async — don't block the request
      db.collection(COLLECTIONS.SESSIONS).updateOne(
        { _id: session._id },
        { $set: { lastActiveAt: new Date() } }
      ).catch(() => {});
    }
  } catch (_) { /* non-fatal */ }

  next();
};
