import { create } from 'zustand';
import { CashDrawerSession, User } from '../types';

interface AuthState {
  currentUser: User | null;
  currentSession: CashDrawerSession | null;
  login: (username: string, role?: 'admin' | 'manager' | 'cashier') => void;
  logout: () => void;
  openSession: (openingCash: number) => void;
  closeSession: (closingCash: number, expectedCash: number) => void;
}

const DEFAULT_USER: User = {
  id: 'usr-admin-1',
  username: 'admin',
  name: 'Administrateur Principal',
  role: 'admin',
  is_active: true,
  created_at: new Date().toISOString(),
};

const DEFAULT_SESSION: CashDrawerSession = {
  id: 'sess-today',
  user_id: 'usr-admin-1',
  user_name: 'Administrateur Principal',
  opening_cash: 10000.0,
  opened_at: new Date().toISOString(),
  status: 'open',
};

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: DEFAULT_USER,
  currentSession: DEFAULT_SESSION,

  login: (username: string, role = 'admin') => {
    set({
      currentUser: {
        id: `usr-${Date.now()}`,
        username,
        name: username.toUpperCase(),
        role,
        is_active: true,
        created_at: new Date().toISOString(),
      },
    });
  },

  logout: () => {
    set({ currentUser: null });
  },

  openSession: (openingCash: number) => {
    set({
      currentSession: {
        id: `sess-${Date.now()}`,
        opening_cash: openingCash,
        opened_at: new Date().toISOString(),
        status: 'open',
      },
    });
  },

  closeSession: (closingCash: number, expectedCash: number) => {
    set((state) => ({
      currentSession: state.currentSession
        ? {
            ...state.currentSession,
            closing_cash: closingCash,
            expected_cash: expectedCash,
            difference: closingCash - expectedCash,
            closed_at: new Date().toISOString(),
            status: 'closed',
          }
        : null,
    }));
  },
}));
