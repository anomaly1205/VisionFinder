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
- User-pinned direction: Nordic minimal (white, warm greys, generous whitespace, compact sans).
- Footer attribution required: "Product data © Amazon.com, Amazon Berkeley Objects (CC BY 4.0). Prices are for demo only."

## Evidence on Hand

- Product photos: `frontend/assets/products/` (ABO, CC BY 4.0).
- No testimonials, reviews, press, or real metrics yet; accuracy numbers are TBD and must not be invented.

## Product Principles

1. Search by image is always one click away.
2. Show confidence honestly: scores, latency, and a refusal when unsure.
3. The product photo is the hero; the interface recedes.
4. Never fake data: label demo mode and demo prices.
