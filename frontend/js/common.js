// Shared: data loading, header/footer, cart (localStorage), product cards, icons.

const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13.5" r="3.5"/>',
  bag: '<path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
};
export const icon = (name, cls = "icon") =>
  `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;

export const CATEGORIES = ["Furniture", "Lighting", "Rugs", "Decor", "Storage", "Plants", "Textiles"];

let productsPromise;
export function loadProducts() {
  productsPromise ??= fetch("data/products.json").then((r) => {
    if (!r.ok) throw new Error(`products.json: HTTP ${r.status}`);
    return r.json();
  });
  return productsPromise;
}
export async function productById(id) {
  return (await loadProducts()).find((p) => p.id === id);
}

export const escapeHtml = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export const money = (n) => `$${n.toFixed(2)}`;

export function productCard(p, extra = "") {
  return `<a class="card" href="product.html?id=${encodeURIComponent(p.id)}">
    <div class="photo"><img src="${p.image}" alt="" loading="lazy" width="256" height="256"></div>
    <div>
      <p class="card-name">${escapeHtml(p.name)}</p>
      <p class="card-meta"><span class="muted">${escapeHtml(p.category)}</span><span class="num">${money(p.price)}</span></p>
      ${extra}
    </div>
  </a>`;
}

// Cart: [{id, qty}] in localStorage. Wrapped in try/catch: storage can be blocked.
const CART_KEY = "vf_cart";
export function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; }
}
export function setCart(items) {
  try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch { /* storage blocked: cart lives for this page only */ }
  updateCartCount(items);
}
export function addToCart(id, qty = 1) {
  const items = getCart();
  const row = items.find((i) => i.id === id);
  row ? (row.qty += qty) : items.push({ id, qty });
  setCart(items);
}
function updateCartCount(items = getCart()) {
  const el = document.querySelector(".cart-count");
  if (!el) return;
  const n = items.reduce((s, i) => s + i.qty, 0);
  el.textContent = n;
  el.hidden = n === 0;
}

function renderHeader() {
  const page = location.pathname.split("/").pop() || "index.html";
  const q = new URLSearchParams(location.search).get("q") ?? "";
  const nav = [["products.html", "Shop"], ["search.html", "Visual search"]]
    .map(([href, label]) => `<a href="${href}"${page === href ? ' aria-current="page"' : ""}>${label}</a>`).join("");
  document.querySelector(".site-header").innerHTML = `<div class="wrap header-row">
    <a class="wordmark" href="index.html">VisionFinder <span>Home</span></a>
    <nav class="main-nav" aria-label="Main">${nav}</nav>
    <form class="header-search" action="search.html" role="search">
      ${icon("search")}
      <label class="sr-only" for="site-q">Search products</label>
      <input id="site-q" name="q" type="search" placeholder="Search lamps, rugs, oak chairs…" value="${escapeHtml(q)}" autocomplete="off">
      <a class="cam-btn" href="search.html" title="Search by photo" aria-label="Search by photo">${icon("camera")}</a>
    </form>
    <a class="cart-link" href="cart.html" aria-label="Cart">${icon("bag")}<span class="cart-count num" hidden>0</span></a>
  </div>`;
  updateCartCount();
}

function renderFooter() {
  document.querySelector(".site-footer").innerHTML = `<div class="wrap footer-row">
    <p class="muted">Product data © Amazon.com, Amazon Berkeley Objects (CC BY 4.0). Prices are for demo only.</p>
    <nav aria-label="Footer"><a href="products.html">Shop</a><a href="search.html">Visual search</a><a href="cart.html">Cart</a></nav>
  </div>`;
}

// Hand an image from any page to search.html: downscale, stash in sessionStorage, navigate.
export async function sendToSearch(blob) {
  const bmp = await createImageBitmap(blob);
  const scale = Math.min(1, 1024 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
  try { sessionStorage.setItem("vf_query_image", c.toDataURL("image/jpeg", 0.9)); } catch { /* too large or blocked */ }
  location.href = "search.html";
}

renderHeader();
renderFooter();
window.addEventListener("storage", (e) => e.key === CART_KEY && updateCartCount());
