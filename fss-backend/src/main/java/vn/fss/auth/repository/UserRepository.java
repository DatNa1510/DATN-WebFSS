package vn.fss.auth.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.fss.auth.entity.User;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Tìm kiếm user bằng email (cho đăng nhập)
    Optional<User> findByEmail(String email);

    // Kiểm tra xem email đã tồn tại chưa (cho đăng ký)
    boolean existsByEmail(String email);

    // Tìm kiếm user bằng verification token (khi user click link từ email)
    Optional<User> findByVerificationToken(String token);

    // Tìm kiếm user bằng reset password token
    Optional<User> findByResetPasswordToken(String token);

    // Đếm số lượng user theo role
    long countByRole(User.Role role);

    // Admin: Tìm kiếm user theo role, name/email với pagination
    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u WHERE " +
            "(:role = 'ALL' OR CAST(u.role AS string) = :role) AND " +
            "(:status = 'ALL' OR " +
            "(:status = 'ACTIVE' AND u.isEnabled = true AND (u.isDeleted = false OR u.isDeleted IS NULL)) OR " +
            "(:status = 'LOCKED' AND u.isEnabled = false AND (u.isDeleted = false OR u.isDeleted IS NULL)) OR " +
            "(:status = 'DELETED' AND u.isDeleted = true)) AND " +
            "(LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
            "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')))")
    org.springframework.data.domain.Page<User> findUsersByFilters(
            @org.springframework.data.repository.query.Param("role") String role,
            @org.springframework.data.repository.query.Param("status") String status,
            @org.springframework.data.repository.query.Param("search") String search,
            org.springframework.data.domain.Pageable pageable);
}
