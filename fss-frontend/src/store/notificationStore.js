import { create } from 'zustand';
import axios from 'axios';
import useAuthStore from './authStore';
import { API_BASE } from '../config/api';

const getHeaders = () => {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('Chưa đăng nhập');
  return { headers: { Authorization: `Bearer ${token}` } };
};

// ── Auto-refresh token wrapper ──
const requestWithRetry = async (requestFn) => {
  try {
    return await requestFn();
  } catch (error) {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      // Thử refresh token
      const refreshed = await useAuthStore.getState().refreshAuthToken();
      if (refreshed) {
        // Retry với token mới
        return await requestFn();
      } else {
        useAuthStore.getState().logout();
        throw new Error('Phiên đăng nhập đã hết hạn');
      }
    }
    throw error;
  }
};

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    if (!useAuthStore.getState().token) return;
    try {
      const res = await requestWithRetry(() => axios.get(`${API_BASE}/api/notifications`, getHeaders()));
      
      const data = res.data || {};
      const newNotifications = Array.isArray(data) ? data : (data.items || []);

      set({ notifications: newNotifications });
      get().fetchUnreadCount();
    } catch (error) {
      console.error('Fetch notifications failed', error);
    }
  },

  fetchUnreadCount: async () => {
    if (!useAuthStore.getState().token) return;
    try {
      const res = await requestWithRetry(() => axios.get(`${API_BASE}/api/notifications/unread-count`, getHeaders()));
      set({ unreadCount: res.data.count });
    } catch (error) {
      console.error('Fetch unread count failed', error);
    }
  },

  markAsRead: async (id) => {
    try {
      await requestWithRetry(() => axios.put(`${API_BASE}/api/notifications/${id}/read`, {}, getHeaders()));
      set(s => ({
        notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n),
        unreadCount: Math.max(0, s.unreadCount - 1)
      }));
    } catch (error) {
      console.error('Mark as read failed', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await requestWithRetry(() => axios.put(`${API_BASE}/api/notifications/read-all`, {}, getHeaders()));
      set(s => ({
        notifications: s.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0
      }));
    } catch (error) {
      console.error('Mark all as read failed', error);
    }
  },

  markAsUnread: async (id) => {
    try {
      await requestWithRetry(() => axios.put(`${API_BASE}/api/notifications/${id}/unread`, {}, getHeaders()));
      set(s => ({
        notifications: s.notifications.map(n => n.id === id ? { ...n, read: false } : n),
        unreadCount: s.unreadCount + 1
      }));
    } catch (error) {
      console.error('Mark as unread failed', error);
    }
  },

  deleteNotification: async (id) => {
    try {
      await requestWithRetry(() => axios.delete(`${API_BASE}/api/notifications/${id}`, getHeaders()));
      set(s => {
        const notif = s.notifications.find(n => n.id === id);
        return {
          notifications: s.notifications.filter(n => n.id !== id),
          unreadCount: notif && !notif.read ? Math.max(0, s.unreadCount - 1) : s.unreadCount
        };
      });
    } catch (error) {
      console.error('Delete notification failed', error);
    }
  },

  deleteAllNotifications: async () => {
    try {
      await requestWithRetry(() => axios.delete(`${API_BASE}/api/notifications`, getHeaders()));
      set({ notifications: [], unreadCount: 0 });
    } catch (error) {
      console.error('Delete all notifications failed', error);
    }
  },

  fetchNotificationsWithFilters: async (page = 0, limit = 15, search = '', type = 'ALL', read = 'ALL') => {
    if (!useAuthStore.getState().token) return;
    set({ isLoading: true });
    try {
      const params = new URLSearchParams({
        page,
        limit,
        search,
        type: type === 'ALL' ? '' : type,
        read: read === 'ALL' ? '' : read
      });

      const res = await requestWithRetry(() => axios.get(`${API_BASE}/api/notifications?${params}`, getHeaders()));

      return {
        items: res.data.items || [],
        total: res.data.total || 0,
        totalPages: res.data.totalPages || 1,
        currentPage: res.data.currentPage || 0
      };
    } catch (error) {
      console.error('Fetch notifications with filters failed', error);
      return {
        items: [],
        total: 0,
        totalPages: 1,
        currentPage: 0
      };
    } finally {
      set({ isLoading: false });
    }
  },

  getUnreadCount: () => {
    return get().unreadCount;
  },

  getTotalCount: () => {
    return get().notifications.length;
  }
}));

export default useNotificationStore;
