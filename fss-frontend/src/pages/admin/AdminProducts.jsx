import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, X, Check, ArrowUpDown, ChevronLeft, ChevronRight, Filter, History, Package, AlertTriangle, Database, Star } from 'lucide-react';
import { toast } from '../../store/toastStore';
import AdminLogsDrawer from '../../components/admin/AdminLogsDrawer';
import { translate, reverseTranslateSearch } from '../../data/fashionData';

const API = 'http://localhost:8080';
const getToken = () => { try { return JSON.parse(localStorage.getItem('fss-auth'))?.state?.token || ''; } catch { return ''; } };
const formatPrice = (n) => n?.toLocaleString('vi-VN') ?? '0';

const getImageUrl = (path) => {
  if (!path) return null;
  const firstImage = path.split(',')[0].trim();
  if (firstImage.startsWith('http')) return firstImage;
  if (firstImage.startsWith('/')) return `${API}${firstImage}`;
  return `${API}/images/${firstImage}`;
};

const J = {
  black: '#1A1A1A',
  gray: '#6B6B6B',
  lightGray: '#E8E8E4',
  red: '#1e3bc3', // Softer Shop theme blue
  redLight: '#E8EEFF', // Soft blue
  white: '#FFFFFF',
  green: '#27AE60',
  blue: '#2980B9',
};

const categories = [
  { id: 'all', name: 'Tất cả' },
  { id: 'Apparel', name: 'Quần áo (Apparel)' },
  { id: 'Footwear', name: 'Giày dép (Footwear)' },
  { id: 'Accessories', name: 'Phụ kiện (Accessories)' },
];

const subCategoriesMap = {
  Apparel: [
    { id: 'Topwear', name: 'Trang phục trên (Topwear)' },
    { id: 'Bottomwear', name: 'Trang phục dưới (Bottomwear)' },
    { id: 'Innerwear', name: 'Đồ lót (Innerwear)' },
    { id: 'Dress', name: 'Váy đầm (Dress)' },
    { id: 'Loungewear and Nightwear', name: 'Đồ mặc nhà & Đồ ngủ (Loungewear/Nightwear)' },
    { id: 'Saree', name: 'Trang phục Saree' },
    { id: 'Socks', name: 'Vớ & Tất (Socks)' },
  ],
  Footwear: [
    { id: 'Shoes', name: 'Giày (Shoes)' },
    { id: 'Flip Flops', name: 'Dép xỏ ngón (Flip Flops)' },
    { id: 'Sandal', name: 'Sandal / Xăng-đan' },
    { id: 'Socks', name: 'Vớ & Tất (Socks)' },
  ],
  Accessories: [
    { id: 'Watches', name: 'Đồng hồ (Watches)' },
    { id: 'Bags', name: 'Túi xách (Bags)' },
    { id: 'Belts', name: 'Thắt lưng (Belts)' },
    { id: 'Jewellery', name: 'Trang sức (Jewellery)' },
    { id: 'Eyewear', name: 'Mắt kính (Eyewear)' },
    { id: 'Fragrance', name: 'Nước hoa (Fragrance)' },
    { id: 'Wallets', name: 'Ví & Bóp (Wallets)' },
    { id: 'Headwear', name: 'Mũ & Nón (Headwear)' },
    { id: 'Socks', name: 'Vớ & Tất (Socks)' },
  ],
  'Personal Care': [
    { id: 'Lips', name: 'Son môi (Lips)' },
    { id: 'Nails', name: 'Sơn móng tay (Nails)' },
    { id: 'Makeup', name: 'Trang điểm (Makeup)' },
    { id: 'Skin Care', name: 'Chăm sóc da (Skin Care)' },
    { id: 'Bath and Body', name: 'Sữa tắm & Dưỡng thể (Bath and Body)' },
    { id: 'Fragrance', name: 'Nước hoa (Fragrance)' },
  ],
  'Sporting Goods': [
    { id: 'Sports Gear', name: 'Dụng cụ thể thao (Sports Gear)' },
    { id: 'Sports Shoes', name: 'Giày thể thao (Sports Shoes)' },
    { id: 'Sports Apparel', name: 'Quần áo thể thao (Sports Apparel)' }
  ],
  Home: [
    { id: 'Home Decor', name: 'Trang trí nhà cửa (Home Decor)' },
    { id: 'Bedding', name: 'Chăn ga gối nệm (Bedding)' },
    { id: 'Kitchenware', name: 'Dụng cụ nhà bếp (Kitchenware)' }
  ],
  'Free Items': [
    { id: 'Gifts', name: 'Quà tặng kèm (Gifts)' },
    { id: 'Samples', name: 'Mẫu thử (Samples)' }
  ]
};

