# FSS AI Service

Microservice tìm kiếm sản phẩm thời trang bằng hình ảnh, sử dụng **ResNet50** và **ChromaDB**.

## Cấu trúc

```
fss-ai-service/
├── main.py          # FastAPI server (endpoints)
├── model.py         # ResNet50 feature extractor + preprocessing
├── database.py      # ChromaDB vector store
├── indexer.py       # Offline indexing pipeline
├── config.py        # Cấu hình đường dẫn & tham số
├── requirements.txt # Python dependencies
├── setup.ps1        # Script cài đặt tự động (Windows)
└── chroma_db/       # ChromaDB data (tự tạo khi chạy indexer)
```

## Khởi động nhanh

### Bước 1: Cài đặt
```powershell
cd d:\DATN\Web_FSS\fss-ai-service
.\setup.ps1
```
> Script tự động: tạo venv → cài thư viện → index ảnh → khởi động server

### Bước 2 (thủ công nếu cần)
```powershell
# Tạo virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Cài dependencies
pip install -r requirements.txt

# Index toàn bộ ảnh sản phẩm (chạy 1 lần đầu, mất ~5-15 phút)
python indexer.py --reset

# Khởi động server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## API Endpoints

| Method | URL | Mô tả |
|--------|-----|-------|
| `GET`  | `/api/v1/status` | Health check + số vectors đã index |
| `POST` | `/api/v1/search-by-image` | Tìm kiếm theo ảnh |
| `POST` | `/api/v1/index-data` | Trigger re-index (background) |

### POST /api/v1/search-by-image

**Request:** `multipart/form-data`
- `file` (required): File ảnh JPG/PNG/WEBP
- `top_k` (optional, default=10): Số kết quả
- `gender` (optional): Men / Women / Unisex / Boys / Girls
- `category` (optional): Apparel / Footwear / Accessories

**Response:**
```json
{
  "success": true,
  "query_info": { "filename": "shirt.jpg", "top_k": 10 },
  "results": [
    {
      "product_id": 6286,
      "similarity_score": 0.9342,
      "image_path": "/fashion-dataset/images/6286.jpg",
      "gender": "Men",
      "master_category": "Apparel",
      "article_type": "Tshirts"
    }
  ],
  "total_found": 10
}
```

## Pipeline AI

### Offline (Indexing)
```
products_1000.json → [product_id, image_path, metadata]
      ↓
Duyệt từng ảnh → Xác thực (tồn tại, > 1KB)
      ↓
Resize 224×224 → ToTensor → Normalize(ImageNet mean/std)
      ↓
ResNet50 (bỏ FC) → GlobalAvgPool → [2048-dim]
      ↓
L2 Normalize → ChromaDB upsert (batch 32)
```

### Online (Search)
```
Upload ảnh → Validate (content-type, size < 20MB)
      ↓
Decode bytes → PIL Image → Resize 224×224
      ↓
Normalize(ImageNet) → ResNet50 → L2 Normalize → [2048-dim]
      ↓
ChromaDB query (cosine distance, top-k, optional gender/category filter)
      ↓
[{product_id, similarity_score}] → Spring Boot → PostgreSQL
      ↓
[{full product + similarityScore}] → Frontend
```

## Yêu cầu hệ thống
- Python 3.9+
- RAM: tối thiểu 4GB (ResNet50 ~1.5GB + ChromaDB)
- CPU mode (không cần GPU)
- Đĩa: ~500MB (model cache) + ~50MB (ChromaDB 1000 vectors × 2048 dims)
