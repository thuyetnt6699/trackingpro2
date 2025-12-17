import { User } from '../types';

const STORAGE_KEY_USER = 'chinatrack_user';

export const authService = {
  login: async (email: string, isAdmin: boolean): Promise<User> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const user: User = {
      email,
      name: email.split('@')[0],
      isAdmin,
    };
    
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    return user;
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY_USER);
  },

  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem(STORAGE_KEY_USER);
    return stored ? JSON.parse(stored) : null;
  }
};