package vn.fss.order.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "vouchers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Voucher {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private VoucherType type;

    @Column(name = "discount_value", nullable = false)
    private double value; // percent (e.g. 0.1 for 10%) or fixed amount (e.g. 50000)

    @Column(name = "min_order", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal minOrder = BigDecimal.ZERO;

    @Column(name = "max_discount", precision = 18, scale = 2)
    private BigDecimal maxDiscount; // nullable for FIXED, required for PERCENT limit

    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    @Column(name = "usage_limit", nullable = false)
    @Builder.Default
    private int usageLimit = 100; // Limit total times this voucher can be used

    @Column(name = "used_count", nullable = false)
    @Builder.Default
    private int usedCount = 0; // How many times it has been used

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
