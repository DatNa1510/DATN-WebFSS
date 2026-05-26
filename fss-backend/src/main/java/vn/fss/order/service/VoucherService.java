package vn.fss.order.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.fss.order.dto.VoucherRequest;
import vn.fss.order.dto.VoucherResponse;
import vn.fss.order.entity.Voucher;
import vn.fss.order.entity.VoucherType;
import vn.fss.order.repository.VoucherRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VoucherService {

    private final VoucherRepository voucherRepository;

    /**
     * Validates a voucher code and calculates the actual discount amount.
     * @param code       the voucher code from user
     * @param subtotal   the order subtotal (before shipping, before discount)
     * @return           calculated discount amount (never negative)
     * @throws IllegalArgumentException if voucher is invalid, expired, or min order not met
     */
    @Transactional(readOnly = true)
    public BigDecimal calculateDiscount(String code, BigDecimal subtotal) {
        if (code == null || code.isBlank()) {
            return BigDecimal.ZERO;
        }

        Voucher voucher = voucherRepository.findByCode(code.trim().toUpperCase())
                .orElseThrow(() -> new IllegalArgumentException("Mã giảm giá không hợp lệ: " + code));

        if (!voucher.isActive()) {
            throw new IllegalArgumentException("Mã giảm giá '" + code + "' đã bị vô hiệu hóa.");
        }

        if (LocalDate.now().isAfter(voucher.getExpiryDate())) {
            throw new IllegalArgumentException("Mã giảm giá '" + code + "' đã hết hạn sử dụng.");
        }

        if (voucher.getUsedCount() >= voucher.getUsageLimit()) {
            throw new IllegalArgumentException("Mã giảm giá '" + code + "' đã hết lượt sử dụng.");
        }

        if (subtotal.compareTo(voucher.getMinOrder()) < 0) {
            throw new IllegalArgumentException(
                "Đơn hàng chưa đạt giá trị tối thiểu " + voucher.getMinOrder().toPlainString() + "₫ để dùng mã này."
            );
        }

        BigDecimal discount;
        if (voucher.getType() == VoucherType.PERCENT) {
            discount = subtotal.multiply(BigDecimal.valueOf(voucher.getValue()))
                               .setScale(0, RoundingMode.HALF_UP);
        } else {
            discount = BigDecimal.valueOf(voucher.getValue());
        }

        // Cap at maxDiscount if defined
        if (voucher.getMaxDiscount() != null && voucher.getMaxDiscount().compareTo(BigDecimal.ZERO) > 0) {
            discount = discount.min(voucher.getMaxDiscount());
        }
        
        return discount;
    }

    @Transactional
    public void incrementUsedCount(String code) {
        if (code == null || code.isBlank()) return;
        voucherRepository.findByCode(code.trim().toUpperCase()).ifPresent(voucher -> {
            voucher.setUsedCount(voucher.getUsedCount() + 1);
            voucherRepository.save(voucher);
        });
    }

    // ── PUBLIC / CUSTOMER ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<VoucherResponse> getActiveVouchers() {
        return voucherRepository.findAll().stream()
                .filter(Voucher::isActive)
                .filter(v -> !LocalDate.now().isAfter(v.getExpiryDate()))
                .filter(v -> v.getUsedCount() < v.getUsageLimit())
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ── ADMIN ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<VoucherResponse> getAllVouchers() {
        return voucherRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public VoucherResponse createVoucher(VoucherRequest request) {
        if (voucherRepository.findByCode(request.getCode().trim().toUpperCase()).isPresent()) {
            throw new IllegalArgumentException("Mã Voucher đã tồn tại.");
        }
        Voucher voucher = Voucher.builder()
                .code(request.getCode().trim().toUpperCase())
                .type(request.getType())
                .value(request.getValue())
                .minOrder(request.getMinOrder() != null ? request.getMinOrder() : BigDecimal.ZERO)
                .maxDiscount(request.getMaxDiscount())
                .expiryDate(request.getExpiryDate())
                .usageLimit(request.getUsageLimit())
                .usedCount(0)
                .isActive(request.isActive())
                .build();
        Voucher saved = voucherRepository.save(voucher);
        return mapToResponse(saved);
    }

    @Transactional
    public VoucherResponse updateVoucher(Long id, VoucherRequest request) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Voucher không tồn tại"));

        // Nếu sửa mã code, check xem có trùng không
        String newCode = request.getCode().trim().toUpperCase();
        if (!voucher.getCode().equals(newCode) && voucherRepository.findByCode(newCode).isPresent()) {
            throw new IllegalArgumentException("Mã Voucher đã tồn tại.");
        }

        voucher.setCode(newCode);
        voucher.setType(request.getType());
        voucher.setValue(request.getValue());
        voucher.setMinOrder(request.getMinOrder() != null ? request.getMinOrder() : BigDecimal.ZERO);
        voucher.setMaxDiscount(request.getMaxDiscount());
        voucher.setExpiryDate(request.getExpiryDate());
        voucher.setUsageLimit(request.getUsageLimit());
        voucher.setActive(request.isActive());

        Voucher saved = voucherRepository.save(voucher);
        return mapToResponse(saved);
    }

    @Transactional
    public void deleteVoucher(Long id) {
        if (!voucherRepository.existsById(id)) {
            throw new IllegalArgumentException("Voucher không tồn tại");
        }
        voucherRepository.deleteById(id);
    }

    private VoucherResponse mapToResponse(Voucher voucher) {
        return VoucherResponse.builder()
                .id(voucher.getId())
                .code(voucher.getCode())
                .type(voucher.getType())
                .value(voucher.getValue())
                .minOrder(voucher.getMinOrder())
                .maxDiscount(voucher.getMaxDiscount())
                .expiryDate(voucher.getExpiryDate())
                .usageLimit(voucher.getUsageLimit())
                .usedCount(voucher.getUsedCount())
                .isActive(voucher.isActive())
                .createdAt(voucher.getCreatedAt())
                .updatedAt(voucher.getUpdatedAt())
                .build();
    }
}
