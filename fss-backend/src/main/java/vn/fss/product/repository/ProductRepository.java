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

    // Tìm kiếm phân trang + lọc theo category + search tên
    @Query("SELECT p FROM Product p WHERE " +
           "(:category IS NULL OR :category = 'all' OR p.masterCategory = :category) " +
           "AND (:gender IS NULL OR :gender = 'all' OR p.gender = :gender) " +
           "AND (:search IS NULL OR :search = '' OR LOWER(p.productDisplayName) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Product> findProductsWithFilters(
            @Param("category") String category, 
            @Param("gender") String gender,
            @Param("search") String search, 
            Pageable pageable);
}
