package vn.fss.auth.dto;

import lombok.Builder;
import lombok.Data;
import vn.fss.auth.entity.User;

import java.time.LocalDateTime;

@Data
@Builder
public class UserSummaryResponse {
    private Long id;
    private String fullName;
    private String email;
    private String phone;
    private String avatarUrl;
    private User.Role role;
    private Boolean isEnabled;
    private Boolean isDeleted;
    private String deletionReason;
    private String lockReason;
    private Integer failedAttempts;
    private LocalDateTime createdAt;
}
