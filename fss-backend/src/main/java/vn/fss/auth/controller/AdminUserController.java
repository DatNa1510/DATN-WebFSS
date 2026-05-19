package vn.fss.auth.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.fss.auth.dto.UserSummaryResponse;
import vn.fss.auth.entity.User;
import vn.fss.auth.repository.UserRepository;

import java.util.Map;
import java.util.stream.Collectors;
import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasAuthority('ADMIN')")
public class AdminUserController {

    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "ALL") String role,
            @RequestParam(defaultValue = "ALL") String status,
            @RequestParam(defaultValue = "") String search) {

        PageRequest pageRequest = PageRequest.of(page, limit, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<User> userPage = userRepository.findUsersByFilters(
                role.toUpperCase(),
                status.toUpperCase(),
                search,
                pageRequest
        );

        List<UserSummaryResponse> items = userPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        // Get total stats (quick way)
        long totalUsers = userRepository.count();
        long lockedUsers = userRepository.findAll().stream().filter(u -> !u.getIsEnabled()).count();
        long adminUsers = userRepository.findAll().stream().filter(u -> u.getRole() == User.Role.ADMIN).count();

        return ResponseEntity.ok(Map.of(
                "items", items,
                "total", userPage.getTotalElements(),
                "totalPages", userPage.getTotalPages(),
                "currentPage", userPage.getNumber(),
                "stats", Map.of(
                        "total", totalUsers,
                        "locked", lockedUsers,
                        "admins", adminUsers
                )
        ));
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<?> toggleUserStatus(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng #" + id));

        // Không cho phép tự khóa chính mình (cần check Principal, nhưng tạm thời block admin khóa admin cho an toàn)
        // if (user.getRole() == User.Role.ADMIN) {
        //    return ResponseEntity.badRequest().body(Map.of("error", "Không thể khóa tài khoản quản trị viên"));
        // }

        user.setIsEnabled(!user.getIsEnabled());
        if (user.getIsEnabled()) {
            user.setFailedAttempts(0); // reset failed attempts khi mở khóa
        }
        User saved = userRepository.save(user);

        return ResponseEntity.ok(Map.of(
                "message", saved.getIsEnabled() ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản",
                "user", mapToResponse(saved)
        ));
    }

    private UserSummaryResponse mapToResponse(User user) {
        return UserSummaryResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole())
                .isEnabled(user.getIsEnabled())
                .failedAttempts(user.getFailedAttempts())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
