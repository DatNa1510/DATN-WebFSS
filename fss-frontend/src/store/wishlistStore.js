import { create } from 'zustand';
import useAuthStore from './authStore';

const API_URL = 'https://datn-webfss.onrender.com/api/wishlist';

const useWishlistStore = create((set, get) => ({
  wishlist: [],
  isLoading: false,

  fetchWishlist: async () => {
    const { token } = useAuthStore.getState();
    if (!token) return;
    set({ isLoading: true });
    try {
      const res = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Normalize image URLs
        const mappedData = data.map(item => ({
          ...item,
          imageUrl: item.imageUrl ? (item.imageUrl.startsWith('http') ? item.imageUrl : `https://datn-webfss.onrender.com${item.imageUrl}`) : null
        }));
        set({ wishlist: mappedData });
      }
    } catch (e) {
      console.error(e);
    } finally {
      set({ isLoading: false });
    }
  },

  toggleWishlist: async (productId) => {
    const { token } = useAuthStore.getState();
    if (!token) return { success: false, error: 'Vui lòng đăng nhập' };
    try {
      const res = await fetch(`${API_URL}/${productId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        await get().fetchWishlist();
        return { success: true };
      }
      return { success: false };
    } catch (e) {
      return { success: false };
    }
  },

  checkWishlist: async (productId) => {
    const { token } = useAuthStore.getState();
    if (!token) return false;
    try {
      const res = await fetch(`${API_URL}/${productId}/check`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        return data.inWishlist;
      }
      return false;
    } catch (e) {
      return false;
    }
  }
}));

export default useWishlistStore;
