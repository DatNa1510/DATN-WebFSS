package vn.fss.adminlog.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.fss.adminlog.entity.AdminLog;

public interface AdminLogRepository extends JpaRepository<AdminLog, Long> {

    Page<AdminLog> findByTargetTypeOrderByCreatedAtDesc(String targetType, Pageable pageable);

    @Query("SELECT l FROM AdminLog l WHERE " +
           "(:targetType IS NULL OR l.targetType = :targetType) AND " +
           "(:action IS NULL OR l.action = :action) AND " +
           "(:adminEmail IS NULL OR l.adminEmail = :adminEmail) " +
           "ORDER BY l.createdAt DESC")
    Page<AdminLog> findWithFilters(
        @Param("targetType") String targetType,
        @Param("action") String action,
        @Param("adminEmail") String adminEmail,
        Pageable pageable
    );
}
