package vn.fss.dashboard.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import vn.fss.auth.entity.User;
import vn.fss.auth.repository.UserRepository;
import vn.fss.dashboard.dto.DashboardResponse;
import vn.fss.dashboard.dto.DashboardStatsDto;
import vn.fss.dashboard.dto.MonthlyRevenueDto;
import vn.fss.order.dto.OrderResponse;
import vn.fss.order.dto.OrderItemResponse;
import vn.fss.order.entity.Order;
import vn.fss.order.repository.OrderRepository;
import vn.fss.product.entity.Product;
import vn.fss.product.repository.ProductRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    private static final Map<String, String> PAYMENT_LABELS = Map.of(
            "cod",     "Thanh toán khi nhận hàng (COD)",
            "banking", "Chuyển khoản ngân hàng",
            "momo",    "Ví MoMo",
            "vietqr",  "Chuyển khoản VietQR (PayOS)"
    );

    private static final Map<vn.fss.order.entity.OrderStatus, String> STATUS_LABELS = Map.of(
            vn.fss.order.entity.OrderStatus.PENDING,   "Chờ xác nhận",
            vn.fss.order.entity.OrderStatus.CONFIRMED, "Đã xác nhận",
            vn.fss.order.entity.OrderStatus.SHIPPING,  "Đang giao",
            vn.fss.order.entity.OrderStatus.DELIVERED, "Đã giao",
            vn.fss.order.entity.OrderStatus.CANCELLED, "Đã huỷ"
    );

    public DashboardResponse getDashboardData() {
        // 1. KPI Stats
        long totalOrders = orderRepository.count();
        long totalCustomers = userRepository.countByRole(User.Role.CUSTOMER);
        long totalProducts = productRepository.count();
        BigDecimal totalRevenue = orderRepository.calculateTotalRevenue();
        if (totalRevenue == null) {
            totalRevenue = BigDecimal.ZERO;
        }

        DashboardStatsDto stats = DashboardStatsDto.builder()
                .totalOrders(totalOrders)
                .totalCustomers(totalCustomers)
                .totalProducts(totalProducts)
                .totalRevenue(totalRevenue)
                .build();

        // 2. Monthly Revenue
        int currentYear = LocalDate.now().getYear();
        List<Object[]> rawRevenue = orderRepository.findMonthlyRevenue(currentYear);
        List<MonthlyRevenueDto> revenueData = new ArrayList<>();
        
        // Initialize 12 months with 0
        for (int i = 1; i <= 12; i++) {
            revenueData.add(new MonthlyRevenueDto("T" + i, BigDecimal.ZERO));
        }
        
        for (Object[] row : rawRevenue) {
            int month = ((Number) row[0]).intValue();
            BigDecimal rev = (BigDecimal) row[1];
            revenueData.get(month - 1).setRevenue(rev);
        }

        // 3. Top Products
        List<Product> topProducts = productRepository.findTopProductsBySold(PageRequest.of(0, 4)).getContent();

        // 4. Recent Orders
        List<Order> recentOrderEntities = orderRepository.findTopRecentOrders(PageRequest.of(0, 5));
        List<OrderResponse> recentOrders = recentOrderEntities.stream()
                .map(this::mapToOrderResponse)
                .collect(Collectors.toList());

        return DashboardResponse.builder()
                .stats(stats)
                .revenueData(revenueData)
                .topProducts(topProducts)
                .recentOrders(recentOrders)
                .build();
    }

    private OrderResponse mapToOrderResponse(Order order) {
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
                .userEmail(order.getUser() != null ? order.getUser().getEmail() : null)
                .userName(order.getUser() != null ? order.getUser().getFullName() : null)
                .subtotal(order.getSubtotal())
                .shippingFee(order.getShippingFee())
                .discount(order.getDiscount() != null ? order.getDiscount() : BigDecimal.ZERO)
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
