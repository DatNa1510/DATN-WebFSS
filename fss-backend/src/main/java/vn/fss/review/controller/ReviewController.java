package vn.fss.review.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import vn.fss.auth.entity.User;
import vn.fss.review.dto.ReviewRequest;
import vn.fss.review.dto.ReviewResponse;
import vn.fss.review.service.ReviewService;

import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    /**
     * GET /api/reviews/product/{productId}?page=0&size=10
     * Public — không cần JWT
     */
    @GetMapping("/product/{productId}")
    public ResponseEntity<Page<ReviewResponse>> getReviews(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(reviewService.getReviews(productId, page, size));
    }

    /**
     * GET /api/reviews/product/{productId}/summary
     * Trả về avgRating, totalReviews, starCounts
     */
    @GetMapping("/product/{productId}/summary")
    public ResponseEntity<Map<String, Object>> getSummary(@PathVariable Long productId) {
        return ResponseEntity.ok(reviewService.getSummary(productId));
    }

    /**
     * POST /api/reviews
     * Yêu cầu JWT — chỉ user đã đăng nhập mới được đánh giá
     */
    @PostMapping
    public ResponseEntity<?> createReview(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ReviewRequest request) {
        try {
            ReviewResponse response = reviewService.createReview(user, request);
            return ResponseEntity.ok(Map.of("success", true, "review", response));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    /**
     * DELETE /api/reviews/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteReview(
            @AuthenticationPrincipal User user,
            @PathVariable Long id) {
        try {
            reviewService.deleteReview(user, id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Đã xóa bình luận"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
