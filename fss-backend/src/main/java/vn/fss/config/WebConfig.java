package vn.fss.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.images.path:#{null}}")
    private String imagesPath;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Xác định đường dẫn ảnh: ưu tiên biến môi trường, fallback theo OS
        String location;
        if (imagesPath != null && !imagesPath.isBlank()) {
            location = imagesPath;
        } else {
            // Auto-detect: nếu chạy trên Windows (dev local) dùng đường dẫn tuyệt đối,
            // nếu chạy trên Linux (Docker/Render) dùng đường dẫn trong container
            String os = System.getProperty("os.name", "").toLowerCase();
            if (os.contains("win")) {
                location = "file:D:/DATN/Web_FSS/fashion-dataset/images/";
            } else {
                location = "file:/app/fashion-dataset/images/";
            }
        }

        // Serve ảnh sản phẩm từ thư mục fashion-dataset/images
        registry.addResourceHandler("/fashion-dataset/images/**")
                .addResourceLocations(location)
                .setCachePeriod(3600); // Cache 1 giờ

        // Frontend gọi /images/{id}.jpg - map tới cùng thư mục ảnh
        registry.addResourceHandler("/images/**")
                .addResourceLocations(location)
                .setCachePeriod(3600);
    }
}
