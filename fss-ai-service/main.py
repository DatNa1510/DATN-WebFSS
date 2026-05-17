"""
main.py — FSS AI Service (FastAPI)
=====================================
AI Microservice xử lý tìm kiếm sản phẩm bằng hình ảnh.

Endpoints:
  POST /api/v1/search-by-image  — Tìm sản phẩm tương đồng từ ảnh upload
  POST /api/v1/index-data       — Trigger re-index toàn bộ kho ảnh
  GET  /api/v1/status           — Health check + thống kê ChromaDB

Startup:
  uvicorn main:app --host 0.0.0.0 --port 8000 --reload
"""

import logging
from contextlib import asynccontextmanager
from typing import Optional

import uvicorn
from fastapi import BackgroundTasks, FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from config import AI_SERVICE_HOST, AI_SERVICE_PORT, DEFAULT_TOP_K
from database import get_collection_count, search_similar, get_vector_by_id
from model import extract_features_from_bytes, get_model

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


# ── Lifespan: Khởi động model khi server start ───────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 FSS AI Service đang khởi động...")
    logger.info("🧠 Pre-loading ResNet50 model...")
    get_model()  # Load model vào cache ngay khi start
    count = get_collection_count()
    logger.info(f"🗄️  ChromaDB: {count} vectors đã được index.")
    if count == 0:
        logger.warning("⚠️  ChromaDB TRỐNG! Hãy chạy: python indexer.py --reset")
    logger.info("✅ AI Service sẵn sàng nhận request!")
    yield
    logger.info("🛑 AI Service đang tắt...")


