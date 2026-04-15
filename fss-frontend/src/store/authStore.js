import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Ảnh đại diện mặc định theo vai trò
export const DEFAULT_AVATARS = {
  admin: '/admin-pfp.jpg',
  customer: '/customer-pfp.jpg',
};

// Tài khoản demo (hiện tại vẫn là mock phía client)
const DEMO_ACCOUNTS_SEED = [
  { id: 1, name: 'Nguyễn Tiến Đạt', email: 'dat@example.com', password: '123456', role: 'customer', avatar: DEFAULT_AVATARS.customer },
  { id: 2, name: 'Admin FSS', email: 'admin@fss.vn', password: 'admin123', role: 'admin', avatar: DEFAULT_AVATARS.admin },
];

const useAuthStore = create(
  persist(
    (set, get) => ({
      // Lưu mảng tài khoản trong state để đăng ký vẫn đăng nhập được sau khi reload.
      // Lưu ý: đây chỉ là mock client (có chứa password) nên không phù hợp production.
      accounts: DEMO_ACCOUNTS_SEED,
      user: null,
      isAuthenticated: false,
      authError: null,

      login: (email, password) => {
        let { accounts } = get();
        // Fallback: ensure demo accounts are always available
        if (!accounts || accounts.length === 0) {
          accounts = DEMO_ACCOUNTS_SEED;
          set({ accounts });
        }
        const found = accounts.find((u) => u.email === email && u.password === password);
        if (found) {
          const { password: _, ...safeUser } = found;
          set({ user: safeUser, isAuthenticated: true, authError: null });
          return { success: true, role: safeUser.role };
        } else {
          set({ authError: 'Email hoặc mật khẩu không đúng.' });
          return { success: false };
        }
      },

      register: (name, email, password) => {
        const { accounts } = get();
        const exists = accounts.find((u) => u.email === email);
        if (exists) {
          set({ authError: 'Email này đã được sử dụng.' });
          return { success: false };
        }

        const nextId = Math.max(0, ...accounts.map((u) => u.id)) + 1;
        const newUser = {
          id: nextId,
          name,
          email,
          role: 'customer',
          avatar: DEFAULT_AVATARS.customer,
        };

        const nextAccount = { ...newUser, password };
        set((state) => ({
          accounts: [...state.accounts, nextAccount],
          user: newUser,
          isAuthenticated: true,
          authError: null,
        }));
        return { success: true };
      },

      logout: () => set({ user: null, isAuthenticated: false, authError: null }),

      clearError: () => set({ authError: null }),

      updateProfile: (data) =>
        set((state) => ({
          user: { ...state.user, ...data },
          accounts: state.accounts.map((a) =>
            a.id === state.user?.id ? { ...a, ...data } : a
          ),
        })),

      // Cập nhật ảnh đại diện - lưu base64 hoặc URL vào cả user và accounts
      updateAvatar: (avatarDataUrl) =>
        set((state) => ({
          user: { ...state.user, avatar: avatarDataUrl },
          accounts: state.accounts.map((a) =>
            a.id === state.user?.id ? { ...a, avatar: avatarDataUrl } : a
          ),
        })),
    }),
    {
      name: 'fss-auth',
      version: 5, 
      migrate: (persistedState) => {
        console.log("Migrating Auth Store version:", persistedState.version);
        // Cập nhật tên và avatar
        const fixAccount = (acc) => ({
          ...acc,
          name: (acc.name === 'Nguyễn Văn Đạt' || acc.name === 'Nguyễn Tiến Đạt') ? 'Nguyễn Tiến Đạt' : acc.name,
          avatar: DEFAULT_AVATARS[acc.role] ?? DEFAULT_AVATARS.customer,
        });

        // Ensure demo accounts are always present
        const persistedAccounts = persistedState.accounts ?? [];
        const fixedAccounts = persistedAccounts.length === 0 
          ? DEMO_ACCOUNTS_SEED 
          : persistedAccounts.map(fixAccount);

        const fixedUser = persistedState.user
          ? fixAccount(persistedState.user)
          : null;

        console.log("Fixed name for user:", fixedUser?.name);
        return {
          ...persistedState,
          accounts: fixedAccounts,
          user: fixedUser,
        };
      },
      partialize: (state) => ({
        accounts: state.accounts,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
