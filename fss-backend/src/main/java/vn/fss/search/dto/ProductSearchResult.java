package vn.fss.search.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO kết hợp thông tin sản phẩm đầy đủ từ PostgreSQL
 * + điểm similarity từ AI Service.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductSearchResult {

    // ── Thông tin sản phẩm (từ PostgreSQL) ───────────────────────────────────
    private Long id;
    private String gender;
    private String masterCategory;
    private String subCategory;
    private String articleType;
    private String baseColour;
    private String season;
    private Integer year;
    private String usage;
    private String productDisplayName;
    private String imagePath;
    private BigDecimal price;
    private BigDecimal originalPrice;
    private Integer stock;
    private Integer sold;
    private BigDecimal rating;
    private Integer reviewCount;
    private Boolean isNew;
    private Boolean isBestSeller;
    private LocalDateTime createdAt;

    // ── Kết quả AI (từ ChromaDB) ──────────────────────────────────────────────
    /**
     * Độ tương đồng Cosine (0.0 → 1.0).
     * 1.0 = giống hệt, 0.0 = hoàn toàn khác.
     */
    private Double similarityScore;

    /**
     * Phần trăm tương đồng để hiển thị trên UI (0 → 100).
     */
    public Integer getSimilarityPercent() {
        if (similarityScore == null) return 0;
        return (int) Math.round(similarityScore * 100);
    }
}