# ── FastAPI App ──────────────────────────────────────────────────────────────
app = FastAPI(
    title="FSS AI Image Search Service",
    description="Fashion Shopping Sense — AI-powered visual product search using ResNet50 + ChromaDB",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — cho phép Spring Boot và Frontend gọi
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Pydantic Response Schemas ─────────────────────────────────────────────────
class SearchResultItem(BaseModel):
    product_id:       int
    similarity_score: float
    image_path:       str
    gender:           str
    master_category:  str
    article_type:     str


class SearchResponse(BaseModel):
    success:     bool
    query_info:  dict
    results:     list[SearchResultItem]
    total_found: int


class IndexResponse(BaseModel):
    success: bool
    message: str
    stats:   Optional[dict] = None


class StatusResponse(BaseModel):
    status:          str
    indexed_count:   int
    model_loaded:    bool


# ── Endpoint: Health Check ───────────────────────────────────────────────────
@app.get("/api/v1/status", response_model=StatusResponse, tags=["Health"])
async def get_status():
    """Kiểm tra trạng thái service và số lượng vectors đã index."""
    count = get_collection_count()
    return StatusResponse(
        status="ok",
        indexed_count=count,
        model_loaded=True,
    )


# ── Endpoint: Tìm kiếm bằng ảnh ─────────────────────────────────────────────
@app.post("/api/v1/search-by-image", response_model=SearchResponse, tags=["Search"])
async def search_by_image(
    file: UploadFile = File(..., description="Ảnh sản phẩm cần tìm (JPG/PNG/WEBP)"),
    top_k: int = Query(default=DEFAULT_TOP_K, ge=1, le=50, description="Số kết quả trả về"),
    gender: Optional[str] = Query(default=None, description="Lọc theo giới tính: Men/Women/Unisex"),
    category: Optional[str] = Query(default=None, description="Lọc theo danh mục: Apparel/Footwear/Accessories"),
):
    """
    **Online Inference Pipeline:**
    
    1. Nhận file ảnh từ multipart/form-data
    2. Xác thực file (content-type, kích thước)
    3. Đọc bytes → Tiền xử lý (Resize 224×224 → Normalize ImageNet)
    4. Trích xuất Feature Vector 2048 chiều bằng ResNet50
    5. Truy vấn ChromaDB → Top-K Cosine Similarity
    6. Trả về danh sách product_id + similarity_score
    """
    # ── Bước 1: Xác thực file đầu vào ──────────────────────────────────────
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail=f"File không hợp lệ. Chỉ chấp nhận ảnh (image/*). Nhận được: {file.content_type}",
        )

    image_bytes = await file.read()

    # Giới hạn kích thước file: 20MB
    MAX_SIZE = 20 * 1024 * 1024
    if len(image_bytes) > MAX_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File quá lớn ({len(image_bytes)//1024}KB). Tối đa 20MB.",
        )

    if len(image_bytes) < 100:
        raise HTTPException(status_code=400, detail="File ảnh quá nhỏ hoặc bị lỗi.")

    # ── Bước 2: Tiền xử lý + Trích xuất đặc trưng ──────────────────────────
    try:
        logger.info(f"🔍 Xử lý ảnh: {file.filename} ({len(image_bytes)//1024}KB)")
        query_vector = extract_features_from_bytes(image_bytes)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Lỗi trích xuất đặc trưng: {e}")
        raise HTTPException(status_code=500, detail="Lỗi xử lý ảnh. Vui lòng thử lại.")

    # ── Bước 3: Kiểm tra ChromaDB không rỗng ───────────────────────────────
    count = get_collection_count()
    if count == 0:
        raise HTTPException(
            status_code=503,
            detail="ChromaDB chưa có dữ liệu. Vui lòng chạy indexer trước.",
        )

    # ── Bước 4: Truy vấn ChromaDB ───────────────────────────────────────────
    try:
        raw_results = search_similar(
            query_embedding=query_vector.tolist(),
            top_k=top_k,
            gender_filter=gender,
            category_filter=category,
        )
    except Exception as e:
        logger.error(f"Lỗi ChromaDB query: {e}")
        raise HTTPException(status_code=500, detail="Lỗi tìm kiếm. Vui lòng thử lại.")

    logger.info(f"✅ Tìm thấy {len(raw_results)} kết quả (top_k={top_k}, gender={gender}, category={category})")

    # ── Bước 5: Chuẩn bị response ───────────────────────────────────────────
    results = [SearchResultItem(**item) for item in raw_results]

    return SearchResponse(
        success=True,
        query_info={
            "filename":  file.filename,
            "file_size": len(image_bytes),
            "top_k":     top_k,
            "gender":    gender,
            "category":  category,
        },
        results=results,
        total_found=len(results),
    )


# ── Endpoint: Tìm sản phẩm tương đồng từ product có sẵn ────────────────────
@app.get("/api/v1/similar/{product_id}", response_model=SearchResponse, tags=["Search"])
async def search_similar_by_id(
    product_id: int,
    top_k: int = Query(default=DEFAULT_TOP_K, ge=1, le=50, description="Số kết quả trả về"),
    gender: Optional[str] = Query(default=None, description="Lọc theo giới tính"),
    category: Optional[str] = Query(default=None, description="Lọc theo danh mục"),
):
    """
    **Tìm sản phẩm tương đồng từ sản phẩm trong kho:**

    1. Lấy vector đặc trưng của product_id từ ChromaDB (không cần chạy ResNet50)
    2. Truy vấn Top-K Cosine Similarity trong ChromaDB
    3. Loại trừ chính sản phẩm đó khỏi kết quả
    4. Trả về danh sách sản phẩm tương đồng
    """
    # Bước 1: Lấy vector từ ChromaDB
    vector = get_vector_by_id(str(product_id))
    if vector is None:
        raise HTTPException(
            status_code=404,
            detail=f"Không tìm thấy vector cho sản phẩm ID={product_id}. "
                   f"Sản phẩm này có thể chưa được index vào ChromaDB.",
        )

    logger.info(f"🔍 Tìm sản phẩm tương đồng với product_id={product_id}")

    # Bước 2: Tìm tương đồng (lấy top_k+1 để loại trừ chính nó)
    try:
        raw_results = search_similar(
            query_embedding=vector,
            top_k=top_k + 1,
            gender_filter=gender,
            category_filter=category,
        )
    except Exception as e:
        logger.error(f"Lỗi ChromaDB query: {e}")
        raise HTTPException(status_code=500, detail="Lỗi tìm kiếm. Vui lòng thử lại.")

    # Bước 3: Loại trừ chính sản phẩm khỏi kết quả
    filtered = [r for r in raw_results if r["product_id"] != product_id][:top_k]

    logger.info(f"✅ Tìm thấy {len(filtered)} sản phẩm tương đồng với product_id={product_id}")

    results = [SearchResultItem(**item) for item in filtered]
    return SearchResponse(
        success=True,
        query_info={
            "source_product_id": product_id,
            "top_k":             top_k,
            "gender":            gender,
            "category":          category,
        },
        results=results,
        total_found=len(results),
    )


# ── Endpoint: Trigger Re-index ───────────────────────────────────────────────
def _run_index_background(reset: bool):
    """Hàm chạy indexing trong background thread."""
    try:
        from indexer import run_indexing
        run_indexing(reset=reset)
    except Exception as e:
        logger.error(f"Lỗi trong quá trình indexing: {e}")


@app.post("/api/v1/index-data", response_model=IndexResponse, tags=["Management"])
async def index_data(
    background_tasks: BackgroundTasks,
    reset: bool = Query(default=False, description="True = xóa dữ liệu cũ và index lại"),
):
    """
    **Offline Indexing Pipeline (Async):**
    
    Trigger quá trình đánh chỉ mục lại toàn bộ kho ảnh sản phẩm.
    Chạy trong background, trả về ngay lập tức.
    Dùng GET /api/v1/status để theo dõi tiến độ.
    """
    current_count = get_collection_count()
    
    if current_count > 0 and not reset:
        return IndexResponse(
            success=True,
            message=f"ChromaDB đã có {current_count} vectors. Dùng reset=true để index lại.",
            stats={"current_count": current_count},
        )

    background_tasks.add_task(_run_index_background, reset)
    
    return IndexResponse(
        success=True,
        message=f"Indexing đã bắt đầu trong background. {'(Reset mode)' if reset else ''}",
    )


# ── Entry Point ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=AI_SERVICE_HOST,
        port=AI_SERVICE_PORT,
        reload=True,
        log_level="info",
    )
