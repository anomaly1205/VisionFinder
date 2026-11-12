import { crumbs } from "./layout.js";
import { toast } from "./common.js";
import { getUser, login, register } from "./account.js";

document.getElementById("crumbs").innerHTML = crumbs([["Home", "index.html"], ["Log in"]]);

// Back to the page the user came from; only plain page names, never another site.
const nextParam = new URLSearchParams(location.search).get("next") ?? "";
const next = /^[a-z]+\.html(\?[^#]*)?$/.test(nextParam) ? nextParam : "index.html";
if (getUser()) location.replace(next);

// ---- tabs (arrow keys move between them, as in the ARIA tabs pattern) ----
const tabs = [...document.querySelectorAll('[role="tab"]')];
function select(tab) {
  for (const t of tabs) {
    const on = t === tab;
    t.setAttribute("aria-selected", on);
    t.tabIndex = on ? 0 : -1;
    document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
  }
}
tabs.forEach((t, i) => {
  t.addEventListener("click", () => select(t));
  t.addEventListener("keydown", (e) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!step) return;
    const n = tabs[(i + step + tabs.length) % tabs.length];
    select(n);
    n.focus();
  });
});
if (location.hash === "#register") select(tabs[1]);

// ---- forms ----
function wire(form, check, send) {
  const err = form.querySelector(".form-error"), btn = form.querySelector('[type="submit"]');
  const show = (msg) => { err.textContent = msg; err.hidden = !msg; };
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const problem = check(data);
    if (problem) return show(problem);
    show("");
    btn.disabled = true;
    try {
      await send(data);
      location.href = next;
    } catch (ex) {
      show(ex.message);
      btn.disabled = false;
    }
  });
}
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
wire(document.getElementById("panel-login"),
  (d) => (!EMAIL.test(d.email.trim()) ? "Enter a valid email address." : !d.password ? "Enter your password." : ""),
  (d) => login(d.email.trim(), d.password));
wire(document.getElementById("panel-register"),
  (d) => (!d.name.trim() ? "Enter your name."
    : !EMAIL.test(d.email.trim()) ? "Enter a valid email address."
      : d.password.length < 8 ? "Password must be at least 8 characters." : ""),
  (d) => register(d.name.trim(), d.email.trim(), d.password));

// Social buttons are for show only in this demo.
document.querySelectorAll("[data-social]").forEach((b) =>
  b.addEventListener("click", () => toast("Social login is not available in this demo")));
