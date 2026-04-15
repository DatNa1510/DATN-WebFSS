import { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, SlidersHorizontal, X, Camera, ChevronDown, ArrowRight } from 'lucide-react';
import { products, categories, formatPrice } from '../../data/mockData';
import ProductCard from '../../components/ui/ProductCard';

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

const sizesAll = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '29', '30', '31', '32', '33', '34'];

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState('newest');
  const [priceRange, setPriceRange] = useState(0);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState(searchParams.get('search') || '');

  const activeCategory = searchParams.get('category') || 'all';

  const setCategory = (slug) => {
    const params = new URLSearchParams(searchParams);
    if (slug === 'all') params.delete('category');
    else params.set('category', slug);
    setSearchParams(params);
  };

  const toggleSize = (s) =>
    setSelectedSizes((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const filtered = useMemo(() => {
    let list = [...products];

    if (activeCategory !== 'all') list = list.filter((p) => p.category === activeCategory);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.tags.some((t) => t.includes(q)) ||
        p.description.toLowerCase().includes(q)
      );
    }

    const range = priceRanges[priceRange];
    list = list.filter((p) => p.price >= range.min && p.price <= range.max);

    if (selectedSizes.length > 0) {
      list = list.filter((p) => selectedSizes.some((s) => p.sizes.includes(s)));
    }

    switch (sortBy) {
      case 'price-asc': list.sort((a, b) => a.price - b.price); break;
      case 'price-desc': list.sort((a, b) => b.price - a.price); break;
      case 'best-seller': list.sort((a, b) => b.sold - a.sold); break;
      case 'rating': list.sort((a, b) => b.rating - a.rating); break;
      default: list.sort((a, b) => b.id - a.id);
    }

    return list;
  }, [activeCategory, search, sortBy, priceRange, selectedSizes]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] page-enter font-sans relative z-0">
      {/* Background ambient light */}
      <div className="absolute top-0 left-0 right-0 h-[500px] overflow-hidden -z-10 bg-white pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-[#00168d]/5 blur-[120px]" />
        <div className="absolute top-20 -left-20 w-[500px] h-[500px] rounded-full bg-[#7c3aed]/5 blur-[100px]" />
      </div>

      {/* Header */}
      <div className="relative pt-12 pb-6 lg:pt-16 lg:pb-8 border-b border-slate-200/60 bg-white shadow-[0_4px_40px_rgba(0,0,0,0.02)] transition-all">
        <div className="layout-page">
          <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-8">
            <style>
              {`@import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Great+Vibes&display=swap');`}
            </style>
            <div>
              <motion.h1
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="text-5xl lg:text-6xl mb-2 pt-2"
                style={{
                  fontFamily: "'Great Vibes', cursive",
                  color: '#1e293b',
                  lineHeight: '1.2',
                  paddingRight: '10px'
                }}
              >
                Khám phá sản phẩm
              </motion.h1>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 lg:max-w-md group">
              <div className="absolute inset-0 bg-gradient-to-r from-[#00168d] to-[#7c3aed] rounded-sm blur-md opacity-0 group-focus-within:opacity-20 transition-opacity duration-300" />
              <div className="relative flex items-center bg-white border-2 border-slate-200 rounded-sm focus-within:border-[#00168d] transition-all duration-300 shadow-sm overflow-hidden">
                <div className="pl-4 pr-3 flex items-center justify-center shrink-0">
                  <Search size={18} className="text-slate-400 group-focus-within:text-[#00168d] transition-colors" />
                </div>
                <input
                  id="product-search"
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-transparent pr-4 py-4 text-[15px] font-bold text-slate-700 outline-none placeholder:font-semibold placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap lg:flex-nowrap items-center gap-4 w-full lg:w-auto">
              {/* Info Text moved here */}
              <motion.p 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-[15px] font-black text-slate-500 whitespace-nowrap hidden xl:block"
              >
                Hiển thị {filtered.length} sản phẩm <span className="mx-1.5 opacity-30">|</span> {activeCategory !== 'all' ? categories.find(c => c.slug === activeCategory)?.name : 'Tất cả'}
              </motion.p>

              {/* Sort */}
              <div className="relative flex-1 lg:flex-none lg:min-w-[180px] group">
                <div className="absolute inset-0 bg-slate-200 blur opacity-0 group-hover:opacity-50 transition-opacity" />
                <div className="relative flex items-center bg-white border-2 border-slate-200 rounded-sm hover:border-slate-300 transition-colors shadow-sm">
                  <select
                    id="sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-transparent pl-5 pr-12 py-4 text-[15px] font-black text-slate-700 appearance-none cursor-pointer outline-none"
                  >
                    {sortOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3.5 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex-1 lg:flex-none flex items-center justify-center gap-2.5 px-6 py-4 rounded-sm font-black text-[13px] uppercase tracking-widest transition-all duration-300 border-2 ${showFilters
                    ? 'bg-slate-800 text-white border-slate-800 shadow-md transform hover:-translate-y-0.5'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-800 hover:-translate-y-0.5 shadow-sm'
                  }`}
              >
                <SlidersHorizontal size={16} />
                <span className="hidden sm:inline">Bộ lọc</span>
              </button>

              <Link
                to="/visual-search"
                className="flex-1 lg:flex-none flex items-center justify-center gap-2.5 px-6 py-4 rounded-sm font-black text-[13px] uppercase tracking-widest transition-all duration-300 border-2 border-[#00168d] bg-transparent text-[#00168d] hover:bg-[#00168d] hover:text-white hover:-translate-y-0.5 shadow-sm"
              >
                <Camera size={16} />
                <span className="hidden sm:inline">Tìm ảnh</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

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
              <div className="w-[260px] bg-white border-2 border-slate-100/60 rounded-sm p-6 sticky top-48 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
                <div className="mb-8">
                  <h3 className="font-black text-[15px] uppercase tracking-wider text-slate-800 mb-1.5 flex items-center gap-2">
                    <SlidersHorizontal size={16} className="text-[#00168d]" />
                    Bộ lọc
                  </h3>
                  <div className="h-[2px] w-12 bg-gradient-to-r from-[#00168d] to-[#7c3aed] rounded-full" />
                </div>

                {/* Price Ranges */}
                <div className="mb-8 pb-8 border-b border-slate-100">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] mb-4">Khoảng giá</p>
                  <div className="space-y-3.5">
                    {priceRanges.map((range, i) => (
                      <label key={i} className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-4 h-4 flex items-center justify-center border-[2px] rounded-sm transition-all ${priceRange === i ? 'border-[#00168d] bg-[#00168d]' : 'border-slate-300 group-hover:border-[#00168d]'}`}>
                          {priceRange === i && <motion.div layoutId="checkPrice" className="w-1.5 h-1.5 bg-white rounded-[1px]" />}
                        </div>
                        <span className={`text-[13px] font-bold transition-colors ${priceRange === i ? 'text-[#00168d]' : 'text-slate-600 group-hover:text-slate-800'}`}>{range.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Sizes */}
                <div className="mb-8 pb-8 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">Kích cỡ</p>
                    {selectedSizes.length > 0 && (
                      <button
                        onClick={() => setSelectedSizes([])}
                        className="text-[10px] font-bold text-red-500 hover:text-red-700 hover:underline"
                      >
                        XÓA
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sizesAll.map((s) => {
                      const isActive = selectedSizes.includes(s);
                      return (
                        <button
                          key={s}
                          onClick={() => toggleSize(s)}
                          className={`min-w-[42px] px-2 py-2 text-[12px] font-black uppercase rounded-sm border-2 transition-all ${isActive
                              ? 'bg-gradient-to-br from-[#00168d] to-[#7c3aed] border-transparent text-white shadow-md'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800'
                            }`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Clear All */}
                <button
                  onClick={() => { setPriceRange(0); setSelectedSizes([]); setSearch(''); }}
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
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border-2 border-dashed border-slate-200 rounded-sm py-28 flex flex-col items-center justify-center text-center shadow-sm"
            >
              <div className="w-20 h-20 bg-slate-50 border-2 border-slate-100 rounded-sm flex items-center justify-center mb-6 shadow-sm">
                <Search size={32} className="text-slate-300" />
              </div>
              <h3 className="text-[20px] font-black text-slate-800 mb-2">Không tìm thấy sản phẩm</h3>
              <p className="text-[13px] font-medium text-slate-500 mb-8 max-w-sm">
                Rất tiếc, chúng tôi không tìm thấy lựa chọn nào phù hợp. Vui lòng thử lại với tiêu chí tìm kiếm khác.
              </p>
              <button
                onClick={() => { setPriceRange(0); setSelectedSizes([]); setSearch(''); }}
                className="px-8 py-3.5 bg-slate-800 text-white text-[12px] font-black uppercase tracking-[0.1em] rounded-sm hover:-translate-y-0.5 transition-all outline-none"
              >
                Hiển thị tất cả
              </button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
            >
              {filtered.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                >
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
