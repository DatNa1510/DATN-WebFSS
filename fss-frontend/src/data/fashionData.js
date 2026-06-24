/**
 * fashionData.js
 * Data layer cho 1.000 sản phẩm Fashion Dataset
 * Đọc từ products_1000.json, bổ sung price/rating/stock
 */
import rawProducts from './products_1000.json';

// ─── SEED-BASED RANDOM (nhất quán theo id) ────────────
function seededRandom(seed) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

// ─── TỰ ĐỘNG DỊCH THUỘC TÍNH (ENGLISH -> VIETNAMESE) ───
export const VN_DICT = {
  // Category & Subcategory
  'Apparel': 'Quần áo',
  'Footwear': 'Giày dép',
  'Accessories': 'Phụ kiện',
  'Personal Care': 'Chăm sóc cá nhân',
  'Sporting Goods': 'Đồ thể thao',
  'Home': 'Đồ gia dụng',
  'Free Items': 'Quà tặng',
  'Topwear': 'Trang phục trên',
  'Bottomwear': 'Trang phục dưới',
  'Innerwear': 'Đồ lót',
  'Headwear': 'Mũ & Nón',
  'Shoes': 'Giày',
  'Watches': 'Đồng hồ',
  'Flip Flops': 'Dép xỏ ngón',
  'Bags': 'Túi xách',
  'Belts': 'Thắt lưng',
  'Socks': 'Vớ & Tất',
  'Jewellery': 'Trang sức',
  'Eyewear': 'Mắt kính',
  'Fragrance': 'Nước hoa',
  'Wallets': 'Ví & Bóp',
  'Dress': 'Váy đầm',
  'Loungewear and Nightwear': 'Đồ mặc nhà & Đồ ngủ',
  'Saree': 'Trang phục Saree',
  'Lips': 'Son môi',
  'Nails': 'Sơn móng tay',
  'Makeup': 'Trang điểm',
  'Skin Care': 'Chăm sóc da',
  'Bath and Body': 'Sữa tắm & Dưỡng thể',
  'Sports Gear': 'Dụng cụ thể thao',
  'Sports Shoes': 'Giày thể thao',
  'Sports Apparel': 'Quần áo thể thao',
  'Home Decor': 'Trang trí nhà cửa',
  'Bedding': 'Chăn ga gối nệm',
  'Kitchenware': 'Dụng cụ nhà bếp',
  'Gifts': 'Quà tặng kèm',
  'Samples': 'Mẫu thử',
  
  // Articles
  'Tshirts': 'Áo thun',
  'Tshirt': 'Áo thun',
  'Shirts': 'Áo sơ mi',
  'Shirt': 'Áo sơ mi',
  'Casual Shoes': 'Giày thời trang',
  'Casual Shoe': 'Giày thời trang',
  'Sports Shoes': 'Giày thể thao',
  'Sports Shoe': 'Giày thể thao',
  'Formal Shoes': 'Giày tây',
  'Formal Shoe': 'Giày tây',
  'Handbags': 'Túi xách tay',
  'Handbag': 'Túi xách tay',
  'Backpacks': 'Balo',
  'Backpack': 'Balo',
  'Shorts': 'Quần short',
  'Jeans': 'Quần Jeans',
  'Trousers': 'Quần dài',
  'Jackets': 'Áo khoác',
  'Jacket': 'Áo khoác',
  'Sweaters': 'Áo len',
  'Sweater': 'Áo len',
  'Sweatshirts': 'Áo nỉ',
  'Sweatshirt': 'Áo nỉ',
  'Sandals': 'Sandal',
  'Sandal': 'Sandal',
  'Heels': 'Giày cao gót',
  'Heel': 'Giày cao gót',
  'Wedges': 'Giày đế xuồng',
  'Wedge': 'Giày đế xuồng',
  'Flats': 'Giày đế bằng',
  'Flat': 'Giày đế bằng',
  'Kurta': 'Áo Kurta',
  'Kurtas': 'Áo Kurta',
  'Tunics': 'Áo Tunics',
  'Tunic': 'Áo Tunics',
  'Tops': 'Áo kiểu',
  'Top': 'Áo kiểu',
  'Leggings': 'Quần Legging',
  'Track Pants': 'Quần thể thao dài',
  'Ring': 'Nhẫn',
  'Rings': 'Nhẫn',
  'Bracelets': 'Vòng tay',
  'Bracelet': 'Vòng tay',
  'Earrings': 'Hoa tai',
  'Earring': 'Hoa tai',
  'Necklaces': 'Vòng cổ',
  'Necklace': 'Vòng cổ',
  'Necklace and Chains': 'Vòng cổ & Dây chuyền',
  'Necklaces and Chains': 'Vòng cổ & Dây chuyền',
  'Chains': 'Dây chuyền',
  'Chain': 'Dây chuyền',
  'Pendants': 'Mặt dây chuyền',
  'Pendant': 'Mặt dây chuyền',
  'Bangles': 'Vòng kiềng',
  'Bangle': 'Vòng kiềng',
  'Jewellery Set': 'Bộ trang sức',
  'Jewellery Sets': 'Bộ trang sức',
  'Kurta Sets': 'Bộ áo Kurta',
  'Sarees': 'Váy Saree',
  'Sunglasses': 'Kính mát',
  'Messenger Bag': 'Túi đeo chéo',
  'Duffel Bag': 'Túi trống du lịch',
  'Laptop Bag': 'Túi đựng Laptop',
  'Perfume': 'Nước hoa',
  'Deodorant': 'Lăn khử mùi',
  'Caps': 'Mũ lưỡi trai',
  'Clutches': 'Ví cầm tay',
  'Scarves': 'Khăn quàng',
  'Ties': 'Cà vạt',
  'Cufflinks': 'Khuy măng sét',
  'Stoles': 'Khăn choàng vai',
  'Mufflers': 'Khăn len',
  'Gloves': 'Găng tay',
  'Glove': 'Găng tay',
  'Belt': 'Thắt lưng',
  'Belts': 'Thắt lưng',
  'Wallets': 'Ví & Bóp',
  'Wallet': 'Ví & Bóp',
  'Socks': 'Vớ & Tất',
  'Sock': 'Vớ & Tất',
  'Watches': 'Đồng hồ',
  'Watch': 'Đồng hồ',
  'Umbrellas': 'Ô & Dù',
  'Umbrella': 'Ô & Dù',
  'Kurti': 'Áo Kurti',
  'Salwar': 'Quần Salwar',
  'Churidar': 'Quần Churidar',
  'Dupatta': 'Khăn Dupatta',
  'Capris': 'Quần lửng Capris',
  'Capri': 'Quần lửng Capris',
  'Tights': 'Quần Tights (Bó cơ)',
  'Tight': 'Quần Tights (Bó cơ)',
  'Skirts': 'Chân váy',
  'Skirt': 'Chân váy',
  'Jumpsuit': 'Đồ bay (Jumpsuit)',
  'Jumpsuits': 'Đồ bay (Jumpsuit)',
  'Romper': 'Đồ bay liền quần (Romper)',
  'Rompers': 'Đồ bay liền quần (Romper)',
  'Nightdress': 'Váy ngủ',
  'Nightdresses': 'Váy ngủ',
  'Suspenders': 'Dây đeo quần (Suspenders)',
  'Suspender': 'Dây đeo quần (Suspenders)',
  'Shoe Accessories': 'Phụ kiện giày',
  'Shoe Accessory': 'Phụ kiện giày',
  'Sports Sandals': 'Sandal thể thao',
  'Sports Sandal': 'Sandal thể thao',
  'Briefs': 'Quần lót nam',
  'Trunks': 'Quần lót nam (Trunk)',
  'Boxers': 'Quần lót nam (Boxer)',
  'Bra': 'Áo ngực',
  'Camisoles': 'Áo hai dây',
  'Shapewear': 'Gen nịt bụng',
  
  // Gender
  'Men': 'Nam',
  'Women': 'Nữ',
  'Boys': 'Bé trai',
  'Girls': 'Bé gái',
  'Unisex': 'Unisex',
  
  // Usage
  'Casual': 'Hàng ngày',
  'Sports': 'Thể thao',
  'Formal': 'Trang trọng',
  'Ethnic': 'Truyền thống',
  'Smart Casual': 'Thanh lịch',
  'Travel': 'Du lịch',
  'Party': 'Tiệc tùng',
  'Home': 'Mặc nhà',
  
  // Season
  'Summer': 'Mùa hè',
  'Fall': 'Mùa thu',
  'Winter': 'Mùa đông',
  'Spring': 'Mùa xuân',
  
  // Colors & Materials
  'Black': 'Đen',
  'White': 'Trắng',
  'Blue': 'Xanh dương',
  'Navy Blue': 'Xanh Navy',
  'Red': 'Đỏ',
  'Grey': 'Xám',
  'Green': 'Xanh lá',
  'Brown': 'Nâu',
  'Yellow': 'Vàng',
  'Pink': 'Hồng',
  'Purple': 'Tím',
  'Orange': 'Cam',
  'Silver': 'Bạc',
  'Gold': 'Vàng kim',
  'Beige': 'Be (Beige)',
  'Steel': 'Màu thép',
  'Maroon': 'Đỏ đô',
  'Khaki': 'Màu Khaki',
  'Olive': 'Xanh Olive',
  'Teal': 'Xanh mòng két',
  'Turquoise': 'Xanh ngọc',
  'Cream': 'Màu kem',
  'Lavender': 'Tím oải hương',
  'Magenta': 'Đỏ cánh sen',
  'Tan': 'Màu da (Tan)',
  'Off White': 'Trắng kem',
  'Multi': 'Đa sắc',
  'Rust': 'Màu gạch',
  'Copper': 'Màu đồng',
  'Charcoal': 'Xám than',
  'Peach': 'Màu đào',
  'Rose': 'Hồng hồng',
  'Sea Green': 'Xanh biển',
  'Burgundy': 'Đỏ rượu'
};

