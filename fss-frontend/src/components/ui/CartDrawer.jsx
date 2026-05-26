import { AnimatePresence, motion } from 'framer-motion';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import useCartStore from '../../store/cartStore';
import { formatPrice } from '../../data/mockData';
import useAuthStore from '../../store/authStore';

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQty, selectAll } = useCartStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const safeItems = items || [];
  const subtotal = safeItems.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-[60]"
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 400, damping: 40 }}
            className="fixed right-0 top-0 h-full w-full max-w-[440px] bg-white z-[70] flex flex-col shadow-2xl border-l border-slate-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border bg-white">
              <div className="flex items-center gap-3">
                <ShoppingBag size={20} className="text-primary" />
                <div className="flex flex-col justify-center">
                  <span className="font-black text-foreground block text-lg leading-normal tracking-tight pt-1">GIỎ HÀNG</span>
                  {safeItems.length > 0 && (
                    <span className="text-xs font-semibold text-muted-foreground leading-none">{safeItems.length} sản phẩm</span>
                  )}
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                onClick={closeCart}
                id="close-cart-btn"
                className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-primary transition-all"
                aria-label="Close cart"
              >
                <X size={20} strokeWidth={2.5} />
              </motion.button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col space-y-4">
              {safeItems.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                  <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ShoppingBag size={32} className="text-primary/40" />
                  </div>
                  <h3 className="font-bold text-xl text-foreground mb-2">Giỏ hàng của bạn đang trống</h3>
                  <p className="text-sm text-muted-foreground mb-8 max-w-[250px]">
                    Có vẻ như bạn chưa có sản phẩm nào trong giỏ hàng. Hãy lấp đầy nó nhé!
                  </p>
                  <Link 
                    to="/products" 
                    onClick={closeCart} 
                    className="flex justify-center w-full px-6 py-3.5 bg-primary text-white text-[13px] font-black uppercase tracking-wider rounded-sm hover:bg-primary-700 transition-colors shadow-lg shadow-primary/20 hover:scale-[1.02]"
                  >
                    MUA SẮM NGAY
                  </Link>
                </div>
              ) : (
                <AnimatePresence>
                  {safeItems.map((item) => (
                    <motion.div
                      key={item.key}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      className="flex gap-4 p-4 border border-slate-100 rounded-lg hover:border-primary/20 hover:shadow-sm transition-all"
                    >
                      <Link to={`/products/${item.product.id}`} onClick={closeCart} className="shrink-0">
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-20 h-24 object-cover rounded-md bg-slate-50"
                        />
                      </Link>
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div className="flex justify-between items-start gap-2">
                          <Link to={`/products/${item.product.id}`} onClick={closeCart} className="text-sm font-bold text-foreground hover:text-primary line-clamp-2 leading-tight">
                            {item.product.name}
                          </Link>
                          <button onClick={() => removeItem(item.key)} className="text-slate-400 hover:text-red-500 transition-colors p-1 -mr-1 -mt-1 rounded-sm hover:bg-red-50 shrink-0">
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="flex mt-1 gap-1.5 flex-wrap">
                          {item.size && (
                            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-sm">Size: {item.size}</span>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between mt-auto pt-2">
                          <p className="text-[15px] font-black text-primary">{formatPrice(item.price)}</p>
                          <div className="flex items-center border border-slate-200 rounded-sm bg-slate-50">
                            <button onClick={() => updateQty(item.key, item.qty - 1)} className="w-7 h-7 flex items-center justify-center hover:bg-slate-200 transition-colors rounded-l-sm"><Minus size={12} /></button>
                            <span className="w-8 text-center text-xs font-bold">{item.qty}</span>
                            <button onClick={() => updateQty(item.key, item.qty + 1)} className="w-7 h-7 flex items-center justify-center hover:bg-slate-200 transition-colors rounded-r-sm"><Plus size={12} /></button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {safeItems.length > 0 && (
              <div className="border-t border-slate-100 px-6 py-6 space-y-5 bg-white shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                  <div className="flex justify-between items-center">
                    <span className="font-bold uppercase tracking-wider text-sm">Tạm tính</span>
                    <span className="text-xl font-black text-primary">{formatPrice(subtotal)}</span>
                  </div>
                </div>
                
                {/* Nút Thanh toán ngay - Ẩn với admin */}
                {!isAdmin && (
                  <Link
                    to="/checkout"
                    id="drawer-checkout-btn"
                    onClick={() => {
                      selectAll();
                      closeCart();
                    }}
                    className="flex justify-center w-full px-6 py-4 bg-primary text-white text-[13px] font-black uppercase tracking-wider rounded-sm hover:bg-primary-700 transition-colors shadow-lg shadow-primary/20 hover:scale-[1.01]"
                  >
                    Thanh toán ngay <ArrowRight size={16} strokeWidth={2.5} className="ml-2" />
                  </Link>
                )}
                <Link
                  to="/cart"
                  onClick={closeCart}
                  className="block text-center text-[12px] font-bold text-slate-400 hover:text-primary transition-colors tracking-wide hover:underline underline-offset-4"
                >
                  XEM GIỎ HÀNG CHI TIẾT
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
