import { create } from 'zustand';
import axios from 'axios';
import useAuthStore from './authStore';
import { toast } from './toastStore';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    if (!useAuthStore.getState().token) return;
    try {
      const res = await axios.get('http://localhost:8080/api/notifications', {
        headers: { Authorization: `Bearer ${useAuthStore.getState().token}` }
      });
      
      const data = res.data || {};
      const newNotifications = Array.isArray(data) ? data : (data.items || []);
      const oldNotifications = Array.isArray(get().notifications) ? get().notifications : [];

      // Chỉ cập nhật danh sách thông báo mới vào state (không tự động nhảy popup toast nữa)
      // Thông báo mới sẽ chỉ được báo qua số lượng unreadCount trên quả chuông.

      set({ notifications: newNotifications });
      get().fetchUnreadCount();
    } catch (error) {
      console.error('Fetch notifications failed', error);
    }
  },

  fetchUnreadCount: async () => {
    if (!useAuthStore.getState().token) return;
    try {
      const res = await axios.get('http://localhost:8080/api/notifications/unread-count', {
        headers: { Authorization: `Bearer ${useAuthStore.getState().token}` }
      });
      set({ unreadCount: res.data.count });
    } catch (error) {
      console.error('Fetch unread count failed', error);
    }
  },

  markAsRead: async (id) => {
    try {
      await axios.put(`http://localhost:8080/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${useAuthStore.getState().token}` }
      });
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
      await axios.put('http://localhost:8080/api/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${useAuthStore.getState().token}` }
      });
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
      await axios.put(`http://localhost:8080/api/notifications/${id}/unread`, {}, {
        headers: { Authorization: `Bearer ${useAuthStore.getState().token}` }
      });
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
      await axios.delete(`http://localhost:8080/api/notifications/${id}`, {
        headers: { Authorization: `Bearer ${useAuthStore.getState().token}` }
      });
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
      await axios.delete('http://localhost:8080/api/notifications', {
        headers: { Authorization: `Bearer ${useAuthStore.getState().token}` }
      });
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

      const res = await axios.get(`http://localhost:8080/api/notifications?${params}`, {
        headers: { Authorization: `Bearer ${useAuthStore.getState().token}` }
      });

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