export function translate(text) {
  if (!text) return text;
  return VN_DICT[text] || text;
}

export function translateName(product) {
  if (!product) return "Sản phẩm";
  
  const rawName = product.productDisplayName || product.name || '';
  if (!rawName) return "Sản phẩm";

  // Nếu tên đã được dịch sẵn từ database (chứa dấu tiếng Việt hoặc từ "màu")
  if (rawName.includes(' màu ') || /[àáãạảăắằẳẵặâấầẩẫậèéẹẻẽêềếểễệđìíĩỉịòóõọỏôốồổỗộơớờởỡợùúũụủưứừửữựỳỵỷỹý]/i.test(rawName)) {
    return rawName;
  }

  const enGender = product.gender || '';
  const enColor = product.baseColour || '';
  const enArticle = product.articleType || '';

  // 1. Phân tách để lấy đúng phần Tên riêng (Thương hiệu + Dòng sản phẩm)
  let modelName = rawName;
  
  // Xóa các từ vựng đặc trưng để lọc ra tên gốc
  const wordsToRemove = [
    enGender, enColor, enArticle, 
    'Men', 'Women', 'Boys', 'Girls', 'Unisex', 
    'Shoes', 'Watches', 'Shirt', 'Tshirts', 'Solid', 'Striped', 'Casual', 'Formal'
  ];

  wordsToRemove.forEach(term => {
    if (term && term.length > 2) {
      // case-insensitive word replacement
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      modelName = modelName.replace(regex, '');
    }
  });

  // Xóa khoảng trắng thừa và dấu câu thừa
  modelName = modelName.replace(/[\-]/g, ' ').replace(/\s+/g, ' ').trim();

  // 2. Lấy các thành phần tiếng Việt
  const vnArticle = translate(enArticle) || 'Sản phẩm';
  const vnColor = translate(enColor);
  const vnGender = translate(enGender);

  // 3. Lắp ráp tự nhiên chuẩn ngữ pháp Tiếng Việt (Thương mại điện tử)
  // Format: [Loại] + [Tên riêng] + [màu X] + [dành cho Y]
  let finalName = vnArticle;

  if (modelName.length > 0) {
    // Tránh trùng lặp nếu modelName vô tình còn dính
    finalName += ` ${modelName}`;
  }

  if (vnColor && vnColor !== 'Mặc định') {
    const colorStr = String(vnColor).toLowerCase();
    if (colorStr.startsWith('màu ')) {
      finalName += ` ${colorStr}`;
    } else {
      finalName += ` màu ${colorStr}`;
    }
  }

  return finalName;
}

