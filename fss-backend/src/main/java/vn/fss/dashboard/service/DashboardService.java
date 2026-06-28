package vn.fss.dashboard.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import vn.fss.auth.entity.User;
import vn.fss.auth.repository.UserRepository;
import vn.fss.dashboard.dto.*;
import vn.fss.order.dto.OrderResponse;
import vn.fss.order.dto.OrderItemResponse;
import vn.fss.order.entity.Order;
import vn.fss.order.entity.OrderStatus;
import vn.fss.order.repository.OrderRepository;
import vn.fss.product.entity.Product;
import vn.fss.product.repository.ProductRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
@SuppressWarnings("null")
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

    public DashboardResponse getDashboardData(Integer year) {
        int targetYear = (year != null) ? year : LocalDate.now().getYear();
        int currentMonth = LocalDate.now().getMonthValue();
        int currentYear = LocalDate.now().getYear();

        // 1. KPI Stats
        long totalOrders = orderRepository.count();
        long totalCustomers = userRepository.countByRole(User.Role.CUSTOMER);
        long totalProducts = productRepository.count();
        BigDecimal totalRevenue = orderRepository.calculateTotalRevenue();
        if (totalRevenue == null) totalRevenue = BigDecimal.ZERO;

        // Extended KPIs
        long deliveredOrders = orderRepository.countByStatus(OrderStatus.DELIVERED);
        long cancelledOrders = orderRepository.countByStatus(OrderStatus.CANCELLED);
        long pendingOrders = orderRepository.countByStatus(OrderStatus.PENDING);

        BigDecimal avgOrderValue = orderRepository.calculateAvgOrderValue();
        if (avgOrderValue == null) avgOrderValue = BigDecimal.ZERO;
        avgOrderValue = avgOrderValue.setScale(0, RoundingMode.HALF_UP);

        long newCustomersThisMonth = 0;
        try {
            newCustomersThisMonth = userRepository.countNewCustomersByMonthAndYear(currentMonth, currentYear);
        } catch (Exception e) {
            log.warn("Error counting new customers: {}", e.getMessage());
        }

        BigDecimal revenueThisMonth = orderRepository.sumRevenueByMonthAndYear(currentMonth, currentYear);
        if (revenueThisMonth == null) revenueThisMonth = BigDecimal.ZERO;

        int prevMonth = currentMonth == 1 ? 12 : currentMonth - 1;
        int prevYear = currentMonth == 1 ? currentYear - 1 : currentYear;
        BigDecimal revenueLastMonth = orderRepository.sumRevenueByMonthAndYear(prevMonth, prevYear);
        if (revenueLastMonth == null) revenueLastMonth = BigDecimal.ZERO;

        DashboardStatsDto stats = DashboardStatsDto.builder()
                .totalOrders(totalOrders)
                .totalCustomers(totalCustomers)
                .totalProducts(totalProducts)
                .totalRevenue(totalRevenue)
                .deliveredOrders(deliveredOrders)
                .cancelledOrders(cancelledOrders)
                .pendingOrders(pendingOrders)
                .avgOrderValue(avgOrderValue)
                .newCustomersThisMonth(newCustomersThisMonth)
                .revenueThisMonth(revenueThisMonth)
                .revenueLastMonth(revenueLastMonth)
                .build();

        // 2. Monthly Revenue (for target year)
        List<Object[]> rawRevenue = orderRepository.findMonthlyRevenue(targetYear);
        List<MonthlyRevenueDto> revenueData = new ArrayList<>();
        for (int i = 1; i <= 12; i++) {
            revenueData.add(new MonthlyRevenueDto("T" + i, BigDecimal.ZERO));
        }
        for (Object[] row : rawRevenue) {
            if (row != null && row.length >= 2 && row[0] != null) {
                int month = ((Number) row[0]).intValue();
                BigDecimal rev = row[1] != null ? new BigDecimal(row[1].toString()) : BigDecimal.ZERO;
                if (month >= 1 && month <= 12) {
                    revenueData.get(month - 1).setRevenue(rev);
                }
            }
        }

        // 3. Top Products
        List<Product> topProducts = productRepository.findTopProductsBySold(PageRequest.of(0, 5)).getContent();

        // 4. Recent Orders
        List<Order> recentOrderEntities = orderRepository.findTopRecentOrders(PageRequest.of(0, 8));
        List<OrderResponse> recentOrders = recentOrderEntities.stream()
                .map(this::mapToOrderResponse)
                .collect(Collectors.toList());

        // 5. Order Status Stats (REAL DATA)
        OrderStatusStatsDto orderStatusStats = buildOrderStatusStats();

        // 6. Payment Method Stats (REAL DATA)
        List<PaymentMethodStatsDto> paymentMethodStats = buildPaymentMethodStats();

        // 7. Category Revenue (REAL DATA)
        List<CategoryRevenueDto> categoryRevenue = buildCategoryRevenue();

        return DashboardResponse.builder()
                .stats(stats)
                .revenueData(revenueData)
                .topProducts(topProducts)
                .recentOrders(recentOrders)
                .orderStatusStats(orderStatusStats)
                .paymentMethodStats(paymentMethodStats)
                .categoryRevenue(categoryRevenue)
                .build();
    }

    private OrderStatusStatsDto buildOrderStatusStats() {
        List<Object[]> statusCounts = orderRepository.countByStatusGrouped();
        long pending = 0, confirmed = 0, shipping = 0, delivered = 0, cancelled = 0;
        for (Object[] row : statusCounts) {
            if (row[0] == null) continue;
            OrderStatus status = (OrderStatus) row[0];
            long count = ((Number) row[1]).longValue();
            switch (status) {
                case PENDING -> pending = count;
                case CONFIRMED -> confirmed = count;
                case SHIPPING -> shipping = count;
                case DELIVERED -> delivered = count;
                case CANCELLED -> cancelled = count;
            }
        }
        return OrderStatusStatsDto.builder()
                .pending(pending)
                .confirmed(confirmed)
                .shipping(shipping)
                .delivered(delivered)
                .cancelled(cancelled)
                .build();
    }

    private List<PaymentMethodStatsDto> buildPaymentMethodStats() {
        List<Object[]> raw = orderRepository.revenueByPaymentMethod();
        // Gộp các method trùng nhau do chữ hoa/thường khác nhau
        Map<String, long[]> countMap = new java.util.LinkedHashMap<>();
        Map<String, BigDecimal> revenueMap = new java.util.LinkedHashMap<>();
        for (Object[] row : raw) {
            String method = row[0] != null ? row[0].toString().toLowerCase().trim() : "unknown";
            long count = ((Number) row[1]).longValue();
            BigDecimal revenue = row[2] != null ? new BigDecimal(row[2].toString()) : BigDecimal.ZERO;
            countMap.merge(method, new long[]{count}, (a, b) -> { a[0] += b[0]; return a; });
            revenueMap.merge(method, revenue, BigDecimal::add);
        }
        List<PaymentMethodStatsDto> result = new ArrayList<>();
        for (String method : countMap.keySet()) {
            String label = PAYMENT_LABELS.getOrDefault(method, method.toUpperCase());
            result.add(PaymentMethodStatsDto.builder()
                    .method(label)
                    .label(label)
                    .orderCount(countMap.get(method)[0])
                    .revenue(revenueMap.get(method))
                    .build());
        }
        return result;
    }

    private List<CategoryRevenueDto> buildCategoryRevenue() {
        List<Object[]> raw = orderRepository.revenueByCategory();
        List<CategoryRevenueDto> result = new ArrayList<>();
        for (Object[] row : raw) {
            String category = row[0] != null ? row[0].toString() : "Khác";
            BigDecimal revenue = row[1] != null ? new BigDecimal(row[1].toString()) : BigDecimal.ZERO;
            long quantity = row[2] != null ? ((Number) row[2]).longValue() : 0;
            result.add(CategoryRevenueDto.builder()
                    .category(category)
                    .revenue(revenue)
                    .quantity(quantity)
                    .build());
        }
        return result;
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
                .statusLabel(order.getStatus() != null ? STATUS_LABELS.getOrDefault(order.getStatus(), order.getStatus().name()) : "Không xác định")
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
