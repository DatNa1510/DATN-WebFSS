package vn.fss.cart.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.fss.auth.entity.User;
import vn.fss.cart.entity.CartItem;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    
    List<CartItem> findByUserOrderByAddedAtDesc(User user);
    
    Optional<CartItem> findByUserIdAndProductIdAndSize(Long userId, Long productId, String size);
    
    void deleteByUserId(Long userId);
}
