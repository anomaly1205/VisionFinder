import { crumbs } from "./layout.js";
import { CATEGORIES, productCard, escapeHtml, icon, loadProducts, keywordSearch } from "./common.js";
import { searchByImage, searchByText, THRESHOLD, THRESHOLD_LOW } from "./api.js";

const $ = (id) => document.getElementById(id);
document.querySelector("main").insertAdjacentHTML("afterbegin", crumbs([["Home", "index.html"], ["AI Visual Search"]]));
document.getElementById("dz-icon").innerHTML = icon("camera");

const dz = $("dropzone"), fileInput = $("file-input"), crop = $("crop"), cropImg = $("crop-img");
const textForm = $("text-form"), textQ = $("text-q");
let cropper, objectUrl;

// ---- tabs: photo / description ----
const tabs = [...document.querySelectorAll('[role="tab"]')];
function showTab(tab) {
  for (const t of tabs) {
    const on = t === tab;
    t.setAttribute("aria-selected", on);
    t.tabIndex = on ? 0 : -1;
    $(t.getAttribute("aria-controls")).hidden = !on;
  }
}
tabs.forEach((t, i) => {
  t.addEventListener("click", () => showTab(t));
  t.addEventListener("keydown", (e) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!step) return;
    const next = tabs[(i + step + tabs.length) % tabs.length];
    showTab(next);
    next.focus();
  });
});

// ---- photo: pick, drop, paste, or handed over from another page ----
function loadPhoto(blob) {
  if (!blob?.type.startsWith("image/")) return;
  cropper?.destroy();
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = URL.createObjectURL(blob);
  cropImg.src = objectUrl;
  dz.hidden = camBtn.hidden = true;
  crop.hidden = false;
  // Cropper.js is a deferred classic script; module scripts run after it, so window.Cropper exists.
  cropper = new window.Cropper(cropImg, {
    viewMode: 1, autoCropArea: 1, background: false, zoomable: false,
    ready: () => run(),
  });
}
function clearPhoto() {
  cropper?.destroy();
  cropper = undefined;
  crop.hidden = true;
  dz.hidden = camBtn.hidden = false;
  fileInput.value = camInput.value = "";
}
const cropBlob = () => new Promise((res) =>
  cropper.getCroppedCanvas({ maxWidth: 1024, maxHeight: 1024, fillColor: "#fff" }).toBlob(res, "image/jpeg", 0.92));

fileInput.addEventListener("change", () => loadPhoto(fileInput.files[0]));
// Camera: capture="environment" opens the rear camera on phones; desktop falls back to a file picker.
const camBtn = $("camera-btn"), camInput = $("camera-input");
$("cam-icon").innerHTML = icon("camera");
camInput.addEventListener("change", () => loadPhoto(camInput.files[0]));
["dragenter", "dragover"].forEach((t) => dz.addEventListener(t, (e) => { e.preventDefault(); dz.classList.add("is-over"); }));
["dragleave", "drop"].forEach((t) => dz.addEventListener(t, () => dz.classList.remove("is-over")));
dz.addEventListener("drop", (e) => { e.preventDefault(); loadPhoto(e.dataTransfer.files[0]); });
document.addEventListener("paste", (e) => {
  if (e.target.closest("input")) return;
  const item = [...e.clipboardData.items].find((i) => i.type.startsWith("image/"));
  if (item) loadPhoto(item.getAsFile());
});
$("clear-photo").addEventListener("click", () => { clearPhoto(); textQ.value.trim() ? run() : ($("results").hidden = true); });
$("search-photo").addEventListener("click", () => run());

// ---- description ----
textForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const q = textQ.value.trim();
  history.replaceState(null, "", q ? `?q=${encodeURIComponent(q)}` : location.pathname);
  run();
});
const examples = ["light wood dining chair", "brass table lamp", "blue wool rug", "white ceramic vase", "woven storage basket"];
$("chips").insertAdjacentHTML("beforeend", examples.map((x) => `<button type="button">${x}</button>`).join(""));
$("chips").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  textQ.value = b.textContent;
  textForm.requestSubmit();
});

