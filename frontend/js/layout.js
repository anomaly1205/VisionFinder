// Shared page chrome: promo bar, header, main nav + mega menu, gray subbar, footer.
// Importing this module renders it into .site-header and .site-footer on every page.
import { icon, CATEGORIES, loadProducts, escapeHtml, updateCounts, STORAGE_KEYS } from "./common.js";

// Mega menu hover intent (ms): rest this long on a nav item before its panel opens; leave nav + panel this long before it closes.
const MENU_OPEN_DELAY = 400;
const MENU_CLOSE_DELAY = 250;
const MENU_AIM_DELAY = 150; // menu open + pointer heading down to the panel: wait before switching to the item it crosses
const DESKTOP = matchMedia("(min-width: 861px)"); // below this the nav is a hamburger list without mega panels

// Small breadcrumb: crumbs([["Home", "index.html"], ["Lighting", "products.html?category=Lighting"], ["Lamp"]])
export const crumbs = (items) => `<nav class="crumbs" aria-label="Breadcrumb"><ol>${items.map(([label, href], i) =>
  `<li>${href && i < items.length - 1 ? `<a href="${href}">${escapeHtml(label)}</a>` : `<span aria-current="page">${escapeHtml(label)}</span>`}</li>`).join("")}</ol></nav>`;

// Underline one nav item (e.g. the category of the product being viewed).
export function markNav(cat) {
  document.querySelectorAll(".nav-item > a[aria-current]").forEach((a) => a.removeAttribute("aria-current"));
  document.querySelector(`.nav-item[data-cat="${cat}"] > a`)?.setAttribute("aria-current", "page");
}

// ---- header ----
function renderHeader() {
  const page = location.pathname.split("/").pop() || "index.html";
  const params = new URLSearchParams(location.search);
  const q = params.get("q") ?? "";
  const activeCat = params.get("category");
  const items = CATEGORIES.map((c) => `<li class="nav-item" data-cat="${c}">
      <a href="products.html?category=${c}"${activeCat === c ? ' aria-current="page"' : ""}>${c}</a>
      <div class="mega"></div>
    </li>`).join("");
  const cur = (on) => (on ? ' aria-current="page"' : "");
  document.querySelector(".site-header").innerHTML = `
    <div class="promo">Furniture, lighting, rugs and decor for every room. Prices are for demo only.</div>
    <div class="wrap header-row">
      <button class="menu-btn" type="button" aria-expanded="false" aria-controls="main-nav" aria-label="Menu">${icon("menu")}</button>
      <a class="wordmark" href="index.html"><span class="wm-text">Vision<em>Finder</em></span><span class="wm-tag">Home</span></a>
      <form class="header-search" action="search.html" role="search">
        <label class="sr-only" for="site-q">Search products</label>
        <input id="site-q" name="q" type="search" placeholder="Search or describe it: “walnut side table”" value="${escapeHtml(q)}" autocomplete="off">
        <button class="search-submit" type="submit" aria-label="Search">${icon("search")}</button>
        <a class="cam-btn" href="search.html" title="Search by photo">${icon("camera")}<span>Photo</span></a>
      </form>
      <div class="header-icons">
        <button class="hdr-item opt" type="button" popovertarget="pop-bell" aria-label="Notifications">${icon("bell")}</button>
        <a class="hdr-item opt" href="products.html?sort=price-asc" aria-label="Deals" title="Deals"${cur(page === "products.html" && params.get("sort") === "price-asc")}>${icon("tag")}</a>
        <a class="hdr-item" href="products.html?wishlist=1" aria-label="Wishlist" title="Wishlist"${cur(page === "products.html" && params.has("wishlist"))}>${icon("heart")}<span class="badge-count saved-count" hidden>0</span></a>
        <a class="hdr-item" href="cart.html" aria-label="Cart" title="Cart"${cur(page === "cart.html")}>${icon("bag")}<span class="badge-count cart-count" hidden>0</span></a>
      </div>
      <p class="hdr-pop" id="pop-bell" popover>No notifications yet.</p>
    </div>
    <nav class="main-nav" id="main-nav" aria-label="Main">
      <ul class="wrap nav-list">
        <li class="nav-item"><a href="products.html?new=1"${cur(page === "products.html" && params.has("new") && !activeCat)}>New Arrivals</a></li>
        ${items}
        <li class="nav-item"><a href="search.html"${cur(page === "search.html")}>Visual Search<span class="nav-new">NEW!</span></a></li>
      </ul>
    </nav>
    <div class="subbar"><div class="wrap">
      <span>Saw it somewhere? Find it with a photo → <a href="search.html">Try Visual Search</a></span>
      <a class="browse" href="products.html">Browse all <span class="total-count">500</span> pieces</a>
    </div></div>`;
  // Popovers sit in the top layer; anchor them under their button.
  document.querySelectorAll("[popovertarget]").forEach((b) => b.addEventListener("click", () => {
    const r = b.getBoundingClientRect(), pop = document.getElementById(b.getAttribute("popovertarget"));
    pop.style.top = `${r.bottom + 6}px`;
    pop.style.right = `${Math.max(8, innerWidth - r.right)}px`;
  }));
  loadProducts().then((ps) => document.querySelectorAll(".total-count").forEach((el) => (el.textContent = ps.length)));
  updateCounts();
  fillMegaMenus();
  initMegaMenu();
  // Hamburger (mobile): show/hide the nav as a vertical list.
  const btn = document.querySelector(".menu-btn"), nav = document.getElementById("main-nav");
  btn.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    btn.setAttribute("aria-expanded", open);
    btn.innerHTML = icon(open ? "close" : "menu");
  });
}

