package vn.fss.order.entity;

public enum OrderStatus {
    PENDING,      // Chờ xác nhận
    CONFIRMED,    // Đã xác nhận
    SHIPPING,     // Đang giao
    DELIVERED,    // Đã giao
    CANCELLED     // Đã huỷ
}
