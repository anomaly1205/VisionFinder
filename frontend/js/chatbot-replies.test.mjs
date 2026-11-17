// Run: node frontend/js/chatbot-replies.test.mjs
import assert from "node:assert/strict";
import { understand, clean, photoAsk, aboutPhoto, unsure } from "./chatbot-replies.js";

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
  // looser small talk: a greeting plus a non-product word is still a greeting
  ["hello you", "talk", "greet"],
  ["hello there!", "talk", "greet"],
  ["hey aurora :)", "talk", "greet"],
  ["nice to meet you", "talk", "meet"],
  ["i'm fine", "talk", "fine"],
  ["haha", "talk", "laugh"],
  ["are you there?", "talk", "there"],
  ["tell me a joke", "talk", "joke"],
  ["what's the weather", "talk", "time"],
  ["what time is it?", "talk", "time"],
  ["i'm bored", "talk", "bored"],
  ["just looking", "talk", "bored"],
  ["sorry", "talk", "sorry"],
  ["hello, I want a lamp", "query", "lamp"],
  ["hi blue pillow", "query", "blue pillow"],
  ["i'm just looking for a rug", "query", "i'm just looking for a rug"], // a search, not "bored"
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
// CLIP found nothing: chat-like text gets the friendly reply, a clear product search gets "not sure I have that".
for (const [text, re] of [["what's your favorite color?", /shopping assistant/], ["do you love me", /shopping assistant/],
  ["do you have a velvet ottoman?", /not sure|couldn't find/], ["asdfgh", /not sure|couldn't find/]]) {
  const r = unsure(text);
  assert.match(r, re, text);
  console.log(`unsure ${JSON.stringify(text).padEnd(30)} -> “${r}”`);
}

// ---- photo + text ----
const show = (label, v) => console.log(`${label.padEnd(44)} -> ${JSON.stringify(v)}`);
// 1. Photo + "blue" in one message: "blue" goes to CLIP with the image.
let a = photoAsk("blue");
assert.equal(a.text, "blue"); assert.equal(a.color, "blue");
show('photo + "blue"', { text: a.text, color: a.color });
a = photoAsk("something like this but wooden");
assert.equal(a.text, "wooden");
show('photo + "something like this but wooden"', { text: a.text });
a = photoAsk("smaller");
assert.equal(a.text, "small");
show('photo + "smaller"', { text: a.text });
// 2. Photo sent, then "cheaper": same photo again; "cheaper" filters prices, it is not sent to CLIP.
assert.equal(aboutPhoto("cheaper", true), true);
a = photoAsk("cheaper");
assert.equal(a.text, ""); assert.equal(a.cheaper, true);
show('photo, then "cheaper"', { aboutPhoto: true, text: a.text, cheaper: a.cheaper });
assert.equal(aboutPhoto("blue ones", true), true);
assert.equal(aboutPhoto("show more", true), false); // pages through the same results
assert.equal(aboutPhoto("what about lamps?", true), false); // a new product: text search
assert.equal(photoAsk("under $50").max, 50);
// 3. Photo sent, then New chat: the photo is forgotten (hasPhoto false), so "cheaper" is plain text again.
assert.equal(aboutPhoto("cheaper", false), false);
assert.equal(aboutPhoto("blue ones", false), false);
show('photo, New chat, then "cheaper"', { aboutPhoto: false, understand: understand("cheaper").kind });
console.log("all passed");