// Mega menu columns. Near-duplicate ABO product types are merged into one link (e.g. LAMP + HOME_LIGHTING_AND_LAMPS).
// Each column: [main link label, [[sub label, types...], ...]]. The main link covers all its subs' types.
const MENU = {
  Furniture: [
    ["Seating", [["Chairs", "CHAIR"], ["Sofas", "SOFA"], ["Ottomans", "OTTOMAN"], ["Benches & Stools", "BENCH", "STOOL_SEATING"]]],
    ["Tables & Storage", [["Tables & Desks", "TABLE", "DESK"], ["Cabinets & Dressers", "CABINET", "DRESSER"], ["Shelves", "SHELF"]]],
    ["Bedroom", [["Beds & Frames", "BED", "BED_FRAME"], ["Headboards", "HEADBOARD"]]],
  ],
  Lighting: [
    ["Lamps", [["Table & Floor Lamps", "LAMP", "HOME_LIGHTING_AND_LAMPS"]]],
    ["Ceiling & Wall", [["Pendants & Fixtures", "LIGHT_FIXTURE"]]],
    ["Accent Lighting", [["String Lights", "STRING_LIGHT"]]],
  ],
  Rugs: [["Area Rugs & Runners", [["All Rugs", "RUG"]]]],
  Decor: [
    ["Wall Decor", [["Wall Art", "WALL_ART"], ["Mirrors", "HOME_MIRROR"], ["Clocks", "CLOCK"]]],
    ["Accents", [["Vases", "VASE"], ["Candles", "CANDLE", "CANDLE_HOLDER"]]],
  ],
  Storage: [
    ["Baskets & Bins", [["Baskets", "BASKET"], ["Storage Boxes", "STORAGE_BOX"], ["Storage Bags", "STORAGE_BAG"]]],
    ["Organizers", [["Racks", "STORAGE_RACK"], ["Drawers", "STORAGE_DRAWER"], ["Jewelry Storage", "JEWELRY_STORAGE"]]],
  ],
  Plants: [["Planters & Greenery", [["Planters", "PLANTER"], ["Artificial Plants", "ARTIFICIAL_PLANT", "ARTIFICIAL_TREE"]]]],
  Textiles: [
    ["Pillows & Throws", [["Pillows & Cushions", "PILLOW"], ["Throws", "BLANKET"]]],
    ["Bedding", [["Sheets", "FLAT_SHEET"]]],
  ],
};

async function fillMegaMenus() {
  const products = await loadProducts();
  const have = new Set(products.map((p) => `${p.category}|${p.product_type}`));
  // Merged types go in one param: sub=A,B (products.html splits on ",").
  const href = (cat, types) => `products.html?category=${cat}&sub=${types.join(",")}`;
  document.querySelectorAll(".nav-item[data-cat]").forEach((li) => {
    const cat = li.dataset.cat;
    const cols = MENU[cat].map(([label, subs]) => {
      const live = subs.map(([l, ...ts]) => [l, ts.filter((t) => have.has(`${cat}|${t}`))]).filter(([, ts]) => ts.length);
      if (!live.length) return "";
      const all = live.flatMap(([, ts]) => ts);
      return `<ul class="mega-col">
        <li><a class="mega-main" href="${href(cat, all)}">${label}</a></li>
        ${live.map(([l, ts]) => `<li><a href="${href(cat, ts)}">${l}</a></li>`).join("")}
      </ul>`;
    }).join("");
    li.querySelector(".mega").innerHTML = `<div class="mega-inner">${cols}
      <ul class="mega-col mega-quick">
        <li><a href="products.html?category=${cat}&new=1">New Arrivals</a></li>
        <li><a href="search.html">Visual Search</a></li>
        <li><a href="products.html?category=${cat}">View All ${cat}</a></li>
      </ul></div>`;
  });
}

