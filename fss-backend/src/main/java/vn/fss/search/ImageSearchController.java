package vn.fss.search;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.fss.search.dto.ProductSearchResult;

import java.io.IOException;
import java.util.List;
import java.util.Map;

/**
 * REST Controller cho tính năng tìm kiếm bằng hình ảnh.
 *
 * Endpoint: POST /api/search/by-image
 * - Không yêu cầu authentication (public)
 * - Nhận ảnh multipart/form-data từ Frontend
 * - Trả về danh sách sản phẩm tương đồng
 */
@Slf4j
@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
public class ImageSearchController {

    private final ImageSearchService imageSearchService;

    /**
     * Tìm kiếm sản phẩm tương đồng bằng hình ảnh.
     *
     * @param file     Ảnh cần tìm kiếm (multipart)
     * @param topK     Số kết quả trả về (mặc định 10, tối đa 50)
     * @param gender   Lọc giới tính: Men / Women / Unisex (optional)
     * @param category Lọc danh mục: Apparel / Footwear / Accessories (optional)
     *
     * Response:
     * {
     *   "success": true,
     *   "total": 10,
     *   "results": [ { ...product fields..., "similarityScore": 0.92, "similarityPercent": 92 } ]
     * }
     */
    @PostMapping(value = "/by-image", consumes = "multipart/form-data")
    public ResponseEntity<?> searchByImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "10") int topK,
            @RequestParam(required = false) String gender,
            @RequestParam(required = false) String category
    ) {
        // ── Validate input ────────────────────────────────────────────────────
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "Vui lòng chọn ảnh để tìm kiếm."));
        }

        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false,
                            "message", "File không hợp lệ. Chỉ chấp nhận ảnh (JPG, PNG, WEBP)."));
        }

        // Giới hạn 20MB
        if (file.getSize() > 20 * 1024 * 1024) {
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false,
                            "message", "Ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 20MB."));
        }

        // Giới hạn topK
        topK = Math.max(1, Math.min(topK, 50));

        log.info("POST /api/search/by-image | file={} ({}KB) | topK={} | gender={} | category={}",
                file.getOriginalFilename(), file.getSize() / 1024, topK, gender, category);

        // ── Xử lý tìm kiếm ───────────────────────────────────────────────────
        try {
            List<ProductSearchResult> results = imageSearchService.searchByImage(
                    file, topK, gender, category
            );

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "total",   results.size(),
                    "results", results
            ));

        } catch (IOException e) {
            log.error("Lỗi đọc file ảnh: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "message", "Không thể đọc file ảnh."));

        } catch (RuntimeException e) {
            log.error("Lỗi khi gọi AI Service: {}", e.getMessage());
            return ResponseEntity.status(503)
                    .body(Map.of("success", false,
                            "message", "AI Service hiện không khả dụng. Vui lòng thử lại sau."));
        }
    }

    /**
     * Tìm sản phẩm tương đồng từ một sản phẩm đã có trong kho.
     * Người dùng không cần upload ảnh — chỉ cần truyền product ID.
     *
     * GET /api/search/similar/{productId}?topK=10&gender=&category=
     */
    @GetMapping("/similar/{productId}")
    public ResponseEntity<?> searchSimilarById(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "10") int topK,
            @RequestParam(required = false) String gender,
            @RequestParam(required = false) String category
    ) {
        topK = Math.max(1, Math.min(topK, 50));
        log.info("GET /api/search/similar/{} | topK={} | gender={} | category={}",
                productId, topK, gender, category);

        try {
            List<ProductSearchResult> results = imageSearchService.searchSimilarById(
                    productId, topK, gender, category
            );
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "total",   results.size(),
                    "results", results
            ));
        } catch (RuntimeException e) {
            log.error("Lỗi khi tìm sản phẩm tương đồng: {}", e.getMessage());
            return ResponseEntity.status(503)
                    .body(Map.of("success", false,
                            "message", "AI Service hiện không khả dụng. Vui lòng thử lại sau."));
        }
    }
}
