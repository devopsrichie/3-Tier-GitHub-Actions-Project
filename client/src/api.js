// Thin fetch wrapper. All calls go to /api, which nginx (or Vite in dev) proxies to the API tier.
export async function api(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const formatRand = (n) =>
  `R ${Number(n).toLocaleString('en-ZA', { maximumFractionDigits: 0 })}`;

export const formatDate = (d) =>
  new Date(d).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' });
