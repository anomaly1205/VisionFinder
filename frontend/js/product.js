import { crumbs, markNav } from "./layout.js";
import { productById, productCard, displayName, escapeHtml, money, typeLabel, getSaved, addToCart, sendToSearch, toast, icon, thumbOf } from "./common.js";
import { similar } from "./api.js";

const $ = (id) => document.getElementById(id);
const id = new URLSearchParams(location.search).get("id");
const p = id && (await productById(id));

if (!p) {
  document.title = "Product not found · VisionFinder Home";
  $("crumbs").innerHTML = crumbs([["Home", "index.html"], ["Not found"]]);
  $("pdp").innerHTML = `<div class="empty"><h1>Product not found</h1>
    <p>This piece may have been removed, or the link is wrong.</p>
    <a class="btn" href="products.html">Browse all products</a></div>`;
} else {
  const name = displayName(p.name);
  const gallery = [...new Set([p.image, ...p.gallery])];
  document.title = `${name} · VisionFinder Home`;
  markNav(p.category);
  $("crumbs").innerHTML = crumbs([["Home", "index.html"], [p.category, `products.html?category=${p.category}`],
    [typeLabel(p.product_type), `products.html?category=${p.category}&sub=${p.product_type}`], [name]]);

  $("pdp").innerHTML = `<div class="pdp">
    <div class="pdp-media">
      <div class="tile pdp-main"><img id="main-img" src="${gallery[0]}" alt="${escapeHtml(name)}"></div>
      ${gallery.length > 1 ? `<div class="thumbs" role="group" aria-label="Product photos">${gallery.map((src, i) =>
        `<button type="button" class="tile" data-src="${src}" aria-label="Photo ${i + 1}" aria-pressed="${i === 0}"><img src="${thumbOf(src)}" alt="" loading="lazy"></button>`).join("")}</div>` : ""}
    </div>
    <div class="pdp-info">
      <p class="eyebrow">${escapeHtml(p.brand || p.category)}</p>
      <h1>${escapeHtml(name)}</h1>
      <p class="pdp-price">${money(p.price)} <small>Demo price</small></p>
      <dl class="pdp-facts">
        ${p.color ? `<div><dt>Color</dt><dd>${escapeHtml(p.color)}</dd></div>` : ""}
        <div><dt>Category</dt><dd><a href="products.html?category=${p.category}">${p.category}</a> / ${typeLabel(p.product_type)}</dd></div>
      </dl>
      <div class="pdp-buy">
        <div class="qty" role="group" aria-label="Quantity">
          <button type="button" data-step="-1" aria-label="Decrease quantity">${icon("minus")}</button>
          <input id="qty" type="number" min="1" max="99" value="1" inputmode="numeric" aria-label="Quantity">
          <button type="button" data-step="1" aria-label="Increase quantity">${icon("plus")}</button>
        </div>
        <button class="btn pdp-add" type="button" id="add">Add to cart</button>
        <button class="heart pdp-heart" type="button" data-save="${escapeHtml(p.id)}" aria-pressed="${getSaved().includes(p.id)}" aria-label="Save to wishlist">${icon("heart")}</button>
      </div>
      <button class="btn btn-outline pdp-similar" type="button" id="find-similar">${icon("camera")} Find similar with AI</button>
    </div>
  </div>`;

  // Gallery
  $("pdp").querySelector(".thumbs")?.addEventListener("click", (e) => {
    const b = e.target.closest("[data-src]");
    if (!b) return;
    $("main-img").src = b.dataset.src;
    b.parentElement.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", x === b));
  });

  // Quantity + cart
  const qty = $("qty");
  const clamp = (n) => Math.min(99, Math.max(1, Math.round(n) || 1));
  $("pdp").querySelector(".qty").addEventListener("click", (e) => {
    const b = e.target.closest("[data-step]");
    if (b) qty.value = clamp(+qty.value + +b.dataset.step);
  });
  qty.addEventListener("change", () => (qty.value = clamp(+qty.value)));
  $("add").addEventListener("click", () => {
    addToCart(p.id, clamp(+qty.value));
    toast("Added to cart");
  });

  // Search with this product's main photo
  $("find-similar").addEventListener("click", async () => sendToSearch(await (await fetch(gallery[0])).blob()));

  // Visually similar
  try {
    const { results } = await similar(p.id);
    const list = results.filter((r) => r.product.id !== p.id).slice(0, 8);
    if (list.length) {
      $("similar-grid").innerHTML = list.map((r) => productCard(r.product)).join("");
      $("similar").hidden = false;
    }
  } catch (err) {
    console.error(err); // similar items are optional; the product page still works
  }
}
