package vn.fss.order.service;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Map;

/**
 * Server-side voucher validation service.
 * Discounts are ONLY calculated here, never trusted from the frontend.
 */
@Service
public class VoucherService {

    // ── Cấu trúc Voucher ──────────────────────────────────────────────────────
    public record Voucher(
            String code,
            VoucherType type,
            double value,          // percent (0.1 = 10%) or fixed amount (50000)
            BigDecimal minOrder,
            BigDecimal maxDiscount,
            LocalDate expiryDate
    ) {}

    public enum VoucherType { PERCENT, FIXED }

    // ── Danh sách Voucher hợp lệ (nguồn sự thật duy nhất) ───────────────────
    private static final Map<String, Voucher> VOUCHERS = Map.of(
        "FSSWELCOME", new Voucher("FSSWELCOME", VoucherType.PERCENT, 0.10,
                BigDecimal.ZERO, new BigDecimal("50000"), LocalDate.of(2026, 12, 31)),

        "FREESHIP50", new Voucher("FREESHIP50", VoucherType.FIXED, 35000,
                new BigDecimal("500000"), new BigDecimal("35000"), LocalDate.of(2026, 6, 30)),

        "SUMMER24", new Voucher("SUMMER24", VoucherType.FIXED, 100000,
                new BigDecimal("1500000"), new BigDecimal("100000"), LocalDate.of(2026, 5, 15)),

        "FSSVIP", new Voucher("FSSVIP", VoucherType.PERCENT, 0.20,
                new BigDecimal("2000000"), new BigDecimal("500000"), LocalDate.of(2026, 12, 31)),

        "TET2026", new Voucher("TET2026", VoucherType.FIXED, 50000,
                BigDecimal.ZERO, new BigDecimal("50000"), LocalDate.of(2026, 2, 15))
    );

    /**
     * Validates a voucher code and calculates the actual discount amount.
     * @param code       the voucher code from user
     * @param subtotal   the order subtotal (before shipping, before discount)
     * @return           calculated discount amount (never negative)
     * @throws IllegalArgumentException if voucher is invalid, expired, or min order not met
     */
    public BigDecimal calculateDiscount(String code, BigDecimal subtotal) {
        if (code == null || code.isBlank()) {
            return BigDecimal.ZERO;
        }

        Voucher voucher = VOUCHERS.get(code.trim().toUpperCase());

        if (voucher == null) {
            throw new IllegalArgumentException("Mã giảm giá không hợp lệ: " + code);
        }

        if (LocalDate.now().isAfter(voucher.expiryDate())) {
            throw new IllegalArgumentException("Mã giảm giá '" + code + "' đã hết hạn sử dụng.");
        }

        if (subtotal.compareTo(voucher.minOrder()) < 0) {
            throw new IllegalArgumentException(
                "Đơn hàng chưa đạt giá trị tối thiểu " + voucher.minOrder().toPlainString() + "₫ để dùng mã này."
            );
        }

        BigDecimal discount;
        if (voucher.type() == VoucherType.PERCENT) {
            discount = subtotal.multiply(BigDecimal.valueOf(voucher.value()))
                               .setScale(0, RoundingMode.HALF_UP);
        } else {
            discount = BigDecimal.valueOf(voucher.value());
        }

        // Cap at maxDiscount
        return discount.min(voucher.maxDiscount());
    }
}
