"""
config.py — Cấu hình trung tâm cho FSS AI Service
"""
import os
from pathlib import Path

# ── Đường dẫn gốc ─────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent.parent  # d:/DATN/Web_FSS

# Dataset ảnh sản phẩm
IMAGE_DIR = BASE_DIR / "fashion-dataset" / "images"

# File JSON metadata sản phẩm
PRODUCTS_JSON = BASE_DIR / "fashion-dataset" / "products_1000.json"

# Thư mục lưu ChromaDB persistent
CHROMA_DIR = Path(__file__).parent / "chroma_db"

# ── Cấu hình ChromaDB ─────────────────────────────────────────────────────────
COLLECTION_NAME = "fashion_products"

# ── Cấu hình ResNet50 ─────────────────────────────────────────────────────────
FEATURE_DIM = 2048          # Số chiều vector đặc trưng (output của AvgPool ResNet50)
IMAGE_SIZE = 224            # Kích thước ảnh input

# ImageNet normalization (chuẩn hóa màu sắc)
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD  = [0.229, 0.224, 0.225]

# ── Tham số tìm kiếm ─────────────────────────────────────────────────────────
DEFAULT_TOP_K = 10          # Số sản phẩm tương đồng trả về mặc định

# ── Server ────────────────────────────────────────────────────────────────────
AI_SERVICE_HOST = "0.0.0.0"
AI_SERVICE_PORT = 8000
