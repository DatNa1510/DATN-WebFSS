package vn.fss.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Serve ảnh sản phẩm từ thư mục fashion-dataset/images trên máy local
        registry.addResourceHandler("/fashion-dataset/images/**")
                .addResourceLocations("file:D:/DATN/Web_FSS/fashion-dataset/images/")
                .setCachePeriod(3600); // Cache 1 giờ
    }
}
