import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, X, ChevronDown, Camera, Loader2 } from 'lucide-react';
import axios from 'axios';
import { getProducts, allCategories, reverseTranslateSearch } from '../../data/fashionData';
import ProductCard from '../../components/ui/ProductCard';

// ─── CONSTANTS ────────────────────────────────────────
const PAGE_SIZE = 20;

const sortOptions = [
  { label: 'Mới nhất', value: 'newest' },
  { label: 'Giá tăng dần', value: 'price-asc' },
  { label: 'Giá giảm dần', value: 'price-desc' },
  { label: 'Bán chạy nhất', value: 'best-seller' },
  { label: 'Đánh giá cao', value: 'rating' },
];

const priceRanges = [
  { label: 'Tất cả', min: 0, max: Infinity },
  { label: 'Dưới 200K', min: 0, max: 200000 },
  { label: '200K - 500K', min: 200000, max: 500000 },
  { label: '500K - 1 triệu', min: 500000, max: 1000000 },
  { label: 'Trên 1 triệu', min: 1000000, max: Infinity },
];

// ─── SKELETON CARD ────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-sm border-2 border-slate-100 overflow-hidden animate-pulse">
      <div className="aspect-[3/4] bg-gradient-to-br from-slate-100 to-slate-200" />
      <div className="p-3 space-y-2">
        <div className="h-2.5 bg-slate-200 rounded w-1/3" />
        <div className="h-3.5 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
        <div className="pt-2 border-t border-slate-100">
          <div className="h-4 bg-gradient-to-r from-slate-200 to-slate-100 rounded w-2/5" />
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ────────────────────────────────────
export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter state
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

  const activeCategory = searchParams.get('category') || 'all';
  const activeGender = searchParams.get('gender') || 'all';

  // Pagination state
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isInitial, setIsInitial] = useState(true);

  // Infinite scroll sentinel ref
  const sentinelRef = useRef(null);
  const observerRef = useRef(null);

  // ─── LOAD PRODUCTS ──────────────────────────────────
  const loadProducts = useCallback(async (pg, reset = false) => {
    setLoading(true);
    const range = priceRanges[priceRange];

    try {
      // 1. Thử gọi API thật từ Spring Boot Backend
      const response = await axios.get('https://datn-webfss.onrender.com/api/products', {
        params: {
          page: pg,
          limit: PAGE_SIZE,
          category: activeCategory,
          gender: activeGender,
          search: reverseTranslateSearch(search),
          sort: sortBy,
          minPrice: range.min.toString(),
          maxPrice: (range.max === Infinity ? 999999999 : range.max).toString()
        }
      });

      let finalItems = response.data.items;
      
      // Lọc lại trên frontend để loại bỏ các kết quả false-positive do LIKE query của backend
      // Ví dụ: tìm "nhẫn" -> "ring", backend LIKE '%ring%' trả về cả áo "Ringer"
      if (search && search.trim()) {
        const q = search.toLowerCase().trim();
        const { translateName, translate } = await import('../../data/fashionData');
        finalItems = finalItems.filter(p => {
          const tName = translateName(p).toLowerCase();
          return tName.includes(q) || 
                 (p.category && translate(p.category).toLowerCase().includes(q));
        });
      }

      setProducts(finalItems);
      setTotal(response.data.total);
      setHasMore(response.data.hasMore);

    } catch (error) {
      // 2. Fallback sang JSON Mock nếu backend server chưa bật
      console.warn('Backend API không phản hồi, đang dùng dữ liệu local (JSON)...', error.message);

      const result = getProducts({
        page: pg,
        limit: PAGE_SIZE,
        category: activeCategory,
        gender: activeGender,
        search: search,
        sort: sortBy,
        minPrice: range.min,
        maxPrice: range.max === Infinity ? 999999999 : range.max,
      });

      setProducts(result.items);
      setTotal(result.total);
      setHasMore(result.hasMore);
    } finally {
      setLoading(false);
      setIsInitial(false);
    }
  }, [activeCategory, activeGender, search, sortBy, priceRange]);

  // ─── RESET ON FILTER CHANGE ─────────────────────────
  useEffect(() => {
    setIsInitial(true);
    setPage(0);
    setProducts([]);
    setHasMore(true);
    loadProducts(0, true);
  }, [activeCategory, activeGender, search, sortBy, priceRange]); // eslint-disable-line

  // ─── LOAD MORE WHEN PAGE CHANGES ────────────────────
  useEffect(() => {
    if (isInitial) return;
    loadProducts(page, false);
  }, [page]); // eslint-disable-line

  // BỎ LƯỢC ĐOẠN INFINITE SCROLL Ở ĐÂY VÌ ĐÃ SỬ DỤNG PHÂN TRANG BUTTON

  // ─── HANDLERS ────────────────────────────────────────
  const setCategory = (slug) => {
    const params = new URLSearchParams(searchParams);
    if (slug === 'all') params.delete('category');
    else params.set('category', slug);
    setSearchParams(params);
  };

  const setGender = (slug) => {
    const params = new URLSearchParams(searchParams);
    if (slug === 'all') params.delete('gender');
    else params.set('gender', slug);
    setSearchParams(params);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const clearFilters = () => {
    setPriceRange(0);
    setSortBy('newest');
    setSearch('');
    setSearchInput('');
  };

  // ─── RENDER ──────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8FAFC] page-enter font-sans relative z-0">
      {/* Background ambient */}
      <div className="absolute top-0 left-0 right-0 h-[500px] overflow-hidden -z-10 bg-white pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-[#00168d]/5 blur-[120px]" />
        <div className="absolute top-20 -left-20 w-[500px] h-[500px] rounded-full bg-[#7c3aed]/5 blur-[100px]" />
      </div>

      {/* ── HEADER ── */}
      <div className="relative pt-12 pb-6 lg:pt-16 lg:pb-8 border-b border-slate-200/60 bg-white shadow-[0_4px_40px_rgba(0,0,0,0.02)]">
        <div className="layout-page">
          <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-8">
            <style>
              {`@import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');`}
            </style>
            <div>
              <motion.h1
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="text-5xl lg:text-6xl mb-2 pt-2"
                style={{ fontFamily: "'Great Vibes', cursive", color: '#1e293b', lineHeight: '1.2', paddingRight: '10px' }}
              >
                Khám phá sản phẩm
              </motion.h1>
              <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                {loading && <Loader2 size={14} className="animate-spin text-primary" />}
                {total > 0 ? `${total.toLocaleString('vi-VN')} sản phẩm` : (loading ? 'Đang truy xuất...' : '0 sản phẩm')}
              </p>
            </div>
          </div>

          {/* Search + Controls */}
          {/* Category Tabs move inside controls for a cleaner row layout */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 lg:max-w-[300px] group">
              <div className="absolute inset-0 bg-gradient-to-r from-[#00168d] to-[#7c3aed] rounded-sm blur-md opacity-0 group-focus-within:opacity-20 transition-opacity duration-300" />
              <div className="relative flex items-center bg-white border-2 border-slate-200 rounded-sm focus-within:border-[#00168d] transition-all duration-300 shadow-sm overflow-hidden">
                <div className="pl-4 pr-3 flex items-center justify-center shrink-0">
                  <Search size={18} className="text-slate-400 group-focus-within:text-[#00168d] transition-colors" />
                </div>
                <input
                  id="product-search"
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(e)}
                  className="w-full bg-transparent pr-4 py-3.5 text-[14px] font-bold text-slate-700 outline-none placeholder:font-semibold placeholder:text-slate-400"
                />
              </div>
            </form>

            <div className="flex flex-wrap lg:flex-nowrap items-center gap-4 w-full lg:w-auto">


              {/* Sort */}
              <div className="relative flex-1 lg:flex-none lg:min-w-[160px] group">
                <div className="relative flex items-center bg-white border-2 border-slate-200 rounded-sm hover:border-slate-300 transition-colors shadow-sm">
                  <select
                    id="sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-transparent pl-4 pr-10 py-3.5 text-[14px] font-bold text-slate-700 appearance-none cursor-pointer outline-none antialiased"
                  >
                    {sortOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex-1 lg:flex-none flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-sm font-bold text-[12px] uppercase tracking-wider transition-all duration-300 border-2 ${showFilters
                    ? 'bg-slate-800 text-white border-slate-800 shadow-md'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-800 shadow-sm'
                  } antialiased`}
              >
                <SlidersHorizontal size={14} />
                <span className="hidden sm:inline">Bộ lọc</span>
              </button>

              <Link
                to="/visual-search"
                className="flex-1 lg:flex-none flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-sm font-bold text-[12px] uppercase tracking-wider transition-all duration-300 border-2 border-[#00168d] bg-transparent text-[#00168d] hover:bg-[#00168d] hover:text-white hover:-translate-y-0.5 shadow-sm antialiased"
              >
                <Camera size={14} />
                <span className="hidden sm:inline">Tìm ảnh</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="layout-page py-10 lg:py-16 flex gap-10 items-start">
        {/* Sidebar Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.aside
              initial={{ opacity: 0, x: -20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: '260px' }}
              exit={{ opacity: 0, x: -20, width: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="hidden lg:block shrink-0 overflow-hidden"
            >
              <div className="w-[260px] bg-white border-2 border-slate-100/60 rounded-sm p-6 sticky top-28 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
                <div className="mb-8">
                  <h3 className="font-black text-[15px] uppercase tracking-wider text-slate-800 mb-1.5 flex items-center gap-2">
                    <SlidersHorizontal size={16} className="text-[#00168d]" />
                    Bộ lọc
                  </h3>
                  <div className="h-[2px] w-12 bg-gradient-to-r from-[#00168d] to-[#7c3aed] rounded-full" />
                </div>

                {/* Category Filters */}
                <div className="mb-8 pb-8 border-b border-slate-100">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4">Danh mục</p>
                  <div className="space-y-3.5">
                    {allCategories.map((cat) => (
                      <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
                        <div
                          onClick={() => setCategory(cat.slug)}
                          className={`w-4 h-4 flex items-center justify-center border-[2px] rounded-sm transition-all cursor-pointer ${activeCategory === cat.slug ? 'border-[#00168d] bg-[#00168d]' : 'border-slate-300 group-hover:border-[#00168d]'
                            }`}
                        >
                          {activeCategory === cat.slug && <div className="w-1.5 h-1.5 bg-white rounded-[1px]" />}
                        </div>
                        <span
                          onClick={() => setCategory(cat.slug)}
                          className={`text-[13px] font-bold transition-colors cursor-pointer ${activeCategory === cat.slug ? 'text-[#00168d]' : 'text-slate-600 group-hover:text-slate-800'
                            }`}
                        >
                          {cat.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Ranges */}
                <div className="mb-8 pb-8 border-b border-slate-100">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4">Khoảng giá</p>
                  <div className="space-y-3.5">
                    {priceRanges.map((range, i) => (
                      <label key={i} className="flex items-center gap-3 cursor-pointer group">
                        <div
                          onClick={() => setPriceRange(i)}
                          className={`w-4 h-4 flex items-center justify-center border-[2px] rounded-sm transition-all cursor-pointer ${priceRange === i ? 'border-[#00168d] bg-[#00168d]' : 'border-slate-300 group-hover:border-[#00168d]'
                            }`}
                        >
                          {priceRange === i && <div className="w-1.5 h-1.5 bg-white rounded-[1px]" />}
                        </div>
                        <span
                          onClick={() => setPriceRange(i)}
                          className={`text-[13px] font-bold transition-colors cursor-pointer ${priceRange === i ? 'text-[#00168d]' : 'text-slate-600 group-hover:text-slate-800'
                            }`}
                        >
                          {range.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Gender Filters */}
                <div className="mb-8 pb-8 border-b border-slate-100">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4">Giới tính</p>
                  <div className="space-y-3.5">
                    {[
                      { id: 'all', label: 'Tất cả' },
                      { id: 'Men', label: 'Nam' },
                      { id: 'Women', label: 'Nữ' },
                      { id: 'Unisex', label: 'Unisex' }
                    ].map((genderObj) => (
                      <label key={genderObj.id} className="flex items-center gap-3 cursor-pointer group">
                        <div
                          onClick={() => setGender(genderObj.id)}
                          className={`w-4 h-4 flex items-center justify-center border-[2px] rounded-sm transition-all cursor-pointer ${activeGender === genderObj.id ? 'border-[#00168d] bg-[#00168d]' : 'border-slate-300 group-hover:border-[#00168d]'
                            }`}
                        >
                          {activeGender === genderObj.id && <div className="w-1.5 h-1.5 bg-white rounded-[1px]" />}
                        </div>
                        <span
                          onClick={() => setGender(genderObj.id)}
                          className={`text-[13px] font-bold transition-colors cursor-pointer ${activeGender === genderObj.id ? 'text-[#00168d]' : 'text-slate-600 group-hover:text-slate-800'
                            }`}
                        >
                          {genderObj.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="mb-8 pb-8 border-b border-slate-100">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4">Thống kê</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-[12px] text-slate-500">Đang hiển thị</span>
                      <span className="text-[12px] font-black text-[#00168d]">{products.length} / {total}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div
                        className="bg-gradient-to-r from-[#00168d] to-[#7c3aed] h-1.5 rounded-full transition-all duration-500"
                        style={{ width: total > 0 ? `${(products.length / total) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={clearFilters}
                  className="w-full py-3.5 bg-slate-50 text-slate-500 text-[11px] font-black uppercase tracking-wider rounded-sm border-2 border-slate-200 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                >
                  Xóa bộ lọc
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Products Grid */}
        <div className="flex-1 min-w-0">
          {/* Loading Overlay for page changes - Nâng cấp sang trọng hơn */}
          <AnimatePresence>
            {loading && !isInitial && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-white/60 backdrop-blur-md z-50 flex flex-col items-center justify-center transition-all"
              >
                <div className="relative flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="absolute w-24 h-24 bg-[#00168d]/5 rounded-full"
                  />
                  <Loader2 size={48} className="animate-spin text-[#00168d] stroke-[1.5px]" />
                </div>
                <motion.span
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="mt-6 text-[11px] font-black uppercase tracking-[0.3em] text-[#00168d]"
                >
                  Đang truy cập bộ sưu tập
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Initial skeleton */}
          {isInitial && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {/* Empty state - Nội dung siêu nhỏ gọn và tinh tế */}
          {!isInitial && products.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full bg-white border-2 border-dashed border-slate-200 rounded-sm py-48 lg:py-72 flex flex-col items-center justify-center text-center shadow-sm min-h-[600px]"
            >
              <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-sm flex items-center justify-center mb-5 shadow-sm">
                <Search size={24} className="text-slate-300" />
              </div>
              <h3 className="text-[18px] font-black text-slate-800 mb-1.5 uppercase tracking-tight">Không tìm thấy sản phẩm</h3>
              <p className="text-[12px] font-medium text-slate-500 mb-6 max-w-[280px]">
                Rất tiếc, chúng tôi không tìm thấy lựa chọn nào phù hợp.
              </p>
            </motion.div>
          )}

          {/* Product grid */}
          {!isInitial && products.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            >
              {products.map((p, i) => (
                <motion.div
                  key={`${p.id}-${i}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i % PAGE_SIZE, 8) * 0.04, duration: 0.3 }}
                >
                  <ProductCard product={p} />
                </motion.div>
              ))}

              {/* Inline skeleton rows when loading more */}
              {loading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonCard key={`skeleton-${i}`} />
                ))}
            </motion.div>
          )}

          {/* ─── Numeric Pagination ─── */}
          {total > PAGE_SIZE && !isInitial && (
            <div className="flex justify-center items-center gap-2 mt-12 pb-12">
              <button
                disabled={page === 0}
                onClick={() => {
                  setPage(page - 1);
                  window.scrollTo({ top: 300, behavior: 'smooth' });
                }}
                className="w-10 h-10 flex border-2 items-center justify-center rounded-sm font-black text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
              >
                &lt;
              </button>

              {Array.from({ length: Math.ceil(total / PAGE_SIZE) }).map((_, i) => {
                const totalPages = Math.ceil(total / PAGE_SIZE);
                if (totalPages > 7) {
                  if (i !== 0 && i !== totalPages - 1 && Math.abs(page - i) > 1) {
                    if (Math.abs(page - i) === 2) return <span key={i} className="text-slate-400 px-1">...</span>;
                    return null;
                  }
                }
                return (
                  <button
                    key={i}
                    onClick={() => {
                      setPage(i);
                      window.scrollTo({ top: 300, behavior: 'smooth' });
                    }}
                    className={`w-10 h-10 flex border-2 items-center justify-center rounded-sm font-black transition-all ${page === i
                        ? 'border-[#00168d] bg-[#00168d] text-white shadow-md shadow-[#00168d]/20'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                  >
                    {i + 1}
                  </button>
                )
              })}

              <button
                disabled={!hasMore}
                onClick={() => {
                  setPage(page + 1);
                  window.scrollTo({ top: 300, behavior: 'smooth' });
                }}
                className="w-10 h-10 flex border-2 items-center justify-center rounded-sm font-black text-slate-600 disabled:opacity-50 hover:bg-slate-50 transition-colors"
              >
                &gt;
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
