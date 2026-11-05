# VisionFinder Home

**Search home & living products by photo, not by keywords.**

VisionFinder Home is a home & living e-commerce demo with AI-powered visual search. Snap or upload a photo of a chair, lamp, rug or vase, crop the item you care about, and the system finds the closest matching products in the catalog. You can also search by a short text description.

> Work in progress. Items marked (planned) are not done yet.

## Features

- [ ] **Image search**: upload / drag & drop / paste a photo, get the top-k most similar products with a similarity score (planned)
- [ ] **Crop before search**: select only the product region of the photo (planned)
- [ ] **Text search**: describe the product ("light wood dining chair") and search the same embedding space (planned)
- [ ] **Confidence threshold**: returns "No confident match" instead of a wrong answer (planned)
- [ ] **Visually similar**: product pages suggest look-alike items (planned)
- [ ] **Shop the look**: detect several items in a room photo and search each one (planned)
- [x] **Catalog**: 500 home & living products across 7 categories

## How it works

1. **Offline:** each product's main image is converted into a vector (embedding) by a pretrained CLIP model and stored in a FAISS index.
2. **Online:** the user's photo (or text) goes through the same model and is compared with all product vectors by cosine similarity.
3. The top-k closest products are returned if the best score passes a confidence threshold, otherwise "No confident match".

**Why not train a classifier?** No large labeled dataset or GPU training is needed, and a new product becomes searchable by embedding its image, with no retraining. Trade-off: lower accuracy on near-identical products, controlled by the threshold.

## Dataset

Products come from the [Amazon Berkeley Objects (ABO)](https://amazon-berkeley-objects.s3.amazonaws.com/index.html) dataset.

| | |
|---|---|
| Catalog | 500 products, balanced across Furniture, Lighting, Rugs, Decor, Storage, Plants, Textiles |
| Holdout | 100 products not in the catalog, used to tune the "no match" threshold |
| Images | 1,766 images; each product has a main image plus other camera angles |

Evaluation uses the **other camera angles** of each product as queries, so accuracy is measured on real multi-view photos rather than synthetic augmentations.

`backend/prepare_data.py` selects the products (fixed seed) and downloads the images.

## Results

| Metric | Value |
|---|---|
| Top-1 accuracy | TBD |
| Top-5 accuracy | TBD |
| Avg. response time | TBD |

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | HTML, CSS, vanilla JavaScript, Cropper.js |
| Backend API | Python, FastAPI |
| Image preprocessing | Pillow |
| Multimodal model | CLIP (OpenCLIP ViT-B-32) |
| Vector search | FAISS (cosine similarity) |

## Project structure

    VisionFinder/
    ├── frontend/
    │   ├── index.html, products.html, product.html, cart.html, search.html
    │   ├── data/products.json      # catalog (shared with backend)
    │   └── assets/products/        # product images (shared with backend)
    └── backend/
        ├── prepare_data.py         # select products from ABO + download images
        ├── build_index.py          # (planned) images -> CLIP vectors -> FAISS index
        ├── app.py                  # (planned) FastAPI search API
        └── evaluate.py             # (planned) Top-1 / Top-5 / latency / threshold

## Getting started

**Frontend:** open the repo in VS Code and run Live Server (root is `frontend/`, port 5501).

**Data (already included):** to rebuild, download `abo-listings.tar` and `images.csv.gz` from ABO, then run `python backend/prepare_data.py`.

**Backend (planned):**

    cd backend
    python -m venv .venv
    .venv\Scripts\Activate.ps1
    pip install -r requirements.txt
    python build_index.py
    uvicorn app:app --reload

## Roadmap

- [x] Select 500 home & living products from ABO
- [ ] Frontend redesign (Scandinavian minimal) with AI search UI
- [ ] CLIP embeddings + FAISS index
- [ ] Search API + frontend integration
- [ ] Evaluation and threshold tuning
- [ ] Deploy (GitHub Pages + Hugging Face Spaces)
- [ ] Shop the look

## Credits

Product data and images: Amazon.com, [Amazon Berkeley Objects](https://amazon-berkeley-objects.s3.amazonaws.com/index.html), licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Images are unmodified. Prices shown on the site are for demo only.

Built at Hanoi University, Faculty of Information Technology.
