"""
Script lọc ảnh sản phẩm: so sánh ảnh trong thư mục với dữ liệu sản phẩm thực tế.
Kết quả: Liệt kê ảnh đang dùng, ảnh thừa, và ảnh thiếu.
"""
import json
import os

# Đường dẫn
IMAGES_DIR = r"D:\DATN\Web_FSS\fashion-dataset\images"
PRODUCTS_JSON = r"D:\DATN\Web_FSS\fashion-dataset\products_1000.json"

def main():
    # 1. Đọc danh sách sản phẩm từ JSON
    with open(PRODUCTS_JSON, "r", encoding="utf-8") as f:
        products = json.load(f)
    
    print(f"{'='*60}")
    print(f"  THỐNG KÊ ẢNH SẢN PHẨM")
    print(f"{'='*60}")
    print(f"\n📦 Tổng sản phẩm trong JSON: {len(products)}")
    
    # 2. Lấy danh sách ID sản phẩm và imageUrl từ JSON
    product_ids = set()
    product_image_files = set()  # Tên file ảnh mà sản phẩm tham chiếu
    
    for p in products:
        pid = p.get("id")
        product_ids.add(str(pid))
        
        # Trích xuất tên file từ imageUrl (ví dụ: "/fashion-dataset/images/16080.jpg" -> "16080.jpg")
        image_url = p.get("imageUrl", "")
        if image_url:
            filename = os.path.basename(image_url)
            product_image_files.add(filename)
    
    # 3. Lấy danh sách file ảnh thực tế trong thư mục
    actual_files = set(os.listdir(IMAGES_DIR))
    actual_jpg = {f for f in actual_files if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))}
    
    print(f"🖼️  Tổng file ảnh trong thư mục: {len(actual_jpg)}")
    
    # 4. Phân loại ảnh
    # Ảnh khớp: có trong cả JSON và thư mục
    matched = product_image_files & actual_jpg
    
    # Ảnh thiếu: JSON tham chiếu nhưng không có file
    missing = product_image_files - actual_jpg
    
    # Ảnh thừa: có file nhưng không sản phẩm nào dùng
    unused = actual_jpg - product_image_files
    
    # Phân loại ảnh thừa thêm: UUID vs ID số
    uuid_files = [f for f in unused if len(f.replace('.jpg','').replace('.jpeg','').replace('.png','')) > 20]
    numeric_unused = [f for f in unused if f not in uuid_files]
    
    print(f"\n{'─'*60}")
    print(f"  KẾT QUẢ PHÂN LOẠI")
    print(f"{'─'*60}")
    print(f"\n✅ Ảnh ĐANG DÙNG (khớp sản phẩm):  {len(matched)}")
    print(f"❌ Ảnh THIẾU (SP có nhưng file không có): {len(missing)}")
    print(f"🗑️  Ảnh THỪA (file có nhưng SP không dùng): {len(unused)}")
    print(f"   ├── Ảnh số ID thừa: {len(numeric_unused)}")
    print(f"   └── Ảnh UUID (admin upload): {len(uuid_files)}")
    
    # 5. Tính dung lượng
    used_size = sum(os.path.getsize(os.path.join(IMAGES_DIR, f)) for f in matched if os.path.exists(os.path.join(IMAGES_DIR, f)))
    unused_size = sum(os.path.getsize(os.path.join(IMAGES_DIR, f)) for f in unused if os.path.exists(os.path.join(IMAGES_DIR, f)))
    total_size = sum(os.path.getsize(os.path.join(IMAGES_DIR, f)) for f in actual_jpg if os.path.exists(os.path.join(IMAGES_DIR, f)))
    
    print(f"\n{'─'*60}")
    print(f"  DUNG LƯỢNG")
    print(f"{'─'*60}")
    print(f"\n📁 Tổng dung lượng thư mục ảnh: {total_size / (1024*1024):.1f} MB")
    print(f"✅ Dung lượng ảnh đang dùng:     {used_size / (1024*1024):.1f} MB")
    print(f"🗑️  Dung lượng ảnh thừa:          {unused_size / (1024*1024):.1f} MB")
    print(f"💰 Tiết kiệm nếu xóa ảnh thừa:  {unused_size / (1024*1024):.1f} MB ({unused_size*100//total_size}%)")
    
    # 6. Liệt kê ảnh thiếu (nếu có)
    if missing:
        print(f"\n{'─'*60}")
        print(f"  ⚠️  DANH SÁCH ẢNH THIẾU ({len(missing)} file)")
        print(f"{'─'*60}")
        for f in sorted(missing)[:20]:
            print(f"   - {f}")
        if len(missing) > 20:
            print(f"   ... và {len(missing) - 20} file nữa")
    
    # 7. Liệt kê ảnh UUID (admin upload)
    if uuid_files:
        print(f"\n{'─'*60}")
        print(f"  📎 ẢNH ADMIN UPLOAD ({len(uuid_files)} file)")
        print(f"{'─'*60}")
        for f in sorted(uuid_files):
            size_kb = os.path.getsize(os.path.join(IMAGES_DIR, f)) / 1024
            print(f"   - {f} ({size_kb:.0f} KB)")
    
    print(f"\n{'='*60}")
    print(f"  KẾT LUẬN")
    print(f"{'='*60}")
    print(f"\n→ Chỉ cần upload {len(matched)} ảnh sản phẩm lên Supabase Storage")
    print(f"  (+ {len(uuid_files)} ảnh admin upload nếu đang dùng)")
    print(f"→ Có thể XÓA {len(numeric_unused)} ảnh số ID thừa để tiết kiệm dung lượng")
    print(f"{'='*60}\n")

if __name__ == "__main__":
    main()
