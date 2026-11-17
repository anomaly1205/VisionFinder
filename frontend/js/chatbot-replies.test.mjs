// Run: node frontend/js/chatbot-replies.test.mjs
import assert from "node:assert/strict";
import { understand, clean } from "./chatbot-replies.js";

const cases = [
  ["hi", "talk", "greet"],
  ["how are you", "talk", "how"],
  ["who are you", "talk", "who"],
  ["pc", "off", "computers"],
  ["computer", "off", "computers"],
  ["i want a pillow", "query", "pillow"],
  ["thanks", "talk", "thanks"],
  ["bye", "talk", "bye"],
  ["asdfgh", "query", "asdfgh"],
  ["tôi muốn mua đèn", "query", "lamp"],
  // extra: lead-in words don't hide the product, shop questions, out-of-scope
  ["hi, I want to buy a lamp", "query", "lamp"],
  ["do you ship?", "talk", "shipping"],
  ["you are stupid", "talk", "rude"],
  ["I need a new phone", "off", "phones"],
  ["do you have it in blue?", "query", "it in blue"],
  ["what about lamps?", "query", "lamps"],
];
for (const [text, kind, key] of cases) {
  const u = understand(text);
  assert.equal(u.kind, kind, `${text}: kind`);
  assert.equal(u.id ?? u.what ?? u.q, key, `${text}: ${JSON.stringify(u)}`);
  console.log(`${JSON.stringify(text).padEnd(28)} -> ${u.kind}:${key}${u.text ? `  “${u.text}”` : ""}${u.chips ? `  [${u.chips.join(", ")}]` : ""}`);
}
// "thanks" after results gets the "Glad I could help" reply.
assert.match(understand("thanks", { hasResults: true }).text, /Glad I could help|look at something else/);
assert.equal(clean("tôi muốn 1 cái gối dưới 30"), "pillow under 30");
console.log("all passed");
