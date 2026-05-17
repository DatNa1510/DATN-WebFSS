import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API_URL = 'http://localhost:8080/api/auth';

// Ảnh đại diện mặc định theo vai trò
export const DEFAULT_AVATARS = {
  admin: '/admin-pfp.jpg',
  customer: '/default-customer.jpg',
};

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      authError: null,
      auditLogs: [],

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
            refreshToken: data.refreshToken,
            isAuthenticated: true, 
            authError: null 
          });
          return { success: true, role: data.user.role };
        } catch (error) {
          set({ authError: 'Lỗi kết nối đến máy chủ.' });
          return { success: false, error: 'Network error' };
        }
      },

      googleLogin: async (googleToken) => {
        try {
          const response = await fetch(`${API_URL}/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: googleToken }),
          });

          const data = await response.json();

          if (!response.ok) {
            set({ authError: data.error || 'Đăng nhập Google thất bại' });
            return { success: false, error: data.error };
          }

          set({ 
            user: data.user, 
            token: data.token,
            refreshToken: data.refreshToken,
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

      resendVerification: async (email) => {
        try {
          const response = await fetch(`${API_URL}/resend-verification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });
          const data = await response.json();
          if (!response.ok) {
             set({ authError: data.error || 'Lỗi gửi lại email' });
             return { success: false, error: data.error };
          }
          set({ authError: null });
          return { success: true, message: data.message };
        } catch (error) {
           set({ authError: 'Lỗi kết nối đến máy chủ.' });
           return { success: false, error: 'Network error' };
        }
      },

      logout: () => {
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false, authError: null });
      },

      clearError: () => set({ authError: null }),

      // Đổi Refresh Token lấy Access Token mới
      refreshAuthToken: async () => {
        const { refreshToken, logout } = get();
        if (!refreshToken) {
          logout();
          return false;
        }

        try {
          const response = await fetch(`${API_URL}/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          if (response.ok) {
            const data = await response.json();
            set({ 
              token: data.token, 
              refreshToken: data.refreshToken, // Giữ lại hoặc cập nhật refresh token mới
              user: data.user,
              isAuthenticated: true 
            });
            return true;
          } else {
            logout();
            return false;
          }
        } catch (error) {
          logout();
          return false;
        }
      },

      // Khi ứng dụng khởi động, nếu có token thì gọi API này để lấy thông tin user mới nhất
      fetchCurrentUser: async () => {
        const { token, refreshAuthToken, logout } = get();
        if (!token) return;

        try {
          let response = await fetch(`${API_URL}/me`, {
            method: 'GET',
            headers: { 
              'Authorization': `Bearer ${token}` 
            },
          });

          if (response.ok) {
            const userData = await response.json();
            set({ user: userData, isAuthenticated: true });
          } else if (response.status === 401) {
            // Token hết hạn -> Thử Refresh Token
            const refreshed = await refreshAuthToken();
            if (refreshed) {
              // Refresh thành công -> Gọi lại API /me bằng token mới
              const newToken = get().token;
              const retryResponse = await fetch(`${API_URL}/me`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${newToken}` },
              });
              if (retryResponse.ok) {
                const userData = await retryResponse.json();
                set({ user: userData, isAuthenticated: true });
              } else {
                logout();
              }
            } else {
              // Refresh thất bại -> Logout luôn
              logout();
            }
          } else {
            logout();
          }
        } catch (error) {
          console.error("Failed to fetch user");
          logout();
        }
      },

      updateProfile: async (data) => {
        const { token } = get();
        if (!token) return { success: false, error: 'Chưa đăng nhập' };
        try {
          const res = await fetch(`${API_URL}/profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(data),
          });
          const json = await res.json();
          if (!res.ok) return { success: false, error: json.error || 'Lỗi cập nhật hồ sơ' };
          // Cập nhật user state từ response
          set(state => ({ user: state.user ? { ...state.user, ...json } : null }));
          get().fetchAuditLogs();
          return { success: true };
        } catch {
          return { success: false, error: 'Lỗi kết nối' };
        }
      },

      changePassword: async (oldPassword, newPassword) => {
        const { token } = get();
        if (!token) return { success: false, error: 'Chưa đăng nhập' };
        try {
          const res = await fetch(`${API_URL}/change-password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ oldPassword, newPassword }),
          });
          const json = await res.json();
          if (!res.ok) return { success: false, error: json.error || 'Lỗi đổi mật khẩu' };
          get().fetchAuditLogs();
          return { success: true, message: json.message };
        } catch {
          return { success: false, error: 'Lỗi kết nối' };
        }
      },

      updateAvatar: (avatarDataUrl) =>
        set((state) => ({
          user: state.user ? { ...state.user, avatar: avatarDataUrl } : null
        })),

      fetchAuditLogs: async () => {
        const { token } = get();
        if (!token) return;
        try {
          const res = await fetch(`${API_URL}/audit-logs`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            set({ auditLogs: data });
          }
        } catch (error) {
          console.error("Failed to fetch audit logs", error);
        }
      },
    }),
    {
      name: 'fss-auth',
      version: 8, // Tăng lên 8 vì thêm changePassword
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
