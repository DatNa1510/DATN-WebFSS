import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_URL = 'http://localhost:8080/api/auth';

// Ảnh đại diện mặc định theo vai trò
export const DEFAULT_AVATARS = {
  admin: '/admin-pfp.jpg',
  customer: '/customer-pfp.jpg',
};

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      authError: null,

      login: async (email, password) => {
        try {
          const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          });

          const data = await response.json();

          if (!response.ok) {
            set({ authError: data.error || 'Đăng nhập thất bại' });
            return { success: false, error: data.error };
          }

          set({ 
            user: data.user, 
            token: data.token,
            isAuthenticated: true, 
            authError: null 
          });
          return { success: true, role: data.user.role };
        } catch (error) {
          set({ authError: 'Lỗi kết nối đến máy chủ.' });
          return { success: false, error: 'Network error' };
        }
      },

      register: async (name, email, password, phone = '') => {
        try {
          const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, phone }),
          });

          const data = await response.json();

          if (!response.ok) {
            set({ authError: data.error || 'Đăng ký thất bại, email có thể đã tồn tại' });
            return { success: false, error: data.error };
          }

          set({ authError: null });
          return { success: true };
        } catch (error) {
          set({ authError: 'Lỗi kết nối đến máy chủ.' });
          return { success: false, error: 'Network error' };
        }
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false, authError: null });
      },

      clearError: () => set({ authError: null }),

      // Khi ứng dụng khởi động, nếu có token thì gọi API này để lấy thông tin user mới nhất
      fetchCurrentUser: async () => {
        const { token } = get();
        if (!token) return;

        try {
          const response = await fetch(`${API_URL}/me`, {
            method: 'GET',
            headers: { 
              'Authorization': `Bearer ${token}` 
            },
          });

          if (response.ok) {
            const userData = await response.json();
            set({ user: userData, isAuthenticated: true });
          } else {
            // Token hết hạn hoặc không hợp lệ -> Logout
            get().logout();
          }
        } catch (error) {
          console.error("Failed to fetch user");
        }
      },

      updateProfile: (data) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null
        })),

      updateAvatar: (avatarDataUrl) =>
        set((state) => ({
          user: state.user ? { ...state.user, avatar: avatarDataUrl } : null
        })),
    }),
    {
      name: 'fss-auth',
      version: 6,
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
