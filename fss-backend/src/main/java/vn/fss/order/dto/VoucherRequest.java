package vn.fss.order.dto;

import lombok.Data;
import vn.fss.order.entity.VoucherType;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class VoucherRequest {
    private String code;
    private VoucherType type;
    private double value;
    private BigDecimal minOrder;
    private BigDecimal maxDiscount;
    private LocalDate expiryDate;
    private int usageLimit;
    private boolean isActive;
}
