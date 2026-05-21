package vn.fss.notification.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.fss.auth.entity.User;
import vn.fss.notification.model.Notification;
import vn.fss.notification.repository.NotificationRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;

    public List<Notification> getNotificationsForUser(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> n.setRead(true));
    }

    @Transactional
    public void markAsUnread(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> n.setRead(false));
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> unread = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        unread.forEach(n -> n.setRead(true));
    }

    @Transactional
    public void deleteNotification(Long notificationId) {
        notificationRepository.deleteById(notificationId);
    }

    @Transactional
    public void deleteAllNotifications(Long userId) {
        notificationRepository.deleteByUserId(userId);
    }

    public Page<Notification> getNotificationsWithFilters(Long userId, String search, String type, String read, Pageable pageable) {
        Specification<Notification> spec = Specification.where(null);
        
        // Filter by user
        spec = spec.and((root, query, cb) -> cb.equal(root.get("user").get("id"), userId));
        
        // Filter by type
        if (type != null && !type.isEmpty()) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("type"), Notification.NotificationType.valueOf(type)));
        }
        
        // Filter by read status
        if (read != null && !read.isEmpty()) {
            Boolean readStatus = Boolean.parseBoolean(read);
            spec = spec.and((root, query, cb) -> cb.equal(root.get("read"), readStatus));
        }
        
        // Filter by search (title or message)
        if (search != null && !search.isEmpty()) {
            String searchPattern = "%" + search.toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("title")), searchPattern),
                cb.like(cb.lower(root.get("message")), searchPattern)
            ));
        }
        
        return notificationRepository.findAll(spec, pageable);
    }

    @Transactional
    public void createNotification(User user, String title, String message, Notification.NotificationType type) {
        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type)
                .build();
        notificationRepository.save(notification);
    }
}
