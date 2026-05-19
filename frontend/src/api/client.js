const BASE = '';  // vite proxy → localhost:8080

function getToken() {
  return localStorage.getItem('accessToken');
}

async function request(method, path, body, params) {
  const url = new URL(BASE + path, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, v);
    });
  }

  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { message: text }; }

  if (!res.ok) {
    const msg = data?.message || data?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data?.data ?? data;
}

// ── Auth ──────────────────────────────────────
export const auth = {
  login:   (email, password)    => request('POST', '/auth/login', { email, password }),
  refresh: (refreshToken)       => request('POST', '/auth/refresh', { refreshToken }),
};

// ── User ──────────────────────────────────────
export const user = {
  register: (body)   => request('POST', '/api/users/register', body),
  verify:   (token)  => request('GET',  '/api/users/verify', null, { token }),
  resend:   (email)  => request('POST', '/api/users/resend-token', null, { email }),
  get:      (id)     => request('GET',  `/api/users/${id}`),
};

// ── Matching ──────────────────────────────────
export const matching = {
  enterGeneral: (userId) => request('POST',   '/api/matching/general/enter', null, { userId }),
  cancelGeneral:(userId) => request('DELETE', '/api/matching/general/cancel', null, { userId }),
  enterRank:    (userId) => request('POST',   '/api/matching/rank/enter', null, { userId }),
  cancelRank:   (userId) => request('DELETE', '/api/matching/rank/cancel', null, { userId }),
  active:       (userId) => request('GET',    '/api/matching/active', null, { userId }),
  history:      (userId) => request('GET',    '/api/matching/history', null, { userId }),
};

// ── Evaluation ────────────────────────────────
export const evaluation = {
  submit: (matchId, evaluatorId, score) =>
    request('POST', `/api/matches/${matchId}/evaluation`, null, { evaluatorId, score }),
};

// ── Chat ──────────────────────────────────────
export const chat = {
  rooms:        ()                  => request('GET',    '/api/chats/rooms'),
  messages:     (matchId)           => request('GET',    `/api/chats/matches/${matchId}/messages`),
  send:         (matchId, content)  => request('POST',   `/api/chats/matches/${matchId}/messages`, { content }),
  read:         (matchId)           => request('PATCH',  `/api/chats/matches/${matchId}/read`),
  unreadCount:  (matchId)           => request('GET',    `/api/chats/matches/${matchId}/unread-count`),
  block:        (matchId)           => request('POST',   `/api/chats/matches/${matchId}/block`),
  unblock:      (matchId)           => request('DELETE', `/api/chats/matches/${matchId}/block`),
  report:       (matchId, reason)   => request('POST',   `/api/chats/matches/${matchId}/report`, { reason }),
  close:        (matchId)           => request('PATCH',  `/api/chats/matches/${matchId}/close`),
  deleteMsg:    (messageId)         => request('DELETE', `/api/chats/messages/${messageId}`),
};
