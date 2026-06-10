package vn.fss.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import vn.fss.product.entity.Product;
import vn.fss.product.repository.ProductRepository;

import java.io.File;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * Tự động nạp 1000 sản phẩm từ file products_1000.json vào database
 * khi khởi động nếu bảng products đang trống.
 */
@Configuration
@Slf4j
@RequiredArgsConstructor
public class ProductDataLoader {

    private final ProductRepository productRepository;

    // Đường dẫn tuyệt đối tới file JSON dataset
    private static final String JSON_PATH = "D:/DATN/Web_FSS/fashion-dataset/products_1000.json";

    @Bean
    @Order(1) // Chạy trước các bean seed khác
    public CommandLineRunner loadProductData() {
        return args -> {
            long count = productRepository.count();
            if (count > 0) {
                log.info("✅ Database đã có {} sản phẩm. Bỏ qua import.", count);
                return;
            }

            log.info("⏳ Database trống. Đang import sản phẩm từ {}...", JSON_PATH);

            File jsonFile = new File(JSON_PATH);
            if (!jsonFile.exists()) {
                log.error("❌ Không tìm thấy file: {}. Vui lòng chạy scripts/generate_fss_data.py trước!", JSON_PATH);
                return;
            }

            try {
                ObjectMapper mapper = new ObjectMapper();
                List<Map<String, Object>> rawProducts = mapper.readValue(
                        jsonFile, new TypeReference<List<Map<String, Object>>>() {}
                );

                log.info("📦 Đọc được {} sản phẩm từ JSON. Đang insert vào database...", rawProducts.size());

                int inserted = 0;
                for (Map<String, Object> raw : rawProducts) {
                    try {
                        Product product = new Product();

                        // ID
                        product.setId(Long.parseLong(raw.get("id").toString()));

                        // Thông tin cơ bản
                        product.setGender((String) raw.get("gender"));
                        product.setMasterCategory((String) raw.get("masterCategory"));
                        product.setSubCategory((String) raw.get("subCategory"));
                        product.setArticleType((String) raw.get("articleType"));
                        product.setBaseColour((String) raw.get("baseColour"));
                        product.setSeason((String) raw.get("season"));
                        product.setProductDisplayName((String) raw.get("productDisplayName"));
                        product.setUsage((String) raw.get("usage"));

                        // Year
                        String yearStr = raw.get("year") != null ? raw.get("year").toString() : null;
                        if (yearStr != null && !yearStr.isEmpty()) {
                            try {
                                product.setYear(Integer.parseInt(yearStr));
                            } catch (NumberFormatException e) {
                                product.setYear(null);
                            }
                        }

                        // Image path: lưu dạng "{id}.jpg" - frontend sẽ gọi /images/{id}.jpg
                        product.setImagePath(product.getId() + ".jpg");

                        // Sinh giá VND thực tế theo loại sản phẩm
                        BigDecimal price = generatePrice(product.getMasterCategory(), product.getArticleType(), product.getId());
                        product.setPrice(price);

                        // 40% sản phẩm có giá gốc (giảm giá)
                        if (product.getId() % 5 < 2) {
                            // Giá gốc cao hơn 15-45%
                            double markup = 1.15 + (product.getId() % 30) * 0.01;
                            product.setOriginalPrice(
                                    price.multiply(BigDecimal.valueOf(markup))
                                         .setScale(0, java.math.RoundingMode.HALF_UP)
                            );
                        }

                        // Defaults
                        product.setStock(50);
                        product.setInitialStock(50);
                        product.setSold(0);
                        product.setRating(new BigDecimal("0.0"));
                        product.setReviewCount(0);
                        product.setIsNew(false);
                        product.setIsBestSeller(false);

                        productRepository.save(product);
                        inserted++;

                        if (inserted % 100 == 0) {
                            log.info("  → Đã insert {}/{} sản phẩm...", inserted, rawProducts.size());
                        }
                    } catch (Exception e) {
                        log.warn("⚠ Bỏ qua sản phẩm ID={}: {}", raw.get("id"), e.getMessage());
                    }
                }

                log.info("✅ Import hoàn tất! Đã thêm {} sản phẩm vào database.", inserted);

            } catch (Exception e) {
                log.error("❌ Lỗi đọc file JSON: {}", e.getMessage(), e);
            }
        };
    }

    /**
     * Sinh giá VND thực tế dựa trên loại sản phẩm.
     * Giá được làm tròn đến hàng nghìn.
     */
    private BigDecimal generatePrice(String masterCategory, String articleType, Long id) {
        long seed = Math.abs(id * 2654435761L);
        int base;

        if ("Footwear".equals(masterCategory)) {
            if ("Sports Shoes".equals(articleType)) {
                base = 800000 + (int)(seed % 1200000);  // 800K - 2M
            } else if ("Heels".equals(articleType)) {
                base = 500000 + (int)(seed % 800000);   // 500K - 1.3M
            } else if ("Sandals".equals(articleType) || "Flip Flops".equals(articleType)) {
                base = 200000 + (int)(seed % 400000);   // 200K - 600K
            } else {
                base = 600000 + (int)(seed % 900000);   // 600K - 1.5M
            }
        } else if ("Accessories".equals(masterCategory)) {
            if ("Watches".equals(articleType)) {
                base = 1000000 + (int)(seed % 3000000); // 1M - 4M
            } else if ("Sunglasses".equals(articleType)) {
                base = 300000 + (int)(seed % 700000);   // 300K - 1M
            } else if ("Handbags".equals(articleType) || "Bags".equals(articleType) || "Backpacks".equals(articleType)) {
                base = 400000 + (int)(seed % 1000000);  // 400K - 1.4M
            } else if ("Wallets".equals(articleType)) {
                base = 200000 + (int)(seed % 500000);   // 200K - 700K
            } else if ("Earrings".equals(articleType) || "Jewellery".equals(articleType)) {
                base = 150000 + (int)(seed % 350000);   // 150K - 500K
            } else {
                base = 150000 + (int)(seed % 400000);   // 150K - 550K
            }
        } else {
            // Apparel
            if ("Jackets".equals(articleType) || "Sweatshirts".equals(articleType)) {
                base = 500000 + (int)(seed % 1000000);  // 500K - 1.5M
            } else if ("Jeans".equals(articleType)) {
                base = 400000 + (int)(seed % 600000);   // 400K - 1M
            } else if ("Shirts".equals(articleType)) {
                base = 300000 + (int)(seed % 500000);   // 300K - 800K
            } else if ("Tshirts".equals(articleType)) {
                base = 200000 + (int)(seed % 400000);   // 200K - 600K
            } else if ("Sarees".equals(articleType) || "Kurtas".equals(articleType) || "Kurta Sets".equals(articleType)) {
                base = 500000 + (int)(seed % 1500000);  // 500K - 2M
            } else {
                base = 250000 + (int)(seed % 500000);   // 250K - 750K
            }
        }

        // Làm tròn xuống đến hàng nghìn
        base = (base / 1000) * 1000;
        return BigDecimal.valueOf(base);
    }
}
