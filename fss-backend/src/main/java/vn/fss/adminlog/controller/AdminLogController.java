package vn.fss.adminlog.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.fss.adminlog.service.AdminLogService;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/logs")
@RequiredArgsConstructor
public class AdminLogController {

    private final AdminLogService adminLogService;

    /**
     * GET /api/admin/logs?targetType=PRODUCT&action=CREATE&page=0&size=20
     */
    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<Map<String, Object>> getLogs(
            @RequestParam(required = false, defaultValue = "all") String targetType,
            @RequestParam(required = false, defaultValue = "all") String action,
            @RequestParam(required = false, defaultValue = "") String adminEmail,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(adminLogService.getLogs(targetType, action, adminEmail, page, size));
    }
}
