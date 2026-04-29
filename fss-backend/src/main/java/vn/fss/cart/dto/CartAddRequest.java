package vn.fss.cart.dto;

import lombok.Data;

@Data
public class CartAddRequest {
    private Long productId;
    private Integer quantity;
    private String size;
}
