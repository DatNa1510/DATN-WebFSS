package vn.fss.order.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
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

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;

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
        BigDecimal totalAmount = subtotal.add(shippingFee);

        // Tạo địa chỉ giao hàng đầy đủ
        String fullAddress = buildAddress(request);

        // Tạo Order
        Order order = Order.builder()
                .user(user)
                .status(OrderStatus.PENDING)
                .subtotal(subtotal)
                .shippingFee(shippingFee)
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

        // Xóa sản phẩm đã mua khỏi giỏ hàng
        for (CartItem ci : cartItems) {
            cartItemRepository.delete(ci);
        }

        return mapToResponse(saved);
    }

    // ─── LỊCH SỬ ĐƠN HÀNG ───────────────────────────────────────────────────
    public List<OrderResponse> getUserOrders(String email) {
        User user = findUser(email);
        return orderRepository.findByUserOrderByCreatedAtDesc(user)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    // ─── CHI TIẾT ĐƠN HÀNG ──────────────────────────────────────────────────
    public OrderResponse getOrderById(String email, Long orderId) {
        User user = findUser(email);
        Order order = orderRepository.findByIdAndUser(orderId, user)
                .orElseThrow(() -> new IllegalArgumentException("Đơn hàng không tồn tại"));
        return mapToResponse(order);
    }

    // ─── HUỶ ĐƠN HÀNG ───────────────────────────────────────────────────────
    @Transactional
    public OrderResponse cancelOrder(String email, Long orderId) {
        User user = findUser(email);
        Order order = orderRepository.findByIdAndUser(orderId, user)
                .orElseThrow(() -> new IllegalArgumentException("Đơn hàng không tồn tại"));

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new IllegalStateException("Chỉ có thể huỷ đơn hàng ở trạng thái Chờ xác nhận");
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
        return mapToResponse(orderRepository.save(order));
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
                .statusLabel(STATUS_LABELS.getOrDefault(order.getStatus(), order.getStatus().name()))
                .subtotal(order.getSubtotal())
                .shippingFee(order.getShippingFee())
                .totalAmount(order.getTotalAmount())
                .paymentMethod(order.getPaymentMethod())
                .paymentMethodLabel(PAYMENT_LABELS.getOrDefault(order.getPaymentMethod(), order.getPaymentMethod()))
                .recipientName(order.getRecipientName())
                .recipientPhone(order.getRecipientPhone())
                .shippingAddress(order.getShippingAddress())
                .note(order.getNote())
                .items(itemResponses)
                .createdAt(order.getCreatedAt())
                .build();
    }
}
