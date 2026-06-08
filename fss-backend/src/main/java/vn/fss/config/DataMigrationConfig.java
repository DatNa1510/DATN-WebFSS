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
    public CommandLineRunner migrateSchema(JdbcTemplate jdbcTemplate) {
        return args -> {
            log.info("Đang kiểm tra và cập nhật Schema Database...");
            try {
                // Thêm các cột mới vào bảng users nếu chưa có
                jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE");
                jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_reason VARCHAR(255)");
                jdbcTemplate.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS lock_reason VARCHAR(255)");
                log.info("Cập nhật Schema Database thành công.");
            } catch (Exception e) {
                log.error("Lỗi cập nhật Schema Database: {}", e.getMessage());
            }
        };
    }

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

    /**
     * Tự động dịch tên sản phẩm sang Tiếng Việt chuyên nghiệp.
     * Ví dụ: "Nike Men Black Shoes" -> "Giày thể thao Nike nam màu Đen"
     */
    @Bean
    public CommandLineRunner translateProducts(JdbcTemplate jdbcTemplate) {
        return args -> {
            log.info("Đang kiểm tra và dịch tên sản phẩm sang Tiếng Việt...");
            try {
                // Chỉ dịch những sản phẩm chưa có dấu Tiếng Việt hoặc từ "màu" (tránh dịch đè)
                var products = jdbcTemplate.queryForList(
                    "SELECT id, product_display_name, gender, master_category, sub_category, article_type, base_colour " +
                    "FROM products WHERE product_display_name !~ '[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ]'"
                );

                if (products.isEmpty()) {
                    log.info("Tất cả sản phẩm đã được dịch hoặc không cần dịch thêm.");
                    return;
                }

                log.info("Phát hiện {} sản phẩm cần dịch.", products.size());

                // Từ điển dịch thuật chuyên nghiệp (Java version)
                java.util.Map<String, String> dict = new java.util.HashMap<>();
                dict.put("Apparel", "Quần áo"); dict.put("Footwear", "Giày dép"); dict.put("Accessories", "Phụ kiện");
                dict.put("Topwear", "Trang phục trên"); dict.put("Bottomwear", "Trang phục dưới"); dict.put("Innerwear", "Đồ lót");
                dict.put("Headwear", "Mũ & Nón"); dict.put("Shoes", "Giày"); dict.put("Watches", "Đồng hồ");
                dict.put("Bags", "Túi xách"); dict.put("Belts", "Thắt lưng"); dict.put("Socks", "Vớ & Tất");
                dict.put("Jewellery", "Trang sức"); dict.put("Eyewear", "Mắt kính"); dict.put("Fragrance", "Nước hoa");
                dict.put("Wallets", "Ví & Bóp"); dict.put("Tshirts", "Áo thun"); dict.put("Shirts", "Áo sơ mi");
                dict.put("Casual Shoes", "Giày thời trang"); dict.put("Sports Shoes", "Giày thể thao");
                dict.put("Formal Shoes", "Giày tây"); dict.put("Handbags", "Túi xách tay"); dict.put("Shorts", "Quần short");
                dict.put("Jeans", "Quần Jeans"); dict.put("Trousers", "Quần dài"); dict.put("Jackets", "Áo khoác");
                dict.put("Sweaters", "Áo len"); dict.put("Sandals", "Sandal / Xăng-đan"); dict.put("Heels", "Giày cao gót");
                dict.put("Tops", "Áo kiểu"); dict.put("Caps", "Mũ lưỡi trai"); dict.put("Men", "Nam");
                dict.put("Women", "Nữ"); dict.put("Boys", "Bé trai"); dict.put("Girls", "Bé gái");
                dict.put("Unisex", "Unisex"); dict.put("Black", "Đen"); dict.put("White", "Trắng");
                dict.put("Blue", "Xanh dương"); dict.put("Red", "Đỏ"); dict.put("Grey", "Xám");
                dict.put("Green", "Xanh lá"); dict.put("Brown", "Nâu"); dict.put("Yellow", "Vàng");
                dict.put("Pink", "Hồng"); dict.put("Purple", "Tím"); dict.put("Orange", "Cam");
                dict.put("Navy Blue", "Xanh Navy"); dict.put("Silver", "Bạc"); dict.put("Gold", "Vàng kim");

                int count = 0;
                for (var p : products) {
                    String idStr = p.get("id").toString();
                    String rawName = (String) p.get("product_display_name");
                    String gender = (String) p.get("gender");
                    String article = (String) p.get("article_type");
                    String color = (String) p.get("base_colour");

                    // Logic dịch tên: [Loại] + [Tên riêng] + [màu X] + [dành cho Y]
                    String vnArticle = dict.getOrDefault(article, "Sản phẩm");
                    String vnColor = dict.getOrDefault(color, "");
                    String vnGender = dict.getOrDefault(gender, "");

                    // Lọc tên riêng (Brand/Model)
                    String modelName = rawName;
                    String[] wordsToRemove = {gender, article, color, "Men", "Women", "Casual", "Solid", "Printed", "Shoes", "Shirt"};
                    for (String word : wordsToRemove) {
                        if (word != null && word.length() > 2) {
                            modelName = modelName.replaceAll("(?i)\\b" + word + "\\b", "");
                        }
                    }
                    modelName = modelName.replaceAll("\\s+", " ").trim();

                    // Lắp ráp tên mới
                    StringBuilder newName = new StringBuilder(vnArticle);
                    if (!modelName.isEmpty()) newName.append(" ").append(modelName);
                    if (!vnColor.isEmpty()) newName.append(" màu ").append(vnColor);
                    if (!vnGender.isEmpty()) newName.append(" cho ").append(vnGender);

                    jdbcTemplate.update(
                        "UPDATE products SET product_display_name = ? WHERE id = ?",
                        newName.toString().trim(), Long.parseLong(idStr)
                    );
                    count++;
                }
                log.info("✅ Đã dịch thành công {} tên sản phẩm sang Tiếng Việt.", count);

            } catch (Exception e) {
                log.error("Lỗi khi dịch tên sản phẩm: {}", e.getMessage());
            }
        };
    }
}
