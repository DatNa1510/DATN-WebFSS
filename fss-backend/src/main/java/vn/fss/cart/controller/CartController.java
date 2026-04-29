package vn.fss.cart.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.fss.cart.dto.CartAddRequest;
import vn.fss.cart.dto.CartItemResponse;
import vn.fss.cart.dto.CartUpdateRequest;
import vn.fss.cart.service.CartService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public ResponseEntity<List<CartItemResponse>> getCart(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(cartService.getCartItems(email));
    }

    @PostMapping("/add")
    public ResponseEntity<?> addToCart(Authentication authentication, @RequestBody CartAddRequest request) {
        try {
            String email = authentication.getName();
            CartItemResponse response = cartService.addItemToCart(email, request);
            return ResponseEntity.ok(Map.of("message", "Thêm vào giỏ hàng thành công", "item", response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<?> updateQuantity(Authentication authentication, 
                                            @PathVariable Long id, 
                                            @RequestBody CartUpdateRequest request) {
        try {
            String email = authentication.getName();
            CartItemResponse response = cartService.updateQuantity(email, id, request);
            if (response == null) {
                return ResponseEntity.ok(Map.of("message", "Đã xóa mục khỏi giỏ hàng"));
            }
            return ResponseEntity.ok(Map.of("message", "Cập nhật số lượng thành công", "item", response));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/remove/{id}")
    public ResponseEntity<?> removeItem(Authentication authentication, @PathVariable Long id) {
        try {
            String email = authentication.getName();
            cartService.removeItem(email, id);
            return ResponseEntity.ok(Map.of("message", "Đã xóa mục khỏi giỏ hàng"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/clear")
    public ResponseEntity<?> clearCart(Authentication authentication) {
        try {
            String email = authentication.getName();
            cartService.clearCart(email);
            return ResponseEntity.ok(Map.of("message", "Đã làm sạch giỏ hàng"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
