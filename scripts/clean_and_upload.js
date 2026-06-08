const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const IMAGES_DIR = path.join(__dirname, '..', 'fashion-dataset', 'images');
const SUPABASE_STORAGE_BASE = 'https://gcuitrtijmicjvfedtgc.supabase.co/storage/v1/object/public/product-images/';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function main() {
    // Thông tin kết nối lấy từ file application.properties
    const client = new Client({
        host: 'aws-1-ap-northeast-1.pooler.supabase.com',
        port: 6543,
        database: 'postgres',
        user: 'postgres.gcuitrtijmicjvfedtgc',
        password: 'Datnguyen?K84',
        ssl: { rejectUnauthorized: false }
    });
    
    try {
        console.log('⏳ Đang kết nối tới Supabase Database...');
        await client.connect();
        console.log('✅ Đã kết nối Database thành công.\n');
        
        // 1. Lấy toàn bộ ảnh đang dùng trong DB
        const res = await client.query('SELECT image_path FROM products WHERE image_path IS NOT NULL');
        const dbImages = new Set();
        
        res.rows.forEach(row => {
            const imgPath = row.image_path;
            if (imgPath && !imgPath.startsWith('http')) {
                // Hỗ trợ trường hợp có nhiều ảnh cách nhau bằng dấu phẩy
                const paths = imgPath.split(',');
                paths.forEach(p => {
                    const filename = path.basename(p.trim());
                    if (filename) dbImages.add(filename);
                });
            }
        });
        
        console.log(`📦 Tìm thấy ${dbImages.size} file ảnh ĐANG ĐƯỢC DÙNG bởi sản phẩm trong Database.`);
        
        // 2. Lọc và xóa ảnh thừa
        const actualFiles = fs.readdirSync(IMAGES_DIR).filter(f => 
            ['.jpg', '.jpeg', '.png', '.webp'].includes(path.extname(f).toLowerCase())
        );
        
        let deletedCount = 0;
        let deletedSize = 0;
        
        actualFiles.forEach(f => {
            if (!dbImages.has(f)) {
                const filePath = path.join(IMAGES_DIR, f);
                const size = fs.statSync(filePath).size;
                fs.unlinkSync(filePath);
                deletedCount++;
                deletedSize += size;
            }
        });
        
        const mb = (deletedSize / (1024 * 1024)).toFixed(1);
        const remaining = fs.readdirSync(IMAGES_DIR).filter(f => !f.startsWith('.')).length;
        
        console.log(`🗑️  Đã xóa ${deletedCount} file ảnh THỪA (không có trong database).`);
        console.log(`💰 Giải phóng ${mb} MB dung lượng ổ cứng.`);
        console.log(`👉 Chỉ còn lại chính xác ${remaining} file ảnh hợp lệ trong thư mục.\n`);

        // 3. Hướng dẫn upload
        console.log('========================================================');
        console.log('🛑 HÃY DỪNG LẠI MỘT CHÚT VÀ LÀM THEO HƯỚNG DẪN SAU:');
        console.log('========================================================');
        console.log('1. Mở web: https://supabase.com -> Vào Project của bạn -> chọn Storage');
        console.log('2. Tạo bucket mới tên là: product-images (Tick chọn Public)');
        console.log(`3. Kéo thả toàn bộ ${remaining} file trong thư mục D:\\DATN\\Web_FSS\\fashion-dataset\\images vào bucket vừa tạo.`);
        console.log('========================================================\n');

        rl.question('👉 SAU KHI UPLOAD XONG: Nhấn phím Enter để tiếp tục cập nhật Database...', async () => {
            console.log('\n⏳ Đang cập nhật URL ảnh trong Database...');
            
            const updateRes = await client.query('SELECT id, image_path FROM products WHERE image_path IS NOT NULL');
            let updateCount = 0;
            
            for (const row of updateRes.rows) {
                const imgPath = row.image_path;
                if (imgPath && !imgPath.startsWith('http')) {
                    const paths = imgPath.split(',');
                    const newPaths = paths.map(p => {
                        const filename = path.basename(p.trim());
                        return SUPABASE_STORAGE_BASE + filename;
                    });
                    
                    await client.query('UPDATE products SET image_path = $1 WHERE id = $2', [newPaths.join(','), row.id]);
                    updateCount++;
                }
            }
            
            console.log(`✅ HOÀN TẤT! Đã cập nhật ${updateCount} sản phẩm sang dùng URL Supabase Storage.`);
            console.log(`🌐 Website của bạn (cả Docker và Render) giờ đã có thể load ảnh thành công!`);
            
            client.end();
            rl.close();
        });

    } catch (err) {
        console.error('❌ Lỗi:', err);
        client.end();
        rl.close();
    }
}

main();
