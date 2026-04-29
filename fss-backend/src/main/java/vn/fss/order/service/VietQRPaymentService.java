package vn.fss.order.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import vn.fss.order.dto.PaymentResponse;
import vn.fss.order.entity.Order;
import vn.payos.PayOS;
import vn.payos.type.CheckoutResponseData;
import vn.payos.type.ItemData;
import vn.payos.type.PaymentData;

@Service
@RequiredArgsConstructor
@Slf4j
public class VietQRPaymentService implements PaymentService {

    private final PayOS payOS;

    @Value("${payos.return-url}")
    private String returnUrl;

    @Value("${payos.cancel-url}")
    private String cancelUrl;

    @Override
    public PaymentResponse createPayment(Order order) throws Exception {
        // Build item data
        ItemData item = ItemData.builder()
                .name("Thanh toan don hang " + order.getId())
                .price(order.getTotalAmount().intValue())
                .quantity(1)
                .build();

        // Build payment data
        PaymentData paymentData = PaymentData.builder()
                .orderCode(order.getId()) // OrderID is used as orderCode
                .amount(order.getTotalAmount().intValue())
                .description("FSS-" + order.getId())
                .returnUrl(returnUrl)
                .cancelUrl(cancelUrl)
                .item(item)
                .build();

        log.info("Creating PayOS payment link for order {}", order.getId());
        CheckoutResponseData data = payOS.createPaymentLink(paymentData);

        return PaymentResponse.builder()
                .paymentMethod("vietqr")
                .paymentUrl(data.getCheckoutUrl())
                .qrCode(data.getQrCode())
                .build();
    }
}
