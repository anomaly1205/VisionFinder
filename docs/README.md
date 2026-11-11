# Documentation

Course documents for **VisionFinder**: ATI assignment, Faculty of Information Technology, Hanoi University.

| File | Description |
|---|---|
| [ATI_Report.pdf](ATI_Report.pdf) | Project report (read online) |
| [ATI_Report.docx](ATI_Report.docx) | Project report (editable Word file) |
| [VisionFinder_Code_Documentation.docx](VisionFinder_Code_Documentation.docx) | Code walkthrough in Vietnamese: architecture, every backend/frontend file, AI concepts, results, presentation Q&A |
| [images/architecture.png](images/architecture.png) | Figure 1: system architecture (offline + online pipelines) |
| [images/clip-similarity.png](images/clip-similarity.png) | Figure 2: CLIP embeddings, cosine similarity, vector store and top-k |

## System architecture

![VisionFinder system architecture](images/architecture.png)

**Offline:** catalog images are preprocessed, converted into embeddings by a multimodal model (CLIP) and stored in a vector store with their product IDs.
**Online:** the user's query image goes through the same steps, is compared with the stored vectors by cosine similarity, and the top-k products are returned if the best score passes a confidence threshold; otherwise the system answers "no confident match".

![How CLIP embeddings, cosine similarity and top-k work together](images/clip-similarity.png)

## Results (from the report)

Measured on 999 real query photos (other camera angles of the 500 catalog products), laptop CPU, OpenCLIP ViT-B-32:

| Metric | Target | Achieved |
|---|---|---|
| Top-1 accuracy | ≥ 55% | **60.0%** |
| Top-5 accuracy | ≥ 70% | **74.7%** |
| Response time per query | < 0.5 s | **99 ms** (p95: 107 ms) |
| Catalog size | 500 products | 500 products, 7 categories |

## Notes

- Figure 2 uses illustrative handicraft examples (bamboo hat, rattan rug) from the original plan; the implemented catalog is home & living products from the Amazon Berkeley Objects dataset.
- Figure 2 shows an illustrative threshold of 0.50; the tuned threshold for image search is 0.825 (see `backend/eval_results.json`).

## Team

Tran Duc Tri, Ha Thai Son, Dau Tien Duc, Nguyen Dinh Huy
