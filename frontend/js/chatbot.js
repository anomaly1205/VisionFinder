// Shopping assistant: a draggable chat button on every page (imported by layout.js).
// Rule-based, no LLM and no outside API: the message is cleaned up (Vietnamese keywords translated, filler dropped),
// then sent to the CLIP text or photo search in api.js. Follow-ups ("show more", "cheaper", "blue ones") refine the last results.
import { icon, escapeHtml, displayName, money, thumbOf, addToCart, toast, colorFamily, loadProducts } from "./common.js";
import { searchByText, searchByImage, THRESHOLD, THRESHOLD_LOW } from "./api.js";
import { getUser } from "./account.js";

const POOL = 36; // results fetched per search, so "show more" and filters have enough to work with
const PAGE = 4; // product cards per bot reply
const SIZE = 64; // launcher diameter, px (matches chatbot.css)
const EDGE = 16; // gap between launcher / panel and the screen edge, px
const GREET_DELAY = 900;
const CHIPS = ["Pillows", "Lamps", "Rugs", "Chairs", "Plants", "Mirrors"];
const COLOR_CHIPS = ["Blue", "White", "Black", "Gray", "Green", "Brown", "Cream", "Any color"];
const BUDGET_CHIPS = ["Under $25", "$25–50", "$50+", "Any budget"];
const KEY_CHAT = "vf_chat", KEY_POS = "vf_chat_pos";

// Vietnamese -> English. Checked in this order, so longer phrases ("rẻ hơn") win over their parts ("rẻ").
const VI_PAIRS = [
  ["tôi muốn mua", ""], ["tôi muốn", ""], ["muốn mua", ""], ["cho tôi", ""], ["giúp tôi", ""], ["tìm kiếm", ""], ["tìm", ""], ["mua", ""],
  ["rẻ hơn", "cheaper"], ["xem thêm", "show more"], ["xanh lá", "green"], ["xin chào", "hi"], ["cảm ơn", "thanks"], ["dưới", "under"],
  ["gối", "pillow"], ["đệm", "cushion"], ["đèn", "lamp"], ["thảm", "rug"], ["ghế", "chair"], ["bàn", "table"], ["gương", "mirror"],
  ["cây", "plant"], ["chậu", "planter"], ["bình", "vase"], ["giỏ", "basket"], ["kệ", "shelf"], ["tủ", "cabinet"], ["chăn", "blanket"],
  ["rèm", "curtain"], ["xanh", "blue"], ["đỏ", "red"], ["trắng", "white"], ["đen", "black"], ["gỗ", "wood"], ["nâu", "brown"],
  ["xám", "gray"], ["vàng", "yellow"], ["hồng", "pink"], ["rẻ", "cheap"], ["chào", "hi"],
];
const VI = VI_PAIRS.map(([vi, en]) => [new RegExp(`(^|[\\s,.!?])${vi}(?=$|[\\s,.!?])`, "gu"), `$1${en}`]);
const EN_VI = Object.fromEntries(VI_PAIRS.filter(([, en]) => en).map(([vi, en]) => [en, vi]));
// "pillow" -> "gối" for Vietnamese replies; phrases with an unknown word stay in English.
const viName = (q) => {
  const ws = q.split(" ").map((w) => EN_VI[w] ?? EN_VI[w.replace(/e?s$/, "")]);
  return ws.every(Boolean) ? ws.join(" ") : q;
};
const VI_MARKS = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/iu;
// Language of a typed message: Vietnamese if it has Vietnamese marks or words ("xanh"); unchanged if it has no letters ("50+").
function langOf(text, prev) {
  const s = ` ${text.normalize("NFC").toLowerCase()} `;
  if (VI_MARKS.test(s) || VI.some(([re]) => (re.lastIndex = 0, re.test(s)))) return "vi";
  return /[a-z]/.test(s) ? "en" : prev;
}

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
// "No color preference" replies, checked on the raw text because clean() drops Vietnamese it can't translate.
const ANY = /(?:^|\s)(?:any|no preference|không|gì cũng được|bất kỳ|bất kì)(?=$|[\s,.!?])/u;
// Budget answers: "25-50" / "$25–50", "50+" / "trên 50", "under 30" / "dưới 30".
const RANGE = /\$?\s*(\d+(?:\.\d+)?)\s*(?:-|–|—|to|đến|tới)\s*\$?\s*(\d+(?:\.\d+)?)/u;
const OVER = /\$?\s*(\d+(?:\.\d+)?)\s*\+|(?:over|above|more than|at least|trên|hơn|từ)\s*\$?\s*(\d+(?:\.\d+)?)/u;
const UNDER = /(?:under|below|less than|max|up to|dưới|<)\s*\$?\s*(\d+(?:\.\d+)?)/u;
export function budget(raw) {
  let m;
  if ((m = raw.match(RANGE))) return { min: +m[1], max: +m[2] };
  if ((m = raw.match(OVER))) return { min: +(m[1] ?? m[2]), max: null };
  if ((m = raw.match(UNDER))) return { min: null, max: +m[1] };
  return ANY.test(raw) ? { min: null, max: null } : null;
}
const STOP = new Set("the and for with from your you our this that into inch inches set pack piece pieces amazon brand".split(" "));

