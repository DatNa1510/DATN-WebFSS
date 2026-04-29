package vn.fss.cart.service;

import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import vn.fss.auth.entity.User;
import vn.fss.auth.repository.UserRepository;
import vn.fss.cart.dto.CartAddRequest;
import vn.fss.cart.dto.CartItemResponse;
import vn.fss.cart.dto.CartUpdateRequest;
import vn.fss.cart.entity.CartItem;
import vn.fss.cart.repository.CartItemRepository;
import vn.fss.product.entity.Product;
import vn.fss.product.repository.ProductRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartService {

    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public List<CartItemResponse> getCartItems(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));

        List<CartItem> items = cartItemRepository.findByUserOrderByAddedAtDesc(user);
        
        return items.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public CartItemResponse addItemToCart(String email, CartAddRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("Sản phẩm không tồn tại"));

        if (request.getQuantity() <= 0) {
            throw new IllegalArgumentException("Số lượng phải lớn hơn 0");
        }

        // Check if the exact product with size already exists in the cart
        String size = request.getSize() != null ? request.getSize() : "";
        Optional<CartItem> existingItemOpt = cartItemRepository.findByUserIdAndProductIdAndSize(
                user.getId(), product.getId(), size);

        CartItem item;
        if (existingItemOpt.isPresent()) {
            item = existingItemOpt.get();
            int newQuantity = item.getQuantity() + request.getQuantity();
            
            // Check stock limit before updating
            if (newQuantity > product.getStock()) {
                throw new IllegalArgumentException("Số lượng trong thẻ vượt quá tồn kho hiện tại (" + product.getStock() + ")");
            }
            item.setQuantity(newQuantity);
        } else {
            // Check stock before creating new item
            if (request.getQuantity() > product.getStock()) {
                throw new IllegalArgumentException("Số lượng vượt quá tồn kho hiện tại (" + product.getStock() + ")");
            }
            
            item = CartItem.builder()
                    .user(user)
                    .product(product)
                    .quantity(request.getQuantity())
                    .size(size)
                    .build();
        }

        CartItem savedItem = cartItemRepository.save(item);
        return mapToResponse(savedItem);
    }

    @Transactional
    public CartItemResponse updateQuantity(String email, Long cartItemId, CartUpdateRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));

        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new IllegalArgumentException("Mục trong giỏ hàng không tồn tại"));

        if (!item.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Bạn không có quyền cập nhật mục này");
        }

        if (request.getQuantity() <= 0) {
            cartItemRepository.delete(item);
            return null; // Return null to indicate removal
        }

        Product product = item.getProduct();
        if (request.getQuantity() > product.getStock()) {
            throw new IllegalArgumentException("Số lượng vượt quá tồn kho hiện tại (" + product.getStock() + ")");
        }

        item.setQuantity(request.getQuantity());
        CartItem savedItem = cartItemRepository.save(item);
        
        return mapToResponse(savedItem);
    }

    @Transactional
    public void removeItem(String email, Long cartItemId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));

        CartItem item = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new IllegalArgumentException("Mục trong giỏ hàng không tồn tại"));

        if (!item.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Bạn không có quyền xóa mục này");
        }

        cartItemRepository.delete(item);
    }

    @Transactional
    public void clearCart(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));

        cartItemRepository.deleteByUserId(user.getId());
    }

    private CartItemResponse mapToResponse(CartItem item) {
        Product p = item.getProduct();
        BigDecimal price = p.getPrice();
        BigDecimal total = price.multiply(BigDecimal.valueOf(item.getQuantity()));
        
        return CartItemResponse.builder()
                .id(item.getId())
                .productId(p.getId())
                // Assuming getProductDisplayName handles name
                .name(p.getProductDisplayName())
                // Parse the first image from comma separated if multiple, else direct
                .image(p.getImagePath() != null ? p.getImagePath().split(",")[0] : null)
                .price(price)
                .originalPrice(p.getOriginalPrice())
                .size(item.getSize())
                .quantity(item.getQuantity())
                .totalPrice(total)
                .build();
    }
}
