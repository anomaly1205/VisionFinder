// Search API client. Calls the FastAPI backend; falls back to a mock "demo mode" when it is offline.
// Every function resolves to { results: [{ product, score }], ms, demo }.
import { loadProducts, productById } from "./common.js";

export const API_BASE = "http://127.0.0.1:8000/api";
export const THRESHOLD = 0.6; // below this best score -> "No confident match"
const K = 8;

let backendUp; // cached per page load
async function backendAvailable() {
  if (backendUp !== undefined) return backendUp;
  try {
    const r = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(1500) });
    backendUp = r.ok;
  } catch {
    backendUp = false;
  }
  if (!backendUp) showDemoBadge();
  return backendUp;
}

function showDemoBadge() {
  if (document.querySelector(".demo-badge")) return;
  const b = document.createElement("p");
  b.className = "demo-badge";
  b.innerHTML = `<strong>Demo mode</strong> Backend offline, results are simulated.`;
  document.body.append(b);
}

// Backend returns { results: [{ id, score }], took_ms }. Attach full product records.
async function hydrate(data, t0) {
  const results = [];
  for (const r of data.results) {
    const product = await productById(r.id);
    if (product) results.push({ product, score: r.score });
  }
  return { results, ms: data.took_ms ?? Math.round(performance.now() - t0), demo: false };
}

async function call(path, init) {
  const t0 = performance.now();
  const r = await fetch(`${API_BASE}${path}`, init);
  if (!r.ok) throw new Error(`API ${path}: HTTP ${r.status}`);
  return hydrate(await r.json(), t0);
}

// ---- mock (demo mode) ----
const delay = (ms) => new Promise((res) => setTimeout(res, ms));
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
async function mock(fn) {
  const t0 = performance.now();
  await delay(250 + Math.random() * 300);
  return { results: await fn(), ms: Math.round(performance.now() - t0), demo: true };
}
const descending = (n, top) => Array.from({ length: n }, (_, i) => +(top - i * 0.03 - Math.random() * 0.02).toFixed(3));

function mockByCategory(products, category, excludeId) {
  const pool = shuffle(products.filter((p) => p.category === category && p.id !== excludeId)).slice(0, K);
  const scores = descending(pool.length, 0.62 + Math.random() * 0.3);
  return pool.map((product, i) => ({ product, score: scores[i] }));
}

// ---- public API ----
export async function searchByImage(blob, text = "") {
  if (await backendAvailable()) {
    const form = new FormData();
    form.append("file", blob, "query.jpg");
    if (text) form.append("text", text);
    return call(`/search/image?k=${K}`, { method: "POST", body: form });
  }
  return mock(async () => {
    const products = await loadProducts();
    const cats = [...new Set(products.map((p) => p.category))];
    return mockByCategory(products, cats[Math.floor(Math.random() * cats.length)]);
  });
}

export async function searchByText(q) {
  if (await backendAvailable()) return call(`/search/text?q=${encodeURIComponent(q)}&k=${K}`);
  return mock(async () => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    return (await loadProducts())
      .map((product) => {
        const hay = `${product.name} ${product.category} ${product.color}`.toLowerCase();
        return { product, score: words.filter((w) => hay.includes(w)).length / words.length };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, K)
      .map((r) => ({ ...r, score: +(0.5 + r.score * 0.4).toFixed(3) }));
  });
}

export async function similar(id) {
  if (await backendAvailable()) return call(`/similar/${encodeURIComponent(id)}?k=${K}`);
  return mock(async () => {
    const p = await productById(id);
    return p ? mockByCategory(await loadProducts(), p.category, id) : [];
  });
}
