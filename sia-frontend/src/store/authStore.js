import { create } from 'zustand';
import { pb } from '../lib/pb';

export const useAuthStore = create((set) => ({
  user: pb.authStore.record,
  isValid: pb.authStore.isValid,
  login: async (username, password) => {
    try {
      const authData = await pb.collection('users').authWithPassword(username, password);
      set({ user: pb.authStore.record, isValid: pb.authStore.isValid });
      return { success: true, data: authData };
    } catch (error) {
      return { success: false, error };
    }
  },
  logout: () => {
    pb.authStore.clear();
    set({ user: null, isValid: false });
  },
  checkAuth: () => {
    set({ user: pb.authStore.record, isValid: pb.authStore.isValid });
  }
}));

// Sync auth store automatically with pocketbase events
pb.authStore.onChange((token, model) => {
  useAuthStore.setState({ user: model, isValid: !!token });
});
