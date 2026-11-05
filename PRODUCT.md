# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML/CSS + vanilla JavaScript (no framework, no build step). Products render from `frontend/data/products.json`. Optional FastAPI backend at `http://127.0.0.1:8000/api/...`; frontend falls back to a mock "demo mode" when it is offline. Cropper.js from CDN is the only third-party frontend library.

## Users

Primary viewers are university lecturers (Hanoi University, Faculty of IT) grading the project and recruiters reviewing it as a portfolio piece. They open the site, try uploading or pasting a photo, and judge whether the results are right and fast.

## Product Purpose

VisionFinder Home is a home and living store where products can be found by image instead of keywords. Success: a viewer drops a photo, sees the matching product in the top results with a similarity score and response time, and the store around it feels complete and credible.

## Positioning

Presents as a real shop; AI visual search is the headline feature, reachable from every page (camera icon in the navbar), not a separate tech demo. Honest about uncertainty: below threshold it says "No confident match" rather than guessing.

## Operating Context

- Catalog: 500 products from Amazon Berkeley Objects in 7 categories (Furniture, Lighting, Rugs, Decor, Storage, Plants, Textiles); 100 holdout products not in the catalog, used to test "no confident match".
- Each product has a main image plus up to 2 other angles; other angles serve as search queries.
- Search inputs: drag-drop, file picker, Ctrl+V paste, crop region, optional text description.

## Capabilities and Constraints

- Pages: home, product list (filter category/color, sort price), product detail (gallery + visually similar), cart (localStorage), search.
- Language: English UI.
- Prices are demo values, not real.
- Backend may be offline; demo mode must be clearly labeled.

## Brand Commitments

- Name: VisionFinder Home.
- User-pinned direction: editorial home-decor marketplace in the manner of chairish.com, style and layout only (see Style Reference). Nordic minimal was tried and rejected on 2026-11-06.
- Footer attribution required: "Product data © Amazon.com, Amazon Berkeley Objects (CC BY 4.0). Prices are for demo only."

## Evidence on Hand

- Product photos: `frontend/assets/products/` (ABO, CC BY 4.0).
- No testimonials, reviews, press, or real metrics yet; accuracy numbers are TBD and must not be invented.

## Product Principles

1. Search by image is always one click away.
2. Show confidence honestly: scores, latency, and a refusal when unsure.
3. The product photo is the hero; the interface recedes.
4. Never fake data: label demo mode and demo prices.

## Style Reference (learned from chairish.com, 2026-11-06)

Layout and style only; no logo, names, images or copy taken. Measured via computed styles:

- Fonts: serif for display and main nav (moderno-fb, 400), light geometric sans for UI/body (europa, 300). Substitutes here: Gilda Display (serif) + Jost (sans).
- Color: white ground #fff, ink #111, muted #757575, hairline #ebebeb, search field #fafafa, sale red #cc4639, cool blue accent #2e5167. Footer is solid #111 with white text. Top promo bar black, 30px.
- Type scale: body 14/21 w300, letter-spacing 0.01em. Nav serif 14px, ls 0.03–0.04em. Mega menu 12px. Hero heading serif 44/48 w400. Section headings serif ~30px.
- Buttons: square (radius 0), black fill, white 12px w600 uppercase, ls 0.16em, height 44px.
- Search: wide pill field in header, 475px+, radius 18px, bg #fafafa, 1px #ebebeb border.
- Product card: white tile, square image showing the whole object, outline heart top-right, title 14px w400, price 14px w600, no borders or shadows.
- Footer: multi-column, headings 12px uppercase w600 ls 0.16em, links 12px w300.
- Structure: promo bar, header (logo left, search center, icons right), serif nav row with mega menus, editorial hero carousel (image left, serif headline + copy + button right), product rows, category tiles.
