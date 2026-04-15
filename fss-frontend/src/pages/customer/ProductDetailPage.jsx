import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ShoppingBag, Heart, Shield, Truck, RefreshCw, Sparkles, Check, ArrowRight, Info } from 'lucide-react';
import axios from 'axios';
import { getProductById, getSimilarProducts, formatPrice } from '../../data/fashionData';
import { reviews as mockReviews } from '../../data/mockData';
import ProductCard from '../../components/ui/ProductCard';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);

  const [imgIdx, setImgIdx] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState(0);
  const [qty, setQty] = useState(1);
  const [liked, setLiked] = useState(false);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const { addItem, openCart } = useCartStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const handleAddToCart = () => {
    if (!selectedSize && product.sizes && product.sizes.length > 0) {
      alert('Vui lòng chọn kích cỡ/size!');
      return;
    }
    const colorToSave = product.colorNames?.[selectedColor] || product.colour;
    addItem(product, selectedSize || 'Freesize', colorToSave, qty);
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
    openCart();
  };

  const handleBuyNow = () => {
    if (!selectedSize && product.sizes && product.sizes.length > 0) { 
      alert('Vui lòng chọn kích cỡ/size!'); 
      return; 
    }
    const colorToSave = product.colorNames?.[selectedColor] || product.colour;
    addItem(product, selectedSize || 'Freesize', colorToSave, qty);
    navigate('/cart');
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
        const res = await axios.get(`http://localhost:8080/api/products/${id}`);
        setProduct(res.data);
        
        // Cần truyền category hiện tại để lấy similar (tạm thời fallback local data)
        setSimilar(getSimilarProducts(res.data.category || res.data.masterCategory, res.data.id || id));
      } catch (err) {
        console.warn('API lỗi, fallback local JSON...', err.message);
        const fallbackProduct = getProductById(id);
        setProduct(fallbackProduct);
        setSimilar(getSimilarProducts(fallbackProduct.category, fallbackProduct.id));
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
    window.scrollTo(0, 0);
  }, [id]);

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
          <span className="text-primary font-black">{product.category}</span>
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
                  onClick={() => setLiked(!liked)}
                  className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                >
                  <Heart size={20} className={liked ? 'fill-current' : ''} />
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
                  className={`shrink-0 w-24 h-24 rounded-sm overflow-hidden border-2 transition-all ${
                    i === imgIdx ? 'border-primary shadow-soft' : 'border-border hover:border-primary/50'
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
                Bộ sưu tập 2026
              </span>
              
              <h1 className="text-4xl sm:text-5xl lg:text-[2.8rem] font-bold font-display text-foreground leading-tight">
                {product.name}
              </h1>

              {/* Rating & Reviews */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={16}
                        className={s <= Math.round(product.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-border'}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-foreground">{product.rating || 5.0}/5</span>
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
                <Info size={16} className="text-primary"/> Thông số sản phẩm
              </h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div className="flex justify-between border-b pb-1 border-slate-200">
                  <span className="text-muted-foreground font-medium">Mã SP:</span>
                  <span className="font-bold">{product.id}</span>
                </div>
                <div className="flex justify-between border-b pb-1 border-slate-200">
                  <span className="text-muted-foreground font-medium">Đối tượng:</span>
                  <span className="font-bold">{product.gender || 'Chung'}</span>
                </div>
                <div className="flex justify-between border-b pb-1 border-slate-200">
                  <span className="text-muted-foreground font-medium">Nhóm:</span>
                  <span className="font-bold">{product.category || product.masterCategory}</span>
                </div>
                <div className="flex justify-between border-b pb-1 border-slate-200">
                  <span className="text-muted-foreground font-medium">Phân loại:</span>
                  <span className="font-bold">{product.subCat || product.subCategory}</span>
                </div>
                <div className="flex justify-between border-b pb-1 border-slate-200">
                  <span className="text-muted-foreground font-medium">Chi tiết:</span>
                  <span className="font-bold">{product.articleType}</span>
                </div>
                <div className="flex justify-between border-b pb-1 border-slate-200">
                  <span className="text-muted-foreground font-medium">Màu sắc:</span>
                  <span className="font-bold">{product.colour || product.baseColour}</span>
                </div>
                <div className="flex justify-between border-b pb-1 border-slate-200">
                  <span className="text-muted-foreground font-medium">Hoàn cảnh:</span>
                  <span className="font-bold">{product.usage || 'Đa dụng'}</span>
                </div>
                <div className="flex justify-between border-b pb-1 border-slate-200">
                  <span className="text-muted-foreground font-medium">Bộ sưu tập:</span>
                  <span className="font-bold">{product.season ? `${product.season} ${product.year || ''}` : 'Mới'}</span>
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
                <button className="text-xs font-semibold text-primary hover:text-primary-700 transition-colors">
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
                    className={`py-3 px-2 !rounded-sm font-bold text-sm transition-all border-2 leading-none ${
                      selectedSize === s
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
                className={`w-full py-4 !rounded-sm font-bold text-base flex items-center justify-center gap-2 transition-all shadow-soft hover:shadow-lg ${
                  addedFeedback
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

        {/* Similar Products Section */}
        <section className="mt-40">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold font-display text-foreground mb-2">
                Các sản phẩm liên quan
              </h2>
              <p className="text-muted-foreground">Những item được chọn lọc dành cho bạn</p>
            </div>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all"
            >
              Xem thêm
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {similar.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <ProductCard product={p} />
              </motion.div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
