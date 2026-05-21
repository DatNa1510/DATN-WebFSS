package vn.fss;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

/**
 * FSS - Fashion Shopping Sense
 * Main Spring Boot Application Entry Point
 */
@SpringBootApplication
@EnableMethodSecurity
public class FssApplication {
    public static void main(String[] args) {
        SpringApplication.run(FssApplication.class, args);
    }
}

