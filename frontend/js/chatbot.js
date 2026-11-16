// Shopping assistant: a draggable chat button on every page (imported by layout.js).
// Rule-based, no LLM and no outside API: the message is cleaned up (Vietnamese keywords translated, filler dropped),
// then sent to the CLIP text or photo search in api.js. Follow-ups ("show more", "cheaper", "blue ones") refine the last results.
import { icon, escapeHtml, displayName, money, thumbOf, addToCart, toast, colorFamily, loadProducts } from "./common.js";
import { searchByText, searchByImage, THRESHOLD, THRESHOLD_LOW } from "./api.js";

const POOL = 36; // results fetched per search, so "show more" and filters have enough to work with
const PAGE = 4; // product cards per bot reply
const SIZE = 64; // launcher diameter, px (matches chatbot.css)
const EDGE = 16; // gap between launcher / panel and the screen edge, px
const GREET_DELAY = 900;
const CHIPS = ["Pillows", "Lamps", "Rugs", "Chairs", "Plants", "Mirrors"];
const KEY_CHAT = "vf_chat", KEY_POS = "vf_chat_pos";

// Vietnamese -> English. Checked in this order, so longer phrases ("rẻ hơn") win over their parts ("rẻ").
const VI = [
  ["tôi muốn mua", ""], ["tôi muốn", ""], ["muốn mua", ""], ["cho tôi", ""], ["giúp tôi", ""], ["tìm kiếm", ""], ["tìm", ""], ["mua", ""],
  ["rẻ hơn", "cheaper"], ["xem thêm", "show more"], ["xanh lá", "green"], ["xin chào", "hi"], ["cảm ơn", "thanks"], ["dưới", "under"],
  ["gối", "pillow"], ["đệm", "cushion"], ["đèn", "lamp"], ["thảm", "rug"], ["ghế", "chair"], ["bàn", "table"], ["gương", "mirror"],
  ["cây", "plant"], ["chậu", "planter"], ["bình", "vase"], ["giỏ", "basket"], ["kệ", "shelf"], ["tủ", "cabinet"], ["chăn", "blanket"],
  ["rèm", "curtain"], ["xanh", "blue"], ["đỏ", "red"], ["trắng", "white"], ["đen", "black"], ["gỗ", "wood"], ["nâu", "brown"],
  ["xám", "gray"], ["vàng", "yellow"], ["hồng", "pink"], ["rẻ", "cheap"], ["chào", "hi"],
].map(([vi, en]) => [new RegExp(`(^|[\\s,.!?])${vi}(?=$|[\\s,.!?])`, "gu"), `$1${en}`]);

