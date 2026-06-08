const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, '..', 'fashion-dataset', 'images');
const PRODUCTS_JSON = path.join(__dirname, '..', 'fashion-dataset', 'products_1000.json');

// 1. Đọc sản phẩm
const products = JSON.parse(fs.readFileSync(PRODUCTS_JSON, 'utf-8'));
console.log('='.repeat(60));
console.log('  THỐNG KÊ ẢNH SẢN PHẨM');
console.log('='.repeat(60));
console.log(`\n📦 Tổng sản phẩm trong JSON: ${products.length}`);

// 2. Lấy tên file ảnh mà sản phẩm tham chiếu
const productImageFiles = new Set();
products.forEach(p => {
  if (p.imageUrl) {
    productImageFiles.add(path.basename(p.imageUrl));
  }
});

// 3. Lấy danh sách file ảnh thực tế
const actualFiles = fs.readdirSync(IMAGES_DIR).filter(f => 
  ['.jpg', '.jpeg', '.png', '.webp'].includes(path.extname(f).toLowerCase())
);
console.log(`🖼️  Tổng file ảnh trong thư mục: ${actualFiles.length}`);

const actualSet = new Set(actualFiles);

// 4. Phân loại
const matched = [...productImageFiles].filter(f => actualSet.has(f));
const missing = [...productImageFiles].filter(f => !actualSet.has(f));
const unused = actualFiles.filter(f => !productImageFiles.has(f));

const uuidFiles = unused.filter(f => f.replace(/\.\w+$/, '').length > 20);
const numericUnused = unused.filter(f => !uuidFiles.includes(f));

console.log(`\n${'─'.repeat(60)}`);
console.log('  KẾT QUẢ PHÂN LOẠI');
console.log('─'.repeat(60));
console.log(`\n✅ Ảnh ĐANG DÙNG (khớp sản phẩm):       ${matched.length}`);
console.log(`❌ Ảnh THIẾU (SP có nhưng file không có): ${missing.length}`);
console.log(`🗑️  Ảnh THỪA (file có nhưng SP không dùng): ${unused.length}`);
console.log(`   ├── Ảnh số ID thừa: ${numericUnused.length}`);
console.log(`   └── Ảnh UUID (admin upload): ${uuidFiles.length}`);

// 5. Tính dung lượng
let usedSize = 0, unusedSize = 0, totalSize = 0;
matched.forEach(f => { usedSize += fs.statSync(path.join(IMAGES_DIR, f)).size; });
unused.forEach(f => { unusedSize += fs.statSync(path.join(IMAGES_DIR, f)).size; });
actualFiles.forEach(f => { totalSize += fs.statSync(path.join(IMAGES_DIR, f)).size; });

const mb = (b) => (b / (1024 * 1024)).toFixed(1);

console.log(`\n${'─'.repeat(60)}`);
console.log('  DUNG LƯỢNG');
console.log('─'.repeat(60));
console.log(`\n📁 Tổng dung lượng thư mục ảnh: ${mb(totalSize)} MB`);
console.log(`✅ Dung lượng ảnh đang dùng:     ${mb(usedSize)} MB`);
console.log(`🗑️  Dung lượng ảnh thừa:          ${mb(unusedSize)} MB`);
console.log(`💰 Tiết kiệm nếu xóa ảnh thừa:  ${mb(unusedSize)} MB (${Math.round(unusedSize * 100 / totalSize)}%)`);

// 6. Ảnh thiếu
if (missing.length > 0) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  ⚠️  DANH SÁCH ẢNH THIẾU (${missing.length} file)`);
  console.log('─'.repeat(60));
  missing.sort().slice(0, 20).forEach(f => console.log(`   - ${f}`));
}

// 7. Ảnh UUID
if (uuidFiles.length > 0) {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  📎 ẢNH ADMIN UPLOAD (${uuidFiles.length} file)`);
  console.log('─'.repeat(60));
  uuidFiles.sort().forEach(f => {
    const sizeKb = (fs.statSync(path.join(IMAGES_DIR, f)).size / 1024).toFixed(0);
    console.log(`   - ${f} (${sizeKb} KB)`);
  });
}

console.log(`\n${'='.repeat(60)}`);
console.log('  KẾT LUẬN');
console.log('='.repeat(60));
console.log(`\n→ Cần upload: ${matched.length} ảnh sản phẩm chính`);
console.log(`  + ${uuidFiles.length} ảnh admin upload (nếu đang dùng)`);
console.log(`→ Có thể XÓA: ${numericUnused.length} ảnh số ID thừa để tiết kiệm ${mb(unusedSize)} MB`);
console.log('='.repeat(60));
