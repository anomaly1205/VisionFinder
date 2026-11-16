import { crumbs } from "./layout.js";
import { productById, displayName, escapeHtml, icon, thumbOf } from "./common.js";
import { getUser, request } from "./account.js";

document.getElementById("crumbs").innerHTML = crumbs([["Home", "index.html"], ["Search history"]]);
const box = document.getElementById("history");
const empty = (msg, href, label) => `<div class="empty"><p>${msg}</p><a class="btn" href="${href}">${label}</a></div>`;
const when = (iso) => new Date(iso.endsWith("Z") ? iso : `${iso}Z`) // stored as UTC without a zone
  .toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

async function render() {
  if (!getUser()) {
    box.innerHTML = empty("Log in to see your search history.", "login.html?next=history.html", "Log in");
    return;
  }
  let items;
  try {
    ({ items } = await request("/me/history"));
  } catch (e) {
    if (e.status === 401) location.href = "login.html?next=history.html";
    box.innerHTML = `<div class="empty"><p>${escapeHtml(e.message)}</p></div>`;
    return;
  }
  if (!items.length) {
    box.innerHTML = empty("No searches yet. Find something with a photo or a few words.", "search.html", "Start a search");
    return;
  }
  const rows = await Promise.all(items.map(async (h) => {
    const p = h.top_result_id && (await productById(h.top_result_id));
    const photo = h.type === "photo";
    const what = photo ? "Photo search" : `“${escapeHtml(h.query)}”`;
    const again = photo ? "" : `<a class="text-link" href="search.html?q=${encodeURIComponent(h.query)}">Search again</a>`;
    const top = p
      ? `<a class="hist-top" href="product.html?id=${encodeURIComponent(p.id)}">
          <span class="tile"><img src="${thumbOf(p.image)}" alt="" loading="lazy"></span>
          <span><span class="muted">Top match</span>${escapeHtml(displayName(p.name))}</span></a>`
      : `<p class="hist-top muted">No match</p>`;
    return `<li class="hist-row">
        <span class="hist-kind" title="${photo ? "Photo" : "Text"}">${icon(photo ? "camera" : "text")}</span>
        <div class="hist-what"><p>${what}</p><p class="muted">${photo ? "Photo" : "Text"} · ${when(h.created_at)}</p>${again}</div>
        ${top}
      </li>`;
  }));
  box.innerHTML = `<ul class="hist-list">${rows.join("")}</ul>`;
}
render();
