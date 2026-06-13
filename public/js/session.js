const SESSION_KEY = 'mongo_lms_token';
const NAME_KEY = 'mongo_lms_name';

let _token = null;

async function ensureSession() {
  _token = localStorage.getItem(SESSION_KEY);
  if (_token) {
    // Verify it's still valid
    try {
      const res = await fetch('/api/auth/session', { headers: { 'X-Session-Token': _token } });
      if (res.ok) return _token;
    } catch (_) {}
  }
  // Create new session
  const name = localStorage.getItem(NAME_KEY) || 'Learner';
  const res = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ displayName: name }),
  });
  const data = await res.json();
  _token = data.sessionToken;
  localStorage.setItem(SESSION_KEY, _token);
  return _token;
}

function getToken() { return _token || localStorage.getItem(SESSION_KEY); }
function setName(name) { localStorage.setItem(NAME_KEY, name); }
function getName() { return localStorage.getItem(NAME_KEY) || 'Learner'; }
function clearSession() { localStorage.removeItem(SESSION_KEY); _token = null; }

window.Session = { ensureSession, getToken, setName, getName, clearSession };
