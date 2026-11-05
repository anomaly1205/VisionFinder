import { crumbs } from "./layout.js";
import { loadProducts, getCart, setCart, productCard, displayName, escapeHtml, money, icon } from "./common.js";

const products = await loadProducts();
const byId = new Map(products.map((p) => [p.id, p]));
const box = document.getElementById("cart");
document.getElementById("crumbs").innerHTML = crumbs([["Home", "index.html"], ["Cart"]]);

function render() {
  const rows = getCart().filter((i) => byId.has(i.id)); // drop items no longer in the catalog
  if (!rows.length) {
    const picks = products.slice(-4).reverse();
    box.innerHTML = `<div class="empty">
        <p>Your cart is empty.</p>
        <a class="btn" href="products.html">Continue shopping</a>
      </div>
      <section class="similar" aria-labelledby="sugg-title">
        <div class="section-head"><h2 id="sugg-title">You might like</h2></div>
        <div class="grid-4">${picks.map((p) => productCard(p)).join("")}</div>
      </section>`;
    return;
  }
  const subtotal = rows.reduce((s, i) => s + byId.get(i.id).price * i.qty, 0);
  box.innerHTML = `<div class="cart-layout">
    <ul class="cart-list">${rows.map(({ id, qty }) => {
      const p = byId.get(id), href = `product.html?id=${encodeURIComponent(id)}`, name = escapeHtml(displayName(p.name));
      return `<li class="cart-row" data-id="${escapeHtml(id)}">
        <a class="tile" href="${href}" tabindex="-1" aria-hidden="true"><img src="${p.image}" alt=""></a>
        <div class="cart-info">
          <a class="card-title" href="${href}">${name}</a>
          <p class="card-brand">${escapeHtml(p.brand || p.category)}</p>
          <p class="cart-unit">${money(p.price)}</p>
        </div>
        <div class="qty" role="group" aria-label="Quantity for ${name}">
          <button type="button" data-step="-1" aria-label="Decrease quantity"${qty <= 1 ? " disabled" : ""}>${icon("minus")}</button>
          <output aria-live="polite">${qty}</output>
          <button type="button" data-step="1" aria-label="Increase quantity"${qty >= 99 ? " disabled" : ""}>${icon("plus")}</button>
        </div>
        <p class="cart-line">${money(p.price * qty)}</p>
        <button class="cart-remove" type="button" data-remove aria-label="Remove ${name}">${icon("trash")}</button>
      </li>`;
    }).join("")}</ul>
    <aside class="cart-summary" aria-label="Order summary">
      <h2>Summary</h2>
      <dl>
        <div><dt>Subtotal</dt><dd id="subtotal">${money(subtotal)}</dd></div>
        <div><dt>Shipping</dt><dd>Free</dd></div>
        <div class="total"><dt>Total</dt><dd id="total">${money(subtotal)}</dd></div>
      </dl>
      <button class="btn" type="button" id="checkout">Checkout</button>
      <p class="checkout-note" id="checkout-note" role="status"></p>
    </aside>
  </div>`;
}

box.addEventListener("click", (e) => {
  if (e.target.closest("#checkout")) {
    document.getElementById("checkout-note").textContent = "Checkout is not available in this demo.";
    return;
  }
  const row = e.target.closest(".cart-row");
  if (!row) return;
  const step = e.target.closest("[data-step]"), remove = e.target.closest("[data-remove]");
  if (!step && !remove) return;
  let items = getCart();
  if (remove) items = items.filter((i) => i.id !== row.dataset.id);
  else {
    const it = items.find((i) => i.id === row.dataset.id);
    if (it) it.qty = Math.min(99, Math.max(1, it.qty + +step.dataset.step));
  }
  setCart(items);
  render();
  // keep keyboard focus on the same control after re-render
  if (step) box.querySelector(`.cart-row[data-id="${CSS.escape(row.dataset.id)}"] [data-step="${step.dataset.step}"]`)?.focus();
});
window.addEventListener("storage", render); // another tab changed the cart
render();
