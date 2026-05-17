package vn.fss.review.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import vn.fss.auth.entity.User;
import vn.fss.product.entity.Product;

import java.time.LocalDateTime;

@Entity
@Table(
    name = "reviews",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "product_id"})
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private Integer rating; // 1–5

    @Column(columnDefinition = "TEXT")
    private String comment;

    /** True nếu user đã mua và đơn hàng DELIVERED/CONFIRMED */
    @Column(name = "verified_purchase", nullable = false)
    @Builder.Default
    private Boolean verifiedPurchase = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
