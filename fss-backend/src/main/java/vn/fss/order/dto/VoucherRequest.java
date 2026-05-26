package vn.fss.order.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
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
    @JsonProperty("isActive")
    private boolean isActive;
}
