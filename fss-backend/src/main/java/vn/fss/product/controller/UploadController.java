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

    private final String UPLOAD_DIR = "D:/DATN/Web_FSS/fashion-dataset/images/";

    @PostMapping("/images")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> uploadImages(@RequestParam("files") MultipartFile[] files) {
        try {
            File dir = new File(UPLOAD_DIR);
            if (!dir.exists()) {
                dir.mkdirs();
            }

            List<String> fileNames = new ArrayList<>();
            for (MultipartFile file : files) {
                if (file.isEmpty()) continue;
                String originalFilename = file.getOriginalFilename();
                String extension = originalFilename != null && originalFilename.contains(".") ? originalFilename.substring(originalFilename.lastIndexOf(".")) : ".jpg";
                String newFileName = UUID.randomUUID().toString() + extension;
                Path path = Paths.get(UPLOAD_DIR + newFileName);
                Files.write(path, file.getBytes());
                fileNames.add(newFileName);
            }

            return ResponseEntity.ok(Map.of("message", "Tải ảnh lên thành công", "images", fileNames));
        } catch (IOException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Lỗi tải ảnh: " + e.getMessage()));
        }
    }
}
