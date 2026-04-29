package vn.fss.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Configuration
@Slf4j
public class DataMigrationConfig {

    @Bean
    public CommandLineRunner migrateAvatars(JdbcTemplate jdbcTemplate) {
        return args -> {
            log.info("Đang đồng bộ Avatar mặc định cho Khách hàng...");
            try {
                int updated = jdbcTemplate.update(
                    "UPDATE users SET avatar_url = NULL WHERE role = 'CUSTOMER' " +
                    "AND (avatar_url IS NULL OR avatar_url LIKE 'http%' OR avatar_url = '')"
                );
                log.info("Đồng bộ thành công {} tài khoản.", updated);
            } catch (Exception e) {
                log.error("Lỗi đồng bộ Avatar: {}", e.getMessage());
            }
        };
    }

    /**
     * Seed dữ liệu thống kê sản phẩm thực tế (chạy 1 lần).
     * Chỉ cập nhật sản phẩm có sold = 0 AND review_count = 0 (chưa được seed).
     */
    @Bean
    public CommandLineRunner seedProductStats(JdbcTemplate jdbcTemplate) {
        return args -> {
            log.info("Kiểm tra seed dữ liệu thống kê sản phẩm...");
            try {
                Integer unseeded = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM products WHERE sold = 0 AND review_count = 0",
                    Integer.class
                );

                if (unseeded == null || unseeded == 0) {
                    log.info("Dữ liệu thống kê sản phẩm đã được seed trước đó. Bỏ qua.");
                    return;
                }

                log.info("Đang seed dữ liệu thống kê cho {} sản phẩm...", unseeded);

                // Lấy danh sách ID sản phẩm cần seed
                var products = jdbcTemplate.queryForList(
                    "SELECT id FROM products WHERE sold = 0 AND review_count = 0 ORDER BY id",
                    Long.class
                );

                int count = 0;
                for (Long productId : products) {
                    // Dùng ID để tạo giá trị deterministic (không random hoàn toàn)
                    // Mục đích: mỗi lần chạy lại vẫn ra cùng giá trị
                    long seed = productId * 6364136223846793005L + 1442695040888963407L;
                    long absSeed = Math.abs(seed);

                    // sold: 30 - 2500 (phân phối lệch phải - nhiều sp bán ít)
                    int sold = (int)(30 + (absSeed % 2471));

                    // Phân phối: 60% sp bán 30-500, 30% bán 500-1500, 10% bán 1500-2500
                    if (absSeed % 10 < 6) {
                        sold = (int)(30 + (absSeed % 470));
                    } else if (absSeed % 10 < 9) {
                        sold = (int)(500 + (absSeed % 1000));
                    } else {
                        sold = (int)(1500 + (absSeed % 1000));
                    }

                    // stock: phụ thuộc vào sold (sp bán nhiều thì tồn kho ít hơn)
                    int stock;
                    if (sold > 1000) {
                        stock = (int)(5 + (absSeed % 30));  // Còn ít hàng
                    } else if (sold > 500) {
                        stock = (int)(20 + (absSeed % 80)); // Còn vừa
                    } else {
                        stock = (int)(50 + (absSeed % 150)); // Còn nhiều
                    }

                    // reviewCount: ~12-18% người mua để lại đánh giá
                    int reviewCount = (int)(sold * (0.12 + (absSeed % 7) * 0.01));
                    reviewCount = Math.max(3, reviewCount); // Tối thiểu 3 đánh giá

                    // rating: 3.5 - 5.0 (ưu tiên 4.0-4.8 vì thực tế ít sp rất tệ)
                    double rawRating;
                    if (absSeed % 20 < 2) {
                        rawRating = 3.5 + (absSeed % 5) * 0.1; // 10%: 3.5-3.9
                    } else if (absSeed % 20 < 16) {
                        rawRating = 4.0 + (absSeed % 9) * 0.1; // 70%: 4.0-4.8
                    } else {
                        rawRating = 4.9 + (absSeed % 2) * 0.1; // 20%: 4.9-5.0
                    }
                    BigDecimal rating = BigDecimal.valueOf(rawRating)
                            .setScale(1, RoundingMode.HALF_UP);

                    // isBestSeller: true nếu sold > 800
                    boolean isBestSeller = sold > 800;

                    // isNew: true cho ~20% sản phẩm (id lẻ theo mod)
                    boolean isNew = (productId % 5 == 0) || (productId % 13 == 0);

                    jdbcTemplate.update(
                        "UPDATE products SET sold = ?, stock = ?, review_count = ?, " +
                        "rating = ?, is_best_seller = ?, is_new = ? WHERE id = ?",
                        sold, stock, reviewCount, rating, isBestSeller, isNew, productId
                    );
                    count++;
                }

                log.info("✅ Seed xong {} sản phẩm với dữ liệu thống kê thực tế.", count);

            } catch (Exception e) {
                log.error("Lỗi seed dữ liệu sản phẩm: {}", e.getMessage());
            }
        };
    }
}