const articleTypesMap = {
  Apparel: [
    { id: 'Tshirts', name: 'Áo thun (Tshirts)' },
    { id: 'Shirts', name: 'Áo sơ mi (Shirts)' },
    { id: 'Jackets', name: 'Áo khoác (Jackets)' },
    { id: 'Sweaters', name: 'Áo len (Sweaters)' },
    { id: 'Sweatshirts', name: 'Áo nỉ (Sweatshirts)' },
    { id: 'Shorts', name: 'Quần short (Shorts)' },
    { id: 'Jeans', name: 'Quần Jeans (Jeans)' },
    { id: 'Trousers', name: 'Quần dài (Trousers)' },
    { id: 'Kurtas', name: 'Áo Kurta (Kurtas)' },
    { id: 'Tops', name: 'Áo kiểu (Tops)' },
    { id: 'Skirts', name: 'Chân váy (Skirts)' },
    { id: 'Leggings', name: 'Quần Legging (Leggings)' },
    { id: 'Track Pants', name: 'Quần thể thao dài (Track Pants)' }
  ],
  Footwear: [
    { id: 'Sports Shoes', name: 'Giày thể thao (Sports Shoes)' },
    { id: 'Casual Shoes', name: 'Giày thời trang (Casual Shoes)' },
    { id: 'Formal Shoes', name: 'Giày tây (Formal Shoes)' },
    { id: 'Sandals', name: 'Sandal / Xăng-đan (Sandals)' },
    { id: 'Heels', name: 'Giày cao gót (Heels)' },
    { id: 'Flats', name: 'Giày đế bằng (Flats)' },
    { id: 'Flip Flops', name: 'Dép xỏ ngón (Flip Flops)' }
  ],
  Accessories: [
    { id: 'Watches', name: 'Đồng hồ đeo tay (Watches)' },
    { id: 'Sunglasses', name: 'Kính mát (Sunglasses)' },
    { id: 'Handbags', name: 'Túi xách tay (Handbags)' },
    { id: 'Backpacks', name: 'Balo (Backpacks)' },
    { id: 'Wallets', name: 'Ví & Bóp (Wallets)' },
    { id: 'Belts', name: 'Thắt lưng (Belts)' },
    { id: 'Ring', name: 'Nhẫn (Ring)' },
    { id: 'Earrings', name: 'Hoa tai (Earrings)' },
    { id: 'Necklaces', name: 'Vòng cổ (Necklaces)' },
    { id: 'Caps', name: 'Mũ lưỡi trai (Caps)' },
    { id: 'Socks', name: 'Vớ & Tất (Socks)' }
  ],
  'Personal Care': [
    { id: 'Perfume', name: 'Nước hoa (Perfume)' },
    { id: 'Deodorant', name: 'Lăn khử mùi (Deodorant)' },
    { id: 'Lips', name: 'Son môi (Lips)' },
    { id: 'Nail Polish', name: 'Sơn móng tay (Nail Polish)' }
  ]
};

