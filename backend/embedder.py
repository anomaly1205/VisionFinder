"""CLIP image/text embeddings (L2-normalised float32)."""
import numpy as np
import open_clip
import torch
from PIL import Image, ImageOps

from config import MODEL, PRETRAINED


def load_image(src):
    """Open a path or file-like as RGB: EXIF-rotated, transparency on white, padded to a white square.

    Padding matters: CLIP's preprocess center-crops, which would cut the ends off wide or tall products.
    Raises PIL errors if src is not an image.
    """
    img = Image.open(src)
    img.load()
    img = ImageOps.exif_transpose(img)
    if img.mode in ("RGBA", "LA", "PA") or (img.mode == "P" and "transparency" in img.info):
        img = img.convert("RGBA")
        bg = Image.new("RGB", img.size, "white")
        bg.paste(img, mask=img.getchannel("A"))
        img = bg
    img = img.convert("RGB")
    w, h = img.size
    side = max(w, h)
    square = Image.new("RGB", (side, side), "white")
    square.paste(img, ((side - w) // 2, (side - h) // 2))
    return square


class Embedder:
    def __init__(self):
        self.model, _, self.preprocess = open_clip.create_model_and_transforms(MODEL, pretrained=PRETRAINED)
        self.model.eval()
        self.tokenizer = open_clip.get_tokenizer(MODEL)

    @torch.inference_mode()
    def embed_images(self, images, batch=32):
        """images: PIL images or paths. Returns (n, d) float32."""
        out = []
        for i in range(0, len(images), batch):
            chunk = [im if isinstance(im, Image.Image) else load_image(im) for im in images[i:i + batch]]
            x = torch.stack([self.preprocess(im) for im in chunk])
            out.append(self.model.encode_image(x, normalize=True).numpy())
        return np.concatenate(out).astype("float32")

    @torch.inference_mode()
    def embed_texts(self, texts):
        return self.model.encode_text(self.tokenizer(texts), normalize=True).numpy().astype("float32")
