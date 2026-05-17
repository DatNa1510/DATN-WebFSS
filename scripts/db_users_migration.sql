-- ================================================================
-- FSS DATABASE - Users Table Migration
-- Chạy script này trong PostgreSQL để tạo bảng users
-- ================================================================

-- Tạo ENUM cho role người dùng
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('CUSTOMER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Tạo bảng users
CREATE TABLE IF NOT EXISTS users (
    id                   BIGSERIAL PRIMARY KEY,
    full_name            VARCHAR(150)          NOT NULL,
    email                VARCHAR(150)          NOT NULL UNIQUE,
    password             VARCHAR(255)          NOT NULL,         -- BCrypt hash
    phone                VARCHAR(20),
    avatar_url           VARCHAR(500),
    role                 user_role             NOT NULL DEFAULT 'CUSTOMER',

    -- Email verification
    is_enabled           BOOLEAN               NOT NULL DEFAULT FALSE,
    verification_token   VARCHAR(255),
    token_expiry         TIMESTAMPTZ,

    created_at           TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ           NOT NULL DEFAULT NOW()
);

-- Index tìm kiếm nhanh theo email (login)
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- Index tìm kiếm theo token (verify email)
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users (verification_token) WHERE verification_token IS NOT NULL;

-- ── INSERT ADMIN ACCOUNT (mặc định) ──────────────────────────────
-- Mật khẩu: admin123 (BCrypt hash, có thể đổi bằng cách chạy BCryptPasswordEncoder.encode("admin123"))
-- Hash được tạo với BCrypt strength=10
INSERT INTO users (full_name, email, password, role, is_enabled)
VALUES (
    'Admin FSS',
    'admin@fss.vn',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh/C',  -- admin123
    'ADMIN',
    TRUE   -- Admin không cần verify email
)
ON CONFLICT (email) DO NOTHING;

-- ── COMMENTS ────────────────────────────────────────────────────
COMMENT ON TABLE users IS 'Bảng tài khoản người dùng FSS';
COMMENT ON COLUMN users.password IS 'BCrypt hashed password, KHÔNG bao giờ lưu plain text';
COMMENT ON COLUMN users.is_enabled IS 'FALSE khi mới đăng ký, TRUE sau khi xác thực email';
COMMENT ON COLUMN users.verification_token IS 'Token UUID gửi qua email để xác thực, NULL sau khi đã verify';
COMMENT ON COLUMN users.token_expiry IS 'Thời gian hết hạn token (24 giờ kể từ lúc đăng ký)';