// Color words the user can say -> colorFamily() families in common.js.
const COLORS = {
  blue: "Blue", navy: "Blue", teal: "Blue", red: "Red & Pink", pink: "Red & Pink", white: "White", black: "Black",
  gray: "Gray", grey: "Gray", green: "Green", brown: "Brown & Wood", wood: "Brown & Wood", wooden: "Brown & Wood",
  beige: "Cream & Beige", cream: "Cream & Beige", purple: "Purple", yellow: "Yellow & Orange", orange: "Yellow & Orange",
  gold: "Metallic", silver: "Metallic", brass: "Metallic", glass: "Clear",
};
// Lead-in words stripped one by one from the start: "hi, I want to buy a pillow" -> "pillow".
const FILLER = /^(?:(?:hi|hello|hey)[,!.]?|please|can you|could you|i(?: would like| 'd like|'d like| want| need| wanna| am looking for|'m looking for)|looking for|do you have|show me|find me|find|search for|search|get me|to buy|to get|to find|to see|buy|for|some|any|an?) /;
const PRICE = /(?:under|below|less than|max|up to|<)\s*\$?\s*(\d+(?:\.\d+)?)(?:\s*(?:dollars?|usd|bucks))?|\$(\d+(?:\.\d+)?)/;
const CHEAPER = /\b(?:cheaper|cheap|less expensive|lower price|budget)\b/;
const MORE = /\b(?:more|next)\b/;
// Words that only steer a follow-up; a message made only of these (plus colors) refines the last results.
const REFINE = /^(?:show|see|more|next|me|the|ones?|in|any|some|something|options?|them|those|please|cheaper|cheap|less|expensive|lower|price|budget|under|below|than|max|up|to|colou?r|dollars?|usd|bucks|\$?\d+(?:\.\d+)?|ok|okay|and|only|just)$/;
const STOP = new Set("the and for with from your you our this that into inch inches set pack piece pieces amazon brand".split(" "));

const $ = (sel, root = document) => root.querySelector(sel);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const store = {
  get(area, k) { try { return JSON.parse(area.getItem(k)); } catch { return null; } },
  set(area, k, v) { try { area.setItem(k, JSON.stringify(v)); } catch { /* blocked or full: state lives for this page only */ } },
};
// Assistant avatar: a friendly shop helper drawn inline (no image file). `id` keeps the clipPath unique per copy.
const avatar = (id) => `<svg class="vf-face" viewBox="0 0 64 64" aria-hidden="true">
  <defs><clipPath id="${id}"><circle cx="32" cy="32" r="32"/></clipPath></defs>
  <g clip-path="url(#${id})">
    <circle cx="32" cy="32" r="32" fill="#f3dccf"/>
    <path d="M10 64c1-13 10-20 22-20s21 7 22 20Z" fill="#b23a2e"/>
    <path d="M24 46l8 9 8-9" fill="#fff"/>
    <rect x="28" y="38" width="8" height="8" rx="3" fill="#e9b28f"/>
    <circle cx="32" cy="28" r="13" fill="#f5c6a5"/>
    <path d="M18.5 28c-1-9 5-16 13.5-16S46.5 19 45.5 28c-2.5-4-6-6.5-10-7.5-3 2.5-8 4-13 4-1.5 1-3 2-4 3.5Z" fill="#3a2621"/>
    <ellipse cx="27" cy="29" rx="1.6" ry="2" fill="#2b1d19"/>
    <ellipse cx="37" cy="29" rx="1.6" ry="2" fill="#2b1d19"/>
    <circle cx="23.5" cy="33" r="2.2" fill="#f19a8a" opacity=".7"/>
    <circle cx="40.5" cy="33" r="2.2" fill="#f19a8a" opacity=".7"/>
    <path d="M28 34.5q4 3.5 8 0" fill="none" stroke="#2b1d19" stroke-width="1.6" stroke-linecap="round"/>
  </g>
</svg>`;
// Waving hand that sticks out from the launcher's edge.
const HAND = `<svg class="vf-hand" viewBox="0 0 24 28" aria-hidden="true">
  <path d="M7 27c-2-4-4-9-4-13 0-1.4 2-1.6 2.6-.3L7 17V6.5c0-1.6 2.5-1.6 2.5 0V14V4.5c0-1.6 2.5-1.6 2.5 0V14V5.5c0-1.6 2.5-1.6 2.5 0V14.5V8c0-1.6 2.5-1.6 2.5 0v9c0 4.5-1.5 7.5-3.5 10Z" fill="#f5c6a5" stroke="#c98d6c" stroke-width="1" stroke-linejoin="round"/>
</svg>`;
const SEND_ICON = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12 20 4l-5 16-3.5-6.5L4 12Z"/><path d="m11.5 13.5 4-4"/></svg>';

// ---- state: history + last results in sessionStorage, launcher position in localStorage ----
const saved = store.get(sessionStorage, KEY_CHAT);
const msgs = Array.isArray(saved?.msgs) ? saved.msgs : [];
let last = saved?.last ?? null; // { q, color, max, prefer, offset, shown: [ids], pool: [[id, score]] }
const save = () => store.set(sessionStorage, KEY_CHAT, { msgs: msgs.slice(-40), last });
let pos = store.get(localStorage, KEY_POS);
if (!pos || !["left", "right"].includes(pos.side) || !Number.isFinite(pos.y)) pos = { side: "right", y: innerHeight - SIZE - EDGE };

// ---- DOM ----
document.head.append(Object.assign(document.createElement("link"), { rel: "stylesheet", href: "css/chatbot.css" }));
const root = document.createElement("div");
root.className = "vf-chat";
root.innerHTML = `
  <div class="vf-greet" hidden>
    <button class="vf-greet-open" type="button"><strong>How can I help you?</strong><span>Find a piece by words or photo</span></button>
    <button class="vf-greet-x" type="button" aria-label="Dismiss">${icon("close")}</button>
  </div>
  <button class="vf-launch" type="button" aria-label="Open shopping assistant" aria-expanded="false" aria-controls="vf-panel">${avatar("vf-clip-a")}${HAND}<span class="vf-online"></span></button>
  <section class="vf-panel" id="vf-panel" role="dialog" aria-label="Shopping assistant">
    <header class="vf-head">
      <span class="vf-avatar">${avatar("vf-clip-b")}</span>
      <span><strong>Shopping assistant</strong><small>Finds pieces in our catalog</small></span>
      <button class="vf-close" type="button" aria-label="Close chat">${icon("close")}</button>
    </header>
    <ol class="vf-log" aria-live="polite"></ol>
    <form class="vf-form">
      <label class="vf-photo" title="Search with a photo">${icon("camera")}<span class="sr-only">Send a photo</span><input type="file" accept="image/*" class="sr-only"></label>
      <label class="sr-only" for="vf-input">Message</label>
      <input id="vf-input" class="vf-input" type="text" placeholder="Describe what you're looking for…" autocomplete="off" maxlength="200">
      <button class="vf-send" type="submit" aria-label="Send">${SEND_ICON}</button>
    </form>
  </section>`;
document.body.append(root);
const launch = $(".vf-launch", root), panel = $(".vf-panel", root), log = $(".vf-log", root);
const greet = $(".vf-greet", root), input = $(".vf-input", root), photo = $(".vf-photo input", root);

// ---- placement: launcher snaps to the left or right edge; greeting + panel open next to it, inside the screen ----
function place() {
  const vw = document.documentElement.clientWidth, vh = innerHeight;
  pos.y = clamp(pos.y, EDGE, vh - SIZE - EDGE);
  launch.style.left = `${pos.side === "left" ? EDGE : vw - SIZE - EDGE}px`;
  launch.style.top = `${pos.y}px`;
  root.dataset.side = pos.side;
  const above = pos.y + SIZE / 2 > vh / 2; // launcher in the lower half: open upwards
  const pw = Math.min(380, vw - 2 * EDGE), ph = Math.min(580, vh - 2 * EDGE);
  Object.assign(panel.style, {
    width: `${pw}px`, height: `${ph}px`,
    left: `${pos.side === "left" ? EDGE : vw - pw - EDGE}px`,
    top: `${clamp(above ? pos.y - ph - 12 : pos.y + SIZE + 12, EDGE, vh - ph - EDGE)}px`,
    transformOrigin: `${pos.side} ${above ? "bottom" : "top"}`,
  });
  if (!greet.hidden) {
    const gw = greet.offsetWidth, gh = greet.offsetHeight;
    const gap = 14; // room for the bubble's tail
    const left = pos.side === "left" ? EDGE + SIZE + gap : vw - SIZE - EDGE - gap - gw;
    greet.style.left = `${clamp(left, EDGE, vw - gw - EDGE)}px`;
    greet.style.top = `${clamp(pos.y + SIZE / 2 - gh / 2, EDGE, vh - gh - EDGE)}px`;
  }
}
place();
requestAnimationFrame(() => root.classList.add("is-ready")); // enable the snap transition only after the first placement
addEventListener("resize", place);

// ---- drag (mouse + touch): a press that moves > 6 px drags; otherwise it is a click that opens the chat ----
let drag = null, dragged = false;
launch.addEventListener("pointerdown", (e) => {
  if (e.button !== 0) return;
  drag = { dx: e.clientX - launch.offsetLeft, dy: e.clientY - launch.offsetTop, x0: e.clientX, y0: e.clientY };
  dragged = false;
  launch.setPointerCapture(e.pointerId);
});
launch.addEventListener("pointermove", (e) => {
  if (!drag) return;
  if (!dragged && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 6) return;
  dragged = true;
  root.classList.add("is-dragging");
  launch.style.left = `${clamp(e.clientX - drag.dx, 0, innerWidth - SIZE)}px`;
  launch.style.top = `${clamp(e.clientY - drag.dy, 0, innerHeight - SIZE)}px`;
});
const toggle = () => (panel.classList.contains("is-open") ? close() : open());
function endDrag(e) {
  if (!drag) return;
  drag = null;
  if (!dragged) { if (e.type === "pointerup") toggle(); return; } // a tap: touch does not always fire a click
  root.classList.remove("is-dragging");
  pos = { side: launch.offsetLeft + SIZE / 2 < innerWidth / 2 ? "left" : "right", y: launch.offsetTop };
  store.set(localStorage, KEY_POS, pos);
  place();
}
launch.addEventListener("pointerup", endDrag);
launch.addEventListener("pointercancel", endDrag);
launch.addEventListener("click", (e) => e.detail === 0 && toggle()); // keyboard (Enter/Space) only; pointers use pointerup

// ---- greeting bubble: shown next to the launcher on every page while the chat is closed ----
let greetOff = false; // the user dismissed it on this page
function hideGreet() {
  greet.classList.remove("is-on");
  greet.hidden = true;
}
function showGreet() {
  if (greetOff || panel.classList.contains("is-open")) return;
  greet.hidden = false;
  place();
  requestAnimationFrame(() => greet.classList.add("is-on"));
}
setTimeout(showGreet, GREET_DELAY);
$(".vf-greet-open", root).addEventListener("click", () => open());
$(".vf-greet-x", root).addEventListener("click", () => { greetOff = true; hideGreet(); });

// ---- open / close ----
let byId = new Map();
const ready = loadProducts().then((ps) => {
  byId = new Map(ps.map((p) => [p.id, p]));
  return ps;
});
async function open() {
  hideGreet();
  place();
  panel.classList.add("is-open");
  launch.setAttribute("aria-expanded", "true");
  input.focus({ preventScroll: true });
  if (log.childElementCount) return;
  await ready;
  if (!msgs.length) push({ from: "bot", text: "Hi! Tell me what you're looking for, describe it, or send a photo.", chips: CHIPS });
  else log.innerHTML = msgs.map(msgHtml).join("");
  scrollDown(false);
}
function close() {
  panel.classList.remove("is-open");
  launch.setAttribute("aria-expanded", "false");
  setTimeout(showGreet, 400);
  if (panel.contains(document.activeElement)) launch.focus({ preventScroll: true });
}
$(".vf-close", root).addEventListener("click", close);
document.addEventListener("keydown", (e) => e.key === "Escape" && panel.classList.contains("is-open") && close());

// ---- messages ----
function itemHtml([id, score]) {
  const p = byId.get(id);
  if (!p) return "";
  const name = escapeHtml(displayName(p.name));
  return `<li class="vf-item">
    <a href="product.html?id=${encodeURIComponent(id)}"><img src="${p.thumb ?? thumbOf(p.image)}" alt="" width="56" height="56" loading="lazy">
      <span class="vf-item-text"><span class="vf-item-name">${name}</span>
      <span class="vf-item-meta"><b>${money(p.price)}</b> · ${Math.round(score * 100)}% similar</span></span></a>
    <button class="vf-add" type="button" data-add="${escapeHtml(id)}" aria-label="Add ${name} to cart">${icon("bag")}<span>Add to cart</span></button>
  </li>`;
}
function msgHtml(m) {
  return `<li class="vf-msg vf-${m.from === "user" ? "user" : "bot"}">
    ${m.img ? `<img class="vf-sent" src="${escapeHtml(m.img)}" alt="Your photo">` : ""}
    ${m.text ? `<p>${escapeHtml(m.text)}</p>` : ""}
    ${m.items?.length ? `<ul class="vf-items">${m.items.map(itemHtml).join("")}</ul>` : ""}
    ${m.chips ? `<div class="vf-chips">${m.chips.map((c) => `<button type="button" data-chip="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join("")}</div>` : ""}
  </li>`;
}
function push(m) {
  msgs.push(m);
  save();
  log.insertAdjacentHTML("beforeend", msgHtml(m));
  scrollDown();
}
function scrollDown(smooth = true) {
  log.scrollTo({ top: log.scrollHeight, behavior: smooth && !matchMedia("(prefers-reduced-motion: reduce)").matches ? "smooth" : "auto" });
}
// Typing dots while waiting; at least 500 ms so a fast backend still reads as a reply.
async function typing(work) {
  log.insertAdjacentHTML("beforeend", `<li class="vf-msg vf-bot vf-typing" aria-label="Assistant is typing"><span></span><span></span><span></span></li>`);
  scrollDown();
  try {
    return (await Promise.all([work, delay(500)]))[0];
  } finally {
    $(".vf-typing", log)?.remove();
  }
}

log.addEventListener("click", (e) => {
  const add = e.target.closest("[data-add]"), chip = e.target.closest("[data-chip]");
  if (add) { addToCart(add.dataset.add); toast("Added to cart"); }
  if (chip) send(chip.dataset.chip);
});
$(".vf-form", root).addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  input.value = "";
  if (text) send(text);
});
photo.addEventListener("change", () => {
  const f = photo.files[0];
  photo.value = "";
  if (f) queue = queue.then(() => askPhoto(f));
});

// One message at a time, in order.
let queue = Promise.resolve();
function send(text) {
  push({ from: "user", text });
  queue = queue.then(() => answer(text));
}

// ---- understanding ----
export function clean(text) {
  let t = ` ${text.normalize("NFC").toLowerCase()} `;
  for (const [re, en] of VI) t = t.replace(re, en);
  t = t.replace(/[“”"!?,]+/g, " ").replace(/\S*[^\x00-\x7f]\S*/g, " ").replace(/\s+/g, " ").trim(); // drop untranslated Vietnamese
  let prev;
  do { prev = t; t = `${t} `.replace(FILLER, "").trim(); } while (t !== prev);
  return t;
}
export function parse(t) {
  const words = t.match(/[a-z0-9$.']+/g) ?? [];
  const price = t.match(PRICE);
  return {
    more: MORE.test(t),
    cheaper: CHEAPER.test(t),
    max: price ? +(price[1] ?? price[2]) : null,
    color: words.find((w) => COLORS[w]) ?? null,
    rest: words.filter((w) => !REFINE.test(w) && !COLORS[w]),
    q: t.replace(PRICE, " ").replace(CHEAPER, " ").replace(/\s+/g, " ").trim(),
  };
}
// Words the catalog knows: product types, categories, colors, a few synonyms, and name words used by 3+ products
// (rarer name words like "weather" in "all-weather" would make any chit-chat look like a search).
let vocab;
async function knows(words) {
  if (!vocab) {
    const ps = await ready, count = new Map();
    for (const p of ps) for (const w of new Set(p.name.toLowerCase().split(/[^a-z]+/))) count.set(w, (count.get(w) ?? 0) + 1);
    vocab = new Set([...count].filter(([, n]) => n >= 3).map(([w]) => w)
      .concat(ps.flatMap((p) => `${p.category} ${p.product_type.replace(/_/g, " ")}`.toLowerCase().split(" ")), Object.keys(COLORS),
        "cushion couch sofa furniture decor lighting light plant mirror curtain blanket throw".split(" "))
      .filter((w) => w.length > 2 && !STOP.has(w)));
  }
  return words.some((w) => [w, w.replace(/s$/, ""), w.replace(/es$/, "")].some((x) => vocab.has(x)));
}

async function answer(text) {
  const t = clean(text);
  if (!t || /^good (?:morning|afternoon|evening)$/.test(t)) // only a greeting or filler ("hi", "tôi muốn mua")
    return push({ from: "bot", text: "Hello! What can I help you find today?", chips: CHIPS });
  if (/^(?:thanks|thank you|thx|ty)\b/.test(t)) return push({ from: "bot", text: "You're welcome! Anything else?" });
  const ask = parse(t);
  const followUp = !ask.rest.length && (ask.more || ask.cheaper || ask.max != null || ask.color);
  if (followUp) {
    if (!last) return push({ from: "bot", text: "What are you looking for? Pick one or describe it.", chips: CHIPS });
    return refine(ask);
  }
  if (!ask.rest.length || !(await knows(ask.rest)))
    return push({ from: "bot", text: "Sorry, I didn't catch that. What kind of piece are you looking for?", chips: CHIPS });
  return newSearch(ask);
}

async function run(search) {
  try {
    return await typing(search);
  } catch (err) {
    if (!(err.status < 500)) console.error(err);
    push({ from: "bot", text: "Sorry, search isn't working right now. Please try again in a moment." });
    return null;
  }
}
const toPool = (res) => res.results.map(({ product, score }) => [product.id, score]);

async function newSearch(ask) {
  const res = await run(searchByText(ask.q, POOL));
  if (!res) return;
  last = { q: ask.q, color: null, prefer: COLORS[ask.color] ?? null, max: ask.max, cheapFirst: ask.cheaper, offset: 0, pool: toPool(res) };
  const under = ask.max != null ? ` under ${money(ask.max)}` : "";
  reply(`Here's what I found for “${ask.q}”${under}.`, res.results.length ? `I couldn't find “${ask.q}”${under}. Try one of these:` : "I couldn't find anything for that. Try one of these:");
}

async function refine(ask) {
  const parts = [];
  if (ask.color) {
    const fam = COLORS[ask.color];
    if (last.q && fam !== last.color) { // ask CLIP again with the color; keep the kinds of product already on screen
      const res = await run(searchByText(`${last.q} ${ask.color}`, POOL));
      if (!res) return;
      const types = new Set(last.pool.slice(0, 2 * PAGE).map(([id]) => byId.get(id)?.product_type));
      const seen = new Set(last.pool.map(([id]) => id));
      last.pool = [...last.pool, ...toPool(res).filter(([id]) => !seen.has(id) && types.has(byId.get(id)?.product_type))];
    }
    last.color = fam;
    parts.push(`${ask.color} ones`);
  }
  if (ask.cheaper && ask.max == null) { // cheaper than the cheapest card on screen
    const shown = (last.shown ?? []).map((id) => byId.get(id)?.price).filter(Number.isFinite);
    last.max = Math.min(last.max ?? Infinity, Math.floor(Math.min(...shown)));
  }
  if (ask.max != null) last.max = ask.max;
  if ((ask.cheaper || ask.max != null) && Number.isFinite(last.max)) parts.push(`options under ${money(last.max)}`);
  last.offset = ask.more && !parts.length ? last.offset + PAGE : 0;
  if (!parts.length) return reply("Here are more.", "That's everything I found. Want to try something else?");
  reply(`Here are ${parts.join(", ")}.`, `I couldn't find ${parts.join(", ")} in these results. Try something else?`);
}

// Filter + sort the pool by the current refinements and show the next PAGE cards.
function reply(found, none = found) {
  let list = last.pool.filter(([id]) => {
    const p = byId.get(id);
    return p && (!last.color || colorFamily(p.color) === last.color) && (last.max == null || p.price < last.max);
  });
  if (last.prefer) list = [...list.filter(([id]) => colorFamily(byId.get(id).color) === last.prefer), ...list.filter(([id]) => colorFamily(byId.get(id).color) !== last.prefer)];
  if (last.cheapFirst) list = [...list].sort((a, b) => byId.get(a[0]).price - byId.get(b[0]).price);
  const items = list.slice(last.offset, last.offset + PAGE);
  if (items.length) last.shown = items.map(([id]) => id);
  push(items.length ? { from: "bot", text: found, items } : { from: "bot", text: none, chips: CHIPS });
}

// ---- photo ----
async function thumbUrl(file) {
  const bmp = await createImageBitmap(file);
  const s = 240 / Math.max(bmp.width, bmp.height);
  const c = Object.assign(document.createElement("canvas"), { width: Math.round(bmp.width * s), height: Math.round(bmp.height * s) });
  c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.8);
}
async function askPhoto(file) {
  if (!file.type.startsWith("image/")) return push({ from: "bot", text: "That doesn't look like an image. Try a JPEG, PNG or WebP photo." });
  let img;
  try { img = await thumbUrl(file); } catch { return push({ from: "bot", text: "I couldn't open that photo. Try another one." }); }
  push({ from: "user", img });
  const res = await run(searchByImage(file));
  if (!res) return;
  const best = res.results[0]?.score ?? 0;
  // Same rule as search.js: the backend's confidence when it sends one, else compare with the thresholds.
  const level = res.confidence ?? (res.match ?? best >= THRESHOLD ? "high" : best >= THRESHOLD_LOW ? "medium" : "low");
  if (!res.results.length || level === "low") {
    last = null;
    return push({ from: "bot", text: "I couldn't find a close match. Try a closer photo, or pick a category:", chips: CHIPS });
  }
  last = { q: null, color: null, prefer: null, max: null, offset: 0, pool: toPool(res) };
  reply(level === "high" ? "I found it!" : "Here are similar pieces.");
}