// Everything Aurora says, in English and Vietnamese. Chips stay English so parse() reads them the same way.
const T = {
  en: {
    intro: (name) => `Hello${name ? ` ${name}` : ""}! My name is Aurora and I'm your shopping assistant. What do you need today?`,
    hello: "Hello! What can I help you find today?",
    thanks: "You're welcome! Anything else?",
    what: "What are you looking for? Pick one or describe it.",
    huh: "Sorry, I didn't catch that. What kind of piece are you looking for?",
    color: (q) => `What color would you like your ${q} to be?`,
    budget: "What's your budget?",
    price: (min, max) => (min != null && max != null ? ` at ${money(min)}–${money(max)}` : min != null ? ` over ${money(min)}` : max != null ? ` under ${money(max)}` : ""),
    found: (q, price) => `Here's what I found for “${q}”${price}.`,
    notFound: (q, price) => `I couldn't find “${q}”${price}. Try one of these:`,
    nothing: "I couldn't find anything for that. Try one of these:",
    ones: (c) => `${c} ones`,
    under: (max) => `options under ${money(max)}`,
    refined: (parts) => `Here are ${parts}.`,
    refinedNone: (parts) => `I couldn't find ${parts} in these results. Try something else?`,
    more: "Here are more.",
    end: "That's everything I found. Want to try something else?",
    error: "Sorry, search isn't working right now. Please try again in a moment.",
    notImage: "That doesn't look like an image. Try a JPEG, PNG or WebP photo.",
    badPhoto: "I couldn't open that photo. Try another one.",
    noMatch: "I couldn't find a close match. Try a closer photo, or pick a category:",
    foundIt: "I found it!",
    similar: "Here are similar pieces.",
  },
  vi: {
    intro: (name) => `Xin chào${name ? ` ${name}` : ""}! Mình là Aurora, trợ lý mua sắm của bạn. Hôm nay bạn cần tìm gì?`,
    hello: "Xin chào! Mình có thể giúp bạn tìm gì hôm nay?",
    thanks: "Không có gì! Bạn cần gì thêm không?",
    what: "Bạn đang tìm gì? Chọn một mục hoặc mô tả giúp mình nhé.",
    huh: "Xin lỗi, mình chưa hiểu. Bạn đang tìm món đồ gì?",
    color: (q) => `Bạn muốn ${viName(q)} màu gì?`,
    budget: "Ngân sách của bạn khoảng bao nhiêu?",
    price: (min, max) => (min != null && max != null ? ` từ ${money(min)} đến ${money(max)}` : min != null ? ` trên ${money(min)}` : max != null ? ` dưới ${money(max)}` : ""),
    found: (q, price) => `Đây là những gì mình tìm được cho “${q}”${price}.`,
    notFound: (q, price) => `Mình chưa tìm thấy “${q}”${price}. Bạn thử một trong các mục sau nhé:`,
    nothing: "Mình chưa tìm thấy gì phù hợp. Bạn thử một trong các mục sau nhé:",
    ones: (c) => `các món màu ${viName(c)}`,
    under: (max) => `các món dưới ${money(max)}`,
    refined: (parts) => `Đây là ${parts}.`,
    refinedNone: (parts) => `Mình không thấy ${parts} trong các kết quả này. Bạn thử tìm món khác nhé?`,
    more: "Đây là thêm vài món nữa.",
    end: "Mình đã cho bạn xem hết rồi. Bạn muốn tìm món khác không?",
    error: "Xin lỗi, tìm kiếm đang gặp sự cố. Bạn thử lại sau một chút nhé.",
    notImage: "Tệp này không phải ảnh. Bạn thử ảnh JPEG, PNG hoặc WebP nhé.",
    badPhoto: "Mình không mở được ảnh này. Bạn thử ảnh khác nhé.",
    noMatch: "Mình chưa tìm thấy món nào giống. Bạn thử chụp gần hơn, hoặc chọn một danh mục:",
    foundIt: "Mình tìm thấy rồi!",
    similar: "Đây là các món tương tự.",
  },
};

