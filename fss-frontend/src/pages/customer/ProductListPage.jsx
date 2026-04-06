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
    <div className="min-h-screen bg-white page-enter">
      {/* Header */}
      <div className="border-b border-border bg-gradient-to-b from-primary-50 to-white">
        <div className="layout-page py-16 lg:py-20">
          <div className="mb-10">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display text-foreground mb-3">
              Khám phá sản phẩm
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              {filtered.length} sản phẩm tìm thấy
              {activeCategory !== 'all' && ` trong danh mục "${categories.find(c => c.slug === activeCategory)?.name || activeCategory}"`}
            </p>
          </div>

          {/* Search & Controls */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 mb-12">
            {/* Search Input - Full Width on Mobile */}
            <div className="relative flex-1 lg:flex-none lg:w-80">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                id="product-search"
                type="text"
                placeholder="Nhập tên sản phẩm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-premium w-full !pl-14 pr-4 py-3 text-sm rounded-sm"
              />
            </div>

            {/* Right Controls Wrapper */}
            <div className="flex items-stretch gap-3 w-full lg:w-auto">
              {/* Sort Dropdown */}
              <div className="relative flex-1 lg:flex-none lg:min-w-max">
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="input-premium pl-4 pr-10 py-3 text-sm appearance-none cursor-pointer rounded-sm bg-white w-full"
                >
                  {sortOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>

              {/* Filter Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                id="filter-btn"
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center justify-center gap-2 px-5 py-3 rounded-sm font-semibold text-sm transition-all whitespace-nowrap ${
                  showFilters
                    ? 'bg-primary text-white shadow-soft'
                    : 'bg-surface-secondary text-foreground border border-border hover:border-primary'
                }`}
              >
                <SlidersHorizontal size={16} strokeWidth={2} />
                <span className="hidden sm:inline">Bộ lọc</span>
              </motion.button>

              {/* Visual Search */}
              <Link
                to="/visual-search"
                className="flex items-center justify-center gap-2 px-5 py-3 bg-primary-50 text-primary rounded-sm text-sm font-semibold hover:bg-primary-100 transition-colors border border-primary-200 whitespace-nowrap"
              >
                <Camera size={16} strokeWidth={2} />
                <span className="hidden sm:inline">Tìm ảnh</span>
              </Link>
            </div>
          </div>


        </div>
      </div>

      <div className="layout-page py-20 lg:py-28 flex gap-12 overflow-hidden">
        {/* Sidebar Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.aside
              initial={{ opacity: 0, x: -30, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 'auto' }}
              exit={{ opacity: 0, x: -30, width: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="hidden lg:block w-64 shrink-0"
            >
              <div className="card-elevated p-6 sticky top-24 space-y-7">
                <div>
                  <h3 className="font-bold text-lg text-foreground mb-1">Bộ lọc</h3>
                  <p className="text-xs text-muted-foreground">Tinh chỉnh kết quả tìm kiếm</p>
                </div>

                {/* Price Ranges */}
                <div className="pb-6 border-b border-border">
                  <p className="text-xs font-bold text-muted uppercase tracking-wider mb-4">Khoảng giá</p>
                  <div className="space-y-2">
                    {priceRanges.map((range, i) => (
                      <label key={i} className="flex items-center gap-3 py-2 cursor-pointer hover:text-primary transition-colors">
                        <input
                          type="radio"
                          name="price"
                          checked={priceRange === i}
                          onChange={() => setPriceRange(i)}
                          className="w-4 h-4 accent-primary cursor-pointer"
                        />
                        <span className="text-sm text-foreground">{range.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Sizes */}
                <div className="pb-6 border-b border-border">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold text-muted uppercase tracking-wider">Size</p>
                    {selectedSizes.length > 0 && (
                      <button
                        onClick={() => setSelectedSizes([])}
                        className="text-xs font-semibold text-primary hover:text-primary-700 transition-colors"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sizesAll.map((s) => (
                      <button
                        key={s}
                        onClick={() => toggleSize(s)}
                        className={`px-3 py-2 text-xs font-semibold rounded-sm border transition-all ${
                          selectedSizes.includes(s)
                            ? 'bg-primary text-white border-primary shadow-soft'
                            : 'border-border text-foreground hover:border-primary hover:text-primary'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clear All */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setPriceRange(0); setSelectedSizes([]); setSearch(''); }}
                  className="w-full py-3 text-sm font-semibold text-error bg-error-light border-2 border-error-light rounded-sm hover:bg-error/10 transition-all"
                >
                  ✕ Xóa tất cả bộ lọc
                </motion.button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Products Grid */}
        <div className="flex-1 min-w-0">
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-32 lg:py-48 flex flex-col items-center justify-center"
            >
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="mb-8"
              >
                <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="mx-auto">
                  {/* Search circle */}
                  <motion.circle
                    cx="45" cy="45" r="40"
                    stroke="url(#gradient)" strokeWidth="3" fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  {/* Search handle */}
                  <motion.line
                    x1="72" y1="72" x2="100" y2="100"
                    stroke="url(#gradient)" strokeWidth="4" strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
                  />
                  {/* Question mark inside */}
                  <text x="45" y="55" fontSize="32" fontWeight="bold" textAnchor="middle" fill="url(#gradient)" fontFamily="Arial">?</text>
                  
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00168D" />
                      <stop offset="100%" stopColor="#1E3B87" />
                    </linearGradient>
                  </defs>
                </svg>
              </motion.div>
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">Không tìm thấy sản phẩm</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-8 max-w-md mx-auto">
                Thử lại với từ khóa khác hoặc điều chỉnh bộ lọc của bạn
              </p>
              <Link
              to="/products"
              className="inline-flex items-center gap-4 px-14 py-6 bg-primary text-white font-bold text-sm uppercase tracking-wider rounded-none hover:bg-primary-700 hover:shadow-elevation transition-all group shadow-soft"
            >
              Xem tất cả sản phẩm
              <ArrowRight size={20} strokeWidth={2.5} className="group-hover:translate-x-2 transition-transform" />
            </Link>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
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
