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
    private String paymentUrl; // MoMo redirect URL
    private String qrCode; // PayOS QR Code string or checkoutUrl
    private String paymentMethod;
}