// ---- run + render ----
let runId = 0;
async function run() {
  const q = textQ.value.trim();
  if (!cropper && !q) return textQ.focus();
  const id = ++runId;
  const results = $("results");
  results.hidden = false;
  results.setAttribute("aria-busy", "true");
  $("results-title").textContent = "Searching…";
  $("results-meta").textContent = "";
  $("notice").hidden = true;
  $("kw-compare").hidden = true;
  $("results-grid").classList.add("is-loading");

  let res;
  try {
    res = cropper ? await searchByImage(await cropBlob(), q) : await searchByText(q);
  } catch (err) {
    console.error(err);
    if (id !== runId) return;
    $("results-title").textContent = "Search failed";
    $("results-meta").textContent = "The search service returned an error. Try again in a moment.";
    $("results-grid").innerHTML = "";
    return done();
  }
  if (id !== runId) return; // a newer search started
  render(res, q);
  if (!cropper) { // description search: show what plain keyword search would have found
    const n = keywordSearch(await loadProducts(), q).length;
    if (id !== runId) return;
    $("kw-compare").hidden = false;
    $("kw-compare").innerHTML = `Keyword search found ${n} ${n === 1 ? "result" : "results"} for this query.${n ? ` <a href="products.html?q=${encodeURIComponent(q)}">See them</a>` : ""}`;
  }
  done();
}
function done() {
  $("results").removeAttribute("aria-busy");
  $("results-grid").classList.remove("is-loading");
}

function render({ results, ms, demo, match, confidence }, q) {
  const what = cropper ? (q ? `your photo + “${escapeHtml(q)}”` : "your photo") : `“${escapeHtml(q)}”`;
  const notice = $("notice"), grid = $("results-grid");
  $("results-meta").textContent = `${results.length} results · ${ms} ms${demo ? " · demo mode" : ""}`;

  if (!results.length) {
    $("results-title").innerHTML = `No matches for ${what}`;
    notice.hidden = false;
    notice.innerHTML = `<p>Try fewer or simpler words, or browse a category:</p>
      <div class="chips">${CATEGORIES.map((c) => `<a href="products.html?category=${c}">${c}</a>`).join("")}</div>`;
    grid.innerHTML = "";
    return;
  }
  const best = results[0].score;
  const photo = !!cropper; // thresholds are image-score bars; text scores use a different scale
  // Backend decides when it answers (older backends only send match); demo mode compares locally.
  const level = confidence ?? (match ?? best >= THRESHOLD ? "high" : best >= THRESHOLD_LOW ? "medium" : "low");
  if (photo && level === "low") {
    $("results-title").innerHTML = `Closest pieces to ${what}`;
    notice.hidden = false;
    notice.innerHTML = `<p><strong>No confident match.</strong> The best score is ${Math.round(best * 100)}%, below our ${Math.round(THRESHOLD_LOW * 100)}% bar. These are the nearest pieces, not the same item. A tighter crop or a clearer photo usually helps.</p>`;
  } else if (photo && level === "medium") {
    $("results-title").innerHTML = `Similar pieces to ${what}`;
  } else {
    $("results-title").innerHTML = `Matches for ${what}`;
  }
  grid.innerHTML = results.map(({ product, score }) => {
    const pct = Math.round(score * 100);
    return productCard(product, `<p class="match${photo && score < THRESHOLD_LOW ? " low" : ""}"><span style="--p:${pct}%"></span>${pct}% similar</p>`);
  }).join("");
}

// ---- start: photo handed over from another page, or ?q= from the header ----
const params = new URLSearchParams(location.search);
const q0 = params.get("q")?.trim();
if (params.has("camera")) { camBtn.classList.add("is-featured"); camInput.focus(); } // arrived from the QR code
if (q0) { textQ.value = q0; showTab($("tab-text")); }
let handed;
try { handed = sessionStorage.getItem("vf_query_image"); sessionStorage.removeItem("vf_query_image"); } catch { /* blocked */ }
if (handed) { showTab($("tab-photo")); loadPhoto(await (await fetch(handed)).blob()); }
else if (q0) run();