const emptyForm = { name: '', price: '', originalPrice: '', category: 'Apparel', subCategory: '', articleType: '', gender: 'Unisex', description: '', stock: '', images: '' };

const inputStyle = {
  width: '100%', padding: '10px 12px',
  background: '#FAFAFA', border: `1px solid ${J.lightGray}`,
  borderRadius: '4px', fontSize: '12.5px', color: J.black,
  outline: 'none', fontFamily: 'inherit',
  transition: 'all 0.2s',
  boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block', fontSize: '11px', fontWeight: 600,
  color: J.gray, letterSpacing: '0.04em',
  textTransform: 'uppercase', marginBottom: '6px',
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalStock, setTotalStock] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [originalImages, setOriginalImages] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [focusedInput, setFocusedInput] = useState(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortType, setSortType] = useState('newest');
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [isCustomSubCategory, setIsCustomSubCategory] = useState(false);
  const [isCustomArticleType, setIsCustomArticleType] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const fetchProducts = useCallback(async (page = 0, q = '', cat = 'all', s = 'newest') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20, search: reverseTranslateSearch(q), category: cat, sort: s });
      const res = await fetch(`${API}/api/products?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      let finalItems = data.items || [];
      
      if (q && q.trim()) {
        const queryLower = q.toLowerCase().trim();
        const { translateName, translate } = await import('../../data/fashionData');
        finalItems = finalItems.filter(p => {
          const tName = translateName(p).toLowerCase();
          return tName.includes(queryLower) || 
                 (p.category && translate(p.category).toLowerCase().includes(queryLower));
        });
      }

      setProducts(finalItems);
      setTotal(data.total || 0);
      setTotalStock(data.totalStock || 0);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(data.currentPage || 0);
    } catch {
      toast.error('Không thể tải danh sách sản phẩm!');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(0, '', 'all', 'newest'); }, [fetchProducts]);

  useEffect(() => {
    const t = setTimeout(() => { fetchProducts(0, search, filterCategory, sortType); }, 500);
    return () => clearTimeout(t);
  }, [search, filterCategory, sortType, fetchProducts]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => {
      const nextForm = { ...f, [name]: value };
      if (name === 'category') {
        nextForm.subCategory = '';
        nextForm.articleType = '';
        setIsCustomSubCategory(false);
        setIsCustomArticleType(false);
      }
      return nextForm;
    });
  };

  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files.length) return;
    
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }
    
    setUploadingFiles(true);
    try {
      const res = await fetch(`${API}/api/upload/images`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi tải ảnh');
      
      const uploadedNames = data.images.join(',');
      setForm(f => ({ ...f, images: f.images ? `${f.images},${uploadedNames}` : uploadedNames }));
      toast.success('Tải ảnh lên thành công!');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUploadingFiles(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) {
      return toast.error('Vui lòng nhập tên và giá sản phẩm');
    }

    const payload = {
      productDisplayName: form.name,
      price: Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : null,
      masterCategory: form.category,
      subCategory: form.subCategory,
      articleType: form.articleType || '',
      stock: form.stock ? Number(form.stock) : 50,
      imagePath: form.images || '',
      gender: form.gender || 'Unisex',
      usage: 'Casual',
    };

    try {
      const url = editId ? `${API}/api/products/${editId}` : `${API}/api/products`;
      const method = editId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi lưu sản phẩm');
      
      toast.success(data.message || 'Lưu thành công!');
      setShowForm(false);
      setForm(emptyForm);
      setEditId(null);
      setIsCustomSubCategory(false);
      setIsCustomArticleType(false);
      fetchProducts(currentPage, search, filterCategory, sortType);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEdit = (p) => {
    setEditId(p.id);
    const subCat = p.subCategory || '';
    const artType = p.articleType || '';
    const currentCategory = p.masterCategory || 'Apparel';
    const isPredefinedSub = subCategoriesMap[currentCategory]?.some(sc => sc.id === subCat);
    const isPredefinedArt = articleTypesMap[currentCategory]?.some(at => at.id === artType);
    setIsCustomSubCategory(!isPredefinedSub && subCat !== '');
    setIsCustomArticleType(!isPredefinedArt && artType !== '');
    setForm({
      name: p.productDisplayName,
      price: p.price,
      originalPrice: p.originalPrice,
      category: currentCategory,
      subCategory: subCat,
      articleType: artType,
      gender: p.gender || 'Unisex',
      description: '',
      stock: p.stock,
      images: p.imagePath || ''
    });
    setOriginalImages(p.imagePath || '');
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const res = await fetch(`${API}/api/products/${deleteConfirm}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi xóa sản phẩm');
      
      toast.success(data.message || 'Xóa thành công!');
      setDeleteConfirm(null);
      fetchProducts(currentPage, search, filterCategory, sortType);
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '40px' }}>

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: J.black, letterSpacing: '0.02em' }}>
            Danh sách sản phẩm
          </h1>
          <p style={{ fontSize: '12px', color: J.gray, marginTop: '4px' }}>
            Quản lý kho hàng và thông tin sản phẩm trong hệ thống
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: J.gray }} />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                height: '36px', paddingLeft: '34px', paddingRight: '14px',
                background: J.white, border: `1px solid ${J.lightGray}`,
                borderRadius: '4px', fontSize: '12px', color: J.black,
                outline: 'none', width: '220px',
              }}
              onFocus={e => { e.target.style.borderColor = J.red; }}
              onBlur={e => { e.target.style.borderColor = J.lightGray; }}
            />
          </div>
          <button
            onClick={() => setIsLogsOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '4px',
              background: J.white, border: `1px solid ${J.lightGray}`,
              fontSize: '12px', fontWeight: 500, color: J.black,
              cursor: 'pointer', whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = J.red; e.currentTarget.style.color = J.red; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = J.lightGray; e.currentTarget.style.color = J.black; }}
          >
            <History size={14} /> Lịch sử
          </button>
          <button
            onClick={() => { setShowForm(true); setForm(emptyForm); setEditId(null); setIsCustomSubCategory(false); setIsCustomArticleType(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '4px',
              background: J.red, fontSize: '12px', fontWeight: 500, color: J.white,
              border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#152e9c'}
            onMouseLeave={e => e.currentTarget.style.background = J.red}
          >
            <Plus size={14} /> Thêm sản phẩm
          </button>
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { label: 'Tổng sản phẩm', value: total.toLocaleString(), sub: 'Phân loại trong kho', subColor: J.green },
          { label: 'Sắp hết hàng', value: products.filter(p => p.stock <= 10).length, sub: 'Cần chú ý', subColor: '#E74C3C' },
          { label: 'Tổng tồn kho', value: totalStock.toLocaleString(), sub: 'Tất cả sản phẩm', subColor: J.blue },
          { label: 'Đánh giá TB', value: products.length ? (products.reduce((s,p)=>s+(p.rating||0),0)/products.length).toFixed(1)+' ★' : '—', sub: 'Trang này', subColor: J.gray },
        ].map((card, i) => (
          <div
            key={card.label}
            style={{
              background: J.white, borderRadius: '4px', padding: '16px 20px',
              border: `1px solid ${J.lightGray}`,
            }}
          >
            <p style={{ fontSize: '11px', fontWeight: 600, color: J.gray, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '8px' }}>
              {card.label}
            </p>
            <p style={{ fontSize: '22px', fontWeight: 600, color: J.black, lineHeight: 1, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {typeof card.value === 'string' && card.value.endsWith(' ★') ? (
                <>
                  {card.value.replace(' ★', '')}
                  <span style={{ color: '#FFC107' }}>★</span>
                </>
              ) : card.value}
            </p>
            <p style={{ fontSize: '11px', fontWeight: 500, color: card.subColor }}>
              {card.sub}
            </p>
          </div>
        ))}
      </div>

      {/* ── MODAL FORM ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }}
              style={{ background: J.white, borderRadius: '4px', width: '100%', maxWidth: '500px', padding: '32px', border: `1px solid ${J.lightGray}`, boxShadow: '0 12px 40px rgba(0,0,0,0.1)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 600, color: J.black, letterSpacing: '0.02em' }}>
                    {editId ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
                  </h2>
                  <p style={{ fontSize: '11px', color: J.gray, marginTop: '2px' }}>
                    Cập nhật thông tin chi tiết vào kho dữ liệu
                  </p>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  style={{ width: '32px', height: '32px', borderRadius: '4px', background: '#FAFAFA', border: `1px solid ${J.lightGray}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: J.gray }}
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={labelStyle}>Tên sản phẩm *</label>
                  <input
                    name="name" required value={form.name} onChange={handleChange}
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Giá bán (₫) *</label>
                    <input
                      name="price" type="number" required value={form.price} onChange={handleChange}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Giá gốc (₫)</label>
                    <input
                      name="originalPrice" type="number" value={form.originalPrice} onChange={handleChange}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Danh mục</label>
                    <select
                      name="category" value={form.category} onChange={handleChange}
                      style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
                    >
                      {categories.filter(c => c.id !== 'all').map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Phân loại chi tiết (Tag 2)</label>
                    <select
                      value={isCustomSubCategory ? 'custom' : (form.subCategory || '')}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'custom') {
                          setIsCustomSubCategory(true);
                          setForm(f => ({ ...f, subCategory: '' }));
                        } else {
                          setIsCustomSubCategory(false);
                          setForm(f => ({ ...f, subCategory: val }));
                        }
                      }}
                      style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
                    >
                      <option value="">-- Chọn phân loại --</option>
                      {(subCategoriesMap[form.category] || []).map((sc) => (
                        <option key={sc.id} value={sc.id}>{sc.name}</option>
                      ))}
                      <option value="custom">Khác (Nhập thủ công)...</option>
                    </select>
                    {isCustomSubCategory && (
                      <input
                        name="subCategory"
                        value={form.subCategory || ''}
                        onChange={handleChange}
                        placeholder="Nhập phân loại..."
                        style={{ ...inputStyle, marginTop: '8px' }}
                      />
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Đối tượng sử dụng *</label>
                    <select
                      name="gender" value={form.gender} onChange={handleChange}
                      style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
                    >
                      <option value="Men">Nam (Men)</option>
                      <option value="Women">Nữ (Women)</option>
                      <option value="Unisex">Cả Nam & Nữ (Unisex)</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Chi tiết sản phẩm</label>
                    <select
                      value={isCustomArticleType ? 'custom' : (form.articleType || '')}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'custom') {
                          setIsCustomArticleType(true);
                          setForm(f => ({ ...f, articleType: '' }));
                        } else {
                          setIsCustomArticleType(false);
                          setForm(f => ({ ...f, articleType: val }));
                        }
                      }}
                      style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
                    >
                      <option value="">-- Chọn chi tiết --</option>
                      {(articleTypesMap[form.category] || []).map((at) => (
                        <option key={at.id} value={at.id}>{at.name}</option>
                      ))}
                      <option value="custom">Khác (Nhập thủ công)...</option>
                    </select>
                    {isCustomArticleType && (
                      <input
                        name="articleType"
                        value={form.articleType || ''}
                        onChange={handleChange}
                        placeholder="Nhập chi tiết..."
                        style={{ ...inputStyle, marginTop: '8px' }}
                      />
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Tồn kho</label>
                    <input
                      name="stock" type="number" value={form.stock} onChange={handleChange}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '6px' }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>Ảnh sản phẩm</label>
                    {editId && form.images !== originalImages && (
                      <button
                        type="button" onClick={() => setForm(f => ({ ...f, images: originalImages }))}
                        style={{ fontSize: '11px', color: J.red, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500, padding: 0 }}
                      >
                        Khôi phục ảnh gốc
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="file" multiple accept="image/*"
                        onChange={handleFileChange}
                        disabled={uploadingFiles}
                        style={{
                          flex: 1, padding: '6px 12px',
                          background: '#FAFAFA', border: `1px dashed ${J.lightGray}`,
                          borderRadius: '4px', fontSize: '11px', color: J.gray,
                          cursor: 'pointer'
                        }}
                      />
                      <div style={{ fontSize: '11px', color: J.gray }}>
                        {uploadingFiles ? 'Đang tải...' : (form.images ? `${form.images.split(',').filter(Boolean).length} ảnh` : 'Chưa có ảnh')}
                      </div>
                    </div>
                    {form.images && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                        {form.images.split(',').filter(Boolean).map((img, idx) => (
                          <div key={idx} style={{ position: 'relative' }}>
                            <img 
                              src={getImageUrl(img)} 
                              alt={`preview-${idx}`} 
                              onClick={() => setPreviewImage(getImageUrl(img))}
                              style={{ 
                                width: '40px', height: '40px', objectFit: 'cover', 
                                borderRadius: '4px', border: `1px solid ${J.lightGray}`,
                                cursor: 'zoom-in', transition: 'all 0.2s'
                              }}
                              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                              onError={e => { e.target.src = 'https://placehold.co/40x40/fafaf8/6b6b6b?text=Img'; }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newImages = form.images.split(',').filter(Boolean).filter((_, i) => i !== idx).join(',');
                                setForm({ ...form, images: newImages });
                              }}
                              style={{
                                position: 'absolute', top: '-4px', right: '-4px',
                                width: '14px', height: '14px', borderRadius: '50%',
                                background: J.red, color: 'white', border: '1.5px solid white',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', fontSize: '9px', fontWeight: 'bold'
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px', paddingTop: '10px' }}>
                  <button
                    type="button" onClick={() => setShowForm(false)}
                    style={{
                      padding: '10px', background: J.white, border: `1px solid ${J.lightGray}`,
                      borderRadius: '4px', fontSize: '12px', fontWeight: 500, color: J.gray, cursor: 'pointer',
                    }}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit" id="save-product-btn"
                    style={{
                      padding: '10px', background: J.red, border: 'none',
                      borderRadius: '4px', fontSize: '12px', fontWeight: 500, color: 'white',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    }}
                  >
                    <Check size={14} /> {editId ? 'Lưu thay đổi' : 'Thêm sản phẩm'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN TABLE ── */}
      <div style={{
        background: J.white, borderRadius: '4px',
        border: `1px solid ${J.lightGray}`,
        overflow: 'hidden',
      }}>
        {/* Toolbar */}
        <div style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${J.lightGray}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#FAFAFA',
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative' }}>
              <Filter size={12} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: J.gray, pointerEvents: 'none' }} />
              <select 
                value={filterCategory} 
                onChange={e => setFilterCategory(e.target.value)}
                style={{
                  appearance: 'none', padding: '6px 24px 6px 26px', borderRadius: '4px',
                  background: J.white, border: `1px solid ${J.lightGray}`,
                  fontSize: '11px', fontWeight: 500, color: J.gray,
                  cursor: 'pointer',
                }}
              >
                {categories.map(c => <option key={c.id} value={c.id}>Lọc: {c.name}</option>)}
              </select>
            </div>
            
            <div style={{ position: 'relative' }}>
              <ArrowUpDown size={12} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: J.gray, pointerEvents: 'none' }} />
              <select 
                value={sortType} 
                onChange={e => setSortType(e.target.value)}
                style={{
                  appearance: 'none', padding: '6px 24px 6px 26px', borderRadius: '4px',
                  background: J.white, border: `1px solid ${J.lightGray}`,
                  fontSize: '11px', fontWeight: 500, color: J.gray,
                  cursor: 'pointer',
                }}
              >
                <option value="newest">Sắp xếp: Mới nhất</option>
                <option value="price-asc">Giá: Thấp đến Cao</option>
                <option value="price-desc">Giá: Cao đến Thấp</option>
                <option value="best-seller">Bán chạy nhất</option>
                <option value="rating">Đánh giá tốt</option>
              </select>
            </div>
          </div>
          <p style={{ fontSize: '12px', color: J.gray }}>
            {loading ? 'Đang tải...' : `${total} sản phẩm`}
          </p>
        </div>

        <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 200px)', minHeight: '600px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr style={{ background: '#F5F5F5', borderBottom: `1px solid ${J.lightGray}` }}>
                {['Sản phẩm', 'Giá', 'Tồn kho', 'Đã bán', 'Tags', 'Thao tác'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '12px 16px',
                    fontSize: '11px', fontWeight: 600, color: J.gray,
                    letterSpacing: '0.04em', whiteSpace: 'nowrap',
                    background: '#F5F5F5',
                    boxShadow: `inset 0 -1px 0 ${J.lightGray}`
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ padding: '80px 0', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        style={{ width: '24px', height: '24px', border: `2px solid ${J.lightGray}`, borderTopColor: J.red, borderRadius: '50%' }} />
                      <p style={{ fontSize: '12px', color: J.gray }}>Đang tải danh sách sản phẩm...</p>
                    </div>
                  </td>
                </tr>
              ) : products.map((p, idx) => {
                const stockColor = p.stock > 10 ? J.green : p.stock > 0 ? '#E67E22' : '#E74C3C';
                const stockBg = p.stock > 10 ? '#E9F7EF' : p.stock > 0 ? '#FDF2E9' : '#FDEDEC';
                const displayTags = [translate(p.masterCategory), translate(p.subCategory)].filter(Boolean).slice(0, 2);

                return (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(idx * 0.02, 0.2) }}
                    style={{ borderBottom: `1px solid ${J.lightGray}`, transition: 'background 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FAFAF8'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '240px' }}>
                        <div 
                          onClick={() => setPreviewImage(getImageUrl(p.imagePath))}
                          style={{
                            width: '40px', height: '40px', borderRadius: '4px',
                            overflow: 'hidden', border: `1px solid ${J.lightGray}`,
                            background: '#FAFAFA', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'zoom-in', transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
                          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          <img
                            src={getImageUrl(p.imagePath)} alt={p.productDisplayName}
                            style={{ maxWidth: '36px', maxHeight: '36px', objectFit: 'contain' }}
                            onError={e => { e.target.src = 'https://placehold.co/36x36/fafaf8/6b6b6b?text=Img'; }}
                          />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: '13px', fontWeight: 600, color: J.black, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                            {p.productDisplayName}
                          </p>
                          <p style={{ fontSize: '11px', color: J.gray, marginTop: '2px' }}>
                            {translate(p.subCategory) || translate(p.masterCategory)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: J.black, whiteSpace: 'nowrap' }}>
                        ₫{formatPrice(p.price)}
                      </p>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                        padding: '3px 8px', borderRadius: '2px',
                        background: stockBg, fontSize: '11px', fontWeight: 500, color: stockColor,
                      }}>
                        {p.stock}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: J.black, fontWeight: 500 }}>
                      {(p.sold ?? 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {displayTags.map((t) => (
                          <span key={t} style={{
                            fontSize: '9px', fontWeight: 500,
                            background: '#FAFAFA', color: J.gray,
                            padding: '2px 6px', borderRadius: '2px',
                            border: `1px solid ${J.lightGray}`
                          }}>
                            #{t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => handleEdit(p)}
                          style={{
                            width: '28px', height: '28px', borderRadius: '4px',
                            background: J.white, border: `1px solid ${J.lightGray}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: J.gray, transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = J.red; e.currentTarget.style.color = J.red; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = J.lightGray; e.currentTarget.style.color = J.gray; }}
                        >
                          <Edit2 size={12} />
                        </button>

                        {deleteConfirm === p.id ? (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              onClick={() => handleDelete()}
                              style={{
                                width: '28px', height: '28px', borderRadius: '4px',
                                background: '#DC2626', border: 'none',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', color: 'white',
                              }}
                            >
                              <Check size={12} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              style={{
                                width: '28px', height: '28px', borderRadius: '4px',
                                background: J.white, border: `1px solid ${J.lightGray}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', color: J.gray,
                              }}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(p.id)}
                            style={{
                              width: '28px', height: '28px', borderRadius: '4px',
                              background: J.white, border: `1px solid ${J.lightGray}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', color: J.gray, transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = J.red; e.currentTarget.style.color = J.red; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = J.lightGray; e.currentTarget.style.color = J.gray; }}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          {!loading && products.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <p style={{ fontSize: '13px', color: J.gray, fontWeight: 500 }}>Không tìm thấy sản phẩm nào.</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div style={{
            padding: '12px 16px',
            borderTop: `1px solid ${J.lightGray}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#FAFAFA',
          }}>
            <button
              onClick={() => fetchProducts(currentPage - 1, search)}
              disabled={currentPage === 0}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '6px 12px', borderRadius: '4px',
                background: J.white, border: `1px solid ${J.lightGray}`,
                fontSize: '12px', fontWeight: 500, color: currentPage === 0 ? '#CBD5E1' : J.gray,
                cursor: currentPage === 0 ? 'not-allowed' : 'pointer',
              }}>
              <ChevronLeft size={14} /> Trước
            </button>
            <div style={{ display: 'flex', gap: '4px' }}>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pg = totalPages <= 5 ? i : Math.max(0, Math.min(currentPage - 2, totalPages - 5)) + i;
                return (
                  <button key={pg}
                    onClick={() => fetchProducts(pg, search)}
                    style={{
                      width: '28px', height: '28px', borderRadius: '4px',
                      background: pg === currentPage ? J.redLight : J.white,
                      border: `1px solid ${pg === currentPage ? J.red : J.lightGray}`,
                      fontSize: '12px', fontWeight: pg === currentPage ? 600 : 400,
                      color: pg === currentPage ? J.red : J.gray,
                      cursor: 'pointer',
                    }}>{pg + 1}</button>
                );
              })}
            </div>
            <button
              onClick={() => fetchProducts(currentPage + 1, search)}
              disabled={currentPage >= totalPages - 1}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '6px 12px', borderRadius: '4px',
                background: J.white, border: `1px solid ${J.lightGray}`,
                fontSize: '12px', fontWeight: 500,
                color: currentPage >= totalPages - 1 ? '#CBD5E1' : J.gray,
                cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer',
              }}>
              Sau <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      <AdminLogsDrawer
        isOpen={isLogsOpen}
        onClose={() => setIsLogsOpen(false)}
        targetType="PRODUCT"
        title="Lịch sử Quản lý Sản phẩm"
      />

      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewImage(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'zoom-out', padding: '24px'
            }}
          >
            <button
              onClick={() => setPreviewImage(null)}
              style={{
                position: 'absolute', top: '24px', right: '24px',
                border: 'none', background: 'rgba(255,255,255,0.1)', cursor: 'pointer',
                color: '#FFFFFF', padding: '10px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s', zIndex: 10000
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
            >
              <X size={20} />
            </button>
            <motion.img
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              src={previewImage}
              alt="Preview Zoomed"
              onClick={e => e.stopPropagation()}
              style={{
                maxWidth: '90vw', maxHeight: '85vh',
                objectFit: 'contain', borderRadius: '8px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                cursor: 'default'
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
