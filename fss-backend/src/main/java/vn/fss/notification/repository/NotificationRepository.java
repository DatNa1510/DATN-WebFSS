package vn.fss.notification.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.fss.notification.model.Notification;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);
    long countByUserIdAndReadFalse(Long userId);
}