const $ = (sel, root = document) => root.querySelector(sel);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
const store = {
  get(area, k) { try { return JSON.parse(area.getItem(k)); } catch { return null; } },
  set(area, k, v) { try { area.setItem(k, JSON.stringify(v)); } catch { /* blocked or full: state lives for this page only */ } },
};
// Aurora, the shopping assistant: a simple girl in a blue cap and apron, drawn inline (no image file).
// `id` keeps the clipPath id unique per copy.
export const avatar = (id) => `<svg class="vf-face" viewBox="0 0 64 64" aria-hidden="true">
  <defs><clipPath id="${id}-c"><circle cx="32" cy="32" r="32"/></clipPath></defs>
  <g clip-path="url(#${id}-c)">
    <circle cx="32" cy="32" r="32" fill="#dbeafe"/>
    <path d="M15.5 30c-1-10 6-18 16.5-18s17.5 8 16.5 18c-.3 8 .8 13 3 17.5h-39c2.2-4.5 3.3-9.5 3-17.5Z" fill="#3a2621"/>
    <path d="M8 66c1-14 11-21 24-21s23 7 24 21Z" fill="#fff"/>
    <path d="M20 66V50c4-3 8-4 12-4s8 1 12 4v16Z" fill="#1f6fb5"/>
    <path d="M23 49l-4-4M41 49l4-4" stroke="#164f85" stroke-width="2" stroke-linecap="round"/>
    <rect x="35" y="54" width="7" height="4" rx="1" fill="#fff"/>
    <rect x="28" y="38" width="8" height="8" rx="3" fill="#e8ad88"/>
    <circle cx="32" cy="29" r="12.5" fill="#f5c6a5"/>
    <path d="M19.5 29c-.5-9 5-15.5 12.5-15.5S45 20 44.5 29c-2-4.5-5-6.8-9-7.8-3 2.2-8 3.7-12.5 3.7-1.6.8-3 2.3-3.5 4.1Z" fill="#3a2621"/>
    <path d="M19 20c1-6 6.5-9.5 13-9.5s12 3.5 13 9.5c-4-2-8.5-3-13-3s-9 1-13 3Z" fill="#1f6fb5"/>
    <circle cx="32" cy="10" r="1.8" fill="#164f85"/>
    <circle cx="27" cy="30.5" r="2.1" fill="#2b1d19"/><circle cx="37" cy="30.5" r="2.1" fill="#2b1d19"/>
    <circle cx="27.7" cy="29.7" r=".7" fill="#fff"/><circle cx="37.7" cy="29.7" r=".7" fill="#fff"/>
    <circle cx="23" cy="34.5" r="2.3" fill="#f19a8a" opacity=".7"/><circle cx="41" cy="34.5" r="2.3" fill="#f19a8a" opacity=".7"/>
    <path d="M28.5 35q3.5 3.5 7 0" fill="none" stroke="#2b1d19" stroke-width="1.6" stroke-linecap="round"/>
  </g>
</svg>`;
// Waving hand that sticks out from the launcher's edge.
const HAND = `<svg class="vf-hand" viewBox="0 0 24 28" aria-hidden="true">
  <path d="M7 27c-2-4-4-9-4-13 0-1.4 2-1.6 2.6-.3L7 17V6.5c0-1.6 2.5-1.6 2.5 0V14V4.5c0-1.6 2.5-1.6 2.5 0V14V5.5c0-1.6 2.5-1.6 2.5 0V14.5V8c0-1.6 2.5-1.6 2.5 0v9c0 4.5-1.5 7.5-3.5 10Z" fill="#ffe6d6" stroke="#d4a283" stroke-width="1" stroke-linejoin="round"/>
  <path d="M5.500 24.500h10.500l.8 3.500H4.700Z" fill="#1f6fb5"/>
</svg>`;
const SEND_ICON = '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12 20 4l-5 16-3.5-6.5L4 12Z"/><path d="m11.5 13.5 4-4"/></svg>';

