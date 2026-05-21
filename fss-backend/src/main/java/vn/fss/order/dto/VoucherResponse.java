package vn.fss.order.dto;

import lombok.Builder;
import lombok.Data;
import vn.fss.order.entity.VoucherType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class VoucherResponse {
    private Long id;
    private String code;
    private VoucherType type;
    private double value;
    private BigDecimal minOrder;
    private BigDecimal maxDiscount;
    private LocalDate expiryDate;
    private int usageLimit;
    private int usedCount;
    private boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
