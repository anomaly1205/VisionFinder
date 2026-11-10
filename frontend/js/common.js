// Shared: data loading, cart + wishlist (localStorage), product cards, image fit, toast.
// Header, nav and footer live in layout.js.

const ICONS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z"/><circle cx="12" cy="13.5" r="3.5"/>',
  bag: '<path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>',
  left: '<path d="M15 6l-6 6 6 6"/>',
  right: '<path d="M9 6l6 6-6 6"/>',
  crop: '<path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/>',
  text: '<path d="M4 6h16M4 12h10M4 18h7"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16Z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8L3 12Z"/><circle cx="7.5" cy="8" r="1.4"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  minus: '<path d="M5 12h14"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  clipboard: '<rect x="6" y="4" width="12" height="17" rx="1"/><path d="M9 4V3h6v1"/>',
  grid: '<rect x="4" y="4" width="7" height="7"/><rect x="13" y="4" width="7" height="7"/><rect x="4" y="13" width="7" height="7"/><rect x="13" y="13" width="7" height="7"/>',
  image: '<rect x="3" y="5" width="18" height="14" rx="1"/><circle cx="9" cy="10" r="1.6"/><path d="m21 16-5-5-9 8"/>',
  spark: '<path d="M12 3c.6 4.4 2.6 6.4 7 7-4.4.6-6.4 2.6-7 7-.6-4.4-2.6-6.4-7-7 4.4-.6 6.4-2.6 7-7Z"/><path d="M19 15v4M17 17h4"/>',
  phone: '<rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/>',
};
export const icon = (name, cls = "icon") =>
  `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name]}</svg>`;

export const CATEGORIES = ["Furniture", "Lighting", "Rugs", "Decor", "Storage", "Plants", "Textiles"];

const TYPE_LABELS = {
  HOME_MIRROR: "Mirrors", HOME_LIGHTING_AND_LAMPS: "Lamps & Lighting", LIGHT_FIXTURE: "Light Fixtures",
  STOOL_SEATING: "Stools", FURNITURE: "Other Furniture", HOME_ORGANIZERS_AND_STORAGE: "Organizers",
  FLAT_SHEET: "Sheets", WALL_ART: "Wall Art", STRING_LIGHT: "String Lights", JEWELRY_STORAGE: "Jewelry Storage",
  STORAGE_BAG: "Storage Bags", STORAGE_BOX: "Storage Boxes", STORAGE_RACK: "Storage Racks", STORAGE_DRAWER: "Storage Drawers",
  ARTIFICIAL_PLANT: "Artificial Plants", ARTIFICIAL_TREE: "Artificial Trees", RUG_PAD: "Rug Pads", BED_FRAME: "Bed Frames",
  CANDLE_HOLDER: "Candle Holders", BENCH: "Benches", BOX: "Boxes",
};
export const typeLabel = (t) =>
  TYPE_LABELS[t] ?? t.toLowerCase().replace(/(^|_)(\w)/g, (_, s, c) => (s ? " " : "") + c.toUpperCase()) + "s";

// Display name: drop the "Amazon Brand - " prefix ABO puts on house brands.
export const displayName = (name) => name.replace(/^Amazon Brand\s*[-–—]\s*/i, "");

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

// Plain keyword search (no AI): every query word must appear as a whole word in name, category or product type.
const words = (s) => s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
export function keywordSearch(products, q) {
  const want = words(q);
  if (!want.length) return [];
  return products.filter((p) => {
    const have = new Set(words(`${p.name} ${p.category} ${p.product_type.replace(/_/g, " ")}`));
    return want.every((w) => have.has(w));
  });
}

export const escapeHtml = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export const money = (n) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ---- localStorage helpers (storage can be blocked: never throw) ----
const read = (k) => { try { return JSON.parse(localStorage.getItem(k)) || []; } catch { return []; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* blocked: state lives for this page only */ } };

const CART_KEY = "vf_cart";
const SAVED_KEY = "vf_saved";
export const getCart = () => read(CART_KEY);
export function setCart(items) { write(CART_KEY, items); updateCounts(); }
export function addToCart(id, qty = 1) {
  const items = getCart();
  const row = items.find((i) => i.id === id);
  row ? (row.qty += qty) : items.push({ id, qty });
  setCart(items);
}
export const getSaved = () => read(SAVED_KEY);
function toggleSaved(id) {
  const s = new Set(getSaved());
  s.has(id) ? s.delete(id) : s.add(id);
  write(SAVED_KEY, [...s]);
  updateCounts();
  return s.has(id);
}
// Header badges (rendered by layout.js). Other tabs update through the "storage" event there.
export function updateCounts() {
  const set = (sel, n) => document.querySelectorAll(sel).forEach((el) => { el.textContent = n; el.hidden = n === 0; });
  set(".cart-count", getCart().reduce((s, i) => s + i.qty, 0));
  set(".saved-count", getSaved().length);
}
export const STORAGE_KEYS = [CART_KEY, SAVED_KEY];

