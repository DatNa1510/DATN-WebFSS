package vn.fss.product.service;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import vn.fss.auth.entity.User;
import vn.fss.auth.repository.UserRepository;
import vn.fss.product.dto.WishlistItemDto;
import vn.fss.product.entity.Product;
import vn.fss.product.entity.WishlistItem;
import vn.fss.product.repository.ProductRepository;
import vn.fss.product.repository.WishlistItemRepository;
import vn.fss.notification.service.NotificationService;
import vn.fss.notification.model.Notification;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WishlistService {

    private final WishlistItemRepository wishlistRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public List<WishlistItemDto> getUserWishlist(String email) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        return wishlistRepository.findByUserOrderByAddedAtDesc(user)
                .stream().map(WishlistItemDto::fromEntity).collect(Collectors.toList());
    }

    @Transactional
    public void toggleWishlist(String email, Long productId) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        Product product = productRepository.findById(productId).orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));
        
        wishlistRepository.findByUserAndProduct(user, product).ifPresentOrElse(
            wishlistRepository::delete,
            () -> {
                wishlistRepository.save(WishlistItem.builder().user(user).product(product).build());
                notificationService.createNotification(
                    user, 
                    "Danh sách yêu thích", 
                    "Đã thêm sản phẩm '" + (product.getProductDisplayName() != null ? product.getProductDisplayName() : "Sản phẩm") + "' vào danh sách yêu thích của bạn.",
                    Notification.NotificationType.INFO
                );
            }
        );
    }

    public boolean checkWishlist(String email, Long productId) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        Product product = productRepository.findById(productId).orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm"));
        return wishlistRepository.existsByUserAndProduct(user, product);
    }
}
