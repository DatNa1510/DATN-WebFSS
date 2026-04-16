package vn.fss.auth.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDateTime;

/**
 * Entity đại diện cho bảng `users` trong PostgreSQL.
 * Lưu thông tin tài khoản, mật khẩu đã hash, và trạng thái xác thực email.
 */
@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Họ và tên đầy đủ
    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    // Email dùng để đăng nhập (phải unique)
    @Column(nullable = false, unique = true, length = 150)
    private String email;

    // Mật khẩu đã được BCrypt hash (KHÔNG bao giờ lưu plain text)
    @Column(nullable = false, length = 255)
    private String password;

    // Số điện thoại (optional)
    @Column(length = 20)
    private String phone;

    // URL ảnh đại diện (optional)
    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    // Vai trò: CUSTOMER hoặc ADMIN
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Role role = Role.CUSTOMER;

    // ── Email Verification Fields ──────────────────────────────

    // Tài khoản chỉ được đăng nhập khi isEnabled = true
    @Column(name = "is_enabled", nullable = false)
    @Builder.Default
    private Boolean isEnabled = false;

    // Token UUID ngẫu nhiên gửi qua email để xác thực
    @Column(name = "verification_token", length = 255)
    private String verificationToken;

    // Thời gian hết hạn token (24 giờ)
    @Column(name = "token_expiry")
    private Instant tokenExpiry;

    // ── Reset Password Fields ──────────────────────────────────
    @Column(name = "reset_password_token", length = 255)
    private String resetPasswordToken;

    @Column(name = "reset_token_expiry")
    private Instant resetTokenExpiry;

    // ── Timestamps ─────────────────────────────────────────────

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /**
     * ENUM vai trò người dùng
     */
    public enum Role {
        CUSTOMER, ADMIN
    }
}
