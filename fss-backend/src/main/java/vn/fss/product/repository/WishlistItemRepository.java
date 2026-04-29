package vn.fss.product.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.fss.auth.entity.User;
import vn.fss.product.entity.Product;
import vn.fss.product.entity.WishlistItem;

import java.util.List;
import java.util.Optional;

@Repository
public interface WishlistItemRepository extends JpaRepository<WishlistItem, Long> {
    List<WishlistItem> findByUserOrderByAddedAtDesc(User user);
    Optional<WishlistItem> findByUserAndProduct(User user, Product product);
    boolean existsByUserAndProduct(User user, Product product);
}
