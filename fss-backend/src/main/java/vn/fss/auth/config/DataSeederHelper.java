package vn.fss.auth.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.fss.auth.entity.User;
import vn.fss.auth.repository.UserRepository;
import vn.fss.order.entity.OrderItem;
import vn.fss.order.entity.OrderStatus;
import vn.fss.order.repository.OrderRepository;
import vn.fss.product.entity.Product;
import vn.fss.product.repository.ProductRepository;
import vn.fss.review.entity.Review;
import vn.fss.review.repository.ReviewRepository;

import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class DataSeederHelper {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final ReviewRepository reviewRepository;

    private static final String[] SIZES = {"S", "M", "L", "XL", "XXL"};
    private static final String[] PAYMENT_METHODS = {"COD", "PAYOS", "MOMO"};
    private static final String[] ADDRESSES = {
        "123 Nguyễn Trãi, Phường 2, Quận 5, TP.HCM",
        "45 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM",
        "78 Trần Hưng Đạo, Phường 1, Quận 5, TP.HCM",
        "12 Đinh Tiên Hoàng, Phường Đakao, Quận 1, TP.HCM",
        "56 Võ Văn Tần, Phường 6, Quận 3, TP.HCM",
        "89 Cách Mạng Tháng 8, Phường 5, Quận 3, TP.HCM",
        "34 Phan Xích Long, Phường 2, Quận Phú Nhuận, TP.HCM",
        "67 Hoàng Văn Thụ, Phường 8, Quận Phú Nhuận, TP.HCM",
        "21 Quang Trung, Phường 10, Quận Gò Vấp, TP.HCM",
        "90 Nguyễn Oanh, Phường 17, Quận Gò Vấp, TP.HCM",
        "15 Lê Văn Sỹ, Phường 13, Quận 3, TP.HCM",
        "33 Nam Kỳ Khởi Nghĩa, Phường 7, Quận 3, TP.HCM",
        "50 Phạm Văn Đồng, Phường 1, Quận Gò Vấp, TP.HCM",
        "102 Điện Biên Phủ, Phường 15, Quận Bình Thạnh, TP.HCM",
        "88 Lý Thường Kiệt, Phường 7, Quận 10, TP.HCM",
    };
    static final String[][] COMMENTS = {
        {"Sản phẩm rất đẹp, đúng màu như hình, chất vải tốt, mặc thoáng mát.", "5"},
        {"Hàng đẹp, giao nhanh, đóng gói cẩn thận. Sẽ ủng hộ shop lần sau!", "5"},
        {"Chất liệu ổn, size chuẩn với bảng size. Màu sắc đẹp hơn ngoài thực tế.", "5"},
        {"Mình mua size M, vừa vặn chuẩn chỉnh. Vải mềm mại, không bị xù.", "4"},
        {"Sản phẩm oke, giao hàng đúng hẹn. Nhìn chung là hài lòng.", "4"},
        {"Chất lượng tốt, xứng đáng với giá tiền. Mình đã mua lần 2 rồi.", "5"},
        {"Áo đẹp, nhưng màu hơi khác so với ảnh chụp một chút. Vẫn chấp nhận được.", "4"},
        {"Giao hàng nhanh, sản phẩm y như mô tả. Rất hài lòng!", "5"},
        {"Size hơi rộng hơn mình tưởng, nên mọi người nên mua size nhỏ hơn 1 size.", "3"},
        {"Chất vải ổn, không bị nhăn sau khi giặt. Sẽ mua thêm màu khác.", "4"},
        {"Đúng như mô tả, mặc vào rất thoải mái. Giá cả hợp lý.", "5"},
        {"Sản phẩm bình thường, không có gì đặc biệt nhưng chất lượng ổn.", "3"},
        {"Mình rất thích, mặc lên trông stylish lắm. Shop tư vấn nhiệt tình.", "5"},
        {"Hàng đẹp, giao nhanh. Mình đã mua tổng cộng 3 lần tại shop này.", "5"},
        {"Chất liệu thoáng mát, phù hợp mặc mùa hè. Màu sắc như hình.", "4"},
        {"Ổn áp, không có gì để chê. Giao hàng đúng hẹn, đóng gói cẩn thận.", "4"},
        {"Rất đẹp! Mình mặc đi làm ai cũng khen. Sẽ tiếp tục ủng hộ shop.", "5"},
        {"Hàng đúng mô tả, chất lượng tốt so với giá bán.", "4"},
        {"Tôi hài lòng với sản phẩm, nhưng giao hàng hơi chậm so với dự kiến.", "3"},
        {"Tuyệt vời! Đây là lần mua thứ 4 của mình, lần nào cũng hài lòng.", "5"},
        {"Màu sắc sáng, chất liệu mềm, mặc vào thoải mái. Rất đáng tiền.", "5"},
        {"Giao nhanh hơn dự kiến, hàng chính hãng, chất lượng tốt.", "5"},
        {"Ổn với mức giá này, sẽ mua thêm nếu có nhu cầu.", "3"},
        {"Đẹp lắm! Phù hợp với nhiều kiểu trang phục khác nhau.", "5"},
        {"Shop uy tín, giao hàng nhanh, sản phẩm đúng mô tả. 5 sao!", "5"},
        {"Chất vải khá dày, giữ ấm tốt cho mùa lạnh. Hài lòng.", "4"},
        {"Mua làm quà tặng, người nhận rất thích. Chất lượng tốt.", "5"},
        {"Màu đẹp, kích cỡ chuẩn, chất liệu thoáng. Rất hài lòng.", "4"},
        {"Giao hàng hơi chậm nhưng chất lượng sản phẩm bù lại. Chấp nhận.", "3"},
        {"Mua lần đầu nhưng rất ấn tượng. Chắc chắn sẽ quay lại.", "5"},
        {"Sản phẩm như mong đợi, không bị thất vọng. Sẽ giới thiệu cho bạn bè.", "5"},
        {"Chất liệu cao cấp, form dáng đẹp. Rất xứng đáng với giá tiền.", "5"},
        {"Giao hàng siêu nhanh, chỉ 1 ngày đã nhận được. Cảm ơn shop!", "5"},
        {"Mặc thử thấy vừa vặn và thoải mái. Sẽ mua thêm các màu khác.", "4"},
        {"Chất lượng vượt mong đợi ở tầm giá này. Rất đáng mua.", "5"},
        {"Đã mua nhiều lần, lần nào cũng hài lòng. Shop giữ chất lượng ổn định.", "5"},
        {"Sản phẩm đẹp như hình, giao hàng cẩn thận. Mình rất thích.", "5"},
        {"Hơi tiếc là không có thêm màu khác, nhưng chất lượng thì tuyệt vời.", "4"},
        {"Mua về mặc ngay, cảm giác thoải mái và tự tin. Rất hài lòng.", "5"},
        {"Form dáng đẹp, chuẩn như hình mẫu. Ai hỏi mua ở đâu mình đều giới thiệu.", "5"},
    };

    @Transactional
    public Long saveUser(String fullName, String email, String pwd, String phone) {
        if (userRepository.existsByEmail(email)) {
            return userRepository.findByEmail(email).map(User::getId).orElse(null);
        }
        User u = User.builder().fullName(fullName).email(email).password(pwd)
                .phone(phone).role(User.Role.CUSTOMER).isEnabled(true).build();
        return userRepository.save(u).getId();
    }

    @Transactional
    public Map<Long, Integer> createOrdersForUser(Long userId, int numOrders,
            List<Long> productIds, OrderStatus[] weighted, Random rng) {
        Map<Long, Integer> soldDelta = new HashMap<>();
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return soldDelta;

        // Load products fresh trong transaction này
        List<Product> prods = productRepository.findAllById(productIds);
        if (prods.isEmpty()) return soldDelta;

        for (int o = 0; o < numOrders; o++) {
            OrderStatus status = weighted[rng.nextInt(weighted.length)];
            String address = ADDRESSES[rng.nextInt(ADDRESSES.length)];
            String payment = PAYMENT_METHODS[rng.nextInt(PAYMENT_METHODS.length)];

            int numItems = 1 + rng.nextInt(3);
            Set<Integer> usedIdx = new HashSet<>();
            List<Product> chosen = new ArrayList<>();
            for (int p = 0; p < numItems; p++) {
                int idx;
                do { idx = rng.nextInt(prods.size()); } while (usedIdx.contains(idx));
                usedIdx.add(idx);
                chosen.add(prods.get(idx));
            }

            BigDecimal subtotal = BigDecimal.ZERO;
            vn.fss.order.entity.Order order = vn.fss.order.entity.Order.builder()
                    .user(user).status(status).subtotal(BigDecimal.ZERO)
                    .shippingFee(BigDecimal.ZERO).totalAmount(BigDecimal.ZERO)
                    .paymentMethod(payment).recipientName(user.getFullName())
                    .recipientPhone(user.getPhone() != null ? user.getPhone() : "0901234567")
                    .shippingAddress(address).build();

            for (Product prod : chosen) {
                int qty = 1 + rng.nextInt(3);
                BigDecimal unitPrice = prod.getPrice();
                BigDecimal itemSub = unitPrice.multiply(BigDecimal.valueOf(qty));
                subtotal = subtotal.add(itemSub);

                if (status == OrderStatus.DELIVERED || status == OrderStatus.CONFIRMED) {
                    soldDelta.merge(prod.getId(), qty, (a, b) -> a + b);
                }

                OrderItem item = OrderItem.builder()
                        .order(order)
                        .productName(prod.getProductDisplayName())
                        .productImage(prod.getImagePath())
                        .size(SIZES[rng.nextInt(SIZES.length)])
                        .quantity(qty).unitPrice(unitPrice).subtotal(itemSub)
                        .product(prod).build();
                order.getItems().add(item);
            }

            BigDecimal shippingFee = subtotal.compareTo(BigDecimal.valueOf(500_000)) >= 0
                    ? BigDecimal.ZERO : BigDecimal.valueOf(30_000);
            order.setSubtotal(subtotal);
            order.setShippingFee(shippingFee);
            order.setTotalAmount(subtotal.add(shippingFee));
            orderRepository.save(order);
        }
        return soldDelta;
    }

    @Transactional
    public void updateProductStats(Map<Long, Integer> soldMap) {
        for (Map.Entry<Long, Integer> e : soldMap.entrySet()) {
            productRepository.findById(e.getKey()).ifPresent(prod -> {
                prod.setSold(prod.getSold() + e.getValue());
                prod.setStock(Math.max(0, prod.getStock() - e.getValue()));
                if (prod.getSold() >= 20) prod.setIsBestSeller(true);
                productRepository.save(prod);
            });
        }
    }

    @Transactional
    public int createReviewsForUser(Long userId, List<Long> productIds,
            Random rng, int commentOffset) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return 0;

        List<Product> prods = productRepository.findAllById(productIds);
        if (prods.isEmpty()) return 0;

        int count = 0;
        int numReviews = 3 + rng.nextInt(4);
        Set<Long> reviewed = new HashSet<>();

        for (int r = 0; r < numReviews; r++) {
            Product prod = prods.get(rng.nextInt(prods.size()));
            if (reviewed.contains(prod.getId())) continue;
            reviewed.add(prod.getId());
            if (reviewRepository.findByUserAndProduct(user, prod).isPresent()) continue;

            String[] data = COMMENTS[(commentOffset + count) % COMMENTS.length];

            reviewRepository.save(Review.builder()
                    .user(user).product(prod)
                    .rating(Integer.parseInt(data[1]))
                    .comment(data[0]).verifiedPurchase(true).build());

            // Cập nhật reviewCount và rating bằng query trực tiếp để tránh version conflict
            Double avg = reviewRepository.calculateAverageRating(prod.getId());
            Long cnt = reviewRepository.countByProductId(prod.getId());
            if (avg != null && cnt != null) {
                productRepository.findById(prod.getId()).ifPresent(p -> {
                    p.setReviewCount(cnt.intValue());
                    p.setRating(BigDecimal.valueOf(Math.round(avg * 10) / 10.0));
                    productRepository.save(p);
                });
            }
            count++;
        }
        return count;
    }
}
