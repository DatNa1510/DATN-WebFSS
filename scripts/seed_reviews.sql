-- ============================================================
-- SEED REVIEWS & RATINGS trực tiếp vào PostgreSQL
-- Chạy script này trong pgAdmin hoặc psql
-- ============================================================

-- Bước 1: Tạo bảng tạm chứa các comment mẫu
CREATE TEMP TABLE IF NOT EXISTS sample_comments (rating INT, comment TEXT);
INSERT INTO sample_comments (rating, comment) VALUES
(5, N'Sản phẩm rất đẹp, đúng màu như hình, chất vải tốt, mặc thoáng mát.'),
(5, N'Hàng đẹp, giao nhanh, đóng gói cẩn thận. Sẽ ủng hộ shop lần sau!'),
(5, N'Chất liệu ổn, size chuẩn với bảng size. Màu sắc đẹp hơn ngoài thực tế.'),
(4, N'Mình mua size M, vừa vặn chuẩn chỉnh. Vải mềm mại, không bị xù.'),
(4, N'Sản phẩm oke, giao hàng đúng hẹn. Nhìn chung là hài lòng.'),
(5, N'Chất lượng tốt, xứng đáng với giá tiền. Mình đã mua lần 2 rồi.'),
(4, N'Áo đẹp, nhưng màu hơi khác so với ảnh chụp một chút. Vẫn chấp nhận được.'),
(5, N'Giao hàng nhanh, sản phẩm y như mô tả. Rất hài lòng!'),
(3, N'Size hơi rộng hơn mình tưởng, nên mọi người nên mua size nhỏ hơn 1 size.'),
(4, N'Chất vải ổn, không bị nhăn sau khi giặt. Sẽ mua thêm màu khác.'),
(5, N'Đúng như mô tả, mặc vào rất thoải mái. Giá cả hợp lý.'),
(3, N'Sản phẩm bình thường, không có gì đặc biệt nhưng chất lượng ổn.'),
(5, N'Mình rất thích, mặc lên trông stylish lắm. Shop tư vấn nhiệt tình.'),
(5, N'Hàng đẹp, giao nhanh. Mình đã mua tổng cộng 3 lần tại shop này.'),
(4, N'Chất liệu thoáng mát, phù hợp mặc mùa hè. Màu sắc như hình.'),
(4, N'Ổn áp, không có gì để chê. Giao hàng đúng hẹn, đóng gói cẩn thận.'),
(5, N'Rất đẹp! Mình mặc đi làm ai cũng khen. Sẽ tiếp tục ủng hộ shop.'),
(4, N'Hàng đúng mô tả, chất lượng tốt so với giá bán.'),
(3, N'Tôi hài lòng với sản phẩm, nhưng giao hàng hơi chậm so với dự kiến.'),
(5, N'Tuyệt vời! Đây là lần mua thứ 4 của mình, lần nào cũng hài lòng.'),
(5, N'Màu sắc sáng, chất liệu mềm, mặc vào thoải mái. Rất đáng tiền.'),
(5, N'Giao nhanh hơn dự kiến, hàng chính hãng, chất lượng tốt.'),
(3, N'Ổn với mức giá này, sẽ mua thêm nếu có nhu cầu.'),
(5, N'Đẹp lắm! Phù hợp với nhiều kiểu trang phục khác nhau.'),
(5, N'Shop uy tín, giao hàng nhanh, sản phẩm đúng mô tả. 5 sao!'),
(4, N'Chất vải khá dày, giữ ấm tốt cho mùa lạnh. Hài lòng.'),
(5, N'Mua làm quà tặng, người nhận rất thích. Chất lượng tốt.'),
(4, N'Màu đẹp, kích cỡ chuẩn, chất liệu thoáng. Rất hài lòng.'),
(3, N'Giao hàng hơi chậm nhưng chất lượng sản phẩm bù lại. Chấp nhận.'),
(5, N'Mua lần đầu nhưng rất ấn tượng. Chắc chắn sẽ quay lại.'),
(5, N'Sản phẩm như mong đợi, không bị thất vọng. Sẽ giới thiệu cho bạn bè.'),
(5, N'Chất liệu cao cấp, form dáng đẹp. Rất xứng đáng với giá tiền.'),
(5, N'Giao hàng siêu nhanh, chỉ 1 ngày đã nhận được. Cảm ơn shop!'),
(4, N'Mặc thử thấy vừa vặn và thoải mái. Sẽ mua thêm các màu khác.'),
(5, N'Chất lượng vượt mong đợi ở tầm giá này. Rất đáng mua.'),
(5, N'Đã mua nhiều lần, lần nào cũng hài lòng. Shop giữ chất lượng ổn định.'),
(5, N'Sản phẩm đẹp như hình, giao hàng cẩn thận. Mình rất thích.'),
(4, N'Hơi tiếc là không có thêm màu khác, nhưng chất lượng thì tuyệt vời.'),
(5, N'Mua về mặc ngay, cảm giác thoải mái và tự tin. Rất hài lòng.'),
(5, N'Form dáng đẹp, chuẩn như hình mẫu. Ai hỏi mua ở đâu mình đều giới thiệu.');

