import { create } from 'zustand';
import useAuthStore from './authStore';

const API = 'https://datn-webfss.onrender.com/api/reviews';

const useReviewStore = create((set, get) => ({
  // State
  reviews: [],           // danh sách review hiện tại
  summary: null,         // { averageRating, totalReviews, starCounts }
  totalPages: 0,
  currentPage: 0,
  loading: false,
  summaryLoading: false,
  submitting: false,
  error: null,

  // ── Lấy danh sách reviews ──────────────────────────────────────
  fetchReviews: async (productId, page = 0, size = 10) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API}/product/${productId}?page=${page}&size=${size}`);
      if (!res.ok) throw new Error('Không thể tải đánh giá');
      const data = await res.json();
      set({
        reviews: page === 0 ? data.content : [...get().reviews, ...data.content],
        totalPages: data.totalPages,
        currentPage: page,
        loading: false,
      });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  // ── Lấy summary thống kê ───────────────────────────────────────
  fetchSummary: async (productId) => {
    set({ summaryLoading: true });
    try {
      const res = await fetch(`${API}/product/${productId}/summary`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      set({ summary: data, summaryLoading: false });
    } catch {
      set({ summaryLoading: false });
    }
  },

  // ── Gửi đánh giá mới ──────────────────────────────────────────
  submitReview: async (productId, rating, comment) => {
    const { token } = useAuthStore.getState();
    if (!token) return { success: false, error: 'Vui lòng đăng nhập' };

    set({ submitting: true });
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, rating, comment }),
      });
      const data = await res.json();
      if (!data.success) {
        set({ submitting: false });
        return { success: false, error: data.error };
      }
      // Prepend review mới lên đầu danh sách
      set(state => ({
        reviews: [data.review, ...state.reviews],
        submitting: false,
      }));
      // Refresh summary
      get().fetchSummary(productId);
      return { success: true };
    } catch {
      set({ submitting: false });
      return { success: false, error: 'Lỗi kết nối' };
    }
  },

  // ── Xóa đánh giá ──────────────────────────────────────────────
  deleteReview: async (reviewId, productId) => {
    const { token } = useAuthStore.getState();
    if (!token) return { success: false, error: 'Vui lòng đăng nhập' };

    try {
      const res = await fetch(`${API}/${reviewId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!data.success) return { success: false, error: data.error };

      // Cập nhật lại danh sách reviews
      set(state => ({
        reviews: state.reviews.filter(r => r.id !== reviewId)
      }));
      // Refresh summary
      if (productId) get().fetchSummary(productId);
      return { success: true };
    } catch {
      return { success: false, error: 'Lỗi kết nối' };
    }
  },

  resetReviews: () => set({ reviews: [], summary: null, currentPage: 0, totalPages: 0 }),
}));

export default useReviewStore;
