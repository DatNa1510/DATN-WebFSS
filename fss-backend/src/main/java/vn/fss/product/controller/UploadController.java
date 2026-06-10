package vn.fss.product.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.access.prepost.PreAuthorize;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
public class UploadController {

    @org.springframework.beans.factory.annotation.Value("${app.images.path:#{null}}")
    private String configuredPath;

    private String getUploadDir() {
        if (configuredPath != null && !configuredPath.isBlank()) {
            return configuredPath.replace("file:///", "").replace("file:", "");
        }
        String os = System.getProperty("os.name", "").toLowerCase();
        if (os.contains("win")) {
            return "D:/DATN/Web_FSS/fashion-dataset/images/";
        } else {
            return "/app/fashion-dataset/images/";
        }
    }
    @PostMapping("/images")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> uploadImages(@RequestParam("files") MultipartFile[] files) {
        try {
            String uploadDir = getUploadDir();
            File dir = new File(uploadDir);
            if (!dir.exists()) {
                dir.mkdirs();
            }

            List<String> fileNames = new ArrayList<>();
            for (MultipartFile file : files) {
                if (file.isEmpty()) continue;
                String originalFilename = file.getOriginalFilename();
                String extension = originalFilename != null && originalFilename.contains(".") ? originalFilename.substring(originalFilename.lastIndexOf(".")) : ".jpg";
                String newFileName = UUID.randomUUID().toString() + extension;
                Path path = Paths.get(uploadDir + newFileName);
                Files.write(path, file.getBytes());
                fileNames.add(newFileName);
            }

            return ResponseEntity.ok(Map.of("message", "Tải ảnh lên thành công", "images", fileNames));
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Lỗi tải ảnh: " + e.getMessage()));
        }
    }
}
