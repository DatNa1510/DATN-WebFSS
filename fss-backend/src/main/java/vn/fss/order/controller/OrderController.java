package vn.fss.order.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
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

    // Huỷ đơn hàng (chỉ khi PENDING)
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<?> cancelOrder(Authentication auth, @PathVariable Long id) {
        try {
            OrderResponse order = orderService.cancelOrder(auth.getName(), id);
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
}
