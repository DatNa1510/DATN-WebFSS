package vn.fss.search.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO map với response JSON từ FastAPI AI Service.
 *
 * Response format từ /api/v1/search-by-image:
 * {
 *   "success": true,
 *   "query_info": { ... },
 *   "results": [
 *     { "product_id": 43666, "similarity_score": 0.9234, ... }
 *   ],
 *   "total_found": 10
 * }
 */
@Data
@NoArgsConstructor
public class AiSearchResponse {

    private boolean success;

    @JsonProperty("query_info")
    private Object queryInfo;

    private List<AiResultItem> results;

    @JsonProperty("total_found")
    private Integer totalFound;

    @Data
    @NoArgsConstructor
    public static class AiResultItem {

        @JsonProperty("product_id")
        private Long productId;

        @JsonProperty("similarity_score")
        private Double similarityScore;

        @JsonProperty("image_path")
        private String imagePath;

        private String gender;

        @JsonProperty("master_category")
        private String masterCategory;

        @JsonProperty("article_type")
        private String articleType;
    }
}
