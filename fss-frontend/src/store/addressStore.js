import { create } from 'zustand';
import useAuthStore from './authStore';

const API_URL = 'https://datn-webfss.onrender.com/api/addresses';

const useAddressStore = create((set, get) => ({
  addresses: [],
  isLoading: false,

  fetchAddresses: async () => {
    const { token } = useAuthStore.getState();
    if (!token) return;
    set({ isLoading: true });
    try {
      const res = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        set({ addresses: data });
      }
    } catch (e) {
      console.error(e);
    } finally {
      set({ isLoading: false });
    }
  },

  addAddress: async (dto) => {
    const { token } = useAuthStore.getState();
    if (!token) return { success: false, error: 'Chưa đăng nhập' };
    set({ isLoading: true });
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(dto)
      });
      if (res.ok) {
        await get().fetchAddresses();
        return { success: true };
      }
      return { success: false, error: 'Thêm thất bại' };
    } catch (e) {
      return { success: false, error: 'Lỗi mạng' };
    } finally {
      set({ isLoading: false });
    }
  },

  updateAddress: async (id, dto) => {
    const { token } = useAuthStore.getState();
    if (!token) return { success: false, error: 'Chưa đăng nhập' };
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(dto)
      });
      if (res.ok) {
        await get().fetchAddresses();
        return { success: true };
      }
      return { success: false, error: 'Cập nhật thất bại' };
    } catch (e) {
      return { success: false, error: 'Lỗi mạng' };
    } finally {
      set({ isLoading: false });
    }
  },

  deleteAddress: async (id) => {
    const { token } = useAuthStore.getState();
    if (!token) return { success: false, error: 'Chưa đăng nhập' };
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        await get().fetchAddresses();
        return { success: true };
      }
      return { success: false, error: 'Xóa thất bại' };
    } catch (e) {
      return { success: false, error: 'Lỗi mạng' };
    } finally {
      set({ isLoading: false });
    }
  }
}));

export default useAddressStore;
