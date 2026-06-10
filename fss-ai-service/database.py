"""
database.py — ChromaDB Vector Store
=====================================
Quản lý ChromaDB: lưu vector đặc trưng và truy vấn tìm kiếm tương đồng.

Schema mỗi document trong ChromaDB:
  id         : str  — product_id (e.g. "43666")
  embedding  : List[float] — vector 2048 chiều
  metadata   :
    product_id   : str
    image_path   : str  — đường dẫn tương đối (/fashion-dataset/images/xxx.jpg)
    gender       : str  — Men / Women / Unisex / Boys / Girls
    master_category : str  — Apparel / Footwear / Accessories / ...
    sub_category : str
    article_type : str
"""

import logging
from functools import lru_cache
from typing import Optional

import chromadb
from chromadb.config import Settings

from config import CHROMA_DIR, COLLECTION_NAME, DEFAULT_TOP_K

logger = logging.getLogger(__name__)


# ── Singleton ChromaDB Client ────────────────────────────────────────────────
@lru_cache(maxsize=1)
def get_chroma_client() -> chromadb.PersistentClient:
    """Khởi tạo ChromaDB persistent client một lần duy nhất."""
    CHROMA_DIR.mkdir(parents=True, exist_ok=True)
    logger.info(f"Kết nối ChromaDB tại: {CHROMA_DIR}")
    client = chromadb.PersistentClient(path=str(CHROMA_DIR))
    return client


def get_collection() -> chromadb.Collection:
    """
    Lấy hoặc tạo collection với cosine distance metric.
    Cosine similarity = 1 - cosine_distance.
    """
    client = get_chroma_client()
    collection = client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},  # dùng Cosine distance
    )
    return collection


# ── Lưu vector vào ChromaDB ──────────────────────────────────────────────────
def upsert_product(
    product_id: str,
    embedding: list[float],
    image_path: str,
    gender: str,
    master_category: str,
    sub_category: str = "",
    article_type: str = "",
) -> None:
    """
    Lưu (hoặc cập nhật) vector đặc trưng của một sản phẩm vào ChromaDB.
    Dùng upsert để tránh duplicate khi re-index.
    """
    collection = get_collection()
    collection.upsert(
        ids=[str(product_id)],
        embeddings=[embedding],
        metadatas=[{
            "product_id":      str(product_id),
            "image_path":      image_path,
            "gender":          gender,
            "master_category": master_category,
            "sub_category":    sub_category,
            "article_type":    article_type,
        }],
    )


def upsert_batch(records: list[dict]) -> None:
    """
    Lưu hàng loạt records vào ChromaDB (hiệu quả hơn upsert từng cái).
    Mỗi record: {product_id, embedding, image_path, gender, master_category, sub_category, article_type}
    """
    if not records:
        return

    collection = get_collection()
    collection.upsert(
        ids=[str(r["product_id"]) for r in records],
        embeddings=[r["embedding"] for r in records],
        metadatas=[{
            "product_id":      str(r["product_id"]),
            "image_path":      r["image_path"],
            "gender":          r.get("gender", ""),
            "master_category": r.get("master_category", ""),
            "sub_category":    r.get("sub_category", ""),
            "article_type":    r.get("article_type", ""),
        } for r in records],
    )
    logger.info(f"Đã upsert {len(records)} records vào ChromaDB")


# ── Tìm kiếm vector tương đồng ───────────────────────────────────────────────
def search_similar(
    query_embedding: list[float],
    top_k: int = DEFAULT_TOP_K,
    gender_filter: Optional[str] = None,
    category_filter: Optional[str] = None,
) -> list[dict]:
    """
    Tìm Top-K sản phẩm có vector gần nhất với query_embedding.
    """
    collection = get_collection()

    # Xây dựng where filter (ChromaDB metadata filtering)
    where_conditions = []
    if gender_filter and gender_filter.lower() not in ("", "all"):
        where_conditions.append({"gender": {"$eq": gender_filter}})
    if category_filter and category_filter.lower() not in ("", "all"):
        where_conditions.append({"master_category": {"$eq": category_filter}})

    where = None
    if len(where_conditions) == 1:
        where = where_conditions[0]
    elif len(where_conditions) > 1:
        where = {"$and": where_conditions}

    # Truy vấn ChromaDB
    query_params = {
        "query_embeddings": [query_embedding],
        "n_results":        min(top_k, collection.count() or 1),
        "include":          ["metadatas", "distances"],
    }
    if where:
        query_params["where"] = where

    results = collection.query(**query_params)

    # Chuyển đổi kết quả
    output = []
    ids        = results["ids"][0]
    distances  = results["distances"][0]
    metadatas  = results["metadatas"][0]

    for pid, dist, meta in zip(ids, distances, metadatas):
        similarity = round(float(1.0 - dist), 4)
        output.append({
            "product_id":      int(pid),
            "similarity_score": similarity,
            "image_path":      meta.get("image_path", ""),
            "gender":          meta.get("gender", ""),
            "master_category": meta.get("master_category", ""),
            "article_type":    meta.get("article_type", ""),
        })

    output.sort(key=lambda x: x["similarity_score"], reverse=True)
    return output


def get_vector_by_id(product_id: str) -> Optional[list[float]]:
    """
    Lấy vector đặc trưng của sản phẩm đã được index sẵn trong ChromaDB.
    Dùng cho tính năng "Tìm sản phẩm tương đồng" từ sản phẩm trong kho.
    Trả về None nếu product_id không tồn tại.
    """
    collection = get_collection()
    try:
        result = collection.get(
            ids=[str(product_id)],
            include=["embeddings"],
        )
        if result["embeddings"] and len(result["embeddings"]) > 0:
            return result["embeddings"][0]
        return None
    except Exception as e:
        logger.warning(f"Không tìm thấy vector cho product_id={product_id}: {e}")
        return None


def get_collection_count() -> int:
    """Trả về số lượng vectors đang lưu trong ChromaDB."""
    try:
        return get_collection().count()
    except Exception:
        return 0


def delete_all() -> None:
    """Xóa toàn bộ dữ liệu trong collection (dùng khi re-index từ đầu)."""
    client = get_chroma_client()
    try:
        client.delete_collection(COLLECTION_NAME)
        logger.info(f"Đã xóa collection '{COLLECTION_NAME}'")
    except Exception:
        pass


def delete_product(product_id: str) -> None:
    """Xóa vector của một sản phẩm khỏi ChromaDB."""
    collection = get_collection()
    try:
        collection.delete(ids=[str(product_id)])
        logger.info(f"Đã xóa vector của product_id={product_id} khỏi ChromaDB")
    except Exception as e:
        logger.warning(f"Lỗi khi xóa vector cho product_id={product_id}: {e}")
