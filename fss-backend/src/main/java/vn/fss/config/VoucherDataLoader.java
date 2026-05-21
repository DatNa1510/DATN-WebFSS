package vn.fss.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import vn.fss.order.entity.Voucher;
import vn.fss.order.entity.VoucherType;
import vn.fss.order.repository.VoucherRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Component
@Order(3) // Run after other loaders if needed
@RequiredArgsConstructor
@Slf4j
public class VoucherDataLoader implements CommandLineRunner {

    private final VoucherRepository voucherRepository;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (voucherRepository.count() == 0) {
            log.info("Seeding Vouchers...");
            
            List<Voucher> vouchers = List.of(
                Voucher.builder()
                        .code("FSSWELCOME")
                        .type(VoucherType.PERCENT)
                        .value(0.10)
                        .minOrder(BigDecimal.ZERO)
                        .maxDiscount(new BigDecimal("50000"))
                        .expiryDate(LocalDate.of(2026, 12, 31))
                        .usageLimit(1000)
                        .build(),
                Voucher.builder()
                        .code("FREESHIP50")
                        .type(VoucherType.FIXED)
                        .value(35000)
                        .minOrder(new BigDecimal("500000"))
                        .maxDiscount(new BigDecimal("35000"))
                        .expiryDate(LocalDate.of(2026, 6, 30))
                        .usageLimit(1000)
                        .build(),
                Voucher.builder()
                        .code("SUMMER24")
                        .type(VoucherType.FIXED)
                        .value(100000)
                        .minOrder(new BigDecimal("1500000"))
                        .maxDiscount(new BigDecimal("100000"))
                        .expiryDate(LocalDate.of(2026, 5, 15))
                        .usageLimit(500)
                        .build(),
                Voucher.builder()
                        .code("FSSVIP")
                        .type(VoucherType.PERCENT)
                        .value(0.20)
                        .minOrder(new BigDecimal("2000000"))
                        .maxDiscount(new BigDecimal("500000"))
                        .expiryDate(LocalDate.of(2026, 12, 31))
                        .usageLimit(200)
                        .build(),
                Voucher.builder()
                        .code("TET2026")
                        .type(VoucherType.FIXED)
                        .value(50000)
                        .minOrder(BigDecimal.ZERO)
                        .maxDiscount(new BigDecimal("50000"))
                        .expiryDate(LocalDate.of(2026, 2, 15))
                        .usageLimit(1000)
                        .build()
            );

            voucherRepository.saveAll(vouchers);
            log.info("Seeded {} vouchers successfully.", vouchers.size());
        }
    }
}