// ---- state: history + last results in sessionStorage, launcher position in localStorage ----
const saved = store.get(sessionStorage, KEY_CHAT);
const msgs = Array.isArray(saved?.msgs) ? saved.msgs : [];
let last = saved?.last ?? null; // { q, color, max, prefer, offset, shown: [ids], pool: [[id, score]] }
let pending = saved?.pending ?? null; // waiting for an answer: { step: "color" | "budget", q, color, max, cheaper, asked }
let lang = saved?.lang === "vi" ? "vi" : "en"; // language of the last typed message
const t$ = () => T[lang];
const save = () => store.set(sessionStorage, KEY_CHAT, { msgs: msgs.slice(-40), last, pending, lang });
let pos = store.get(localStorage, KEY_POS);
if (!pos || !["left", "right"].includes(pos.side) || !Number.isFinite(pos.y)) pos = { side: "right", y: innerHeight - SIZE - EDGE };

// ---- DOM ----
document.head.append(Object.assign(document.createElement("link"), { rel: "stylesheet", href: "css/chatbot.css" }));
const root = document.createElement("div");
root.className = "vf-chat";
root.innerHTML = `
  <div class="vf-greet" hidden>
    <button class="vf-greet-open" type="button"><strong>Hi, I'm Aurora!</strong><span>What do you need today? Tap me to chat.</span></button>
    <button class="vf-greet-x" type="button" aria-label="Dismiss">${icon("close")}</button>
  </div>
  <button class="vf-launch" type="button" aria-label="Open shopping assistant" aria-expanded="false" aria-controls="vf-panel">${avatar("vf-clip-a")}${HAND}<span class="vf-online"></span></button>
  <section class="vf-panel" id="vf-panel" role="dialog" aria-label="Shopping assistant">
    <header class="vf-head">
      <span class="vf-avatar">${avatar("vf-clip-b")}</span>
      <span><strong>Aurora</strong><small>Your shopping assistant</small></span>
      <button class="vf-new" type="button" aria-label="Start a new chat">${icon("plus")}<span>New chat</span></button>
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
document.addEventListener("click", (e) => e.target.closest("[data-open-chat]") && open());
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
  if (!msgs.length) intro();
  else log.innerHTML = msgs.map(msgHtml).join("");
  scrollDown(false);
}
// First message of every chat: Aurora introduces herself, by name if the visitor is logged in.
function intro() {
  const name = getUser()?.name?.trim();
  push({ from: "bot", text: t$().intro(name), chips: CHIPS });
}
// New chat: clear the conversation and the remembered results, then start over with the introduction.
$(".vf-new", root).addEventListener("click", () => {
  msgs.length = 0;
  last = null;
  pending = null;
  log.innerHTML = "";
  save();
  intro();
  input.focus({ preventScroll: true });
});
function close() {
  panel.classList.remove("is-open");
  launch.setAttribute("aria-expanded", "false");
  setTimeout(showGreet, 400);
  if (panel.contains(document.activeElement)) launch.focus({ preventScroll: true });
}
$(".vf-close", root).addEventListener("click", close);
document.addEventListener("keydown", (e) => e.key === "Escape" && panel.classList.contains("is-open") && close());

// ---- messages ----
function itemHtml([id]) {
  const p = byId.get(id);
  if (!p) return "";
  const name = escapeHtml(displayName(p.name));
  return `<li class="vf-item">
    <a href="product.html?id=${encodeURIComponent(id)}"><img src="${p.thumb ?? thumbOf(p.image)}" alt="" width="56" height="56" loading="lazy">
      <span class="vf-item-text"><span class="vf-item-name">${name}</span>
      <span class="vf-item-meta"><b>${money(p.price)}</b></span></span></a>
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
  if (chip) send(chip.dataset.chip, true);
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
function send(text, chip = false) {
  push({ from: "user", text });
  queue = queue.then(() => {
    if (!chip) lang = langOf(text, lang); // chips are English labels, so they keep the current language
    return answer(text);
  });
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
  if (pending) { // Aurora asked "What color…?" or "What's your budget?"
    const p = pending, ask = parse(t), raw = text.normalize("NFC").toLowerCase();
    const isBudget = p.step === "budget", b = isBudget ? budget(raw) : null;
    if (b) { pending = null; return newSearch({ ...p, ...b }); }
    if (!isBudget && !ask.color && ANY.test(raw)) return afterColor(p);
    if (ask.rest.length && (await knows(ask.rest))) pending = null; // a different product: handle it as a new request below
    else if (!isBudget && ask.color) return afterColor({ ...p, q: `${ask.color} ${p.q}`, color: ask.color });
    else if (!p.asked) return (isBudget ? askBudget : askColor)({ ...p, asked: true }); // ask once more, then give up waiting
    else if (isBudget) { pending = null; return newSearch(p); } // still unclear: search without a price
    else pending = null;
  }
  if (!t || /^good (?:morning|afternoon|evening)$/.test(t)) // only a greeting or filler ("hi", "tôi muốn mua")
    return push({ from: "bot", text: t$().hello, chips: CHIPS });
  if (/^(?:thanks|thank you|thx|ty)\b/.test(t)) return push({ from: "bot", text: t$().thanks });
  const ask = parse(t);
  const followUp = !ask.rest.length && (ask.more || ask.cheaper || ask.max != null || ask.color);
  if (followUp) {
    if (!last) return push({ from: "bot", text: t$().what, chips: CHIPS });
    return refine(ask);
  }
  if (!ask.rest.length || !(await knows(ask.rest)))
    return push({ from: "bot", text: t$().huh, chips: CHIPS });
  const p = { q: ask.q, color: ask.color, max: ask.max, cheaper: ask.cheaper };
  if (!ask.color) return askColor(p);
  return afterColor(p);
}
// Product named without a color: ask the color, then the budget (skipped when a price was given), then search.
function askColor(p) {
  pending = { ...p, step: "color" };
  push({ from: "bot", text: t$().color(p.q), chips: COLOR_CHIPS });
}
function askBudget(p) {
  pending = { ...p, step: "budget" };
  push({ from: "bot", text: t$().budget, chips: BUDGET_CHIPS });
}
function afterColor(p) {
  if (p.max == null) return askBudget({ ...p, asked: false });
  pending = null;
  return newSearch(p);
}

