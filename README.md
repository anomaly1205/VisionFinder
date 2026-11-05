# VisionFinder

**Search products by image, not by keywords.**

VisionFinder is a visual product search engine for a handicraft e-commerce store. Upload a photo of a product and the system finds the matching item in the catalog, shows its details, and suggests visually similar products, even when you don't know what the product is called.

> Work in progress. Features marked (planned) are not done yet.

## Features

- [x] Static e-commerce frontend (home, products, product detail, cart, lookbook)
- [ ] **Image search**: upload a photo, get the top-k most similar products (planned)
- [ ] **Confidence threshold**: returns "no confident match" instead of a wrong answer (planned)
- [ ] **Crop before search**: select the product region in the photo (planned)
- [ ] **Shop the look**: detect multiple objects in a room photo and search each one (planned)
- [ ] **Hybrid search**: search by text, image, or both (planned)
- [ ] **Admin upload**: new products become searchable instantly, no retraining (planned)

## How it works

1. **Offline:** every catalog image is converted into a vector (embedding) by a pretrained CLIP model and stored in a FAISS index.
2. **Online:** the user's photo goes through the same model; its vector is compared to all stored vectors by cosine similarity.
3. The top-k closest products are returned if the best score passes a confidence threshold, otherwise "no confident match".

**Why not train a classifier?** No large labeled dataset or GPU training needed, and new products are added by embedding their images, no retraining. Trade-off: lower accuracy on near-identical products, controlled by the threshold.

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | HTML, CSS, JavaScript, jQuery, Slick |
| Backend API | Python, FastAPI |
| Computer Vision | Pillow / OpenCV |
| Multimodal model | CLIP (OpenCLIP) |
| Vector search | FAISS |

## Results

| Metric | Value |
|---|---|
| Catalog size | TBD |
| Top-1 accuracy | TBD |
| Top-5 accuracy | TBD |
| Avg. response time | TBD |

## Getting started

**Frontend:** open the folder in VS Code and run `home.html` with Live Server.

**Backend (planned):**

    cd backend
    python -m venv .venv
    .venv\Scripts\Activate.ps1
    pip install -r requirements.txt
    python build_index.py
    uvicorn app:app --reload

## Roadmap

- [x] Frontend
- [ ] Embedding generation + FAISS index
- [ ] /search API + frontend integration
- [ ] Threshold tuning and evaluation
- [ ] Deploy (Hugging Face Spaces + GitHub Pages)
- [ ] Shop the look, hybrid search

## Team

Hanoi University, Faculty of Information Technology: Tran Duc Tri, Ha Thai Son, Dau Tien Duc, Nguyen Dinh Huy
