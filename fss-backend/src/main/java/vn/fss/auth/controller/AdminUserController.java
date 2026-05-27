package vn.fss.auth.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.fss.adminlog.service.AdminLogService;
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
    private final AdminLogService adminLogService;

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
        List<User> allUsers = userRepository.findAll();
        long totalUsers = allUsers.size();
        long lockedUsers = allUsers.stream().filter(u -> !u.getIsEnabled()).count();
        long adminUsers = allUsers.stream().filter(u -> u.getRole() == User.Role.ADMIN).count();
        long deletedUsers = allUsers.stream().filter(u -> Boolean.TRUE.equals(u.getIsDeleted())).count();

        return ResponseEntity.ok(Map.of(
                "items", items,
                "total", userPage.getTotalElements(),
                "totalPages", userPage.getTotalPages(),
                "currentPage", userPage.getNumber(),
                "stats", Map.of(
                        "total", totalUsers,
                        "locked", lockedUsers,
                        "admins", adminUsers,
                        "deleted", deletedUsers
                )
        ));
    }

    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<?> toggleUserStatus(Authentication auth, @PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng #" + id));

        // Nếu tài khoản đã bị xóa thì không cho phép toggle
        if (Boolean.TRUE.equals(user.getIsDeleted())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tài khoản này đã bị xóa"));
        }

        user.setIsEnabled(!user.getIsEnabled());
        if (user.getIsEnabled()) {
            user.setFailedAttempts(0); // reset failed attempts khi mở khóa
            user.setLockReason(null);
        } else {
            if (body != null && body.containsKey("reason")) {
                user.setLockReason(body.get("reason"));
            }
        }
        User saved = userRepository.save(user);

        adminLogService.log(
            auth.getName(), auth.getName(), saved.getIsEnabled() ? "UNLOCK" : "LOCK", "ACCOUNT",
            id, saved.getEmail(),
            (saved.getIsEnabled() ? "Mở khóa" : "Khóa") + " tài khoản " + saved.getEmail() +
            (saved.getIsEnabled() ? "" : " | Lý do: " + saved.getLockReason())
        );

        return ResponseEntity.ok(Map.of(
                "message", saved.getIsEnabled() ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản",
                "user", mapToResponse(saved)
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(Authentication auth, @PathVariable Long id, @RequestBody Map<String, String> body) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng #" + id));

        user.setIsDeleted(true);
        user.setDeletionReason(body.getOrDefault("reason", ""));
        User saved = userRepository.save(user);

        adminLogService.log(
            auth.getName(), auth.getName(), "DELETE", "ACCOUNT",
            id, saved.getEmail(),
            "Xóa tài khoản " + saved.getEmail() + " | Lý do: " + saved.getDeletionReason()
        );

        return ResponseEntity.ok(Map.of(
                "message", "Đã xóa tài khoản",
                "user", mapToResponse(saved)
        ));
    }

    @PatchMapping("/{id}/restore")
    public ResponseEntity<?> restoreUser(Authentication auth, @PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng #" + id));

        if (!Boolean.TRUE.equals(user.getIsDeleted())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tài khoản này chưa bị xóa"));
        }

        int currentCount = user.getRestoreCount() != null ? user.getRestoreCount() : 0;
        if (currentCount >= 2) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tài khoản này đã hết lượt khôi phục (tối đa 2 lần)"));
        }

        user.setIsDeleted(false);
        user.setDeletionReason(null);
        user.setIsEnabled(true);
        user.setRestoreCount(currentCount + 1);
        User saved = userRepository.save(user);

        adminLogService.log(
            auth.getName(), auth.getName(), "UPDATE", "ACCOUNT",
            id, saved.getEmail(),
            "Khôi phục tài khoản " + saved.getEmail() + " (Lần " + saved.getRestoreCount() + "/2)"
        );

        return ResponseEntity.ok(Map.of(
                "message", "Đã khôi phục tài khoản thành công (Lần " + saved.getRestoreCount() + "/2)",
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
                .isDeleted(user.getIsDeleted())
                .deletionReason(user.getDeletionReason())
                .lockReason(user.getLockReason())
                .failedAttempts(user.getFailedAttempts())
                .restoreCount(user.getRestoreCount())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
