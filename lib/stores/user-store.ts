/**
 * User Store - Zustand
 * Manages user profiles and active user selection
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/lib/types";

interface UserStore {
  users: User[];
  activeUserId: string | null;

  // Actions
  addUser: (user: Omit<User, "id" | "createdAt" | "lastActive">) => void;
  removeUser: (id: string) => void;
  setActiveUser: (id: string) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  updateUserEarnings: (id: string, amount: number) => void;
  incrementEntryCount: (id: string) => void;
  deductBalance: (id: string, amount: number) => boolean; // Returns false if insufficient balance
  addBalance: (id: string, amount: number) => void;
  getActiveUser: () => User | null;
  restoreUsers: (users: User[]) => void;
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      users: [],
      activeUserId: null,

      addUser: (userData) => {
        const newUser: User = {
          ...userData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          lastActive: new Date(),
          totalEarnings: userData.totalEarnings || 0,
          entryCount: userData.entryCount || 0,
          balance: userData.balance || 0,
        };

        set((state) => ({
          users: [...state.users, newUser],
          activeUserId:
            state.users.length === 0 ? newUser.id : state.activeUserId,
        }));
      },

      removeUser: (id) => {
        set((state) => {
          const filteredUsers = state.users.filter((u) => u.id !== id);
          const newActiveUserId =
            state.activeUserId === id
              ? filteredUsers[0]?.id || null
              : state.activeUserId;

          return {
            users: filteredUsers,
            activeUserId: newActiveUserId,
          };
        });
      },

      setActiveUser: (id) => {
        set((state) => {
          const updatedUsers = state.users.map((u) =>
            u.id === id ? { ...u, lastActive: new Date() } : u
          );
          return {
            users: updatedUsers,
            activeUserId: id,
          };
        });
      },

      updateUser: (id, data) => {
        set((state) => ({
          users: state.users.map((u) => (u.id === id ? { ...u, ...data } : u)),
        }));
      },

      updateUserEarnings: (id, amount) => {
        set((state) => ({
          users: state.users.map((u) =>
            u.id === id ? { ...u, totalEarnings: u.totalEarnings + amount } : u
          ),
        }));
      },

      incrementEntryCount: (id) => {
        set((state) => ({
          users: state.users.map((u) =>
            u.id === id ? { ...u, entryCount: u.entryCount + 1 } : u
          ),
        }));
      },

      deductBalance: (id, amount) => {
        const state = get();
        const user = state.users.find((u) => u.id === id);

        if (!user || user.balance < amount) {
          return false; // Insufficient balance
        }

        set((state) => ({
          users: state.users.map((u) =>
            u.id === id ? { ...u, balance: u.balance - amount } : u
          ),
        }));

        return true;
      },

      addBalance: (id, amount) => {
        set((state) => ({
          users: state.users.map((u) =>
            u.id === id ? { ...u, balance: u.balance + amount } : u
          ),
        }));
      },

      getActiveUser: () => {
        const state = get();
        return state.users.find((u) => u.id === state.activeUserId) || null;
      },

      restoreUsers: (users) => {
        set({
          users,
          activeUserId: users[0]?.id || null,
        });
      },
    }),
    {
      name: "binance-alpha-users",
    }
  )
);
