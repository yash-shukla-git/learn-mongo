async function apiFetch(path, options = {}) {
  const token = Session.getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['X-Session-Token'] = token;

  const res = await fetch(path, { ...options, headers });
  const data = await res.json().catch(() => ({ error: 'Invalid response' }));

  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

const API = {
  get: (path) => apiFetch(path),
  post: (path, body) => apiFetch(path, { method: 'POST', body: JSON.stringify(body) }),
};

window.API = API;
