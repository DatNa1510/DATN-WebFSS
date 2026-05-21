import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, X, Check, AlertTriangle, TrendingUp, Star, ChevronLeft, ChevronRight, Filter, ArrowUpDown, Loader2, History } from 'lucide-react';
import { toast } from '../../store/toastStore';
import AdminLogsDrawer from '../../components/admin/AdminLogsDrawer';

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

const categories = [
  { id: 'all', name: 'Tất cả' },
  { id: 'Apparel', name: 'Quần áo (Apparel)' },
  { id: 'Footwear', name: 'Giày dép (Footwear)' },
  { id: 'Accessories', name: 'Phụ kiện (Accessories)' },
];

const emptyForm = { name: '', price: '', originalPrice: '', category: 'Apparel', subCategory: '', description: '', stock: '', images: '' };

const inputStyle = {
  width: '100%', padding: '11px 14px',
  background: '#F8FAFF', border: '1.5px solid rgba(0,0,0,0.08)',
  borderRadius: '10px', fontSize: '13.5px', color: '#1E293B',
  outline: 'none', fontFamily: 'inherit',
  transition: 'all 0.2s',
  boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block', fontSize: '11px', fontWeight: 700,
  color: '#64748B', letterSpacing: '0.06em',
  textTransform: 'uppercase', marginBottom: '7px',
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
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

  const fetchProducts = useCallback(async (page = 0, q = '', cat = 'all', s = 'newest') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20, search: q, category: cat, sort: s });
      const res = await fetch(`${API}/api/products?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProducts(data.items || []);
      setTotal(data.total || 0);
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

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

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
      e.target.value = ''; // Reset file input
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
      stock: form.stock ? Number(form.stock) : 50,
      imagePath: form.images || '',
      gender: 'Unisex',
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
      fetchProducts(currentPage, search, filterCategory, sortType);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEdit = (p) => {
    setEditId(p.id);
    setForm({ name: p.productDisplayName, price: p.price, originalPrice: p.originalPrice, category: p.masterCategory, subCategory: p.subCategory || '', description: '', stock: p.stock, images: p.imagePath || '' });
    setOriginalImages(p.imagePath || '');
    setEditId(p.id);
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
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1E1B4B', letterSpacing: '-0.5px' }}>
            Danh sách sản phẩm
          </h1>
          <p style={{ fontSize: '13.5px', color: '#64748B', marginTop: '6px', fontWeight: 500 }}>
            Quản lý kho hàng và thông tin sản phẩm trong hệ thống
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                height: '42px', paddingLeft: '38px', paddingRight: '16px',
                background: 'white', border: '1px solid rgba(0,0,0,0.09)',
                borderRadius: '10px', fontSize: '13px', color: '#374151',
                outline: 'none', fontFamily: 'inherit', width: '240px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}
              onFocus={e => { e.target.style.borderColor = 'rgba(124,58,237,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.08)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(0,0,0,0.09)'; e.target.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; }}
            />
          </div>
          <button
            onClick={() => setIsLogsOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '10px 16px', borderRadius: '10px',
              background: 'white', border: '1px solid rgba(0,0,0,0.09)',
              fontSize: '13px', fontWeight: 700, color: '#475569',
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)', whiteSpace: 'nowrap',
            }}
          >
            <History size={15} strokeWidth={2.5} /> Lịch sử
          </button>
          <button
            onClick={() => { setShowForm(true); setForm(emptyForm); setEditId(null); }}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '10px 20px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
              fontSize: '13px', fontWeight: 700, color: 'white',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 4px 16px rgba(124,58,237,0.35)', whiteSpace: 'nowrap',
            }}
          >
            <Plus size={15} strokeWidth={2.5} /> Thêm sản phẩm
          </button>
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { label: 'Tổng sản phẩm', value: total.toLocaleString(), sub: 'Trong hệ thống', subColor: '#10B981', icon: '📦' },
          { label: 'Sắp hết hàng', value: products.filter(p => p.stock <= 10).length, sub: 'Cần nhập thêm', subColor: '#F59E0B', icon: '⚠️' },
          { label: 'Trang hiện tại', value: `${currentPage + 1}/${totalPages}`, sub: '20 SP mỗi trang', subColor: '#7C3AED', icon: '📄' },
          { label: 'Đánh giá TB', value: products.length ? (products.reduce((s,p)=>s+(p.rating||0),0)/products.length).toFixed(1)+' ⭐' : '—', sub: 'Trang này', subColor: '#64748B', icon: '🌟' },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            style={{
              background: 'white', borderRadius: '16px', padding: '20px 22px',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                {card.label}
              </p>
              <span style={{ fontSize: '20px' }}>{card.icon}</span>
            </div>
            <p style={{ fontSize: '26px', fontWeight: 900, color: '#1E1B4B', lineHeight: 1, letterSpacing: '-0.5px', marginBottom: '8px' }}>
              {card.value}
            </p>
            <p style={{ fontSize: '12px', fontWeight: 600, color: card.subColor }}>
              {card.sub}
            </p>
          </motion.div>
        ))}
      </div>

      {/* ── MODAL FORM ── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '16px',
              background: 'rgba(15,15,35,0.6)',
              backdropFilter: 'blur(8px)',
            }}
            onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              style={{
                background: 'white', borderRadius: '20px',
                width: '100%', maxWidth: '520px', padding: '32px',
                boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
                border: '1px solid rgba(124,58,237,0.1)',
              }}
            >
              {/* Modal header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
                <div>
                  <h2 style={{ fontSize: '19px', fontWeight: 800, color: '#1E1B4B', letterSpacing: '-0.3px' }}>
                    {editId ? '✏️ Chỉnh sửa sản phẩm' : '➕ Thêm sản phẩm mới'}
                  </h2>
                  <p style={{ fontSize: '13px', color: '#64748B', marginTop: '3px' }}>
                    {editId ? 'Cập nhật thông tin sản phẩm' : 'Điền thông tin sản phẩm mới'}
                  </p>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: '#F1F5F9', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#64748B',
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={labelStyle}>Tên sản phẩm *</label>
                  <input
                    name="name" required value={form.name} onChange={handleChange}
                    placeholder="VD: Áo Polo Premium Navy"
                    style={{
                      ...inputStyle,
                      borderColor: focusedInput === 'name' ? 'rgba(124,58,237,0.5)' : 'rgba(0,0,0,0.08)',
                      boxShadow: focusedInput === 'name' ? '0 0 0 3px rgba(124,58,237,0.1)' : 'none',
                    }}
                    onFocus={() => setFocusedInput('name')}
                    onBlur={() => setFocusedInput(null)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Giá bán (₫) *</label>
                    <input
                      name="price" type="number" required value={form.price} onChange={handleChange}
                      placeholder="325000"
                      style={{
                        ...inputStyle,
                        borderColor: focusedInput === 'price' ? 'rgba(124,58,237,0.5)' : 'rgba(0,0,0,0.08)',
                        boxShadow: focusedInput === 'price' ? '0 0 0 3px rgba(124,58,237,0.1)' : 'none',
                      }}
                      onFocus={() => setFocusedInput('price')}
                      onBlur={() => setFocusedInput(null)}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Giá gốc (₫)</label>
                    <input
                      name="originalPrice" type="number" value={form.originalPrice} onChange={handleChange}
                      placeholder="450000"
                      style={{
                        ...inputStyle,
                        borderColor: focusedInput === 'originalPrice' ? 'rgba(124,58,237,0.5)' : 'rgba(0,0,0,0.08)',
                        boxShadow: focusedInput === 'originalPrice' ? '0 0 0 3px rgba(124,58,237,0.1)' : 'none',
                      }}
                      onFocus={() => setFocusedInput('originalPrice')}
                      onBlur={() => setFocusedInput(null)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Danh mục</label>
                    <select
                      name="category" value={form.category} onChange={handleChange}
                      style={{
                        ...inputStyle, appearance: 'none', cursor: 'pointer',
                        borderColor: focusedInput === 'category' ? 'rgba(124,58,237,0.5)' : 'rgba(0,0,0,0.08)',
                      }}
                      onFocus={() => setFocusedInput('category')}
                      onBlur={() => setFocusedInput(null)}
                    >
                      {categories.filter(c => c.id !== 'all').map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Phân loại chi tiết (Tag 2)</label>
                    <input
                      name="subCategory" value={form.subCategory || ''} onChange={handleChange}
                      placeholder="VD: Áo thun, Váy, Đồng hồ..."
                      style={{
                        ...inputStyle,
                        borderColor: focusedInput === 'subCategory' ? 'rgba(124,58,237,0.5)' : 'rgba(0,0,0,0.08)',
                        boxShadow: focusedInput === 'subCategory' ? '0 0 0 3px rgba(124,58,237,0.1)' : 'none',
                      }}
                      onFocus={() => setFocusedInput('subCategory')}
                      onBlur={() => setFocusedInput(null)}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Tồn kho</label>
                    <input
                      name="stock" type="number" value={form.stock} onChange={handleChange}
                      placeholder="85"
                      style={{
                        ...inputStyle,
                        borderColor: focusedInput === 'stock' ? 'rgba(124,58,237,0.5)' : 'rgba(0,0,0,0.08)',
                        boxShadow: focusedInput === 'stock' ? '0 0 0 3px rgba(124,58,237,0.1)' : 'none',
                      }}
                      onFocus={() => setFocusedInput('stock')}
                      onBlur={() => setFocusedInput(null)}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '7px' }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>Ảnh sản phẩm</label>
                    {editId && form.images !== originalImages && (
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, images: originalImages }))}
                        style={{
                          fontSize: '11px', color: '#7C3AED', background: 'none', border: 'none',
                          cursor: 'pointer', fontWeight: 700, padding: 0
                        }}
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
                          flex: 1, padding: '8px 14px',
                          background: '#F8FAFF', border: '1.5px dashed rgba(0,0,0,0.2)',
                          borderRadius: '10px', fontSize: '13px', color: '#64748B',
                          cursor: 'pointer'
                        }}
                      />
                      <div style={{ fontSize: '12px', color: '#94A3B8', whiteSpace: 'nowrap' }}>
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
                              style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)' }}
                              onError={e => { e.target.src = 'https://placehold.co/48x48/f8fafc/94a3b8?text=Img'; }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newImages = form.images.split(',').filter(Boolean).filter((_, i) => i !== idx).join(',');
                                setForm({ ...form, images: newImages });
                              }}
                              style={{
                                position: 'absolute', top: '-6px', right: '-6px',
                                width: '18px', height: '18px', borderRadius: '50%',
                                background: '#EF4444', color: 'white', border: '2px solid white',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', fontSize: '10px', fontWeight: 'bold'
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

                <div style={{ display: 'flex', gap: '10px', paddingTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    style={{
                      flex: 1, padding: '13px',
                      background: '#F1F5F9', border: 'none',
                      borderRadius: '12px', fontSize: '13.5px', fontWeight: 700,
                      color: '#475569', cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    id="save-product-btn"
                    style={{
                      flex: 2, padding: '13px',
                      background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                      border: 'none', borderRadius: '12px',
                      fontSize: '13.5px', fontWeight: 700, color: 'white',
                      cursor: 'pointer', fontFamily: 'inherit',
                      boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                    }}
                  >
                    <Check size={16} strokeWidth={2.5} />
                    {editId ? 'Lưu thay đổi' : 'Thêm sản phẩm'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MAIN TABLE ── */}
      <div style={{
        background: 'white', borderRadius: '18px',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        overflow: 'hidden',
      }}>
        {/* Toolbar */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid rgba(0,0,0,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#FAFAFA',
        }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{ position: 'relative' }}>
              <Filter size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }} />
              <select 
                value={filterCategory} 
                onChange={e => setFilterCategory(e.target.value)}
                style={{
                  appearance: 'none', padding: '7px 28px 7px 28px', borderRadius: '8px',
                  background: 'white', border: '1px solid rgba(0,0,0,0.09)',
                  fontSize: '12px', fontWeight: 600, color: '#475569',
                  cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                {categories.map(c => <option key={c.id} value={c.id}>Lọc: {c.name}</option>)}
              </select>
            </div>
            
            <div style={{ position: 'relative' }}>
              <ArrowUpDown size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }} />
              <select 
                value={sortType} 
                onChange={e => setSortType(e.target.value)}
                style={{
                  appearance: 'none', padding: '7px 28px 7px 28px', borderRadius: '8px',
                  background: 'white', border: '1px solid rgba(0,0,0,0.09)',
                  fontSize: '12px', fontWeight: 600, color: '#475569',
                  cursor: 'pointer', fontFamily: 'inherit',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
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
          <p style={{ fontSize: '12.5px', color: '#94A3B8', fontWeight: 500 }}>
            {loading ? 'Đang tải...' : `${total} sản phẩm`}
          </p>
        </div>

        <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 140px)', minHeight: '650px', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr style={{ background: '#FAFAFA', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                {['Sản phẩm', 'Giá', 'Tồn kho', 'Đã bán', 'Tags', 'Thao tác'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '13px 20px',
                    fontSize: '11px', fontWeight: 700, color: '#94A3B8',
                    letterSpacing: '0.07em', textTransform: 'uppercase', whiteSpace: 'nowrap',
                    background: '#FAFAFA', // Đảm bảo background không bị trong suốt khi cuộn
                    boxShadow: 'inset 0 -1px 0 rgba(0,0,0,0.05)'
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ padding: '80px 0', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        style={{
                          width: '40px', height: '40px',
                          border: '4px solid rgba(124,58,237,0.1)',
                          borderTopColor: '#7C3AED',
                          borderRadius: '50%',
                        }}
                      />
                      <p style={{ fontSize: '14px', color: '#94A3B8', fontWeight: 600 }}>Đang tải danh sách sản phẩm...</p>
                    </div>
                  </td>
                </tr>
              ) : products.map((p, idx) => {
                const stockColor = p.stock > 10 ? '#10B981' : p.stock > 0 ? '#F59E0B' : '#EF4444';
                const stockBg = p.stock > 10 ? 'rgba(16,185,129,0.1)' : p.stock > 0 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)';
                const displayTags = [p.masterCategory, p.subCategory].filter(Boolean).slice(0, 2);

                return (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.04, 0.4) }}
                    style={{ borderBottom: '1px solid rgba(0,0,0,0.04)', transition: 'background 0.15s' }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#FDFDFF';
                      e.currentTarget.querySelector('.row-actions').style.opacity = '1';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.querySelector('.row-actions').style.opacity = '0';
                    }}
                  >
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '13px', minWidth: '260px' }}>
                        <div style={{
                          width: '48px', height: '48px', borderRadius: '12px',
                          overflow: 'hidden', border: '1px solid rgba(0,0,0,0.07)',
                          background: '#F8FAFC', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <img
                            src={getImageUrl(p.imagePath)} alt={p.productDisplayName}
                            style={{ maxWidth: '42px', maxHeight: '42px', objectFit: 'contain' }}
                            onError={e => { e.target.src = 'https://placehold.co/42x42/f8fafc/94a3b8?text=Img'; }}
                          />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontSize: '13.5px', fontWeight: 700, color: '#1E293B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                            {p.productDisplayName}
                          </p>
                          <p style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
                            {p.subCategory || p.masterCategory}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <p style={{ fontSize: '13.5px', fontWeight: 800, color: '#1E293B', whiteSpace: 'nowrap' }}>
                        ₫{formatPrice(p.price)}
                      </p>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '4px 10px', borderRadius: '8px',
                        background: stockBg, fontSize: '12.5px', fontWeight: 700, color: stockColor,
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: stockColor }} />
                        {p.stock}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '13px', color: '#475569', fontWeight: 600 }}>
                      {(p.sold ?? 0).toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        {displayTags.map((t) => (
                          <span key={t} style={{
                            fontSize: '10px', fontWeight: 700,
                            background: 'rgba(124,58,237,0.08)', color: '#7C3AED',
                            padding: '3px 8px', borderRadius: '6px',
                            letterSpacing: '0.04em',
                          }}>
                            #{t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div className="row-actions" style={{ display: 'flex', gap: '6px', opacity: 0, transition: 'opacity 0.2s' }}>
                        <button
                          onClick={() => handleEdit(p)}
                          style={{
                            width: '32px', height: '32px', borderRadius: '8px',
                            background: 'white', border: '1px solid rgba(0,0,0,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: '#475569', transition: 'all 0.2s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#F8F4FF'; e.currentTarget.style.color = '#7C3AED'; e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'; }}
                        >
                          <Edit2 size={13} strokeWidth={2.5} />
                        </button>

                        {deleteConfirm === p.id ? (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              onClick={() => handleDelete()}
                              style={{
                                width: '32px', height: '32px', borderRadius: '8px',
                                background: '#EF4444', border: 'none',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', color: 'white',
                              }}
                            >
                              <Check size={13} strokeWidth={2.5} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              style={{
                                width: '32px', height: '32px', borderRadius: '8px',
                                background: 'white', border: '1px solid rgba(0,0,0,0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', color: '#64748B',
                              }}
                            >
                              <X size={13} strokeWidth={2.5} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(p.id)}
                            style={{
                              width: '32px', height: '32px', borderRadius: '8px',
                              background: 'white', border: '1px solid rgba(0,0,0,0.1)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', color: '#94A3B8', transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#FFF1F1'; e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.1)'; }}
                          >
                            <Trash2 size={13} strokeWidth={2.5} />
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
              <p style={{ fontSize: '15px', color: '#94A3B8', fontWeight: 500 }}>Không tìm thấy sản phẩm nào.</p>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div style={{
            padding: '14px 24px',
            borderTop: '1px solid rgba(0,0,0,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: '#FAFAFA',
          }}>
            <button
              onClick={() => fetchProducts(currentPage - 1, search)}
              disabled={currentPage === 0}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '7px 14px', borderRadius: '8px',
                background: 'white', border: '1px solid rgba(0,0,0,0.09)',
                fontSize: '12.5px', fontWeight: 600, color: currentPage === 0 ? '#CBD5E1' : '#475569',
                cursor: currentPage === 0 ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              }}>
              <ChevronLeft size={16} /> Trước
            </button>
            <div style={{ display: 'flex', gap: '4px' }}>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pg = totalPages <= 5 ? i : Math.max(0, Math.min(currentPage - 2, totalPages - 5)) + i;
                return (
                  <button key={pg}
                    onClick={() => fetchProducts(pg, search)}
                    style={{
                      width: '34px', height: '34px', borderRadius: '8px',
                      background: pg === currentPage ? 'linear-gradient(135deg, #7C3AED, #4F46E5)' : 'white',
                      border: pg === currentPage ? 'none' : '1px solid rgba(0,0,0,0.09)',
                      fontSize: '13px', fontWeight: 700,
                      color: pg === currentPage ? 'white' : '#475569',
                      cursor: 'pointer', fontFamily: 'inherit',
                      boxShadow: pg === currentPage ? '0 2px 8px rgba(124,58,237,0.3)' : 'none',
                    }}>{pg + 1}</button>
                );
              })}
            </div>
            <button
              onClick={() => fetchProducts(currentPage + 1, search)}
              disabled={currentPage >= totalPages - 1}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '7px 14px', borderRadius: '8px',
                background: 'white', border: '1px solid rgba(0,0,0,0.09)',
                fontSize: '12.5px', fontWeight: 600,
                color: currentPage >= totalPages - 1 ? '#CBD5E1' : '#475569',
                cursor: currentPage >= totalPages - 1 ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              }}>
              Sau <ChevronRight size={16} />
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
    </div>
  );
}
