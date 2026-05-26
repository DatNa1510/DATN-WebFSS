import { create } from 'zustand';

let nextId = 1;

const useToastStore = create((set) => ({
  toasts: [],

  // type: 'success' | 'error' | 'warning' | 'info'
  addToast: (message, type = 'info', duration = 3500) => {
    // Ngăn chặn spam: Nếu đã có một toast với nội dung y hệt đang hiện, thì bỏ qua
    const state = useToastStore.getState();
    if (state.toasts.some((t) => t.message === message)) {
      return null;
    }

    const id = nextId++;
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }],
    }));
    return id;
  },

  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  clearAll: () => set({ toasts: [] }),
}));

// ── Shorthand helpers ────────────────────────────────
export const toast = {
  success: (msg, dur) => useToastStore.getState().addToast(msg, 'success', dur),
  error:   (msg, dur) => useToastStore.getState().addToast(msg, 'error',   dur),
  warning: (msg, dur) => useToastStore.getState().addToast(msg, 'warning', dur),
  info:    (msg, dur) => useToastStore.getState().addToast(msg, 'info',    dur),
  clearAll: () => useToastStore.getState().clearAll(),
};

export default useToastStore;
