package vn.fss.order.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.fss.auth.entity.User;
import vn.fss.order.entity.Order;
import vn.fss.order.entity.OrderStatus;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByUserOrderByCreatedAtDesc(User user);

    Optional<Order> findByIdAndUser(Long id, User user);

    /**
     * Kiểm tra user đã mua sản phẩm này chưa (1 câu SQL duy nhất, tránh N+1).
     * Dùng cho việc xác nhận "verifiedPurchase" trong ReviewService.
     */
    @Query("SELECT COUNT(oi) > 0 FROM OrderItem oi " +
           "WHERE oi.order.user = :user " +
           "AND oi.product.id = :productId " +
           "AND oi.order.status IN :statuses")
    boolean existsByUserAndProductIdAndStatusIn(
            @Param("user") User user,
            @Param("productId") Long productId,
            @Param("statuses") List<OrderStatus> statuses);
}
