/**
 * UI Store - Zustand
 * Manages UI state like modals, toasts, sidebar
 */

import { create } from "zustand";
import { Toast } from "@/lib/types";

interface UIStore {
  sidebarOpen: boolean;
  activeModal: string | null;
  toasts: Toast[];

  // Sidebar actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Modal actions
  openModal: (modalId: string) => void;
  closeModal: () => void;

  // Toast actions
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: false,
  activeModal: null,
  toasts: [],

  toggleSidebar: () => {
    set((state) => ({ sidebarOpen: !state.sidebarOpen }));
  },

  setSidebarOpen: (open) => {
    set({ sidebarOpen: open });
  },

  openModal: (modalId) => {
    set({ activeModal: modalId });
  },

  closeModal: () => {
    set({ activeModal: null });
  },

  addToast: (toastData) => {
    const toast: Toast = {
      ...toastData,
      id: crypto.randomUUID(),
      duration: toastData.duration || 5000,
    };

    set((state) => {
      // Keep max 3 toasts
      const newToasts = [...state.toasts, toast];
      if (newToasts.length > 3) {
        return { toasts: newToasts.slice(-3) };
      }
      return { toasts: newToasts };
    });

    // Auto-remove toast after duration
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== toast.id),
        }));
      }, toast.duration);
    }
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearToasts: () => {
    set({ toasts: [] });
  },
}));
