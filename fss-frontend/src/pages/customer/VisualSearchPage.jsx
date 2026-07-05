import { useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Upload, X, Loader2, Sparkles, ArrowRight,
  Image, Cpu, ShoppingBag, AlertCircle, RefreshCw,
  Plus, Star, Zap, LayoutGrid, List
} from 'lucide-react';
import { formatPrice } from '../../data/mockData';
import useVisualSearchStore from '../../store/visualSearchStore';
import useCartStore from '../../store/cartStore';
import { API_BASE } from '../../config/api';

const API_BASE_URL = API_BASE;
const IMG_BASE = API_BASE;

function getImg(product) {
  if (product.imagePath) {
    const p = product.imagePath.split(',')[0].trim(); // lấy ảnh đầu tiên nếu có nhiều ảnh
    if (p.startsWith('http')) return p;
    if (p.startsWith('/')) return `${IMG_BASE}${p}`;
    return `${IMG_BASE}/fashion-dataset/images/${p}`;
  }
  return product.imageUrl || '';
}

/* ─── Skeleton ─────────────────────────────────────────────── */
function SkeletonHero() {
  return (
    <div className="animate-pulse bg-slate-100 rounded-2xl overflow-hidden row-span-2">
      <div className="bg-gradient-to-b from-slate-200 to-slate-100 h-full min-h-[380px]" />
    </div>
  );
}
function SkeletonSmall() {
  return (
    <div className="animate-pulse bg-white rounded-2xl overflow-hidden border border-slate-100">
      <div className="bg-gradient-to-br from-slate-200 to-slate-100 aspect-[4/3]" />
      <div className="p-3 space-y-1.5">
        <div className="h-2 bg-slate-200 rounded w-1/3" />
        <div className="h-3 bg-slate-200 rounded w-3/4" />
        <div className="h-4 bg-slate-200 rounded w-1/2" />
      </div>
    </div>
  );
}

/* ─── Match Badge ───────────────────────────────────────────── */
function MatchBadge({ pct }) {
  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded-full text-white text-[10px] font-black shadow-md"
      style={{ background: pct >= 90 ? '#10b981CC' : pct >= 80 ? '#3b82f6CC' : '#f59e0bCC', backdropFilter: 'blur(4px)' }}>
      <Zap size={8} fill="white" /> {pct}% Tương đồng
    </div>
  );
}

/* ─── Hero Card (large, row-span-2) ────────────────────────── */
function HeroCard({ product, score }) {
  const pct = Math.round((score ?? 0) * 100);
  const img = getImg(product);
  const hasDiscount = product.originalPrice > product.price;
  const discPct = hasDiscount ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;
  const { addItem, openCart } = useCartStore();

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 'L', ''); // Mặc định size L
    openCart();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 20 }}
      className="row-span-2 group relative bg-white rounded-sm shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_40px_rgba(0,22,141,0.08)] border-2 border-transparent hover:border-[#00168d]/10 transition-all duration-500 flex flex-col"
    >
      <Link to={`/products/${product.id}`} className="flex flex-col h-full">
        {/* Image */}
        <div className="relative flex-1 overflow-hidden bg-slate-50 rounded-t-sm" style={{ minHeight: 280 }}>
          {img
            ? <img src={img} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            : <div className="w-full h-full flex items-center justify-center"><ShoppingBag size={48} className="text-slate-200" /></div>
          }
        </div>
        {/* Badges - Moved outside overflow-hidden */}
        {hasDiscount && (
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-red-500 text-white text-[11px] font-black shadow-lg z-10">
            -{discPct}% OFF
          </div>
        )}
        <div className="absolute top-3 right-3 z-10"><MatchBadge pct={pct} /></div>

        {/* Info */}
        <div className="p-4">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">
            {product.articleType || product.category || 'Thời trang'}
          </p>
          <h3 className="text-[15px] font-bold text-slate-800 leading-tight mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} size={11} className={s <= Math.round(product.rating || 4) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
            ))}
            <span className="text-[10px] text-slate-400 ml-1">({Math.floor(Math.random() * 200) + 50})</span>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[19px] font-black text-slate-900">{formatPrice(product.price)}</span>
            {hasDiscount && <span className="text-[12px] text-slate-400 line-through">{formatPrice(product.originalPrice)}</span>}
          </div>
          <button
            onClick={handleAdd}
            className="w-full py-2.5 rounded-xl text-[13px] font-bold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-95"
            style={{ background: 'linear-gradient(135deg, #1e40af, #3b82f6)' }}>
            <ShoppingBag size={14} /> Thêm vào giỏ hàng
          </button>
        </div>
      </Link>
    </motion.div>
  );
}

