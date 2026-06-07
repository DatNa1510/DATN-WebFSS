import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ShieldCheck, ChevronDown, Loader2, Send, Trash2, AlertCircle } from 'lucide-react';
import useReviewStore from '../../store/reviewStore';
import useAuthStore from '../../store/authStore';
import { toast } from '../../store/toastStore';
import ConfirmModal from './ConfirmModal';

const API_BASE = 'http://localhost:8080';

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/* ── Interactive Star Picker ───────────────────────────────── */
function StarPicker({ value, onChange, size = 28 }) {
  const [hovered, setHovered] = useState(0);
  const labels = ['', 'Rất tệ', 'Tệ', 'Bình thường', 'Tốt', 'Xuất sắc'];
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(s => (
          <button key={s} type="button"
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(s)}
            className="focus:outline-none transition-transform active:scale-90 hover:scale-110">
            <Star size={size}
              className={`transition-colors duration-150 ${s <= (hovered || value)
                ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
          </button>
        ))}
      </div>
      {(hovered || value) > 0 && (
        <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
          className="text-[12px] font-bold text-amber-600">
          {labels[hovered || value]}
        </motion.span>
      )}
    </div>
  );
}

/* ── Rating Summary ────────────────────────────────────────── */
function RatingSummary({ summary, activeFilter, onFilter }) {
  if (!summary) return null;
  const { averageRating, totalReviews, starCounts } = summary;
  const TABS = [
    { label: 'Tất cả', value: 'all' },
    { label: 'Có nhận xét', value: 'commented' },
    { label: '5★', value: 5 }, { label: '4★', value: 4 },
    { label: '3★', value: 3 }, { label: '2★', value: 2 }, { label: '1★', value: 1 },
  ];

  return (
    <div className="bg-white border-2 border-transparent shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-6 mb-5">
      <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center">
        {/* Big Score */}
        <div className="flex flex-col items-center min-w-[100px]">
          <span className="text-5xl font-black text-slate-900 leading-none">{Number(averageRating).toFixed(1)}</span>
          <div className="flex gap-0.5 mt-2">
            {[1,2,3,4,5].map(s => (
              <Star key={s} size={14}
                className={s <= Math.round(averageRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">{totalReviews} đánh giá</p>
        </div>

        {/* Star Bars */}
        <div className="flex-1 w-full flex flex-col gap-2">
          {[5, 4, 3, 2, 1].map(star => {
            const count = starCounts?.[star] ?? 0;
            const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            return (
              <button key={star} onClick={() => onFilter(activeFilter === star ? 'all' : star)}
                className={`flex items-center gap-3 group w-full text-left py-0.5 px-2 transition-colors ${
                  activeFilter === star ? 'bg-amber-50' : 'hover:bg-slate-50'}`}>
                <span className="text-[11px] font-bold text-slate-500 w-5 shrink-0">{star}★</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-none overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, delay: (5 - star) * 0.06 }}
                    className="h-full bg-amber-400" />
                </div>
                <span className="text-[11px] text-slate-400 w-6 text-right shrink-0">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-slate-100">
        {TABS.map(f => (
          <button key={f.value} onClick={() => onFilter(f.value)}
            className={`px-3 py-1.5 text-[11px] font-bold border transition-all duration-200 ${
              activeFilter === f.value
                ? 'bg-[#00168d] text-white border-[#00168d]'
                : 'bg-white text-slate-600 border-slate-200 hover:border-[#00168d] hover:text-[#00168d]'}`}>
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Review Form ───────────────────────────────────────────── */
function ReviewForm({ productId, onSuccess }) {
  const { isAuthenticated } = useAuthStore();
  const { submitting, submitReview } = useReviewStore();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { toast.warning('Vui lòng chọn số sao!'); return; }
    const res = await submitReview(productId, rating, comment);
    if (res.success) {
      toast.success('Cảm ơn bạn đã đánh giá! ⭐');
      setDone(true); setRating(0); setComment('');
      onSuccess?.();
    } else {
      toast.error(res.error || 'Gửi đánh giá thất bại');
    }
  };

  if (!isAuthenticated) return (
    <div className="bg-slate-50 border border-slate-200 p-6 text-center mb-5">
      <p className="text-sm font-bold text-slate-500">Vui lòng đăng nhập để đánh giá sản phẩm</p>
    </div>
  );

  if (done) return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="bg-emerald-50 border border-emerald-200 p-5 text-center mb-5">
      <ShieldCheck size={24} className="text-emerald-500 mx-auto mb-2" />
      <p className="font-bold text-emerald-700 text-sm">Đánh giá của bạn đã được ghi nhận!</p>
    </motion.div>
  );

  return (
    <div className="bg-white border-2 border-transparent shadow-[0_4px_24px_rgba(0,0,0,0.02)] p-6 mb-5">
      <div className="flex items-center gap-2 mb-6 p-3 bg-amber-50/50 border border-amber-100 text-[12px] font-bold text-amber-700">
        <AlertCircle size={14} />
        <span>Lưu ý: Chỉ khách hàng đã mua và nhận hàng thành công mới có thể để lại đánh giá.</span>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <p className="text-sm font-bold text-slate-600 mb-2">Chất lượng sản phẩm <span className="text-red-500">*</span></p>
          <StarPicker value={rating} onChange={setRating} />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-600 mb-2">Nhận xét của bạn</p>
          <textarea value={comment} onChange={e => setComment(e.target.value)}
            placeholder="Chia sẻ trải nghiệm thực tế của bạn về sản phẩm này..."
            maxLength={1000} rows={3}
            className="w-full px-4 py-3 text-[13px] border border-slate-200 focus:outline-none focus:border-[#00168d] focus:ring-2 focus:ring-[#00168d]/10 transition-all resize-none placeholder:text-slate-300" />
          <p className="text-[10px] text-slate-400 text-right mt-1">{comment.length}/1000</p>
        </div>
        <div>
          <button type="submit" disabled={submitting || rating === 0}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#00168d] text-white text-[13px] font-bold hover:bg-[#001270] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting
              ? <><Loader2 size={13} className="animate-spin" /> Đang gửi...</>
              : <><Send size={13} /> Gửi đánh giá</>}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ── Single Review Card ────────────────────────────────────── */
function ReviewCard({ review, index, productId }) {
  const { user } = useAuthStore();
  const { deleteReview } = useReviewStore();
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const avatarUrl = review.userAvatarUrl
    ? (review.userAvatarUrl.startsWith('http') ? review.userAvatarUrl : `${API_BASE}${review.userAvatarUrl}`)
    : null;

  const isOwner = user?.id === review.userId;

  const handleDelete = async () => {
    setDeleting(true);
    const res = await deleteReview(review.id, productId);
    if (res.success) toast.success('Đã xóa đánh giá');
    else toast.error(res.error);
    setDeleting(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={`py-5 border-b border-slate-100 last:border-0 relative ${deleting ? 'opacity-50 grayscale' : ''}`}>
      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title="Xóa đánh giá"
        message="Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể hoàn tác."
        isDanger={true}
        confirmText="Xóa"
      />
      <div className="flex gap-3">
        {/* Avatar */}
        {avatarUrl
          ? <img src={avatarUrl} alt={review.userFullName}
              className="w-9 h-9 object-cover shrink-0 border border-slate-200" />
          : <div className="w-9 h-9 bg-gradient-to-br from-[#00168d] to-[#7c3aed] flex items-center justify-center shrink-0">
              <span className="text-white font-black text-[13px]">
                {(review.userFullName || 'U')[0].toUpperCase()}
              </span>
            </div>
        }
        <div className="flex-1 min-w-0">
          {/* Name + badges */}
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="font-black text-[13px] text-slate-800">{review.userFullName || 'Người dùng'}</span>
            {review.verifiedPurchase && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5">
                <ShieldCheck size={9} /> Đã mua hàng
              </span>
            )}
            <span className="text-[11px] text-slate-400 ml-auto">{formatDate(review.createdAt)}</span>

            {isOwner && (
              <button 
                onClick={() => setShowConfirm(true)}
                disabled={deleting}
                className="p-1 text-slate-300 hover:text-red-500 transition-colors ml-2"
                title="Xóa đánh giá"
              >
                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              </button>
            )}
          </div>
          {/* Stars */}
          <div className="flex gap-0.5 mb-2">
            {[1,2,3,4,5].map(s => (
              <Star key={s} size={12}
                className={s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'} />
            ))}
          </div>
          {/* Comment */}
          {review.comment && (
            <p className="text-[13px] text-slate-600 leading-relaxed">{review.comment}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Main Component ────────────────────────────────────────── */
export default function ProductReviews({ productId }) {
  const { reviews, summary, loading, totalPages, currentPage,
          fetchReviews, fetchSummary, resetReviews } = useReviewStore();
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    if (!productId) return;
    resetReviews();
    fetchReviews(productId, 0, 10);
    fetchSummary(productId);
  }, [productId]);

  const filtered = reviews.filter(r => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'commented') return r.comment?.trim().length > 0;
    return r.rating === activeFilter;
  });

  return (
    <section className="mt-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
          Phản hồi từ khách hàng
          {summary && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-[12px] font-black">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              {Number(summary.averageRating).toFixed(1)}
            </span>
          )}
        </h2>
      </div>
      </div>

      {/* Rating Summary */}
      <RatingSummary summary={summary} activeFilter={activeFilter} onFilter={setActiveFilter} />

      {/* Write Review */}
      <ReviewForm productId={productId} onSuccess={() => fetchSummary(productId)} />

      {/* Review List */}
      <div className="bg-white border-2 border-transparent shadow-[0_4px_24px_rgba(0,0,0,0.02)] px-6">
        {loading && reviews.length === 0 && (
          <div className="flex justify-center py-12">
            <Loader2 size={28} className="animate-spin text-[#00168d]" />
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-12">
            <Star size={36} className="text-slate-200 mb-3" />
            <p className="font-bold text-slate-500 text-sm">Chưa có đánh giá nào</p>
            <p className="text-[12px] text-slate-400 mt-1">Hãy là người đầu tiên nhận xét về sản phẩm này!</p>
          </div>
        )}
        <AnimatePresence>
          {filtered.map((r, i) => <ReviewCard key={r.id} review={r} index={i} productId={productId} />)}
        </AnimatePresence>
        {currentPage < totalPages - 1 && (
          <div className="flex justify-center py-4">
            <button onClick={() => fetchReviews(productId, currentPage + 1, 10)}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2 border border-slate-200 text-[12px] font-bold text-slate-600 hover:border-[#00168d] hover:text-[#00168d] transition-colors disabled:opacity-50">
              {loading ? <Loader2 size={13} className="animate-spin" /> : <ChevronDown size={13} />}
              Xem thêm đánh giá
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
