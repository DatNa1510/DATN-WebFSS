package vn.fss.product.service;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import vn.fss.product.entity.Product;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Service
public class AiSyncService {

    private static final Logger logger = LoggerFactory.getLogger(AiSyncService.class);
    
    private final RestTemplate restTemplate;

    // Giả sử AI Service chạy ở port 8000
    private final String aiServiceUrl = "http://localhost:8000/api/v1";

    public AiSyncService() {
        this.restTemplate = new RestTemplate();
    }

    public void syncProductAsync(Product product) {
        CompletableFuture.runAsync(() -> {
            try {
                String url = aiServiceUrl + "/sync-product";
                
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                
                Map<String, Object> requestBody = new HashMap<>();
                requestBody.put("product_id", product.getId());
                requestBody.put("image_filename", product.getImagePath() != null ? product.getImagePath() : product.getId() + ".jpg");
                requestBody.put("gender", product.getGender() != null ? product.getGender() : "");
                requestBody.put("master_category", product.getMasterCategory() != null ? product.getMasterCategory() : "");
                requestBody.put("sub_category", product.getSubCategory() != null ? product.getSubCategory() : "");
                requestBody.put("article_type", product.getArticleType() != null ? product.getArticleType() : "");

                HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
                
                ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);
                if (response.getStatusCode().is2xxSuccessful()) {
                    logger.info("Đã đồng bộ AI thành công cho sản phẩm ID: " + product.getId());
                } else {
                    logger.warn("Lỗi khi đồng bộ AI cho sản phẩm ID: " + product.getId() + ". Trạng thái: " + response.getStatusCode());
                }
            } catch (Exception e) {
                logger.error("Ngoại lệ khi gọi AI Service để đồng bộ sản phẩm ID: " + product.getId(), e);
            }
        });
    }

    public void deleteProductAsync(Long productId) {
        CompletableFuture.runAsync(() -> {
            try {
                String url = aiServiceUrl + "/sync-product/" + productId;
                restTemplate.delete(url);
                logger.info("Đã xóa vector AI thành công cho sản phẩm ID: " + productId);
            } catch (Exception e) {
                logger.error("Ngoại lệ khi gọi AI Service để xóa sản phẩm ID: " + productId, e);
            }
        });
    }
}
