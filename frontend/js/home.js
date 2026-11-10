import "./layout.js";
import { CATEGORIES, loadProducts, productCard, sendToSearch, escapeHtml, icon, displayName } from "./common.js";

// ---- Find it with AI block ----
document.getElementById("dz-icon").innerHTML = icon("camera");
["camera", "crop", "search"].forEach((n, i) => (document.getElementById(`step-${i + 1}`).innerHTML = icon(n)));

const dz = document.getElementById("dropzone");
const fileInput = document.getElementById("file-input");
const takeFile = (file) => file?.type.startsWith("image/") && sendToSearch(file);

fileInput.addEventListener("change", () => takeFile(fileInput.files[0]));
["dragenter", "dragover"].forEach((t) => dz.addEventListener(t, (e) => { e.preventDefault(); dz.classList.add("is-over"); }));
["dragleave", "drop"].forEach((t) => dz.addEventListener(t, () => dz.classList.remove("is-over")));
dz.addEventListener("drop", (e) => { e.preventDefault(); takeFile(e.dataTransfer.files[0]); });
document.addEventListener("paste", (e) => {
  if (e.target.closest("input")) return; // let text paste into fields
  const item = [...e.clipboardData.items].find((i) => i.type.startsWith("image/"));
  if (item) takeFile(item.getAsFile());
});

const products = await loadProducts();
const byCat = Object.fromEntries(CATEGORIES.map((c) => [c, products.filter((p) => p.category === c)]));

// Samples: an alternate angle of a catalog product, so the true match is known.
// The % on hover is illustrative only; the real score comes from search.html.
const samples = document.getElementById("samples");
const SAMPLE_PCT = [94, 88, 81];
for (const [i, cat] of ["Furniture", "Lighting", "Plants"].entries()) {
  const p = byCat[cat].find((x) => x.query_images.length);
  if (!p) continue;
  const b = document.createElement("button");
  b.type = "button";
  b.className = "sample";
  b.title = `Sample photo: ${displayName(p.name)}`;
  b.innerHTML = `<img src="${p.query_images[0]}" alt="Sample ${escapeHtml(cat.toLowerCase())} photo">
    <span class="sim" aria-hidden="true"><span class="sim-bar"><span style="--p:${SAMPLE_PCT[i]}%"></span></span>${SAMPLE_PCT[i]}%</span>`;
  b.addEventListener("click", async () => sendToSearch(await (await fetch(p.query_images[0])).blob()));
  samples.append(b);
}

// ---- Hero carousel: one big room shot per slide ----
// Picked by hand: catalog items whose main photo is a sharp room scene, not a white cutout.
const HERO = [
  { id: "B07B4ZZJSL", label: "Get The Look", title: "Rugs that set the tone",
    copy: "Flatweaves, shags and runners to anchor a room, from soft neutrals to bold pattern.",
    cta: `<a class="btn" href="products.html?category=Rugs">Shop Now</a>` },
  { id: "B07Q5ZWG11", label: "Get The Look", title: "A corner to slow down in",
    copy: "A plush shag rug, a deep armchair and warm light for the quiet end of the room.",
    cta: `<a class="btn" href="products.html?category=Rugs&sub=RUG">Shop Now</a>` },
  { id: "B07NZX6KDH", label: "Find It With AI", title: "Seen it somewhere? Find it here.",
    copy: "Search the whole catalog with a photo. We show the closest matches and how sure we are.",
    cta: `<a class="btn" href="search.html">${icon("camera")} Search by photo</a>` },
];
const slides = HERO.map((h) => ({ ...h, p: products.find((x) => x.id === h.id) })).filter((h) => h.p);
const slidesEl = document.getElementById("slides");
slidesEl.innerHTML = slides.map((s, i) => `
  <div class="slide${i === 0 ? " is-active" : ""}" role="group" aria-roledescription="slide" aria-label="${i + 1} of ${slides.length}">
    <a class="slide-media" href="product.html?id=${encodeURIComponent(s.p.id)}" tabindex="-1" aria-hidden="true"><img src="${s.p.image}" alt=""${i ? ' loading="lazy"' : ""}></a>
    <div class="slide-copy">
      <p class="eyebrow">${s.label}</p>
      <h2>${s.title}</h2><p>${s.copy}</p>${s.cta}
      <p class="slide-caption">Image: Amazon Berkeley Objects</p>
    </div>
  </div>`).join("") + `
  <button class="slide-arrow prev" type="button" data-step="-1" aria-label="Previous slide">${icon("left")}</button>
  <button class="slide-arrow next" type="button" data-step="1" aria-label="Next slide">${icon("right")}</button>`;
