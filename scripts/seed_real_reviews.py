import psycopg2
import random
import sys
from datetime import datetime, timedelta

# Fix encoding on Windows terminal
sys.stdout.reconfigure(encoding='utf-8', errors='replace', line_buffering=True)

DB_CONFIG = {
    'host'    : 'localhost',
    'port'    : 5432,
    'dbname'  : 'fss_db',
    'user'    : 'postgres',
    'password': '123456',
}

# Các bình luận thực tế bằng tiếng Việt theo số sao
COMMENTS = {
    5: [
        "Sản phẩm rất đẹp, đúng màu như hình, chất liệu tốt.",
        "Giao hàng nhanh, sản phẩm y như mô tả. Rất hài lòng!",
        "Màu sắc sáng, mềm mại, dùng vào thoải mái. Rất đáng tiền.",
        "Đóng gói cẩn thận, sản phẩm không bị lỗi nào. Cho shop 5 sao.",
        "Form dáng chuẩn, lên rất tôn dáng. Rất ưng ý.",
        "Sản phẩm tuyệt vời, vượt ngoài mong đợi!",
        "Mua lần đầu nhưng rất ấn tượng. Chắc chắn sẽ quay lại.",
        "Hàng chuẩn auth, check code thoải mái. 10 điểm!",
        "Giá cả hợp lý mà chất lượng thì khỏi bàn. Tuyệt vời."
    ],
    4: [
        "Chất lượng ổn, phù hợp với giá tiền.",
        "Hơi chật một chút so với size chuẩn, nhưng chất lượng ok.",
        "Giao hàng hơi lâu nhưng sản phẩm đẹp nên bỏ qua.",
        "Màu thực tế hơi đậm hơn trong hình một xíu.",
        "Hàng đẹp nhưng đóng gói hơi sơ sài."
    ],
    3: [
        "Sản phẩm bình thường, không quá đặc sắc.",
        "Vải hơi mỏng so với mình nghĩ.",
        "Tạm ổn trong tầm giá này.",
        "Đường may hơi cẩu thả một chút.",
        "Kích thước hơi khác so với bảng size."
    ],
    2: [
        "Chất lượng không như mong đợi, vải khá cứng.",
        "Giao sai màu, nhắn tin shop phản hồi hơi chậm.",
        "Hàng nhận về bị nhăn nhúm nhiều quá.",
        "Dùng một thời gian ngắn đã thấy xuống cấp."
    ],
    1: [
        "Rất thất vọng, sản phẩm khác xa so với ảnh quảng cáo.",
        "Vải rất tệ, mặc vào thấy ngứa.",
        "Giao hàng quá chậm, phục vụ kém.",
        "Sản phẩm bị lỗi rách mà shop không cho đổi trả.",
        "Đừng mua nhé mọi người, phí tiền lắm."
    ]
}

try:
    print("Đang kết nối database...")
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    # 1. Lấy danh sách users
    cur.execute("SELECT id FROM users WHERE role = 'CUSTOMER'")
    user_ids = [row[0] for row in cur.fetchall()]
    
    if not user_ids:
        print("Lỗi: Không có user nào trong hệ thống để tạo review!")
        sys.exit(1)

    # 2. Lấy các sản phẩm có lượt mua > 0
    cur.execute("SELECT id, sold FROM products WHERE sold > 0")
    products = cur.fetchall()
    
    print(f"Tìm thấy {len(products)} sản phẩm đã được bán. Đang tạo review đa dạng...")
    
    total_reviews_added = 0
    
    # Xóa các review cũ trừ nhận bestseller để tạo lại cho sạch (giữ lại review của id 48946)
    cur.execute("DELETE FROM reviews WHERE product_id != 48946")

    for pid, sold in products:
        if pid == 48946:
            continue # Bỏ qua best seller vì đã làm rồi
            
        # Quy tắc mới: 
        # - Nếu sold > 50: Chắc chắn có đánh giá (100% chance)
        # - Nếu 10 < sold <= 50: 70% có đánh giá
        # - Nếu sold <= 10: 30% có đánh giá
        
        has_review = False
        if sold > 50:
            has_review = True
        elif sold > 10:
            has_review = random.random() < 0.7
        else:
            has_review = random.random() < 0.3

        if has_review:
            # Số lượng review dựa trên số lượng bán (khoảng 3-8% lượt bán)
            num_reviews = max(1, min(15, int(sold * random.uniform(0.03, 0.08))))
            
            # Chọn ngẫu nhiên user để review
            reviewers = random.sample(user_ids, min(num_reviews, len(user_ids)))
            
            for uid in reviewers:
                # Phân bổ rating đa dạng:
                # 5 sao: 60%
                # 4 sao: 25%
                # 3 sao: 10%
                # 2 sao: 3%
                # 1 sao: 2%
                r = random.random()
                if r < 0.60:
                    rating = 5
                elif r < 0.85:
                    rating = 4
                elif r < 0.95:
                    rating = 3
                elif r < 0.98:
                    rating = 2
                else:
                    rating = 1
                
                comment = random.choice(COMMENTS[rating])
                created_at = datetime.now() - timedelta(days=random.randint(1, 90))
                
                cur.execute("""
                    INSERT INTO reviews (user_id, product_id, rating, comment, verified_purchase, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (uid, pid, rating, comment, True, created_at))
                
                total_reviews_added += 1

    # 3. Đồng bộ lại rating và review_count cho TOÀN BỘ sản phẩm
    print("Đang đồng bộ lại chỉ số sản phẩm...")
    cur.execute("""
        UPDATE products 
        SET review_count = COALESCE((SELECT COUNT(*) FROM reviews WHERE product_id = products.id), 0),
            rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE product_id = products.id), 0.0)
    """)
    
    conn.commit()
    print("="*60)
    print(f"THÀNH CÔNG! Đã tạo {total_reviews_added} đánh giá đa dạng (1-5 sao).")
    print("Sản phẩm bán chạy đã được ưu tiên có nhiều đánh giá.")
    print("="*60)

    cur.close()
    conn.close()
except Exception as e:
    print("Lỗi:", e)
