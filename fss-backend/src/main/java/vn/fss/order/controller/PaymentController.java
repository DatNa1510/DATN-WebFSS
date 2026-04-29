package vn.fss.order.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.fss.order.dto.PaymentResponse;
import vn.fss.order.entity.Order;
import vn.fss.order.entity.OrderStatus;
import vn.fss.order.repository.OrderRepository;
import vn.fss.order.service.MomoPaymentService;
import vn.fss.order.service.VietQRPaymentService;

import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final OrderRepository orderRepository;
    private final MomoPaymentService momoPaymentService;
    private final VietQRPaymentService vietQRPaymentService;

    // ── TẠO YÊU CẦU THANH TOÁN ────────────────────────────────────────────────
    @PostMapping("/create/{orderId}")
    public ResponseEntity<?> createPayment(@PathVariable Long orderId) {
        try {
            Order order = orderRepository.findById(orderId)
                    .orElseThrow(() -> new IllegalArgumentException("Order not found"));

            if (order.getStatus() != OrderStatus.PENDING) {
                return ResponseEntity.badRequest().body(Map.of("error", "Order cannot be paid. Status: " + order.getStatus()));
            }

            PaymentResponse response;
            if ("momo".equals(order.getPaymentMethod())) {
                response = momoPaymentService.createPayment(order);
            } else if ("vietqr".equals(order.getPaymentMethod()) || "banking".equals(order.getPaymentMethod())) {
                response = vietQRPaymentService.createPayment(order);
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid payment method for online payment"));
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error creating payment: ", e);
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ── MOMO CALLBACK (IPN) ───────────────────────────────────────────────────
    @PostMapping("/momo-callback")
    public ResponseEntity<?> momoCallback(@RequestBody Map<String, Object> requestBody) {
        log.info("Received MoMo IPN Callback: {}", requestBody);
        try {
            int resultCode = Integer.parseInt(String.valueOf(requestBody.get("resultCode")));
            String orderIdStr = String.valueOf(requestBody.get("orderId"));
            
            // orderId from MoMo format is "123_1700000000"
            Long actualOrderId = Long.parseLong(orderIdStr.split("_")[0]);

            Order order = orderRepository.findById(actualOrderId).orElse(null);
            if (order != null && order.getStatus() == OrderStatus.PENDING) {
                if (resultCode == 0) {
                    order.setStatus(OrderStatus.CONFIRMED);
                    orderRepository.save(order);
                    log.info("Order {} confirmed via MoMo", actualOrderId);
                } else {
                    log.warn("MoMo payment failed for order {}", actualOrderId);
                }
            }
            return ResponseEntity.ok(Map.of("message", "IPN Processed"));
        } catch (Exception e) {
            log.error("Error processing MoMo IPN: ", e);
            return ResponseEntity.badRequest().body(Map.of("message", "IPN Processing Failed"));
        }
    }

    // ── PAYOS CALLBACK (WEBHOOK) ──────────────────────────────────────────────
    @PostMapping("/vietqr-callback")
    public ResponseEntity<?> vietQRCallback(@RequestBody Map<String, Object> requestBody) {
        log.info("Received PayOS Webhook: {}", requestBody);
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> data = (Map<String, Object>) requestBody.get("data");
            if (data == null) return ResponseEntity.ok(Map.of("message", "No data"));
            
            String code = String.valueOf(requestBody.get("code"));
            if ("00".equals(code)) {
                Long orderId = Long.parseLong(String.valueOf(data.get("orderCode")));
                Order order = orderRepository.findById(orderId).orElse(null);
                if (order != null && order.getStatus() == OrderStatus.PENDING) {
                    order.setStatus(OrderStatus.CONFIRMED);
                    orderRepository.save(order);
                    log.info("Order {} confirmed via PayOS", orderId);
                }
            }
            return ResponseEntity.ok(Map.of("message", "Webhook Processed"));
        } catch (Exception e) {
            log.error("Error processing PayOS Webhook: ", e);
            return ResponseEntity.badRequest().body(Map.of("message", "Webhook Processing Failed"));
        }
    }
}
