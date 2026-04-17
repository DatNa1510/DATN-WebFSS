package vn.fss.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import lombok.extern.slf4j.Slf4j;

@Configuration
@Slf4j
public class DataMigrationConfig {

    @Bean
    public CommandLineRunner migrateAvatars(JdbcTemplate jdbcTemplate) {
        return args -> {
            log.info("Đang kiểm tra và đồng bộ Avatar mặc định cho Khách hàng...");
            try {
                // Xóa avatar_url của tất cả CUSTOMER để họ quay về dùng file customer-pfp.jpg mặc định
                // Chúng ta chỉ xóa những đường dẫn rác hoặc đường dẫn từ Google cũ
                int updatedCount = jdbcTemplate.update(
                    "UPDATE users SET avatar_url = NULL WHERE role = 'CUSTOMER' AND (avatar_url IS NULL OR avatar_url LIKE 'http%' OR avatar_url = '')"
                );
                log.info("Đã đồng bộ thành công {} tài khoản khách hàng sang Avatar mới.", updatedCount);
            } catch (Exception e) {
                log.error("Lỗi khi đồng bộ Avatar: {}", e.getMessage());
            }
        };
    }
}
