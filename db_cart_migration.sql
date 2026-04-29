-- ================================================================
-- FSS DATABASE - Cart Items Table Migration
-- Hibernate tự tạo bảng này khi ddl-auto=update
-- Script này dùng để tạo thủ công hoặc tham khảo schema
-- ================================================================

CREATE TABLE IF NOT EXISTS cart_items (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id  BIGINT        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity    INTEGER       NOT NULL CHECK (quantity > 0),
    size        VARCHAR(50)   NOT NULL DEFAULT '',
    added_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    -- Ràng buộc: mỗi user chỉ có 1 mục cho mỗi (product + size)
    CONSTRAINT uq_cart_user_product_size UNIQUE (user_id, product_id, size)
);

-- Index tìm nhanh giỏ hàng theo user
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items (user_id);

-- Index tìm nhanh theo product
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items (product_id);

COMMENT ON TABLE cart_items IS 'Giỏ hàng - lưu sản phẩm mà user đã thêm vào giỏ';
COMMENT ON COLUMN cart_items.size IS 'Kích cỡ đã chọn (S, M, L, XL, Freesize, ...)';
