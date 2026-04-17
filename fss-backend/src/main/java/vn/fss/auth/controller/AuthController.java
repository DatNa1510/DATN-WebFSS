package vn.fss.auth.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.fss.auth.dto.AuthResponse;
import vn.fss.auth.dto.LoginRequest;
import vn.fss.auth.dto.RegisterRequest;
import vn.fss.auth.entity.User;
import vn.fss.auth.service.AuthService;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@Valid @RequestBody RegisterRequest request) {
        authService.register(request);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Đã gửi email xác thực");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/verify")
    public ResponseEntity<Map<String, String>> verifyEmail(@RequestParam String token) {
        String message = authService.verifyEmail(token);
        Map<String, String> response = new HashMap<>();
        response.put("message", message);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<Map<String, String>> resendVerification(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.isBlank()) {
            throw new RuntimeException("Email không được để trống");
        }
        authService.resendVerificationEmail(email);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Đã gửi lại email xác thực");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof User)) {
             return ResponseEntity.status(401).body("Chưa xác thực");
        }
        User user = (User) authentication.getPrincipal();
        AuthResponse.UserDto response = authService.getCurrentUser(user.getEmail());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.isBlank()) {
            throw new RuntimeException("Email không được để trống");
        }
        authService.forgotPassword(email);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Đã gửi email khôi phục mật khẩu");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        String newPassword = request.get("newPassword");
        
        if (token == null || token.isBlank() || newPassword == null || newPassword.isBlank()) {
            throw new RuntimeException("Dữ liệu không hợp lệ");
        }
        
        authService.resetPassword(token, newPassword);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Đổi mật khẩu thành công");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new RuntimeException("Refresh Token không được để trống");
        }
        
        AuthResponse response = authService.refreshToken(refreshToken);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> googleLogin(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        if (token == null || token.isBlank()) {
            throw new RuntimeException("Google Token không được để trống");
        }
        AuthResponse response = authService.googleLogin(token);
        return ResponseEntity.ok(response);
    }
}
