package vn.fss.review.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class ReviewRequest {

    @NotNull(message = "productId không được để trống")
    private Long productId;

    @NotNull(message = "rating không được để trống")
    @Min(value = 1, message = "rating tối thiểu là 1")
    @Max(value = 5, message = "rating tối đa là 5")
    private Integer rating;

    @Size(max = 1000, message = "Bình luận tối đa 1000 ký tự")
    private String comment;
}