async function run(search) {
  try {
    return await typing(search);
  } catch (err) {
    if (!(err.status < 500)) console.error(err);
    push({ from: "bot", text: t$().error });
    return null;
  }
}
const toPool = (res) => res.results.map(({ product, score }) => [product.id, score]);

async function newSearch(ask) {
  const res = await run(searchByText(ask.q, POOL));
  if (!res) return;
  last = { q: ask.q, color: null, prefer: COLORS[ask.color] ?? null, min: ask.min ?? null, max: ask.max, cheapFirst: ask.cheaper, offset: 0, pool: toPool(res) };
  const L = t$(), price = L.price(last.min, last.max);
  reply(L.found(ask.q, price), res.results.length ? L.notFound(ask.q, price) : L.nothing);
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
    parts.push(t$().ones(ask.color));
  }
  if (ask.cheaper || ask.max != null) last.min = null; // a lower price replaces the budget's floor
  if (ask.cheaper && ask.max == null) { // cheaper than the cheapest card on screen
    const shown = (last.shown ?? []).map((id) => byId.get(id)?.price).filter(Number.isFinite);
    last.max = Math.min(last.max ?? Infinity, Math.floor(Math.min(...shown)));
  }
  if (ask.max != null) last.max = ask.max;
  if ((ask.cheaper || ask.max != null) && Number.isFinite(last.max)) parts.push(t$().under(last.max));
  last.offset = ask.more && !parts.length ? last.offset + PAGE : 0;
  if (!parts.length) return reply(t$().more, t$().end);
  reply(t$().refined(parts.join(", ")), t$().refinedNone(parts.join(", ")));
}

// Filter + sort the pool by the current refinements and show the next PAGE cards.
function reply(found, none = found) {
  let list = last.pool.filter(([id]) => {
    const p = byId.get(id);
    return p && (!last.color || colorFamily(p.color) === last.color) && (last.max == null || p.price < last.max) && (last.min == null || p.price >= last.min);
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
  if (!file.type.startsWith("image/")) return push({ from: "bot", text: t$().notImage });
  let img;
  try { img = await thumbUrl(file); } catch { return push({ from: "bot", text: t$().badPhoto }); }
  push({ from: "user", img });
  pending = null;
  const res = await run(searchByImage(file));
  if (!res) return;
  const best = res.results[0]?.score ?? 0;
  // Same rule as search.js: the backend's confidence when it sends one, else compare with the thresholds.
  const level = res.confidence ?? (res.match ?? best >= THRESHOLD ? "high" : best >= THRESHOLD_LOW ? "medium" : "low");
  if (!res.results.length || level === "low") {
    last = null;
    return push({ from: "bot", text: t$().noMatch, chips: CHIPS });
  }
  last = { q: null, color: null, prefer: null, min: null, max: null, offset: 0, pool: toPool(res) };
  reply(level === "high" ? t$().foundIt : t$().similar);
}
