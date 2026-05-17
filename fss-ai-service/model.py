"""
model.py — ResNet50 Feature Extractor
======================================
Sử dụng ResNet50 pretrained (ImageNet) với lớp FC cuối bị bỏ.
Output: vector 2048 chiều (sau GlobalAvgPool).

Pipeline tiền xử lý ảnh (Online):
  1. Decode bytes → PIL Image (RGB)
  2. Resize → 224×224
  3. ToTensor → [C, H, W] float [0,1]
  4. Normalize theo ImageNet mean/std
  5. Unsqueeze → [1, C, H, W] (batch=1)
  6. Forward qua ResNet50 → [1, 2048]
  7. Flatten → numpy array [2048]
  8. L2-normalize (để Cosine distance = Euclidean distance)
"""

import io
import logging
from functools import lru_cache

import numpy as np
import torch
import torch.nn as nn
from PIL import Image, UnidentifiedImageError
from torchvision import models, transforms

from config import IMAGE_SIZE, IMAGENET_MEAN, IMAGENET_STD, FEATURE_DIM

logger = logging.getLogger(__name__)


# ── Tiền xử lý ảnh ──────────────────────────────────────────────────────────
_preprocess = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
])


# ── Singleton Model ──────────────────────────────────────────────────────────
@lru_cache(maxsize=1)
def get_model() -> nn.Module:
    """
    Load ResNet50 pretrained một lần duy nhất (singleton).
    Bỏ lớp FC cuối (classifier), giữ lại phần feature extractor.
    """
    logger.info("Loading ResNet50 pretrained model...")
    backbone = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V1)

    # Bỏ lớp Fully Connected cuối → output [batch, 2048, 1, 1]
    # (AdaptiveAvgPool2d vẫn được giữ → output [batch, 2048, 1, 1])
    extractor = nn.Sequential(*list(backbone.children())[:-1])
    extractor.eval()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    extractor = extractor.to(device)

    logger.info(f"Model loaded on {device}. Feature dim: {FEATURE_DIM}")
    return extractor


def _get_device() -> torch.device:
    return torch.device("cuda" if torch.cuda.is_available() else "cpu")


# ── Xử lý ảnh từ file path (dùng cho Offline Indexing) ─────────────────────
def preprocess_image_from_path(image_path: str) -> torch.Tensor | None:
    """
    Đọc ảnh từ đường dẫn, tiền xử lý thành tensor.
    Trả về None nếu ảnh lỗi/không đọc được.
    """
    try:
        img = Image.open(image_path).convert("RGB")
        return _preprocess(img).unsqueeze(0)  # [1, 3, 224, 224]
    except (UnidentifiedImageError, OSError, Exception) as e:
        logger.warning(f"Bỏ qua ảnh lỗi {image_path}: {e}")
        return None


# ── Xử lý ảnh từ bytes (dùng cho Online Search) ────────────────────────────
def preprocess_image_from_bytes(image_bytes: bytes) -> torch.Tensor:
    """
    Đọc ảnh từ raw bytes (multipart upload), tiền xử lý thành tensor.
    Raise ValueError nếu không phải ảnh hợp lệ.
    """
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except UnidentifiedImageError:
        raise ValueError("File tải lên không phải định dạng ảnh hợp lệ.")
    except Exception as e:
        raise ValueError(f"Không thể đọc ảnh: {e}")

    return _preprocess(img).unsqueeze(0)  # [1, 3, 224, 224]


# ── Trích xuất Feature Vector ────────────────────────────────────────────────
@torch.no_grad()
def extract_features(tensor: torch.Tensor) -> np.ndarray:
    """
    Nhận tensor đã tiền xử lý [1, 3, 224, 224].
    Trả về numpy array [2048] đã L2-normalize.
    """
    model = get_model()
    device = _get_device()

    tensor = tensor.to(device)
    output = model(tensor)              # [1, 2048, 1, 1]
    vector = output.squeeze().cpu().numpy()  # [2048]

    # L2 Normalize → Cosine similarity = Euclidean distance trên unit vectors
    norm = np.linalg.norm(vector)
    if norm > 1e-8:
        vector = vector / norm

    return vector.astype(np.float32)


# ── Hàm tiện ích tổng hợp ────────────────────────────────────────────────────
def extract_features_from_path(image_path: str) -> np.ndarray | None:
    """Pipeline đầy đủ: path → tensor → features. Dùng cho Indexing."""
    tensor = preprocess_image_from_path(image_path)
    if tensor is None:
        return None
    return extract_features(tensor)


def extract_features_from_bytes(image_bytes: bytes) -> np.ndarray:
    """Pipeline đầy đủ: bytes → tensor → features. Dùng cho Online Search."""
    tensor = preprocess_image_from_bytes(image_bytes)
    return extract_features(tensor)
