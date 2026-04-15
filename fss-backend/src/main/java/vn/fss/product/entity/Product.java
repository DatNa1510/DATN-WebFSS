package vn.fss.product.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "products")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Product {

    @Id
    private Long id;

    private String gender;

    @Column(name = "master_category", nullable = false)
    private String masterCategory;

    @Column(name = "sub_category")
    private String subCategory;

    @Column(name = "article_type")
    private String articleType;

    @Column(name = "base_colour")
    private String baseColour;

    private String season;
    
    private Integer year;
    
    private String usage;

    @Column(name = "product_display_name", nullable = false, length = 500)
    private String productDisplayName;

    @Column(name = "image_path", length = 500)
    private String imagePath;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(name = "original_price")
    private BigDecimal originalPrice;

    @Column(nullable = false)
    private Integer stock = 50;

    @Column(nullable = false)
    private Integer sold = 0;

    @Column(nullable = false, precision = 3, scale = 1)
    private BigDecimal rating = new BigDecimal("4.5");

    @Column(name = "review_count", nullable = false)
    private Integer reviewCount = 0;

    @Column(name = "is_new", nullable = false)
    private Boolean isNew = false;

    @Column(name = "is_best_seller", nullable = false)
    private Boolean isBestSeller = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
