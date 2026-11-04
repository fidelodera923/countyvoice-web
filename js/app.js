window.COUNTYVOICE_API = 'https://countyvoice-api-1.onrender.com';

window.API = function API(path) {
  const base = (window.COUNTYVOICE_API || 'https://countyvoice-api-1.onrender.com').replace(/\/$/, '');
  const p = path.startsWith('/') ? path : '/' + path;
  return base + p;
};

function authHeaders(extra) {
  const headers = { 'Content-Type': 'application/json', ...(extra || {}) };
  const adminToken = sessionStorage.getItem('countyvoice_admin_token');
  const userToken = sessionStorage.getItem('countyvoice_user_token');
  if (adminToken) headers.Authorization = 'Bearer ' + adminToken;
  else if (userToken) headers.Authorization = 'Bearer ' + userToken;
  return headers;
}

async function request(path, options) {
  options = options || {};
  const res = await fetch(window.API(path), {
    ...options,
    headers: authHeaders(options.headers || {})
  });
  let data = null;
  const text = await res.text();
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; }
  if (!res.ok) throw new Error((data && data.error) || 'Request failed');
  return data;
}

window.CountyVoice = {
  registerUser: (body) => request('/api/auth/user/register', { method: 'POST', body: JSON.stringify(body) }),
  loginUser: (body) => request('/api/auth/user/login', { method: 'POST', body: JSON.stringify(body) }),
  loginAdmin: (body) => request('/api/auth/admin/login', { method: 'POST', body: JSON.stringify(body) }),
  getIssues: (userId) => request(userId ? '/api/issues?userId=' + encodeURIComponent(userId) : '/api/issues'),
  getAdminIssues: (params) => {
    const q = new URLSearchParams(params || {}).toString();
    return request('/api/admin/issues' + (q ? '?' + q : ''));
  },
  exportAdminIssues: async (params) => {
    const q = new URLSearchParams(params || {}).toString();
    const res = await fetch(window.API('/api/admin/issues/export' + (q ? '?' + q : '')), {
      headers: authHeaders()
    });
    if (!res.ok) {
      let data = null;
      try { data = await res.json(); } catch (e) {}
      throw new Error((data && data.error) || 'Export failed');
    }
    return res.blob();
  },
  saveIssue: (body) => request('/api/issues', { method: 'POST', body: JSON.stringify(body) }),
  updateIssue: (id, body) => request('/api/issues/' + id, { method: 'PUT', body: JSON.stringify(body) }),
  getPromises: () => request('/api/promises'),
  addPromise: (body) => request('/api/promises', { method: 'POST', body: JSON.stringify(body) }),
  getStats: () => request('/api/stats'),
  getWards: () => request('/api/wards'),
  getCategories: () => request('/api/categories'),
  getDepartments: () => request('/api/departments'),

  escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text == null ? '' : String(text);
    return d.innerHTML;
  },
  formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-KE', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  },
  timeAgo(iso) {
    if (!iso) return '';
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + ' min ago';
    if (s < 86400) return Math.floor(s / 3600) + ' hr ago';
    if (s < 604800) return Math.floor(s / 86400) + ' days ago';
    return this.formatDate(iso);
  },
  getUser() {
    try { return JSON.parse(sessionStorage.getItem('countyvoice_user') || 'null'); }
    catch (e) { return null; }
  },
  statusMeaning(status) {
    const map = {
      Received: 'Your report was received by the system',
      'Under Review': 'County officers are reviewing this',
      Acknowledged: 'The county has acknowledged this issue',
      Funded: 'Resources have been allocated',
      Ongoing: 'Work is in progress',
      Rejected: 'This issue was not taken forward'
    };
    return map[status] || status;
  },
  isRecentlyUpdated(issue, days) {
    days = days || 7;
    if (!issue || !issue.updatedAt) return false;
    if (issue.status === 'Received' && (!issue.history || issue.history.length <= 1)) return false;
    return Date.now() - new Date(issue.updatedAt).getTime() < days * 86400000;
  },
  animateValue(el, end, duration) {
    if (!el) return;
    duration = duration || 800;
    const t0 = performance.now();
    function frame(now) {
      const p = Math.min(1, (now - t0) / duration);
      el.textContent = Math.floor((end || 0) * p);
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = end || 0;
    }
    requestAnimationFrame(frame);
  },
  toast(message, type) {
    type = type || 'info';
    let host = document.getElementById('cv-toast-host');
    if (!host) {
      host = document.createElement('div');
      host.id = 'cv-toast-host';
      host.className = 'fixed top-4 right-4 z-[100] space-y-2 max-w-sm';
      document.body.appendChild(host);
    }
    const colors = {
      info: 'bg-teal-800 text-white',
      success: 'bg-green-600 text-white',
      error: 'bg-red-600 text-white'
    };
    const el = document.createElement('div');
    el.className = (colors[type] || colors.info) + ' px-4 py-3 rounded-lg shadow-lg text-sm';
    el.textContent = message;
    host.appendChild(el);
    setTimeout(function () { el.remove(); }, 3200);
  }
};