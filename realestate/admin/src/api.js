const TOKEN_KEY = 'gurukripa_admin_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

async function req(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';

  const res = await fetch('/api' + path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && !path.includes('/auth/login') && !path.includes('/auth/verify-2fa')) {
    clearToken();
    window.location.href = '/admin/login';
    throw new Error('Session expired');
  }
  if (!res.ok) {
    // Attach the full payload so the UI can react to captchaRequired /
    // captchaId / svg / lockedUntil etc.
    const err = new Error(data.message || `Request failed (${res.status})`);
    err.status = res.status;
    Object.assign(err, data);
    throw err;
  }
  return data;
}

export const api = {
  // ---------- auth ----------
  getCaptcha: () => req('/auth/captcha'),
  login: (email, password, captchaId, captchaAnswer) =>
    req('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, captchaId, captchaAnswer }),
    }),
  verify2fa: (pendingToken, code) =>
    req('/auth/verify-2fa', { method: 'POST', body: JSON.stringify({ pendingToken, code }) }),
  me: () => req('/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    req('/auth/password', { method: 'PUT', body: JSON.stringify({ currentPassword, newPassword }) }),

  // ---------- 2FA ----------
  twoFactorSetup: () => req('/auth/2fa/setup'),
  twoFactorEnable: (code, password) =>
    req('/auth/2fa/enable', { method: 'POST', body: JSON.stringify({ code, password }) }),
  twoFactorDisable: (code, password) =>
    req('/auth/2fa/disable', { method: 'POST', body: JSON.stringify({ code, password }) }),

  // ---------- ownership transfer ----------
  // ---------- SMTP settings (DB me — admin panel se change hoti hai) ----------
  getSmtpSettings: () => req('/settings/smtp'),
  saveSmtpSettings: (payload) => req('/settings/smtp', { method: 'PUT', body: JSON.stringify(payload) }),
  testEmail: () => req('/settings/smtp/test', { method: 'POST', body: JSON.stringify({}) }),
  transferOwnership: (payload) =>
    req('/auth/transfer', { method: 'POST', body: JSON.stringify(payload) }),

  // ---------- forgot password (OTP flow) ----------
  forgotPassword: (email) => req('/auth/forgot', { method: 'POST', body: JSON.stringify({ email }) }),
  verifyOtp: (email, otp) => req('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, otp }) }),
  resetWithOtp: (resetToken, newPassword, confirmNewPassword) =>
    req('/auth/reset-otp', { method: 'POST', body: JSON.stringify({ resetToken, newPassword, confirmNewPassword }) }),

  // ---------- forgot password (link flow) ----------
  validateResetToken: (token) => req(`/auth/reset/${token}`),
  resetPassword: (token, newPassword, confirmNewPassword) =>
    req(`/auth/reset/${token}`, { method: 'POST', body: JSON.stringify({ newPassword, confirmNewPassword }) }),

  // ---------- activity log ----------
  getAudit: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v !== undefined && v !== '' && qs.set(k, v));
    return req(`/audit?${qs}`);
  },

  // ---------- site visits ----------
  getSiteVisits: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v !== undefined && v !== '' && qs.set(k, v));
    return req(`/sitevisits?${qs}`);
  },
  createSiteVisit: (data) => req('/sitevisits', { method: 'POST', body: JSON.stringify(data) }),
  updateSiteVisit: (id, data) => req(`/sitevisits/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteSiteVisit: (id) => req(`/sitevisits/${id}`, { method: 'DELETE' }),

  // ---------- analytics ----------
  getAnalytics: () => req('/analytics'),

  // ---------- notifications ----------
  getNotifications: () => req('/notifications'),
  unreadNotifications: () => req('/notifications/unread-count'),
  markNotificationRead: (id) => req(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => req('/notifications/read-all', { method: 'POST' }),
  // SSE stream uses raw fetch (kept separate — the wrapper expects JSON)
  notificationStream: (token) => {
    return fetch('/api/notifications/stream', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  getProperties: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v !== undefined && v !== '' && qs.set(k, v));
    return req(`/properties?${qs}`);
  },
  getProperty: (id) => req(`/properties/id/${id}`),
  createProperty: (data) => req('/properties', { method: 'POST', body: JSON.stringify(data) }),
  updateProperty: (id, data) => req(`/properties/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleFeature: (id) => req(`/properties/${id}/feature`, { method: 'PATCH' }),
  deleteProperty: (id) => req(`/properties/${id}`, { method: 'DELETE' }),

  getContent: () => req('/content'),
  saveContent: (key, data) => req(`/content/${key}`, { method: 'PUT', body: JSON.stringify({ data }) }),

  getEnquiries: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v !== undefined && v !== '' && qs.set(k, v));
    return req(`/enquiries?${qs}`);
  },
  setEnquiryStatus: (id, payload) => req(`/enquiries/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteEnquiry: (id) => req(`/enquiries/${id}`, { method: 'DELETE' }),

  getStats: () => req('/stats'),
  getDailyVisits: (days = 14) => req(`/analytics/visits?days=${days}`),

  uploadImage: (file) => {
    const fd = new FormData();
    fd.append('image', file);
    return req('/upload', { method: 'POST', body: fd });
  },
  deleteUpload: (filename) => req(`/upload/${encodeURIComponent(filename)}`, { method: 'DELETE' }),
};

export const fmtINR = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
export const fmtDate = (s) =>
  new Date(s).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
export const fmtTime = (s) =>
  new Date(s).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
