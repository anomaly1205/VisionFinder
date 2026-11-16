// Accounts: login / register / logout, and keeping cart + wishlist in sync with the server while logged in.
// Logged out, nothing here runs and the site works from localStorage exactly as before.
import { API_BASE } from "./api.js";
import { TOKEN_KEY, CART_KEY, SAVED_KEY, getToken, authHeader, getCart, getSaved, replaceLocal, onStoreChange } from "./common.js";

const USER_KEY = "vf_user";
export const getUser = () => { try { return getToken() && JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; } };
function saveSession(token, user) {
  try { localStorage.setItem(TOKEN_KEY, token); localStorage.setItem(USER_KEY, JSON.stringify(user)); } catch { /* blocked */ }
}
function clearSession() {
  try { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); } catch { /* blocked */ }
}

// JSON call to the backend. Errors carry the backend's message and HTTP status (0 = unreachable).
export async function request(path, { method = "GET", body } = {}) {
  let r;
  try {
    r = await fetch(`${API_BASE}${path}`, {
      method,
      headers: { ...authHeader(), ...(body ? { "Content-Type": "application/json" } : {}) },
      body: body && JSON.stringify(body),
    });
  } catch {
    throw Object.assign(new Error("Can't reach the server. Is the backend running?"), { status: 0 });
  }
  const data = await r.json().catch(() => null);
  if (!r.ok) {
    let msg = data?.detail;
    if (Array.isArray(msg)) msg = msg.map((d) => FIELD_MSG[d.loc?.at(-1)] ?? d.msg).join(" "); // FastAPI validation list
    throw Object.assign(new Error(typeof msg === "string" ? msg : `Server error (HTTP ${r.status}).`), { status: r.status });
  }
  return data;
}
const FIELD_MSG = {
  password: "Password must be 8 to 72 characters.",
  email: "Enter a valid email address.",
  name: "Enter your name.",
};

// Login/register: merge this browser's cart + wishlist into the account, then use the account's copy.
async function start({ token, user }) {
  saveSession(token, user);
  const [c, w] = await Promise.all([request("/me/cart"), request("/me/wishlist")]);
  const qty = new Map(c.items.map((i) => [i.id, i.qty]));
  for (const i of getCart()) qty.set(i.id, Math.max(qty.get(i.id) ?? 0, i.qty)); // max, not sum: logging in twice must not double the cart
  const cart = [...qty].map(([id, q]) => ({ id, qty: Math.min(q, 99) }));
  const saved = [...new Set([...w.items, ...getSaved()])];
  await Promise.all([
    request("/me/cart", { method: "PUT", body: { items: cart } }),
    request("/me/wishlist", { method: "PUT", body: { items: saved } }),
  ]);
  replaceLocal(cart, saved);
  return user;
}
export const login = (email, password) =>
  request("/auth/login", { method: "POST", body: { email, password } }).then(start);
export const register = (name, email, password) =>
  request("/auth/register", { method: "POST", body: { name, email, password } }).then(start);

// Logout: forget the account and its cart/wishlist on this device (a shared computer must not keep them).
export function logout() {
  clearSession();
  replaceLocal([], []);
}

// While logged in, push each change (debounced: quantity clicks come in bursts).
const timers = {};
onStoreChange((key, value) => {
  if (!getToken() || ![CART_KEY, SAVED_KEY].includes(key)) return;
  clearTimeout(timers[key]);
  timers[key] = setTimeout(() => {
    const path = key === CART_KEY ? "/me/cart" : "/me/wishlist";
    request(path, { method: "PUT", body: { items: value } }).catch(() => { /* offline: next login merges it */ });
  }, 400);
});

// Page load: check the token is still valid, then take the server's cart + wishlist (another device may have changed them).
// Resolves to the user, or null when logged out.
export async function refresh() {
  if (!getToken()) return null;
  try {
    const user = await request("/auth/me");
    saveSession(getToken(), user);
    const [c, w] = await Promise.all([request("/me/cart"), request("/me/wishlist")]);
    replaceLocal(c.items, w.items);
    document.dispatchEvent(new Event("vf:synced"));
    return user;
  } catch (e) {
    if (e.status === 401) { clearSession(); return null; } // expired or revoked
    return getUser(); // backend or database down: keep the session, use local copies
  }
}
