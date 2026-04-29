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

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WishlistService {

    private final WishlistItemRepository wishlistRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public List<WishlistItemDto> getUserWishlist(String email) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        return wishlistRepository.findByUserOrderByAddedAtDesc(user)
                .stream().map(WishlistItemDto::fromEntity).collect(Collectors.toList());
    }

    @Transactional
    public void toggleWishlist(String email, Long productId) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        Product product = productRepository.findById(productId).orElseThrow(() -> new RuntimeException("Product not found"));
        
        wishlistRepository.findByUserAndProduct(user, product).ifPresentOrElse(
            wishlistRepository::delete,
            () -> wishlistRepository.save(WishlistItem.builder().user(user).product(product).build())
        );
    }

    public boolean checkWishlist(String email, Long productId) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        Product product = productRepository.findById(productId).orElseThrow(() -> new RuntimeException("Product not found"));
        return wishlistRepository.existsByUserAndProduct(user, product);
    }
}
