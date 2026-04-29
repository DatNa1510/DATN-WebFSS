package vn.fss.order.dto;

import lombok.Builder;
import lombok.Data;
import vn.fss.order.entity.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class OrderResponse {
    private Long id;
    private String orderCode;        // FSS-000001
    private OrderStatus status;
    private String statusLabel;

    private BigDecimal subtotal;
    private BigDecimal shippingFee;
    private BigDecimal totalAmount;

    private String paymentMethod;
    private String paymentMethodLabel;

    private String recipientName;
    private String recipientPhone;
    private String shippingAddress;
    private String note;

    private List<OrderItemResponse> items;
    private LocalDateTime createdAt;
}
