/**
 * useToast Hook
 * Convenience hook for showing toasts
 */

import { useUIStore } from "@/lib/stores/ui-store";

export function useToast() {
  const addToast = useUIStore((state) => state.addToast);

  return {
    toast: addToast,
    success: (title: string, description?: string) => {
      addToast({ type: "success", title, description });
    },
    error: (title: string, description?: string) => {
      addToast({ type: "error", title, description });
    },
    warning: (title: string, description?: string) => {
      addToast({ type: "warning", title, description });
    },
    info: (title: string, description?: string) => {
      addToast({ type: "info", title, description });
    },
    airdrop: (title: string, description?: string) => {
      addToast({ type: "airdrop", title, description });
    },
  };
}
