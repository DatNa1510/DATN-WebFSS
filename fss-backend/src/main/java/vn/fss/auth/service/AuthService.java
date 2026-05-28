package vn.fss.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import vn.fss.auth.dto.AuthResponse;
import vn.fss.auth.dto.LoginRequest;
import vn.fss.auth.dto.RegisterRequest;
import vn.fss.auth.entity.RefreshToken;
import vn.fss.auth.entity.User;
import vn.fss.auth.entity.UserAuditLog;
import vn.fss.auth.repository.RefreshTokenRepository;
import vn.fss.auth.repository.UserAuditLogRepository;
import vn.fss.auth.repository.UserRepository;
import vn.fss.auth.security.JwtUtil;
import vn.fss.notification.service.NotificationService;
import vn.fss.notification.model.Notification;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;
    private final NotificationService notificationService;
    private final UserAuditLogRepository userAuditLogRepository;

    @org.springframework.beans.factory.annotation.Value("${google.client-id}")
    private String googleClientId;

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

        UserAuditLog logRecord = UserAuditLog.builder()
                .user(user)
                .actionTitle("Khởi tạo hồ sơ khách hàng")
                .actionDetail("Tài khoản đang chờ chuẩn hóa thông tin")
                .actionType(UserAuditLog.ActionType.PROFILE)
                .build();
        userAuditLogRepository.save(logRecord);

        // Gửi email xác thực (đã được cấu hình @Async trong EmailService)
        try {
            emailService.sendVerificationEmail(user.getEmail(), user.getFullName(), token);
        } catch (Exception e) {
            log.error("Lỗi khi gửi email xác thực", e);
        }
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

    @Transactional
    public void resendVerificationEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Tài khoản chưa được đăng ký"));

        if (user.getIsEnabled()) {
            throw new RuntimeException("Tài khoản đã được kích hoạt thành công, vui lòng đăng nhập");
        }

        String token = UUID.randomUUID().toString();
        user.setVerificationToken(token);
        user.setTokenExpiry(Instant.now().plus(24, ChronoUnit.HOURS));
        userRepository.save(user);

        try {
            emailService.sendVerificationEmail(user.getEmail(), user.getFullName(), token);
        } catch (Exception e) {
            log.error("Lỗi khi gửi email xác thực lại", e);
        }
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Email hoặc mật khẩu không đúng"));

        // Kiểm tra tài khoản bị xóa
        if (Boolean.TRUE.equals(user.getIsDeleted())) {
            String reason = user.getDeletionReason() != null && !user.getDeletionReason().isBlank() 
                            ? user.getDeletionReason() 
                            : "Vi phạm chính sách hệ thống";
            throw new RuntimeException("Tài khoản của bạn đã bị xóa. Lý do: " + reason);
        }

        // Kiểm tra tài khoản có đang bị khóa không? (khóa 15 phút do sai mật khẩu)
        if (user.getLockTime() != null) {
            if (user.getLockTime().plus(15, ChronoUnit.MINUTES).isAfter(Instant.now())) {
                long minutesLeft = ChronoUnit.MINUTES.between(Instant.now(), user.getLockTime().plus(15, ChronoUnit.MINUTES));
                throw new RuntimeException("Tài khoản đang tạm khóa. Thử lại sau " + (minutesLeft + 1) + " phút.");
            } else {
                // Đã hết thời gian khóa
                user.setFailedAttempts(0);
                user.setLockTime(null);
                userRepository.save(user);
            }
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            int newFailures = user.getFailedAttempts() + 1;
            user.setFailedAttempts(newFailures);
            if (newFailures >= 5) {
                user.setLockTime(Instant.now());
                userRepository.save(user);
                throw new RuntimeException("Sai mật khẩu 5 lần. Tài khoản bị khóa 15 phút.");
            }
            userRepository.save(user);
            throw new RuntimeException("Email hoặc mật khẩu không đúng. Còn " + (5 - newFailures) + " lần thử.");
        }

        if (!user.getIsEnabled()) {
            if (user.getLockReason() != null && !user.getLockReason().isBlank()) {
                throw new RuntimeException("Tài khoản của bạn đã bị khóa. Lý do: " + user.getLockReason());
            }
            throw new RuntimeException("Vui lòng xác thực email trước khi đăng nhập");
        }

        // Reset lại khi đăng nhập thành công
        if (user.getFailedAttempts() > 0 || user.getLockTime() != null) {
            user.setFailedAttempts(0);
            user.setLockTime(null);
            userRepository.save(user);
        }

        String token = jwtUtil.generateToken(user);
        
        // --- Sinh Refresh Token ---
        String rToken = UUID.randomUUID().toString();
        RefreshToken refreshToken = refreshTokenRepository.findByUser(user).orElse(
            RefreshToken.builder().user(user).build()
        );
        refreshToken.setToken(rToken);
        refreshToken.setExpiryDate(Instant.now().plus(7, ChronoUnit.DAYS));
        refreshTokenRepository.save(refreshToken);

        return AuthResponse.builder()
                .token(token)
                .refreshToken(rToken)
                .user(AuthResponse.UserDto.builder()
                        .id(user.getId())
                        .name(user.getFullName())
                        .email(user.getEmail())
                        .role(user.getRole().name().toLowerCase())
                        .avatar(user.getAvatarUrl() != null ? user.getAvatarUrl() : null)
                        .phone(user.getPhone())
                        .dob(user.getDob())
                        .gender(user.getGender())
                        .bio(user.getBio())
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
                .avatar(user.getAvatarUrl() != null ? user.getAvatarUrl() : null)
                .phone(user.getPhone())
                .dob(user.getDob())
                .gender(user.getGender())
                .bio(user.getBio())
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

        // Gửi email khôi phục mật khẩu (chạy ngầm nhờ @Async)
        try {
            emailService.sendResetPasswordEmail(user.getEmail(), user.getFullName(), token);
        } catch (Exception e) {
            log.error("Lỗi khi gửi email khôi phục mật khẩu", e);
        }
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

    @Transactional
    public AuthResponse refreshToken(String requestRefreshToken) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(requestRefreshToken)
                .orElseThrow(() -> new RuntimeException("Refresh Token không tồn tại hoặc đã bị đăng xuất"));

        if (refreshToken.getExpiryDate().isBefore(Instant.now())) {
            refreshTokenRepository.delete(refreshToken);
            throw new RuntimeException("Refresh Token đã hết hạn. Vui lòng đăng nhập lại.");
        }

        User user = refreshToken.getUser();
        String newAccessToken = jwtUtil.generateToken(user);

        return AuthResponse.builder()
                .token(newAccessToken)
                .refreshToken(refreshToken.getToken()) // Giữ nguyên refresh token cũ (hoặc có thể xoay vòng token ở đây)
                .user(AuthResponse.UserDto.builder()
                        .id(user.getId())
                        .name(user.getFullName())
                        .email(user.getEmail())
                        .role(user.getRole().name().toLowerCase())
                        .avatar(user.getAvatarUrl() != null ? user.getAvatarUrl() : null)
                        .phone(user.getPhone())
                        .build())
                .build();
    }

    @Transactional
    public AuthResponse googleLogin(String googleTokenString) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(googleTokenString);
            HttpEntity<String> entity = new HttpEntity<>("", headers);

            // Sử dụng ParameterizedTypeReference để tránh raw type Map
            ResponseEntity<java.util.Map<String, Object>> response = restTemplate.exchange(
                    "https://www.googleapis.com/oauth2/v3/userinfo",
                    HttpMethod.GET,
                    entity,
                    new org.springframework.core.ParameterizedTypeReference<java.util.Map<String, Object>>() {}
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                java.util.Map<String, Object> payload = response.getBody();
                String email = (String) payload.get("email");
                String name = (String) payload.get("name");

                // Tìm hoặc tạo mới User
                User user = userRepository.findByEmail(email).orElseGet(() -> {
                    User newUser = User.builder()
                            .email(email)
                            .fullName(name)
                            .password(passwordEncoder.encode(UUID.randomUUID().toString())) // Mật khẩu ảo an toàn
                            .isEnabled(true) // Google đã verify nên active luôn
                            .role(User.Role.CUSTOMER)
                            .build();
                    User savedUser = userRepository.save(newUser);
                    
                    UserAuditLog logRecord = UserAuditLog.builder()
                            .user(savedUser)
                            .actionTitle("Khởi tạo hồ sơ khách hàng")
                            .actionDetail("Đăng nhập lần đầu qua Google")
                            .actionType(UserAuditLog.ActionType.PROFILE)
                            .build();
                    userAuditLogRepository.save(logRecord);
                    return savedUser;
                });

                // Sinh token
                String token = jwtUtil.generateToken(user);
                
                // Sinh Refresh Token
                String rToken = UUID.randomUUID().toString();
                RefreshToken refreshToken = refreshTokenRepository.findByUser(user).orElse(
                    RefreshToken.builder().user(user).build()
                );
                refreshToken.setToken(rToken);
                refreshToken.setExpiryDate(Instant.now().plus(7, ChronoUnit.DAYS));
                refreshTokenRepository.save(refreshToken);

                return AuthResponse.builder()
                        .token(token)
                        .refreshToken(rToken)
                        .user(AuthResponse.UserDto.builder()
                                .id(user.getId())
                                .name(user.getFullName())
                                .email(user.getEmail())
                                .role(user.getRole().name().toLowerCase())
                                .avatar(user.getAvatarUrl() != null ? user.getAvatarUrl() : null)
                                .phone(user.getPhone())
                                .build())
                        .build();
            } else {
                throw new RuntimeException("Token Google không hợp lệ");
            }
        } catch (Exception e) {
            log.error("Lỗi xác thực Google", e);
            throw new RuntimeException("Xác thực Google thất bại: " + e.getMessage());
        }
    }

    // ── CẬP NHẬT HỒ SƠ ──────────────────────────────────────────────────────
    @Transactional
    public AuthResponse.UserDto updateProfile(String email, String fullName, String phone, String dob, String gender, String bio) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        java.util.List<String> changes = new java.util.ArrayList<>();
        if (fullName != null && !fullName.isBlank() && !fullName.trim().equals(user.getFullName())) {
            user.setFullName(fullName.trim());
            changes.add("họ tên");
        }
        if (phone != null && !phone.trim().equals(user.getPhone() != null ? user.getPhone() : "")) {
            user.setPhone(phone.trim());
            changes.add("số điện thoại");
        }
        if (dob != null && !dob.trim().equals(user.getDob() != null ? user.getDob() : "")) {
            user.setDob(dob.trim());
            changes.add("ngày sinh");
        }
        if (gender != null && !gender.trim().equals(user.getGender() != null ? user.getGender() : "")) {
            user.setGender(gender.trim());
            changes.add("giới tính");
        }
        if (bio != null && !bio.trim().equals(user.getBio() != null ? user.getBio() : "")) {
            user.setBio(bio.trim());
            changes.add("tiểu sử");
        }
        
        if (changes.isEmpty()) {
            return getCurrentUser(email);
        }

        userRepository.save(user);

        notificationService.createNotification(
            user, 
            "Cập nhật hồ sơ", 
            "Thông tin cá nhân của bạn đã được cập nhật thành công.", 
            Notification.NotificationType.SUCCESS
        );

        String actionTitle;
        String actionDetail;

        if (changes.size() == 1) {
            String field = changes.get(0);
            // Capitalize first letter for title
            actionTitle = "Cập nhật " + field;
            actionDetail = "Bạn đã thay đổi " + field;
        } else {
            actionTitle = "Cập nhật thông tin hồ sơ";
            actionDetail = "Bạn đã thay đổi: " + String.join(", ", changes);
        }

        UserAuditLog logRecord = UserAuditLog.builder()
                .user(user)
                .actionTitle(actionTitle)
                .actionDetail(actionDetail)
                .actionType(UserAuditLog.ActionType.PROFILE)
                .build();
        userAuditLogRepository.save(logRecord);

        return AuthResponse.UserDto.builder()
                .id(user.getId())
                .name(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name().toLowerCase())
                .avatar(user.getAvatarUrl() != null ? user.getAvatarUrl() : null)
                .phone(user.getPhone())
                .dob(user.getDob())
                .gender(user.getGender())
                .bio(user.getBio())
                .build();
    }

    // ── ĐỔI MẬT KHẨU ────────────────────────────────────────────────────────
    @Transactional
    public void changePassword(String email, String oldPassword, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("Mật khẩu hiện tại không đúng");
        }
        if (newPassword.length() < 6) {
            throw new RuntimeException("Mật khẩu mới phải có ít nhất 6 ký tự");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        notificationService.createNotification(
            user, 
            "Đổi mật khẩu", 
            "Mật khẩu tài khoản của bạn đã được thay đổi thành công.", 
            Notification.NotificationType.WARNING
        );

        UserAuditLog logRecord = UserAuditLog.builder()
                .user(user)
                .actionTitle("Tài khoản được bảo vệ")
                .actionDetail("Hệ thống đã mã hóa mật khẩu cấp cao")
                .actionType(UserAuditLog.ActionType.SECURITY)
                .build();
        userAuditLogRepository.save(logRecord);
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public java.util.List<UserAuditLog> getAuditLogs(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        return userAuditLogRepository.findByUserOrderByCreatedAtDesc(user);
    }
}

