package vn.fss.search;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import vn.fss.product.entity.Product;
import vn.fss.product.repository.ProductRepository;
import vn.fss.search.dto.AiSearchResponse;
import vn.fss.search.dto.ProductSearchResult;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service điều phối luồng tìm kiếm bằng ảnh.
 *
 * Flow:
 *  1. Gọi AiServiceClient → nhận [{product_id, similarity_score}]
 *  2. Truy vấn PostgreSQL theo các product_id → lấy đầy đủ thông tin
 *  3. Map vào ProductSearchResult (thêm similarityScore)
 *  4. Sắp xếp theo similarity giảm dần
 */
@Slf4j
@Service
@RequiredArgsConstructor
@SuppressWarnings("null")
public class ImageSearchService {

    private final AiServiceClient aiServiceClient;
    private final ProductRepository productRepository;

    /**
     * Tìm sản phẩm tương đồng từ ảnh upload.
     *
     * @param file     Ảnh người dùng upload
     * @param topK     Số sản phẩm muốn tìm (mặc định 10)
     * @param gender   Lọc giới tính (có thể null)
     * @param category Lọc danh mục (có thể null)
     * @return Danh sách sản phẩm sắp xếp theo độ tương đồng giảm dần
     */
    public List<ProductSearchResult> searchByImage(
            MultipartFile file,
            int topK,
            String gender,
            String category
    ) throws IOException {

        // ── Bước 1: Gọi AI Service ────────────────────────────────────────────
        AiSearchResponse aiResponse = aiServiceClient.searchByImage(file, topK, gender, category);

        if (aiResponse.getResults() == null || aiResponse.getResults().isEmpty()) {
            log.info("AI Service không tìm thấy kết quả phù hợp.");
            return Collections.emptyList();
        }

        // ── Bước 2: Trích xuất product_ids và map similarity ─────────────────
        // Map: product_id → similarity_score (để ghép sau khi query DB)
        Map<Long, Double> similarityMap = new LinkedHashMap<>();
        for (AiSearchResponse.AiResultItem item : aiResponse.getResults()) {
            if (item.getProductId() != null) {
                similarityMap.put(item.getProductId(), item.getSimilarityScore());
            }
        }

        List<Long> productIds = new ArrayList<>(similarityMap.keySet());
        log.info("Truy vấn PostgreSQL: {} product IDs", productIds.size());

        // ── Bước 3: Lấy thông tin sản phẩm từ PostgreSQL ─────────────────────
        List<Product> products = productRepository.findAllById(productIds);

        if (products.isEmpty()) {
            log.warn("Không tìm thấy sản phẩm nào trong DB với IDs: {}", productIds);
            return Collections.emptyList();
        }

        // Map: product_id → Product entity (để lookup nhanh)
        Map<Long, Product> productMap = products.stream()
                .collect(Collectors.toMap(Product::getId, p -> p));

        // ── Bước 4: Ghép + sắp xếp ───────────────────────────────────────────
        List<ProductSearchResult> results = productIds.stream()
                .filter(productMap::containsKey)            // chỉ giữ ID có trong DB
                .map(id -> {
                    Product p = productMap.get(id);
                    Double score = similarityMap.getOrDefault(id, 0.0);
                    return mapToResult(p, score);
                })
                .sorted(Comparator.comparingDouble(ProductSearchResult::getSimilarityScore).reversed())
                .collect(Collectors.toList());

        log.info("Trả về {} sản phẩm (sau khi khớp với DB)", results.size());
        return results;
    }

    /**
     * Tìm sản phẩm tương đồng từ một sản phẩm đã có trong kho (theo product_id).
     * Vector được lấy trực tiếp từ ChromaDB, không cần chạy ResNet50.
     */
    public List<ProductSearchResult> searchSimilarById(
            Long productId,
            int topK,
            String gender,
            String category
    ) {
        // Gọi FastAPI GET /api/v1/similar/{productId}
        AiSearchResponse aiResponse = aiServiceClient.searchSimilarById(productId, topK, gender, category);

        if (aiResponse == null || aiResponse.getResults() == null || aiResponse.getResults().isEmpty()) {
            log.info("Không tìm thấy sản phẩm tương đồng với productId={}.", productId);
            return Collections.emptyList();
        }

        Map<Long, Double> similarityMap = new LinkedHashMap<>();
        for (AiSearchResponse.AiResultItem item : aiResponse.getResults()) {
            if (item.getProductId() != null) {
                similarityMap.put(item.getProductId(), item.getSimilarityScore());
            }
        }

        List<Long> productIds = new ArrayList<>(similarityMap.keySet());
        List<Product> products = productRepository.findAllById(productIds);
        Map<Long, Product> productMap = products.stream()
                .collect(Collectors.toMap(Product::getId, p -> p));

        return productIds.stream()
                .filter(productMap::containsKey)
                .map(id -> mapToResult(productMap.get(id), similarityMap.getOrDefault(id, 0.0)))
                .sorted(Comparator.comparingDouble(ProductSearchResult::getSimilarityScore).reversed())
                .collect(Collectors.toList());
    }

    /**
     * Map Product entity + similarity score → ProductSearchResult DTO.
     */
    private ProductSearchResult mapToResult(Product p, Double similarityScore) {
        ProductSearchResult result = new ProductSearchResult();
        result.setId(p.getId());
        result.setGender(p.getGender());
        result.setMasterCategory(p.getMasterCategory());
        result.setSubCategory(p.getSubCategory());
        result.setArticleType(p.getArticleType());
        result.setBaseColour(p.getBaseColour());
        result.setSeason(p.getSeason());
        result.setYear(p.getYear());
        result.setUsage(p.getUsage());
        result.setProductDisplayName(p.getProductDisplayName());
        result.setImagePath(p.getImagePath());
        result.setPrice(p.getPrice());
        result.setOriginalPrice(p.getOriginalPrice());
        result.setStock(p.getStock());
        result.setSold(p.getSold());
        result.setRating(p.getRating());
        result.setReviewCount(p.getReviewCount());
        result.setIsNew(p.getIsNew());
        result.setIsBestSeller(p.getIsBestSeller());
        result.setCreatedAt(p.getCreatedAt());
        result.setSimilarityScore(similarityScore);
        return result;
    }
}
