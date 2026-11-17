// Aurora's small talk, out-of-scope items and text clean-up. Pure data + functions (no DOM), so node can test them:
//   node frontend/js/chatbot-replies.test.mjs
// Edit the replies here; chatbot.js picks one at random each time.

// Vietnamese -> English. Checked in this order, so longer phrases ("rẻ hơn") win over their parts ("rẻ").
const VI_PAIRS = [
  ["tôi muốn mua", ""], ["tôi muốn", ""], ["muốn mua", ""], ["cho tôi", ""], ["giúp tôi", ""], ["tìm kiếm", ""], ["tìm", ""], ["mua", ""],
  ["một", ""], ["cái", ""], ["chiếc", ""], ["con", ""], ["bộ", ""],
  ["rẻ hơn", "cheaper"], ["xem thêm", "show more"], ["xanh lá", "green"], ["xanh dương", "blue"], ["kem", "cream"], ["xin chào", "hi"], ["cảm ơn", "thanks"], ["dưới", "under"],
  ["giao hàng", "delivery"], ["vận chuyển", "shipping"], ["đổi trả", "returns"], ["thanh toán", "payment"], ["giảm giá", "discount"], ["tạm biệt", "bye"],
  ["gối", "pillow"], ["đệm", "cushion"], ["đèn", "lamp"], ["thảm", "rug"], ["ghế", "chair"], ["bàn", "table"], ["gương", "mirror"],
  ["cây", "plant"], ["chậu", "planter"], ["bình", "vase"], ["giỏ", "basket"], ["kệ", "shelf"], ["tủ", "cabinet"], ["chăn", "blanket"],
  ["rèm", "curtain"], ["xanh", "blue"], ["đỏ", "red"], ["trắng", "white"], ["đen", "black"], ["gỗ", "wood"], ["nâu", "brown"],
  ["xám", "gray"], ["vàng", "yellow"], ["hồng", "pink"], ["rẻ", "cheap"], ["chào", "hi"],
];
const VI = VI_PAIRS.map(([vi, en]) => [new RegExp(`(^|[\\s,.!?])${vi}(?=$|[\\s,.!?])`, "gu"), `$1${en}`]);
// Lead-in words stripped one by one from the start: "hi, I want to buy a pillow" -> "pillow".
const FILLER = /^(?:(?:hi|hello|hey)[,!.]?|please|can you|could you|i(?: would like| 'd like|'d like| want| need| wanna| am looking for|'m looking for)|looking for|do you have|have you got|what about|how about|and|show me|find me|find|search for|search|get me|to buy|to get|to find|to see|buy|for|some|any|an?) /;

// Lowercase, Vietnamese translated, punctuation and untranslated Vietnamese dropped. Small talk is matched on this.
export function norm(text) {
  let t = ` ${text.normalize("NFC").toLowerCase().replace(/[‘’]/g, "'")} `; // curly "i’m" -> "i'm"
  for (const [re, en] of VI) t = t.replace(re, en);
  return t.replace(/[“”"!?,.]+(?=\s|$)|[“”"!?,]+/g, " ").replace(/\S*[^\x00-\x7f]\S*/g, " ").replace(/\s+/g, " ").trim();
}
// norm() + filler dropped: what is left is the product request.
export function clean(text) {
  let t = norm(text).replace(/(^| )1 (?=[a-z])/g, "$1"); // "tôi muốn 1 cái gối" -> "pillow"; prices keep their number ("under 50")
  let prev;
  do { prev = t; t = `${t} `.replace(FILLER, "").trim(); } while (t !== prev);
  return t;
}

// Color words the user can say -> colorFamily() families in common.js.
export const COLORS = {
  blue: "Blue", navy: "Blue", teal: "Blue", red: "Red & Pink", pink: "Red & Pink", white: "White", black: "Black",
  gray: "Gray", grey: "Gray", green: "Green", brown: "Brown & Wood", wood: "Brown & Wood", wooden: "Brown & Wood",
  beige: "Cream & Beige", cream: "Cream & Beige", purple: "Purple", yellow: "Yellow & Orange", orange: "Yellow & Orange",
  gold: "Metallic", silver: "Metallic", brass: "Metallic", glass: "Clear",
};
const PRICE = /(?:under|below|less than|max|up to|<)\s*\$?\s*(\d+(?:\.\d+)?)(?:\s*(?:dollars?|usd|bucks))?|\$(\d+(?:\.\d+)?)/;
const CHEAPER = /\b(?:cheaper|cheap|less expensive|lower price|budget)\b/;
const MORE = /\b(?:more|next)\b/;
const SIZE_WORD = /^(?:small|smaller|mini|compact|tiny|big|bigger|large|larger|huge)$/;
export const smallOrLarge = (w) => (/^(?:small|smaller|mini|compact|tiny)$/.test(w) ? "small" : "large");
// Words that only steer a follow-up; a message made only of these (plus colors and sizes) refines the last results.
export const REFINE = /^(?:show|see|more|next|me|the|ones?|in|any|some|something|options?|them|those|it|this|that|these|like|but|similar|same|kind|style|look|looks|of|with|a|an|please|cheaper|cheap|less|expensive|lower|price|budget|under|below|than|max|up|to|colou?r|dollars?|usd|bucks|\$?\d+(?:\.\d+)?|ok|okay|and|only|just)$/;
// Splits a cleaned message into the product words (`rest`) and the follow-up parts.
export function parse(t) {
  const words = t.match(/[a-z0-9$.']+/g) ?? [];
  const price = t.match(PRICE);
  return {
    more: MORE.test(t),
    cheaper: CHEAPER.test(t),
    max: price ? +(price[1] ?? price[2]) : null,
    color: words.find((w) => COLORS[w]) ?? null,
    size: words.find((w) => SIZE_WORD.test(w)) ?? null,
    rest: words.filter((w) => !REFINE.test(w) && !COLORS[w] && !SIZE_WORD.test(w)),
    q: t.replace(PRICE, " ").replace(CHEAPER, " ").replace(/\s+/g, " ").trim(),
  };
}

// ---- photo + text ----
// Text sent with a photo: what it looks like ("blue", "wooden", "small", "round") goes to CLIP together with the image;
// price words ("cheaper", "under $50") filter the results in the chat instead, because a picture has no price.
export function photoAsk(text) {
  const ask = parse(clean(text));
  return { ...ask, text: [ask.color, ask.size && smallOrLarge(ask.size), ...ask.rest].filter(Boolean).join(" ") };
}
// Does this message change the last photo search? `hasPhoto`: the cards on screen came from a photo that is still
// remembered (New chat or another photo forgets it). "blue ones", "cheaper", "smaller", "like this but wooden": yes.
// "show more" only pages through the same results; a new product ("lamps") is a new text search.
export function aboutPhoto(text, hasPhoto) {
  if (!hasPhoto) return false;
  const ask = parse(clean(text));
  if (/\b(?:like (?:this|that|it)|this one|that one|same|similar)\b/.test(norm(text))) return true;
  return !ask.rest.length && !!(ask.color || ask.size || ask.cheaper || ask.max != null);
}

export const CATS = ["Pillows", "Lamps", "Rugs", "Chairs", "Plants", "Mirrors"];
const DEMO = "This is a demo shop, so there are no real orders yet";

// Words that can follow a greeting and still keep it a greeting: "hello you", "hey aurora :)".
const GREET_TAIL = String.raw`you|u|there|aurora|everyone|everybody|all|friend|buddy|guys|folks|again|:-?\)|:-?d|;-?\)`;
const LAUGH = String.raw`(?:a?ha)+h?|(?:he){2,}|lo+l|lmao|rofl|xd|:-?\)|:-?d|:-?p|;-?\)`;
const JOKES = [
  "Why did the lamp do so well in school? Because it was very bright! Want to see some lamps?",
  "I told my rug a joke, but it didn't laugh. It just lay there! Can I find you something for your home?",
  "Why is a chair never lonely? It always has someone's back! Looking for a chair?",
];

// Small talk, checked top to bottom on norm(text). `after` (optional) replaces `replies` once results are on screen.
export const SMALLTALK = [
  { id: "rude", re: /\b(?:stupid|dumb|idiot|useless|shut up|sucks?|hate you|fuck\w*|shit|damn|wtf|crap|bitch|bad bot)\b/,
    replies: ["Sorry this isn't going well! Let's try again: what are you looking for?", "I'm still learning, sorry about that. Tell me the piece you want and I'll do my best.", "Let's start fresh. What can I find for your home?"] },
  { id: "there", re: /\b(?:are (?:you|u) (?:still )?(?:there|here|awake|online)|(?:any ?one|anybody) (?:there|here))\b/,
    replies: ["Yes, I'm here! What can I help you find?", "Still here! Tell me what you're looking for."] },
  { id: "who", re: /\b(?:who are you|what(?:'s| is) your name|your name|are you (?:a |an )?(?:bot|robot|human|real|person|ai|machine)|r u a bot)\b/,
    replies: ["I'm Aurora, the shop's shopping assistant. I'm a friendly bot, not a person, but I know the catalog well!", "My name is Aurora! I'm a bot that helps you find home & living pieces by text or photo."] },
  { id: "how", re: /\b(?:how are (?:you|u)|how'?s it going|how are things|what'?s up|sup|how do you do)\b/,
    replies: ["I'm great, thanks for asking! What can I help you find today?", "Doing well and ready to shop! What are you looking for?", "All good here! Looking for something for your home?"] },
  { id: "greet", re: new RegExp(`^(?:hi+|hello+|hey+|hiya|yo|greetings|good (?:morning|afternoon|evening|day))(?: (?:${GREET_TAIL}))*$`),
    replies: ["Hello! What can I help you find today?", "Hi there! Looking for something for your home?", "Hey! Tell me what you need, or pick a category."] },
  { id: "meet", re: /\b(?:nice|glad|pleased|good) to (?:meet|see) (?:you|u)\b/,
    replies: ["Nice to meet you too! What can I find for your home today?", "Likewise! Looking for anything in particular?"] },
  { id: "fine", re: /^(?:(?:i'?m|i am) (?:fine|good|great|ok|okay|well|alright|doing (?:fine|good|great|well|ok|okay))|not bad|pretty good|all good)(?: (?:too|thanks?|thank you|and you|you))*$/,
    replies: ["Glad to hear it! What can I help you find today?", "Good to hear! Looking for something for your home?"] },
  { id: "laugh", re: new RegExp(`^(?:${LAUGH})(?: (?:${LAUGH}))*$`),
    replies: ["Glad I made you smile! Anything I can find for you?", "Ha! Now, what are we shopping for?"] },
  { id: "time", re: /\b(?:what time|the time|time is it|what(?:'s| is) the date|what day is it|weather|forecast)\b(?! resistant)/,
    replies: ["I don't have a clock or a window, sorry! I only know the shop. Can I help you find something for your home?", "That's outside what I know, I'm afraid. I'm better at finding home pieces! What are you looking for?"] },
  { id: "joke", re: /\b(?:jokes?|make me laugh|something funny)\b/, replies: JOKES },
  { id: "bored", re: /\b(?:bored|just (?:looking|browsing)|only looking|browsing)\b(?! for)/, // "just looking for a lamp" is a search
    replies: ["Let's fix that with a little window shopping! Pick a category to browse:", "Browsing is the best part! Here are a few places to start:"] },
  { id: "sorry", re: /^(?:(?:i'?m |so )?sorry|my bad|oops|whoops|apologies|my mistake)$/,
    replies: ["No worries at all! What can I find for you?", "All good! Tell me what you're looking for."] },
  { id: "help", re: /^(?:help|help me|menu|options)$|\b(?:what can you do|what do you do|how does this work|how do i use (?:this|you))\b/,
    replies: ["I find home & living pieces in three ways: type what you want (\"blue pillow under $30\"), send a photo with the camera button, or send both, a photo plus a few words like \"in blue\" or \"wooden\". After a search, try \"cheaper\", \"show more\", or tap Similar on a card.",
      "Type a piece (\"wooden chair\"), send a photo, or combine them: attach a photo and add \"cheaper\" or \"in white\". I look at the picture and the words together. Pick a category to start:"] },
  { id: "thanks", re: /^(?:thanks?|thank you|thank u|thx|ty|cheers|tks)\b/,
    replies: ["You're welcome! Anything else?", "Happy to help! What else can I find for you?"],
    after: ["Glad I could help! Anything else for your home?", "You're welcome! Want to look at something else for your home?"] },
  { id: "praise", re: /^(?:(?:very |so |that'?s |this is |it'?s |you'?re )?(?:nice|great|cool|awesome|perfect|amazing|wow|lovely|beautiful|good job|well done|the best)|(?:i )?love (?:it|this|them|that|you))$/,
    replies: ["Thank you, that's kind! Anything else I can find?", "Aw, thanks! Want to keep looking?"],
    after: ["Glad you like them! Want more like these, or something else?", "Great taste! Anything else for your home?"] },
  { id: "bye", re: /^(?:bye+|goodbye|bye bye|see (?:you|ya)|cya|good night|later|take care)\b/,
    replies: ["Bye! Come back anytime you need something for your home.", "See you soon! Happy decorating."] },
  { id: "shipping", re: /\b(?:ship|shipping|shipped|deliver|delivery|arrive)\b/,
    replies: [`${DEMO}: shipping times and costs aren't set. In a real shop they would show at checkout. Can I help you pick something?`] },
  { id: "returns", re: /\b(?:returns?|refunds?|exchange|send (?:it )?back)\b/,
    replies: [`${DEMO}, so there is no real return policy. A real shop would list it on its help page. Want to keep browsing?`] },
  { id: "payment", re: /\b(?:pay|paying|payment|credit card|debit card|paypal|cash|cod|checkout)\b/,
    replies: [`${DEMO}: checkout doesn't take real payments. You can still fill your cart and try it out. What are you looking for?`] },
  { id: "discount", re: /\b(?:discounts?|coupons?|promo|vouchers?|sales?|deals?|promotion)\b/,
    replies: [`${DEMO}, so there are no real discount codes. Tip: say "cheaper" or "under $30" after a search to see lower prices.`] },
  { id: "ok", re: /^(?:ok|okay|k|alright|got it|fine)$/, replies: ["Great! What would you like to look at next?", "Okay! Tell me what you need, or pick a category."] },
  { id: "yes", re: /^(?:yes|yeah|yep|yup|sure|of course)$/, replies: ["Great! What are you looking for?", "Sure! Name a piece or pick a category."] },
  { id: "no", re: /^(?:no|nope|nah|no thanks|not really|nothing)$/, replies: ["No problem! I'm here if you need anything.", "Okay! Just say hi when you want to look at something."] },
];

// Things the shop doesn't sell -> related pieces it does. The chips are those pieces.
export const OFF_TOPIC = [
  { re: /\b(?:pcs?|computers?|laptops?|monitors?|keyboards?|mouse|gaming)\b/, what: "computers", chips: ["Desk", "Desk lamp", "Chair"] },
  { re: /\b(?:phones?|iphones?|smartphones?|tablets?|ipads?)\b/, what: "phones", chips: ["Organizer", "Storage box", "Desk lamp"] },
  { re: /\b(?:tvs?|television|speakers?|headphones?|cameras?)\b/, what: "electronics", chips: ["Cabinet", "Sofa", "Wall art"] },
  { re: /\b(?:clothes|clothing|shirts?|t-shirts?|dress|dresses|jackets?|pants|jeans|hoodies?)\b/, what: "clothes", chips: ["Basket", "Storage bag", "Storage box"] },
  { re: /\b(?:shoes|sneakers|boots|sandals)\b/, what: "shoes", chips: ["Storage rack", "Basket", "Bench"] },
  { re: /\b(?:food|pizza|snacks?|drinks?|coffee|groceries|grocery|fruit)\b/, what: "food", chips: ["Table", "Chair", "Vase"] },
  { re: /\b(?:cars?|bikes?|bicycles?|motorbikes?|scooters?)\b/, what: "vehicles", chips: ["Storage rack", "Storage box", "Basket"] },
  { re: /\b(?:books?|novels?)\b/, what: "books", chips: ["Shelf", "Cabinet", "Lamp"] },
  { re: /\b(?:toys?|games?)\b/, what: "toys", chips: ["Basket", "Storage box", "Rug"] },
  { re: /\b(?:jewelry|jewellery|rings?|necklaces?|earrings?|watch(?:es)?)\b/, what: "jewelry", chips: ["Jewelry storage", "Mirror"] },
];
export const offTopicReply = (o) => `We only sell home & living pieces, so no ${o.what} here, sorry! These might go well with them:`;

// Fallback when nothing matches: no product, no small talk, CLIP search not confident.
export const UNSURE = [
  "Hmm, I'm not sure I have that. Try a piece and a detail, like \"wooden chair\" or \"blue pillow under $30\", or pick a category:",
  "I couldn't find a good match for that. Try naming a piece, like \"lamp\" or \"rug\", or send me a photo:",
];

// Fallback for a message that reads like chat ("what's your favorite color?") rather than a product search.
export const CHATTY = [
  "Ha, I'm just a shopping assistant, so chatting isn't my strong suit! But I can find you something nice for your home:",
];
const CHAT_WORD = /\b(?:you|your|yours|u|ur|i|i'm|im|me|my|we|us)\b/;
const QUESTION = /^(?:what|why|how|where|when|who|which|are|is|can|could|do|does|will|would)\b/;
// Reply when CLIP found nothing confident. Lead-in words are cleaned off first, so "do you have a velvet ottoman?" is a
// clear search ("velvet ottoman") and gets UNSURE; "what's your favorite color?" still has "your" and gets CHATTY.
export function unsure(text, rand) {
  const q = clean(text);
  return pick(CHAT_WORD.test(q) || (text.includes("?") && QUESTION.test(q)) ? CHATTY : UNSURE, rand);
}

export const pick =(arr, rand = Math.random) => arr[Math.floor(rand() * arr.length)];

// What the visitor means, before any catalog lookup:
//   { kind: "talk", id, text, chips } | { kind: "off", what, text, chips, word } | { kind: "query", q }
// `ctx.hasResults`: product cards are on screen, so "thanks" / "nice" get the `after` replies.
export function understand(text, ctx = {}) {
  const n = norm(text), q = clean(text);
  if (!n) return { kind: "query", q: "" };
  const talk = SMALLTALK.find((s) => s.re.test(n));
  if (talk) return { kind: "talk", id: talk.id, text: pick(ctx.hasResults && talk.after ? talk.after : talk.replies), chips: CATS };
  if (!q) return { kind: "talk", id: "greet", text: pick(SMALLTALK.find((s) => s.id === "greet").replies), chips: CATS }; // only filler ("tôi muốn mua")
  const off = OFF_TOPIC.find((o) => o.re.test(q));
  if (off) return { kind: "off", what: off.what, text: offTopicReply(off), chips: off.chips, word: q.match(off.re)[0] };
  return { kind: "query", q };
}