slidesEl.insertAdjacentHTML("afterend", `<div class="dots">${slides.map((_, i) =>
  `<button type="button" data-go="${i}" aria-label="Slide ${i + 1}" aria-current="${i === 0}"></button>`).join("")}</div>`);
const dots = slidesEl.nextElementSibling;

let current = 0;
const go = (n) => {
  current = (n + slides.length) % slides.length;
  slidesEl.querySelectorAll(".slide").forEach((el, i) => el.classList.toggle("is-active", i === current));
  dots.querySelectorAll("button").forEach((el, i) => el.setAttribute("aria-current", i === current));
};
let timer = setInterval(() => go(current + 1), 7000);
const stop = () => clearInterval(timer); // user took control: stop autoplay
slidesEl.addEventListener("click", (e) => { const b = e.target.closest("[data-step]"); if (b) { stop(); go(current + +b.dataset.step); } });
dots.addEventListener("click", (e) => { const b = e.target.closest("[data-go]"); if (b) { stop(); go(+b.dataset.go); } });
slidesEl.parentElement.addEventListener("focusin", stop);

// ---- Product rows ----
// New Arrivals: round robin across categories for variety.
const newArrivals = [];
for (let i = 0; newArrivals.length < 12; i++) newArrivals.push(byCat[CATEGORIES[i % 7]][10 + Math.floor(i / 7)]);
document.getElementById("new-arrivals").innerHTML = newArrivals.map((p) => productCard(p)).join("");

document.getElementById("cat-grid").innerHTML = CATEGORIES.map((c) => `
  <a class="cat-item" href="products.html?category=${c}">
    <span class="tile"><img src="${byCat[c][0].thumb}" alt="" loading="lazy"></span>
    <span>${c}</span>
  </a>`).join("");

// Staff Picks: the priciest piece per category, top 8.
const picks = CATEGORIES.flatMap((c) => [...byCat[c]].sort((a, b) => b.price - a.price).slice(0, 2)).slice(0, 8);
document.getElementById("staff-grid").innerHTML = picks.map((p) => productCard(p)).join("");

// ---- Promo banners (images: room shots of B07QC89FJG and B07QFB1ZBR, set in index.html) ----
// Demo only: nothing is sent anywhere.
document.getElementById("subscribe").addEventListener("submit", (e) => {
  e.preventDefault();
  e.target.hidden = true;
  document.getElementById("subscribe-done").hidden = false;
});

// ---- Stats band: counts come from the catalog, not hard-coded ----
const fmt = (n) => n.toLocaleString("en-US");
document.getElementById("stat-pieces").textContent = fmt(products.length);
document.getElementById("stat-cats").textContent = new Set(products.map((p) => p.category)).size;
document.getElementById("stat-photos").textContent = fmt(new Set(products.flatMap((p) => [p.image, ...p.gallery, ...p.query_images])).size);
["grid", "image", "spark"].forEach((n, i) => (document.getElementById(`stat-icon-${i + 1}`).innerHTML = icon(n, "icon stat-icon")));

// ---- Phone band: real QR code to the camera search on this site ----
document.getElementById("soon-ios").innerHTML = icon("phone");
document.getElementById("soon-android").innerHTML = icon("phone");
const qrUrl = `${location.origin}/search.html?camera=1`;
const qrEl = document.getElementById("qr");
qrEl.title = qrUrl;
// qrcodejs is a deferred classic script, so it has run before this module.
if (window.QRCode) new window.QRCode(qrEl, { text: qrUrl, width: 132, height: 132, colorDark: "#111111", colorLight: "#ffffff", correctLevel: window.QRCode.CorrectLevel.M });
else qrEl.innerHTML = `<a href="search.html?camera=1">${qrUrl}</a>`;
