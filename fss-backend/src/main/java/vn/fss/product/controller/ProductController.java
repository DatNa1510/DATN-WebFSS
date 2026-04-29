package vn.fss.product.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import vn.fss.product.entity.Product;
import vn.fss.product.service.ProductService;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    @Autowired
    private ProductService productService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(required = false, defaultValue = "all") String category,
            @RequestParam(required = false, defaultValue = "all") String gender,
            @RequestParam(required = false, defaultValue = "") String search,
            @RequestParam(required = false, defaultValue = "newest") String sort) {

        Page<Product> productPage = productService.getProducts(page, limit, category, gender, search, sort);

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
}
