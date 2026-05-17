import psycopg2
import csv
import sys
import os
import shutil

sys.stdout.reconfigure(encoding='utf-8', errors='replace', line_buffering=True)

DB_CONFIG = {
    'host'    : 'localhost',
    'port'    : 5432,
    'dbname'  : 'fss_db',
    'user'    : 'postgres',
    'password': '123456',
}

CSV_PATH = r'd:\DATN\Web_FSS\fashion-dataset\products_1000.csv'
ARCHIVE_IMG_DIR = r'd:\DATN\archive\fashion-dataset\images'
DEST_IMG_DIR = r'd:\DATN\Web_FSS\fashion-dataset\images'
BESTSELLER_ID = 48946

try:
    print("Dang doc danh sach san pham chuan tu CSV...")
    valid_ids = set()
    with open(CSV_PATH, encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        for row in reader:
            valid_ids.add(int(row['id']))

    # Dam bao Bestseller luon ton tai trong danh sach (du truong hop bi loc mat do shuffle)
    if BESTSELLER_ID not in valid_ids:
        # Loai bo 1 phan tu bat ky de giu dung 1000
        valid_ids.pop()
        valid_ids.add(BESTSELLER_ID)
        
        # Copy anh cho bestseller vi no khong co san trong thu muc moi
        src_img = os.path.join(ARCHIVE_IMG_DIR, f"{BESTSELLER_ID}.jpg")
        dest_img = os.path.join(DEST_IMG_DIR, f"{BESTSELLER_ID}.jpg")
        if os.path.exists(src_img):
            shutil.copy2(src_img, dest_img)

    valid_ids_tuple = tuple(valid_ids)

    print("Dang ket noi database...")
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    print("Dang xoa du lieu rac cua cac san pham thua...")
    
    # 1. Xoa FK trong cac bang lien quan (dung SAVEPOINT de bo qua neu bang khong ton tai)
    for table in ['reviews', 'cart_items', 'wishlist_items', 'wishlists', 'order_items']:
        try:
            cur.execute("SAVEPOINT sp1")
            cur.execute(f"DELETE FROM {table} WHERE product_id NOT IN %s", (valid_ids_tuple,))
            cur.execute("RELEASE SAVEPOINT sp1")
        except psycopg2.Error:
            cur.execute("ROLLBACK TO SAVEPOINT sp1")

    # 2. Xoa cac san pham thua khoi products
    cur.execute("DELETE FROM products WHERE id NOT IN %s", (valid_ids_tuple,))
    deleted_count = cur.rowcount
    
    conn.commit()
    print("="*60)
    print(f"THANH CONG! Da xoa {deleted_count} san pham thua.")
    print("Hien tai DB chi con dung 1000 san pham dep nhat!")
    print("="*60)

    cur.close()
    conn.close()
except Exception as e:
    print("Loi:", e)
