import { crumbs } from "./layout.js";
import { CATEGORIES, loadProducts, productCard, getSaved, colorFamily, COLOR_ORDER, typeLabel, icon } from "./common.js";

const PAGE = 24;
const NEW_COUNT = 24; // New Arrivals = the last 24 items of the catalog (or of the chosen category)
const $ = (id) => document.getElementById(id);
const products = await loadProducts();

$("photo-btn").innerHTML = `${icon("camera")} Search by photo`;
$("f-category").innerHTML = `<option value="">All categories</option>` + CATEGORIES.map((c) => `<option>${c}</option>`).join("");
const familiesInData = new Set(products.map((p) => colorFamily(p.color)));
$("f-color").innerHTML = `<option value="">All colors</option>` +
  COLOR_ORDER.filter((f) => familiesInData.has(f)).map((f) => `<option>${f}</option>`).join("");

let shown = PAGE;

function filtered(params) {
  const cat = params.get("category"), color = params.get("color"), sort = params.get("sort");
  const subs = params.get("sub")?.split(",").filter(Boolean);
  let list = products;
  if (params.has("wishlist")) { const saved = new Set(getSaved()); list = list.filter((p) => saved.has(p.id)); }
  if (cat) list = list.filter((p) => p.category === cat);
  if (subs?.length) list = list.filter((p) => subs.includes(p.product_type));
  if (params.has("new")) list = list.slice(-NEW_COUNT).reverse(); // newest first
  if (color) list = list.filter((p) => colorFamily(p.color) === color);
  const by = { "price-asc": (a, b) => a.price - b.price, "price-desc": (a, b) => b.price - a.price,
    name: (a, b) => a.name.localeCompare(b.name) }[sort];
  return by ? [...list].sort(by) : list;
}

function render() {
  const params = new URLSearchParams(location.search);
  const cat = params.get("category") ?? "";
  const subs = params.get("sub")?.split(",").filter(Boolean) ?? [];
  const title = params.has("wishlist") ? "Wishlist" : params.has("new") ? (cat ? `New in ${cat}` : "New Arrivals") : cat || "All Products";
  document.title = `${title} · VisionFinder Home`;
  $("list-title").textContent = title;
  $("crumbs").innerHTML = crumbs([["Home", "index.html"], ...(cat && title !== cat ? [[cat, `products.html?category=${cat}`]] : []), [title]]);

  $("f-category").value = cat;
  $("f-color").value = params.get("color") ?? "";
  $("f-sort").value = params.get("sort") ?? "";
  const sub = $("active-sub");
  sub.hidden = !subs.length;
  if (subs.length) sub.innerHTML = `Type: ${subs.map(typeLabel).join(", ")} <button type="button" data-clear="sub">Show all ${cat || "types"}</button>`;

  const list = filtered(params);
  $("list-count").textContent = `${list.length} ${list.length === 1 ? "piece" : "pieces"}`;
  $("list-grid").innerHTML = list.slice(0, shown).map((p) => productCard(p)).join("");
  $("load-more").hidden = list.length <= shown;

  const empty = $("list-empty");
  empty.hidden = list.length > 0;
  if (!list.length) {
    empty.innerHTML = params.has("wishlist") && [...params.keys()].length === 1
      ? `<p>No saved pieces yet. Tap the heart on any product to keep it here.</p><a class="btn" href="products.html">Browse the shop</a>`
      : `<p>No pieces match these filters.</p><button class="btn" type="button" data-clear="all">Clear filters</button>`;
  }
}

// Filters live in the URL so a reload or a shared link shows the same list.
function go(params) {
  const qs = params.toString();
  history.pushState(null, "", qs ? `?${qs}` : location.pathname);
  shown = PAGE;
  render();
}
$("filters").addEventListener("change", (e) => {
  const params = new URLSearchParams(location.search);
  const { name, value } = e.target;
  value ? params.set(name, value) : params.delete(name);
  if (name === "category") params.delete("sub"); // a type belongs to one category
  go(params);
});
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-clear]");
  if (!b) return;
  const params = new URLSearchParams(location.search);
  if (b.dataset.clear === "sub") params.delete("sub");
  else for (const k of ["category", "sub", "color", "new"]) params.delete(k); // keep wishlist view + sort
  go(params);
});
$("load-more").addEventListener("click", () => { shown += PAGE; render(); });
window.addEventListener("popstate", () => { shown = PAGE; render(); });
render();
