package vn.fss.product.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import vn.fss.product.entity.Product;
import vn.fss.product.repository.ProductRepository;

import java.util.Optional;
import jakarta.annotation.PostConstruct;
import java.math.BigDecimal;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @PostConstruct
    public void fixProductPrices() {
        java.util.List<Product> products = productRepository.findAll();
        boolean changed = false;
        BigDecimal minPrice = new BigDecimal("5000");
        for (Product p : products) {
            if (p.getPrice() != null && p.getPrice().compareTo(minPrice) < 0) {
                p.setPrice(minPrice);
                changed = true;
            }
        }
        if (changed) {
            productRepository.saveAll(products);
        }
    }

    public Page<Product> getProducts(int page, int size, String category, String gender, String search, String sortBy, java.math.BigDecimal minPrice, java.math.BigDecimal maxPrice) {
        Sort sort = Sort.by(Sort.Direction.ASC, "id"); // Mặc định luôn sắp xếp theo ID để thứ tự ổn định
        if (sortBy != null && !sortBy.trim().isEmpty()) {
            switch (sortBy) {
                case "price-asc":    sort = Sort.by(Sort.Direction.ASC,  "price");     break;
                case "price-desc":   sort = Sort.by(Sort.Direction.DESC, "price");     break;
                case "newest":       sort = Sort.by(Sort.Direction.DESC, "createdAt"); break;
                case "best-seller":  sort = Sort.by(Sort.Direction.DESC, "sold");      break;
                case "rating":
                    sort = Sort.by(Sort.Direction.DESC, "rating")
                               .and(Sort.by(Sort.Direction.DESC, "reviewCount"));
                    break;
                default:             sort = Sort.by(Sort.Direction.DESC, "createdAt");
            }
        }
        Pageable pageable = PageRequest.of(page, size, sort);
        return productRepository.findProductsWithFilters(category, gender, search, minPrice, maxPrice, pageable);
    }

    public Optional<Product> getProductById(Long id) {
        return productRepository.findById(id);
    }
}