// ─── TỰ ĐỘNG DỊCH NGƯỢC TỪ KHÓA TÌM KIẾM SANG TIẾNG ANH ─────────
export function reverseTranslateSearch(keyword) {
  if (!keyword) return keyword;
  let translatedSearch = keyword.toLowerCase();
  
  // Sắp xếp từ điển theo độ dài từ khóa tiếng Việt giảm dần để ưu tiên cụm từ dài (VD: "áo sơ mi" trước "áo")
  // Nếu độ dài tiếng Việt bằng nhau, ưu tiên từ tiếng Anh NHỎ HƠN (số ít, VD 'Shirt' trước 'Shirts')
  const reverseDict = Object.entries(VN_DICT)
    .sort((a, b) => {
      if (b[1].length !== a[1].length) {
        return b[1].length - a[1].length;
      }
      return a[0].length - b[0].length;
    });

  for (const [en, vn] of reverseDict) {
    if (vn && vn.length > 2) {
      // Tìm từ khóa tiếng Việt và thay thế bằng tiếng Anh
      // Không dùng regex word boundary \b vì tiếng Việt có dấu
      const regex = new RegExp(vn.toLowerCase(), 'g');
      translatedSearch = translatedSearch.replace(regex, en.toLowerCase());
    }
  }
  return translatedSearch.trim();
}