// Color filter: ABO colors are free text in several languages ("grijs", "Grey", "charcoal").
// Map each to one family by the keyword that appears first in the string.
const COLOR_FAMILIES = {
  Black: ["black", "zwart", "schwarz", "onyx"],
  White: ["white", "wit", "weiß", "chalk", "pearl", "milk", "vanilla"],
  Gray: ["grey", "gray", "grijs", "grau", "gri", "charcoal", "slate", "dove", "shadow", "stone"],
  "Cream & Beige": ["beige", "biege", "ivory", "cream", "sand", "khaki", "linen", "oatmeal", "taupe", "parchment", "natural", "tan"],
  "Brown & Wood": ["brown", "walnut", "espresso", "oak", "wood", "wenge", "cherry", "mocha", "rattan", "saddle", "tortoise"],
  Blue: ["blue", "blau", "modr", "navy", "aqua", "teal", "turquoise", "denim", "lagoon", "caribe", "midnight"],
  Green: ["green", "seafoam", "sea foam", "mint", "moss", "palm", "olive"],
  "Red & Pink": ["red", "rood", "rust", "burgundy", "maroon", "brick", "terracotta", "coral", "salmon", "pink", "blush", "rose"],
  Purple: ["purple", "lila", "lilac"],
  "Yellow & Orange": ["yellow", "orange", "tangerine"],
  Metallic: ["silver", "nickel", "brass", "gold", "bronze", "brons", "copper", "kupfer", "koper", "steel", "alumin", "chrome", "pewter"],
  Clear: ["glass", "clear", "transparent", "crystal"],
  Multicolor: ["multi", "multy"],
};
export function colorFamily(color) {
  const c = (color || "").toLowerCase();
  let best = null, at = Infinity;
  for (const [fam, words] of Object.entries(COLOR_FAMILIES))
    for (const w of words) { const i = c.indexOf(w); if (i !== -1 && i < at) { at = i; best = fam; } }
  return best; // null: unknown or empty
}
export const COLOR_ORDER = Object.keys(COLOR_FAMILIES);

// ---- product card ----
export function productCard(p, extra = "") {
  const saved = getSaved().includes(p.id);
  return `<div class="card">
    <button class="heart" type="button" data-save="${escapeHtml(p.id)}" aria-pressed="${saved}" aria-label="Save ${escapeHtml(displayName(p.name))} to wishlist">${icon("heart")}</button>
    <a class="tile" href="product.html?id=${encodeURIComponent(p.id)}" tabindex="-1" aria-hidden="true"><img src="${p.image}" alt="" loading="lazy" width="256" height="256"></a>
    <a class="card-body" href="product.html?id=${encodeURIComponent(p.id)}">
      <h3 class="card-title">${escapeHtml(displayName(p.name))}</h3>
      <p class="card-brand">${escapeHtml(p.brand || p.category)}</p>
      <p class="card-price">${money(p.price)}</p>
    </a>${extra}
  </div>`;
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-save]");
  if (b) b.setAttribute("aria-pressed", toggleSaved(b.dataset.save));
});

// ---- image fit: sample the 4 corners; near-white -> contain (product shot), else cover (room shot) ----
const probe = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
function fitImage(img) {
  if (!img.closest(".tile") || !img.naturalWidth) return;
  const w = img.naturalWidth, h = img.naturalHeight, s = 6;
  probe.canvas.width = w; probe.canvas.height = h;
  probe.drawImage(img, 0, 0);
  const white = [[0, 0], [w - s, 0], [0, h - s], [w - s, h - s]].every(([x, y]) => {
    const d = probe.getImageData(x, y, s, s).data;
    for (let i = 0; i < d.length; i += 4) if (d[i] < 235 || d[i + 1] < 235 || d[i + 2] < 235) return false;
    return true;
  });
  img.classList.toggle("fit-cover", !white);
}
document.addEventListener("load", (e) => e.target.tagName === "IMG" && fitImage(e.target), true);
export const fitAll = (root = document) => root.querySelectorAll(".tile img").forEach((i) => i.complete && fitImage(i));

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

// Small status message at the bottom of the screen.
let toastTimer;
export function toast(msg) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("p");
    el.className = "toast";
    el.setAttribute("role", "status");
    document.body.append(el);
  }
  el.textContent = msg;
  el.classList.add("is-on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("is-on"), 2400);
}
