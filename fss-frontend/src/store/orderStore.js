import { create } from 'zustand';
import axios from 'axios';
import useAuthStore from './authStore';
import { API_BASE } from '../config/api';

const API_URL = `${API_BASE}/api/orders`;
const BACKEND_BASE = API_BASE;

const getHeaders = () => {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('Chưa đăng nhập');
  return { headers: { Authorization: `Bearer ${token}` } };
};

// Normalize image URL từ backend path
const normalizeImage = (img) => {
  if (!img) return null;
  return img.startsWith('http') ? img : `${BACKEND_BASE}${img}`;
};

const useOrderStore = create((set, get) => ({
  orders: [],
  isLoading: false,
  error: null,

  // Lấy danh sách đơn hàng
  fetchOrders: async () => {
    try {
      const token = useAuthStore.getState().token;
      if (!token) { set({ orders: [] }); return; }
      set({ isLoading: true, error: null });
      const res = await axios.get(API_URL, getHeaders());
      // Normalize image URLs
      const orders = res.data.map(order => ({
        ...order,
        items: order.items.map(item => ({
          ...item,
          productImage: normalizeImage(item.productImage),
        }))
      }));
      set({ orders, isLoading: false });
    } catch (err) {
      set({ isLoading: false, error: err.response?.data?.error || 'Lỗi tải đơn hàng' });
    }
  },

  // Đặt hàng từ giỏ hàng
  placeOrder: async (payload) => {
    try {
      set({ isLoading: true, error: null });
      const res = await axios.post(API_URL, payload, getHeaders());
      const newOrder = {
        ...res.data.order,
        items: (res.data.order.items || []).map(item => ({
          ...item,
          productImage: normalizeImage(item.productImage),
        }))
      };
      
      // Cập nhật thông báo ngay lập tức
      const { fetchNotifications } = (await import('./notificationStore')).default.getState();
      fetchNotifications();

      // Thêm vào đầu danh sách
      set(state => ({
        orders: [newOrder, ...state.orders],
        isLoading: false,
      }));
      return { success: true, order: newOrder };
    } catch (err) {
      const msg = err.response?.data?.error || 'Lỗi đặt hàng';
      set({ isLoading: false, error: msg });
      return { success: false, error: msg };
    }
  },

  // Huỷ đơn hàng (cần lý do)
  cancelOrder: async (orderId, reason) => {
    try {
      set({ isLoading: true });
      const res = await axios.patch(`${API_URL}/${orderId}/cancel`, { reason }, getHeaders());
      const updated = res.data.order;
      set(state => ({
        orders: state.orders.map(o => o.id === updated.id ? { ...o, ...updated } : o),
        isLoading: false,
      }));
      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.error || 'Lỗi huỷ đơn hàng';
      set({ isLoading: false });
      return { success: false, error: msg };
    }
  },

  clearError: () => set({ error: null }),
}));

export default useOrderStore;
