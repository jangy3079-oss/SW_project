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
  register:          (body)     => request('POST',  '/api/users/register', body),
  verify:            (token)    => request('GET',   '/api/users/verify', null, { token }),
  resend:            (email)    => request('POST',  '/api/users/resend-token', null, { email }),
  get:               (id)       => request('GET',   `/api/users/${id}`),
  updateProfile:     (id, body) => request('POST',  `/api/users/${id}/profile`, body),
  updateBio:         (id, bio)  => request('PATCH', `/api/users/${id}/bio`, { bio }),
  getPreferences:    (id)       => request('GET',   `/api/users/${id}/preferences`),
  updatePreferences: (id, body) => request('PUT',   `/api/users/${id}/preferences`, body),
};

// ── Photo ─────────────────────────────────────
export const photo = {
  list:       (userId)          => request('GET',    `/api/users/${userId}/photos`),
  setPrimary: (userId, photoId) => request('PATCH',  `/api/users/${userId}/photos/${photoId}/primary`),
  delete:     (userId, photoId) => request('DELETE', `/api/users/${userId}/photos/${photoId}`),
  upload: async (userId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('accessToken');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`/api/users/${userId}/photos`, {
      method: 'POST', headers, body: formData,
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { message: text }; }
    if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
    return data?.data ?? data;
  },
};

// ── Matching ──────────────────────────────────
export const matching = {
  enterGeneral:    (userId) => request('POST',   '/api/matching/general/enter', null, { userId }),
  cancelGeneral:   (userId) => request('DELETE', '/api/matching/general/cancel', null, { userId }),
  enterRank:       (userId) => request('POST',   '/api/matching/rank/enter', null, { userId }),
  cancelRank:      (userId) => request('DELETE', '/api/matching/rank/cancel', null, { userId }),
  rankQueueStatus: (userId) => request('GET',    '/api/matching/rank/status', null, { userId }),
  active:          (userId) => request('GET',    '/api/matching/active', null, { userId }),
  history:         (userId) => request('GET',    '/api/matching/history', null, { userId }),
};

// ── Timetable ─────────────────────────────────
export const timetable = {
  status:   (userId) => request('GET', `/api/users/${userId}/timetable/status`),
  getSlots: (userId) => request('GET', `/api/users/${userId}/timetable`),
  upload: async (userId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('accessToken');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`/api/users/${userId}/timetable`, {
      method: 'POST', headers, body: formData,
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { message: text }; }
    if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
    return data?.data ?? data;
  },
};

// ── FreeTime Matching ─────────────────────────
export const freeTime = {
  pending: (userId)              => request('GET',  '/api/matching/freetime/pending', null, { userId }),
  accept:  (requestId, userId)   => request('POST', `/api/matching/freetime/${requestId}/accept`, null, { userId }),
  reject:  (requestId, userId)   => request('POST', `/api/matching/freetime/${requestId}/reject`, null, { userId }),
  testRun: ()                    => request('POST', '/api/matching/freetime/test/run'),
};

// ── Likes ─────────────────────────────────────
export const likes = {
  received: (userId) => request('GET',  '/api/likes/received', null, { userId }),
  sent:     (userId) => request('GET',  '/api/likes/sent',     null, { userId }),
  accept:   (likeId) => request('POST', '/api/likes/accept',   null, { likeId }),
  reject:   (likeId) => request('POST', '/api/likes/reject',   null, { likeId }),
  send: (senderId, receiverId) => request('POST', '/api/likes/send', null, { senderId, receiverId }),
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
