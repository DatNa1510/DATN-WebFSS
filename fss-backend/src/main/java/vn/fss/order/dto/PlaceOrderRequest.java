package vn.fss.order.dto;

import lombok.Data;

@Data
public class PlaceOrderRequest {
    private String recipientName;
    private String recipientPhone;
    private String address;
    private String district;
    private String city;
    private String note;
    private String paymentMethod; // cod | banking | momo
    private String shippingMethod; // express | fast | standard
    private java.util.List<Long> selectedItemIds; // List of cart item IDs to checkout
    private String voucherCode; // Mã voucher - Backend sẽ tự tính discount
}
