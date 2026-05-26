package vn.fss.order.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.fss.adminlog.service.AdminLogService;
import vn.fss.order.dto.VoucherRequest;
import vn.fss.order.dto.VoucherResponse;
import vn.fss.order.service.VoucherService;

import java.math.BigDecimal;
import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vouchers")
@RequiredArgsConstructor
public class VoucherController {

    private final VoucherService voucherService;
    private final AdminLogService adminLogService;

    // ── PUBLIC / CUSTOMER ───────────────────────────────────────────────────

    @GetMapping("/validate")
    public ResponseEntity<?> validateVoucher(@RequestParam String code, @RequestParam BigDecimal subtotal) {
        try {
            BigDecimal discount = voucherService.calculateDiscount(code, subtotal);
            return ResponseEntity.ok(Map.of(
                    "valid", true,
                    "code", code.trim().toUpperCase(),
                    "discountAmount", discount
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "valid", false,
                    "error", e.getMessage()
            ));
        }
    }

    @GetMapping("/active")
    public ResponseEntity<List<VoucherResponse>> getActiveVouchers() {
        return ResponseEntity.ok(voucherService.getActiveVouchers());
    }

    // ── ADMIN ───────────────────────────────────────────────────────────────

    @GetMapping("/admin")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<VoucherResponse>> getAllVouchers() {
        return ResponseEntity.ok(voucherService.getAllVouchers());
    }

    @PostMapping("/admin")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> createVoucher(Principal principal, @RequestBody VoucherRequest request) {
        try {
            VoucherResponse voucher = voucherService.createVoucher(request);
            adminLogService.log(
                principal.getName(), principal.getName(), "CREATE", "VOUCHER",
                voucher.getId(), voucher.getCode(), "Tạo mới voucher: " + voucher.getCode()
            );
            return ResponseEntity.ok(Map.of("message", "Tạo voucher thành công", "voucher", voucher));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/admin/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> updateVoucher(Principal principal, @PathVariable Long id, @RequestBody VoucherRequest request) {
        try {
            VoucherResponse voucher = voucherService.updateVoucher(id, request);
            adminLogService.log(
                principal.getName(), principal.getName(), "UPDATE", "VOUCHER",
                voucher.getId(), voucher.getCode(), "Cập nhật voucher: " + voucher.getCode()
            );
            return ResponseEntity.ok(Map.of("message", "Cập nhật voucher thành công", "voucher", voucher));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/admin/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> deleteVoucher(Principal principal, @PathVariable Long id) {
        try {
            voucherService.deleteVoucher(id);
            adminLogService.log(
                principal.getName(), principal.getName(), "DELETE", "VOUCHER",
                id, "#" + id, "Xóa voucher ID: " + id
            );
            return ResponseEntity.ok(Map.of("message", "Xóa voucher thành công"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
