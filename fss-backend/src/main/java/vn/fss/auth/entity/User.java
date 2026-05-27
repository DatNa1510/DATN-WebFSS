package vn.fss.auth.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDateTime;

import java.security.Principal;

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
public class User implements Principal {

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

    // Ngày sinh (optional)
    @Column(length = 20)
    private String dob;

    // Giới tính (optional)
    @Column(length = 20)
    private String gender;

    // Tiểu sử (optional)
    @Column(length = 500)
    private String bio;

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

    // ── Account Lockout Fields ─────────────────────────────────
    @Column(name = "failed_attempts", nullable = true)
    @Builder.Default
    private Integer failedAttempts = 0;

    @Column(name = "lock_time")
    private Instant lockTime;

    // ── Status Reasons ─────────────────────────────────────────
    @Column(name = "is_deleted", columnDefinition = "boolean default false")
    @Builder.Default
    private Boolean isDeleted = false;

    @Column(name = "deletion_reason", columnDefinition = "TEXT")
    private String deletionReason;

    @Column(name = "lock_reason", columnDefinition = "TEXT")
    private String lockReason;

    // Số lần đã khôi phục tài khoản (tối đa 2 lần)
    @Column(name = "restore_count", columnDefinition = "integer default 0")
    @Builder.Default
    private Integer restoreCount = 0;

    // ── Timestamps ─────────────────────────────────────────────

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Override
    public String getName() {
        return this.email;
    }

    /**
     * ENUM vai trò người dùng
     */
    public enum Role {
        CUSTOMER, ADMIN
    }
}
