package vn.fss.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.fss.auth.dto.AuthResponse;
import vn.fss.auth.dto.LoginRequest;
import vn.fss.auth.dto.RegisterRequest;
import vn.fss.auth.entity.User;
import vn.fss.auth.repository.UserRepository;
import vn.fss.auth.security.JwtUtil;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    @Transactional
    public void register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã được sử dụng");
        }

        String token = UUID.randomUUID().toString();

        User user = User.builder()
                .fullName(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(User.Role.CUSTOMER)
                .isEnabled(false)
                .verificationToken(token)
                .tokenExpiry(Instant.now().plus(24, ChronoUnit.HOURS))
                .build();

        userRepository.save(user);

        // Gửi email xác thực không đợi thread chính
        new Thread(() -> {
            try {
                emailService.sendVerificationEmail(user.getEmail(), user.getFullName(), token);
            } catch (Exception e) {
                log.error("Lỗi khi gửi email chạy ngầm", e);
            }
        }).start();
    }

    @Transactional
    public String verifyEmail(String token) {
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> new RuntimeException("Token không hợp lệ hoặc không tồn tại"));

        if (user.getTokenExpiry().isBefore(Instant.now())) {
            throw new RuntimeException("Token đã hết hạn. Vui lòng đăng ký lại.");
        }

        user.setIsEnabled(true);
        user.setVerificationToken(null);
        user.setTokenExpiry(null);
        userRepository.save(user);

        return "Xác thực tài khoản thành công!";
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Email hoặc mật khẩu không đúng"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Email hoặc mật khẩu không đúng");
        }

        if (!user.getIsEnabled()) {
            throw new RuntimeException("Vui lòng xác thực email trước khi đăng nhập");
        }

        String token = jwtUtil.generateToken(user);

        return AuthResponse.builder()
                .token(token)
                .user(AuthResponse.UserDto.builder()
                        .id(user.getId())
                        .name(user.getFullName())
                        .email(user.getEmail())
                        .role(user.getRole().name().toLowerCase())
                        .avatar(user.getAvatarUrl() != null ? user.getAvatarUrl() : 
                               (user.getRole() == User.Role.ADMIN ? "/admin-pfp.jpg" : "/customer-pfp.jpg"))
                        .phone(user.getPhone())
                        .build())
                .build();
    }

    public AuthResponse.UserDto getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
                
        return AuthResponse.UserDto.builder()
                .id(user.getId())
                .name(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name().toLowerCase())
                .avatar(user.getAvatarUrl() != null ? user.getAvatarUrl() : 
                               (user.getRole() == User.Role.ADMIN ? "/admin-pfp.jpg" : "/customer-pfp.jpg"))
                .phone(user.getPhone())
                .build();
    }

    @Transactional
    public void forgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Email không tồn tại trong hệ thống"));

        if (!user.getIsEnabled()) {
            throw new RuntimeException("Tài khoản chưa được kích hoạt");
        }

        String token = UUID.randomUUID().toString();
        user.setResetPasswordToken(token);
        user.setResetTokenExpiry(Instant.now().plus(1, ChronoUnit.HOURS));
        userRepository.save(user);

        new Thread(() -> {
            try {
                emailService.sendResetPasswordEmail(user.getEmail(), user.getFullName(), token);
            } catch (Exception e) {
                log.error("Lỗi khi gửi email khôi phục mật khẩu chạy ngầm", e);
            }
        }).start();
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        User user = userRepository.findByResetPasswordToken(token)
                .orElseThrow(() -> new RuntimeException("Token không hợp lệ hoặc không tồn tại"));

        if (user.getResetTokenExpiry() == null || user.getResetTokenExpiry().isBefore(Instant.now())) {
            throw new RuntimeException("Token đã hết hạn. Vui lòng yêu cầu lại.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetPasswordToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
    }
}
