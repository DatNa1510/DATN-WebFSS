package vn.fss.adminlog.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "admin_logs", indexes = {
    @Index(name = "idx_admin_logs_target_type", columnList = "target_type"),
    @Index(name = "idx_admin_logs_admin_email", columnList = "admin_email"),
    @Index(name = "idx_admin_logs_created_at", columnList = "created_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "admin_email", nullable = false, length = 150)
    private String adminEmail;

    @Column(name = "admin_name", length = 150)
    private String adminName;

    // Loại hành động: CREATE, UPDATE, DELETE, STATUS_CHANGE, LOCK, UNLOCK, RESTORE
    @Column(name = "action", nullable = false, length = 50)
    private String action;

    // Đối tượng bị tác động: PRODUCT, ORDER, ACCOUNT
    @Column(name = "target_type", nullable = false, length = 30)
    private String targetType;

    // ID của đối tượng bị tác động
    @Column(name = "target_id")
    private Long targetId;

    // Tên/tiêu đề của đối tượng (để hiển thị mà không cần join)
    @Column(name = "target_name", length = 500)
    private String targetName;

    // Chi tiết mô tả hành động
    @Column(name = "detail", columnDefinition = "TEXT")
    private String detail;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
