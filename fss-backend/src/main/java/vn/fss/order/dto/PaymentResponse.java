package vn.fss.order.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {
    private String paymentUrl;    // MoMo redirect URL
    private String qrCode;        // PayOS QR Code string or checkoutUrl
    private String paymentMethod;

    // Bank info for VietQR
    private String accountNumber; // Số tài khoản
    private String accountName;   // Tên chủ tài khoản
    private String bankCode;      // Mã ngân hàng (MB, VCB, ...)
    private String bankName;      // Tên ngân hàng đầy đủ
    private String transferContent; // Nội dung chuyển khoản
    private Long   expiresAt;     // Unix timestamp (ms) hết hạn QR
}
