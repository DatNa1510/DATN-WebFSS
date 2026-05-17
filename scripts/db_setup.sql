-- ================================================================
-- FSS DATABASE SCHEMA - Fashion Shopping Sense
-- PostgreSQL
-- ================================================================

-- Drop & recreate (development only)
DROP TABLE IF EXISTS products CASCADE;

-- ── PRODUCTS TABLE ──────────────────────────────────────────────
CREATE TABLE products (
    id                   BIGINT PRIMARY KEY,
    gender               VARCHAR(20),
    master_category      VARCHAR(50)       NOT NULL,
    sub_category         VARCHAR(100),
    article_type         VARCHAR(100),
    base_colour          VARCHAR(50),
    season               VARCHAR(20),
    year                 SMALLINT,
    usage                VARCHAR(50),
    product_display_name VARCHAR(500)      NOT NULL,
    image_path           VARCHAR(500),

    -- Enriched fields
    price                BIGINT            NOT NULL,   -- VND
    original_price       BIGINT,                       -- NULL = no discount
    stock                INT               NOT NULL DEFAULT 50,
    sold                 INT               NOT NULL DEFAULT 0,
    rating               NUMERIC(3, 1)     NOT NULL DEFAULT 4.5,
    review_count         INT               NOT NULL DEFAULT 0,
    is_new               BOOLEAN           NOT NULL DEFAULT FALSE,
    is_best_seller       BOOLEAN           NOT NULL DEFAULT FALSE,

    created_at           TIMESTAMPTZ       NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ       NOT NULL DEFAULT NOW()
);

-- ── INDEXES ─────────────────────────────────────────────────────
-- Tìm kiếm theo danh mục (filter chính)
CREATE INDEX idx_products_master_category ON products (master_category);

-- Tìm kiếm theo tên sản phẩm (full-text search)
CREATE INDEX idx_products_name_fts
    ON products USING GIN (to_tsvector('english', product_display_name));

-- Lọc theo giá
CREATE INDEX idx_products_price ON products (price);

-- Sort theo rating
CREATE INDEX idx_products_rating ON products (rating DESC);

-- Sort theo sold (best-seller)
CREATE INDEX idx_products_sold ON products (sold DESC);

-- Filter theo màu sắc
CREATE INDEX idx_products_colour ON products (base_colour);

-- Filter theo gender
CREATE INDEX idx_products_gender ON products (gender);

-- ── COMMENTS ────────────────────────────────────────────────────
COMMENT ON TABLE products IS '1000 sản phẩm Fashion Dataset từ Myntra';
COMMENT ON COLUMN products.image_path IS 'Đường dẫn tới ảnh, ví dụ: /fashion-dataset/images/15970.jpg';
COMMENT ON COLUMN products.price IS 'Giá bán hiện tại (VND)';
COMMENT ON COLUMN products.original_price IS 'Giá gốc trước giảm, NULL nếu không có sale';
