package vn.fss.auth.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import vn.fss.auth.entity.User;
import vn.fss.auth.repository.UserRepository;

@Component
@RequiredArgsConstructor
@Slf4j
public class AdminSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        String adminEmail = "admin@fss.vn";
        
        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = User.builder()
                    .fullName("Administrator")
                    .email(adminEmail)
                    .password(passwordEncoder.encode("admin123"))
                    .phone("0123456789")
                    .role(User.Role.ADMIN)
                    .isEnabled(true) // Kích hoạt luôn không cần qua email
                    .build();
            
            userRepository.save(admin);
            log.info("✅ Đã tạo tài khoản Admin mặc định: {} / admin123", adminEmail);
        } else {
            log.info("ℹ️ Tài khoản Admin '{}' đã tồn tại trong database.", adminEmail);
        }
    }
}
