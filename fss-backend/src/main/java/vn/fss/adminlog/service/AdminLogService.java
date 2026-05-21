package vn.fss.adminlog.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import vn.fss.adminlog.entity.AdminLog;
import vn.fss.adminlog.repository.AdminLogRepository;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminLogService {

    private final AdminLogRepository adminLogRepository;

    /**
     * Ghi lại một hành động của admin vào log
     */
    public void log(String adminEmail, String adminName, String action,
                    String targetType, Long targetId, String targetName, String detail) {
        AdminLog log = AdminLog.builder()
                .adminEmail(adminEmail)
                .adminName(adminName)
                .action(action)
                .targetType(targetType)
                .targetId(targetId)
                .targetName(targetName)
                .detail(detail)
                .build();
        adminLogRepository.save(log);
    }

    /**
     * Lấy danh sách log có phân trang và bộ lọc
     */
    public Map<String, Object> getLogs(String targetType, String action, String adminEmail, int page, int size) {
        String tType = (targetType == null || targetType.equals("all")) ? null : targetType;
        String tAction = (action == null || action.equals("all")) ? null : action;
        String tAdmin = (adminEmail == null || adminEmail.isBlank()) ? null : adminEmail;

        Page<AdminLog> result = adminLogRepository.findWithFilters(tType, tAction, tAdmin, PageRequest.of(page, size));

        Map<String, Object> response = new HashMap<>();
        response.put("items", result.getContent());
        response.put("total", result.getTotalElements());
        response.put("totalPages", result.getTotalPages());
        response.put("currentPage", result.getNumber());
        return response;
    }
}
