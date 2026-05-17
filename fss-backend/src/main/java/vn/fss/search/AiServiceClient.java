package vn.fss.search;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import vn.fss.search.dto.AiSearchResponse;

import java.io.IOException;
import java.time.Duration;

/**
 * Client gọi đến FastAPI AI Service.
 * Sử dụng WebClient (reactive, non-blocking).
 */
@Slf4j
@Component
public class AiServiceClient {

    private final WebClient webClient;

    public AiServiceClient(
            WebClient.Builder webClientBuilder,
            @Value("${ai.service.url:http://localhost:8000}") String aiServiceUrl
    ) {
        this.webClient = webClientBuilder
                .baseUrl(aiServiceUrl)
                .codecs(configurer -> configurer
                        .defaultCodecs()
                        .maxInMemorySize(25 * 1024 * 1024)) // 25MB buffer
                .build();
        log.info("AiServiceClient khởi tạo: baseUrl={}", aiServiceUrl);
    }

    /**
     * Gọi POST /api/v1/search-by-image trên FastAPI.
     *
     * @param file     Ảnh người dùng upload (MultipartFile)
     * @param topK     Số kết quả muốn lấy
     * @param gender   Filter giới tính (null = không lọc)
     * @param category Filter danh mục (null = không lọc)
     * @return AiSearchResponse chứa danh sách product_id + similarity_score
     * @throws IOException          Nếu không đọc được file
     * @throws RuntimeException     Nếu AI Service không phản hồi / lỗi
     */
    public AiSearchResponse searchByImage(
            MultipartFile file,
            int topK,
            String gender,
            String category
    ) throws IOException {

        // Đọc bytes từ MultipartFile
        byte[] fileBytes = file.getBytes();
        String filename  = file.getOriginalFilename() != null
                ? file.getOriginalFilename()
                : "image.jpg";

        // Xây dựng multipart body
        MultipartBodyBuilder bodyBuilder = new MultipartBodyBuilder();
        bodyBuilder.part("file",
                new ByteArrayResource(fileBytes) {
                    @Override
                    public String getFilename() { return filename; }
                },
                MediaType.parseMediaType(
                        file.getContentType() != null ? file.getContentType() : "image/jpeg"
                )
        );

        // Xây dựng URI với query params
        String uri = buildSearchUri(topK, gender, category);

        log.info("→ Gọi AI Service: POST {} | file={} ({}KB)",
                uri, filename, fileBytes.length / 1024);

        try {
            AiSearchResponse response = webClient.post()
                    .uri(uri)
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData(bodyBuilder.build()))
                    .retrieve()
                    .bodyToMono(AiSearchResponse.class)
                    .timeout(Duration.ofSeconds(30))
                    .block();

            if (response == null) {
                throw new RuntimeException("AI Service trả về null response");
            }
            log.info("← AI Service: {} kết quả", response.getTotalFound());
            return response;

        } catch (WebClientResponseException e) {
            log.error("AI Service trả lỗi HTTP {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("AI Service lỗi: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Không thể kết nối AI Service: {}", e.getMessage());
            throw new RuntimeException("Không thể kết nối AI Service. Kiểm tra service đã chạy chưa.", e);
        }
    }

    private String buildSearchUri(int topK, String gender, String category) {
        StringBuilder sb = new StringBuilder("/api/v1/search-by-image?top_k=").append(topK);
        if (gender != null && !gender.isBlank() && !gender.equalsIgnoreCase("all")) {
            sb.append("&gender=").append(gender);
        }
        if (category != null && !category.isBlank() && !category.equalsIgnoreCase("all")) {
            sb.append("&category=").append(category);
        }
        return sb.toString();
    }

    /**
     * Gọi GET /api/v1/similar/{productId} trên FastAPI.
     * Không cần upload ảnh — AI Service tự lấy vector từ ChromaDB.
     */
    public AiSearchResponse searchSimilarById(
            Long productId,
            int topK,
            String gender,
            String category
    ) {
        StringBuilder sb = new StringBuilder("/api/v1/similar/").append(productId)
                .append("?top_k=").append(topK);
        if (gender != null && !gender.isBlank() && !gender.equalsIgnoreCase("all")) {
            sb.append("&gender=").append(gender);
        }
        if (category != null && !category.isBlank() && !category.equalsIgnoreCase("all")) {
            sb.append("&category=").append(category);
        }
        String uri = sb.toString();
        log.info("→ Gọi AI Service: GET {}", uri);

        try {
            AiSearchResponse response = webClient.get()
                    .uri(uri)
                    .retrieve()
                    .bodyToMono(AiSearchResponse.class)
                    .timeout(Duration.ofSeconds(15))
                    .block();
            if (response == null) throw new RuntimeException("AI Service trả về null");
            log.info("← AI Service: {} kết quả tương đồng", response.getTotalFound());
            return response;
        } catch (WebClientResponseException e) {
            log.error("AI Service lỗi HTTP {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("AI Service lỗi: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Không thể kết nối AI Service: {}", e.getMessage());
            throw new RuntimeException("Không thể kết nối AI Service.", e);
        }
    }
}
