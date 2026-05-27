package vn.fss.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.fss.order.dto.OrderResponse;
import vn.fss.product.entity.Product;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardResponse {
    private DashboardStatsDto stats;
    private List<MonthlyRevenueDto> revenueData;
    private List<Product> topProducts;
    private List<OrderResponse> recentOrders;

    // New analytics data
    private OrderStatusStatsDto orderStatusStats;
    private List<PaymentMethodStatsDto> paymentMethodStats;
    private List<CategoryRevenueDto> categoryRevenue;
}
