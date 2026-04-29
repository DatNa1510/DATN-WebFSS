package vn.fss.order.entity;

import jakarta.persistence.*;
import lombok.*;
import vn.fss.product.entity.Product;

import java.math.BigDecimal;

@Entity
@Table(name = "order_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    @ToString.Exclude
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = true)
    private Product product;

    // Denormalized: lưu để hiển thị lịch sử dù product bị xóa
    @Column(name = "product_name", nullable = false, length = 500)
    private String productName;

    @Column(name = "product_image", length = 500)
    private String productImage;

    @Column(length = 50)
    private String size;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "unit_price", nullable = false, precision = 18, scale = 2)
    private BigDecimal unitPrice;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal subtotal;
}
