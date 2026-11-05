import { getToken } from '../utils/storage';

const RAW = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const API_URL = RAW.replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}
export const isMissing = (e) => e instanceof ApiError && [404, 405, 501].includes(e.status);

function extractMessage(data) {
  if (!data) return null;
  if (typeof data === 'string') return data.slice(0, 300);
  const m = data.message ?? data.error ?? data.msg ?? data.detail;
  if (typeof m === 'string') return m;
  if (m && typeof m === 'object' && m.message) return m.message;
  const list = data.errors ?? data.details;
  if (Array.isArray(list) && list.length) {
    return list.map((e) => (typeof e === 'string' ? e : e.msg || e.message || '')).filter(Boolean).join(' · ');
  }
  return null;
}

export async function request(method, path, { body, params, auth = true } = {}) {
  const url = new URL(API_URL + path, window.location.origin);
  if (params) Object.entries(params).forEach(([k, v]) => v !== undefined && v !== null && v !== '' && url.searchParams.set(k, v));

  const headers = { Accept: 'application/json' };
  const token = getToken();
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  } catch {
    throw new ApiError("Impossible de joindre le serveur. Vérifiez que le backend est démarré et que l'URL de l'API est correcte.", 0);
  }

  const text = await res.text();
  let data = null;
  if (text) { try { data = JSON.parse(text); } catch { data = text; } }

  if (!res.ok) {
    if (res.status === 401 && auth && token) window.dispatchEvent(new Event('transtu:unauthorized'));
    throw new ApiError(extractMessage(data) || `Erreur ${res.status}`, res.status, data);
  }
  return data;
}

/** call(ENDPOINTS.trips.list, { params }) */
export const call = (ep, opts) => request(ep.method, ep.path, opts);
