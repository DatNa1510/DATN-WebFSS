"""
================================================================
  migrate_to_postgres.py
  Import 1000 sản phẩm Fashion Dataset vào PostgreSQL
  Yêu cầu: pip install psycopg2-binary
================================================================

Cấu hình DB ở phần CONFIG bên dưới, sau đó chạy:
    python migrate_to_postgres.py
"""

import csv
import math
import random
import sys
import os
sys.stdout.reconfigure(encoding='utf-8', errors='replace', line_buffering=True)

# ─── CONFIG ────────────────────────────────────────────────────
DB_CONFIG = {
    'host'    : 'localhost',
    'port'    : 5432,
    'dbname'  : 'fss_db',        # <-- Tên database của bạn
    'user'    : 'postgres',       # <-- Tên user PostgreSQL
    'password': '123456',         # <-- Mật khẩu PostgreSQL
}

CSV_PATH   = r'd:\DATN\Web_FSS\fashion-dataset\products_1000.csv'
IMAGE_DIR  = r'd:\DATN\Web_FSS\fashion-dataset\images'
IMAGE_URL_PREFIX = '/fashion-dataset/images'

# ─── SEED-BASED RANDOM ─────────────────────────────────────────
def seeded_random(seed):
    x = math.sin(seed + 1) * 10000
    return x - math.floor(x)

def enrich_product(row):
    """Bổ sung price, rating, stock, etc. theo seed từ id."""
    pid = int(row['id'])
    r1 = seeded_random(pid)
    r2 = seeded_random(pid + 1000)
    r3 = seeded_random(pid + 2000)
    r4 = seeded_random(pid + 3000)
    r5 = seeded_random(pid + 4000)

    # Giá: 150,000 - 2,000,000 VND (làm tròn 5000)
    price = round((150000 + r1 * 1850000) / 5000) * 5000

    # Giảm giá (chỉ khoảng 20% có sale)
    discount_pct = 0
    original_price = None
    if r2 > 0.8:
        discount_pct = round(10 + ((r2 - 0.8) / 0.2) * 40)
        original_price = round(price / (1 - discount_pct / 100) / 5000) * 5000

    # Các trường khác
    rating       = round(3.5 + r3 * 1.5, 1)
    stock        = round(10 + r4 * 90)
    sold         = round(r5 * 500)
    review_count = round(sold * 0.3)
    is_new       = seeded_random(pid + 5000) < 0.2
    is_best      = seeded_random(pid + 6000) < 0.15

    # Kiểm tra file ảnh
    img_file = os.path.join(IMAGE_DIR, f"{pid}.jpg")
    image_path = f"{IMAGE_URL_PREFIX}/{pid}.jpg" if os.path.isfile(img_file) else None

    return {
        'id'                  : pid,
        'gender'              : row.get('gender', '').strip() or None,
        'master_category'     : row.get('masterCategory', '').strip(),
        'sub_category'        : row.get('subCategory', '').strip() or None,
        'article_type'        : row.get('articleType', '').strip() or None,
        'base_colour'         : row.get('baseColour', '').strip() or None,
        'season'              : row.get('season', '').strip() or None,
        'year'                : int(row['year']) if row.get('year', '').strip().isdigit() else None,
        'usage'               : row.get('usage', '').strip() or None,
        'product_display_name': row.get('productDisplayName', '').strip(),
        'image_path'          : image_path,
        'price'               : price,
        'original_price'      : original_price,
        'stock'               : stock,
        'sold'                : sold,
        'rating'              : rating,
        'review_count'        : review_count,
        'is_new'              : is_new,
        'is_best_seller'      : is_best,
    }

# ─── MAIN ──────────────────────────────────────────────────────
def main():
    try:
        import psycopg2
        from psycopg2.extras import execute_values
    except ImportError:
        print("[ERROR] psycopg2 chua duoc cai dat. Chay: pip install psycopg2-binary")
        sys.exit(1)

    print("=" * 60)
    print("  FSS MIGRATION - Import 1000 san pham vao PostgreSQL")
    print("=" * 60)

    # Connect
    print(f"\n[STEP 1] Ket noi DB: {DB_CONFIG['dbname']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}")
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cur  = conn.cursor()
        print("  -> Ket noi thanh cong!")
    except Exception as e:
        print(f"  [ERROR] Khong ket noi duoc: {e}")
        sys.exit(1)

    # Read & enrich CSV
    print(f"\n[STEP 2] Doc file CSV: {CSV_PATH}")
    rows = []
    with open(CSV_PATH, encoding='utf-8-sig', errors='replace') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                rows.append(enrich_product(row))
            except Exception as e:
                print(f"  [WARN] Bo qua dong id={row.get('id')}: {e}")

    print(f"  -> Da doc {len(rows)} san pham")

    # Insert into DB
    print(f"\n[STEP 3] Insert vao table products ...")

    INSERT_SQL = """
        INSERT INTO products (
            id, gender, master_category, sub_category, article_type,
            base_colour, season, year, usage, product_display_name,
            image_path, price, original_price, stock, sold,
            rating, review_count, is_new, is_best_seller,
            created_at, updated_at
        ) VALUES %s
        ON CONFLICT (id) DO UPDATE SET
            price          = EXCLUDED.price,
            original_price = EXCLUDED.original_price,
            stock          = EXCLUDED.stock,
            sold           = EXCLUDED.sold,
            rating         = EXCLUDED.rating,
            review_count   = EXCLUDED.review_count,
            is_new         = EXCLUDED.is_new,
            is_best_seller = EXCLUDED.is_best_seller,
            updated_at     = NOW()
    """

    from datetime import datetime
    now = datetime.now()
    values = [
        (
            r['id'], r['gender'], r['master_category'], r['sub_category'],
            r['article_type'], r['base_colour'], r['season'], r['year'],
            r['usage'], r['product_display_name'], r['image_path'],
            r['price'], r['original_price'], r['stock'], r['sold'],
            r['rating'], r['review_count'], r['is_new'], r['is_best_seller'],
            now, now,
        )
        for r in rows
    ]

    try:
        execute_values(cur, INSERT_SQL, values, page_size=100)
        conn.commit()
        print(f"  -> Da insert/update {len(values)} san pham")
    except Exception as e:
        conn.rollback()
        print(f"  [ERROR] Insert that bai: {e}")
        cur.close(); conn.close()
        sys.exit(1)

    # Verify
    cur.execute("SELECT COUNT(*), MIN(price), MAX(price), AVG(rating)::NUMERIC(4,2) FROM products")
    count, min_p, max_p, avg_r = cur.fetchone()

    cur.execute("SELECT master_category, COUNT(*) FROM products GROUP BY master_category ORDER BY COUNT(*) DESC")
    cat_stats = cur.fetchall()

    cur.close()
    conn.close()

    print("\n" + "=" * 60)
    print("  MIGRATION HOAN TAT!")
    print("=" * 60)
    print(f"\n  Tong san pham   : {count}")
    print(f"  Gia thap nhat   : {min_p:,} VND")
    print(f"  Gia cao nhat    : {max_p:,} VND")
    print(f"  Rating trung binh: {avg_r}")
    print("\n  Phan bo danh muc:")
    for cat, cnt in cat_stats:
        print(f"    {cat:<15}: {cnt}")
    print("=" * 60 + "\n")

if __name__ == '__main__':
    main()