-- Bước 2: Tạo bảng tạm chứa numbered users (chỉ lấy CUSTOMER)
CREATE TEMP TABLE ranked_users AS
SELECT id AS user_id, ROW_NUMBER() OVER (ORDER BY id) AS rn
FROM users
WHERE role = 'CUSTOMER';

-- Bước 3: Tạo bảng tạm chứa numbered products
CREATE TEMP TABLE ranked_products AS
SELECT id AS product_id, ROW_NUMBER() OVER (ORDER BY id) AS rn
FROM products
LIMIT 200;

-- Bước 4: Tạo bảng tạm chứa numbered comments
CREATE TEMP TABLE ranked_comments AS
SELECT rating, comment, ROW_NUMBER() OVER (ORDER BY rating DESC) AS rn
FROM sample_comments;

-- Bước 5: Insert reviews (mỗi user review ~4 sản phẩm, phân bổ đều)
-- Sử dụng modulo để xoay vòng comments
INSERT INTO reviews (user_id, product_id, rating, comment, verified_purchase, created_at)
SELECT
    u.user_id,
    p.product_id,
    c.rating,
    c.comment,
    true,
    NOW() - (RANDOM() * INTERVAL '180 days')  -- Ngày ngẫu nhiên trong 6 tháng qua
FROM ranked_users u
CROSS JOIN LATERAL (
    -- Mỗi user lấy 4 sản phẩm khác nhau dựa vào offset
    SELECT product_id, rn AS prn
    FROM ranked_products
    WHERE rn BETWEEN ((u.rn - 1) * 4 % (SELECT COUNT(*) FROM ranked_products)) + 1
                 AND ((u.rn - 1) * 4 % (SELECT COUNT(*) FROM ranked_products)) + 4
    LIMIT 4
) p
JOIN ranked_comments c
    ON c.rn = ((u.rn + p.prn) % (SELECT COUNT(*) FROM ranked_comments)) + 1
-- Tránh duplicate (unique constraint user_id + product_id)
WHERE NOT EXISTS (
    SELECT 1 FROM reviews r2
    WHERE r2.user_id = u.user_id AND r2.product_id = p.product_id
);

-- Bước 6: Cập nhật rating và review_count cho từng sản phẩm
UPDATE products p
SET
    review_count = sub.cnt,
    rating       = ROUND(sub.avg_rating::numeric, 1)
FROM (
    SELECT
        product_id,
        COUNT(*)          AS cnt,
        AVG(rating)       AS avg_rating
    FROM reviews
    GROUP BY product_id
) sub
WHERE p.id = sub.product_id;

-- Kiểm tra kết quả
SELECT
    COUNT(*)                          AS total_reviews,
    ROUND(AVG(rating)::numeric, 2)    AS avg_rating,
    COUNT(DISTINCT user_id)           AS users_reviewed,
    COUNT(DISTINCT product_id)        AS products_reviewed
FROM reviews;
