package vn.fss.order.service;

import vn.fss.order.dto.PaymentResponse;
import vn.fss.order.entity.Order;

public interface PaymentService {
    PaymentResponse createPayment(Order order) throws Exception;
}
