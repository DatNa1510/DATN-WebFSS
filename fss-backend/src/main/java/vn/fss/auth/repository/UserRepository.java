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
}
