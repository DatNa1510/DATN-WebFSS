package vn.fss.product.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import vn.fss.product.entity.Product;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    @Query("SELECT p FROM Product p WHERE " +
           "(:category IS NULL OR :category = 'all' OR p.masterCategory = :category) " +
           "AND (:gender IS NULL OR :gender = 'all' OR p.gender = :gender) " +
           "AND (:search IS NULL OR :search = '' OR LOWER(p.productDisplayName) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (p.price >= :minPrice AND p.price <= :maxPrice)")
    Page<Product> findProductsWithFilters(
            @Param("category") String category, 
            @Param("gender") String gender,
            @Param("search") String search, 
            @Param("minPrice") java.math.BigDecimal minPrice,
            @Param("maxPrice") java.math.BigDecimal maxPrice,
            Pageable pageable);

    @Query("SELECT p FROM Product p ORDER BY p.sold DESC")
    Page<Product> findTopProductsBySold(Pageable pageable);

    @Query("SELECT MAX(p.id) FROM Product p")
    Long findMaxId();
}
