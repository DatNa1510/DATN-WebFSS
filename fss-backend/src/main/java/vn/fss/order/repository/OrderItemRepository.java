package vn.fss.order.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.fss.order.entity.OrderItem;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    /**
     * Set product_id = NULL cho tất cả order_items tham chiếu đến sản phẩm này.
     * Giúp giữ nguyên lịch sử đơn hàng (productName, productImage đã denormalized)
     * mà vẫn cho phép xóa sản phẩm khỏi bảng products.
     */
    @Modifying
    @Query("UPDATE OrderItem oi SET oi.product = NULL WHERE oi.product.id = :productId")
    void nullifyProductReference(@Param("productId") Long productId);
}
