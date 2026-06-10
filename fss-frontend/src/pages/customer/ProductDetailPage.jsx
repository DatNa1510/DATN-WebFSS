import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ShoppingBag, Heart, Shield, Truck, RefreshCw, Sparkles, Check, ArrowRight, Info, Cpu, Loader2 } from 'lucide-react';
import axios from 'axios';
import { API_BASE } from '../../config/api';
import { getProductById, getSimilarProducts, formatPrice, translate, translateName } from '../../data/fashionData';
import { reviews as mockReviews } from '../../data/mockData';
import ProductCard from '../../components/ui/ProductCard';
import ProductReviews from '../../components/ui/ProductReviews';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';
import useWishlistStore from '../../store/wishlistStore';
import { toast } from '../../store/toastStore';
import SizeGuideModal from '../../components/ui/SizeGuideModal';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [aiSimilar, setAiSimilar] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

  const [imgIdx, setImgIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState(0);
  const [qty, setQty] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const { addItem, openCart } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const { wishlist, toggleWishlist } = useWishlistStore();
  const isAdmin = user?.role === 'admin';
  const liked = wishlist?.some(item => item.productId === product?.id);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.warning('Vui lòng đăng nhập để thêm vào giỏ hàng!');
      setTimeout(() => navigate('/login'), 800);
      return;
    }
    if (!selectedSize && product.sizes && product.sizes.length > 0) {
      toast.warning('Vui lòng chọn kích cỡ/size!');
      return;
    }
    const colorToSave = '';
    const translatedName = translateName(product);
    // Truyền imagePath gốc để cartStore xử lý đúng
    const success = await addItem({ ...product, name: translatedName }, selectedSize || 'Freesize', colorToSave, qty);
    if(success) {
      toast.success('Đã thêm vào giỏ hàng!');
      setAddedFeedback(true);
      setTimeout(() => setAddedFeedback(false), 2000);
      openCart();
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      toast.warning('Vui lòng đăng nhập để thêm vào giỏ hàng!');
      setTimeout(() => navigate('/login'), 800);
      return;
    }
    if (!selectedSize && product.sizes && product.sizes.length > 0) {
      toast.warning('Vui lòng chọn kích cỡ/size!');
      return;
    }
    const colorToSave = '';
    const translatedName = translateName(product);
    const success = await addItem({ ...product, name: translatedName }, selectedSize || 'Freesize', colorToSave, qty);
    if(success) {
      navigate('/cart');
    }
  };

  // ─── Normalize product: hỗ trợ cả backend (imagePath) và mock (images[])
  const normalizeProduct = (raw) => {
    if (!raw) return null;
    const BASE = API_BASE;
    let images;
    if (raw.images && raw.images.length > 0) {
      images = raw.images;
    } else if (raw.imagePath) {
      // Backend trả về imagePath, có thể là nhiều ảnh phân cách bằng dấu phẩy
      images = raw.imagePath.split(',').map(p => {
        const trimmed = p.trim();
        if (trimmed.startsWith('http')) return trimmed;
        if (trimmed.startsWith('/')) return `${BASE}${trimmed}`;
        return `${BASE}/images/${trimmed}`;
      });
    } else {
      images = ['https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&q=80'];
    }
    const sizes = raw.sizes && raw.sizes.length > 0
      ? raw.sizes
      : ['S', 'M', 'L', 'XL'];
    return { ...raw, images, sizes };
  };

  useEffect(() => {
    // Reset state khi đổi sản phẩm
    setLoading(true);
    setImgIdx(0);
    setSelectedSize('');
    setSelectedColor(0);
    setQty(1);

    // Fetch dữ liệu
    const loadData = async () => {
      try {
        // Thử gọi API Backend
        const res = await axios.get(`${API_BASE}/api/products/${id}`);
        setProduct(normalizeProduct(res.data));
        setSimilar(getSimilarProducts(res.data.masterCategory || res.data.category, res.data.id || id));
      } catch (err) {
        console.warn('API lỗi, fallback local JSON...', err.message);
        const fallbackProduct = getProductById(id);
        setProduct(normalizeProduct(fallbackProduct));
        setSimilar(getSimilarProducts(fallbackProduct.category, fallbackProduct.id));
      } finally {
        setLoading(false);
      }
    };

    loadData();
    window.scrollTo(0, 0);
  }, [id]);

  // ─── Fetch AI similar products khi bấm nút ──────────────────────
  const handleFindSimilar = async () => {
    if (aiLoading) return;
    setAiSimilar([]);
    setAiLoading(true);
    // Scroll xuống section trước khi có kết quả
    setTimeout(() => {
      document.getElementById('ai-similar-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    try {
      const res = await axios.get(`${API_BASE}/api/search/similar/${product.id}?topK=5`);
      if (res.data?.success && res.data.results?.length > 0) {
        const BASE = API_BASE;
        const normalized = res.data.results.map(p => ({
          ...p,
          images: p.imagePath
            ? p.imagePath.split(',').map(path =>
                path.trim().startsWith('http') ? path.trim() : `${BASE}${path.trim()}`
              )
            : [],
          sizes: ['S', 'M', 'L', 'XL'],
        }));
        setAiSimilar(normalized);
      }
    } catch (e) {
      console.warn('AI similar fetch failed:', e.message);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return <div className="min-h-screen flex text-center mt-20 justify-center">Sản phẩm không tồn tại!</div>;
  }

  return (
    <div className="min-h-screen bg-white pb-32 page-enter">
      <div className="layout-page py-12 lg:py-16">

        {/* Breadcrumb */}
        <motion.nav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground mb-12 lg:mb-16"
        >
          <Link to="/" className="hover:text-primary transition-colors">Trang chủ</Link>
          <span className="opacity-30">•</span>
          <Link to="/products" className="hover:text-primary transition-colors">Sản phẩm</Link>
          <span className="opacity-30">•</span>
          <span className="text-primary font-black">{translate(product.category || product.masterCategory)}</span>
        </motion.nav>

        {/* Main Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">

          {/* Left: Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {/* Main Image */}
            <div className="card-elevated rounded-sm overflow-hidden sticky top-24">
              <div className="aspect-square bg-surface-secondary relative overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.img
                    key={imgIdx}
                    src={product.images[imgIdx]}
                    alt={product.name}
                    initial={{ opacity: 0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full object-cover"
                  />
                </AnimatePresence>

                {product.isBestSeller && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-4 left-4 badge badge-primary"
                  >
                    ⭐ Signature Series
                  </motion.div>
                )}

                {/* Wishlist Button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={async () => {
                    if (!isAuthenticated) {
                      toast.warning('Vui lòng đăng nhập để sử dụng tính năng này!');
                      return;
                    }
                    const res = await toggleWishlist(product.id);
                    if (res.success) {
                      toast.success(liked ? 'Đã bỏ yêu thích' : 'Đã thêm vào yêu thích');
                    }
                  }}
                  className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-rose-50 transition-all"
                >
                  <Heart size={20} className={liked ? 'fill-rose-500 text-rose-500' : 'text-slate-400 group-hover:text-rose-500'} />
                </motion.button>
              </div>
            </div>

            {/* Thumbnails */}
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {product.images.map((img, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setImgIdx(i)}
                  className={`shrink-0 w-24 h-24 rounded-sm overflow-hidden border-2 transition-all ${i === imgIdx ? 'border-primary shadow-soft' : 'border-border hover:border-primary/50'
                    }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Right: Information */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >

            {/* Header */}
            <div className="space-y-6">
              <span className="text-xs font-bold text-primary-600 uppercase tracking-widest bg-primary-50 px-3 py-1 rounded-full inline-block">
                Bộ sưu tập
              </span>

              <h1 className="text-2xl sm:text-3xl lg:text-[1.9rem] font-bold font-display text-foreground leading-tight">
                {translateName(product)}
              </h1>

              {/* Rating & Reviews */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={16}
                        className={s <= Math.round(product.rating != null ? product.rating : 0) ? 'fill-amber-400 text-amber-400' : 'text-border'}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-foreground">{product.rating != null ? Number(product.rating).toFixed(1) : '0.0'}/5</span>
                </div>
                <div className="h-4 w-px bg-border" />
                <div className="text-sm font-semibold text-muted-foreground">
                  {(product.sold || 0).toLocaleString()} lượt mua
                </div>
                <div className="h-4 w-px bg-border" />
                <div className="text-sm font-semibold text-muted-foreground">
                  Tồn kho: {product.stock || 0}
                </div>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-4 pt-4">
                <span className="text-3xl sm:text-4xl font-bold text-primary">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice != null && product.originalPrice > product.price && (
                  <span className="text-lg font-semibold text-muted-foreground line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>
            </div>

            {/* Thông số kỹ thuật chi tiết */}
            <div className="card !rounded-sm p-6 space-y-4 shadow-none border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wide flex items-center gap-2 mb-2">
                <Info size={16} className="text-primary" /> Thông số sản phẩm
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div className="flex justify-between border-b pb-1 border-slate-200">
                  <span className="text-muted-foreground font-medium">Mã SP:</span>
                  <span className="font-bold">{product.id}</span>
                </div>
                <div className="flex justify-between border-b pb-1 border-slate-200">
                  <span className="text-muted-foreground font-medium">Đối tượng:</span>
                  <span className="font-bold">{translate(product.gender) || 'Chung'}</span>
                </div>
                <div className="flex justify-between border-b pb-1 border-slate-200">
                  <span className="text-muted-foreground font-medium">Nhóm:</span>
                  <span className="font-bold">{translate(product.category || product.masterCategory)}</span>
                </div>
                <div className="flex justify-between border-b pb-1 border-slate-200">
                  <span className="text-muted-foreground font-medium">Phân loại:</span>
                  <span className="font-bold">{translate(product.subCat || product.subCategory)}</span>
                </div>
                <div className="flex justify-between border-b pb-1 border-slate-200">
                  <span className="text-muted-foreground font-medium">Chi tiết:</span>
                  <span className="font-bold">{translate(product.articleType)}</span>
                </div>
                <div className="flex justify-between border-b pb-1 border-slate-200">
                  <span className="text-muted-foreground font-medium">Màu sắc:</span>
                  <span className="font-bold">{translate(product.colour || product.baseColour)}</span>
                </div>
                <div className="flex justify-between border-b pb-1 border-slate-200">
                  <span className="text-muted-foreground font-medium">Hoàn cảnh:</span>
                  <span className="font-bold">{translate(product.usage) || 'Đa dụng'}</span>
                </div>
                <div className="flex justify-between border-b pb-1 border-slate-200">
                  <span className="text-muted-foreground font-medium">Bộ sưu tập:</span>
                  <span className="font-bold">{product.season ? `${translate(product.season)} ${product.year || ''}` : 'Mới'}</span>
                </div>
              </div>
            </div>



            {/* Size Selection - Ẩn với admin */}
            {!isAdmin && product.sizes && product.sizes.length > 0 && (
              <div className="card !rounded-sm p-6 space-y-4 shadow-none border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-foreground uppercase tracking-wide">
                    Chọn kích cỡ
                  </label>
                  <button 
                    onClick={() => setIsSizeGuideOpen(true)}
                    className="text-xs font-semibold text-primary hover:text-primary-700 transition-colors"
                  >
                    Hướng dẫn chọn size →
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {product.sizes.map((s) => (
                    <motion.button
                      key={s}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedSize(s)}
                      className={`py-3 px-2 !rounded-sm font-bold text-sm transition-all border-2 leading-none ${selectedSize === s
                        ? 'bg-primary text-white border-primary shadow-soft'
                        : 'bg-surface-secondary text-foreground border-border hover:border-primary'
                        }`}
                    >
                      {s}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity - Ẩn với admin */}
            {!isAdmin && (
              <div className="card !rounded-sm p-6 space-y-4 shadow-none border-slate-100">
                <label className="text-sm font-bold text-foreground uppercase tracking-wide">
                  Số lượng
                </label>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="w-10 h-10 !rounded-sm border border-border hover:border-primary flex items-center justify-center transition-colors leading-none"
                  >
                    −
                  </button>
                  <span className="text-lg font-bold text-foreground w-8 text-center leading-none">{qty}</span>
                  <button
                    onClick={() => setQty(qty + 1)}
                    className="w-10 h-10 !rounded-sm border border-border hover:border-primary flex items-center justify-center transition-colors leading-none"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

              {/* Action Buttons - Ẩn với admin */}
              {!isAdmin && (
                <div className="space-y-3 pt-4">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddToCart}
                    className={`w-full py-4 !rounded-sm font-bold text-base flex items-center justify-center gap-2 transition-all shadow-soft hover:shadow-lg ${addedFeedback
                      ? 'bg-success text-white'
                      : 'bg-primary text-white hover:bg-primary-700 active:scale-95'
                      }`}
                  >
                    {addedFeedback ? (
                      <>
                        <Check size={20} />
                        Đã thêm vào giỏ hàng
                      </>
                    ) : (
                      <>
                        <ShoppingBag size={20} />
                        Thêm vào giỏ hàng
                      </>
                    )}
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleBuyNow}
                    className="w-full py-4 !rounded-sm font-bold text-base border-2 border-primary text-primary hover:bg-primary-50 transition-all"
                  >
                    Mua ngay
                  </motion.button>

                  {/* Nút Tìm sản phẩm tương đồng */}
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleFindSimilar}
                    disabled={aiLoading}
                    className="w-full py-4 !rounded-sm font-bold text-base border-2 border-dashed border-[#7c3aed]/40 text-[#7c3aed] hover:bg-[#7c3aed]/5 hover:border-[#7c3aed] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {aiLoading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Đang tìm kiếm...
                      </>
                    ) : (
                      <>
                        <Cpu size={18} />
                        Tìm sản phẩm tương đồng
                      </>
                    )}
                  </motion.button>
                </div>
              )}

            {/* Benefits */}
            <div className="grid grid-cols-2 gap-4 pt-8 border-t border-border">
              <div className="flex gap-3">
                <Shield size={20} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-foreground">Chất lượng đảm bảo</p>
                  <p className="text-xs text-muted-foreground">100% hàng chính hãng</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Truck size={20} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-foreground">Giao hàng miễn phí</p>
                  <p className="text-xs text-muted-foreground">Trên toàn quốc</p>
                </div>
              </div>
              <div className="flex gap-3">
                <RefreshCw size={20} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-foreground">Đổi trả dễ dàng</p>
                  <p className="text-xs text-muted-foreground">Trong 30 ngày</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Sparkles size={20} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-foreground">Hỗ trợ 24/7</p>
                  <p className="text-xs text-muted-foreground">Luôn sẵn sàng giúp</p>
                </div>
              </div>
            </div>

          </motion.div>
        </div>

        {/* ── Reviews Section ── */}
        <div className="mt-24 border-t border-slate-100 pt-20">
          <ProductReviews productId={product?.id} />
        </div>

        {/* ── AI Similar Products Section ── */}
        <div id="ai-similar-section" className="mt-16 border-t border-slate-100 pt-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-3">
                <Cpu size={22} className="text-[#7c3aed]" />
                <h2 className="text-2xl font-bold text-slate-800">Sản phẩm tương đồng</h2>
              </div>
            </div>
            <Link
              to="/visual-search"
              className="hidden sm:flex items-center gap-2 text-[12px] font-bold text-[#00168d] hover:text-[#7c3aed] transition-colors uppercase tracking-wider"
            >
              Tìm bằng ảnh <ArrowRight size={14} />
            </Link>
          </div>

          {aiLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white rounded-sm border-2 border-slate-100 overflow-hidden animate-pulse">
                  <div className="aspect-[3/4] bg-gradient-to-br from-slate-100 to-slate-200" />
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-slate-200 rounded w-3/4" />
                    <div className="h-4 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : aiSimilar.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6"
            >
              {aiSimilar.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-16 text-slate-400">
              <div className="flex justify-center mb-3">
                <Cpu size={40} className="opacity-30" />
              </div>
              <p className="text-sm font-semibold">Không tìm thấy sản phẩm tương đồng</p>
              <p className="text-xs mt-1">Sản phẩm này chưa được index vào hệ thống AI</p>
            </div>
          )}
        </div>


      </div>

      <SizeGuideModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        category={product.masterCategory || product.category}
        gender={product.gender}
      />
    </div>
  );
}
