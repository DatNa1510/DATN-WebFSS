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

    // Admin: lấy tất cả đơn hàng sắp xếp mới nhất trước
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"user", "items", "items.product"})
    List<Order> findAllByOrderByCreatedAtDesc();

    // Lấy tổng doanh thu của các đơn hàng đã giao (DELIVERED)
    @Query("SELECT SUM(o.totalAmount) FROM Order o WHERE o.status = vn.fss.order.entity.OrderStatus.DELIVERED")
    java.math.BigDecimal calculateTotalRevenue();

    // Lấy doanh thu theo tháng trong năm
    @Query(value = "SELECT EXTRACT(MONTH FROM created_at) as month, SUM(total_amount) as revenue " +
                   "FROM orders " +
                   "WHERE EXTRACT(YEAR FROM created_at) = :year AND status = 'DELIVERED' " +
                   "GROUP BY EXTRACT(MONTH FROM created_at) " +
                   "ORDER BY month", nativeQuery = true)
    List<Object[]> findMonthlyRevenue(@Param("year") int year);

    // Lấy danh sách đơn hàng gần đây với phân trang
    @Query("SELECT o FROM Order o ORDER BY o.createdAt DESC")
    List<Order> findTopRecentOrders(org.springframework.data.domain.Pageable pageable);

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

    // ═══════════════════════════════════════
    // NEW: Dashboard Analytics Queries
    // ═══════════════════════════════════════

    // Đếm đơn theo từng trạng thái
    @Query("SELECT o.status, COUNT(o) FROM Order o GROUP BY o.status")
    List<Object[]> countByStatusGrouped();

    // Đếm đơn theo trạng thái cụ thể
    long countByStatus(OrderStatus status);

    // Doanh thu + số đơn theo phương thức thanh toán (chỉ đơn DELIVERED)
    @Query("SELECT o.paymentMethod, COUNT(o), SUM(o.totalAmount) FROM Order o WHERE o.status = vn.fss.order.entity.OrderStatus.DELIVERED GROUP BY o.paymentMethod")
    List<Object[]> revenueByPaymentMethod();

    // Doanh thu 1 tháng cụ thể
    @Query(value = "SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'DELIVERED' AND EXTRACT(MONTH FROM created_at) = :month AND EXTRACT(YEAR FROM created_at) = :year", nativeQuery = true)
    java.math.BigDecimal sumRevenueByMonthAndYear(@Param("month") int month, @Param("year") int year);

    // Giá trị đơn hàng trung bình (AOV) — chỉ đơn DELIVERED
    @Query("SELECT COALESCE(AVG(o.totalAmount), 0) FROM Order o WHERE o.status = vn.fss.order.entity.OrderStatus.DELIVERED")
    java.math.BigDecimal calculateAvgOrderValue();

    // Doanh thu theo danh mục sản phẩm (join OrderItem → Product)
    @Query(value = "SELECT p.master_category, COALESCE(SUM(oi.subtotal), 0) as revenue, COALESCE(SUM(oi.quantity), 0) as qty " +
                   "FROM order_items oi " +
                   "JOIN products p ON oi.product_id = p.id " +
                   "JOIN orders o ON oi.order_id = o.id " +
                   "WHERE o.status = 'DELIVERED' " +
                   "GROUP BY p.master_category " +
                   "ORDER BY revenue DESC", nativeQuery = true)
    List<Object[]> revenueByCategory();
}
