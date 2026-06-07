import { create } from 'zustand';
import axios from 'axios';
import useAuthStore from './authStore';
import { toast } from './toastStore';

const API_URL = 'https://datn-webfss.onrender.com/api/cart';
const BACKEND_BASE = 'https://datn-webfss.onrender.com';

// Helper to get auth headers
const getHeaders = () => {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('Vui lòng đăng nhập để sử dụng giỏ hàng');
  return {
    headers: { Authorization: `Bearer ${token}` }
  };
};

let isAuthRedirecting = false;

// Bắt lỗi phiên hết hạn / user không tồn tại → logout + redirect
const handleAuthError = (error) => {
  const status = error?.response?.status;
  const msg    = error?.response?.data?.error || error?.message || '';
  const isAuthErr = status === 401 || status === 403
    || msg.includes('Người dùng không tồn tại')
    || msg.includes('Phiên đăng nhập')
    || msg.includes('Unauthorized');

  if (isAuthErr) {
    if (!isAuthRedirecting) {
      isAuthRedirecting = true;
      useAuthStore.getState().logout();
      toast.warning('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại!');
      setTimeout(() => {
        isAuthRedirecting = false;
        window.location.href = '/login';
      }, 1500);
    }
    return true;
  }
  return false;
};

const useCartStore = create((set, get) => ({
  items: [],
  isOpen: false,
  isLoading: false,

  fetchCart: async () => {
    try {
      const token = useAuthStore.getState().token;
      if (!token) {
        set({ items: [], selectedKeys: [] });
        return;
      }
      set({ isLoading: true });
      const res = await axios.get(API_URL, getHeaders());
      // Map API response to our store format
      const mappedItems = res.data.map(item => {
        // Normalize image URL: thêm backend base nếu là đường dẫn tương đối
        const rawImage = item.image;
        const imageUrl = rawImage
          ? (rawImage.startsWith('http') ? rawImage : `${BACKEND_BASE}${rawImage}`)
          : null;

        return {
          key: item.id.toString(), // We use cart item id from backend as key!
          id: item.id,
          product: {
            id: item.productId,
            name: item.name,
            images: imageUrl ? [imageUrl] : [],
            image: imageUrl,
            price: item.price,
            originalPrice: item.originalPrice
          },
          size: item.size,
          color: '', // User did not want color in backend
          qty: item.quantity,
          price: item.price
        };
      });
      
      // Keep only selected keys that still exist in cart
      const currentKeys = mappedItems.map(i => i.key);
      set(state => ({ 
        items: mappedItems, 
        isLoading: false,
        selectedKeys: state.selectedKeys.filter(k => currentKeys.includes(k))
      }));
    } catch (error) {
      if (!handleAuthError(error)) {
        console.error('Failed to fetch cart', error);
      }
      set({ items: [], selectedKeys: [], isLoading: false });
    }
  },

  // Selection logic
  selectedKeys: [],
  toggleSelect: (key) => set((state) => {
    if (state.selectedKeys.includes(key)) {
      return { selectedKeys: state.selectedKeys.filter(k => k !== key) };
    } else {
      return { selectedKeys: [...state.selectedKeys, key] };
    }
  }),
  selectAll: () => set((state) => ({ selectedKeys: state.items.map(i => i.key) })),
  clearSelection: () => set({ selectedKeys: [] }),

  addItem: async (product, size, color, qty = 1) => {
    try {
      const token = useAuthStore.getState().token;
      if (!token) {
        toast.warning('Vui lòng đăng nhập để thêm vào giỏ hàng!');
        return false;
      }
      set({ isLoading: true });
      await axios.post(`${API_URL}/add`, {
        productId: product.id,
        quantity: qty,
        size: size
      }, getHeaders());
      // Refresh cart
      await get().fetchCart();
      return true;
    } catch (error) {
      set({ isLoading: false });
      if (!handleAuthError(error)) {
        const msg = error.response?.data?.error || 'Lỗi thêm vào giỏ hàng';
        toast.error(msg);
      }
      return false;
    }
  },

  removeItem: async (key) => {
    try {
      set({ isLoading: true });
      await axios.delete(`${API_URL}/remove/${key}`, getHeaders());
      await get().fetchCart();
    } catch (error) {
      set({ isLoading: false });
      if (!handleAuthError(error)) {
        console.error('Lỗi xóa mục giỏ hàng', error);
      }
    }
  },

  updateQty: async (key, qty) => {
    try {
      if (qty <= 0) {
        await get().removeItem(key);
        return;
      }
      set({ isLoading: true });
      await axios.put(`${API_URL}/update/${key}`, { quantity: qty }, getHeaders());
      await get().fetchCart();
    } catch (error) {
      set({ isLoading: false });
      if (!handleAuthError(error)) {
        const msg = error.response?.data?.error || 'Lỗi cập nhật số lượng';
        toast.error(msg);
      }
    } // refresh from backend if error (to reset optimistic UI if we had one)
  },

  clearCart: async () => {
    try {
      set({ isLoading: true });
      await axios.delete(`${API_URL}/clear`, getHeaders());
      set({ items: [], isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      if (!handleAuthError(error)) {
        console.error('Lỗi xóa giỏ hàng', error);
      }
    }
  },

  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),

  get totalItems() {
    return get().items.reduce((sum, i) => sum + i.qty, 0);
  },

  get totalPrice() {
    return get().items.reduce((sum, i) => sum + i.price * i.qty, 0);
  }
}));

export default useCartStore;
