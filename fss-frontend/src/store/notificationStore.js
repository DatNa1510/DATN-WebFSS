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
      
      const newNotifications = res.data;
      const oldNotifications = get().notifications;

      // Nếu có thông báo mới (chưa từng thấy trước đây và chưa đọc)
      if (oldNotifications.length > 0) {
        const reallyNew = newNotifications.filter(
          nn => !nn.read && !oldNotifications.some(on => on.id === nn.id)
        );
        
        reallyNew.forEach(n => {
          if (n.type === 'SUCCESS') toast.success(n.message);
          else if (n.type === 'ERROR') toast.error(n.message);
          else if (n.type === 'WARNING') toast.warning(n.message);
          else toast.info(n.message);
        });
      }

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
  }
}));

export default useNotificationStore;
