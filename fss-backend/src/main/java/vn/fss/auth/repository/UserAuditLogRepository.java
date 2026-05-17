package vn.fss.auth.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.fss.auth.entity.User;
import vn.fss.auth.entity.UserAuditLog;

import java.util.List;

@Repository
public interface UserAuditLogRepository extends JpaRepository<UserAuditLog, Long> {
    List<UserAuditLog> findByUserOrderByCreatedAtDesc(User user);
    List<UserAuditLog> findByUserAndActionTypeOrderByCreatedAtDesc(User user, UserAuditLog.ActionType actionType);
}
