package vn.fss.cart.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder
public class CartItemResponse {
    private Long id; // Cart item ID
    // Product details
    private Long productId;
    private String name;
    private String image;
    private BigDecimal price; // single item price
    private BigDecimal originalPrice;
    
    private String size;
    private Integer quantity;
    private BigDecimal totalPrice; // price * quantity
}
