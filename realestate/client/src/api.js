const BASE = '/api';

async function req(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

export const getSite = () => req('/site');
export const getProperties = (params = {}) => {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.set(k, v);
  });
  return req(`/properties?${qs}`);
};
export const getProperty = (slug) => req(`/properties/${slug}`);
export const getMeta = () => req('/properties/meta');
export const postEnquiry = (payload) =>
  req('/enquiries', { method: 'POST', body: JSON.stringify(payload) });

export const formatINR = (n) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export const formatINRCompact = (n) => {
  const num = Number(n || 0);
  if (num >= 1e7) return `₹${(num / 1e7).toFixed(num % 1e7 === 0 ? 0 : 2)} Cr`;
  if (num >= 1e5) return `₹${(num / 1e5).toFixed(num % 1e5 === 0 ? 0 : 1)} Lac`;
  if (num >= 1e3) return `₹${(num / 1e3).toFixed(0)}K`;
  return `₹${num}`;
};
