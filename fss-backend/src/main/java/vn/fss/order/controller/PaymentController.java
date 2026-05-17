package vn.fss.order.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import vn.fss.order.dto.PaymentResponse;
import vn.fss.order.entity.Order;
import vn.fss.order.entity.OrderStatus;
import vn.fss.order.repository.OrderRepository;
import vn.fss.order.service.MomoPaymentService;
import vn.fss.order.service.VietQRPaymentService;
import vn.fss.notification.service.NotificationService;
import vn.fss.notification.model.Notification.NotificationType;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    @Value("${momo.secret-key}")
    private String momoSecretKey;

    @Value("${momo.access-key}")
    private String momoAccessKey;

    @Value("${momo.partner-code}")
    private String momoPartnerCode;

    private final OrderRepository orderRepository;
    private final MomoPaymentService momoPaymentService;
    private final VietQRPaymentService vietQRPaymentService;
    private final NotificationService notificationService;

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
    @Transactional
    public ResponseEntity<?> momoCallback(@RequestBody Map<String, Object> requestBody) {
        log.info("Received MoMo IPN Callback: {}", requestBody);
        try {
            // ── Bước 1: Verify chữ ký HMAC-SHA256 từ MoMo ────────────────────
            String receivedSignature = String.valueOf(requestBody.get("signature"));
            String accessKey   = String.valueOf(requestBody.get("accessKey"));
            String amount      = String.valueOf(requestBody.get("amount"));
            String extraData   = String.valueOf(requestBody.getOrDefault("extraData", ""));
            String message     = String.valueOf(requestBody.get("message"));
            String orderId     = String.valueOf(requestBody.get("orderId"));
            String orderInfo   = String.valueOf(requestBody.get("orderInfo"));
            String orderType   = String.valueOf(requestBody.get("orderType"));
            String partnerCode = String.valueOf(requestBody.get("partnerCode"));
            String payType     = String.valueOf(requestBody.get("payType"));
            String requestId   = String.valueOf(requestBody.get("requestId"));
            String resultCode  = String.valueOf(requestBody.get("resultCode"));
            String transId     = String.valueOf(requestBody.get("transId"));

            String rawHash = "accessKey=" + accessKey
                    + "&amount=" + amount
                    + "&extraData=" + extraData
                    + "&message=" + message
                    + "&orderId=" + orderId
                    + "&orderInfo=" + orderInfo
                    + "&orderType=" + orderType
                    + "&partnerCode=" + partnerCode
                    + "&payType=" + payType
                    + "&requestId=" + requestId
                    + "&resultCode=" + resultCode
                    + "&transId=" + transId;

            String expectedSignature = hmacSHA256(rawHash, momoSecretKey);
            if (!expectedSignature.equals(receivedSignature)) {
                log.warn("MoMo IPN: Chữ ký không hợp lệ! orderId={}", orderId);
                return ResponseEntity.ok(Map.of("message", "Invalid signature")); // Trả 200 để MoMo không retry
            }

            // ── Bước 2: Xử lý kết quả thanh toán ────────────────────────────
            int code = Integer.parseInt(resultCode);
            // orderId từ MoMo có format "123_1700000000"
            Long actualOrderId = Long.parseLong(orderId.split("_")[0]);

            Order order = orderRepository.findById(actualOrderId).orElse(null);
            if (order != null && order.getStatus() == OrderStatus.PENDING) {
                if (code == 0) {
                    order.setStatus(OrderStatus.CONFIRMED);
                    orderRepository.save(order);
                    notificationService.createNotification(
                            order.getUser(),
                            "Thanh toán thành công",
                            "Đơn hàng " + String.format("FSS-%06d", order.getId()) + " đã được thanh toán và xác nhận thành công.",
                            NotificationType.SUCCESS
                    );
                    log.info("Order {} confirmed via MoMo", actualOrderId);
                } else {
                    log.warn("MoMo payment failed (resultCode={}) for order {}", code, actualOrderId);
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
    @Transactional
    public ResponseEntity<?> vietQRCallback(@RequestBody Map<String, Object> requestBody) {
        log.info("Received PayOS Webhook: {}", requestBody);
        try {
            // ── Bước 1: Check code hợp lệ ────────────────────────────────────
            String code = String.valueOf(requestBody.get("code"));
            if (!"00".equals(code)) {
                log.info("PayOS Webhook: Giao dịch không thành công, code={}", code);
                return ResponseEntity.ok(Map.of("message", "Payment not successful"));
            }

            // ── Bước 2: Lấy data ─────────────────────────────────────────────
            @SuppressWarnings("unchecked")
            Map<String, Object> data = (Map<String, Object>) requestBody.get("data");
            if (data == null) {
                log.warn("PayOS Webhook: Không có trường 'data' trong request");
                return ResponseEntity.ok(Map.of("message", "No data"));
            }

            // ── Bước 3: Cập nhật đơn hàng (idempotent - chỉ update nếu còn PENDING) ──
            Long orderId = Long.parseLong(String.valueOf(data.get("orderCode")));
            Order order = orderRepository.findById(orderId).orElse(null);
            if (order == null) {
                log.warn("PayOS Webhook: Không tìm thấy đơn hàng id={}", orderId);
                return ResponseEntity.ok(Map.of("message", "Order not found"));
            }
            if (order.getStatus() == OrderStatus.PENDING) {
                order.setStatus(OrderStatus.CONFIRMED);
                orderRepository.save(order);
                notificationService.createNotification(
                        order.getUser(),
                        "Thanh toán thành công",
                        "Đơn hàng " + String.format("FSS-%06d", order.getId()) + " đã được thanh toán và xác nhận thành công.",
                        NotificationType.SUCCESS
                );
                log.info("Order {} confirmed via PayOS", orderId);
            } else {
                log.info("PayOS Webhook: Đơn hàng {} đã ở trạng thái {}, bỏ qua.", orderId, order.getStatus());
            }
            return ResponseEntity.ok(Map.of("message", "Webhook Processed"));
        } catch (Exception e) {
            log.error("Error processing PayOS Webhook: ", e);
            return ResponseEntity.badRequest().body(Map.of("message", "Webhook Processing Failed"));
        }
    }

    // ── HMAC-SHA256 Helper ────────────────────────────────────────────────────
    private String hmacSHA256(String data, String key) throws Exception {
        Mac sha256HMAC = Mac.getInstance("HmacSHA256");
        SecretKeySpec secretKey = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        sha256HMAC.init(secretKey);
        byte[] hash = sha256HMAC.doFinal(data.getBytes(StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        for (byte b : hash) sb.append(String.format("%02x", b));
        return sb.toString();
    }
}
