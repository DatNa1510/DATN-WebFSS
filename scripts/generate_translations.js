import fs from 'fs';
import path from 'path';

const VN_DICT = {
  // Category & Subcategory
  'Apparel': 'Quần áo',
  'Footwear': 'Giày dép',
  'Accessories': 'Phụ kiện',
  'Topwear': 'Áo',
  'Bottomwear': 'Quần',
  'Innerwear': 'Đồ lót',
  'Shoes': 'Giày',
  'Watches': 'Đồng hồ',
  'Flip Flops': 'Dép xỏ ngón',
  'Bags': 'Túi xách',
  'Belts': 'Thắt lưng',
  'Socks': 'Tất / Vớ',
  'Jewellery': 'Trang sức',
  'Eyewear': 'Mắt kính',
  'Fragrance': 'Nước hoa',
  'Wallets': 'Ví tiền',
  
  // Articles
  'Tshirts': 'Áo thun',
  'Shirts': 'Áo sơ mi',
  'Casual Shoes': 'Giày thường',
  'Sports Shoes': 'Giày thể thao',
  'Formal Shoes': 'Giày tây',
  'Handbags': 'Túi xách',
  'Backpacks': 'Balo',
  'Shorts': 'Quần đùi',
  'Jeans': 'Quần Jeans',
  'Trousers': 'Quần dài',
  'Jackets': 'Áo khoác',
  'Sweaters': 'Áo len',
  'Sandals': 'Xăng đan',
  'Heels': 'Giày cao gót',
  'Wedges': 'Giày đế xuồng',
  'Flats': 'Giày bệt',
  'Kurta': 'Áo Kurta',
  'Kurtas': 'Áo Kurta',
  'Tunics': 'Áo Tunic',
  'Tunic': 'Áo Tunic',
  'Tops': 'Áo kiểu',
  'Top': 'Áo kiểu',
  'Leggings': 'Quần Legging',
  'Track Pants': 'Quần thể thao',
  'Ring': 'Nhẫn',
  'Rings': 'Nhẫn',
  'Bracelets': 'Vòng tay',
  'Earrings': 'Bông tai',
  'Necklaces': 'Dây chuyền',
  'Pendants': 'Mặt dây chuyền',
  'Bangles': 'Vòng kiềng',
  'Sunglasses': 'Kính mát',
  'Messenger Bag': 'Túi đeo chéo',
  'Duffel Bag': 'Túi trống',
  'Laptop Bag': 'Túi Laptop',
  'Perfume': 'Nước hoa',
  'Deodorant': 'Lăn khử mùi',
  
  // Gender
  'Men': 'Nam',
  'Women': 'Nữ',
  'Boys': 'Bé trai',
  'Girls': 'Bé gái',
  'Unisex': 'Unisex',
  
  // Colors
  'Black': 'Đen', 'White': 'Trắng', 'Blue': 'Xanh dương', 'Navy Blue': 'Xanh Navy',
  'Red': 'Đỏ', 'Grey': 'Xám', 'Green': 'Xanh lá', 'Brown': 'Nâu', 'Yellow': 'Vàng',
  'Pink': 'Hồng', 'Purple': 'Tím', 'Orange': 'Cam', 'Silver': 'Bạc', 'Gold': 'Vàng kim',
  'Beige': 'Be', 'Steel': 'Thép', 'Maroon': 'Đỏ đô', 'Khaki': 'Khaki', 'Olive': 'Xanh Olive',
  'Teal': 'Xanh mòng két', 'Turquoise': 'Xanh ngọc', 'Cream': 'Kem', 'Lavender': 'Tím oải hương',
  'Magenta': 'Đỏ tím', 'Tan': 'Nâu sáng', 'Off White': 'Trắng kem', 'Multi': 'Đa sắc',
  'Rust': 'Đỏ gạch', 'Copper': 'Đồng'
};

function translate(text) {
  if (!text) return text;
  return VN_DICT[text] || text;
}

function translateName(product) {
  if (!product) return "Sản phẩm";
  
  const rawName = product.productDisplayName || product.name || '';
  if (!rawName) return "Sản phẩm";

  const enGender = product.gender || '';
  const enColor = product.baseColour || '';
  const enArticle = product.articleType || '';

  let modelName = rawName;
  
  const wordsToRemove = [
    enGender, enColor, enArticle, 
    'Men', 'Women', 'Boys', 'Girls', 'Unisex', 
    'Shoes', 'Watches', 'Shirt', 'Tshirts', 'Solid', 'Striped', 'Casual', 'Formal'
  ];

  wordsToRemove.forEach(term => {
    if (term && term.length > 2) {
      const regex = new RegExp(`\\\\b${term}\\\\b`, 'gi');
      modelName = modelName.replace(regex, '');
    }
  });

  modelName = modelName.replace(/[\\-]/g, ' ').replace(/\\s+/g, ' ').trim();

  const vnArticle = translate(enArticle) || 'Sản phẩm';
  const vnColor = translate(enColor);

  let finalName = vnArticle;
  if (modelName.length > 0) {
    finalName += ` ${modelName}`;
  }
  if (vnColor && vnColor !== 'Mặc định') {
    finalName += ` màu ${vnColor}`;
  }

  return finalName;
}

const rawData = fs.readFileSync('fashion-dataset/products_1000.json', 'utf8');
const products = JSON.parse(rawData);

let sqlContent = '';

products.forEach(p => {
    const vnName = translateName(p);
    // Escape single quotes for SQL
    const safeVnName = vnName.replace(/'/g, "''");
    sqlContent += `UPDATE products SET product_display_name = '${safeVnName}' WHERE id = ${p.id};\n`;
});

fs.writeFileSync('update_names.sql', sqlContent, 'utf8');
console.log('Created update_names.sql with ' + products.length + ' update statements.');
