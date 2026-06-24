import os
os.environ["CHROMA_ANONYMIZED_TELEMETRY"] = "False"
import random
import logging
from pathlib import Path
from PIL import Image
import torch
from torchvision import transforms
import numpy as np

# Import cấu hình và hàm FSS
from config import BASE_DIR
from database import get_collection
from model import _get_device, get_model

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
logger = logging.getLogger(__name__)

# Fake Augmentations: Giả lập ảnh khách hàng tự chụp bằng điện thoại
# Gồm: Đổi màu sắc ánh sáng, cắt xén ngẫu nhiên, xoay nghiêng
simulate_camera = transforms.Compose([
    transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.05),
    transforms.RandomResizedCrop(size=224, scale=(0.85, 1.0), ratio=(0.9, 1.1)),
    transforms.RandomRotation(degrees=10),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

def evaluate_system(test_samples=100):
    logger.info("=== BẮT ĐẦU ĐÁNH GIÁ ĐỘ CHÍNH XÁC (SYNTHETIC BENCHMARK) ===")
    
    collection = get_collection()
    data = collection.get(include=["metadatas"])
    metadatas = data["metadatas"]
    ids = data["ids"]
    
    if not metadatas:
        logger.error("ChromaDB đang trống. Vui lòng chạy indexer.py trước.")
        return
        
    total_indexed = len(metadatas)
    logger.info(f"Tổng số sản phẩm trong Database: {total_indexed}")
    
    # Lấy ngẫu nhiên test_samples sản phẩm làm test set
    test_indices = random.sample(range(total_indexed), min(test_samples, total_indexed))
    
    top5_correct = 0
    
    device = _get_device()
    model = get_model()
    
    valid_tests = 0
    logger.info(f"Đang tiến hành test trên {len(test_indices)} ảnh ngẫu nhiên...")
    
    for idx in test_indices:
        target_pid = ids[idx]
        img_rel_path = metadatas[idx].get("image_path", "")
        # Chỉnh lại đường dẫn tuyệt đối
        img_full_path = Path(BASE_DIR) / img_rel_path.lstrip("/")
        
        if not img_full_path.exists():
            continue
            
        try:
            # 1. Load ảnh gốc
            img = Image.open(img_full_path).convert("RGB")
            
            # 2. Làm "Fake" (Làm nhiễu, biến dạng) để giả làm ảnh người dùng tải lên
            tensor = simulate_camera(img).unsqueeze(0).to(device)
            
            # 3. Rút trích feature từ ảnh đã bị làm nhiễu
            with torch.no_grad():
                output = model(tensor).squeeze().cpu().numpy()
            
            norm = np.linalg.norm(output)
            if norm > 1e-8:
                output = output / norm
            query_vector = output.astype(np.float32).tolist()
            
            # 4. Tìm kiếm trong ChromaDB xem có mò ra được ảnh gốc không
            results = collection.query(
                query_embeddings=[query_vector],
                n_results=5,
                include=["metadatas"]
            )
            
            result_ids = results["ids"][0]
            
            # 5. Cập nhật kết quả Top-5
            if target_pid in result_ids[:5]:
                top5_correct += 1
                
            valid_tests += 1
            if valid_tests % 20 == 0:
                logger.info(f"Đã test xong {valid_tests}/{test_samples} ảnh...")
                
        except Exception as e:
            logger.warning(f"Lỗi khi xử lý ảnh {target_pid}: {e}")
            
    if valid_tests == 0:
        logger.error("Không có ảnh hợp lệ để test.")
        return
        
    top5_acc = (top5_correct / valid_tests) * 100
    
    print("\n" + "="*55)
    print("      BÁO CÁO KẾT QUẢ ĐÁNH GIÁ (EVALUATION REPORT)      ")
    print("="*55)
    print(f" Tổng số ảnh test : {valid_tests} ảnh")
    print(f" Phương pháp test : Synthetic Test (Cắt ghép, tạo nhiễu)")
    print(f" Mô hình sử dụng  : ResNet50 (Pre-trained Vector Search)")
    print("-" * 55)
    print(f" 🎯 Độ chính xác Top-5  : {top5_acc:.2f} %")
    print("="*55)
    
    if top5_acc >= 80:
        print("\n✅ KẾT LUẬN: HỆ THỐNG ĐÃ ĐẠT YÊU CẦU (>80%)")
    else:
        print("\n⚠️ KẾT LUẬN: CHƯA ĐẠT YÊU CẦU (>80%).")

if __name__ == "__main__":
    evaluate_system(test_samples=100)