/* ─── Small Card ────────────────────────────────────────────── */
function SmallCard({ product, score, index, trending }) {
  const pct = Math.round((score ?? 0) * 100);
  const img = getImg(product);
  const hasDiscount = product.originalPrice > product.price;
  const { addItem, openCart } = useCartStore();

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 'L', ''); // Mặc định size L
    openCart();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 240, damping: 22 }}
      whileHover={{ y: -3 }}
      className="group relative bg-white rounded-sm shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_40px_rgba(0,22,141,0.08)] border-2 border-transparent hover:border-[#00168d]/10 transition-all duration-500"
    >
      <Link to={`/products/${product.id}`} className="flex flex-col h-full">
        <div className="relative overflow-hidden bg-slate-50 aspect-[4/3] rounded-t-sm">
          {img
            ? <img src={img} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            : <div className="w-full h-full flex items-center justify-center"><ShoppingBag size={28} className="text-slate-200" /></div>
          }
        </div>
        {/* Badges - Moved outside overflow-hidden */}
        <div className="absolute top-2.5 right-2.5 z-10"><MatchBadge pct={pct} /></div>
        {trending && (
          <div className="absolute top-[45%] left-2.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-slate-700 text-[9px] font-black shadow z-10">
            🔥 Trending
          </div>
        )}
        <div className="p-3 flex flex-col flex-1">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 mb-0.5">
            {product.articleType || product.category || 'Thời trang'}
          </p>
          <h3 className="text-[12px] font-bold text-slate-800 leading-tight line-clamp-2 mb-1.5 flex-1 group-hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center gap-0.5 mb-2">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} size={9} className={s <= Math.round(product.rating || 4) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
            ))}
            <span className="text-[9px] text-slate-400 ml-0.5">{product.rating || 4}.0</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[14px] font-black text-slate-900">{formatPrice(product.price)}</span>
              {hasDiscount && <span className="text-[10px] text-slate-400 line-through ml-1">{formatPrice(product.originalPrice)}</span>}
            </div>
            <button
              onClick={handleAdd}
              className="w-6 h-6 rounded-full flex items-center justify-center text-blue-600 border-2 border-blue-100 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all">
              <Plus size={12} />
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ─── Analysis Panel ────────────────────────────────────────── */
function AnalysisPanel({ preview, searching, onReset, onRetry, error }) {
  return (
    <div className="w-full lg:w-56 xl:w-60 shrink-0 flex flex-col gap-3">
      <div className="bg-white rounded-sm shadow-[0_4px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_40px_rgba(0,22,141,0.08)] border-2 border-transparent overflow-hidden transition-all duration-500">
        {/* Image */}
        <div className="relative">
          <img src={preview} alt="Uploaded" className="w-full aspect-[3/4] object-cover" />
          <button onClick={onReset}
            className="absolute top-2.5 right-2.5 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow hover:bg-red-50 hover:text-red-500 transition-colors">
            <X size={13} />
          </button>
          {searching && (
            <div className="absolute inset-0 bg-black/15">
              <motion.div animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                className="absolute left-0 right-0 h-0.5 shadow-lg"
                style={{ background: 'linear-gradient(90deg, transparent, #3b82f6, #10b981, transparent)' }} />
              <div className="absolute inset-0 flex items-end p-3">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/90 backdrop-blur-sm rounded-xl text-[11px] font-bold text-slate-700 shadow">
                  <Loader2 size={10} className="animate-spin text-blue-500" /> Đang phân tích...
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        {!searching && (
          <div className="p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-4 h-4 rounded-md flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #1e40af, #3b82f6)' }}>
                <Sparkles size={9} className="text-white" />
              </div>
              <p className="text-[11px] font-black text-slate-700">Phân tích hoàn tất</p>
            </div>


          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-2xl">
          <div className="flex items-start gap-1.5 mb-1.5">
            <AlertCircle size={12} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-[11px] font-bold text-red-700">Không thể tìm kiếm</p>
          </div>
          <p className="text-[10px] text-red-500 mb-2 line-clamp-3">{error}</p>
          <button onClick={onRetry} className="text-[10px] font-bold text-blue-600 flex items-center gap-1 hover:underline">
            <RefreshCw size={9} /> Thử lại
          </button>
        </div>
      )}
    </div>
  );
}



/* ─── Main Page ─────────────────────────────────────────────── */
export default function VisualSearchPage() {
  const [dragging, setDragging] = useState(false);
  const [searching, setSearching] = useState(false);
  const { preview, fileObj, results, error, history, setCurrentSearch, setError, resetCurrentSearch, restoreFromHistory } = useVisualSearchStore();
  const fileRef = useRef(null);

  const performSearch = useCallback(async (file, filePreview) => {
    if (!file) return;
    setSearching(true); setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file); fd.append('topK', '5');
      const res = await fetch(`${API_BASE_URL}/api/search/by-image`, { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || `Lỗi (${res.status})`);

      setCurrentSearch(filePreview, file, data.results || []);
    } catch (err) {
      setError(err.message.includes('fetch') || err.message.includes('Failed')
        ? 'Không thể kết nối. Kiểm tra Spring Boot (8080) và AI Service (8000).'
        : err.message);
      setCurrentSearch(filePreview, file, null);
    } finally { setSearching(false); }
  }, [setCurrentSearch, setError]);

  const handleFile = useCallback((f) => {
    if (!f || !f.type.startsWith('image/')) return;
    const objectUrl = URL.createObjectURL(f);
    setCurrentSearch(objectUrl, f, null);
    performSearch(f, objectUrl);
  }, [performSearch, setCurrentSearch]);

  const handleDrop = (e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); };
  const resetSearch = () => { resetCurrentSearch(); setSearching(false); };

  return (
    <div className="min-h-screen bg-surface-secondary page-enter">
      <div className="layout-page py-20 lg:py-28">

        {/* ══ PRE-SEARCH ══ */}
        {!preview && (
          <>
            <div className="flex flex-col items-center text-center mb-10">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent-soft text-primary rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
                <Sparkles size={14} /> AI Powered Visual Search
              </motion.div>
              <h1 className="text-3xl md:text-4xl font-bold font-display text-foreground tracking-tight">
                Tìm kiếm bằng hình ảnh
              </h1>
              <p className="text-muted mt-5 max-w-2xl leading-relaxed text-[16px] opacity-80">
                Tải lên một bức ảnh thời trang bất kỳ — AI sẽ tự động phân tích và tìm ngay 5 sản phẩm tương đồng nhất.
              </p>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl overflow-hidden p-6 lg:p-8 flex justify-center items-center py-4">
              <div
                id="visual-search-drop-zone"
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current.click()}
                className={`border-2 border-dashed rounded-2xl aspect-square w-full max-w-md flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${dragging ? 'border-primary bg-accent-soft scale-[1.02]' : 'border-[#D1D5DB] hover:border-primary hover:bg-accent-soft'
                  }`}>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
                <motion.div animate={{ y: dragging ? -8 : 0 }}
                  className="w-16 h-16 bg-accent-soft rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {dragging ? <Upload size={28} className="text-primary" /> : <Image size={28} className="text-primary" />}
                </motion.div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {dragging ? 'Thả ảnh vào đây!' : 'Kéo thả hoặc nhấn để chọn ảnh'}
                </h3>
                <p className="text-sm text-muted-foreground">Hỗ trợ JPG, PNG, WEBP · Tối đa 20MB</p>
                <div className="mt-5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 text-xs font-medium">
                  <Sparkles size={11} /> Tự động tìm kiếm top 5 sản phẩm
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {['Áo thun', 'Quần jean', 'Váy', 'Áo khoác', 'Giày', 'Phụ kiện'].map((t) => (
                    <span key={t} className="px-3 py-1 bg-[#F5F5F5] text-xs text-muted rounded-full">{t}</span>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 pb-10">
              {[
                { icon: <Camera size={24} strokeWidth={2} />, title: 'Tải ảnh lên', desc: 'Chọn ảnh thời trang bạn yêu thích, AI sẽ tự động bắt đầu phân tích.', step: '01', gradient: 'from-blue-500 to-indigo-600' },
                { icon: <Cpu size={24} strokeWidth={2} />, title: 'AI phân tích', desc: 'Công nghệ ResNet50 bóc tách màu sắc và kiểu dáng từ ảnh của bạn.', step: '02', gradient: 'from-purple-500 to-pink-600' },
                { icon: <ShoppingBag size={24} strokeWidth={2} />, title: 'Nhận gợi ý', desc: 'Hệ thống trả về ngay 5 sản phẩm tương đồng và phù hợp nhất.', step: '03', gradient: 'from-orange-400 to-red-500' },
              ].map(({ icon, title, desc, step, gradient }) => (
                <motion.div key={step} whileHover={{ y: -6 }}
                  className="group bg-white rounded-[2rem] p-8 border border-slate-100 flex flex-col items-center text-center shadow-lg shadow-slate-200/40 hover:shadow-xl transition-all duration-500 relative overflow-hidden">
                  <div className="absolute -bottom-4 -right-2 text-[70px] font-black text-slate-50 pointer-events-none select-none">{step}</div>
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 relative z-10">
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradient} rounded-2xl opacity-10 blur-xl`} />
                    <div className={`w-full h-full bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center text-white shadow-lg`}>{icon}</div>
                  </div>
                  <h4 className="font-black text-[15px] text-primary uppercase tracking-wider mb-3 z-10">{step}. {title}</h4>
                  <p className="text-[13px] text-muted-foreground leading-relaxed max-w-[200px] font-medium z-10">{desc}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* History Section for NO-PREVIEW */}
            {history.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-16 border-t border-slate-200 pt-10 pb-4">
                <h3 className="text-[14px] font-black uppercase tracking-widest text-blue-600 mb-6 text-left">Lịch sử tìm kiếm gần đây</h3>
                <div className="flex justify-start gap-4 flex-wrap">
                  {history.map(entry => (
                    <button key={entry.id} onClick={() => restoreFromHistory(entry.id)} title="Xem lại kết quả này"
                      className="w-20 h-28 rounded-sm overflow-hidden border border-slate-200 hover:border-primary hover:shadow-lg transition-all relative group">
                      <img src={entry.preview} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <RefreshCw size={20} className="text-white" />
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}

        {/* ══ POST-SEARCH: 2-column layout ══ */}
        {preview && (
          <div className="flex flex-col lg:flex-row gap-5 items-start">

            {/* LEFT: Analysis Panel & Sidebar History */}
            <div className="w-full lg:w-56 xl:w-60 shrink-0 flex flex-col gap-5">
              <AnalysisPanel preview={preview} searching={searching} onReset={resetSearch} onRetry={() => performSearch(fileObj, preview)} error={error} />

              {/* Sidebar History */}
              {history.length > 1 && (
                <div className="bg-white rounded-sm p-4 border-2 border-transparent shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-3">Lịch sử tìm kiếm</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {history.filter(h => h.preview !== preview).slice(0, 6).map(entry => (
                      <button key={entry.id} onClick={() => restoreFromHistory(entry.id)} title="Xem lại kết quả này"
                        className="aspect-[3/4] rounded-sm overflow-hidden border border-slate-100 hover:border-primary transition-colors relative group">
                        <img src={entry.preview} className="w-full h-full object-cover opacity-80 group-hover:opacity-100" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: Results */}
            <div className="flex-1 min-w-0">

              {/* Header bar */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Kết quả tìm kiếm</p>
                  <h2 className="text-[17px] font-black text-slate-800 mt-0.5">
                    {searching ? 'Đang tìm kiếm...' : results ? `Top ${Math.min(results.length, 5)} gợi ý phù hợp` : 'Đang phân tích...'}
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => performSearch(fileObj, preview)}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-blue-500 font-bold transition-colors">
                    <RefreshCw size={10} /> Tìm lại
                  </button>
                  {results?.length > 0 && (
                    <Link to="/products" className="flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline whitespace-nowrap">
                      Xem tất cả <ArrowRight size={11} />
                    </Link>
                  )}
                </div>
              </div>

              {/* Skeleton: 1 hero + 4 small */}
              {searching && (
                <div className="grid grid-cols-3 grid-rows-2 gap-3" style={{ minHeight: 380 }}>
                  <SkeletonHero />
                  <SkeletonSmall />
                  <SkeletonSmall />
                  <SkeletonSmall />
                  <SkeletonSmall />
                </div>
              )}

              {/* Results: BENTO GRID — hero left (row-span-2) + 2×2 right */}
              {results && !searching && results.length > 0 && (() => {
                const displayResults = results.slice(0, 5);
                return (
                  <div className="grid grid-cols-3 grid-rows-2 gap-3" style={{ minHeight: 380 }}>
                    {/* Card 0 — HERO */}
                    <HeroCard product={displayResults[0]} score={displayResults[0].similarityScore ?? 0} />
                    {/* Cards 1–4 — SMALL */}
                    {displayResults.slice(1).map((p, i) => (
                      <SmallCard key={p.id} product={p} score={p.similarityScore ?? 0} index={i + 1} trending={i === 1} />
                    ))}
                  </div>
                );
              })()}

              {/* Empty */}
              {results && !searching && results.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100">
                  <ShoppingBag size={44} className="text-slate-200 mb-4" />
                  <p className="font-bold text-slate-500">Chưa có sản phẩm tương đồng</p>
                  <p className="text-sm text-slate-400 mt-1">Hãy thử ảnh khác nhé!</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
