package vn.fss.product.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.fss.product.dto.WishlistItemDto;
import vn.fss.product.service.WishlistService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping
    public ResponseEntity<List<WishlistItemDto>> getUserWishlist(Authentication auth) {
        return ResponseEntity.ok(wishlistService.getUserWishlist(auth.getName()));
    }

    @PostMapping("/{productId}")
    public ResponseEntity<?> toggleWishlist(Authentication auth, @PathVariable Long productId) {
        wishlistService.toggleWishlist(auth.getName(), productId);
        return ResponseEntity.ok(Map.of("message", "Toggled successfully"));
    }

    @GetMapping("/{productId}/check")
    public ResponseEntity<?> checkWishlist(Authentication auth, @PathVariable Long productId) {
        boolean exists = wishlistService.checkWishlist(auth.getName(), productId);
        return ResponseEntity.ok(Map.of("inWishlist", exists));
    }
}
