import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, ShieldCheck, Truck, Loader2, Package, Tag, ChevronRight, RotateCcw, CreditCard, X } from 'lucide-react';
import useCartStore from '../../store/cartStore';
import { formatPrice } from '../../data/mockData';
import useAuthStore from '../../store/authStore';

export default function CartPage() {
  const { items, selectedKeys, toggleSelect, selectAll, clearSelection, removeItem, updateQty, clearCart, fetchCart, isLoading } = useCartStore();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const selectedItems = items ? items.filter(i => selectedKeys?.includes(i.key)) : [];
  const isAllSelected = items?.length > 0 && selectedKeys?.length === items?.length;

  const subtotal = selectedItems.reduce((sum, i) => sum + i.price * i.qty, 0);
  const shipping = subtotal >= 500000 || subtotal === 0 ? 0 : 35000;
  const total = subtotal + shipping;
  const freeShipRemaining = Math.max(500000 - subtotal, 0);
  const freeShipProgress = Math.min((subtotal / 500000) * 100, 100);
  const totalQty = items?.reduce((s, i) => s + i.qty, 0) || 0;

  /* ========== LOADING ========== */
  if (isLoading && (!items || items.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #f8f9fc 0%, #f1f3f9 100%)' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-5"
        >
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center">
              <Loader2 size={30} className="animate-spin text-primary" />
            </div>
            <div className="absolute -inset-1 rounded-2xl bg-primary/5 animate-pulse -z-10" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Đang tải giỏ hàng...</p>
        </motion.div>
      </div>
    );
  }

  /* ========== EMPTY CART ========== */
  if (!items || items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center page-enter" style={{ background: 'linear-gradient(180deg, #f8f9fc 0%, #f1f3f9 100%)' }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-sm px-6 mx-auto flex flex-col items-center"
        >
          <div className="w-20 h-20 mb-8 rounded-3xl bg-white shadow-soft-lg flex items-center justify-center relative">
            <ShoppingBag size={32} strokeWidth={1.5} className="text-primary/40" />
            <div className="absolute -inset-2 rounded-3xl bg-primary/[0.03] -z-10" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2.5 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
            Chưa có sản phẩm nào
          </h2>
          <p className="text-[15px] text-muted-foreground leading-relaxed mb-10">
            Giỏ hàng của bạn đang trống. Hãy khám phá bộ sưu tập và tìm kiếm những món đồ yêu thích!
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-primary text-white font-semibold text-[14px] rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary/20 group"
          >
            Khám phá ngay
            <ArrowRight size={17} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    );
  }

  /* ========== CART WITH ITEMS ========== */
  return (
    <div className="min-h-screen pb-32 page-enter" style={{ background: 'linear-gradient(180deg, #f8f9fc 0%, #f1f3f9 100%)' }}>

      {/* ===== HEADER ===== */}
      <div className="bg-white/80 backdrop-blur-md border-b border-black/[0.04] sticky top-0 z-30">
        <div className="layout-page py-5">
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-[13px] text-muted-foreground mb-3">
            <Link to="/" className="hover:text-primary transition-colors">Trang chủ</Link>
            <ChevronRight size={13} className="text-muted-foreground/50" />
            <span className="text-foreground font-medium">Giỏ hàng</span>
          </div>
          <div className="flex items-end justify-between">
            <div className="flex items-baseline gap-3">
              <h1 className="text-[22px] font-bold text-foreground tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                Giỏ hàng
              </h1>
              <span className="text-[13px] text-muted-foreground font-medium">
                ({totalQty} sản phẩm)
              </span>
            </div>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={clearCart}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            >
              <Trash2 size={13} />
              Xóa tất cả
            </motion.button>
          </div>
        </div>
      </div>

      {/* ===== FREE SHIPPING BAR ===== */}
      {subtotal > 0 && shipping > 0 && (
        <div className="layout-page mt-6">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-black/[0.04] px-5 py-4 shadow-xs"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
                <Truck size={17} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-foreground-secondary leading-snug">
                  Mua thêm <span className="font-bold text-primary">{formatPrice(freeShipRemaining)}</span> để được <span className="font-semibold text-success">miễn phí vận chuyển</span>
                </p>
                <div className="mt-2 w-full h-[5px] bg-surface-tertiary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, var(--color-primary) 0%, var(--color-primary-400) 100%)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${freeShipProgress}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </div>
              <span className="text-[12px] font-bold text-primary tabular-nums shrink-0">{Math.round(freeShipProgress)}%</span>
            </div>
          </motion.div>
        </div>
      )}

      {/* ===== MAIN GRID ===== */}
      <div className="layout-page mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* ===== PRODUCT LIST ===== */}
          <div className="lg:col-span-8 space-y-2.5">
            {/* Select All Bar */}
            <div className="bg-white rounded-2xl border border-black/[0.04] px-5 py-3 shadow-xs flex items-center gap-3 mb-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center w-5 h-5">
                  <input
                    type="checkbox"
                    className="peer appearance-none w-5 h-5 border-2 border-muted-foreground/30 rounded-md checked:bg-primary checked:border-primary transition-all cursor-pointer"
                    checked={isAllSelected}
                    onChange={() => isAllSelected ? clearSelection() : selectAll()}
                  />
                  <svg className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <span className="text-[14px] font-semibold text-foreground group-hover:text-primary transition-colors select-none">
                  Chọn tất cả ({items.length})
                </span>
              </label>
            </div>
            <AnimatePresence>
              {items.map((item, index) => (
                <motion.div
                  key={item.key}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -40, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.04 }}
                  className="group bg-white rounded-sm border-2 border-slate-200 overflow-hidden hover:border-primary/40 transition-colors duration-300"
                >
                  <div className="flex items-center p-4 lg:p-5 gap-3 lg:gap-4">
                    {/* Item Checkbox */}
                    <div className="flex-shrink-0 pt-1">
                      <label className="flex items-center cursor-pointer">
                        <div className="relative flex items-center justify-center w-5 h-5">
                          <input
                            type="checkbox"
                            className="peer appearance-none w-5 h-5 border-2 border-muted-foreground/30 rounded-md checked:bg-primary checked:border-primary transition-all cursor-pointer"
                            checked={selectedKeys?.includes(item.key)}
                            onChange={() => toggleSelect(item.key)}
                          />
                          <svg className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                        </div>
                      </label>
                    </div>

                    {/* Image */}
                    <Link
                      to={`/products/${item.product.id}`}
                      className="shrink-0 w-[70px] h-[90px] lg:w-[80px] lg:h-[100px] rounded-xl overflow-hidden bg-surface-secondary"
                    >
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </Link>

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col gap-2">
                      {/* Name + Remove */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link
                            to={`/products/${item.product.id}`}
                            className="text-[14px] font-semibold text-foreground hover:text-primary transition-colors line-clamp-2 leading-[1.4]"
                          >
                            {item.product.name}
                          </Link>
                          {item.size && (
                            <div className="mt-1.5">
                              <span className="inline-block text-[11px] font-medium text-muted-foreground bg-surface-tertiary px-2 py-[3px] rounded-md tracking-wide">
                                Size {item.size}
                              </span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removeItem(item.key)}
                          className="shrink-0 w-7 h-7 flex items-center justify-center text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                          title="Xóa sản phẩm"
                        >
                          <X size={15} />
                        </button>
                      </div>

                      {/* Price + Quantity */}
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-0.5">
                          <button
                            onClick={() => updateQty(item.key, item.qty - 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-tertiary transition-all"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-9 text-center text-[14px] font-bold text-foreground tabular-nums select-none">
                            {item.qty}
                          </span>
                          <button
                            onClick={() => updateQty(item.key, item.qty + 1)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-tertiary transition-all"
                          >
                            <Plus size={14} />
                          </button>
                        </div>

                        <p className="text-[15px] font-bold text-foreground tabular-nums tracking-tight">
                          {formatPrice(item.price * item.qty)}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-4 pb-2">
              {[
                { icon: <ShieldCheck size={15} />, label: 'Thanh toán bảo mật', color: 'text-success' },
                { icon: <RotateCcw size={15} />, label: 'Đổi trả 30 ngày', color: 'text-primary' },
                { icon: <Truck size={15} />, label: 'Giao hàng toàn quốc', color: 'text-info' },
              ].map((badge) => (
                <div key={badge.label} className="flex items-center gap-1.5">
                  <span className={badge.color}>{badge.icon}</span>
                  <span className="text-[12px] font-medium text-muted-foreground">{badge.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ===== ORDER SUMMARY ===== */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-sm border-2 border-slate-200 sticky top-[88px] overflow-hidden">

              {/* Header */}
              <div className="px-6 pt-6 pb-4">
                <h2 className="text-[16px] font-bold text-foreground tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                  Đơn hàng của bạn
                </h2>
              </div>

              {/* Item Summary Preview */}
              <div className="px-6 pb-4">
                <div className="space-y-3">
                  {selectedItems.length === 0 ? (
                    <p className="text-[13px] text-muted-foreground italic py-2">Chưa chọn sản phẩm nào.</p>
                  ) : (
                    selectedItems.map((item) => (
                      <div key={item.key} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-secondary shrink-0">
                          <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium text-foreground truncate">{item.product.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {item.size && `Size ${item.size} · `}SL: {item.qty}
                          </p>
                        </div>
                        <p className="text-[13px] font-semibold text-foreground tabular-nums shrink-0">
                          {formatPrice(item.price * item.qty)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="mx-6 border-t border-border" />

              {/* Pricing */}
              <div className="px-6 py-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-muted-foreground">Tạm tính ({selectedItems.reduce((s, i) => s + i.qty, 0)} sản phẩm)</span>
                  <span className="text-[14px] font-semibold text-foreground tabular-nums">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-muted-foreground">Vận chuyển</span>
                  {subtotal === 0 ? (
                    <span className="text-[14px] font-semibold text-foreground tabular-nums">0 đ</span>
                  ) : shipping === 0 ? (
                    <span className="inline-flex items-center gap-1 text-[13px] font-semibold text-success">
                      <Truck size={13} />
                      Miễn phí
                    </span>
                  ) : (
                    <span className="text-[14px] font-semibold text-foreground tabular-nums">{formatPrice(shipping)}</span>
                  )}
                </div>
              </div>

              {/* Total */}
              <div className="mx-6 border-t border-border" />
              <div className="px-6 py-4">
                <div className="flex justify-between items-center">
                  <span className="text-[14px] font-bold text-foreground">Tổng cộng</span>
                  <span className="text-[20px] font-bold text-primary tabular-nums" style={{ fontFamily: 'var(--font-display)' }}>
                    {formatPrice(total)}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 text-right">(Đã bao gồm VAT)</p>
              </div>

              {/* Actions */}
              <div className="px-6 pb-5 space-y-2.5">
                {!isAdmin && (
                  <motion.button
                    whileHover={selectedItems.length > 0 ? { scale: 1.01, y: -1 } : {}}
                    whileTap={selectedItems.length > 0 ? { scale: 0.99 } : {}}
                    onClick={() => navigate('/checkout')}
                    disabled={selectedItems.length === 0}
                    className={`w-full py-3.5 font-semibold text-[14px] rounded-xl flex items-center justify-center gap-2 transition-all ${selectedItems.length > 0
                        ? 'text-white shadow-lg shadow-primary/20'
                        : 'bg-surface-secondary text-muted-foreground/50 cursor-not-allowed border border-border'
                      }`}
                    style={selectedItems.length > 0 ? { background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-700) 100%)' } : {}}
                  >
                    <CreditCard size={17} />
                    Thanh toán {selectedItems.length > 0 && `(${selectedItems.length})`}
                  </motion.button>
                )}

                <Link
                  to="/products"
                  className="flex items-center justify-center gap-2 w-full py-3 text-[13px] font-medium text-muted-foreground hover:text-primary rounded-xl hover:bg-surface-secondary transition-all group"
                >
                  Tiếp tục mua sắm
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
