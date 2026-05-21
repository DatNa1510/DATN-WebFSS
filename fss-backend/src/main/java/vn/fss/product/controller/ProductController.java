package vn.fss.product.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import vn.fss.adminlog.service.AdminLogService;
import vn.fss.product.entity.Product;
import vn.fss.product.service.ProductService;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final AdminLogService adminLogService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false, defaultValue = "all") String category,
            @RequestParam(required = false, defaultValue = "all") String gender,
            @RequestParam(required = false, defaultValue = "") String search,
            @RequestParam(required = false, defaultValue = "newest") String sort,
            @RequestParam(defaultValue = "0") java.math.BigDecimal minPrice,
            @RequestParam(defaultValue = "999999999") java.math.BigDecimal maxPrice) {

        Page<Product> productPage = productService.getProducts(page, limit, category, gender, search, sort, minPrice, maxPrice);

        Map<String, Object> response = new HashMap<>();
        response.put("items", productPage.getContent());
        response.put("total", productPage.getTotalElements());
        response.put("totalPages", productPage.getTotalPages());
        response.put("currentPage", productPage.getNumber());
        response.put("hasMore", !productPage.isLast());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProductById(@PathVariable Long id) {
        return productService.getProductById(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> createProduct(Authentication auth, @RequestBody Product product) {
        try {
            Product createdProduct = productService.createProduct(product);
            adminLogService.log(
                auth.getName(), auth.getName(), "CREATE", "PRODUCT",
                createdProduct.getId(), createdProduct.getProductDisplayName(),
                "Thêm sản phẩm mới: " + createdProduct.getProductDisplayName() + " | Giá: " + createdProduct.getPrice()
            );
            return ResponseEntity.ok(Map.of("message", "Thêm sản phẩm thành công", "product", createdProduct));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> updateProduct(Authentication auth, @PathVariable Long id, @RequestBody Product productDetails) {
        try {
            Product updatedProduct = productService.updateProduct(id, productDetails);
            adminLogService.log(
                auth.getName(), auth.getName(), "UPDATE", "PRODUCT",
                id, updatedProduct.getProductDisplayName(),
                "Cập nhật sản phẩm #" + id + ": " + updatedProduct.getProductDisplayName() + " | Giá: " + updatedProduct.getPrice() + " | Tồn kho: " + updatedProduct.getStock()
            );
            return ResponseEntity.ok(Map.of("message", "Cập nhật sản phẩm thành công", "product", updatedProduct));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> deleteProduct(Authentication auth, @PathVariable Long id) {
        try {
            // Lấy thông tin sản phẩm trước khi xóa để log
            String productName = productService.getProductById(id)
                    .map(Product::getProductDisplayName).orElse("ID#" + id);
            productService.deleteProduct(id);
            adminLogService.log(
                auth.getName(), auth.getName(), "DELETE", "PRODUCT",
                id, productName,
                "Xóa sản phẩm #" + id + ": " + productName
            );
            return ResponseEntity.ok(Map.of("message", "Xóa sản phẩm thành công"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
