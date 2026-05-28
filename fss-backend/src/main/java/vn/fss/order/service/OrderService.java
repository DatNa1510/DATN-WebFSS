package vn.fss.order.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import vn.fss.auth.entity.User;
import vn.fss.auth.repository.UserRepository;
import vn.fss.cart.entity.CartItem;
import vn.fss.cart.repository.CartItemRepository;
import vn.fss.order.dto.OrderItemResponse;
import vn.fss.order.dto.OrderResponse;
import vn.fss.order.dto.PlaceOrderRequest;
import vn.fss.order.entity.Order;
import vn.fss.order.entity.OrderItem;
import vn.fss.order.entity.OrderStatus;
import vn.fss.order.repository.OrderRepository;
import vn.fss.product.entity.Product;
import vn.fss.product.repository.ProductRepository;
import vn.fss.notification.service.NotificationService;
import vn.fss.notification.model.Notification.NotificationType;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final NotificationService notificationService;
    private final VietQRPaymentService vietQRPaymentService;
    private final VoucherService voucherService;

    private static final BigDecimal FREE_SHIPPING_THRESHOLD = new BigDecimal("500000");

    private static final Map<String, String> PAYMENT_LABELS = Map.of(
            "cod",     "Thanh toán khi nhận hàng (COD)",
            "banking", "Chuyển khoản ngân hàng",
            "momo",    "Ví MoMo",
            "vietqr",  "Chuyển khoản VietQR (PayOS)"
    );

    private static final Map<OrderStatus, String> STATUS_LABELS = Map.of(
            OrderStatus.PENDING,   "Chờ xác nhận",
            OrderStatus.CONFIRMED, "Đã xác nhận",
            OrderStatus.SHIPPING,  "Đang giao",
            OrderStatus.DELIVERED, "Đã giao",
            OrderStatus.CANCELLED, "Đã huỷ"
    );

    // ─── ĐẶT HÀNG ────────────────────────────────────────────────────────────
    @Transactional
    public OrderResponse placeOrder(String email, PlaceOrderRequest request) {
        User user = findUser(email);

        List<CartItem> cartItems = cartItemRepository.findByUserOrderByAddedAtDesc(user);
        
        if (request.getSelectedItemIds() != null && !request.getSelectedItemIds().isEmpty()) {
            cartItems = cartItems.stream()
                    .filter(item -> request.getSelectedItemIds().contains(item.getId()))
                    .collect(Collectors.toList());
        }

        if (cartItems.isEmpty()) {
            throw new IllegalStateException("Không có sản phẩm nào được chọn để đặt hàng");
        }

        // Tính toán subtotal
        BigDecimal subtotal = cartItems.stream()
                .map(ci -> ci.getProduct().getPrice().multiply(BigDecimal.valueOf(ci.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Tính phí vận chuyển dựa trên shippingMethod
        String shipMethod = request.getShippingMethod() != null ? request.getShippingMethod() : "fast";
        BigDecimal baseShippingFee = switch (shipMethod) {
            case "express" -> new BigDecimal("65000");
            case "standard" -> new BigDecimal("15000");
            default -> new BigDecimal("35000"); // fast
        };
        
        BigDecimal shippingDiscount = subtotal.compareTo(FREE_SHIPPING_THRESHOLD) >= 0
                ? new BigDecimal("35000") : BigDecimal.ZERO;
                
        BigDecimal shippingFee = baseShippingFee.subtract(shippingDiscount).max(BigDecimal.ZERO);
        
        // ── Validate & tính discount phía Backend (không tin Frontend) ──────
        BigDecimal discount = voucherService.calculateDiscount(request.getVoucherCode(), subtotal);
        BigDecimal totalAmount = subtotal.add(shippingFee).subtract(discount);
        BigDecimal MIN_AMOUNT = new BigDecimal("5000");
        if (totalAmount.compareTo(MIN_AMOUNT) < 0) {
            totalAmount = MIN_AMOUNT;
        }

        // Tạo địa chỉ giao hàng đầy đủ
        String fullAddress = buildAddress(request);

        // Tạo Order
        Order order = Order.builder()
                .user(user)
                .status(OrderStatus.PENDING)
                .subtotal(subtotal)
                .shippingFee(shippingFee)
                .discount(discount)
                .voucherCode(request.getVoucherCode())
                .totalAmount(totalAmount)
                .paymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "cod")
                .recipientName(request.getRecipientName())
                .recipientPhone(request.getRecipientPhone())
                .shippingAddress(fullAddress)
                .note(request.getNote())
                .build();

        // Tạo OrderItems + kiểm tra & giảm tồn kho
        for (CartItem ci : cartItems) {
            Product p = ci.getProduct();
            int newStock = p.getStock() - ci.getQuantity();
            if (newStock < 0) {
                throw new IllegalArgumentException(
                        String.format("Sản phẩm '%s' không đủ tồn kho (còn %d, cần %d)",
                                p.getProductDisplayName(), p.getStock(), ci.getQuantity()));
            }
            // Giảm stock
            p.setStock(newStock);
            p.setSold(p.getSold() + ci.getQuantity());
            productRepository.save(p);

            // Build image URL
            String imageUrl = p.getImagePath() != null ? p.getImagePath().split(",")[0] : null;

            OrderItem item = OrderItem.builder()
                    .order(order)
                    .product(p)
                    .productName(p.getProductDisplayName())
                    .productImage(imageUrl)
                    .size(ci.getSize())
                    .quantity(ci.getQuantity())
                    .unitPrice(p.getPrice())
                    .subtotal(p.getPrice().multiply(BigDecimal.valueOf(ci.getQuantity())))
                    .build();

            order.getItems().add(item);
        }

        Order saved = orderRepository.save(order);

        // Tăng số lần sử dụng của Voucher nếu có
        if (request.getVoucherCode() != null && !request.getVoucherCode().isBlank()) {
            voucherService.incrementUsedCount(request.getVoucherCode());
        }

        // Xóa sản phẩm đã mua khỏi giỏ hàng
        for (CartItem ci : cartItems) {
            cartItemRepository.delete(ci);
        }

        // Tạo thông báo cho người dùng
        if ("vietqr".equals(request.getPaymentMethod()) || "momo".equals(request.getPaymentMethod())) {
            notificationService.createNotification(
                    user,
                    "Chờ thanh toán",
                    "Đơn hàng " + String.format("FSS-%06d", saved.getId()) + " đã được tạo. Vui lòng hoàn tất thanh toán.",
                    NotificationType.INFO
            );
        } else {
            notificationService.createNotification(
                    user,
                    "Đặt hàng thành công",
                    "Đơn hàng " + String.format("FSS-%06d", saved.getId()) + " đã được đặt thành công.",
                    NotificationType.SUCCESS
            );
        }

        // Tạo thông báo cho các quản trị viên (Admin)
        try {
            List<User> admins = userRepository.findByRole(User.Role.ADMIN);
            for (User admin : admins) {
                notificationService.createNotification(
                        admin,
                        "Đơn hàng mới",
                        "Đơn hàng mới FSS-" + String.format("%06d", saved.getId()) + " đã được đặt bởi " + user.getFullName() + ".",
                        NotificationType.INFO
                );
            }
        } catch (Exception e) {
            log.error("Lỗi khi tạo thông báo cho Admin: ", e);
        }

        return mapToResponse(saved);
    }

    // ─── LỊCH SỬ ĐƠN HÀNG ───────────────────────────────────────────────────
    @Transactional
    public List<OrderResponse> getUserOrders(String email) {
        User user = findUser(email);
        return orderRepository.findByUserOrderByCreatedAtDesc(user)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    // ─── CHI TIẾT ĐƠN HÀNG ──────────────────────────────────────────────────
    @Transactional
    public OrderResponse getOrderById(String email, Long orderId) {
        User user = findUser(email);
        Order order = orderRepository.findByIdAndUser(orderId, user)
                .orElseThrow(() -> new IllegalArgumentException("Đơn hàng không tồn tại"));

        // Chủ động kiểm tra trạng thái thanh toán nếu là VietQR và vẫn đang PENDING
        // Điều này giúp localhost tự cập nhật trạng thái mà không cần đợi Webhook (không thể nhận Webhook)
        if (order.getStatus() == OrderStatus.PENDING && "vietqr".equals(order.getPaymentMethod())) {
            if (vietQRPaymentService.isPaid(order.getId())) {
                order.setStatus(OrderStatus.CONFIRMED);
                orderRepository.save(order);
                notificationService.createNotification(
                        user,
                        "Thanh toán thành công",
                        "Đơn hàng " + String.format("FSS-%06d", order.getId()) + " đã được thanh toán thành công (kiểm tra tự động).",
                        NotificationType.SUCCESS
                );
                log.info("Order {} confirmed via proactive API poll in getOrderById", order.getId());
            }
        }

        return mapToResponse(order);
    }

    // ─── HUỶ ĐƠN HÀNG KHI QR HẾT HẠN (gọi từ Frontend) ─────────────────────
    @Transactional
    public Map<String, Object> expirePaymentOrder(String email, Long orderId) {
        User user = findUser(email);
        Order order = orderRepository.findByIdAndUser(orderId, user)
                .orElseThrow(() -> new IllegalArgumentException("Đơn hàng không tồn tại"));

        // Chỉ huỷ nếu vẫn đang PENDING và là đơn VietQR/MoMo
        if (order.getStatus() != OrderStatus.PENDING) {
            return Map.of("alreadyProcessed", true, "status", order.getStatus().name());
        }
        if (!"vietqr".equals(order.getPaymentMethod()) && !"momo".equals(order.getPaymentMethod())) {
            return Map.of("error", "Chỉ đơn hàng thanh toán trực tuyến mới có thể hết hạn");
        }

        // Hoàn lại tồn kho
        for (OrderItem item : order.getItems()) {
            if (item.getProduct() != null) {
                Product p = item.getProduct();
                p.setStock(p.getStock() + item.getQuantity());
                p.setSold(Math.max(0, p.getSold() - item.getQuantity()));
                productRepository.save(p);
            }
        }

        // Xóa hoàn toàn đơn hàng khỏi hệ thống theo yêu cầu của user
        orderRepository.delete(order);
        
        // Gửi thông báo hủy thanh toán
        notificationService.createNotification(
            user, 
            "Hủy thanh toán", 
            "Đơn hàng " + String.format("FSS-%06d", orderId) + " đã bị hủy do chưa hoàn tất thanh toán.", 
            NotificationType.WARNING
        );
        
        log.info("Order {} deleted from system due to failed/cancelled payment (stock restored)", orderId);

        return Map.of("deleted", true, "orderId", orderId);
    }

    // ─── HUỶ ĐƠN HÀNG ───────────────────────────────────────────────────────
    @Transactional
    public OrderResponse cancelOrder(String email, Long orderId, String reason) {
        User user = findUser(email);
        Order order = orderRepository.findByIdAndUser(orderId, user)
                .orElseThrow(() -> new IllegalArgumentException("Đơn hàng không tồn tại"));

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new IllegalStateException("Chỉ có thể huỷ đơn hàng ở trạng thái Chờ xác nhận");
        }

        if (reason == null || reason.trim().isEmpty()) {
            throw new IllegalArgumentException("Vui lòng nhập lý do huỷ đơn hàng");
        }

        // Hoàn lại tồn kho
        for (OrderItem item : order.getItems()) {
            if (item.getProduct() != null) {
                Product p = item.getProduct();
                p.setStock(p.getStock() + item.getQuantity());
                p.setSold(Math.max(0, p.getSold() - item.getQuantity()));
                productRepository.save(p);
            }
        }

        order.setStatus(OrderStatus.CANCELLED);
        order.setCancelReason(reason.trim());
        Order saved = orderRepository.save(order);
        
        notificationService.createNotification(
            user, 
            "Đã hủy đơn hàng", 
            "Đơn hàng " + String.format("FSS-%06d", saved.getId()) + " đã được hủy. Lý do: " + reason.trim(),
            NotificationType.WARNING
        );

        return mapToResponse(saved);
    }

    // ─── HELPERS ─────────────────────────────────────────────────────────────
    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));
    }

    private String buildAddress(PlaceOrderRequest req) {
        StringBuilder sb = new StringBuilder();
        if (req.getAddress() != null) sb.append(req.getAddress());
        if (req.getDistrict() != null && !req.getDistrict().isBlank())
            sb.append(", ").append(req.getDistrict());
        if (req.getCity() != null && !req.getCity().isBlank())
            sb.append(", ").append(req.getCity());
        return sb.toString();
    }

    private OrderResponse mapToResponse(Order order) {
        List<OrderItemResponse> itemResponses = order.getItems().stream()
                .map(item -> OrderItemResponse.builder()
                        .id(item.getId())
                        .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                        .productName(item.getProductName())
                        .productImage(item.getProductImage())
                        .size(item.getSize())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .subtotal(item.getSubtotal())
                        .build())
                .collect(Collectors.toList());

        return OrderResponse.builder()
                .id(order.getId())
                .orderCode(String.format("FSS-%06d", order.getId()))
                .status(order.getStatus())
                .statusLabel(order.getStatus() != null ? STATUS_LABELS.getOrDefault(order.getStatus(), order.getStatus().name()) : "Không xác định")
                .userEmail(order.getUser() != null ? order.getUser().getEmail() : null)
                .userName(order.getUser() != null ? order.getUser().getFullName() : null)
                .subtotal(order.getSubtotal())
                .shippingFee(order.getShippingFee())
                .discount(order.getDiscount() != null ? order.getDiscount() : BigDecimal.ZERO)
                .voucherCode(order.getVoucherCode())
                .totalAmount(order.getTotalAmount())
                .paymentMethod(order.getPaymentMethod())
                .paymentMethodLabel(PAYMENT_LABELS.getOrDefault(order.getPaymentMethod(), order.getPaymentMethod()))
                .recipientName(order.getRecipientName())
                .recipientPhone(order.getRecipientPhone())
                .shippingAddress(order.getShippingAddress())
                .note(order.getNote())
                .cancelReason(order.getCancelReason())
                .compensationVoucher(order.getCompensationVoucher())
                .items(itemResponses)
                .createdAt(order.getCreatedAt())
                .build();
    }

    // ─── ADMIN: LẤY TẤT CẢ ĐƠN HÀNG ─────────────────────────────────────
    @Transactional
    public List<OrderResponse> getAllOrdersForAdmin() {
        return orderRepository.findAllByOrderByCreatedAtDesc()
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    // ─── ADMIN: CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG ──────────────────────────────
    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, String statusStr, String cancelReason) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn hàng #" + orderId));
        try {
            OrderStatus newStatus = OrderStatus.valueOf(statusStr.toUpperCase());
            OrderStatus currentStatus = order.getStatus();

            // Kiểm soát luồng trạng thái chặt chẽ
            if (currentStatus == OrderStatus.CANCELLED) {
                throw new IllegalArgumentException("Đơn hàng đã bị hủy, không thể đổi sang trạng thái khác");
            }
            if (currentStatus == OrderStatus.DELIVERED) {
                throw new IllegalArgumentException("Đơn hàng đã giao thành công, không thể đổi trạng thái");
            }
            if (currentStatus == newStatus) {
                throw new IllegalArgumentException("Đơn hàng đã ở trạng thái này rồi");
            }

            // Chỉ cho phép chuyển trạng thái theo luồng hợp lệ
            boolean validTransition = switch (currentStatus) {
                case PENDING   -> newStatus == OrderStatus.CONFIRMED || newStatus == OrderStatus.CANCELLED;
                case CONFIRMED -> newStatus == OrderStatus.SHIPPING  || newStatus == OrderStatus.CANCELLED;
                case SHIPPING  -> newStatus == OrderStatus.DELIVERED  || newStatus == OrderStatus.CANCELLED;
                default -> false;
            };
            if (!validTransition) {
                throw new IllegalArgumentException(
                    "Không thể chuyển từ \"" + STATUS_LABELS.get(currentStatus) + "\" sang \"" + STATUS_LABELS.get(newStatus) + "\""
                );
            }

            // Nếu Admin hủy đơn thì phải có lý do
            if (newStatus == OrderStatus.CANCELLED) {
                if (cancelReason == null || cancelReason.trim().isEmpty()) {
                    throw new IllegalArgumentException("Vui lòng nhập lý do hủy đơn hàng cho khách hàng");
                }
                order.setCancelReason(cancelReason.trim());

                // Hoàn lại tồn kho khi Admin hủy
                for (OrderItem item : order.getItems()) {
                    if (item.getProduct() != null) {
                        Product p = item.getProduct();
                        p.setStock(p.getStock() + item.getQuantity());
                        p.setSold(Math.max(0, p.getSold() - item.getQuantity()));
                        productRepository.save(p);
                    }
                }

                // Tạo voucher ưu đãi bù đắp cho khách hàng
                try {
                    String voucherCode = voucherService.createCompensationVoucher(order);
                    order.setCompensationVoucher(voucherCode);
                } catch (Exception e) {
                    log.error("Lỗi khi tạo voucher bù đắp cho đơn #{}: {}", orderId, e.getMessage());
                }
            }

            order.setStatus(newStatus);
            Order saved = orderRepository.save(order);
            log.info("Admin updated order {} status to {}", orderId, newStatus);
            
            // Gửi thông báo cho khách hàng
            try {
                String title = "";
                String message = "";
                NotificationType type = NotificationType.INFO;

                switch (newStatus) {
                    case CONFIRMED:
                        title = "Đơn hàng đã được xác nhận";
                        message = "Đơn hàng FSS-" + String.format("%06d", saved.getId()) + " đã được xác nhận và đang được chuẩn bị.";
                        type = NotificationType.SUCCESS;
                        break;
                    case SHIPPING:
                        title = "Đơn hàng đang giao";
                        message = "Đơn hàng FSS-" + String.format("%06d", saved.getId()) + " đang được vận chuyển.";
                        type = NotificationType.INFO;
                        break;
                    case DELIVERED:
                        title = "Đơn hàng đã giao thành công";
                        message = "Đơn hàng FSS-" + String.format("%06d", saved.getId()) + " đã giao thành công. Cảm ơn bạn đã mua sắm tại FSS!";
                        type = NotificationType.SUCCESS;
                        break;
                    case CANCELLED:
                        title = "Đơn hàng đã bị hủy";
                        message = "Đơn hàng FSS-" + String.format("%06d", saved.getId()) + " đã bị hủy bởi quản trị viên. Lý do: " + cancelReason.trim() + ".";
                        if (saved.getCompensationVoucher() != null) {
                            message += " Bạn đã được tặng mã ưu đãi " + saved.getCompensationVoucher() + " (giảm 10%) cho đơn hàng tiếp theo. Xin lỗi vì sự bất tiện!";
                        }
                        type = NotificationType.WARNING;
                        break;
                    default:
                        break;
                }

                if (!title.isEmpty() && saved.getUser() != null) {
                    notificationService.createNotification(saved.getUser(), title, message, type);
                }
            } catch (Exception e) {
                log.error("Lỗi khi gửi thông báo cập nhật trạng thái đơn hàng cho khách hàng: ", e);
            }

            return mapToResponse(saved);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(e.getMessage());
        }
    }
}
