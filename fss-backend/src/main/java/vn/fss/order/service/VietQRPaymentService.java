package vn.fss.order.service;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import vn.fss.order.dto.PaymentResponse;
import vn.fss.order.entity.Order;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class VietQRPaymentService implements PaymentService {

    private static final String PAYOS_API = "https://api-merchant.payos.vn/v2/payment-requests";

    @Value("${payos.client-id}")
    private String clientId;

    @Value("${payos.api-key}")
    private String apiKey;

    @Value("${payos.checksum-key}")
    private String checksumKey;

    @Value("${payos.return-url}")
    private String returnUrl;

    @Value("${payos.cancel-url}")
    private String cancelUrl;

    @Value("${payos.bank.account-number:246686868}")
    private String shopAccountNumber;

    @Value("${payos.bank.account-name:NGUYEN NGOC DAT}")
    private String shopAccountName;

    @Value("${payos.bank.code:MB}")
    private String shopBankCode;

    @Value("${payos.bank.name:Ngan hang TMCP Quan doi (MBBank)}")
    private String shopBankName;

    private final ObjectMapper objectMapper;

    // ── DTOs cho PayOS request / response ─────────────────────────────────────

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class PayOSItem {
        String name;
        int price;
        int quantity;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class PayOSRequest {
        long orderCode;
        int amount;
        String description;
        String returnUrl;
        String cancelUrl;
        String signature;
        List<PayOSItem> items;
        Long expiredAt;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class PayOSResponseData {
        String bin;
        String accountNumber;
        String accountName;
        int amount;
        String description;
        long orderCode;
        String currency;
        String paymentLinkId;
        String status;
        String checkoutUrl;
        String qrCode;
        // expiredAt và các field mới khác sẽ bị bỏ qua tự động
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class PayOSResponse {
        String code;
        String desc;
        PayOSResponseData data;
    }

    // ── Tạo chữ ký HMAC-SHA256 ────────────────────────────────────────────────
    private String sign(long orderCode, int amount, String description,
                        String cancelUrl, String returnUrl) throws Exception {
        // PayOS yêu cầu sort key alphabetically rồi join bằng &
        String raw = "amount=" + amount
                + "&cancelUrl=" + cancelUrl
                + "&description=" + description
                + "&orderCode=" + orderCode
                + "&returnUrl=" + returnUrl;

        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(checksumKey.getBytes(), "HmacSHA256"));
        byte[] hash = mac.doFinal(raw.getBytes());
        StringBuilder sb = new StringBuilder();
        for (byte b : hash) sb.append(String.format("%02x", b));
        return sb.toString();
    }

    @Override
    public PaymentResponse createPayment(Order order) throws Exception {
        long orderCode = order.getId();
        int amount     = order.getTotalAmount().intValue();
        String desc    = "FSS" + orderCode;          // max 25 ký tự, không dấu

        // Build item
        PayOSItem item = new PayOSItem();
        item.setName("Thanh toan don hang " + orderCode);
        item.setPrice(amount);
        item.setQuantity(1);

        long expiredAtUnix = (System.currentTimeMillis() + 5L * 60 * 1000) / 1000;

        // Build request body
        PayOSRequest req = new PayOSRequest();
        req.setOrderCode(orderCode);
        req.setAmount(amount);
        req.setDescription(desc);
        req.setReturnUrl(returnUrl);
        req.setCancelUrl(cancelUrl);
        req.setExpiredAt(expiredAtUnix);
        req.setSignature(sign(orderCode, amount, desc, cancelUrl, returnUrl));
        req.setItems(List.of(item));

        String body = objectMapper.writeValueAsString(req);
        log.info("→ PayOS request body: {}", body);

        HttpRequest httpReq = HttpRequest.newBuilder()
                .uri(URI.create(PAYOS_API))
                .header("Content-Type", "application/json")
                .header("x-client-id", clientId)
                .header("x-api-key", apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

        HttpResponse<String> httpResp = HttpClient.newHttpClient()
                .send(httpReq, HttpResponse.BodyHandlers.ofString());

        log.info("← PayOS response [{}]: {}", httpResp.statusCode(), httpResp.body());

        PayOSResponse resp = objectMapper.readValue(httpResp.body(), PayOSResponse.class);

        if (resp.getData() == null || !"00".equals(resp.getCode())) {
            throw new RuntimeException("PayOS error: " + resp.getDesc());
        }

        PayOSResponseData d = resp.getData();

        String accountNumber = resolve(d.getAccountNumber(), shopAccountNumber);
        String accountName   = resolve(d.getAccountName(),   shopAccountName);
        String bankCode      = resolve(d.getBin(),           shopBankCode);

        long expiresAt = System.currentTimeMillis() + 5L * 60 * 1000;

        log.info("PayOS QR created for order {} | bank={} | acct={}", orderCode, bankCode, accountNumber);

        return PaymentResponse.builder()
                .paymentMethod("vietqr")
                .paymentUrl(d.getCheckoutUrl())
                .qrCode(d.getQrCode())
                .accountNumber(accountNumber)
                .accountName(accountName)
                .bankCode(bankCode)
                .bankName(shopBankName)
                .transferContent(desc)
                .expiresAt(expiresAt)
                .build();
    }

    public boolean isPaid(long orderCode) {
        try {
            String url = PAYOS_API + "/" + orderCode;
            HttpRequest httpReq = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .header("x-client-id", clientId)
                    .header("x-api-key", apiKey)
                    .GET()
                    .build();

            HttpResponse<String> httpResp = HttpClient.newHttpClient()
                    .send(httpReq, HttpResponse.BodyHandlers.ofString());

            if (httpResp.statusCode() != 200) {
                log.warn("PayOS check status failed for order {}: {}", orderCode, httpResp.body());
                return false;
            }

            PayOSResponse resp = objectMapper.readValue(httpResp.body(), PayOSResponse.class);
            if (resp.getData() != null && "PAID".equals(resp.getData().getStatus())) {
                log.info("PayOS confirmed payment for order {} via API poll", orderCode);
                return true;
            }
        } catch (Exception e) {
            log.error("Error checking PayOS status for order {}: ", orderCode, e);
        }
        return false;
    }

    private String resolve(String fromApi, String fallback) {
        return (fromApi != null && !fromApi.isBlank()) ? fromApi : fallback;
    }
}
