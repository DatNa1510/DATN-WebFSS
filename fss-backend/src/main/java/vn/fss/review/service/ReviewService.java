package vn.fss.review.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.fss.auth.entity.User;
import vn.fss.order.entity.OrderStatus;
import vn.fss.order.repository.OrderRepository;
import vn.fss.product.entity.Product;
import vn.fss.product.repository.ProductRepository;
import vn.fss.review.dto.ReviewRequest;
import vn.fss.review.dto.ReviewResponse;
import vn.fss.review.entity.Review;
import vn.fss.review.repository.ReviewRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;

    // ── Lấy danh sách review theo productId (phân trang) ──────────
    @Transactional(readOnly = true)
    public Page<ReviewResponse> getReviews(Long productId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return reviewRepository
                .findByProductIdOrderByCreatedAtDesc(productId, pageable)
                .map(this::toResponse);
    }

    // ── Thống kê rating summary ────────────────────────────────────
    @Transactional(readOnly = true)
    public Map<String, Object> getSummary(Long productId) {
        Double avg = reviewRepository.calculateAverageRating(productId);
        Long total = reviewRepository.countByProductId(productId);
        List<Object[]> breakdown = reviewRepository.countByRatingForProduct(productId);

        Map<Integer, Long> starCounts = new HashMap<>();
        for (int i = 1; i <= 5; i++) starCounts.put(i, 0L);
        for (Object[] row : breakdown) {
            starCounts.put((Integer) row[0], (Long) row[1]);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("averageRating", avg != null ? Math.round(avg * 10.0) / 10.0 : 0.0);
        result.put("totalReviews", total);
        result.put("starCounts", starCounts);
        return result;
    }

    // ── Tạo review mới ─────────────────────────────────────────────
    @Transactional
    public ReviewResponse createReview(User user, ReviewRequest req) {
        // Kiểm tra sản phẩm tồn tại
        Product product = productRepository.findById(req.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("Sản phẩm không tồn tại"));

        // Kiểm tra đã review chưa
        if (reviewRepository.existsByUserIdAndProductId(user.getId(), req.getProductId())) {
            throw new IllegalStateException("Bạn đã đánh giá sản phẩm này rồi");
        }

        // Chỉ cho phép bình luận khi đơn hàng đã giao (DELIVERED)
        boolean verifiedPurchase = orderRepository.existsByUserAndProductIdAndStatusIn(
                user,
                req.getProductId(),
                List.of(OrderStatus.DELIVERED)
        );

        if (!verifiedPurchase) {
            throw new IllegalStateException("Bạn chỉ có thể đánh giá sản phẩm sau khi đơn hàng đã được giao thành công.");
        }

        // Lưu review
        Review review = Review.builder()
                .user(user)
                .product(product)
                .rating(req.getRating())
                .comment(req.getComment())
                .verifiedPurchase(verifiedPurchase)
                .build();
        reviewRepository.save(review);

        // Cập nhật rating & reviewCount của sản phẩm
        Double newAvg = reviewRepository.calculateAverageRating(req.getProductId());
        Long newCount = reviewRepository.countByProductId(req.getProductId());
        if (newAvg != null) {
            product.setRating(BigDecimal.valueOf(newAvg).setScale(1, RoundingMode.HALF_UP));
        }
        product.setReviewCount(newCount.intValue());
        productRepository.save(product);

        return toResponse(review);
    }

    @Transactional
    public void deleteReview(User user, Long reviewId) {
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Đánh giá không tồn tại"));

        // Chỉ cho phép chủ nhân xóa
        if (!review.getUser().getId().equals(user.getId())) {
            throw new IllegalStateException("Bạn không có quyền xóa đánh giá này");
        }

        Long productId = review.getProduct().getId();
        Product product = review.getProduct();
        
        reviewRepository.delete(review);

        // Cập nhật lại rating của sản phẩm
        Double newAvg = reviewRepository.calculateAverageRating(productId);
        Long newCount = reviewRepository.countByProductId(productId);
        
        if (newCount == 0) {
            product.setRating(new BigDecimal("0.0"));
            product.setReviewCount(0);
        } else {
            product.setRating(BigDecimal.valueOf(newAvg != null ? newAvg : 0.0).setScale(1, RoundingMode.HALF_UP));
            product.setReviewCount(newCount.intValue());
        }
        productRepository.save(product);
    }

    // ── Mapping ────────────────────────────────────────────────────
    private ReviewResponse toResponse(Review r) {
        return ReviewResponse.builder()
                .id(r.getId())
                .userId(r.getUser().getId())
                .userFullName(r.getUser().getFullName())
                .userAvatarUrl(r.getUser().getAvatarUrl())
                .rating(r.getRating())
                .comment(r.getComment())
                .verifiedPurchase(r.getVerifiedPurchase())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
