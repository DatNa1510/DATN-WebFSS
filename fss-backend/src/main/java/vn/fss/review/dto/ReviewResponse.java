package vn.fss.review.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;


@Data
@Builder
public class ReviewResponse {
    private Long id;
    private Long userId;
    private String userFullName;
    private String userAvatarUrl;
    private Integer rating;
    private String comment;
    private Boolean verifiedPurchase;
    private LocalDateTime createdAt;
}

