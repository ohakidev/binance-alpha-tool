'use client';

/**
 * Game-style Toast Notification Component
 * Animated notifications with different types
 */

import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, XCircle, AlertTriangle, Info, Bell } from 'lucide-react';
import { useUIStore } from '@/lib/stores/ui-store';
import { Toast as ToastType } from '@/lib/types';
import { bounceVariants } from '@/lib/animations';

const toastIcons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  airdrop: Bell,
};

const toastStyles = {
  success: 'border-[#10B981] bg-[#10B981]/20',
  error: 'border-[#EF4444] bg-[#EF4444]/20',
  warning: 'border-[#F59E0B] bg-[#F59E0B]/20',
  info: 'border-[#00CED1] bg-[#00CED1]/20',
  airdrop: 'border-[#FFD700] bg-[#FFD700]/20 glow-gold',
};

const iconStyles = {
  success: 'text-[#10B981]',
  error: 'text-[#EF4444]',
  warning: 'text-[#F59E0B]',
  info: 'text-[#00CED1]',
  airdrop: 'text-[#FFD700]',
};

interface ToastItemProps {
  toast: ToastType;
  onRemove: (id: string) => void;
}

function ToastItem({ toast, onRemove }: ToastItemProps) {
  const Icon = toastIcons[toast.type];

  return (
    <motion.div
      variants={bounceVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      layout
      className={`
        relative overflow-hidden rounded-xl border-2 backdrop-blur-lg
        p-4 shadow-2xl min-w-[320px] max-w-[420px]
        ${toastStyles[toast.type]}
      `}
    >
      {/* Progress bar */}
      {toast.duration && toast.duration > 0 && (
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-current opacity-50"
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: toast.duration / 1000, ease: 'linear' }}
        />
      )}

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex-shrink-0 ${iconStyles[toast.type]}`}>
          <Icon className="w-6 h-6" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm">
            {toast.title}
          </p>
          {toast.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {toast.description}
            </p>
          )}

          {/* Action button */}
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="mt-2 text-sm font-medium underline hover:no-underline"
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={() => onRemove(toast.id)}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={removeToast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
