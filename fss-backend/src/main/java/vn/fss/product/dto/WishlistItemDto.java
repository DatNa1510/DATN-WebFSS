package vn.fss.product.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.fss.product.entity.WishlistItem;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WishlistItemDto {
    private Long id;
    private Long productId;
    private String productName;
    private String productCategory;
    private BigDecimal price;
    private BigDecimal originalPrice;
    private String imageUrl;
    
    public static WishlistItemDto fromEntity(WishlistItem item) {
        String imgUrl = null;
        if (item.getProduct().getImagePath() != null) {
            String[] parts = item.getProduct().getImagePath().split(",");
            if (parts.length > 0) imgUrl = parts[0];
        }
        
        return WishlistItemDto.builder()
                .id(item.getId())
                .productId(item.getProduct().getId())
                .productName(item.getProduct().getProductDisplayName())
                .productCategory(item.getProduct().getArticleType())
                .price(item.getProduct().getPrice())
                .originalPrice(item.getProduct().getOriginalPrice())
                .imageUrl(imgUrl)
                .build();
    }
}