// ─── MAP CATEGORY SANG TIẾNG VIỆT ─────────────────────
export const CATEGORY_MAP = {
  all          : { label: 'Tất cả',             slug: 'all',           color: '#00168d' },
  Apparel      : { label: 'Quần áo',            slug: 'Apparel',       color: '#7c3aed' },
  Footwear     : { label: 'Giày dép',           slug: 'Footwear',      color: '#0891b2' },
  Accessories  : { label: 'Phụ kiện',           slug: 'Accessories',   color: '#d97706' },
};

export const GENDER_MAP = {
  Men   : { label: 'Nam',    color: '#1e40af' },
  Women : { label: 'Nữ',     color: '#be185d' },
  Boys  : { label: 'Bé trai',color: '#0369a1' },
  Girls : { label: 'Bé gái', color: '#9d174d' },
  Unisex: { label: 'Unisex', color: '#374151' },
};

// ─── ENRICH PRODUCTS ──────────────────────────────────
const ENRICHED = rawProducts.map((p) => {
  const r1 = seededRandom(p.id);
  const r2 = seededRandom(p.id + 1000);
  const r3 = seededRandom(p.id + 2000);
  const r4 = seededRandom(p.id + 3000);
  const r5 = seededRandom(p.id + 4000);

  // Giá: 150,000 - 2,000,000 VND (làm tròn 5000)
  const price = Math.round((150000 + r1 * 1850000) / 5000) * 5000;
  // Giá gốc (chỉ khoảng 20% sản phẩm có sale)
  let discountPct = 0;
  let originalPrice = null;
  if (r2 > 0.8) {
    // Nếu thuộc 20% có sale, giảm 10-50%
    discountPct = Math.round(10 + ((r2 - 0.8) / 0.2) * 40);
    originalPrice = Math.round(price / (1 - discountPct / 100) / 5000) * 5000;
  }
  // Rating 3.5 - 5.0
  const rating = Math.round((3.5 + r3 * 1.5) * 10) / 10;
  // Stock 10-100
  const stock = Math.round(10 + r4 * 90);
  // Sold 0-500
  let sold = Math.round(r5 * 500);
  // isNew: ~20%, isBestSeller: ~15%
  const isNew = seededRandom(p.id + 5000) < 0.2;
  let isBestSeller = seededRandom(p.id + 6000) < 0.15;
  
  // ĐẶC BIỆT: Tăng lượt bán cho REVV RING (ID: 48946) để làm Best Seller thực thụ
  if (p.id === 48946) {
    sold = 1100; 
    isBestSeller = true;
  }

  // Size tự động theo danh mục
  let dynamicSizes = ['S', 'M', 'L', 'XL', 'XXL'];
  if (p.masterCategory === 'Footwear') {
    dynamicSizes = ['38', '39', '40', '41', '42', '43', '44'];
  } else if (p.masterCategory === 'Accessories') {
    dynamicSizes = ['Freesize'];
  }

  // Thuộc tính đã dịch
  const tGender = translate(p.gender);
  const tMasterCat = translate(p.masterCategory);
  const tSubCat = translate(p.subCategory);
  const tArticle = translate(p.articleType);
  const tColor = translate(p.baseColour);
  const tSeason = translate(p.season);
  const tUsage = translate(p.usage);

  return {
    ...p,
    name: translateName(p),
    // Đường dẫn ảnh phục vụ qua Vite middleware
    images: [`/fashion-images/${p.id}.jpg`],
    price,
    originalPrice,
    discount: discountPct > 5 ? discountPct : 0,
    rating,
    reviewCount: Math.round(sold * 0.3),
    stock,
    sold,
    isNew,
    isBestSeller,
    
    // Các trường đã dịch để hiển thị trên UI
    category  : tMasterCat,
    subCat    : tSubCat,
    articleType: tArticle,
    colour    : tColor,
    season    : tSeason,
    gender    : tGender,
    usage     : tUsage,
    year      : p.year,
    
    // Các field gốc (nếu lỡ cần backend matching)
    rawMasterCategory: p.masterCategory,
    rawSubCategory: p.subCategory,

    // Các field ProductCard/Detail cần
    sizes     : dynamicSizes,
    colors    : ['#000000'],
    colorNames: [tColor || 'Mặc định'],
    tags      : [tArticle, tColor, tGender, tMasterCat].filter(Boolean).map(t => String(t).toLowerCase()),
    description: `${tArticle} - ${tColor} | ${tGender} | ${tSeason || 'Quanh năm'}`,
  };
});

