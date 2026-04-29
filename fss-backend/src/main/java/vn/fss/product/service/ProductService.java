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

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    public Page<Product> getProducts(int page, int size, String category, String gender, String search, String sortBy) {
        Sort sort = Sort.unsorted();
        if (sortBy != null) {
            switch (sortBy) {
                case "price-asc":    sort = Sort.by(Sort.Direction.ASC,  "price");     break;
                case "price-desc":   sort = Sort.by(Sort.Direction.DESC, "price");     break;
                case "newest":       sort = Sort.by(Sort.Direction.DESC, "createdAt"); break;
                case "best-seller":  sort = Sort.by(Sort.Direction.DESC, "sold");      break;
                case "rating":       sort = Sort.by(Sort.Direction.DESC, "rating");    break;
                default:             sort = Sort.by(Sort.Direction.DESC, "createdAt");
            }
        }
        Pageable pageable = PageRequest.of(page, size, sort);
        return productRepository.findProductsWithFilters(category, gender, search, pageable);
    }

    public Optional<Product> getProductById(Long id) {
        return productRepository.findById(id);
    }
}
