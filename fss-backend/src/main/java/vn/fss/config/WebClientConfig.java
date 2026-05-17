package vn.fss.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

/**
 * Cấu hình WebClient bean cho toàn bộ ứng dụng.
 * WebClient là HTTP client reactive, non-blocking của Spring WebFlux.
 * Dùng để gọi FastAPI AI Service.
 */
@Configuration
public class WebClientConfig {

    @Bean
    public WebClient.Builder webClientBuilder() {
        return WebClient.builder();
    }
}
