// Search API client. Calls the FastAPI backend; falls back to a mock "demo mode" when it is offline.
// Every function resolves to { results: [{ product, score }], ms, demo }.
import { loadProducts, productById } from "./common.js";

export const API_BASE = "http://127.0.0.1:8000/api";
export let THRESHOLD = 0.6; // best score below this -> "No confident match"; replaced by the backend's value
const K = 12;

let backendUp; // cached per page load
async function backendAvailable() {
  if (backendUp !== undefined) return backendUp;
  try {
    const r = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(1500) });
    backendUp = r.ok;
    if (backendUp) THRESHOLD = (await r.json()).threshold ?? THRESHOLD;
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
  b.setAttribute("role", "status");
  b.innerHTML = `<strong>Demo mode</strong> Backend offline, results are simulated.`;
  document.body.append(b);
}

// Backend returns { results: [{ id, score }], took_ms }. Attach full product records.
async function call(path, init) {
  const t0 = performance.now();
  const r = await fetch(`${API_BASE}${path}`, init);
  if (!r.ok) throw new Error(`API ${path}: HTTP ${r.status}`);
  const data = await r.json();
  const results = [];
  for (const { id, score } of data.results) {
    const product = await productById(id);
    if (product) results.push({ product, score });
  }
  return { results, ms: data.took_ms ?? Math.round(performance.now() - t0), demo: false, match: data.match };
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
// Fake but plausible descending similarity scores.
const descending = (n, top) => Array.from({ length: n }, (_, i) => +(top - i * 0.025 - Math.random() * 0.015).toFixed(3));

// Text score: share of query words found in name + category + color + product_type.
export function textScore(product, words) {
  const hay = `${product.name} ${product.category} ${product.color} ${product.product_type.replace(/_/g, " ")}`.toLowerCase();
  return words.filter((w) => hay.includes(w)).length / words.length;
}
const tokenize = (q) => q.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 1);

async function mockText(q) {
  const words = tokenize(q);
  if (!words.length) return [];
  return (await loadProducts())
    .map((product) => ({ product, s: textScore(product, words) }))
    .filter((r) => r.s > 0)
    .map(({ product, s }) => ({ product, score: +(0.4 + s * 0.5 - Math.random() * 0.02).toFixed(3) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, K);
}

async function mockImage(text, excludeId) {
  const products = await loadProducts();
  let pool;
  if (text) pool = (await mockText(text)).map((r) => r.product); // description narrows the photo results
  if (!pool?.length) {
    const cats = [...new Set(products.map((p) => p.category))];
    const cat = cats[Math.floor(Math.random() * cats.length)];
    pool = shuffle(products.filter((p) => p.category === cat));
  }
  pool = pool.filter((p) => p.id !== excludeId).slice(0, K);
  const scores = descending(pool.length, 0.5 + Math.random() * 0.42);
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
  return mock(() => mockImage(text.trim()));
}

export async function searchByText(q) {
  if (await backendAvailable()) return call(`/search/text?q=${encodeURIComponent(q)}&k=${K}`);
  return mock(() => mockText(q));
}

export async function similar(id) {
  if (await backendAvailable()) return call(`/similar/${encodeURIComponent(id)}?k=${K}`);
  return mock(async () => {
    const p = await productById(id);
    if (!p) return [];
    const pool = shuffle((await loadProducts()).filter((x) => x.category === p.category && x.id !== id)).slice(0, K);
    const scores = descending(pool.length, 0.88);
    return pool.map((product, i) => ({ product, score: scores[i] }));
  });
}
