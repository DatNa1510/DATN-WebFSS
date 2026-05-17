package vn.fss.auth.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import vn.fss.auth.repository.UserRepository;
import vn.fss.order.entity.OrderStatus;
import vn.fss.order.repository.OrderRepository;
import vn.fss.product.entity.Product;
import vn.fss.product.repository.ProductRepository;
import vn.fss.review.repository.ReviewRepository;

import java.util.*;

@Component
@RequiredArgsConstructor
@Slf4j
@Order(2)
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final ReviewRepository reviewRepository;
    private final PasswordEncoder passwordEncoder;
    private final DataSeederHelper helper;

    private static final String[] HO = {
        "Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Võ", "Đặng", "Bùi",
        "Ngô", "Dương", "Phan", "Trịnh", "Lý", "Mai", "Đinh",
        "Cao", "Hồ", "Lưu", "Vũ", "Kiều"
    };
    private static final String[] TEN_NAM = {
        "Minh", "Tuấn", "Bảo", "Hùng", "Khải", "Đức", "Nhật", "Sơn",
        "Khoa", "Thành", "Huy", "Long", "Phong", "Đạt", "Nam",
        "Quân", "Tài", "Lâm", "Duy", "Cường"
    };
    private static final String[] TEN_NU = {
        "Lan", "Hoa", "Thu", "Mai", "Ngọc", "Cẩm", "Yến", "Như",
        "Trang", "Phương", "Linh", "Hạnh", "Thảo", "Hương", "Vân",
        "Thị", "Kim", "Bích", "Diễm", "Hồng"
    };
    private static final String[] EMAIL_DOMAINS = {
        "gmail.com", "yahoo.com", "hotmail.com", "outlook.com"
    };
    private static final String[] SDT_PREFIX = {
        "032", "033", "034", "035", "036", "037", "038", "039",
        "096", "097", "098", "086", "089", "090", "093",
        "070", "079", "077", "076", "078"
    };

    @Override
    public void run(String... args) {
        try {
            List<Product> products = productRepository.findAll();
            if (products.isEmpty()) {
                log.warn("DataSeeder: Không có sản phẩm nào, bỏ qua.");
                return;
            }
            List<Long> productIds = products.subList(0, Math.min(100, products.size()))
                    .stream().map(Product::getId).toList();

            Random rng = new Random(42);
            String encodedPassword = passwordEncoder.encode("password123");

            // ── Bước 0: Ngẫu nhiên hóa tồn kho & Chọn sản phẩm Hot ───────────
            log.info("DataSeeder: Ngẫu nhiên hóa tồn kho ban đầu cho thực tế...");
            for (Product p : products) {
                if (p.getInitialStock() == 50) {
                    // Gán tổng nhập ngẫu nhiên từ 50 đến 200
                    int initial = 50 + rng.nextInt(151);
                    p.setInitialStock(initial);
                    p.setStock(initial); 
                    productRepository.save(p);
                }
            }

            // Chọn ra khoảng 15 sản phẩm "Hot" để tập trung tạo đơn hàng
            List<Long> hotProductIds = new ArrayList<>();
            Collections.shuffle(productIds, rng);
            if (!productIds.isEmpty()) {
                hotProductIds = productIds.subList(0, Math.min(15, productIds.size()));
            }
            log.info("Đã chọn {} sản phẩm làm 'Hot Products' để tăng lượt bán.", hotProductIds.size());

            // ── Bước 1: Tạo user nếu chưa đủ ────────────────────────────────
            long existingUsers = userRepository.count();
            List<Long> userIds = new ArrayList<>();

            if (existingUsers < 50) {
                log.info("DataSeeder: Tạo 100 user mẫu...");
                for (int i = 0; i < 100; i++) {
                    boolean isNu = (i % 2 == 0);
                    String ho = HO[i % HO.length];
                    String ten = isNu ? TEN_NU[rng.nextInt(TEN_NU.length)] : TEN_NAM[rng.nextInt(TEN_NAM.length)];
                    String fullName = ho + " " + ten;
                    String hoAscii = removeDiacritics(ho);
                    String tenAscii = removeDiacritics(ten);
                    String email = tenAscii.toLowerCase() + "." + hoAscii.toLowerCase()
                            + (i + 1) + "@" + EMAIL_DOMAINS[i % EMAIL_DOMAINS.length];
                    String phone = SDT_PREFIX[rng.nextInt(SDT_PREFIX.length)]
                            + String.format("%07d", 1000000 + rng.nextInt(8999999));
                    try {
                        Long uid = helper.saveUser(fullName, email, encodedPassword, phone);
                        if (uid != null) userIds.add(uid);
                    } catch (Exception ex) {
                        log.warn("Bỏ qua user {}: {}", email, ex.getMessage());
                    }
                }
                log.info("Đã tạo/xác nhận {} user.", userIds.size());
            } else {
                log.info("DataSeeder: Đã có {} user, tải danh sách hiện có.", existingUsers);
                // Tải lại danh sách user ID hiện có (bỏ qua admin)
                userRepository.findAll().stream()
                        .filter(u -> u.getRole() == vn.fss.auth.entity.User.Role.CUSTOMER)
                        .forEach(u -> userIds.add(u.getId()));
            }

            // ── Bước 2: Tạo đơn hàng nếu chưa có ────────────────────────────
            OrderStatus[] weighted = {
                OrderStatus.DELIVERED, OrderStatus.DELIVERED, OrderStatus.DELIVERED,
                OrderStatus.DELIVERED, OrderStatus.DELIVERED, OrderStatus.DELIVERED,
                OrderStatus.CONFIRMED, OrderStatus.CONFIRMED, OrderStatus.CONFIRMED,
                OrderStatus.SHIPPING, OrderStatus.SHIPPING,
                OrderStatus.PENDING, OrderStatus.CANCELLED,
            };

            long existingOrders = orderRepository.count();
            int totalOrders = 0;
            Map<Long, Integer> soldMap = new HashMap<>();

            if (existingOrders < 100) {
                log.info("DataSeeder: Tạo đơn hàng mẫu với cơ chế 'Best Seller'...");
                for (Long uid : userIds) {
                    int numOrders = 2 + rng.nextInt(5);
                    try {
                        // 80% cơ hội chọn từ danh sách Hot Products để tạo hiệu ứng Best Seller
                        List<Long> targets = (rng.nextFloat() < 0.8f && !hotProductIds.isEmpty()) 
                                ? hotProductIds : productIds;

                        Map<Long, Integer> delta = helper.createOrdersForUser(
                                uid, numOrders, targets, weighted, rng);
                        delta.forEach((pid, qty) -> soldMap.merge(pid, qty, (a, b) -> a + b));
                        totalOrders += numOrders;
                    } catch (Exception ex) {
                        log.warn("Lỗi tạo đơn hàng cho user {}: {}", uid, ex.getMessage());
                    }
                }
                log.info("Đã tạo ~{} đơn hàng thực tế.", totalOrders);

                try {
                    helper.updateProductStats(soldMap);
                    log.info("Cập nhật sold/stock cho {} sản phẩm.", soldMap.size());
                } catch (Exception ex) {
                    log.warn("Lỗi cập nhật product stats: {}", ex.getMessage());
                }
            } else {
                log.info("DataSeeder: Đã có {} đơn hàng, bỏ qua bước tạo đơn.", existingOrders);
            }

            // ── Bước 3: Tạo review nếu chưa có ──────────────────────────────
            long existingReviews = reviewRepository.count();
            int totalReviews = 0;

            if (existingReviews < 100) {
                log.info("DataSeeder: Tạo đánh giá sản phẩm mẫu...");
                int commentOffset = 0;
                for (Long uid : userIds) {
                    try {
                        int cnt = helper.createReviewsForUser(uid, productIds, rng, commentOffset);
                        commentOffset += cnt;
                        totalReviews += cnt;
                    } catch (Exception ex) {
                        log.warn("Lỗi tạo review cho user {}: {}", uid, ex.getMessage());
                    }
                }
                log.info("Đã tạo {} đánh giá.", totalReviews);
            } else {
                log.info("DataSeeder: Đã có {} đánh giá, bỏ qua.", existingReviews);
            }

            log.info("DataSeeder HOÀN THÀNH: {} users | ~{} orders mới | {} reviews mới",
                    userIds.size(), totalOrders, totalReviews);

        } catch (Exception e) {
            log.error("DataSeeder gặp lỗi (app vẫn chạy bình thường): {}", e.getMessage(), e);
        }
    }

    private String removeDiacritics(String input) {
        String norm = java.text.Normalizer.normalize(input, java.text.Normalizer.Form.NFD);
        return norm.replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .replaceAll("[đĐ]", "d").replaceAll("[^a-zA-Z0-9]", "");
    }
}
