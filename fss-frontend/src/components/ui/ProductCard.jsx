import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Star, Heart } from 'lucide-react';
import { useState } from 'react';
import { formatPrice as formatPriceFashion, translate, translateName } from '../../data/fashionData';
import { formatPrice as formatPriceMock } from '../../data/mockData';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';
import useWishlistStore from '../../store/wishlistStore';
import { toast } from '../../store/toastStore';

// Dùng formatPrice từ fashionData (ưu tiên) hoặc mockData
const formatPrice = formatPriceFashion || formatPriceMock;

// Fallback image khi ảnh local bị lỗi
const FALLBACK = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&q=60';

export default function ProductCard({ product }) {
  const [imgIdx, setImgIdx] = useState(0);
  const { addItem, openCart } = useCartStore();
  const { user, isAuthenticated } = useAuthStore();
  const { wishlist, toggleWishlist } = useWishlistStore();
  const isAdmin = user?.role === 'admin';
  const liked = wishlist?.some(item => item.productId === product.id);

  // Normalize & Translate field names: hỗ trợ cả API backend (imagePath, productDisplayName) và mock data cũ (images, name)
  const name = translateName(product);
  const imageUrl = product.imagePath
    ? (product.imagePath.startsWith('http')
        ? product.imagePath
        : `http://localhost:8080${product.imagePath}`)
    : (product.images?.[imgIdx] || FALLBACK);
  const sizes = product.sizes || ['S', 'M', 'L', 'XL'];
  const colorNames = product.colorNames || [translate(product.baseColour) || 'Mặc định'];

  const articleType = translate(product.articleType || product.category);
  // Default values for missing gender cases covered by UI fallback
  const translatedGender = translate(product.gender);

  const handleQuickAdd = (e) => {
    e.preventDefault();
    addItem({ ...product, name, sizes, colorNames }, sizes[0], colorNames[0]);
    openCart();
  };

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <motion.div
      className="group h-full bg-white rounded-sm shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_40px_rgba(0,22,141,0.08)] border-2 border-transparent hover:border-[#00168d]/10 transition-all duration-500 overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6 }}
    >
      {/* Image Section with Enhanced Hover */}
      <Link
        to={`/products/${product.id}`}
        className="block relative overflow-hidden rounded-sm aspect-[3/4] bg-surface-secondary"
      >
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
          onError={(e) => { e.target.src = FALLBACK; }}
          loading="lazy"
        />

        {/* Overlay Gradient on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {product.isNew && (
            <motion.span
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="badge badge-primary"
            >
              ✨ Mới
            </motion.span>
          )}
          {discount > 0 && (
            <motion.span
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="badge badge-error"
            >
              -{discount}%
            </motion.span>
          )}
        </div>

        <div className="absolute top-4 right-4 flex flex-col gap-2 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={async (e) => {
                e.preventDefault();
                if (!isAuthenticated) {
                  toast.warning('Vui lòng đăng nhập để sử dụng tính năng này!');
                  return;
                }
                const res = await toggleWishlist(product.id);
                if (res.success) {
                  toast.success(liked ? 'Đã bỏ yêu thích' : 'Đã thêm vào yêu thích');
                }
              }}
              className="w-10 h-10 bg-white/95 backdrop-blur-md rounded-sm flex items-center justify-center shadow-md hover:bg-[#e11d48] hover:text-white transition-all duration-300 border border-white/50"
              title={liked ? 'Bỏ yêu thích' : 'Yêu thích'}
            >
              <Heart size={18} className={`transition-all ${liked ? 'fill-current' : ''}`} />
            </motion.button>
            
            {!isAdmin && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleQuickAdd}
                className="w-10 h-10 bg-white/95 backdrop-blur-md rounded-sm flex items-center justify-center shadow-md hover:bg-[#00168d] hover:text-white transition-all duration-300 border border-white/50"
                title="Thêm vào giỏ"
              >
                <ShoppingBag size={18} />
              </motion.button>
            )}
        </div>
      </Link>

      {/* Info Section - Premium Styling */}
      <div className="p-2 lg:p-3 flex flex-col h-auto justify-between min-h-[150px]">
        {/* Category & Rating */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {articleType}
            </span>
            {translatedGender && (
              <span className="text-[9px] font-bold text-[#7c3aed]/70 uppercase tracking-wide">
                {translatedGender}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 bg-[#00168d]/5 px-2 py-1 rounded-sm border border-[#00168d]/10 shrink-0">
            <Star size={10} className="fill-[#00168d] text-[#00168d]" />
            <span className="text-[10px] font-black text-[#00168d]">{product.rating || '4.5'}</span>
          </div>
        </div>

        {/* Product Name */}
        <Link to={`/products/${product.id}`} className="block mb-1.5">
          <h3 className="font-black text-[13px] text-slate-800 leading-tight hover:text-[#00168d] transition-colors line-clamp-2 uppercase tracking-wide">
            {name}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-[11px] font-medium text-slate-400 line-clamp-1 mb-4">
          Thiết kế tôn dáng, trải nghiệm cao cấp
        </p>

        {/* Price */}
        <div className="flex items-baseline gap-2 mt-auto border-t border-slate-100 pt-3">
          <span className="font-black text-[15px] bg-gradient-to-r from-[#00168d] to-[#7c3aed] bg-clip-text text-transparent tracking-tight">
            {formatPrice(product.price)}
          </span>
          {product.originalPrice > product.price && (
            <span className="text-[11px] text-slate-400 line-through font-bold">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