// ─── EXPORTED HELPERS ─────────────────────────────────
export const formatPrice = (price) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

/**
 * Lấy danh sách sản phẩm (có phân trang + lọc)
 * @param {object} opts
 * @param {number}  opts.page     - trang (0-indexed)
 * @param {number}  opts.limit    - số item/trang (default 20)
 * @param {string}  opts.category - 'all' | 'Apparel' | 'Footwear' | 'Accessories'
 * @param {string}  opts.search   - tìm theo tên
 * @param {string}  opts.sort     - 'newest' | 'price-asc' | 'price-desc' | 'best-seller' | 'rating'
 * @param {number}  opts.minPrice
 * @param {number}  opts.maxPrice
 * @returns {{ items: Product[], total: number, hasMore: boolean }}
 */
export function getProducts({
  page = 0,
  limit = 20,
  category = 'all',
  gender = 'all',
  search = '',
  sort = 'newest',
  minPrice = 0,
  maxPrice = Infinity,
} = {}) {
  let list = [...ENRICHED];

  // Filter by category
  if (category && category !== 'all') {
    list = list.filter((p) => p.rawMasterCategory === category);
  }

  // Filter by gender
  if (gender && gender !== 'all') {
    list = list.filter((p) => p.gender === translate(gender) || p.gender === gender);
  }

  // Filter by search
  if (search.trim()) {
    const q = search.toLowerCase().trim();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.articleType.toLowerCase().includes(q) ||
        p.baseColour.toLowerCase().includes(q) ||
        p.gender.toLowerCase().includes(q)
    );
  }

  // Filter by price
  list = list.filter((p) => p.price >= minPrice && p.price <= maxPrice);

  // Sort
  switch (sort) {
    case 'price-asc'  : list.sort((a, b) => a.price - b.price); break;
    case 'price-desc' : list.sort((a, b) => b.price - a.price); break;
    case 'best-seller': list.sort((a, b) => b.sold - a.sold); break;
    case 'rating'     : list.sort((a, b) => b.rating - a.rating); break;
    default           : break; // 'newest' -> original shuffle order
  }

  const total = list.length;
  const start = page * limit;
  const items = list.slice(start, start + limit);

  return {
    items,
    total,
    hasMore: start + limit < total,
    page,
  };
}

export function getProductById(id) {
  const pid = typeof id === 'string' ? parseInt(id) : id;
  return ENRICHED.find(p => p.id === pid) || ENRICHED[0];
}

export function getSimilarProducts(category, excludeId, limit = 4) {
  return ENRICHED.filter((p) => p.category === category && p.id !== excludeId).slice(0, limit);
}

export const allCategories = Object.entries(CATEGORY_MAP).map(([key, val]) => ({
  id  : key,
  slug: val.slug,
  name: val.label,
}));
