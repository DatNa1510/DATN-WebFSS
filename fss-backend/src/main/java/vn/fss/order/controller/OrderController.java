package vn.fss.order.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.fss.adminlog.service.AdminLogService;
import vn.fss.order.dto.OrderResponse;
import vn.fss.order.dto.PlaceOrderRequest;
import vn.fss.order.service.OrderService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final AdminLogService adminLogService;

    // Đặt hàng từ giỏ hàng hiện tại
    @PostMapping
    public ResponseEntity<?> placeOrder(Authentication auth,
                                        @RequestBody PlaceOrderRequest request) {
        try {
            OrderResponse order = orderService.placeOrder(auth.getName(), request);
            return ResponseEntity.ok(Map.of(
                    "message", "Đặt hàng thành công!",
                    "order", order
            ));
        } catch (IllegalStateException | IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Lịch sử đơn hàng của user
    @GetMapping
    public ResponseEntity<List<OrderResponse>> getUserOrders(Authentication auth) {
        return ResponseEntity.ok(orderService.getUserOrders(auth.getName()));
    }

    // Chi tiết 1 đơn hàng
    @GetMapping("/{id}")
    public ResponseEntity<?> getOrderById(Authentication auth, @PathVariable Long id) {
        try {
            return ResponseEntity.ok(orderService.getOrderById(auth.getName(), id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Huỷ đơn hàng (chỉ khi PENDING) — cần lý do
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<?> cancelOrder(Authentication auth, @PathVariable Long id,
                                         @RequestBody Map<String, String> body) {
        try {
            String reason = body != null ? body.getOrDefault("reason", "") : "";
            OrderResponse order = orderService.cancelOrder(auth.getName(), id, reason);
            return ResponseEntity.ok(Map.of("message", "Huỷ đơn hàng thành công", "order", order));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Huỷ đơn hàng do QR/thanh toán hết hạn (hoàn tồn kho)
    @PatchMapping("/{id}/expire")
    public ResponseEntity<?> expireOrder(Authentication auth, @PathVariable Long id) {
        try {
            Map<String, Object> result = orderService.expirePaymentOrder(auth.getName(), id);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── ADMIN ENDPOINTS ──────────────────────────────────────────────────────

    // Admin: Lấy tất cả đơn hàng trong hệ thống
    @GetMapping("/admin/all")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> getAllOrdersAdmin() {
        try {
            return ResponseEntity.ok(orderService.getAllOrdersForAdmin());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    // Admin: Cập nhật trạng thái đơn hàng
    @PatchMapping("/admin/{id}/status")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> updateOrderStatusAdmin(Authentication auth, @PathVariable Long id,
                                                    @RequestBody Map<String, String> body) {
        try {
            String status = body.get("status");
            String cancelReason = body.getOrDefault("cancelReason", "");
            OrderResponse updated = orderService.updateOrderStatus(id, status, cancelReason);
            adminLogService.log(
                auth.getName(), auth.getName(), "STATUS_CHANGE", "ORDER",
                id, updated.getOrderCode() != null ? updated.getOrderCode() : "#" + id,
                "Đổi trạng thái đơn #" + (updated.getOrderCode() != null ? updated.getOrderCode() : id)
                    + " thành: " + updated.getStatusLabel()
            );
            return ResponseEntity.ok(Map.of("message", "Cập nhật thành công", "order", updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}

