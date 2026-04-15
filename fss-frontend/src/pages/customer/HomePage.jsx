import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Shield, Truck, ChevronRight } from 'lucide-react';
import { getProducts, getProductById, formatPrice } from '../../data/fashionData';
import ProductCard from '../../components/ui/ProductCard';

/* Khung chung với header/footer — luôn có lề hai bên */
const containerClass = 'layout-page';



const features = [
  {
    icon: Zap,
    title: 'Tìm kiếm nhanh',
    description: 'Công nghệ AI Visual Search giúp tìm sản phẩm tương đồng trong vài giây'
  },
  {
    icon: Truck,
    title: 'Giao hàng nhanh',
    description: 'Giao hàng toàn quốc, miễn phí vận chuyển cho đơn hàng từ 500.000đ'
  },
  {
    icon: Shield,
    title: 'Thanh toán an toàn',
    description: 'Bảo mật thông tin khách hàng, giao dịch an toàn và tin cậy'
  },
];

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState('all');

  // Lấy chính xác sản phẩm "REVV NAM STEEL RING" theo ID để tránh lỗi tìm kiếm
  const heroProduct = getProductById(48946);

  const productsData = getProducts({ limit: 8, category: activeCategory, sort: 'best-seller' });
  const filteredProducts = productsData.items;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="page-enter bg-white min-h-screen pb-20">

      {/* ===== HERO SECTION ===== */}
      <section className="relative pt-20 pb-28 lg:pt-24 lg:pb-36 overflow-hidden bg-gradient-to-br from-primary-50 via-white to-surface-secondary">
        {/* Decorative Elements */}
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/3 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

        <div className={containerClass}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full"
            >
              <div className="flex flex-col items-start mb-6">
                <span className="text-label mb-4">FASHION SHOPPING SENSE</span>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl text-headline leading-[1.1]">
                  <span className="block">Sự Hiện Đại.</span>
                  <span className="block bg-gradient-to-r from-primary to-primary-700 bg-clip-text text-transparent">
                    Tinh Tế.
                  </span>
                </h1>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground mt-6 max-w-xl leading-relaxed">
                Khám phá bộ sưu tập mang phong cách tối giản, tập trung vào chất liệu cao cấp và những đường cắt may hoàn hảo.
              </p>
              <motion.div className="mt-10">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-3 px-10 py-4 bg-primary text-white font-bold rounded-sm shadow-soft hover:shadow-elevation hover:bg-primary-700 transition-all active:scale-95"
                >
                  Khám phá ngay <ArrowRight size={20} strokeWidth={2} />
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="relative w-full"
            >
              <div className="group relative w-full rounded-[2rem] overflow-hidden shadow-elevation ring-1 ring-black/5">
                <img
                  src={heroProduct.images?.[0] || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&q=60'}
                  alt={heroProduct.name}
                  className="w-full h-[min(400px,50vh)] sm:h-[480px] lg:h-[520px] object-cover object-top"
                />
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.location.href = `/products/${heroProduct.id}`}
                  className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all"
                  aria-label="View product"
                >
                  <ChevronRight size={24} strokeWidth={2.5} />
                </motion.button>

                {/* Bottom Card */}
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 bg-gradient-to-t from-black via-black/80 to-transparent backdrop-blur-sm border-t border-white/10">
                  <span className="badge badge-primary mb-3 uppercase tracking-widest text-[10px]">
                    🔥 Best Seller
                  </span>
                  <h3 className="font-display font-bold text-white text-lg sm:text-xl leading-snug">
                    {heroProduct.name}
                  </h3>
                  <p className="text-white/70 text-sm mt-1 mb-2">Thiết kế tôn dáng, trải nghiệm cao cấp</p>
                  <p className="text-white/90 font-bold text-lg mt-2">{formatPrice(heroProduct.price)}</p>
                  <Link
                    to={`/products/${heroProduct.id}`}
                    className="mt-4 flex w-full items-center justify-center py-3 rounded-xl bg-white text-primary text-xs font-bold uppercase tracking-wider hover:bg-white/90 transition-all shadow-lg"
                  >
                    Xem chi tiết
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== VIDEO PROMO SECTION ===== */}
      <section className="relative w-full h-[50vh] sm:h-[60vh] lg:h-[80vh] overflow-hidden bg-black group">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-1000 group-hover:scale-105"
        >
          <source src="/video-fashion.mp4" type="video/mp4" />
          Trình duyệt của bạn không hỗ trợ thẻ video.
        </video>

        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/30 pointer-events-none" />

        {/* Video Content Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true, margin: "-100px" }}
            className="flex flex-col items-center gap-3"
          >
            <h2 className="text-3xl sm:text-5xl lg:text-7xl font-display font-light text-white tracking-widest uppercase drop-shadow-lg leading-tight">
              ĐẬM CHẤT RIÊNG
            </h2>

            <p className="text-white/90 text-sm sm:text-base tracking-[0.2em] font-medium uppercase drop-shadow-md">
              Thời trang không chỉ là cái bạn mặc, mà là cách bạn cảm nhận
            </p>
          </motion.div>
        </div>
      </section>

      {/* ===== CATEGORIES SECTION ===== */}
      <section className="py-24 lg:py-32 bg-gradient-to-b from-white via-surface-secondary to-white">
        <div className={containerClass}>
          <div className="card-premium p-6 sm:p-8 mb-10 rounded-sm">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-foreground mb-1">Sản phẩm nổi bật</h2>
              <p className="text-sm text-muted-foreground">Bộ sưu tập được chọn lọc kỹ càng cho bạn</p>
            </div>
          </div>

          {/* PRODUCT GRID */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {filteredProducts.map((product) => (
              <motion.div key={product.id} variants={itemVariants}>
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-32 lg:mt-48 mb-20 lg:mb-32"
          >
            <Link
              to="/products"
              className="inline-flex items-center gap-4 px-14 py-6 bg-primary text-white font-bold text-sm uppercase tracking-wider rounded-none hover:bg-primary-700 hover:shadow-elevation transition-all group shadow-soft"
            >
              Xem tất cả sản phẩm
              <ArrowRight size={20} strokeWidth={2.5} className="group-hover:translate-x-2 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section className="py-20 lg:py-28 bg-white mb-8 lg:mb-12">
        <div className={containerClass}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={idx}
                  whileHover={{ y: -4 }}
                  className="card-elevated p-8 rounded-sm text-center"
                >
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-sm bg-primary/10 text-primary mb-6">
                    <Icon size={28} strokeWidth={2} />
                  </div>
                  <h3 className="font-bold text-lg text-foreground mb-3">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>



    </div>
  );
}
