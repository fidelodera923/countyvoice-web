const API = () => window.COUNTYVOICE_API || 'http://localhost:3000';

async function request(path, options = {}) {
  const res = await fetch(`${API()}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  let data = null;
  try { data = await res.json(); } catch (e) {}
  if (!res.ok) throw new Error((data && data.error) || 'Request failed');
  return data;
}

window.CountyVoice = {
  registerUser: (body) => request('/api/auth/user/register', { method: 'POST', body: JSON.stringify(body) }),
  loginUser: (body) => request('/api/auth/user/login', { method: 'POST', body: JSON.stringify(body) }),
  loginAdmin: (body) => request('/api/auth/admin/login', { method: 'POST', body: JSON.stringify(body) }),
  getIssues: (userId) => request(userId ? `/api/issues?userId=${encodeURIComponent(userId)}` : '/api/issues'),
  saveIssue: (body) => request('/api/issues', { method: 'POST', body: JSON.stringify(body) }),
  updateIssue: (id, body) => request(`/api/issues/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  getPromises: () => request('/api/promises'),
  addPromise: (body) => request('/api/promises', { method: 'POST', body: JSON.stringify(body) }),
  getStats: () => request('/api/stats'),
  getWards: () => request('/api/wards'),
  getCategories: () => request('/api/categories'),
  escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text || '';
    return d.innerHTML;
  },
  formatDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('en-KE', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }
};