"""
indexer.py — Offline Indexing Pipeline
=========================================
Script xử lý và đánh chỉ mục toàn bộ ảnh sản phẩm vào ChromaDB.

Pipeline:
  1. Đọc products_1000.json → dict {product_id → metadata}
  2. Duyệt từng sản phẩm → tìm file ảnh tương ứng
  3. Xác thực ảnh (kích thước tối thiểu, không phải corrupt)
  4. Tiền xử lý: Resize 224×224 → Normalize (ImageNet)
  5. Trích xuất Feature Vector 2048 chiều bằng ResNet50
  6. Lưu batch vào ChromaDB kèm metadata
  7. In báo cáo kết quả

Chạy standalone:
  python indexer.py [--reset]

  --reset : Xóa toàn bộ ChromaDB cũ trước khi index lại
"""

import argparse
import json
import logging
import sys
import time
from pathlib import Path

from tqdm import tqdm

# Cấu hình logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


# ── Hàm xác thực ảnh ─────────────────────────────────────────────────────────
def _validate_image(image_path: Path) -> bool:
    """
    Kiểm tra ảnh hợp lệ:
    - File tồn tại
    - Kích thước tối thiểu 1KB (tránh ảnh bị corrupt/placeholder)
    - Đọc được bằng PIL
    """
    if not image_path.exists():
        return False
    if image_path.stat().st_size < 1024:  # bỏ qua file < 1KB
        return False
    return True


# ── Main indexing function ────────────────────────────────────────────────────
def run_indexing(reset: bool = False) -> dict:
    """
    Chạy toàn bộ offline indexing pipeline.
    
    Returns:
        dict với thống kê: {total, indexed, skipped, errors, time_seconds}
    """
    from config import PRODUCTS_JSON, IMAGE_DIR
    from model import extract_features_from_path, get_model
    from database import upsert_batch, delete_all, get_collection_count

    logger.info("=" * 60)
    logger.info("FSS AI SERVICE — OFFLINE INDEXING PIPELINE")
    logger.info("=" * 60)

    # 1. Reset nếu cần
    if reset:
        logger.info("🗑️  Reset: Đang xóa ChromaDB cũ...")
        delete_all()
        logger.info("✅ Đã xóa ChromaDB cũ.")

    # 2. Khởi động model trước (tránh delay trong vòng lặp)
    logger.info("🧠 Đang tải ResNet50...")
    get_model()
    logger.info("✅ Model đã sẵn sàng.")

    # 3. Đọc metadata sản phẩm
    if not PRODUCTS_JSON.exists():
        logger.error(f"❌ Không tìm thấy file: {PRODUCTS_JSON}")
        sys.exit(1)

    with open(PRODUCTS_JSON, "r", encoding="utf-8") as f:
        products = json.load(f)
    logger.info(f"📋 Tìm thấy {len(products)} sản phẩm trong JSON.")

    # 4. Xây dựng map: image_filename → product metadata
    #    Ảnh có thể không tồn tại → bỏ qua
    stats = {
        "total":        len(products),
        "indexed":      0,
        "skipped":      0,
        "errors":       0,
        "time_seconds": 0,
    }

    BATCH_SIZE = 32  # Lưu ChromaDB theo batch để tối ưu I/O
    batch_records = []
    start_time = time.time()

    logger.info(f"📁 Thư mục ảnh: {IMAGE_DIR}")
    logger.info(f"🚀 Bắt đầu trích xuất đặc trưng (batch_size={BATCH_SIZE})...")
    logger.info("-" * 60)

    for product in tqdm(products, desc="Indexing", unit="ảnh"):
        product_id = product.get("id")
        if not product_id:
            stats["skipped"] += 1
            continue

        # Xác định đường dẫn ảnh
        image_filename = f"{product_id}.jpg"
        image_path = IMAGE_DIR / image_filename

        # Xác thực ảnh
        if not _validate_image(image_path):
            logger.debug(f"  ⚠️  Bỏ qua {image_filename}: không tồn tại hoặc quá nhỏ")
            stats["skipped"] += 1
            continue

        # Trích xuất đặc trưng
        try:
            features = extract_features_from_path(str(image_path))
            if features is None:
                stats["errors"] += 1
                continue
        except Exception as e:
            logger.warning(f"  ❌ Lỗi khi xử lý {image_filename}: {e}")
            stats["errors"] += 1
            continue

        # Chuẩn bị record cho batch upsert
        image_url_path = f"/fashion-dataset/images/{image_filename}"
        batch_records.append({
            "product_id":      str(product_id),
            "embedding":       features.tolist(),
            "image_path":      image_url_path,
            "gender":          product.get("gender", ""),
            "master_category": product.get("masterCategory", ""),
            "sub_category":    product.get("subCategory", ""),
            "article_type":    product.get("articleType", ""),
        })
        stats["indexed"] += 1

        # Flush batch khi đủ BATCH_SIZE
        if len(batch_records) >= BATCH_SIZE:
            upsert_batch(batch_records)
            batch_records = []

    # Flush batch còn lại
    if batch_records:
        upsert_batch(batch_records)

    stats["time_seconds"] = round(time.time() - start_time, 1)

    # 5. Báo cáo kết quả
    total_in_db = get_collection_count()
    logger.info("=" * 60)
    logger.info("📊 KẾT QUẢ INDEXING:")
    logger.info(f"   Tổng sản phẩm trong JSON : {stats['total']}")
    logger.info(f"   ✅ Đã index thành công    : {stats['indexed']}")
    logger.info(f"   ⚠️  Bỏ qua (ảnh lỗi/thiếu): {stats['skipped']}")
    logger.info(f"   ❌ Lỗi xử lý             : {stats['errors']}")
    logger.info(f"   🗄️  Tổng vectors trong DB  : {total_in_db}")
    logger.info(f"   ⏱️  Thời gian              : {stats['time_seconds']}s")
    logger.info("=" * 60)

    return stats


# ── CLI Entry Point ───────────────────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="FSS AI Service — Offline Indexing Pipeline"
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Xóa toàn bộ ChromaDB cũ và index lại từ đầu",
    )
    args = parser.parse_args()

    run_indexing(reset=args.reset)
    logger.info("🎉 Indexing hoàn tất!")
