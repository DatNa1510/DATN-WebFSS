package vn.fss.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStatsDto {
    private long totalOrders;
    private long totalCustomers;
    private long totalProducts;
    private BigDecimal totalRevenue;

    // Extended KPIs
    private long deliveredOrders;
    private long cancelledOrders;
    private long pendingOrders;
    private BigDecimal avgOrderValue;
    private long newCustomersThisMonth;
    private BigDecimal revenueThisMonth;
    private BigDecimal revenueLastMonth;
}