// Hover intent: open only after the pointer rests, switch instantly once a menu is open,
// close after a short grace period so the pointer can travel from the nav item down into the panel.
function initMegaMenu() {
  const nav = document.querySelector(".main-nav");
  let openLi = null, openTimer, closeTimer, lastPointer = "mouse", lastY = 0, movingDown = false;
  const open = (li) => {
    clearTimeout(openTimer); clearTimeout(closeTimer);
    if (openLi === li) return;
    openLi?.classList.remove("is-open");
    openLi?.firstElementChild.setAttribute("aria-expanded", "false");
    openLi = li;
    li?.classList.add("is-open");
    li?.firstElementChild.setAttribute("aria-expanded", "true");
  };
  const close = () => open(null);

  nav.querySelectorAll(".nav-item").forEach((li) => {
    const hasMenu = li.hasAttribute("data-cat");
    if (hasMenu) li.firstElementChild.setAttribute("aria-expanded", "false");
    li.addEventListener("pointerenter", (e) => {
      if (e.pointerType !== "mouse") return;
      clearTimeout(closeTimer);
      if (!hasMenu) { clearTimeout(openTimer); if (openLi) close(); return; }
      if (openLi && !movingDown) open(li); // a menu is already open: switch now
      else if (openLi) openTimer = setTimeout(() => open(li), MENU_AIM_DELAY); // probably cutting across to the panel
      else openTimer = setTimeout(() => open(li), MENU_OPEN_DELAY);
    });
    li.addEventListener("pointerleave", () => clearTimeout(openTimer)); // swept past: never opens
    if (!hasMenu) return;
    // Touch/pen: first tap opens the panel, a second tap on the same item follows the link.
    li.firstElementChild.addEventListener("click", (e) => {
      if (DESKTOP.matches && lastPointer !== "mouse" && openLi !== li) { e.preventDefault(); open(li); }
    });
  });
  nav.addEventListener("pointerdown", (e) => (lastPointer = e.pointerType));
  nav.addEventListener("pointermove", (e) => { movingDown = e.clientY > lastY; lastY = e.clientY; });
  nav.addEventListener("pointerenter", () => clearTimeout(closeTimer));
  nav.addEventListener("pointerleave", (e) => {
    if (e.pointerType !== "mouse") return;
    clearTimeout(openTimer);
    closeTimer = setTimeout(close, MENU_CLOSE_DELAY);
  });
  // Keyboard: focus opens, leaving the nav closes, Esc closes and returns focus to the item.
  nav.addEventListener("focusin", (e) => { const li = e.target.closest(".nav-item"); open(li?.hasAttribute("data-cat") ? li : null); });
  nav.addEventListener("focusout", (e) => { if (!nav.contains(e.relatedTarget)) close(); });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || !openLi) return;
    const a = openLi.firstElementChild;
    close();
    if (nav.contains(document.activeElement)) { a.focus({ preventScroll: true }); close(); } // focusin reopened it
  });
  document.addEventListener("pointerdown", (e) => { if (openLi && !nav.contains(e.target)) close(); });
}

function renderFooter() {
  const shop = CATEGORIES.map((c) => `<li><a href="products.html?category=${c}">${c}</a></li>`).join("");
  document.querySelector(".site-footer").innerHTML = `<div class="wrap">
    <div class="footer-cols">
      <div class="footer-brand">
        <a class="wordmark" href="index.html"><span class="wm-text">Vision<em>Finder</em></span></a>
        <p>A home and living store you can search with a photo. Built as a student project at Hanoi University.</p>
      </div>
      <div><h4>Shop</h4><ul>${shop}</ul></div>
      <div><h4>Discover</h4><ul>
        <li><a href="products.html?new=1">New Arrivals</a></li>
        <li><a href="index.html#staff-picks">Staff Picks</a></li>
        <li><a href="products.html">All Products</a></li>
      </ul></div>
      <div><h4>Visual Search</h4><ul>
        <li><a href="search.html">Search by photo</a></li>
        <li><a href="search.html">Describe what you want</a></li>
        <li><a href="products.html?wishlist=1">Wishlist</a></li>
        <li><a href="cart.html">Your cart</a></li>
      </ul></div>
    </div>
    <p class="footer-credit">Product data © Amazon.com, Amazon Berkeley Objects (CC BY 4.0). Prices are for demo only.</p>
  </div>`;
}

renderHeader();
renderFooter();
window.addEventListener("storage", (e) => STORAGE_KEYS.includes(e.key) && updateCounts());
