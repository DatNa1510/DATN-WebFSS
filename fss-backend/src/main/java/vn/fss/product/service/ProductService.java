package vn.fss.product.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;

import vn.fss.product.entity.Product;
import vn.fss.product.repository.ProductRepository;
import vn.fss.order.repository.OrderRepository;
import vn.fss.order.repository.OrderItemRepository;
import vn.fss.cart.repository.CartItemRepository;
import vn.fss.review.repository.ReviewRepository;

import java.util.Optional;
import jakarta.annotation.PostConstruct;
import java.math.BigDecimal;

@Service
public class ProductService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private AiSyncService aiSyncService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private ReviewRepository reviewRepository;

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

    public Product createProduct(Product product) {
        Long maxId = productRepository.findMaxId();
        Long newId = (maxId != null) ? maxId + 1 : 1L;
        product.setId(newId);
        
        // Ensure defaults are set for non-null fields
        if (product.getStock() == null) product.setStock(50);
        if (product.getInitialStock() == null) product.setInitialStock(product.getStock());
        if (product.getSold() == null) product.setSold(0);
        if (product.getRating() == null) product.setRating(new BigDecimal("0.0"));
        if (product.getReviewCount() == null) product.setReviewCount(0);
        if (product.getIsNew() == null) product.setIsNew(true);
        if (product.getIsBestSeller() == null) product.setIsBestSeller(false);
        if (product.getImagePath() == null || product.getImagePath().isEmpty()) {
            product.setImagePath(newId + ".jpg"); // Default image path
        }

        Product savedProduct = productRepository.save(product);
        
        // Đồng bộ với AI service
        aiSyncService.syncProductAsync(savedProduct);

        return savedProduct;
    }

    public Product updateProduct(Long id, Product productDetails) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sản phẩm có ID: " + id));

        // Update fields (only the ones that are provided/mutable by admin)
        if (productDetails.getProductDisplayName() != null) {
            product.setProductDisplayName(productDetails.getProductDisplayName());
        }
        if (productDetails.getMasterCategory() != null) {
            product.setMasterCategory(productDetails.getMasterCategory());
        }
        if (productDetails.getPrice() != null) {
            product.setPrice(productDetails.getPrice());
        }
        if (productDetails.getOriginalPrice() != null) {
            product.setOriginalPrice(productDetails.getOriginalPrice());
        }
        if (productDetails.getStock() != null) {
            product.setStock(productDetails.getStock());
        }
        if (productDetails.getSubCategory() != null) {
            product.setSubCategory(productDetails.getSubCategory());
        }
        
        // Can add more fields if needed

        Product updatedProduct = productRepository.save(product);
        
        // Đồng bộ lại với AI service
        aiSyncService.syncProductAsync(updatedProduct);

        return updatedProduct;
    }

    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sản phẩm có ID: " + id));

        // Kiểm tra: có đơn hàng nào đang PENDING / CONFIRMED / SHIPPING chứa sản phẩm này không?
        long activeOrders = orderRepository.countActiveOrdersByProductId(id);
        if (activeOrders > 0) {
            throw new IllegalStateException(
                    String.format("Không thể xóa sản phẩm '%s' vì còn %d đơn hàng đang xử lý (Chờ xác nhận / Đã xác nhận / Đang giao).",
                            product.getProductDisplayName(), activeOrders));
        }

        // Xóa tất cả review của sản phẩm
        reviewRepository.deleteByProductId(id);

        // Xóa sản phẩm khỏi giỏ hàng của mọi người dùng
        cartItemRepository.deleteByProductId(id);

        // Gỡ liên kết product_id trong order_items (set NULL) — giữ nguyên lịch sử đơn hàng
        orderItemRepository.nullifyProductReference(id);

        // Xóa sản phẩm
        productRepository.delete(product);

        // Xóa vector tương ứng trên AI service
        aiSyncService.deleteProductAsync(id);
    }

    public Long getTotalStock() {
        return productRepository.sumStock();
    }
}

